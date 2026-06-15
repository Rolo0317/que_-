import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BarChart3, RefreshCw, Settings } from 'lucide-react';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useSearchParams } from 'react-router-dom';
import { AgentView } from './components/AgentView';
import { BrandLogo } from './components/BrandLogo';
import { CalidadView } from './components/CalidadView';
import { CompareView } from './components/CompareView';
import { DataManager } from './components/DataManager';
import { DashboardFooter } from './components/DashboardFooter';
import { FileUploader } from './components/FileUploader';
import { OperacionesView } from './components/OperacionesView';
import { PeriodPicker } from './components/PeriodPicker';
import { ThemeToggle } from './components/ThemeToggle';
import { ThresholdConfig } from './components/ThresholdConfig';
import { ToastContainer } from './components/ToastContainer';
import { WfmView } from './components/WfmView';
import { WorldCupSplash } from './components/WorldCupSplash';
import { MODULES } from './config/modules';
import { sampleCalls } from './data/sampleCalls';
import { fetchHealth, fetchReport, uploadReport } from './lib/api';
import { parseExcelFile } from './lib/excel';
import {
  abandonByHour, agentDetailStats, agentScores, calculateMetrics,
  callsByHour, callsByQueue, callsByType, filterCalls, slaByHour,
} from './lib/metrics';
import { useKpiAlerts } from './lib/useKpiAlerts';
import { useThresholds } from './lib/useThresholds';
import { useToast } from './lib/ToastContext';
import { ReportBuilder } from './components/ReportBuilder';
import type { ChartId, ReportLayout } from './components/ReportBuilder';

const HourlyChart      = lazy(() => import('./components/Charts').then((m) => ({ default: m.HourlyChart })));
const TypeMixChart     = lazy(() => import('./components/Charts').then((m) => ({ default: m.TypeMixChart })));
const AgentScoreChart  = lazy(() => import('./components/Charts').then((m) => ({ default: m.AgentScoreChart })));
const SlaHourChart     = lazy(() => import('./components/Charts').then((m) => ({ default: m.SlaHourChart })));
const AbandonHourChart = lazy(() => import('./components/Charts').then((m) => ({ default: m.AbandonHourChart })));
const QueueChart       = lazy(() => import('./components/Charts').then((m) => ({ default: m.QueueChart })));

const ChartSkeleton = () => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel dark:border-white/10 dark:bg-white/10">
    <div className="h-72 animate-pulse rounded-md bg-slate-100 dark:bg-white/5" />
  </div>
);
import type { CallRecord } from './types/calls';
import type { Dataset } from './types/dataset';

// ─── Types ────────────────────────────────────────────────────────────────────
const typeFilters = ['Todos', 'Inbound', 'Outbound'] as const;
type TypeFilter = (typeof typeFilters)[number];
type Period = 'todos' | 'dia' | 'mes' | 'año';

const DEMO_DATASET: Dataset = {
  id: 'demo',
  name: 'Datos de muestra',
  calls: sampleCalls,
  loadedAt: new Date(),
  source: 'demo',
};

function splashKey() {
  return `wc-splash-shown-${new Date().toISOString().slice(0, 10)}`;
}

// ─── Period filter ────────────────────────────────────────────────────────────
function filterByPeriod(calls: CallRecord[], period: Period, value: string): CallRecord[] {
  if (period === 'todos' || !value) return calls;
  return calls.filter((c) => {
    if (!c.date) return false;
    if (period === 'dia') return c.date === value;
    if (period === 'mes') return c.date.slice(0, 7) === value;
    if (period === 'año') return c.date.slice(0, 4) === value;
    return true;
  });
}

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const shouldReduceMotion = useReducedMotion();
  const toast = useToast();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { thresholds, update: updateThresholds, reset: resetThresholds } = useThresholds();
  const isAgentes  = location.pathname === '/agentes';
  const isArchivos = location.pathname === '/archivos';

  // ── Splash ───────────────────────────────────────────────────────────────
  const [showSplash, setShowSplash] = useState(() => !localStorage.getItem(splashKey()));
  function closeSplash() {
    localStorage.setItem(splashKey(), '1');
    setShowSplash(false);
  }

  // ── Data ─────────────────────────────────────────────────────────────────
  const [datasets, setDatasets]               = useState<Dataset[]>([DEMO_DATASET]);
  const [activeDatasetId, setActiveDatasetId] = useState<string>('demo');
  const [compareId, setCompareId]             = useState<string | null>(null);
  const [apiStatus, setApiStatus]             = useState<'checking' | 'online' | 'offline'>('checking');

  // ── Theme ────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('theme-preference') as 'light' | 'dark' | null;
    if (saved) return saved;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme-preference', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // ── Filters from URL ─────────────────────────────────────────────────────
  const typeFilter  = (searchParams.get('type')   ?? 'Todos') as TypeFilter;
  const period      = (searchParams.get('period') ?? 'todos') as Period;
  const periodValue = searchParams.get('pv') ?? '';

  function setTypeFilter(v: TypeFilter) {
    setSearchParams((p) => { v === 'Todos' ? p.delete('type') : p.set('type', v); return p; }, { replace: true });
  }
  function setPeriod(v: Period) {
    setSearchParams((p) => {
      v === 'todos' ? p.delete('period') : p.set('period', v);
      p.delete('pv');
      return p;
    }, { replace: true });
  }
  function setPeriodValue(v: string) {
    setSearchParams((p) => { v ? p.set('pv', v) : p.delete('pv'); return p; }, { replace: true });
  }

  // ── Report builder state ─────────────────────────────────────────────────
  const [selectedCharts, setSelectedCharts] = useState<ChartId[]>(['hourly', 'mix', 'scores']);
  const [layout, setLayout]                 = useState<ReportLayout>('2');
  const [showThresholds, setShowThresholds] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────
  const activeDataset = useMemo(
    () => datasets.find((d) => d.id === activeDatasetId) ?? DEMO_DATASET,
    [datasets, activeDatasetId],
  );
  const activeCalls = useMemo(() => activeDataset.calls, [activeDataset]);

  const availableDays   = useMemo(() => [...new Set(activeCalls.map((c) => c.date).filter(Boolean))].sort().reverse() as string[], [activeCalls]);
  const availableMonths = useMemo(() => [...new Set(activeCalls.map((c) => c.date?.slice(0, 7)).filter(Boolean))].sort().reverse() as string[], [activeCalls]);
  const availableYears  = useMemo(() => [...new Set(activeCalls.map((c) => c.date?.slice(0, 4)).filter(Boolean))].sort().reverse() as string[], [activeCalls]);
  const hasDates = availableDays.length > 0;

  const periodCalls  = useMemo(() => filterByPeriod(activeCalls, period, periodValue), [activeCalls, period, periodValue]);
  const visibleCalls = useMemo(() => filterCalls(periodCalls, typeFilter), [periodCalls, typeFilter]);
  const metrics      = useMemo(() => calculateMetrics(visibleCalls), [visibleCalls]);

  const hourlyData  = useMemo(() => callsByHour(visibleCalls),   [visibleCalls]);
  const typeData    = useMemo(() => callsByType(visibleCalls),    [visibleCalls]);
  const scoreData   = useMemo(() => agentScores(visibleCalls),   [visibleCalls]);
  const slaData     = useMemo(() => slaByHour(visibleCalls),     [visibleCalls]);
  const abandonData = useMemo(() => abandonByHour(visibleCalls), [visibleCalls]);
  const queueData   = useMemo(() => callsByQueue(visibleCalls),  [visibleCalls]);
  const agentCount  = useMemo(() => new Set(visibleCalls.map((c) => c.agent)).size, [visibleCalls]);
  const agentStats  = useMemo(() => agentDetailStats(visibleCalls), [visibleCalls]);
  const kpiAlerts   = useKpiAlerts(visibleCalls);

  const statusText = `${activeDataset.name} · ${visibleCalls.length} de ${activeCalls.length} registros`;
  const fmt = (v: number) => `${(v * 100).toFixed(2)}%`;

  // ── API ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    fetchHealth()
      .then(() => { if (mounted) setApiStatus('online'); })
      .catch(() => { if (mounted) setApiStatus('offline'); });
    return () => { mounted = false; };
  }, []);

  function addDataset(dataset: Dataset) {
    setDatasets((p) => [...p, dataset]);
    setActiveDatasetId(dataset.id);
  }

  function deleteDataset(id: string) {
    setDatasets((p) => p.filter((d) => d.id !== id));
    if (activeDatasetId === id) setActiveDatasetId('demo');
  }

  async function handleFile(file: File) {
    const tryApi = apiStatus !== 'offline' && navigator.onLine;
    if (tryApi) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 1500);
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/health`, { signal: ctrl.signal });
        clearTimeout(timer);
        const report = await uploadReport(file, typeFilter);
        addDataset({ id: `api-${Date.now()}`, name: file.name.replace(/\.xlsx$/i, ''), calls: report.data, loadedAt: new Date(), source: 'api' });
        setApiStatus('online');
        toast.success(`Dataset "${file.name.replace(/\.xlsx$/i, '')}" cargado desde API`);
        return;
      } catch {
        setApiStatus('offline');
        toast.warning('Backend offline — usando parser local');
      }
    }
    const rows = await parseExcelFile(file);
    if (rows.length === 0) throw new Error('El archivo está vacío o no tiene filas de datos.');
    const allDefault = rows.every((r) => r.agent === 'Sin agente') || rows.every((r) => r.hour === 'Sin hora');
    if (allDefault) throw new Error(`${rows.length} filas cargadas pero los encabezados no coinciden.`);
    const name = file.name.replace(/\.xlsx$/i, '');
    addDataset({ id: `excel-${Date.now()}`, name, calls: rows, loadedAt: new Date(), source: 'excel' });
    toast.success(`"${name}" cargado · ${rows.length} registros`);
  }

  async function loadApiData() {
    try {
      const report = await fetchReport(typeFilter);
      const name = `API ${new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`;
      addDataset({ id: `api-${Date.now()}`, name, calls: report.data, loadedAt: new Date(), source: 'api' });
      toast.success(`Dataset API cargado · ${report.data.length} registros`);
    } catch {
      toast.error('No se pudo conectar al backend');
    }
  }


  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="relative min-h-screen bg-mist text-ink transition-colors dark:bg-[#07181c] dark:text-white">

        {/* Watermark */}
        <img src="/logo-que-plus.svg" alt="" aria-hidden="true"
          className="pointer-events-none absolute right-[-64px] top-8 hidden w-[360px] opacity-[0.04] dark:opacity-[0.07] xl:block" />

        {/* Splash Mundial */}
        <AnimatePresence>
          {showSplash && <WorldCupSplash onClose={closeSplash} />}
        </AnimatePresence>

        {/* ── Sidebar ── */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col items-center gap-3 bg-ink py-6 text-white lg:flex">
          <div className="flex flex-col items-center gap-1">
            <BrandLogo className="w-12" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">BPO</span>
          </div>
          <div className="h-px w-10 bg-white/10" />

          {MODULES.map(({ id, path, label, icon: Icon, abbr, kpiAlertKey }) => {
            const hasAlert = kpiAlertKey ? kpiAlerts[kpiAlertKey] : false;
            return (
              <NavLink
                key={id}
                to={path}
                title={label}
                aria-label={label}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 transition-all ${
                    isActive ? 'bg-que-teal/20 text-que-teal' : 'text-white/40 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                <Icon size={18} aria-hidden="true" />
                <span className="text-[8px] font-bold uppercase tracking-wider">{abbr}</span>
                {hasAlert && (
                  <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-rose-500" aria-label="KPI en rojo" />
                )}
              </NavLink>
            );
          })}

          <div className="h-px w-10 bg-white/10" />
          <button
            type="button"
            title="Constructor de informes"
            aria-label="Ir al constructor de informes"
            onClick={() => document.getElementById('report-builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-white/40 transition-all hover:bg-white/5 hover:text-white"
          >
            <BarChart3 size={18} aria-hidden="true" />
            <span className="text-[8px] font-bold uppercase tracking-wider">REP</span>
          </button>

          <div className="mt-auto">
            <div className="mb-4 h-px w-10 bg-white/10" />
            <img src="/logo-que-plus.svg" alt="" aria-hidden="true" className="w-8 opacity-10" />
          </div>
        </aside>

        {/* ── Main ── */}
        <main className="relative mx-auto max-w-7xl px-4 py-6 lg:ml-20 lg:px-8">

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
            className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-white/10 md:flex-row md:items-start md:justify-between"
          >
            <div className="min-w-0">
              <BrandLogo className="mb-2 w-36 lg:w-28" />
              <p className="text-sm font-semibold uppercase tracking-wide text-que-teal">BPO Analytics</p>
              <h1 className="mt-1 text-2xl font-semibold text-ink dark:text-white sm:text-3xl">Dashboard de call center</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="max-w-xs truncate text-slate-600 dark:text-white/60">{statusText}</span>
                <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium dark:border-white/10 dark:bg-white/10 dark:text-white">
                  <span className={`h-2 w-2 rounded-full ${
                    apiStatus === 'online' ? 'bg-que-teal' : apiStatus === 'offline' ? 'bg-coral' : 'bg-slate-300'
                  }`} />
                  API {apiStatus === 'online' ? 'online' : apiStatus === 'offline' ? 'offline' : 'verificando'}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2" data-no-print>
              <ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
              <button
                type="button"
                onClick={() => setShowThresholds((v) => !v)}
                title="Configurar umbrales"
                className={`flex h-10 items-center gap-2 rounded-md border px-3 text-sm font-medium shadow-sm transition ${
                  showThresholds
                    ? 'border-que-teal bg-que-teal/10 text-que-teal'
                    : 'border-slate-300 bg-white text-ink hover:border-que-teal dark:border-white/10 dark:bg-slate-900 dark:text-white'
                }`}
              >
                <Settings size={15} aria-hidden="true" />
                <span className="hidden sm:inline">Umbrales</span>
              </button>
              <button
                type="button"
                onClick={loadApiData}
                aria-label="Sincronizar desde API"
                className="flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-ink shadow-sm transition hover:border-que-teal dark:border-white/10 dark:bg-slate-900 dark:text-white"
              >
                <RefreshCw size={15} aria-hidden="true" />
                <span className="hidden sm:inline">API</span>
              </button>
              <FileUploader onFile={handleFile} />
            </div>
          </motion.header>

          {/* Threshold config panel */}
          <AnimatePresence>
            {showThresholds && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="mt-4"
                data-no-print
              >
                <ThresholdConfig
                  thresholds={thresholds}
                  onUpdate={updateThresholds}
                  onReset={resetThresholds}
                  onClose={() => setShowThresholds(false)}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Module tabs */}
          <div className="mt-5 overflow-x-auto pb-1" data-no-print>
            <div className="flex w-max items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-900">
              {MODULES.map(({ id, path, label, icon: Icon, kpiAlertKey }) => {
                const hasAlert = kpiAlertKey ? kpiAlerts[kpiAlertKey] : false;
                return (
                  <NavLink
                    key={id}
                    to={path}
                    className={({ isActive }) =>
                      `relative flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
                        isActive ? 'bg-ink text-white shadow dark:bg-que-teal' : 'text-slate-500 hover:text-ink dark:text-white/50 dark:hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={14} aria-hidden="true" />
                        {label}
                        {id === 'archivos' && datasets.length > 1 && (
                          <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/40'
                          }`}>
                            {datasets.length}
                          </span>
                        )}
                        {hasAlert && !isActive && (
                          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" aria-label="KPI en rojo" />
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Filters row */}
          {!isArchivos && (
            <div className="mt-3 flex flex-wrap items-center gap-2" data-no-print>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-ink shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white"
                aria-label="Filtrar por tipo"
              >
                {typeFilters.map((f) => <option key={f}>{f}</option>)}
              </select>

              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                disabled={!hasDates}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-ink shadow-sm disabled:opacity-40 dark:border-white/10 dark:bg-slate-900 dark:text-white"
                aria-label="Filtrar por período"
              >
                <option value="todos">Todo el período</option>
                <option value="dia">Por día</option>
                <option value="mes">Por mes</option>
                <option value="año">Por año</option>
              </select>

              {hasDates && (
                <PeriodPicker
                  period={period}
                  value={periodValue}
                  availableDays={availableDays}
                  availableMonths={availableMonths}
                  availableYears={availableYears}
                  onChange={setPeriodValue}
                />
              )}

              {period !== 'todos' && periodValue && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-que-teal/10 px-3 py-1 text-xs font-semibold text-que-teal">
                  {period === 'dia' ? 'Día' : period === 'mes' ? 'Mes' : 'Año'}: {periodValue}
                  <button type="button" onClick={() => setPeriodValue('')} className="ml-0.5 hover:text-ink">×</button>
                </span>
              )}

              <span className="text-xs text-slate-400 dark:text-white/30">{visibleCalls.length} registros</span>
            </div>
          )}

          {/* ── Routes ── */}
          <Routes>
            <Route path="/" element={<Navigate to="/operaciones" replace />} />

            <Route
              path="/wfm"
              element={
                <motion.div key="wfm" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <WfmView calls={visibleCalls} thresholds={thresholds} />
                </motion.div>
              }
            />

            <Route
              path="/operaciones"
              element={
                <motion.div key="operaciones" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <OperacionesView calls={visibleCalls} thresholds={thresholds} />
                </motion.div>
              }
            />

            <Route
              path="/calidad"
              element={
                <motion.div key="calidad" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  <CalidadView calls={visibleCalls} thresholds={thresholds} />
                </motion.div>
              }
            />

            <Route
              path="/agentes"
              element={
                <motion.div key="agentes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                  <AgentView stats={agentStats} />
                </motion.div>
              }
            />

            <Route
              path="/archivos"
              element={
                <motion.div key="archivos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mt-6 space-y-6">
                  <DataManager
                    datasets={datasets}
                    activeId={activeDatasetId}
                    onActivate={setActiveDatasetId}
                    onDelete={(id) => { deleteDataset(id); if (compareId === id) setCompareId(null); }}
                    onUpload={handleFile}
                  />
                  {datasets.length >= 2 && (
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel dark:border-white/10 dark:bg-slate-900">
                      <h3 className="mb-3 text-sm font-bold text-ink dark:text-white">Comparar datasets</h3>
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-white/50">
                          <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-que-teal" />
                          {activeDataset.name}
                          <span className="text-slate-300 dark:text-white/20">vs</span>
                        </div>
                        <select
                          value={compareId ?? ''}
                          onChange={(e) => setCompareId(e.target.value || null)}
                          className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-ink shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white"
                        >
                          <option value="">— Seleccionar dataset —</option>
                          {datasets.filter((d) => d.id !== activeDatasetId).map((d) => (
                            <option key={d.id} value={d.id}>{d.name}</option>
                          ))}
                        </select>
                        {compareId && (
                          <button type="button" onClick={() => setCompareId(null)} className="text-xs text-slate-400 hover:text-rose-500">
                            × Cerrar
                          </button>
                        )}
                      </div>
                      {compareId && (() => {
                        const dsB = datasets.find((d) => d.id === compareId);
                        return dsB ? <CompareView datasetA={activeDataset} datasetB={dsB} onClose={() => setCompareId(null)} /> : null;
                      })()}
                    </div>
                  )}
                </motion.div>
              }
            />

            <Route path="*" element={<Navigate to="/operaciones" replace />} />
          </Routes>

          {/* ── Shared chart grid (all analytics modules) ── */}
          {!isAgentes && !isArchivos && (
            <>
              <div id="report-builder" className="mt-8" data-no-print>
                <ReportBuilder
                  selected={selectedCharts}
                  onChange={setSelectedCharts}
                  layout={layout}
                  onLayoutChange={setLayout}
                />
              </div>

              <section className={`mt-6 ${layout === '3' ? 'grid gap-6 md:grid-cols-2 xl:grid-cols-3' : 'grid gap-6 xl:grid-cols-2'}`}>
                <Suspense fallback={<ChartSkeleton />}>
                  {selectedCharts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center dark:border-white/10 dark:bg-white/5">
                      <BarChart3 size={40} className="mb-3 text-slate-300 dark:text-white/20" aria-hidden="true" />
                      <p className="text-sm font-semibold text-slate-500 dark:text-white/40">Ninguna gráfica seleccionada</p>
                      <button
                        type="button"
                        onClick={() => setSelectedCharts(['hourly', 'mix', 'scores'])}
                        className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-ink shadow-sm transition hover:border-que-teal dark:border-white/10 dark:bg-white/10 dark:text-white"
                      >
                        Restaurar por defecto
                      </button>
                    </div>
                  ) : (
                    <>
                      {selectedCharts.includes('hourly')      && <HourlyChart data={hourlyData} />}
                      {selectedCharts.includes('mix')         && <TypeMixChart data={typeData} />}
                      {selectedCharts.includes('scores')      && <AgentScoreChart data={scoreData} />}
                      {selectedCharts.includes('slaHour')     && <SlaHourChart data={slaData} />}
                      {selectedCharts.includes('abandonHour') && <AbandonHourChart data={abandonData} />}
                      {selectedCharts.includes('queues')      && <QueueChart data={queueData} />}
                    </>
                  )}
                </Suspense>
              </section>
            </>
          )}

          <DashboardFooter totalCalls={metrics.total} agentCount={agentCount} slaPercent={fmt(metrics.serviceLevel)} />
        </main>

        <ToastContainer />
      </div>
    </div>
  );
}

export default App;
