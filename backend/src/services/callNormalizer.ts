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
  abandonada: 'abandoned',
  abandoned: 'abandoned',
  calificacion: 'score',
  score: 'score',
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
      abandoned: parseBoolean(normalized.abandoned),
      score: Number(normalized.score || 0),
    };
  });
}
