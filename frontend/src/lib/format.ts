export function formatPct(v: number, decimals = 2): string {
  return `${(v * 100).toFixed(decimals)}%`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}
