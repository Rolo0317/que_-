import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useContext } from 'react';
import { ToastContext } from '../lib/ToastContext';
import type { Toast } from '../lib/ToastContext';

const ICON: Record<Toast['type'], typeof X> = {
  success: CheckCircle2,
  error:   XCircle,
  warning: AlertTriangle,
  info:    Info,
};

const COLOR: Record<Toast['type'], string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300',
  error:   'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300',
  info:    'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300',
};

export function ToastContainer() {
  const ctx = useContext(ToastContext);
  if (!ctx) return null;
  const { toasts, dismiss } = ctx;

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const Icon = ICON[t.type];
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 400, damping: 30 } }}
              exit={{ opacity: 0, y: 10, scale: 0.95, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg ${COLOR[t.type]}`}
            >
              <Icon size={16} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="flex-shrink-0 opacity-50 transition-opacity hover:opacity-100"
                aria-label="Cerrar"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
