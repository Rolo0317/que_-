const normalizeType = (value = '') => String(value).trim().toLowerCase();

export function filterCalls(calls, type) {
  if (!type || type === 'Todos') return calls;
  return calls.filter((call) => normalizeType(call.type) === normalizeType(type));
}

export function calculateMetrics(calls) {
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

export function buildReport(calls, type = 'Todos') {
  const filtered = filterCalls(calls, type);
  return {
    data: filtered,
    metrics: calculateMetrics(filtered),
  };
}
