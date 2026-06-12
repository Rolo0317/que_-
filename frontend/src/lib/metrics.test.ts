import { describe, expect, it } from 'vitest';
import { calculateMetrics, filterCalls, callsByHour, callsByType, agentScores } from './metrics.js';
import type { CallRecord } from '../types/calls';

const calls: CallRecord[] = [
  {
    id: '1',
    type: 'Inbound',
    agent: 'Ana',
    queue: 'Soporte',
    hour: '08:00',
    durationSeconds: 300,
    abandoned: false,
    score: 5,
    date: '2024-01-01',
    waitSeconds: 10,
    availableSeconds: 500,
    loginSeconds: 3600,
    productiveSeconds: 2000,
    scheduledSeconds: 3600,
    shrinkageSeconds: 100,
    adherenceSeconds: 3500,
    scheduled: true,
    staffed: true,
    attendanceStatus: 'Presente',
    answeredWithinSla: true,
    resolvedFirstContact: true,
    transferred: false,
    qaScore: 4.5,
  },
  {
    id: '2',
    type: 'Outbound',
    agent: 'Luis',
    queue: 'Ventas',
    hour: '09:00',
    durationSeconds: 180,
    abandoned: true,
    score: 3,
    date: '2024-01-01',
    waitSeconds: 5,
    availableSeconds: 400,
    loginSeconds: 3600,
    productiveSeconds: 1500,
    scheduledSeconds: 3600,
    shrinkageSeconds: 150,
    adherenceSeconds: 3450,
    scheduled: true,
    staffed: true,
    attendanceStatus: 'Presente',
    answeredWithinSla: false,
    resolvedFirstContact: false,
    transferred: true,
    qaScore: 2.5,
  },
];

describe('Metrics - Indicadores WFM', () => {
  it('filters calls by type', () => {
    expect(filterCalls(calls, 'Inbound')).toHaveLength(1);
    expect(filterCalls(calls, 'Outbound')).toHaveLength(1);
    expect(filterCalls(calls, 'Todos')).toHaveLength(2);
  });

  it('calculates core indicators', () => {
    const metrics = calculateMetrics(calls);

    expect(metrics.total).toBe(2);
    expect(metrics.inbound).toBe(1);
    expect(metrics.outbound).toBe(1);
    expect(metrics.abandonRate).toBeCloseTo(0.5);
    expect(metrics.avgDuration).toBeCloseTo(240);
    expect(metrics.avgScore).toBeCloseTo(4);
  });

  it('calculates WFM occupancy (Ocupación)', () => {
    const metrics = calculateMetrics(calls);
    expect(metrics.occupancy).toBeGreaterThan(0);
    expect(metrics.occupancy).toBeLessThanOrEqual(1);
  });

  it('calculates WFM utilization (Utilización)', () => {
    const metrics = calculateMetrics(calls);
    expect(metrics.utilization).toBeGreaterThan(0);
    expect(metrics.utilization).toBeLessThanOrEqual(1);
  });

  it('calculates WFM shrinkage (Shrinkage)', () => {
    const metrics = calculateMetrics(calls);
    expect(metrics.shrinkage).toBeGreaterThan(0);
    expect(metrics.shrinkage).toBeLessThanOrEqual(1);
  });

  it('calculates WFM adherence (Adherencia)', () => {
    const metrics = calculateMetrics(calls);
    expect(metrics.adherence).toBeGreaterThan(0);
    expect(metrics.adherence).toBeLessThanOrEqual(1);
  });

  it('calculates attendance rate (Asistencia)', () => {
    const metrics = calculateMetrics(calls);
    expect(metrics.attendance).toBe(1); // All staff present
  });

  it('calculates service level (SLA)', () => {
    const metrics = calculateMetrics(calls);
    expect(metrics.serviceLevel).toBeCloseTo(0.5); // 1 out of 2 answered within SLA
  });

  it('calculates first contact resolution (FCR)', () => {
    const metrics = calculateMetrics(calls);
    expect(metrics.firstContactResolution).toBeCloseTo(0.5); // 1 out of 2
  });

  it('calculates transfer rate', () => {
    const metrics = calculateMetrics(calls);
    expect(metrics.transferRate).toBeCloseTo(0.5); // 1 out of 2
  });

  it('calculates average quality score (QA)', () => {
    const metrics = calculateMetrics(calls);
    expect(metrics.avgQaScore).toBeCloseTo(3.5); // (4.5 + 2.5) / 2
  });

  it('returns hourly distribution', () => {
    const hourly = callsByHour(calls);
    expect(hourly.length).toBeGreaterThan(0);
    expect(hourly.some(h => h.hour === '08:00')).toBe(true);
    expect(hourly.some(h => h.hour === '09:00')).toBe(true);
  });

  it('returns type distribution', () => {
    const byType = callsByType(calls);
    expect(byType.length).toBe(2);
    expect(byType.some(t => t.name === 'Inbound')).toBe(true);
    expect(byType.some(t => t.name === 'Outbound')).toBe(true);
  });

  it('returns agent performance scores', () => {
    const scores = agentScores(calls);
    expect(scores.length).toBe(2);
    expect(scores.some(s => s.agent === 'Ana')).toBe(true);
    expect(scores.some(s => s.agent === 'Luis')).toBe(true);
  });

  it('handles empty calls array gracefully', () => {
    const metrics = calculateMetrics([]);
    expect(metrics.total).toBe(0);
    expect(metrics.inbound).toBe(0);
    expect(metrics.outbound).toBe(0);
    expect(metrics.abandonRate).toBe(0);
    expect(metrics.avgDuration).toBe(0);
    expect(metrics.occupancy).toBe(0);
  });
});

