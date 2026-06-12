import { describe, expect, it } from 'vitest';
import { calculateMetrics, filterCalls } from './metrics.js';

const calls = [
  { type: 'Inbound', durationSeconds: 100, abandoned: false, score: 5 },
  { type: 'Outbound', durationSeconds: 200, abandoned: true, score: 3 },
];

describe('metrics', () => {
  it('filters calls by type', () => {
    expect(filterCalls(calls, 'Inbound')).toHaveLength(1);
    expect(filterCalls(calls, 'Todos')).toHaveLength(2);
  });

  it('calculates core indicators', () => {
    const metrics = calculateMetrics(calls);

    expect(metrics.total).toBe(2);
    expect(metrics.inbound).toBe(1);
    expect(metrics.outbound).toBe(1);
    expect(metrics.abandonRate).toBe(0.5);
    expect(metrics.avgDuration).toBe(150);
    expect(metrics.avgScore).toBe(4);
  });
});
