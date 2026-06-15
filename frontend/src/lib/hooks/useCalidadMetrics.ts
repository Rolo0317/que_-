import { useMemo } from 'react';
import { calculateMetrics } from '../metrics';
import type { KpiStatus } from '../../components/KpiCard';
import type { ThresholdSet } from '../useThresholds';
import type { CallRecord } from '../../types/calls';

const fmt = (v: number) => `${(v * 100).toFixed(2)}%`;

type Kpi = { label: string; value: string | number; helper: string; target?: string; status: KpiStatus };

function pct(v: number, g: number, w: number): KpiStatus {
  return v >= g ? 'good' : v >= w ? 'warning' : 'bad';
}
function pctInv(v: number, g: number, w: number): KpiStatus {
  return v <= g ? 'good' : v <= w ? 'warning' : 'bad';
}

export function useCalidadMetrics(calls: CallRecord[], thresholds: ThresholdSet) {
  const metrics = useMemo(() => calculateMetrics(calls), [calls]);

  const kpis = useMemo<Kpi[]>(() => {
    const t = thresholds;
    return [
      {
        label: 'FCR',
        value: fmt(metrics.firstContactResolution),
        helper: 'Resuelto primer contacto',
        target: `Meta: >${(t.fcr.good * 100).toFixed(0)}%`,
        status: pct(metrics.firstContactResolution, t.fcr.good, t.fcr.warning),
      },
      {
        label: 'Transferencias',
        value: fmt(metrics.transferRate),
        helper: 'Derivaciones',
        target: `Meta: <${(t.transferRate.good * 100).toFixed(0)}%`,
        status: pctInv(metrics.transferRate, t.transferRate.good, t.transferRate.warning),
      },
      {
        label: 'QA Score',
        value: metrics.avgQaScore.toFixed(1),
        helper: 'Calidad (0–100)',
        target: `Meta: >${t.qaScore.good}`,
        status: pct(metrics.avgQaScore / 100, t.qaScore.good / 100, t.qaScore.warning / 100),
      },
      {
        label: 'Satisfaccion',
        value: metrics.avgScore.toFixed(2),
        helper: 'Escala 1 a 5',
        target: 'Meta: >4.0',
        status: pct(metrics.avgScore / 5, 0.80, 0.70),
      },
    ];
  }, [metrics, thresholds]);

  return { kpis, metrics };
}
