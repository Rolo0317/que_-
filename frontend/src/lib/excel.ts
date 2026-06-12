import { readSheet } from 'read-excel-file/browser';
import type { CallRecord } from '../types/calls';

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

  return rows.map((row, index) => {
    const normalized = Object.entries(row).reduce<NormalizedRow>((acc, [key, value]) => {
      acc[normalizeKey(key)] = value;
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
      abandoned: normalized.abandoned === true || String(normalized.abandoned).toLowerCase() === 'true',
      answeredWithinSla:
        normalized.answeredWithinSla === true ||
        ['true', 'si', 'yes', '1'].includes(String(normalized.answeredWithinSla).toLowerCase()),
      resolvedFirstContact:
        normalized.resolvedFirstContact === true ||
        ['true', 'si', 'yes', '1'].includes(String(normalized.resolvedFirstContact).toLowerCase()),
      transferred:
        normalized.transferred === true ||
        ['true', 'si', 'yes', '1'].includes(String(normalized.transferred).toLowerCase()),
      score: Number(normalized.score || 0),
      qaScore: Number(normalized.qaScore || 0),
      scheduledSeconds: Number(normalized.scheduledSeconds || 0),
      loginSeconds: Number(normalized.loginSeconds || 0),
      productiveSeconds: Number(normalized.productiveSeconds || 0),
      availableSeconds: Number(normalized.availableSeconds || 0),
      shrinkageSeconds: Number(normalized.shrinkageSeconds || 0),
      adherenceSeconds: Number(normalized.adherenceSeconds || 0),
      scheduled:
        normalized.scheduled === undefined ||
        ['true', 'si', 'yes', '1'].includes(String(normalized.scheduled).toLowerCase()),
      staffed:
        normalized.staffed === undefined ||
        ['true', 'si', 'yes', '1'].includes(String(normalized.staffed).toLowerCase()),
      attendanceStatus: String(normalized.attendanceStatus || 'Presente'),
    };
  });
}
