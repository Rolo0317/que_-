import { lazy, Suspense } from 'react';
import { BarChart3 } from 'lucide-react';
import { KpiCard } from './KpiCard';
import { ModuleErrorBoundary } from './ModuleErrorBoundary';
import { ReportBuilder } from './ReportBuilder';
import { useCalidadMetrics } from '../lib/hooks/useCalidadMetrics';
import type { ThresholdSet } from '../lib/useThresholds';
import type { ChartId, ReportLayout } from './ReportBuilder';
import type { CallRecord } from '../types/calls';
import type { AgentScore } from '../types/calls';

const AgentScoreChart = lazy(() => import('./Charts').then((m) => ({ default: m.AgentScoreChart })));

const ChartSkeleton = () => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel dark:border-white/10 dark:bg-white/10">
    <div className="h-72 animate-pulse rounded-md bg-slate-100 dark:bg-white/5" />
  </div>
);

interface Props {
  calls: CallRecord[];
  thresholds: ThresholdSet;
  selectedCharts: ChartId[];
  onChartsChange: (charts: ChartId[]) => void;
  layout: ReportLayout;
  onLayoutChange: (l: ReportLayout) => void;
  scoreData: AgentScore[];
}

export function CalidadView({ calls, thresholds, selectedCharts, onChartsChange, layout, onLayoutChange, scoreData }: Props) {
  const { kpis } = useCalidadMetrics(calls, thresholds);
  const gridClass = layout === '3' ? 'grid gap-6 md:grid-cols-2 xl:grid-cols-3' : 'grid gap-6 xl:grid-cols-2';

  return (
    <ModuleErrorBoundary moduleName="Calidad">
      <div>
        <p className="mt-2 mb-5 text-xs text-slate-500 dark:text-white/50" data-no-print>
          Calidad — FCR, transferencias, QA score y satisfaccion del cliente.
        </p>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {kpis.map((kpi, i) => (
            <KpiCard key={kpi.label} {...kpi} index={i} />
          ))}
        </section>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-white/50" data-no-print>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Cumple meta</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> En riesgo</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Fuera de meta</span>
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-que-teal" /> Referencial</span>
        </div>

        <div id="report-builder" className="mt-8" data-no-print>
          <ReportBuilder selected={selectedCharts} onChange={onChartsChange} layout={layout} onLayoutChange={onLayoutChange} />
        </div>

        <section className={`mt-6 ${gridClass}`}>
          <Suspense fallback={<ChartSkeleton />}>
            {selectedCharts.length === 0 ? (
              <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center dark:border-white/10 dark:bg-white/5">
                <BarChart3 size={40} className="mb-3 text-slate-300 dark:text-white/20" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-500 dark:text-white/40">Ninguna gráfica seleccionada</p>
                <button type="button" onClick={() => onChartsChange(['scores'])}
                  className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-ink shadow-sm transition hover:border-que-teal dark:border-white/10 dark:bg-white/10 dark:text-white">
                  Restaurar por defecto
                </button>
              </div>
            ) : (
              <>
                {selectedCharts.includes('scores') && <AgentScoreChart data={scoreData} />}
              </>
            )}
          </Suspense>
        </section>
      </div>
    </ModuleErrorBoundary>
  );
}
