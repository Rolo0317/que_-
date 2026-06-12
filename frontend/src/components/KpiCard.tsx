import { motion } from 'framer-motion';

export type KpiStatus = 'good' | 'warning' | 'bad' | 'neutral';

interface KpiCardProps {
  label: string;
  value: string | number;
  helper: string;
  target?: string;
  status?: KpiStatus;
  index?: number;
}

const statusCfg: Record<KpiStatus, { dot: string; bar: string; value: string }> = {
  good:    { dot: 'bg-emerald-500', bar: 'bg-emerald-500', value: 'text-emerald-700 dark:text-emerald-400' },
  warning: { dot: 'bg-amber-400',   bar: 'bg-amber-400',   value: 'text-amber-700   dark:text-amber-400' },
  bad:     { dot: 'bg-rose-500',    bar: 'bg-rose-500',    value: 'text-rose-700    dark:text-rose-400' },
  neutral: { dot: 'bg-que-teal',    bar: 'bg-que-teal',    value: 'text-ink         dark:text-white' },
};

export function KpiCard({ label, value, helper, target, status = 'neutral', index = 0 }: KpiCardProps) {
  const cfg = statusCfg[status];

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.18 } }}
      className="group relative overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg transition-shadow dark:border-white/10 dark:bg-slate-800/50"
    >
      {/* Barra de acento lateral izquierda */}
      <div className={`absolute inset-y-0 left-0 w-1 ${cfg.bar}`} />

      {/* Punto de estado */}
      <div className="absolute right-3 top-3">
        <span className={`block h-2.5 w-2.5 rounded-full ${cfg.dot}`} />
      </div>

      <div className="px-5 py-4 pl-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-white/60">
          {label}
        </p>
        <p className={`mt-2 text-3xl font-bold ${cfg.value}`}>{value}</p>
        <p className="mt-1 text-xs text-slate-400 dark:text-white/50">{helper}</p>
        {target && (
          <p className="mt-2 text-[10px] font-medium text-slate-400 dark:text-white/40">{target}</p>
        )}
      </div>
    </motion.article>
  );
}
