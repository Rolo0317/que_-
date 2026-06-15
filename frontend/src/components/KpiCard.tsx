import { motion } from 'framer-motion';

export type KpiStatus = 'good' | 'warning' | 'bad' | 'neutral';

interface KpiCardProps {
  label: string;
  value: string | number;
  helper: string;
  target?: string;
  status?: KpiStatus;
  index?: number;
  description?: string;
}

const statusCfg: Record<KpiStatus, { dot: string; bar: string; value: string }> = {
  good:    { dot: 'bg-emerald-500', bar: 'bg-emerald-500', value: 'text-emerald-700 dark:text-emerald-400' },
  warning: { dot: 'bg-amber-400',   bar: 'bg-amber-400',   value: 'text-amber-700   dark:text-amber-400' },
  bad:     { dot: 'bg-rose-500',    bar: 'bg-rose-500',    value: 'text-rose-700    dark:text-rose-400' },
  neutral: { dot: 'bg-que-teal',    bar: 'bg-que-teal',    value: 'text-ink         dark:text-white' },
};

const statusLabel: Record<KpiStatus, { text: string; cls: string }> = {
  good:    { text: 'Bien',          cls: 'text-emerald-600 dark:text-emerald-400' },
  warning: { text: 'En riesgo',     cls: 'text-amber-600 dark:text-amber-400' },
  bad:     { text: 'Fuera de meta', cls: 'text-rose-600 dark:text-rose-400' },
  neutral: { text: '',              cls: '' },
};

export function KpiCard({ label, value, helper, target, status = 'neutral', index = 0, description }: KpiCardProps) {
  const cfg = statusCfg[status];
  const lbl = statusLabel[status];

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg transition-shadow dark:border-white/10 dark:bg-slate-800/50"
    >
      {/* Left accent bar */}
      <div className={`absolute inset-y-0 left-0 w-1 ${cfg.bar}`} />

      {/* Top-right: status dot + label */}
      <div className="absolute right-3 top-3 flex items-center gap-1.5">
        {lbl.text && (
          <span className={`hidden text-[10px] font-bold sm:block ${lbl.cls}`}>
            {lbl.text}
          </span>
        )}
        <span className={`block h-2.5 w-2.5 flex-shrink-0 rounded-full ${cfg.dot}`} />
      </div>

      <div className="px-5 py-4 pl-6 pb-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60">
          {label}
        </p>
        <p className={`mt-2 text-3xl font-bold ${cfg.value}`}>{value}</p>
        <p className="mt-1 text-xs text-slate-400 dark:text-white/50">{helper}</p>
        {target && (
          <p className="mt-2 text-[10px] font-medium text-slate-400 dark:text-white/40">{target}</p>
        )}
      </div>

      {/* Info tooltip — bottom-right */}
      {description && (
        <div className="group/tip absolute bottom-2.5 right-3">
          <div
            tabIndex={0}
            role="img"
            aria-label={description}
            className="flex h-5 w-5 cursor-help items-center justify-center rounded-full bg-slate-100 text-[10px] font-bold text-slate-400 transition hover:bg-que-teal hover:text-white focus:bg-que-teal focus:text-white focus:outline-none dark:bg-white/10 dark:text-white/30"
          >
            ?
          </div>
          {/* Tooltip bubble */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-7 right-0 z-20 w-56 origin-bottom-right scale-95 rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-600 opacity-0 shadow-xl transition-all duration-150 group-hover/tip:scale-100 group-hover/tip:opacity-100 dark:border-white/10 dark:bg-slate-800 dark:text-white/70"
          >
            {description}
            {/* Arrow */}
            <div className="absolute -bottom-1.5 right-2 h-3 w-3 rotate-45 border-b border-r border-slate-200 bg-white dark:border-white/10 dark:bg-slate-800" />
          </div>
        </div>
      )}
    </motion.article>
  );
}
