import { formatDuration, formatPct } from './format';
import type { AgentStats } from '../types/calls';

export function exportAgentsToCsv(agents: AgentStats[], filename?: string): void {
  const headers = ['Agente', 'Documento', 'Llamadas', 'TMO', 'Satisfaccion', 'QA Score', 'SLA', 'FCR', 'Transferencias', 'Abandono', 'ASA'];
  const rows = agents.map((a) => [
    a.agent,
    a.documento ?? '',
    String(a.totalCalls),
    formatDuration(a.avgDuration),
    a.avgScore.toFixed(2),
    a.avgQaScore.toFixed(1),
    formatPct(a.slaRate),
    formatPct(a.fcrRate),
    formatPct(a.transferRate),
    formatPct(a.abandonRate),
    formatDuration(a.avgWait),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? `agentes_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
