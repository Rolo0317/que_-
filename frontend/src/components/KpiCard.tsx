import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

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

const STATUS = {
  good: {
    dot:    'bg-emerald-500',
    line:   'from-emerald-400 to-teal-400',
    shadow: 'hover:shadow-emerald-500/20 dark:hover:shadow-emerald-500/25',
    glow:   'bg-emerald-400',
    value:  'text-emerald-700 dark:text-emerald-400',
    badge:  'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
    label:  'Bien',
  },
  warning: {
    dot:    'bg-amber-400',
    line:   'from-amber-400 to-orange-400',
    shadow: 'hover:shadow-amber-400/20 dark:hover:shadow-amber-400/25',
    glow:   'bg-amber-400',
    value:  'text-amber-700 dark:text-amber-400',
    badge:  'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
    label:  'En riesgo',
  },
  bad: {
    dot:    'bg-rose-500',
    line:   'from-rose-500 to-pink-500',
    shadow: 'hover:shadow-rose-500/20 dark:hover:shadow-rose-500/25',
    glow:   'bg-rose-500',
    value:  'text-rose-700 dark:text-rose-400',
    badge:  'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
    label:  'Fuera de meta',
  },
  neutral: {
    dot:    'bg-que-teal',
    line:   'from-que-teal to-teal-300',
    shadow: 'hover:shadow-que-teal/20 dark:hover:shadow-que-teal/25',
    glow:   'bg-que-teal',
    value:  'text-ink dark:text-white',
    badge:  '',
    label:  '',
  },
} as const;

// Parse "82.51%", "7.461", "23 s" → animatable number + formatter
function parseAnimatable(val: string | number): { raw: number; fmt: (n: number) => string } | null {
  if (typeof val === 'number') {
    return { raw: val, fmt: (n) => Math.round(n).toLocaleString('es') };
  }
  // Percentage: "82.51%" or "82,51%"
  const pct = /^(\d[\d,.]*)[\s]*%$/.exec(val);
  if (pct) {
    const raw = parseFloat(pct[1].replace(',', '.'));
    const decPart = pct[1].split(/[.,]/)[1] ?? '';
    const dec = decPart.length;
    return { raw, fmt: (n) => `${n.toFixed(dec)}%` };
  }
  // Seconds: "23 s"
  const sec = /^(\d[\d,.]*)[\s]*s$/.exec(val);
  if (sec) {
    const raw = parseFloat(sec[1].replace(',', '.'));
    return { raw, fmt: (n) => `${Math.round(n)} s` };
  }
  // Integer with thousand-separators: "7.461" or "7,461"
  if (/^[\d.,\s]+$/.test(val.trim())) {
    const raw = parseFloat(val.replace(/[.,\s]/g, ''));
    if (!isNaN(raw)) return { raw, fmt: (n) => Math.round(n).toLocaleString('es') };
  }
  return null;
}

function useCountUp(target: number, delayMs: number): number {
  const [val, setVal] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const DURATION = 850;
    const timer = setTimeout(() => {
      const t0 = performance.now();
      function step() {
        const elapsed = performance.now() - t0;
        const p = Math.min(elapsed / DURATION, 1);
        const eased = 1 - (1 - p) ** 3; // ease-out cubic
        setVal(eased * target);
        if (p < 1) rafRef.current = requestAnimationFrame(step);
      }
      rafRef.current = requestAnimationFrame(step);
    }, delayMs);
    return () => { clearTimeout(timer); cancelAnimationFrame(rafRef.current); };
  }, [target, delayMs]);

  return val;
}

export function KpiCard({ label, value, helper, target, status = 'neutral', index = 0, description }: KpiCardProps) {
  const cfg = STATUS[status];
  const parsed = parseAnimatable(value);
  const animated = useCountUp(parsed?.raw ?? 0, index * 65);
  const displayValue = parsed ? parsed.fmt(animated) : String(value);

  return (
    <motion.article
      initial={{ opacity: 0, y: 22, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.07, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -7, transition: { duration: 0.22, ease: 'easeOut' } }}
      className={`group relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white
                  shadow-md transition-all duration-300 hover:shadow-2xl ${cfg.shadow}
                  dark:border-white/[0.07] dark:bg-gradient-to-br dark:from-slate-800/90 dark:to-slate-900
                  dark:ring-1 dark:ring-white/[0.07]`}
    >
      {/* Top gradient accent */}
      <div className={`h-[3px] w-full bg-gradient-to-r ${cfg.line}`} />

      {/* Hover glow blob */}
      <div
        className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-3xl
                    opacity-0 transition-opacity duration-500 group-hover:opacity-20 ${cfg.glow}`}
      />

      {/* Status badge */}
      {cfg.label && (
        <div className={`absolute right-3.5 top-3.5 flex items-center gap-1.5 rounded-full border px-2 py-[3px] text-[9px] font-bold uppercase tracking-wider ${cfg.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
          {cfg.label}
        </div>
      )}

      <div className="px-5 pb-5 pt-4">
        {/* Label */}
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400 dark:text-white/35">
          {label}
        </p>

        {/* Animated value */}
        <p className={`mt-2.5 text-[2.4rem] font-extrabold leading-none tracking-tight ${cfg.value}`} aria-live="polite">
          {displayValue}
        </p>

        {/* Helper */}
        <p className="mt-2 text-[11px] leading-relaxed text-slate-400 dark:text-white/38">{helper}</p>

        {/* Target */}
        {target && (
          <div className="mt-3.5 flex items-center gap-2">
            <div className={`h-px flex-1 opacity-20 bg-gradient-to-r ${cfg.line}`} />
            <p className="text-[10px] font-semibold text-slate-400 dark:text-white/30">{target}</p>
          </div>
        )}
      </div>

      {/* Info tooltip */}
      {description && (
        <div className="group/tip absolute bottom-3 right-3.5">
          <div
            tabIndex={0}
            role="img"
            aria-label={description}
            className="flex h-5 w-5 cursor-help items-center justify-center rounded-full bg-slate-100
                       text-[10px] font-bold text-slate-400 transition
                       hover:bg-que-teal hover:text-white focus:bg-que-teal focus:text-white focus:outline-none
                       dark:bg-white/10 dark:text-white/30"
          >
            ?
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-7 right-0 z-20 w-56 origin-bottom-right scale-95
                       rounded-xl border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-600
                       opacity-0 shadow-xl transition-all duration-150
                       group-hover/tip:scale-100 group-hover/tip:opacity-100
                       dark:border-white/10 dark:bg-slate-800 dark:text-white/70"
          >
            {description}
            <div className="absolute -bottom-1.5 right-2 h-3 w-3 rotate-45 border-b border-r border-slate-200 bg-white dark:border-white/10 dark:bg-slate-800" />
          </div>
        </div>
      )}
    </motion.article>
  );
}
