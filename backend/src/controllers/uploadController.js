import { buildReport } from '../services/metricsService.js';
import { parseExcelBuffer } from '../services/excelService.js';

export function uploadExcel(request, response) {
  if (!request.file) {
    response.status(400).json({ message: 'Archivo Excel requerido.' });
    return;
  }

  const calls = parseExcelBuffer(request.file.buffer);
  response.status(201).json(buildReport(calls, request.query.type));
}
