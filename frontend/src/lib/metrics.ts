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
  const totalWait = calls.reduce((sum, call) => sum + Number(call.waitSeconds || 0), 0);
  const totalTalk = calls.reduce((sum, call) => sum + Number(call.durationSeconds || 0), 0);
  const totalAvailable = calls.reduce((sum, call) => sum + Number(call.availableSeconds || 0), 0);
  const totalLogin = calls.reduce((sum, call) => sum + Number(call.loginSeconds || 0), 0);
  const totalProductive = calls.reduce((sum, call) => sum + Number(call.productiveSeconds || 0), 0);
  const totalScheduled = calls.reduce((sum, call) => sum + Number(call.scheduledSeconds || 0), 0);
  const totalShrinkage = calls.reduce((sum, call) => sum + Number(call.shrinkageSeconds || 0), 0);
  const totalAdherence = calls.reduce((sum, call) => sum + Number(call.adherenceSeconds || 0), 0);
  const scheduled = calls.filter((call) => call.scheduled !== false).length;
  const present = calls.filter((call) => call.staffed !== false && call.attendanceStatus !== 'Ausente').length;
  const withinSla = calls.filter((call) => Boolean(call.answeredWithinSla)).length;
  const firstContact = calls.filter((call) => Boolean(call.resolvedFirstContact)).length;
  const transferred = calls.filter((call) => Boolean(call.transferred)).length;
  const qaRows = calls.filter((call) => Number(call.qaScore || 0) > 0);
  const totalQa = qaRows.reduce((sum, call) => sum + Number(call.qaScore || 0), 0);

  return {
    total,
    inbound,
    outbound,
    abandonRate: total ? abandoned / total : 0,
    avgDuration: total ? totalDuration / total : 0,
    avgScore: total ? totalScore / total : 0,
    occupancy: totalTalk + totalAvailable ? totalTalk / (totalTalk + totalAvailable) : 0,
    utilization: totalLogin ? totalProductive / totalLogin : 0,
    shrinkage: totalScheduled ? totalShrinkage / totalScheduled : 0,
    adherence: totalScheduled ? totalAdherence / totalScheduled : 0,
    attendance: scheduled ? present / scheduled : 0,
    serviceLevel: total ? withinSla / total : 0,
    avgSpeedAnswer: total ? totalWait / total : 0,
    firstContactResolution: total ? firstContact / total : 0,
    transferRate: total ? transferred / total : 0,
    avgQaScore: qaRows.length ? totalQa / qaRows.length : 0,
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
