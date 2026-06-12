import { readSheet } from 'read-excel-file/node';
import { normalizeCalls } from './callNormalizer.js';
import type { CallRecord } from '../types/calls.js';

type ExcelRow = Record<string, unknown>;

export async function parseExcelBuffer(buffer: Buffer): Promise<CallRecord[]> {
  const [headerRow = [], ...bodyRows] = await readSheet(buffer);
  const headers = headerRow.map((value) => String(value || ''));
  const rows = bodyRows.map((values) =>
    headers.reduce<ExcelRow>((acc, header, index) => {
      acc[header] = values[index] ?? '';
      return acc;
    }, {}),
  );

  return normalizeCalls(rows);
}
