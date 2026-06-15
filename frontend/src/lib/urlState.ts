export interface UrlFilters {
  type: string;
  period: string;
  pv: string;
}

export function readFiltersFromUrl(search: string): UrlFilters {
  const p = new URLSearchParams(search);
  return {
    type:   p.get('type')   ?? 'Todos',
    period: p.get('period') ?? 'todos',
    pv:     p.get('pv')     ?? '',
  };
}

export function filtersToSearch(f: UrlFilters): string {
  const p = new URLSearchParams();
  if (f.type   !== 'Todos') p.set('type',   f.type);
  if (f.period !== 'todos') p.set('period', f.period);
  if (f.pv)                 p.set('pv',     f.pv);
  const q = p.toString();
  return q ? `?${q}` : '';
}
