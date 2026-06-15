import { BarChart3, Check, Layers, PieChart, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { BrandLogo } from './BrandLogo';

export type ChartId = 'hourly' | 'mix' | 'scores' | 'slaHour' | 'abandonHour' | 'queues';
export type ReportLayout = '2' | '3';

const chartOptions = [
  {
    id: 'hourly' as ChartId,
    label: 'Llamadas/hora',
    desc: 'Volumen por franja horaria',
    Icon: TrendingUp,
    iconColor: 'text-que-teal',
    activeBorder: 'border-que-teal',
    activeBg: 'bg-que-teal/10',
    badge: 'WFM',
  },
  {
    id: 'mix' as ChartId,
    label: 'Mix In/Out',
    desc: 'Tipo de llamada',
    Icon: PieChart,
    iconColor: 'text-plus-orange',
    activeBorder: 'border-plus-orange',
    activeBg: 'bg-plus-orange/10',
    badge: 'Operaciones',
  },
  {
    id: 'scores' as ChartId,
    label: 'Calificacion',
    desc: 'Score por agente',
    Icon: BarChart3,
    iconColor: 'text-violet',
    activeBorder: 'border-violet',
    activeBg: 'bg-violet/10',
    badge: 'Calidad',
  },
  {
    id: 'slaHour' as ChartId,
    label: 'SLA/hora',
    desc: 'Nivel de servicio vs. meta',
    Icon: ShieldCheck,
    iconColor: 'text-que-teal',
    activeBorder: 'border-que-teal',
    activeBg: 'bg-que-teal/10',
    badge: 'Operaciones',
  },
  {
    id: 'abandonHour' as ChartId,
    label: 'Abandono/hora',
    desc: 'Pico de abandonos',
    Icon: TrendingDown,
    iconColor: 'text-coral',
    activeBorder: 'border-coral',
    activeBg: 'bg-coral/10',
    badge: 'Operaciones',
  },
  {
    id: 'queues' as ChartId,
    label: 'Colas',
    desc: 'Distribucion por cola',
    Icon: Layers,
    iconColor: 'text-plus-orange',
    activeBorder: 'border-plus-orange',
    activeBg: 'bg-plus-orange/10',
    badge: 'Operaciones',
  },
] as const;

interface ReportBuilderProps {
  selected: ChartId[];
  onChange: (selected: ChartId[]) => void;
  layout: ReportLayout;
  onLayoutChange: (layout: ReportLayout) => void;
}

export function ReportBuilder({ selected, onChange, layout, onLayoutChange }: ReportBuilderProps) {
  const toggle = (id: ChartId) =>
    onChange(selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id]);

  const allIds = chartOptions.map((c) => c.id);
  const allSelected = selected.length === allIds.length;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-panel dark:border-white/10 dark:bg-slate-900/80">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-ink via-slate-800 to-slate-900 px-5 py-3">
        <div className="flex items-center gap-3">
          <BrandLogo className="w-12 flex-shrink-0 opacity-90" />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Constructor de informes</p>
            <h3 className="text-sm font-bold leading-tight text-white">Arma tu informe</h3>
          </div>
        </div>

        {/* Layout selector — hidden in print */}
        <div className="hidden items-center gap-1 rounded-lg border border-white/15 bg-white/10 p-1 sm:flex" data-no-print>
          <span className="px-1.5 text-[10px] font-semibold uppercase tracking-wide text-white/40">Layout</span>
          {(['2', '3'] as ReportLayout[]).map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onLayoutChange(l)}
              className={`h-7 rounded px-2.5 text-xs font-bold transition-all ${
                layout === l
                  ? 'bg-que-teal text-white shadow-sm'
                  : 'text-white/50 hover:text-white'
              }`}
              title={`${l} columnas`}
            >
              {l}×
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        {/* Status row */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white dark:bg-que-teal">
              {selected.length}
            </div>
            <p className="text-xs text-slate-500 dark:text-white/50">
              de {chartOptions.length} gráficas seleccionadas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onChange(allSelected ? [] : [...allIds])}
              className="text-[11px] font-semibold text-que-teal transition hover:underline"
            >
              {allSelected ? 'Ninguna' : 'Todas'}
            </button>
          </div>
        </div>

        {/* Chart cards grid */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {chartOptions.map(({ id, label, desc, Icon, iconColor, activeBorder, activeBg, badge }) => {
            const isActive = selected.includes(id);
            return (
              <motion.button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                whileTap={{ scale: 0.96 }}
                className={`group relative flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-all duration-200 ${
                  isActive
                    ? `${activeBorder} ${activeBg}`
                    : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-white/10 dark:bg-white/5 dark:hover:border-white/20'
                }`}
              >
                {/* Module badge */}
                <span className={`text-[9px] font-bold uppercase tracking-wide ${isActive ? 'text-slate-500 dark:text-white/50' : 'text-slate-400 dark:text-white/25'}`}>
                  {badge}
                </span>

                {/* Icon + checkmark */}
                <div className="flex w-full items-center justify-between">
                  <div className={`rounded-lg p-1.5 transition-colors ${isActive ? `${activeBg}` : 'bg-slate-200/50 dark:bg-white/10'}`}>
                    <Icon size={16} className={isActive ? iconColor : 'text-slate-400 dark:text-white/30'} />
                  </div>
                  <motion.div
                    initial={false}
                    animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-ink dark:bg-que-teal"
                  >
                    <Check size={11} className="text-white" strokeWidth={3} />
                  </motion.div>
                </div>

                {/* Labels */}
                <div>
                  <p className={`text-xs font-bold leading-tight ${isActive ? 'text-ink dark:text-white' : 'text-slate-500 dark:text-white/40'}`}>
                    {label}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-tight text-slate-400 dark:text-white/25">
                    {desc}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
