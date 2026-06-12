import * as XLSX from 'xlsx';

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

const normalizeKey = (key) =>
  columnMap[String(key).toLowerCase().replace(/\s|_/g, '')] || String(key).trim();

export async function parseExcelFile(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer);
  const [sheetName] = workbook.SheetNames;
  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

  return rows.map((row, index) => {
    const normalized = Object.entries(row).reduce((acc, [key, value]) => {
      acc[normalizeKey(key)] = value;
      return acc;
    }, {});

    return {
      id: normalized.id || index + 1,
      type: normalized.type || 'Inbound',
      agent: normalized.agent || 'Sin agente',
      queue: normalized.queue || 'General',
      hour: normalized.hour || 'Sin hora',
      durationSeconds: Number(normalized.durationSeconds || 0),
      abandoned: normalized.abandoned === true || String(normalized.abandoned).toLowerCase() === 'true',
      score: Number(normalized.score || 0),
    };
  });
}
