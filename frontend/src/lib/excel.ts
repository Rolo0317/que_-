import { readSheet } from 'read-excel-file/browser';
import type { CallRecord } from '../types/calls';

const columnMap: Record<string, keyof CallRecord> = {
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
};

const normalizeKey = (key: string): string =>
  columnMap[String(key).toLowerCase().replace(/\s|_/g, '')] || String(key).trim();

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

    const raw = {
      id: String(normalized.id || index + 1),
      date: normalized.date ? String(normalized.date) : undefined,
      type: String(normalized.type || 'Inbound'),
      agent: String(normalized.agent || 'Sin agente'),
      documento: normalized.documento ? String(normalized.documento) : undefined,
      queue: String(normalized.queue || 'General'),
      hour: String(normalized.hour || 'Sin hora'),
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
