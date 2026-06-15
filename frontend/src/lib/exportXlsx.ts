import { calculateMetrics } from './metrics';
import type { AgentStats, CallRecord } from '../types/calls';

const fp = (v: number) => `${(v * 100).toFixed(2)}%`;
const fs = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

export interface ExportOptions {
  datasetName: string;
  calls: CallRecord[];
  agentStats: AgentStats[];
  filters: string;
}

export async function exportDashboardToXlsx({
  datasetName, calls, agentStats, filters,
}: ExportOptions): Promise<void> {
  const XLSX = await import('xlsx');
  const metrics = calculateMetrics(calls);
  const now = new Date();
  const dateStr = now.toLocaleDateString('es-CO', { dateStyle: 'long' });
  const wb = XLSX.utils.book_new();

  // ── Sheet 1: Resumen KPIs ────────────────────────────────────────────────
  const resumenData = [
    ['QUE+ · Informe de indicadores'],
    ['Fuente de datos', datasetName],
    ['Generado el',     dateStr],
    ['Filtros activos', filters],
    [],
    ['Indicador',                      'Valor',                                    'Meta'],
    ['Total llamadas',                 metrics.total,                               '—'],
    ['Entrantes (Inbound)',             metrics.inbound,                             '—'],
    ['Salientes (Outbound)',            metrics.outbound,                            '—'],
    ['SLA',                            fp(metrics.serviceLevel),                   '>80%'],
    ['Abandono',                       fp(metrics.abandonRate),                    '<5%'],
    ['Respuesta promedio (ASA)',        fs(metrics.avgSpeedAnswer),                 '<30s'],
    ['Duración media (AHT)',           fs(metrics.avgDuration),                    '—'],
    ['Score promedio',                 metrics.avgScore.toFixed(2),                '>4.0'],
    ['QA Score',                       metrics.avgQaScore.toFixed(1),              '>85'],
    ['Primer contacto (FCR)',          fp(metrics.firstContactResolution),         '>75%'],
    ['Transferencias',                 fp(metrics.transferRate),                   '<10%'],
    ['Ocupación',                      fp(metrics.occupancy),                      '75–90%'],
    ['Utilización',                    fp(metrics.utilization),                    '>80%'],
    ['Tiempo improductivo (Shrinkage)',fp(metrics.shrinkage),                      '<15%'],
    ['Adherencia',                     fp(metrics.adherence),                      '>95%'],
    ['Asistencia',                     fp(metrics.attendance),                     '>95%'],
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(resumenData);
  ws1['!cols'] = [{ wch: 34 }, { wch: 20 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen KPIs');

  // ── Sheet 2: Por agente ──────────────────────────────────────────────────
  const agentHeaders = [
    'Agente', 'Documento', 'Llamadas', 'Score', 'QA', 'SLA', 'FCR',
    'Transferencias', 'Abandono', 'AHT', 'Espera (ASA)',
  ];
  const agentRows = agentStats.map((a) => [
    a.agent,
    a.documento ?? '',
    a.totalCalls,
    a.avgScore.toFixed(2),
    a.avgQaScore.toFixed(1),
    fp(a.slaRate),
    fp(a.fcrRate),
    fp(a.transferRate),
    fp(a.abandonRate),
    fs(a.avgDuration),
    fs(a.avgWait),
  ]);
  const ws2 = XLSX.utils.aoa_to_sheet([agentHeaders, ...agentRows]);
  ws2['!cols'] = [
    { wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 8 }, { wch: 8 },
    { wch: 8 }, { wch: 8 }, { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 13 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, 'Por agente');

  // ── Sheet 3: Registros filtrados ─────────────────────────────────────────
  const callHeaders = [
    'ID', 'Fecha', 'Hora', 'Agente', 'Documento', 'Cola', 'Tipo',
    'Duración (s)', 'Espera (s)', 'Abandonada', 'SLA', 'FCR', 'Transferida',
    'Score', 'QA Score',
  ];
  const callRows = calls.map((c) => [
    c.id,
    c.date ?? '',
    c.hour ?? '',
    c.agent,
    c.documento ?? '',
    c.queue,
    c.type,
    c.durationSeconds,
    c.waitSeconds ?? 0,
    c.abandoned          ? 'Sí' : 'No',
    c.answeredWithinSla  ? 'Sí' : 'No',
    c.resolvedFirstContact ? 'Sí' : 'No',
    c.transferred        ? 'Sí' : 'No',
    c.score,
    c.qaScore ?? '',
  ]);
  const ws3 = XLSX.utils.aoa_to_sheet([callHeaders, ...callRows]);
  ws3['!cols'] = Array(callHeaders.length).fill({ wch: 14 });
  XLSX.utils.book_append_sheet(wb, ws3, 'Registros');

  const filename = `QUE+_informe_${now.toISOString().slice(0, 10)}.xlsx`;
  XLSX.writeFile(wb, filename);
}
