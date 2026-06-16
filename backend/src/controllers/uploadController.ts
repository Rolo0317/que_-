import { buildReport } from '../services/metricsService.js';
import { parseExcelBuffer } from '../services/excelService.js';
import { supabase } from '../lib/supabase.js';
import type { Request, Response } from 'express';
import { randomUUID } from 'crypto';

export async function uploadExcel(request: Request, response: Response) {
  if (!request.file) {
    response.status(400).json({ message: 'Archivo Excel requerido.' });
    return;
  }

  const calls = await parseExcelBuffer(request.file.buffer);
  const type = typeof request.query.type === 'string' ? request.query.type : 'Todos';
  const report = buildReport(calls, type);

  // Sync to Supabase cloud so all users see the uploaded data
  if (supabase && calls.length > 0) {
    const datasetId = randomUUID();
    const name = request.file.originalname.replace(/\.xlsx$/i, '');
    await supabase.from('datasets').upsert({
      id: datasetId,
      name,
      calls,
      call_count: calls.length,
      loaded_at: new Date().toISOString(),
      source: 'excel',
    }).then(({ error }) => {
      if (error) console.error('[supabase] upsert error:', error.message);
      else console.log(`[supabase] dataset "${name}" synced (${calls.length} calls)`);
    });
  }

  response.status(201).json(report);
}
