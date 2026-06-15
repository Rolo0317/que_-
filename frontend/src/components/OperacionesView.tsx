import { KpiCard } from './KpiCard';
import { ModuleErrorBoundary } from './ModuleErrorBoundary';
import { useOpsMetrics } from '../lib/hooks/useOpsMetrics';
import type { ThresholdSet } from '../lib/useThresholds';
import type { CallRecord } from '../types/calls';

interface Props {
  calls: CallRecord[];
  thresholds: ThresholdSet;
}

export function OperacionesView({ calls, thresholds }: Props) {
  const { kpis } = useOpsMetrics(calls, thresholds);

  return (
    <ModuleErrorBoundary moduleName="Operaciones">
      <div>
        <p className="mt-2 mb-5 text-xs text-slate-500 dark:text-white/50" data-no-print>
          Volumen y servicio — llamadas, SLA, abandono, velocidad de respuesta y duracion.
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
      </div>
    </ModuleErrorBoundary>
  );
}
