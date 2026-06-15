import { useState } from 'react';

export interface ThresholdSet {
  sla:          { good: number; warning: number };
  abandon:      { good: number; warning: number };
  occupancyMin: number;
  occupancyMax: number;
  fcr:          { good: number; warning: number };
  asa:          { good: number; warning: number };
  utilization:  { good: number; warning: number };
  shrinkage:    { good: number; warning: number };
  adherence:    { good: number; warning: number };
  attendance:   { good: number; warning: number };
  transferRate: { good: number; warning: number };
  qaScore:      { good: number; warning: number };
}

export const DEFAULT_THRESHOLDS: ThresholdSet = {
  sla:          { good: 0.80, warning: 0.70 },
  abandon:      { good: 0.05, warning: 0.10 },
  occupancyMin: 0.75,
  occupancyMax: 0.90,
  fcr:          { good: 0.80, warning: 0.70 },
  asa:          { good: 30,   warning: 60 },
  utilization:  { good: 0.85, warning: 0.75 },
  shrinkage:    { good: 0.25, warning: 0.35 },
  adherence:    { good: 0.95, warning: 0.90 },
  attendance:   { good: 0.95, warning: 0.90 },
  transferRate: { good: 0.10, warning: 0.20 },
  qaScore:      { good: 85,   warning: 75 },
};

const KEY = 'que-thresholds';

function load(): ThresholdSet {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT_THRESHOLDS, ...JSON.parse(raw) } : DEFAULT_THRESHOLDS;
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

export function useThresholds() {
  const [thresholds, setThresholds] = useState<ThresholdSet>(load);

  function update(patch: Partial<ThresholdSet>) {
    setThresholds((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }

  function reset() {
    localStorage.removeItem(KEY);
    setThresholds(DEFAULT_THRESHOLDS);
  }

  return { thresholds, update, reset };
}
