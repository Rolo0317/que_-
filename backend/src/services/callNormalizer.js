const columnMap = {
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

const normalizeColumn = (key) =>
  columnMap[String(key).toLowerCase().replace(/\s|_/g, '')] || String(key).trim();

const parseBoolean = (value) => value === true || ['true', 'si', 'yes', '1'].includes(String(value).toLowerCase());

export function normalizeCalls(rows) {
  return rows.map((row, index) => {
    const normalized = Object.entries(row).reduce((acc, [key, value]) => {
      acc[normalizeColumn(key)] = value;
      return acc;
    }, {});

    return {
      id: normalized.id || index + 1,
      type: normalized.type || 'Inbound',
      agent: normalized.agent || 'Sin agente',
      queue: normalized.queue || 'General',
      hour: normalized.hour || 'Sin hora',
      durationSeconds: Number(normalized.durationSeconds || 0),
      abandoned: parseBoolean(normalized.abandoned),
      score: Number(normalized.score || 0),
    };
  });
}
