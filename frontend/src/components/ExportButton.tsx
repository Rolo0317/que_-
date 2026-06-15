import { AnimatePresence, motion } from 'framer-motion';
import { Download, FileSpreadsheet, Loader2, Printer } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useToast } from '../lib/ToastContext';
import { exportDashboardToXlsx, type ExportOptions } from '../lib/exportXlsx';

interface Props {
  options: ExportOptions;
}

export function ExportButton({ options }: Props) {
  const [open, setOpen]       = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handlePdf() {
    setOpen(false);
    // Temporarily remove dark mode so print is always light
    const html = document.documentElement;
    const wasDark = html.classList.contains('dark');
    if (wasDark) html.classList.remove('dark');
    const restore = () => {
      if (wasDark) html.classList.add('dark');
      window.removeEventListener('afterprint', restore);
    };
    window.addEventListener('afterprint', restore);
    toast.info('Abriendo diálogo de impresión…');
    setTimeout(() => window.print(), 80);
  }

  async function handleExcel() {
    setOpen(false);
    if (options.calls.length === 0) {
      toast.warning('No hay datos cargados para exportar');
      return;
    }
    setLoading(true);
    try {
      await exportDashboardToXlsx(options);
      toast.success(`Excel generado · ${options.calls.length} registros`);
    } catch {
      toast.error('Error al generar el Excel. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div ref={ref} className="relative" data-no-print>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={loading}
        aria-label="Exportar informe"
        className="flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-ink shadow-sm transition hover:border-que-teal disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-white"
      >
        {loading
          ? <Loader2 size={15} className="animate-spin text-que-teal" />
          : <Download size={15} aria-hidden="true" />
        }
        <span className="hidden sm:inline">Exportar</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14 }}
            className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-white/10 dark:bg-slate-800"
          >
            <button
              type="button"
              onClick={handlePdf}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-ink transition hover:bg-slate-50 dark:text-white dark:hover:bg-white/5"
            >
              <Printer size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
              <span>Exportar PDF</span>
            </button>
            <div className="mx-4 border-t border-slate-100 dark:border-white/10" />
            <button
              type="button"
              onClick={handleExcel}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-ink transition hover:bg-slate-50 dark:text-white dark:hover:bg-white/5"
            >
              <FileSpreadsheet size={15} className="shrink-0 text-emerald-500" aria-hidden="true" />
              <span>Exportar Excel (.xlsx)</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
