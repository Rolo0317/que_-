import {
  CheckCircle2,
  Cloud,
  CloudOff,
  Database,
  Download,
  FileSpreadsheet,
  Info,
  Power,
  Trash2,
  Upload,
  UploadCloud,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
import type { Dataset } from '../types/dataset';

const SOURCE_ICON = { demo: Database, excel: FileSpreadsheet, api: Cloud } as const;
const SOURCE_LABEL = { demo: 'Demo', excel: 'Excel', api: 'API' } as const;
const SOURCE_COLOR = {
  demo:  'text-violet bg-violet/10 border-violet/30',
  excel: 'text-que-teal bg-que-teal/10 border-que-teal/30',
  api:   'text-plus-orange bg-plus-orange/10 border-plus-orange/30',
} as const;

const EXPECTED_COLUMNS = [
  // Columnas propias
  'tipo / type',
  'agente / agent',
  'cola / queue',
  'hora / hour',
  'duracion / durationSeconds',
  'espera / waitSeconds',
  'abandonada / abandoned',
  'sla / answeredWithinSla',
  'fcr / resolvedFirstContact',
  'calificacion / score',
  'calidad / qaScore',
  // Columnas Vicidial (se aceptan directamente)
  'uniqueid',
  'user',
  'campaign_id',
  'call_date',
  'length_in_sec',
  'queue_seconds',
  'status',
  'talk_sec',
  'pause_sec',
  'login_sec',
];

const MAX_FILE_BYTES = 15 * 1024 * 1024;

interface DataManagerProps {
  datasets: Dataset[];
  activeId: string;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
  onUpload: (file: File) => Promise<void>;
  cloudEnabled?: boolean;
}

export function DataManager({ datasets, activeId, onActivate, onDelete, onUpload, cloudEnabled = false }: DataManagerProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showColumns, setShowColumns] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Solo se aceptan archivos .xlsx');
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError(`Archivo demasiado grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Máximo: 5 MB.`);
      return;
    }
    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const [file] = e.target.files ?? [];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const [file] = Array.from(e.dataTransfer.files);
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink dark:text-white">Gestión de datos</h2>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-white/50">
            {datasets.length} conjunto{datasets.length !== 1 ? 's' : ''} de datos disponible{datasets.length !== 1 ? 's' : ''}
          </p>
        </div>
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-que-teal bg-que-teal px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-que-teal-dark active:scale-95">
          <Upload size={16} aria-hidden="true" />
          {uploading ? 'Cargando...' : 'Cargar Excel'}
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className="sr-only"
            disabled={uploading}
            onChange={onInputChange}
          />
        </label>
      </div>

      {/* Cloud sync status banner */}
      <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-xs font-semibold transition-all ${
        cloudEnabled
          ? 'border-que-teal/25 bg-gradient-to-r from-que-teal/8 to-teal-500/5 text-que-teal dark:border-que-teal/20 dark:from-que-teal/10 dark:to-transparent'
          : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white/30'
      }`}>
        <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${
          cloudEnabled ? 'bg-que-teal/15 dark:bg-que-teal/20' : 'bg-slate-100 dark:bg-white/10'
        }`}>
          {cloudEnabled
            ? <Cloud size={14} className="text-que-teal" />
            : <CloudOff size={14} />}
        </div>
        <span>
          {cloudEnabled
            ? 'Sincronización en la nube activa — todos los usuarios ven los mismos datos'
            : 'Sin sincronización en la nube — los datos son solo locales.'}
        </span>
        {cloudEnabled && (
          <span className="ml-auto flex h-2 w-2 flex-shrink-0 rounded-full bg-que-teal shadow-[0_0_6px_2px_rgba(17,174,179,0.5)]" />
        )}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-800 dark:bg-rose-950/30 dark:text-rose-400"
          >
            <Info size={15} className="flex-shrink-0" />
            {error}
            <button
              type="button"
              onClick={() => setError(null)}
              className="ml-auto text-rose-400 hover:text-rose-600"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dataset cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {datasets.map((dataset, idx) => {
            const isActive = dataset.id === activeId;
            const Icon = SOURCE_ICON[dataset.source];
            const colorClass = SOURCE_COLOR[dataset.source];

            return (
              <motion.div
                key={dataset.id}
                layout
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.15 } }}
                transition={{ duration: 0.3, delay: idx * 0.04, ease: [0.23, 1, 0.32, 1] }}
                whileHover={{ y: -3, transition: { duration: 0.18 } }}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border-2 bg-white transition-all duration-300
                            dark:bg-slate-900 ${
                  isActive
                    ? 'border-que-teal shadow-lg shadow-que-teal/15 dark:shadow-que-teal/20'
                    : 'border-slate-200 shadow-sm hover:border-slate-300 hover:shadow-md dark:border-white/10 dark:hover:border-white/20'
                }`}
              >
                {/* Active gradient top strip */}
                {isActive && (
                  <div className="h-[3px] w-full bg-gradient-to-r from-que-teal to-teal-400" />
                )}

                <div className="p-5">
                  {/* Active badge */}
                  {isActive && (
                    <div className="absolute right-3 top-4 flex items-center gap-1.5 rounded-full bg-que-teal/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-que-teal dark:bg-que-teal/15">
                      <span className="h-1.5 w-1.5 rounded-full bg-que-teal shadow-[0_0_5px_1px_rgba(17,174,179,0.6)]" />
                      Activo
                    </div>
                  )}

                  {/* Source icon + badge */}
                  <div className="flex items-start gap-3">
                    <div className={`rounded-xl border p-3 transition-transform duration-200 group-hover:scale-105 ${colorClass}`}>
                      <Icon size={20} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${colorClass}`}>
                        {SOURCE_LABEL[dataset.source]}
                      </span>
                      <p className="mt-1.5 truncate text-sm font-bold text-ink dark:text-white" title={dataset.name}>
                        {dataset.name}
                      </p>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-white/[0.04]">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-white/30">Registros</p>
                      <p className="mt-0.5 text-sm font-bold tabular-nums text-ink dark:text-white">
                        {dataset.calls.length.toLocaleString('es')}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-2.5 dark:bg-white/[0.04]">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-white/30">Cargado</p>
                      <p className="mt-0.5 text-[11px] font-bold leading-tight text-ink dark:text-white">
                        {dataset.loadedAt.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-[10px] tabular-nums text-slate-400 dark:text-white/30">
                        {dataset.loadedAt.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-2">
                    {isActive ? (
                      <button
                        type="button"
                        onClick={() => { if (dataset.id !== 'demo') onActivate('demo'); }}
                        disabled={dataset.id === 'demo'}
                        title={dataset.id !== 'demo' ? 'Apagar: volver a datos de muestra' : 'Dataset de muestra (siempre disponible)'}
                        className={`group/btn relative flex-1 overflow-hidden rounded-xl border py-2 text-xs font-semibold transition-all duration-200 ${
                          dataset.id === 'demo'
                            ? 'cursor-default border-que-teal/30 bg-que-teal/5 text-que-teal'
                            : 'cursor-pointer border-que-teal/30 bg-que-teal/5 text-que-teal hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500 dark:hover:border-rose-700 dark:hover:bg-rose-950/30 dark:hover:text-rose-400'
                        }`}
                      >
                        <span className={`flex items-center justify-center gap-1.5 transition-opacity duration-150 ${dataset.id !== 'demo' ? 'group-hover/btn:opacity-0' : ''}`}>
                          <CheckCircle2 size={12} aria-hidden="true" />
                          En uso
                        </span>
                        {dataset.id !== 'demo' && (
                          <span className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover/btn:opacity-100">
                            <Power size={12} aria-hidden="true" />
                            Apagar
                          </span>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onActivate(dataset.id)}
                        className="flex-1 rounded-xl bg-ink py-2 text-xs font-semibold text-white transition-all duration-200 hover:bg-slate-700 active:scale-95 dark:bg-white/10 dark:hover:bg-white/20"
                      >
                        Usar este
                      </button>
                    )}
                    {datasets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDelete(dataset.id)}
                        title="Eliminar dataset"
                        className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition-all duration-200 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:hover:border-rose-700 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                      >
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Drop zone — gradient border on drag */}
      <div
        className={`rounded-2xl p-px transition-all duration-300 ${
          isDragging
            ? 'bg-gradient-to-br from-que-teal via-plus-orange to-violet shadow-xl shadow-que-teal/20'
            : 'bg-gradient-to-br from-slate-200 to-slate-200/50 dark:from-white/[0.08] dark:to-white/[0.04]'
        }`}
      >
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          style={isDragging ? undefined : {
            backgroundImage: 'radial-gradient(circle, rgba(17,174,179,0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          className={`rounded-2xl p-8 text-center transition-all duration-300 ${
            isDragging
              ? 'bg-gradient-to-b from-que-teal/5 to-plus-orange/5 dark:from-que-teal/10 dark:to-plus-orange/5'
              : 'bg-slate-50/80 dark:bg-[#07181c]'
          }`}
        >
          <motion.div
            animate={isDragging ? { scale: 1.15, rotate: -8 } : { scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <UploadCloud
              size={36}
              className={`mx-auto mb-3 transition-colors duration-300 ${
                isDragging ? 'text-que-teal' : 'text-slate-300 dark:text-white/20'
              }`}
              aria-hidden="true"
            />
          </motion.div>

          <p className={`text-sm font-semibold transition-colors duration-200 ${
            isDragging ? 'text-que-teal' : 'text-slate-500 dark:text-white/50'
          }`}>
            {isDragging ? 'Suelta el archivo aquí' : 'Arrastra un .xlsx aquí o usa el botón Cargar Excel'}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-white/25">
            Formato .xlsx · Máximo 15 MB
          </p>

          {/* Download template */}
          <a
            href="/plantilla-queplus.xlsx"
            download="plantilla-queplus.xlsx"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-que-teal/35 bg-que-teal/5 px-3.5 py-1.5 text-xs font-semibold text-que-teal transition hover:bg-que-teal/10 hover:border-que-teal/50"
          >
            <Download size={12} />
            Descargar plantilla de ejemplo
          </a>

          {/* Column guide toggle */}
          <button
            type="button"
            onClick={() => setShowColumns((v) => !v)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-que-teal hover:underline"
          >
            <Info size={12} />
            {showColumns ? 'Ocultar' : 'Ver'} columnas esperadas
          </button>

        <AnimatePresence>
          {showColumns && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mx-auto mt-4 max-w-lg space-y-3 text-left">
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">Columnas propias</p>
                  <div className="flex flex-wrap gap-1.5">
                    {EXPECTED_COLUMNS.slice(0, 11).map((col) => (
                      <span key={col} className="rounded-md bg-white px-2 py-1 font-mono text-[10px] text-slate-600 shadow-sm dark:bg-white/10 dark:text-white/50">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-que-teal/70">Columnas Vicidial (export directo)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {EXPECTED_COLUMNS.slice(11).map((col) => (
                      <span key={col} className="rounded-md border border-que-teal/20 bg-que-teal/5 px-2 py-1 font-mono text-[10px] text-que-teal shadow-sm">
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[11px] text-slate-400 dark:text-white/25">
                Encabezados en español, inglés o formato Vicidial. Las columnas sin coincidencia se ignoran.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
