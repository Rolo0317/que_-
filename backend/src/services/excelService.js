import XLSX from 'xlsx';
import { normalizeCalls } from './callNormalizer.js';

export function parseExcelBuffer(buffer) {
  const workbook = XLSX.read(buffer);
  const [sheetName] = workbook.SheetNames;
  if (!sheetName) return [];

  const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
  return normalizeCalls(rows);
}
