import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, Filter, Target, X, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { LS } from '../lib/constants';

interface Tip {
  Icon:     LucideIcon;
  iconCls:  string;
  title:    string;
  body:     string;
}

const TIPS: Tip[] = [
  {
    Icon:    Filter,
    iconCls: 'text-que-teal',
    title:   'Semaforo automatico',
    body:    'Cada tarjeta muestra un punto de color: verde = cumple la meta, amarillo = en riesgo, rojo = fuera de meta.',
  },
  {
    Icon:    Filter,
    iconCls: 'text-slate-500 dark:text-white/50',
    title:   'Filtros',
    body:    'Usa los selectores de la barra superior para ver datos por campana, tipo de llamada o periodo de tiempo.',
  },
  {
    Icon:    Target,
    iconCls: 'text-plus-orange',
    title:   'Edita las metas',
    body:    'Haz clic en "Metas" (arriba) para ajustar que porcentaje es considerado "bien" o "en riesgo" para cada indicador.',
  },
  {
    Icon:    BarChart3,
    iconCls: 'text-violet',
    title:   'Arma tu informe',
    body:    'Al final de la pagina selecciona que graficas mostrar y cambia su tipo (barras, lineas, area) con los iconos de cada tarjeta.',
  },
];

export function QuickGuide() {
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(LS.guideDismissed) === '1',
  );

  function dismiss() {
    localStorage.setItem(LS.guideDismissed, '1');
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
                Guia rapida · primera vez aqui?
              </p>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Cerrar guia"
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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-white/10">
                    <tip.Icon size={16} className={tip.iconCls} aria-hidden="true" />
                  </div>
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
              Entendido, no mostrar de nuevo
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
