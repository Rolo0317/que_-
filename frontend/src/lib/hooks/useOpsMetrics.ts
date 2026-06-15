import { useMemo } from 'react';
import { calculateMetrics } from '../metrics';
import type { KpiStatus } from '../../components/KpiCard';
import type { ThresholdSet } from '../useThresholds';
import type { CallRecord } from '../../types/calls';

const fmt  = (v: number) => `${(v * 100).toFixed(2)}%`;
const fmtS = (s: number) => `${Math.round(s)} s`;

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
function secInv(v: number, g: number, w: number): KpiStatus {
  return v <= g ? 'good' : v <= w ? 'warning' : 'bad';
}

export function useOpsMetrics(calls: CallRecord[], thresholds: ThresholdSet) {
  const metrics = useMemo(() => calculateMetrics(calls), [calls]);

  const kpis = useMemo<Kpi[]>(() => {
    const t = thresholds;
    return [
      {
        label: 'Total llamadas',
        value: metrics.total,
        helper: 'Registros en el período',
        status: 'neutral',
        description: 'Número total de llamadas registradas en el período y filtros seleccionados.',
      },
      {
        label: 'Entrantes',
        value: metrics.inbound,
        helper: 'Inbound',
        status: 'neutral',
        description: 'Llamadas recibidas — clientes que contactan al call center.',
      },
      {
        label: 'Salientes',
        value: metrics.outbound,
        helper: 'Outbound',
        status: 'neutral',
        description: 'Llamadas realizadas por los agentes hacia clientes o prospectos.',
      },
      {
        label: 'SLA',
        value: fmt(metrics.serviceLevel),
        helper: 'Atendidas a tiempo',
        target: `Meta: >${(t.sla.good * 100).toFixed(0)}%`,
        status: pct(metrics.serviceLevel, t.sla.good, t.sla.warning),
        description:
          'Nivel de servicio: porcentaje de llamadas atendidas dentro del tiempo máximo de espera acordado. Si es 80%, 8 de cada 10 clientes esperaron menos del tiempo límite.',
      },
      {
        label: 'Abandono',
        value: fmt(metrics.abandonRate),
        helper: 'Clientes que colgaron',
        target: `Meta: <${(t.abandon.good * 100).toFixed(0)}%`,
        status: pctInv(metrics.abandonRate, t.abandon.good, t.abandon.warning),
        description:
          'Porcentaje de llamadas en que el cliente colgó antes de ser atendido. Mientras más bajo, mejor. Un 5% significa que 5 de cada 100 clientes se fueron sin respuesta.',
      },
      {
        label: 'Resp. promedio',
        value: fmtS(metrics.avgSpeedAnswer),
        helper: 'Espera antes de atender',
        target: `Meta: <${t.asa.good} s`,
        status: secInv(metrics.avgSpeedAnswer, t.asa.good, t.asa.warning),
        description:
          'ASA (Average Speed of Answer): tiempo promedio en segundos que espera un cliente hasta que un agente contesta. Mientras menor, mejor experiencia para el cliente.',
      },
      {
        label: 'Duración media',
        value: fmtS(metrics.avgDuration),
        helper: 'Por llamada',
        status: 'neutral',
        description:
          'AHT / TMO: duración promedio de cada llamada. Incluye el tiempo de conversación. No tiene meta fija — depende del tipo de campaña.',
      },
    ];
  }, [metrics, thresholds]);

  return { kpis, metrics };
}
