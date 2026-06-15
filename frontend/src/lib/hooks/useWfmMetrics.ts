import { useMemo } from 'react';
import { calculateMetrics } from '../metrics';
import type { KpiStatus } from '../../components/KpiCard';
import type { ThresholdSet } from '../useThresholds';
import type { CallRecord } from '../../types/calls';

const fmt = (v: number) => `${(v * 100).toFixed(2)}%`;

type Kpi = {
  label: string; value: string | number; helper: string;
  target?: string; status: KpiStatus; description?: string;
};

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
        label: 'Ocupación',
        value: fmt(metrics.occupancy),
        helper: 'Tiempo en llamadas',
        target: `Meta: ${(t.occupancyMin * 100).toFixed(0)}–${(t.occupancyMax * 100).toFixed(0)}%`,
        status: occupancy(metrics.occupancy, t.occupancyMin, t.occupancyMax),
        description:
          'Porcentaje del tiempo disponible que el agente está atendiendo llamadas activamente. Un rango entre 75–90% es saludable; por encima se genera sobrecarga.',
      },
      {
        label: 'Utilización',
        value: fmt(metrics.utilization),
        helper: 'Tiempo productivo',
        target: `Meta: >${(t.utilization.good * 100).toFixed(0)}%`,
        status: pct(metrics.utilization, t.utilization.good, t.utilization.warning),
        description:
          'Del total de tiempo que el agente estuvo conectado, cuánto fue productivo (llamadas + documentación). Mientras mayor, más eficiente el uso del tiempo pagado.',
      },
      {
        label: 'Tiempo improductivo',
        value: fmt(metrics.shrinkage),
        helper: 'Shrinkage',
        target: `Meta: <${(t.shrinkage.good * 100).toFixed(0)}%`,
        status: pctInv(metrics.shrinkage, t.shrinkage.good, t.shrinkage.warning),
        description:
          'Shrinkage: porcentaje del tiempo de trabajo que los agentes NO están disponibles (pausas, capacitaciones, ausencias, incapacidades). Mientras menor, mejor.',
      },
      {
        label: 'Adherencia',
        value: fmt(metrics.adherence),
        helper: 'Cumplimiento del horario',
        target: `Meta: >${(t.adherence.good * 100).toFixed(0)}%`,
        status: pct(metrics.adherence, t.adherence.good, t.adherence.warning),
        description:
          'Qué tan bien cumple el agente con su horario programado. Un 95% significa que respetó el 95% de su turno — llegó a tiempo, tomó pausas cuando correspondía, etc.',
      },
      {
        label: 'Asistencia',
        value: fmt(metrics.attendance),
        helper: 'Presencia vs. programado',
        target: `Meta: >${(t.attendance.good * 100).toFixed(0)}%`,
        status: pct(metrics.attendance, t.attendance.good, t.attendance.warning),
        description:
          'Porcentaje de agentes que asistieron de los que estaban programados para trabajar ese período. Ausencias no justificadas bajan este indicador.',
      },
    ];
  }, [metrics, thresholds]);

  return { kpis, metrics };
}
