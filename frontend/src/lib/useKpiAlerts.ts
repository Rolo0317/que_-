import { useMemo } from 'react';
import { calculateMetrics } from './metrics';
import type { CallRecord } from '../types/calls';

export interface KpiAlerts {
  wfm: boolean;
  operaciones: boolean;
  calidad: boolean;
}

export function useKpiAlerts(calls: CallRecord[]): KpiAlerts {
  return useMemo(() => {
    if (calls.length === 0) return { wfm: false, operaciones: false, calidad: false };
    const m = calculateMetrics(calls);

    const wfm =
      !(m.occupancy >= 0.60) ||          // ocupación baja: bad
      m.utilization < 0.75 ||            // utilización baja
      m.shrinkage > 0.35 ||              // shrinkage alto
      m.adherence < 0.90 ||              // adherencia baja
      m.attendance < 0.90;               // asistencia baja

    const operaciones =
      m.serviceLevel < 0.70 ||           // SLA fuera de meta
      m.abandonRate > 0.10 ||            // abandono alto
      m.avgSpeedAnswer > 60;             // espera > 60 s

    const calidad =
      m.firstContactResolution < 0.70 || // FCR bajo
      m.transferRate > 0.20 ||           // transferencias altas
      m.avgQaScore / 100 < 0.75 ||       // QA bajo
      m.avgScore / 5 < 0.70;            // satisfacción baja

    return { wfm, operaciones, calidad };
  }, [calls]);
}
