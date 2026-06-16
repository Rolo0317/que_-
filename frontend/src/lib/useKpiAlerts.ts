import { useMemo } from 'react';
import { calculateMetrics } from './metrics';
import type { CallRecord } from '../types/calls';

export interface KpiAlerts {
  wfm: boolean;
  operaciones: boolean;
}

export function useKpiAlerts(calls: CallRecord[]): KpiAlerts {
  return useMemo(() => {
    if (calls.length === 0) return { wfm: false, operaciones: false };
    const m = calculateMetrics(calls);

    const wfm =
      !(m.occupancy >= 0.60) ||
      m.utilization < 0.75 ||
      m.shrinkage > 0.35 ||
      m.adherence < 0.90 ||
      m.attendance < 0.90;

    const operaciones =
      m.serviceLevel < 0.70 ||
      m.abandonRate > 0.10 ||
      m.avgSpeedAnswer > 60;

    return { wfm, operaciones };
  }, [calls]);
}
