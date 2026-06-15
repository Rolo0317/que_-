import {
  CheckCircle2,
  Cloud,
  Database,
  Download,
  FileSpreadsheet,
  Info,
  Power,
  Trash2,
  Upload,
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

const MAX_FILE_BYTES = 5 * 1024 * 1024;

interface DataManagerProps {
  datasets: Dataset[];
  activeId: string;
  onActivate: (id: string) => void;
  onDelete: (id: string) => void;
  onUpload: (file: File) => Promise<void>;
}

export function DataManager({ datasets, activeId, onActivate, onDelete, onUpload }: DataManagerProps) {
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
          {datasets.map((dataset) => {
            const isActive = dataset.id === activeId;
            const Icon = SOURCE_ICON[dataset.source];
            const colorClass = SOURCE_COLOR[dataset.source];

            return (
              <motion.div
                key={dataset.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={`relative flex flex-col rounded-xl border-2 bg-white p-5 shadow-panel transition-all dark:bg-slate-900 ${
                  isActive
                    ? 'border-que-teal shadow-que-teal/10'
                    : 'border-slate-200 dark:border-white/10'
                }`}
              >
                {/* Active badge */}
                {isActive && (
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-que-teal/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-que-teal">
                    <CheckCircle2 size={10} />
                    Activo
                  </div>
                )}

                {/* Source icon + badge */}
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl border p-3 ${colorClass}`}>
                    <Icon size={22} aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${colorClass}`}>
                        {SOURCE_LABEL[dataset.source]}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-sm font-bold text-ink dark:text-white" title={dataset.name}>
                      {dataset.name}
                    </p>
                  </div>
                </div>

                {/* Metadata */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-white/30">Registros</p>
                    <p className="mt-0.5 text-sm font-bold text-ink dark:text-white tabular-nums">
                      {dataset.calls.length.toLocaleString('es')}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-2 dark:bg-white/5">
                    <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400 dark:text-white/30">Cargado</p>
                    <p className="mt-0.5 text-xs font-bold text-ink dark:text-white leading-tight">
                      {dataset.loadedAt.toLocaleDateString('es', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-white/30 tabular-nums">
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
                      className={`group relative flex-1 overflow-hidden rounded-lg border py-2 text-xs font-semibold transition ${
                        dataset.id === 'demo'
                          ? 'cursor-default border-que-teal/30 bg-que-teal/5 text-que-teal'
                          : 'cursor-pointer border-que-teal/30 bg-que-teal/5 text-que-teal hover:border-rose-300 hover:bg-rose-50 hover:text-rose-500 dark:hover:border-rose-700 dark:hover:bg-rose-950/30 dark:hover:text-rose-400'
                      }`}
                    >
                      {/* Estado normal: En uso */}
                      <span className={`flex items-center justify-center gap-1.5 transition-opacity duration-150 ${dataset.id !== 'demo' ? 'group-hover:opacity-0' : ''}`}>
                        <CheckCircle2 size={12} aria-hidden="true" />
                        En uso
                      </span>
                      {/* Estado hover: Apagar */}
                      {dataset.id !== 'demo' && (
                        <span className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                          <Power size={12} aria-hidden="true" />
                          Apagar
                        </span>
                      )}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onActivate(dataset.id)}
                      className="flex-1 rounded-lg bg-ink py-2 text-xs font-semibold text-white transition hover:bg-slate-700 active:scale-95 dark:bg-white/10 dark:hover:bg-white/20"
                    >
                      Usar este
                    </button>
                  )}
                  {datasets.length > 1 && (
                    <button
                      type="button"
                      onClick={() => onDelete(dataset.id)}
                      title="Eliminar dataset"
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-white/10 dark:hover:border-rose-700 dark:hover:bg-rose-950/30 dark:hover:text-rose-400"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-all ${
          isDragging
            ? 'border-que-teal bg-que-teal/5 dark:bg-que-teal/10'
            : 'border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-white/5'
        }`}
      >
        <Upload
          size={32}
          className={`mx-auto mb-3 transition-colors ${isDragging ? 'text-que-teal' : 'text-slate-300 dark:text-white/20'}`}
          aria-hidden="true"
        />
        <p className="text-sm font-semibold text-slate-500 dark:text-white/50">
          {isDragging ? 'Suelta el archivo aquí' : 'Arrastra un .xlsx aquí o usa el botón Cargar Excel'}
        </p>
        <p className="mt-1 text-xs text-slate-400 dark:text-white/25">
          Formato .xlsx · Máximo 5 MB
        </p>

        {/* Download template */}
        <a
          href="/plantilla-queplus.xlsx"
          download="plantilla-queplus.xlsx"
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-que-teal/40 bg-que-teal/5 px-3 py-1.5 text-xs font-semibold text-que-teal transition hover:bg-que-teal/10"
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
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-[#11AEB3]/70">Columnas Vicidial (export directo)</p>
                  <div className="flex flex-wrap gap-1.5">
                    {EXPECTED_COLUMNS.slice(11).map((col) => (
                      <span key={col} className="rounded-md border border-[#11AEB3]/20 bg-[#11AEB3]/5 px-2 py-1 font-mono text-[10px] text-[#11AEB3] shadow-sm">
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
  );
}
