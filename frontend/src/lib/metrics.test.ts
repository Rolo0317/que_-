import { describe, expect, it } from 'vitest';
import { calculateMetrics, filterCalls, callsByHour, callsByType, agentScores, slaByHour, abandonByHour, agentDetailStats } from './metrics.js';
import type { CallRecord } from '../types/calls';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const base: Omit<CallRecord, 'id' | 'agent' | 'type' | 'abandoned' | 'score'> = {
  queue: 'Soporte',
  hour: '08:00',
  durationSeconds: 300,
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
  qaScore: 80,
};

const calls: CallRecord[] = [
  { ...base, id: '1', type: 'Inbound',  agent: 'Ana',  abandoned: false, score: 5, answeredWithinSla: true,  resolvedFirstContact: true,  transferred: false, qaScore: 90 },
  { ...base, id: '2', type: 'Outbound', agent: 'Luis', abandoned: true,  score: 3, answeredWithinSla: false, resolvedFirstContact: false, transferred: true,  qaScore: 70, hour: '09:00' },
];

const emptyCalls: CallRecord[] = [];

// ─── Filtros ──────────────────────────────────────────────────────────────────
describe('filterCalls', () => {
  it('filtra por tipo Inbound', () => expect(filterCalls(calls, 'Inbound')).toHaveLength(1));
  it('filtra por tipo Outbound', () => expect(filterCalls(calls, 'Outbound')).toHaveLength(1));
  it('devuelve todo con "Todos"', () => expect(filterCalls(calls, 'Todos')).toHaveLength(2));
  it('devuelve todo con tipo vacío', () => expect(filterCalls(calls, '')).toHaveLength(2));
});

// ─── Métricas principales ─────────────────────────────────────────────────────
describe('calculateMetrics — core', () => {
  it('cuenta registros totales', () => expect(calculateMetrics(calls).total).toBe(2));
  it('cuenta inbound', () => expect(calculateMetrics(calls).inbound).toBe(1));
  it('cuenta outbound', () => expect(calculateMetrics(calls).outbound).toBe(1));
  it('calcula tasa de abandono 50%', () => expect(calculateMetrics(calls).abandonRate).toBeCloseTo(0.5));
  it('calcula duración media', () => expect(calculateMetrics(calls).avgDuration).toBeCloseTo(300));
  it('calcula score promedio', () => expect(calculateMetrics(calls).avgScore).toBeCloseTo(4));
  it('dataset vacío devuelve ceros', () => {
    const m = calculateMetrics(emptyCalls);
    expect(m.total).toBe(0);
    expect(m.abandonRate).toBe(0);
    expect(m.occupancy).toBe(0);
    expect(m.serviceLevel).toBe(0);
  });
});

// ─── WFM ──────────────────────────────────────────────────────────────────────
describe('calculateMetrics — WFM', () => {
  it('ocupación está entre 0 y 1', () => {
    const { occupancy } = calculateMetrics(calls);
    expect(occupancy).toBeGreaterThan(0);
    expect(occupancy).toBeLessThanOrEqual(1);
  });

  it('ocupación = 0 sin availableSeconds ni durationSeconds', () => {
    const c: CallRecord[] = [{ ...calls[0], durationSeconds: 0, availableSeconds: 0 }];
    expect(calculateMetrics(c).occupancy).toBe(0);
  });

  it('utilización = productivo / login', () => {
    // loginSeconds=3600, productiveSeconds=2000 → 2000/3600 ≈ 0.5556
    const { utilization } = calculateMetrics(calls);
    expect(utilization).toBeCloseTo(2000 / 3600 * 2 / 2); // avg across both rows
  });

  it('shrinkage = shrinkage / scheduled', () => {
    const { shrinkage } = calculateMetrics(calls);
    expect(shrinkage).toBeCloseTo(100 / 3600); // 100/3600 per call
  });

  it('adherencia = adherence / scheduled', () => {
    const { adherence } = calculateMetrics(calls);
    expect(adherence).toBeCloseTo(3500 / 3600);
  });

  it('asistencia = 1 cuando todos presentes', () => {
    expect(calculateMetrics(calls).attendance).toBe(1);
  });

  it('asistencia = 0 cuando attendanceStatus = Ausente', () => {
    const absent: CallRecord[] = [{ ...calls[0], attendanceStatus: 'Ausente', staffed: false }];
    expect(calculateMetrics(absent).attendance).toBe(0);
  });
});

// ─── Operaciones ──────────────────────────────────────────────────────────────
describe('calculateMetrics — Operaciones', () => {
  it('SLA = 0.5 (1 de 2 dentro del SLA)', () => expect(calculateMetrics(calls).serviceLevel).toBeCloseTo(0.5));
  it('SLA = 1 cuando todas dentro del SLA', () => {
    const all: CallRecord[] = calls.map((c) => ({ ...c, answeredWithinSla: true }));
    expect(calculateMetrics(all).serviceLevel).toBe(1);
  });
  it('SLA = 0 cuando ninguna dentro del SLA', () => {
    const none: CallRecord[] = calls.map((c) => ({ ...c, answeredWithinSla: false }));
    expect(calculateMetrics(none).serviceLevel).toBe(0);
  });
  it('ASA = promedio de espera', () => expect(calculateMetrics(calls).avgSpeedAnswer).toBeCloseTo(10));
  it('AHT = duración media', () => expect(calculateMetrics(calls).avgDuration).toBeCloseTo(300));
});

// ─── Calidad ──────────────────────────────────────────────────────────────────
describe('calculateMetrics — Calidad', () => {
  it('FCR = 0.5 (1 de 2 resuelto en primer contacto)', () => expect(calculateMetrics(calls).firstContactResolution).toBeCloseTo(0.5));
  it('FCR = 1.0 cuando todas resueltas en primer contacto', () => {
    const all: CallRecord[] = calls.map((c) => ({ ...c, resolvedFirstContact: true }));
    expect(calculateMetrics(all).firstContactResolution).toBe(1);
  });
  it('Transferencias = 0.5 (1 de 2)', () => expect(calculateMetrics(calls).transferRate).toBeCloseTo(0.5));
  it('QA score = promedio de qaScore', () => expect(calculateMetrics(calls).avgQaScore).toBeCloseTo(80));
  it('QA score ignora filas sin qaScore', () => {
    const mixed: CallRecord[] = [{ ...calls[0], qaScore: 90 }, { ...calls[1], qaScore: 0 }];
    expect(calculateMetrics(mixed).avgQaScore).toBeCloseTo(90);
  });
});

// ─── Distribuciones ───────────────────────────────────────────────────────────
describe('callsByHour', () => {
  it('devuelve bucket por hora', () => {
    const h = callsByHour(calls);
    expect(h.length).toBe(2);
    expect(h.some((x) => x.hour === '08:00')).toBe(true);
    expect(h.some((x) => x.hour === '09:00')).toBe(true);
  });
  it('retorna array vacío con dataset vacío', () => expect(callsByHour([])).toHaveLength(0));
});

describe('callsByType', () => {
  it('devuelve tipos únicos', () => {
    const t = callsByType(calls);
    expect(t.some((x) => x.name === 'Inbound')).toBe(true);
    expect(t.some((x) => x.name === 'Outbound')).toBe(true);
  });
});

describe('agentScores', () => {
  it('devuelve score por agente', () => {
    const s = agentScores(calls);
    const ana = s.find((x) => x.agent === 'Ana');
    expect(ana?.score).toBeCloseTo(5);
  });
});

describe('slaByHour', () => {
  it('calcula SLA% por hora', () => {
    const s = slaByHour(calls);
    const h8 = s.find((x) => x.hour === '08:00');
    expect(h8?.sla).toBeCloseTo(100);
  });
});

describe('abandonByHour', () => {
  it('calcula abandono% por hora', () => {
    const a = abandonByHour(calls);
    const h9 = a.find((x) => x.hour === '09:00');
    expect(h9?.abandonRate).toBeCloseTo(100);
  });
});

// ─── agentDetailStats ─────────────────────────────────────────────────────────
describe('agentDetailStats', () => {
  it('genera stats por agente', () => {
    const stats = agentDetailStats(calls);
    expect(stats.length).toBe(2);
    const ana = stats.find((s) => s.agent === 'Ana');
    expect(ana?.totalCalls).toBe(1);
    expect(ana?.slaRate).toBe(1);
  });

  it('ordena por totalCalls desc por defecto', () => {
    const extra: CallRecord[] = [...calls, { ...calls[0], id: '3' }, { ...calls[0], id: '4' }];
    const stats = agentDetailStats(extra);
    expect(stats[0].agent).toBe('Ana'); // Ana tiene 3 llamadas
  });
});
