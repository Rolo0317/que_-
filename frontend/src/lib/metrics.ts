import type { AgentScore, CallRecord, HourlyBucket, Metrics, TypeBucket } from '../types/calls';

const normalizeType = (value = '') => String(value).trim().toLowerCase();

export function filterCalls(calls: CallRecord[], type: string): CallRecord[] {
  if (!type || type === 'Todos') return calls;
  return calls.filter((call) => normalizeType(call.type) === normalizeType(type));
}

export function calculateMetrics(calls: CallRecord[]): Metrics {
  const total = calls.length;
  const inbound = calls.filter((call) => normalizeType(call.type) === 'inbound').length;
  const outbound = calls.filter((call) => normalizeType(call.type) === 'outbound').length;
  const abandoned = calls.filter((call) => Boolean(call.abandoned)).length;
  const totalDuration = calls.reduce((sum, call) => sum + Number(call.durationSeconds || 0), 0);
  const totalScore = calls.reduce((sum, call) => sum + Number(call.score || 0), 0);

  return {
    total,
    inbound,
    outbound,
    abandonRate: total ? abandoned / total : 0,
    avgDuration: total ? totalDuration / total : 0,
    avgScore: total ? totalScore / total : 0,
  };
}

export function callsByHour(calls: CallRecord[]): HourlyBucket[] {
  const buckets = new Map<string, number>();
  calls.forEach((call) => {
    const hour = call.hour || 'Sin hora';
    buckets.set(hour, (buckets.get(hour) || 0) + 1);
  });

  return Array.from(buckets, ([hour, callsCount]) => ({ hour, calls: callsCount })).sort((a, b) =>
    a.hour.localeCompare(b.hour),
  );
}

export function callsByType(calls: CallRecord[]): TypeBucket[] {
  const buckets = calls.reduce<Record<string, number>>((acc, call) => {
    const type = call.type || 'Sin tipo';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(buckets).map(([name, value]) => ({ name, value }));
}

export function agentScores(calls: CallRecord[]): AgentScore[] {
  const buckets = new Map<string, { agent: string; total: number; count: number }>();
  calls.forEach((call) => {
    const agent = call.agent || 'Sin agente';
    const current = buckets.get(agent) || { agent, total: 0, count: 0 };
    current.total += Number(call.score || 0);
    current.count += 1;
    buckets.set(agent, current);
  });

  return Array.from(buckets.values()).map(({ agent, total, count }) => ({
    agent,
    score: count ? Number((total / count).toFixed(2)) : 0,
  }));
}
