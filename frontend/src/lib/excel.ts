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
  abandonada: 'abandoned',
  abandoned: 'abandoned',
  calificacion: 'score',
  score: 'score',
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
      abandoned: normalized.abandoned === true || String(normalized.abandoned).toLowerCase() === 'true',
      score: Number(normalized.score || 0),
    };
  });
}
