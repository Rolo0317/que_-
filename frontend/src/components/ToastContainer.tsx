import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useContext } from 'react';
import { ToastContext } from '../lib/ToastContext';
import type { Toast } from '../lib/ToastContext';

const CFG: Record<Toast['type'], {
  Icon: typeof X;
  iconBg: string;
  iconColor: string;
  border: string;
  bar: string;
}> = {
  success: {
    Icon: CheckCircle2,
    iconBg:    'bg-emerald-100 dark:bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    border:    'border-emerald-200/50 dark:border-emerald-500/20',
    bar:       'bg-emerald-500',
  },
  error: {
    Icon: XCircle,
    iconBg:    'bg-rose-100 dark:bg-rose-500/20',
    iconColor: 'text-rose-600 dark:text-rose-400',
    border:    'border-rose-200/50 dark:border-rose-500/20',
    bar:       'bg-rose-500',
  },
  warning: {
    Icon: AlertTriangle,
    iconBg:    'bg-amber-100 dark:bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    border:    'border-amber-200/50 dark:border-amber-500/20',
    bar:       'bg-amber-400',
  },
  info: {
    Icon: Info,
    iconBg:    'bg-blue-100 dark:bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    border:    'border-blue-200/50 dark:border-blue-500/20',
    bar:       'bg-blue-500',
  },
};

export function ToastContainer() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  const { toasts, dismiss } = ctx;

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-50 flex flex-col-reverse gap-2.5">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const { Icon, iconBg, iconColor, border, bar } = CFG[t.type];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 72, scale: 0.9 }}
              animate={{
                opacity: 1, x: 0, scale: 1,
                transition: { type: 'spring', stiffness: 420, damping: 30 },
              }}
              exit={{ opacity: 0, x: 48, scale: 0.88, transition: { duration: 0.16 } }}
              className={`pointer-events-auto relative w-[340px] max-w-[calc(100vw-40px)] overflow-hidden rounded-2xl border
                         bg-white/95 shadow-2xl shadow-black/[0.12] backdrop-blur-xl
                         dark:bg-slate-900/95 dark:shadow-black/50 ${border}`}
            >
              {/* Draining progress bar */}
              <motion.div
                className={`absolute bottom-0 left-0 h-[2.5px] w-full origin-left ${bar}`}
                initial={{ scaleX: 1 }}
                animate={{ scaleX: 0 }}
                transition={{ duration: t.duration / 1000, ease: 'linear' }}
              />

              <div className="flex items-start gap-3.5 px-4 py-3.5">
                {/* Icon bubble */}
                <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                  <Icon size={17} className={iconColor} />
                </div>

                {/* Text */}
                <p className="flex-1 pt-1.5 text-sm font-medium leading-snug text-slate-800 dark:text-slate-100">
                  {t.message}
                </p>

                {/* Dismiss */}
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  className="mt-0.5 flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition
                             hover:bg-slate-100 hover:text-slate-600
                             dark:text-white/30 dark:hover:bg-white/10 dark:hover:text-white/60"
                  aria-label="Cerrar notificación"
                >
                  <X size={13} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
