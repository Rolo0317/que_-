import { buildReport } from '../services/metricsService.js';
import { parseExcelBuffer } from '../services/excelService.js';
import type { Request, Response } from 'express';

export async function uploadExcel(request: Request, response: Response) {
  if (!request.file) {
    response.status(400).json({ message: 'Archivo Excel requerido.' });
    return;
  }

  const calls = await parseExcelBuffer(request.file.buffer);
  const type = typeof request.query.type === 'string' ? request.query.type : 'Todos';
  response.status(201).json(buildReport(calls, type));
}
