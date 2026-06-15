import { readSheet } from 'read-excel-file/browser';
import type { CallRecord } from '../types/calls';

const columnMap: Record<string, keyof CallRecord> = {
  // ── Columnas propias ──────────────────────────────────────────────────────
  id: 'id',
  fecha: 'date',
  date: 'date',
  tipo: 'type',
  type: 'type',
  agente: 'agent',
  agent: 'agent',
  documento: 'documento',
  document: 'documento',
  cedula: 'documento',
  identificacion: 'documento',
  nit: 'documento',
  cola: 'queue',
  queue: 'queue',
  hora: 'hour',
  hour: 'hour',
  duracion: 'durationSeconds',
  durationseconds: 'durationSeconds',
  espera: 'waitSeconds',
  waitseconds: 'waitSeconds',
  abandonada: 'abandoned',
  abandoned: 'abandoned',
  sla: 'answeredWithinSla',
  answeredwithinsla: 'answeredWithinSla',
  fcr: 'resolvedFirstContact',
  resolvedfirstcontact: 'resolvedFirstContact',
  transferida: 'transferred',
  transferred: 'transferred',
  calificacion: 'score',
  score: 'score',
  calidad: 'qaScore',
  qascore: 'qaScore',
  programado: 'scheduledSeconds',
  scheduledseconds: 'scheduledSeconds',
  login: 'loginSeconds',
  loginseconds: 'loginSeconds',
  productivo: 'productiveSeconds',
  productiveseconds: 'productiveSeconds',
  disponible: 'availableSeconds',
  availableseconds: 'availableSeconds',
  shrinkage: 'shrinkageSeconds',
  shrinkageseconds: 'shrinkageSeconds',
  adherencia: 'adherenceSeconds',
  adherenceseconds: 'adherenceSeconds',
  planificado: 'scheduled',
  scheduled: 'scheduled',
  conectado: 'staffed',
  staffed: 'staffed',
  asistencia: 'attendanceStatus',
  attendancestatus: 'attendanceStatus',
  // ── Columnas Vicidial (vicidial_log / vicidial_closer_log) ───────────────
  uniqueid: 'id',           // vicidial_log.uniqueid
  callid: 'id',
  user: 'agent',            // vicidial_log.user  (login del agente)
  usuario: 'agent',
  campaignid: 'queue',      // vicidial_log.campaign_id
  campaign_id: 'queue',
  listid: 'queue',          // vicidial_log.list_id (fallback)
  list_id: 'queue',
  lengthinsec: 'durationSeconds',   // vicidial_log.length_in_sec
  length_in_sec: 'durationSeconds',
  talksec: 'durationSeconds',       // vicidial_agent_log.talk_sec
  talk_sec: 'durationSeconds',
  queueseconds: 'waitSeconds',      // vicidial_log.queue_seconds
  queue_seconds: 'waitSeconds',
  waitsec: 'availableSeconds',      // vicidial_agent_log.wait_sec (entre llamadas)
  wait_sec: 'availableSeconds',
  pausesec: 'shrinkageSeconds',     // vicidial_agent_log.pause_sec (BREAK/LUNCH/TRAIN)
  pause_sec: 'shrinkageSeconds',
  loginsec: 'loginSeconds',         // vicidial_agent_log.login_sec
  login_sec: 'loginSeconds',
  disposec: 'productiveSeconds',    // vicidial_agent_log.dispo_sec
  dispo_sec: 'productiveSeconds',
};

// Vicidial raw columns that need special handling (not mapped via columnMap)
const VICIDIAL_RAW_KEYS = new Set(['calldate', 'call_date', 'eventtime', 'event_time', 'status', 'estado']);

const normalizeKey = (key: string): string => {
  const k = String(key).toLowerCase().replace(/\s|_/g, '');
  if (VICIDIAL_RAW_KEYS.has(k) || VICIDIAL_RAW_KEYS.has(String(key).toLowerCase())) return `__vici_${k}`;
  return columnMap[k] || String(key).trim();
};

// Map Vicidial status code → call fields
function applyVicidialStatus(status: string, queue: string): {
  type?: string; abandoned?: boolean; answeredWithinSla?: boolean; transferred?: boolean; resolvedFirstContact?: boolean;
} {
  const s = status.trim().toUpperCase();
  const q = queue.toUpperCase();
  const isInbound = q.endsWith('_IN') || q.includes('INBOUND') || q.includes('CLOSER') || q.includes('SUPPORT') || q.includes('SOPORTE');
  return {
    type:                 isInbound ? 'Inbound' : 'Outbound',
    abandoned:            s === 'AB',
    answeredWithinSla:    ['A', 'SALE', 'CLOSER', 'DC', 'DNC'].includes(s),
    transferred:          s === 'CLOSER',
    resolvedFirstContact: ['SALE', 'A', 'DC'].includes(s),
  };
}

interface ExcelRow {
  [key: string]: unknown;
}

type NormalizedRow = Record<string, unknown>;

export async function parseExcelFile(file: File): Promise<CallRecord[]> {
  const [headerRow = [], ...bodyRows] = await readSheet(file);
  const headers = headerRow.map((value) => String(value || ''));
  const rows = bodyRows.map((values) =>
    headers.reduce<ExcelRow>((acc, header, index) => {
      acc[header] = values[index] ?? '';
      return acc;
    }, {}),
  );

  const valid: CallRecord[] = [];

  rows.forEach((row, index) => {
    const normalized = Object.entries(row).reduce<NormalizedRow>((acc, [key, value]) => {
      acc[normalizeKey(key)] = value;
      return acc;
    }, {});

    const parseBool = (v: unknown, fallback?: boolean): boolean | undefined => {
      if (v === undefined || v === null || v === '') return fallback;
      if (typeof v === 'boolean') return v;
      return ['true', 'si', 'yes', '1'].includes(String(v).toLowerCase());
    };

    // ── Vicidial: call_date / event_time → date + hour ──────────────────────
    const vicidialDateTime = normalized['__vici_calldate'] ?? normalized['__vici_call_date']
      ?? normalized['__vici_eventtime'] ?? normalized['__vici_event_time'];
    let vicidialDate: string | undefined;
    let vicidialHour: string | undefined;
    if (vicidialDateTime) {
      const dt = String(vicidialDateTime);
      // Format: "2026-06-10 14:23:45" or "2026-06-10T14:23:45"
      const m = dt.match(/^(\d{4}-\d{2}-\d{2})[T\s](\d{2})/);
      if (m) { vicidialDate = m[1]; vicidialHour = `${m[2]}:00`; }
    }

    // ── Vicidial: status → multi-field mapping ───────────────────────────────
    const vicidialStatus = normalized['__vici_status'] ?? normalized['__vici_estado'];
    const queueRaw = String(normalized.queue || '');
    const statusFields = vicidialStatus
      ? applyVicidialStatus(String(vicidialStatus), queueRaw)
      : {};

    const raw = {
      id: String(normalized.id || index + 1),
      date: vicidialDate ?? (normalized.date ? String(normalized.date) : undefined),
      type: statusFields.type ?? String(normalized.type || 'Inbound'),
      agent: String(normalized.agent || 'Sin agente'),
      documento: normalized.documento ? String(normalized.documento) : undefined,
      queue: queueRaw || 'General',
      hour: vicidialHour ?? String(normalized.hour || 'Sin hora'),
      durationSeconds: Number(normalized.durationSeconds || 0),
      waitSeconds: Number(normalized.waitSeconds || 0),
      abandoned: parseBool(normalized.abandoned, false) ?? false,
      answeredWithinSla: parseBool(normalized.answeredWithinSla),
      resolvedFirstContact: parseBool(normalized.resolvedFirstContact),
      transferred: parseBool(normalized.transferred),
      score: Number(normalized.score || 0),
      qaScore: Number(normalized.qaScore || 0) || undefined,
      scheduledSeconds: Number(normalized.scheduledSeconds || 0) || undefined,
      loginSeconds: Number(normalized.loginSeconds || 0) || undefined,
      productiveSeconds: Number(normalized.productiveSeconds || 0) || undefined,
      availableSeconds: Number(normalized.availableSeconds || 0) || undefined,
      shrinkageSeconds: Number(normalized.shrinkageSeconds || 0) || undefined,
      adherenceSeconds: Number(normalized.adherenceSeconds || 0) || undefined,
      scheduled: normalized.scheduled === undefined ? true : parseBool(normalized.scheduled, true),
      staffed: normalized.staffed === undefined ? true : parseBool(normalized.staffed, true),
      attendanceStatus: String(normalized.attendanceStatus || 'Presente'),
    };

    // Import schema lazily to avoid adding zod to main bundle
    import('./schema').then(({ CallRecordSchema }) => {
      const result = CallRecordSchema.safeParse(raw);
      if (!result.success) {
        console.warn(`[Excel] Fila ${index + 1} inválida:`, result.error.flatten().fieldErrors);
      }
    }).catch(() => { /* zod optional */ });

    valid.push(raw as CallRecord);
  });

  return valid;
}
