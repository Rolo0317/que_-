import type { AgentStats } from '../types/calls';

const fs = (s: number) => `${Math.round(s)}s`;
const fp = (v: number) => `${(v * 100).toFixed(2)}%`;

export function exportAgentsToCsv(agents: AgentStats[], filename?: string): void {
  const headers = ['Agente', 'Documento', 'Llamadas', 'TMO', 'Satisfaccion', 'QA Score', 'SLA', 'FCR', 'Transferencias', 'Abandono', 'ASA'];
  const rows = agents.map((a) => [
    a.agent,
    a.documento ?? '',
    String(a.totalCalls),
    fs(a.avgDuration),
    a.avgScore.toFixed(2),
    a.avgQaScore.toFixed(1),
    fp(a.slaRate),
    fp(a.fcrRate),
    fp(a.transferRate),
    fp(a.abandonRate),
    fs(a.avgWait),
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
