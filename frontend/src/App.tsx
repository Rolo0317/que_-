import { BarChart3, Database, RefreshCw, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { BrandLogo } from './components/BrandLogo';
import { DataManager } from './components/DataManager';
import { DashboardFooter } from './components/DashboardFooter';
import { FileUploader } from './components/FileUploader';
import { KpiCard } from './components/KpiCard';
import type { KpiStatus } from './components/KpiCard';
import { ReportBuilder } from './components/ReportBuilder';
import type { ChartId, ReportLayout } from './components/ReportBuilder';
import { ThemeToggle } from './components/ThemeToggle';
import { sampleCalls } from './data/sampleCalls';
import { fetchHealth, fetchReport, uploadReport } from './lib/api';
import { parseExcelFile } from './lib/excel';
import {
  abandonByHour,
  agentScores,
  calculateMetrics,
  callsByHour,
  callsByQueue,
  callsByType,
  filterCalls,
  slaByHour,
} from './lib/metrics';
import type { Dataset } from './types/dataset';

// ─── Types ────────────────────────────────────────────────────────────────────
const filters = ['Todos', 'Inbound', 'Outbound'] as const;
type CallFilter = (typeof filters)[number];
type Module = 'wfm' | 'operaciones' | 'calidad' | 'archivos';

// ─── Chart components (lazy) ──────────────────────────────────────────────────
const HourlyChart      = lazy(() => import('./components/Charts').then((m) => ({ default: m.HourlyChart })));
const TypeMixChart     = lazy(() => import('./components/Charts').then((m) => ({ default: m.TypeMixChart })));
const AgentScoreChart  = lazy(() => import('./components/Charts').then((m) => ({ default: m.AgentScoreChart })));
const SlaHourChart     = lazy(() => import('./components/Charts').then((m) => ({ default: m.SlaHourChart })));
const AbandonHourChart = lazy(() => import('./components/Charts').then((m) => ({ default: m.AbandonHourChart })));
const QueueChart       = lazy(() => import('./components/Charts').then((m) => ({ default: m.QueueChart })));

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt  = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmtS = (s: number) => `${Math.round(s)} s`;
const pct    = (v: number, g: number, w: number): KpiStatus => v >= g ? 'good' : v >= w ? 'warning' : 'bad';
const pctInv = (v: number, g: number, w: number): KpiStatus => v <= g ? 'good' : v <= w ? 'warning' : 'bad';
const secInv = (v: number, g: number, w: number): KpiStatus => v <= g ? 'good' : v <= w ? 'warning' : 'bad';
const occupancy = (v: number): KpiStatus =>
  v >= 0.75 && v <= 0.9 ? 'good' : v >= 0.6 && v <= 0.95 ? 'warning' : 'neutral';

// ─── Module config ────────────────────────────────────────────────────────────
const modules: { id: Module; label: string; icon: typeof Users; abbr: string }[] = [
  { id: 'wfm',         label: 'WFM',        icon: Users,       abbr: 'WFM' },
  { id: 'operaciones', label: 'Operaciones', icon: TrendingUp,  abbr: 'OPS' },
  { id: 'calidad',     label: 'Calidad',     icon: ShieldCheck, abbr: 'QA' },
  { id: 'archivos',    label: 'Archivos',    icon: Database,    abbr: 'DAT' },
];

// ─── Demo dataset (constant, never deleted) ───────────────────────────────────
const DEMO_DATASET: Dataset = {
  id: 'demo',
  name: 'Datos de muestra',
  calls: sampleCalls,
  loadedAt: new Date(),
  source: 'demo',
};

// ─── Skeletons ────────────────────────────────────────────────────────────────
const ChartSkeleton = () => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel dark:border-white/10 dark:bg-white/10">
    <div className="h-72 animate-pulse rounded-md bg-slate-100 dark:bg-white/5" />
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const shouldReduceMotion = useReducedMotion();

  // Data management
  const [datasets, setDatasets]           = useState<Dataset[]>([DEMO_DATASET]);
  const [activeDatasetId, setActiveDatasetId] = useState<string>('demo');

  // UI state
  const [filter, setFilter]               = useState<CallFilter>('Todos');
  const [activeModule, setActiveModule]   = useState<Module>('wfm');
  const [selectedCharts, setSelectedCharts] = useState<ChartId[]>(['hourly', 'mix', 'scores']);
  const [layout, setLayout]               = useState<ReportLayout>('2');
  const [apiStatus, setApiStatus]         = useState<'checking' | 'online' | 'offline'>('checking');
  const [theme, setTheme]                 = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('theme-preference') as 'light' | 'dark' | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme-preference', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // ─── Derived data ──────────────────────────────────────────────────────────
  const activeDataset  = useMemo(
    () => datasets.find((d) => d.id === activeDatasetId) ?? DEMO_DATASET,
    [datasets, activeDatasetId],
  );
  const activeCalls    = useMemo(() => activeDataset.calls, [activeDataset]);
  const visibleCalls   = useMemo(() => filterCalls(activeCalls, filter), [activeCalls, filter]);
  const metrics        = useMemo(() => calculateMetrics(visibleCalls), [visibleCalls]);
  const hourlyData     = useMemo(() => callsByHour(visibleCalls), [visibleCalls]);
  const typeData       = useMemo(() => callsByType(visibleCalls), [visibleCalls]);
  const scoreData      = useMemo(() => agentScores(visibleCalls), [visibleCalls]);
  const slaData        = useMemo(() => slaByHour(visibleCalls), [visibleCalls]);
  const abandonData    = useMemo(() => abandonByHour(visibleCalls), [visibleCalls]);
  const queueData      = useMemo(() => callsByQueue(visibleCalls), [visibleCalls]);
  const agentCount     = useMemo(() => new Set(visibleCalls.map((c) => c.agent)).size, [visibleCalls]);

  // Status line derived from active dataset
  const statusText = `${activeDataset.name} · ${visibleCalls.length} registros visibles`;

  // ─── KPI arrays ────────────────────────────────────────────────────────────
  const wfmKpis = useMemo(() => [
    { label: 'Ocupacion',   value: fmt(metrics.occupancy),   helper: 'Talk / disponible',    target: 'Meta: 80–85%', status: occupancy(metrics.occupancy) },
    { label: 'Utilizacion', value: fmt(metrics.utilization), helper: 'Productivo / login',   target: 'Meta: >85%',   status: pct(metrics.utilization, 0.85, 0.75) },
    { label: 'Shrinkage',   value: fmt(metrics.shrinkage),   helper: 'Fuera de produccion',  target: 'Meta: <25%',   status: pctInv(metrics.shrinkage, 0.25, 0.35) },
    { label: 'Adherencia',  value: fmt(metrics.adherence),   helper: 'Horario plan vs real',  target: 'Meta: >95%',  status: pct(metrics.adherence, 0.95, 0.90) },
    { label: 'Asistencia',  value: fmt(metrics.attendance),  helper: 'Presencia programada',  target: 'Meta: >95%',  status: pct(metrics.attendance, 0.95, 0.90) },
  ], [metrics]);

  const operacionesKpis = useMemo(() => [
    { label: 'Total llamadas', value: metrics.total,                       helper: 'Registros filtrados',  status: 'neutral' as KpiStatus },
    { label: 'Inbound',        value: metrics.inbound,                     helper: 'Entrantes',            status: 'neutral' as KpiStatus },
    { label: 'Outbound',       value: metrics.outbound,                    helper: 'Salientes',            status: 'neutral' as KpiStatus },
    { label: 'SLA',            value: fmt(metrics.serviceLevel),           helper: 'Contestadas a tiempo', target: 'Meta: >80%',  status: pct(metrics.serviceLevel, 0.80, 0.70) },
    { label: 'Abandono',       value: fmt(metrics.abandonRate),            helper: 'Sobre total',          target: 'Meta: <5%',   status: pctInv(metrics.abandonRate, 0.05, 0.10) },
    { label: 'ASA',            value: fmtS(metrics.avgSpeedAnswer),        helper: 'Espera promedio',      target: 'Meta: <30 s', status: secInv(metrics.avgSpeedAnswer, 30, 60) },
    { label: 'AHT / TMO',      value: fmtS(metrics.avgDuration),          helper: 'Duracion media',        status: 'neutral' as KpiStatus },
  ], [metrics]);

  const calidadKpis = useMemo(() => [
    { label: 'FCR',            value: fmt(metrics.firstContactResolution), helper: 'Resuelto primer contacto', target: 'Meta: >80%',  status: pct(metrics.firstContactResolution, 0.80, 0.70) },
    { label: 'Transferencias', value: fmt(metrics.transferRate),           helper: 'Derivaciones',             target: 'Meta: <10%', status: pctInv(metrics.transferRate, 0.10, 0.20) },
    { label: 'QA Score',       value: metrics.avgQaScore.toFixed(1),       helper: 'Calidad (0–100)',           target: 'Meta: >85',   status: pct(metrics.avgQaScore / 100, 0.85, 0.75) },
    { label: 'Satisfaccion',   value: metrics.avgScore.toFixed(2),         helper: 'Escala 1 a 5',             target: 'Meta: >4.0',  status: pct(metrics.avgScore / 5, 0.80, 0.70) },
  ], [metrics]);

  const activeKpis = activeModule === 'wfm' ? wfmKpis
    : activeModule === 'operaciones' ? operacionesKpis
    : calidadKpis;

  // ─── Effects ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    fetchHealth()
      .then(() => { if (mounted) setApiStatus('online'); })
      .catch(() => { if (mounted) setApiStatus('offline'); });
    return () => { mounted = false; };
  }, []);

  // ─── Dataset actions ───────────────────────────────────────────────────────
  function addDataset(dataset: Dataset) {
    setDatasets((prev) => [...prev, dataset]);
    setActiveDatasetId(dataset.id);
  }

  function deleteDataset(id: string) {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    if (activeDatasetId === id) setActiveDatasetId('demo');
  }

  // ─── File handling ─────────────────────────────────────────────────────────
  async function handleFile(file: File) {
    try {
      const report = await uploadReport(file, filter);
      addDataset({
        id: `api-${Date.now()}`,
        name: file.name.replace(/\.xlsx$/i, ''),
        calls: report.data,
        loadedAt: new Date(),
        source: 'api',
      });
      setApiStatus('online');
    } catch {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) throw new Error('El archivo está vacío o no tiene filas de datos.');

      const allDefaultAgents = rows.every((r) => r.agent === 'Sin agente');
      const allDefaultHours  = rows.every((r) => r.hour  === 'Sin hora');
      if (allDefaultAgents || allDefaultHours) {
        throw new Error(
          `${rows.length} filas cargadas pero los encabezados no coinciden. Verifica el formato del Excel.`,
        );
      }
      addDataset({
        id: `excel-${Date.now()}`,
        name: file.name.replace(/\.xlsx$/i, ''),
        calls: rows,
        loadedAt: new Date(),
        source: 'excel',
      });
      setApiStatus('offline');
    }
  }

  async function loadApiData() {
    try {
      const report = await fetchReport(filter);
      addDataset({
        id: `api-${Date.now()}`,
        name: `API ${new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`,
        calls: report.data,
        loadedAt: new Date(),
        source: 'api',
      });
    } catch {
      // silent — API offline is already shown in the pill
    }
  }

  // ─── Layout ────────────────────────────────────────────────────────────────
  const gridClass = layout === '3'
    ? 'grid gap-6 md:grid-cols-2 xl:grid-cols-3'
    : 'grid gap-6 xl:grid-cols-2';

  const isAnalyticsModule = activeModule !== 'archivos';

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="relative min-h-screen bg-mist text-ink transition-colors dark:bg-[#07181c] dark:text-white">

        {/* Decorative watermark */}
        <img
          src="/logo-que-plus.svg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute right-[-64px] top-8 hidden w-[360px] opacity-[0.04] dark:opacity-[0.07] xl:block"
        />

        {/* ── Sidebar (desktop only) ── */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col items-center gap-3 bg-ink py-6 text-white lg:flex">
          {/* Logo */}
          <div className="flex flex-col items-center gap-1">
            <BrandLogo className="w-12" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">BPO</span>
          </div>
          <div className="h-px w-10 bg-white/10" />

          {/* Module navigation — only sets activeModule, no scroll */}
          {modules.map(({ id, label, icon: Icon, abbr }) => {
            const active = activeModule === id;
            return (
              <button
                key={id}
                type="button"
                title={label}
                aria-label={label}
                onClick={() => setActiveModule(id)}
                className={`flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 transition-all ${
                  active
                    ? 'bg-que-teal/20 text-que-teal'
                    : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={20} aria-hidden="true" />
                <span className="text-[8px] font-bold uppercase tracking-wider">{abbr}</span>
              </button>
            );
          })}

          <div className="h-px w-10 bg-white/10" />

          {/* Scroll to report builder */}
          <button
            type="button"
            title="Constructor de informes"
            aria-label="Ir al constructor de informes"
            onClick={() => document.getElementById('report-builder')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="flex flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-white/40 transition-all hover:bg-white/5 hover:text-white"
          >
            <BarChart3 size={20} aria-hidden="true" />
            <span className="text-[8px] font-bold uppercase tracking-wider">REP</span>
          </button>

          {/* Bottom watermark */}
          <div className="mt-auto">
            <div className="mb-4 h-px w-10 bg-white/10" />
            <img src="/logo-que-plus.svg" alt="" aria-hidden="true" className="w-8 opacity-10" />
          </div>
        </aside>

        {/* ── Main content ── */}
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
                <span className="truncate text-slate-600 dark:text-white/60">{statusText}</span>
                <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium dark:border-white/10 dark:bg-white/10 dark:text-white">
                  <span className={`h-2 w-2 rounded-full ${
                    apiStatus === 'online' ? 'bg-que-teal' : apiStatus === 'offline' ? 'bg-coral' : 'bg-slate-300'
                  }`} />
                  API {apiStatus === 'online' ? 'online' : apiStatus === 'offline' ? 'offline' : 'verificando'}
                </span>
              </div>
            </div>

            {/* Header controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3" data-no-print>
              <ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
              <select
                className="h-10 min-w-0 rounded-md border border-slate-300 bg-white px-3 text-sm text-ink shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white sm:h-11"
                value={filter}
                onChange={(e) => setFilter(e.target.value as CallFilter)}
                aria-label="Filtrar tipo de llamada"
              >
                {filters.map((f) => <option key={f}>{f}</option>)}
              </select>
              <button
                type="button"
                onClick={loadApiData}
                aria-label="Cargar datos desde la API"
                className="flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-ink shadow-sm transition hover:border-que-teal dark:border-white/10 dark:bg-slate-900 dark:text-white sm:h-11"
              >
                <RefreshCw size={16} aria-hidden="true" />
                <span className="hidden sm:inline">Sincronizar API</span>
                <span className="sm:hidden">API</span>
              </button>
              {/* Quick upload — visible in any module */}
              <FileUploader onFile={handleFile} />
            </div>
          </motion.header>

          {/* Module tabs */}
          <div
            className="mt-5 flex flex-wrap items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:w-fit"
            data-no-print
          >
            {modules.map(({ id, label, icon: Icon }) => {
              const active = activeModule === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveModule(id)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all sm:px-4 sm:gap-2 ${
                    active
                      ? 'bg-ink text-white shadow dark:bg-que-teal'
                      : 'text-slate-500 hover:text-ink dark:text-white/50 dark:hover:text-white'
                  }`}
                >
                  <Icon size={14} aria-hidden="true" />
                  <span className="hidden sm:inline">{label}</span>
                  <span className="sm:hidden">{id === 'operaciones' ? 'Ops' : id === 'archivos' ? 'Arch' : label}</span>
                  {id === 'archivos' && datasets.length > 1 && (
                    <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/50'
                    }`}>
                      {datasets.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ═══ ARCHIVOS MODULE ═══════════════════════════════════════════════ */}
          {activeModule === 'archivos' && (
            <motion.div
              key="archivos"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6"
            >
              <DataManager
                datasets={datasets}
                activeId={activeDatasetId}
                onActivate={setActiveDatasetId}
                onDelete={deleteDataset}
                onUpload={handleFile}
              />
            </motion.div>
          )}

          {/* ═══ ANALYTICS MODULES (WFM / OPS / CALIDAD) ══════════════════════ */}
          {isAnalyticsModule && (
            <motion.div
              key={activeModule}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Module description */}
              <div className="mt-4 mb-5" data-no-print>
                {activeModule === 'wfm' && (
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    Fuerza laboral — ocupacion, utilizacion, shrinkage, adherencia y asistencia.
                  </p>
                )}
                {activeModule === 'operaciones' && (
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    Volumen y servicio — llamadas, SLA, abandono, velocidad de respuesta y duracion media.
                  </p>
                )}
                {activeModule === 'calidad' && (
                  <p className="text-xs text-slate-500 dark:text-white/50">
                    Calidad — FCR, tasa de transferencias, QA score y satisfaccion del cliente.
                  </p>
                )}
              </div>

              {/* KPI cards */}
              <section id="kpi-section" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activeKpis.map((kpi, i) => (
                  <KpiCard
                    key={kpi.label}
                    label={kpi.label}
                    value={kpi.value}
                    helper={kpi.helper}
                    target={kpi.target}
                    status={kpi.status}
                    index={i}
                  />
                ))}
              </section>

              {/* Semaphore legend */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-white/50" data-no-print>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Cumple meta</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> En riesgo</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Fuera de meta</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-que-teal" /> Referencial</span>
              </div>

              {/* Report builder */}
              <div id="report-builder" className="mt-8" data-no-print>
                <ReportBuilder
                  selected={selectedCharts}
                  onChange={setSelectedCharts}
                  layout={layout}
                  onLayoutChange={setLayout}
                />
              </div>

              {/* Chart grid */}
              <section className={`mt-6 ${gridClass}`}>
                <Suspense fallback={<ChartSkeleton />}>
                  {selectedCharts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center dark:border-white/10 dark:bg-white/5">
                      <BarChart3 size={40} className="mb-3 text-slate-300 dark:text-white/20" aria-hidden="true" />
                      <p className="text-sm font-semibold text-slate-500 dark:text-white/40">Ninguna gráfica seleccionada</p>
                      <p className="mt-1 text-xs text-slate-400 dark:text-white/25">Activa al menos una desde el constructor de informes</p>
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
            </motion.div>
          )}

          <DashboardFooter
            totalCalls={metrics.total}
            agentCount={agentCount}
            slaPercent={fmt(metrics.serviceLevel)}
          />
        </main>
      </div>
    </div>
  );
}

export default App;
