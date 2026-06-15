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
function occupancy(v: number, min: number, max: number): KpiStatus {
  return v >= min && v <= max ? 'good' : v >= min * 0.8 ? 'warning' : 'bad';
}

export function useWfmMetrics(calls: CallRecord[], thresholds: ThresholdSet) {
  const metrics = useMemo(() => calculateMetrics(calls), [calls]);

  const kpis = useMemo<Kpi[]>(() => {
    const t = thresholds;
    return [
      {
        label: 'Ocupacion',
        value: fmt(metrics.occupancy),
        helper: 'Talk / disponible',
        target: `Meta: ${(t.occupancyMin * 100).toFixed(0)}–${(t.occupancyMax * 100).toFixed(0)}%`,
        status: occupancy(metrics.occupancy, t.occupancyMin, t.occupancyMax),
      },
      {
        label: 'Utilizacion',
        value: fmt(metrics.utilization),
        helper: 'Productivo / login',
        target: `Meta: >${(t.utilization.good * 100).toFixed(0)}%`,
        status: pct(metrics.utilization, t.utilization.good, t.utilization.warning),
      },
      {
        label: 'Shrinkage',
        value: fmt(metrics.shrinkage),
        helper: 'Fuera de produccion',
        target: `Meta: <${(t.shrinkage.good * 100).toFixed(0)}%`,
        status: pctInv(metrics.shrinkage, t.shrinkage.good, t.shrinkage.warning),
      },
      {
        label: 'Adherencia',
        value: fmt(metrics.adherence),
        helper: 'Horario plan vs real',
        target: `Meta: >${(t.adherence.good * 100).toFixed(0)}%`,
        status: pct(metrics.adherence, t.adherence.good, t.adherence.warning),
      },
      {
        label: 'Asistencia',
        value: fmt(metrics.attendance),
        helper: 'Presencia programada',
        target: `Meta: >${(t.attendance.good * 100).toFixed(0)}%`,
        status: pct(metrics.attendance, t.attendance.good, t.attendance.warning),
      },
    ];
  }, [metrics, thresholds]);

  return { kpis, metrics };
}
