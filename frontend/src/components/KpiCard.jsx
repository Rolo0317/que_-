export function KpiCard({ label, value, helper }) {
  return (
    <article className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{helper}</p>
    </article>
  );
}
