import { useMemo } from 'react';
import { calculateMetrics } from '../metrics';
import type { KpiStatus } from '../../components/KpiCard';
import type { ThresholdSet } from '../useThresholds';
import type { CallRecord } from '../../types/calls';

const fmt  = (v: number) => `${(v * 100).toFixed(2)}%`;
const fmtS = (s: number) => `${Math.round(s)} s`;

type Kpi = { label: string; value: string | number; helper: string; target?: string; status: KpiStatus };

function pct(v: number, g: number, w: number): KpiStatus {
  return v >= g ? 'good' : v >= w ? 'warning' : 'bad';
}
function pctInv(v: number, g: number, w: number): KpiStatus {
  return v <= g ? 'good' : v <= w ? 'warning' : 'bad';
}
function secInv(v: number, g: number, w: number): KpiStatus {
  return v <= g ? 'good' : v <= w ? 'warning' : 'bad';
}

export function useOpsMetrics(calls: CallRecord[], thresholds: ThresholdSet) {
  const metrics = useMemo(() => calculateMetrics(calls), [calls]);

  const kpis = useMemo<Kpi[]>(() => {
    const t = thresholds;
    return [
      { label: 'Total llamadas', value: metrics.total,                 helper: 'Registros filtrados',  status: 'neutral' },
      { label: 'Inbound',        value: metrics.inbound,               helper: 'Entrantes',            status: 'neutral' },
      { label: 'Outbound',       value: metrics.outbound,              helper: 'Salientes',            status: 'neutral' },
      {
        label: 'SLA',
        value: fmt(metrics.serviceLevel),
        helper: 'Contestadas a tiempo',
        target: `Meta: >${(t.sla.good * 100).toFixed(0)}%`,
        status: pct(metrics.serviceLevel, t.sla.good, t.sla.warning),
      },
      {
        label: 'Abandono',
        value: fmt(metrics.abandonRate),
        helper: 'Sobre total',
        target: `Meta: <${(t.abandon.good * 100).toFixed(0)}%`,
        status: pctInv(metrics.abandonRate, t.abandon.good, t.abandon.warning),
      },
      {
        label: 'ASA',
        value: fmtS(metrics.avgSpeedAnswer),
        helper: 'Espera promedio',
        target: `Meta: <${t.asa.good} s`,
        status: secInv(metrics.avgSpeedAnswer, t.asa.good, t.asa.warning),
      },
      { label: 'AHT / TMO', value: fmtS(metrics.avgDuration), helper: 'Duracion media', status: 'neutral' },
    ];
  }, [metrics, thresholds]);

  return { kpis, metrics };
}
