import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useState } from 'react';

const KEY = 'que-guide-dismissed';

const TIPS = [
  {
    icon: '🚦',
    title: 'Semáforo automático',
    body: 'Cada tarjeta muestra un punto de color: verde = cumple la meta, amarillo = en riesgo, rojo = fuera de meta.',
  },
  {
    icon: '🔍',
    title: 'Filtros',
    body: 'Usa los selectores de la barra superior para ver datos por campaña, tipo de llamada (Inbound/Outbound) o período.',
  },
  {
    icon: '🎯',
    title: 'Edita las metas',
    body: 'Haz clic en "Metas" (arriba) para ajustar qué porcentaje es considerado "bien" o "en riesgo" para cada indicador.',
  },
  {
    icon: '📊',
    title: 'Arma tu informe',
    body: 'Al final de la página selecciona qué gráficas mostrar y cambia su tipo (barras, líneas, área) con los íconos de cada tarjeta.',
  },
];

export function QuickGuide() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(KEY) === '1',
  );

  function dismiss() {
    localStorage.setItem(KEY, '1');
    setDismissed(true);
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -10, height: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
          data-no-print
        >
          <div className="mt-4 rounded-xl border border-que-teal/20 bg-que-teal/5 p-4 dark:border-que-teal/10 dark:bg-que-teal/[0.04]">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-widest text-que-teal">
                Guía rápida · ¿primera vez aquí?
              </p>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Cerrar guía"
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-slate-600 dark:text-white/30 dark:hover:bg-white/10"
              >
                <X size={13} />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {TIPS.map((tip) => (
                <div
                  key={tip.title}
                  className="flex gap-3 rounded-lg border border-slate-100 bg-white p-3 dark:border-white/5 dark:bg-white/[0.03]"
                >
                  <span className="flex-shrink-0 text-2xl leading-none" aria-hidden="true">
                    {tip.icon}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-ink dark:text-white">{tip.title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-slate-400 dark:text-white/40">
                      {tip.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={dismiss}
              className="mt-3 text-[11px] font-semibold text-que-teal/70 transition hover:text-que-teal"
            >
              Entendido, no mostrar de nuevo →
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
