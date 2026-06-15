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

export function useCalidadMetrics(calls: CallRecord[], thresholds: ThresholdSet) {
  const metrics = useMemo(() => calculateMetrics(calls), [calls]);

  const kpis = useMemo<Kpi[]>(() => {
    const t = thresholds;
    return [
      {
        label: 'Primer contacto (FCR)',
        value: fmt(metrics.firstContactResolution),
        helper: 'Sin necesidad de rellamar',
        target: `Meta: >${(t.fcr.good * 100).toFixed(0)}%`,
        status: pct(metrics.firstContactResolution, t.fcr.good, t.fcr.warning),
        description:
          'FCR (First Contact Resolution): porcentaje de casos que el cliente resolvió en una sola llamada, sin necesidad de volver a llamar. Mientras mayor, mejor experiencia.',
      },
      {
        label: 'Transferencias',
        value: fmt(metrics.transferRate),
        helper: 'Llamadas redirigidas',
        target: `Meta: <${(t.transferRate.good * 100).toFixed(0)}%`,
        status: pctInv(metrics.transferRate, t.transferRate.good, t.transferRate.warning),
        description:
          'Porcentaje de llamadas que el agente tuvo que transferir a otro agente o área porque no pudo resolverla. Mientras menor, mejor competencia del equipo.',
      },
      {
        label: 'Calidad (QA)',
        value: metrics.avgQaScore.toFixed(1),
        helper: 'Puntaje de monitoreo (0–100)',
        target: `Meta: >${t.qaScore.good}`,
        status: pct(metrics.avgQaScore / 100, t.qaScore.good / 100, t.qaScore.warning / 100),
        description:
          'Puntaje promedio asignado por el equipo de calidad al escuchar llamadas grabadas. Evalúa protocolo, resolución, trato al cliente y cumplimiento de guión.',
      },
      {
        label: 'Satisfacción',
        value: metrics.avgScore.toFixed(2),
        helper: 'Calificación del cliente (1–5)',
        target: 'Meta: >4.0',
        status: pct(metrics.avgScore / 5, 0.80, 0.70),
        description:
          'Promedio de la calificación que los clientes dan después de la llamada, en una escala de 1 a 5 estrellas. Un 4.0 equivale a 80% de satisfacción.',
      },
    ];
  }, [metrics, thresholds]);

  return { kpis, metrics };
}
