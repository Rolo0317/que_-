import type { CallRecord } from '../types/calls.js';

const columnMap: Record<string, keyof CallRecord> = {
  tipo: 'type',
  type: 'type',
  agente: 'agent',
  agent: 'agent',
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

type RawRow = Record<string, unknown>;
type NormalizedRow = Record<string, unknown>;

const normalizeColumn = (key: string): string =>
  columnMap[String(key).toLowerCase().replace(/\s|_/g, '')] || String(key).trim();

const parseBoolean = (value: unknown) =>
  value === true || ['true', 'si', 'yes', '1'].includes(String(value).toLowerCase());

export function normalizeCalls(rows: RawRow[]): CallRecord[] {
  return rows.map((row, index) => {
    const normalized = Object.entries(row).reduce<NormalizedRow>((acc, [key, value]) => {
      acc[normalizeColumn(key)] = value;
      return acc;
    }, {});

    return {
      id: String(normalized.id || index + 1),
      type: String(normalized.type || 'Inbound'),
      agent: String(normalized.agent || 'Sin agente'),
      queue: String(normalized.queue || 'General'),
      hour: String(normalized.hour || 'Sin hora'),
      durationSeconds: Number(normalized.durationSeconds || 0),
      waitSeconds: Number(normalized.waitSeconds || 0),
      abandoned: parseBoolean(normalized.abandoned),
      answeredWithinSla: parseBoolean(normalized.answeredWithinSla),
      resolvedFirstContact: parseBoolean(normalized.resolvedFirstContact),
      transferred: parseBoolean(normalized.transferred),
      score: Number(normalized.score || 0),
      qaScore: Number(normalized.qaScore || 0),
      scheduledSeconds: Number(normalized.scheduledSeconds || 0),
      loginSeconds: Number(normalized.loginSeconds || 0),
      productiveSeconds: Number(normalized.productiveSeconds || 0),
      availableSeconds: Number(normalized.availableSeconds || 0),
      shrinkageSeconds: Number(normalized.shrinkageSeconds || 0),
      adherenceSeconds: Number(normalized.adherenceSeconds || 0),
      scheduled: normalized.scheduled === undefined || parseBoolean(normalized.scheduled),
      staffed: normalized.staffed === undefined || parseBoolean(normalized.staffed),
      attendanceStatus: String(normalized.attendanceStatus || 'Presente'),
    };
  });
}
