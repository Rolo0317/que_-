import { BarChart3, Database, RefreshCw, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AgentView } from './components/AgentView';
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
  agentDetailStats,
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
const typeFilters = ['Todos', 'Inbound', 'Outbound'] as const;
type TypeFilter = (typeof typeFilters)[number];
type Period = 'todos' | 'dia' | 'mes' | 'año';
type Module = 'wfm' | 'operaciones' | 'calidad' | 'agentes' | 'archivos';

// ─── Lazy chart components ────────────────────────────────────────────────────
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

// ─── Period filter ────────────────────────────────────────────────────────────
import type { CallRecord } from './types/calls';
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

// ─── Module config ────────────────────────────────────────────────────────────
const modules: { id: Module; label: string; icon: typeof Users; abbr: string }[] = [
  { id: 'wfm',         label: 'WFM',        icon: Users,       abbr: 'WFM' },
  { id: 'operaciones', label: 'Operaciones', icon: TrendingUp,  abbr: 'OPS' },
  { id: 'calidad',     label: 'Calidad',     icon: ShieldCheck, abbr: 'QA' },
  { id: 'agentes',     label: 'Agentes',     icon: Users,       abbr: 'AGT' },
  { id: 'archivos',    label: 'Archivos',    icon: Database,    abbr: 'DAT' },
];

const DEMO_DATASET: Dataset = {
  id: 'demo',
  name: 'Datos de muestra',
  calls: sampleCalls,
  loadedAt: new Date(),
  source: 'demo',
};

const ChartSkeleton = () => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel dark:border-white/10 dark:bg-white/10">
    <div className="h-72 animate-pulse rounded-md bg-slate-100 dark:bg-white/5" />
  </div>
);

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
  const shouldReduceMotion = useReducedMotion();

  // Data
  const [datasets, setDatasets]               = useState<Dataset[]>([DEMO_DATASET]);
  const [activeDatasetId, setActiveDatasetId] = useState<string>('demo');

  // Filters
  const [typeFilter, setTypeFilter]   = useState<TypeFilter>('Todos');
  const [period, setPeriod]           = useState<Period>('todos');
  const [periodValue, setPeriodValue] = useState<string>('');

  // UI
  const [activeModule, setActiveModule]     = useState<Module>('wfm');
  const [selectedCharts, setSelectedCharts] = useState<ChartId[]>(['hourly', 'mix', 'scores']);
  const [layout, setLayout]                 = useState<ReportLayout>('2');
  const [apiStatus, setApiStatus]           = useState<'checking' | 'online' | 'offline'>('checking');
  const [theme, setTheme]                   = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('theme-preference') as 'light' | 'dark' | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme-preference', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Reset period value when period type changes
  useEffect(() => { setPeriodValue(''); }, [period]);

  // ─── Derived ───────────────────────────────────────────────────────────────
  const activeDataset = useMemo(
    () => datasets.find((d) => d.id === activeDatasetId) ?? DEMO_DATASET,
    [datasets, activeDatasetId],
  );
  const activeCalls  = useMemo(() => activeDataset.calls, [activeDataset]);

  // Available period values in current dataset
  const availableDays   = useMemo(() => [...new Set(activeCalls.map((c) => c.date).filter(Boolean))].sort().reverse() as string[], [activeCalls]);
  const availableMonths = useMemo(() => [...new Set(activeCalls.map((c) => c.date?.slice(0, 7)).filter(Boolean))].sort().reverse() as string[], [activeCalls]);
  const availableYears  = useMemo(() => [...new Set(activeCalls.map((c) => c.date?.slice(0, 4)).filter(Boolean))].sort().reverse() as string[], [activeCalls]);
  const hasDates = availableDays.length > 0;

  const periodCalls  = useMemo(() => filterByPeriod(activeCalls, period, periodValue), [activeCalls, period, periodValue]);
  const visibleCalls = useMemo(() => filterCalls(periodCalls, typeFilter), [periodCalls, typeFilter]);
  const metrics      = useMemo(() => calculateMetrics(visibleCalls), [visibleCalls]);
  const hourlyData   = useMemo(() => callsByHour(visibleCalls), [visibleCalls]);
  const typeData     = useMemo(() => callsByType(visibleCalls), [visibleCalls]);
  const scoreData    = useMemo(() => agentScores(visibleCalls), [visibleCalls]);
  const slaData      = useMemo(() => slaByHour(visibleCalls), [visibleCalls]);
  const abandonData  = useMemo(() => abandonByHour(visibleCalls), [visibleCalls]);
  const queueData    = useMemo(() => callsByQueue(visibleCalls), [visibleCalls]);
  const agentCount   = useMemo(() => new Set(visibleCalls.map((c) => c.agent)).size, [visibleCalls]);
  const agentStats   = useMemo(() => agentDetailStats(visibleCalls), [visibleCalls]);

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

  // ─── API ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    fetchHealth()
      .then(() => { if (mounted) setApiStatus('online'); })
      .catch(() => { if (mounted) setApiStatus('offline'); });
    return () => { mounted = false; };
  }, []);

  function addDataset(dataset: Dataset) {
    setDatasets((prev) => [...prev, dataset]);
    setActiveDatasetId(dataset.id);
  }

  function deleteDataset(id: string) {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
    if (activeDatasetId === id) setActiveDatasetId('demo');
  }

  async function handleFile(file: File) {
    try {
      const report = await uploadReport(file, typeFilter);
      addDataset({ id: `api-${Date.now()}`, name: file.name.replace(/\.xlsx$/i, ''), calls: report.data, loadedAt: new Date(), source: 'api' });
      setApiStatus('online');
    } catch {
      const rows = await parseExcelFile(file);
      if (rows.length === 0) throw new Error('El archivo está vacío o no tiene filas de datos.');
      const allDefault = rows.every((r) => r.agent === 'Sin agente') || rows.every((r) => r.hour === 'Sin hora');
      if (allDefault) throw new Error(`${rows.length} filas cargadas pero los encabezados no coinciden.`);
      addDataset({ id: `excel-${Date.now()}`, name: file.name.replace(/\.xlsx$/i, ''), calls: rows, loadedAt: new Date(), source: 'excel' });
      setApiStatus('offline');
    }
  }

  async function loadApiData() {
    try {
      const report = await fetchReport(typeFilter);
      addDataset({
        id: `api-${Date.now()}`,
        name: `API ${new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}`,
        calls: report.data,
        loadedAt: new Date(),
        source: 'api',
      });
    } catch { /* API offline — pill lo muestra */ }
  }

  const gridClass = layout === '3' ? 'grid gap-6 md:grid-cols-2 xl:grid-cols-3' : 'grid gap-6 xl:grid-cols-2';
  const isAnalytics = activeModule === 'wfm' || activeModule === 'operaciones' || activeModule === 'calidad';
  const statusText = `${activeDataset.name} · ${visibleCalls.length} de ${activeCalls.length} registros`;

  // ─── Period picker ─────────────────────────────────────────────────────────
  const PeriodPicker = () => {
    if (!hasDates || period === 'todos') return null;
    if (period === 'dia') return (
      <select
        value={periodValue}
        onChange={(e) => setPeriodValue(e.target.value)}
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-ink shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white"
        aria-label="Seleccionar día"
      >
        <option value="">Todos los días</option>
        {availableDays.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
    );
    if (period === 'mes') return (
      <select
        value={periodValue}
        onChange={(e) => setPeriodValue(e.target.value)}
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-ink shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white"
        aria-label="Seleccionar mes"
      >
        <option value="">Todos los meses</option>
        {availableMonths.map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    );
    if (period === 'año') return (
      <select
        value={periodValue}
        onChange={(e) => setPeriodValue(e.target.value)}
        className="h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-ink shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white"
        aria-label="Seleccionar año"
      >
        <option value="">Todos los años</option>
        {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    );
    return null;
  };

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <div className="relative min-h-screen bg-mist text-ink transition-colors dark:bg-[#07181c] dark:text-white">

        {/* Watermark */}
        <img src="/logo-que-plus.svg" alt="" aria-hidden="true"
          className="pointer-events-none absolute right-[-64px] top-8 hidden w-[360px] opacity-[0.04] dark:opacity-[0.07] xl:block" />

        {/* ── Sidebar ── */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col items-center gap-3 bg-ink py-6 text-white lg:flex">
          <div className="flex flex-col items-center gap-1">
            <BrandLogo className="w-12" />
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">BPO</span>
          </div>
          <div className="h-px w-10 bg-white/10" />
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
                  active ? 'bg-que-teal/20 text-que-teal' : 'text-white/40 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} aria-hidden="true" />
                <span className="text-[8px] font-bold uppercase tracking-wider">{abbr}</span>
              </button>
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

          {/* Module tabs */}
          <div className="mt-5 overflow-x-auto pb-1" data-no-print>
            <div className="flex w-max items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-900">
              {modules.map(({ id, label, icon: Icon }) => {
                const active = activeModule === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveModule(id)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap transition-all ${
                      active ? 'bg-ink text-white shadow dark:bg-que-teal' : 'text-slate-500 hover:text-ink dark:text-white/50 dark:hover:text-white'
                    }`}
                  >
                    <Icon size={14} aria-hidden="true" />
                    {label}
                    {id === 'archivos' && datasets.length > 1 && (
                      <span className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/40'
                      }`}>
                        {datasets.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters row — visible in analytics + agentes */}
          {activeModule !== 'archivos' && (
            <div className="mt-3 flex flex-wrap items-center gap-2" data-no-print>
              {/* Type filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-ink shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white"
                aria-label="Filtrar por tipo"
              >
                {typeFilters.map((f) => <option key={f}>{f}</option>)}
              </select>

              {/* Period type */}
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

              <PeriodPicker />

              {/* Active filter indicator */}
              {(period !== 'todos' && periodValue) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-que-teal/10 px-3 py-1 text-xs font-semibold text-que-teal">
                  {period === 'dia' ? 'Día' : period === 'mes' ? 'Mes' : 'Año'}: {periodValue}
                  <button type="button" onClick={() => setPeriodValue('')} className="ml-0.5 hover:text-ink">×</button>
                </span>
              )}

              <span className="text-xs text-slate-400 dark:text-white/30">
                {visibleCalls.length} registros
              </span>
            </div>
          )}

          {/* ═══ ARCHIVOS ═══════════════════════════════════════════════════════ */}
          {activeModule === 'archivos' && (
            <motion.div key="archivos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mt-6">
              <DataManager
                datasets={datasets}
                activeId={activeDatasetId}
                onActivate={setActiveDatasetId}
                onDelete={deleteDataset}
                onUpload={handleFile}
              />
            </motion.div>
          )}

          {/* ═══ AGENTES ════════════════════════════════════════════════════════ */}
          {activeModule === 'agentes' && (
            <motion.div key="agentes" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mt-6">
              <AgentView stats={agentStats} />
            </motion.div>
          )}

          {/* ═══ ANALYTICS (WFM / OPS / CALIDAD) ═══════════════════════════════ */}
          {isAnalytics && (
            <motion.div key={activeModule} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              {/* Description */}
              <div className="mt-2 mb-5" data-no-print>
                {activeModule === 'wfm'         && <p className="text-xs text-slate-500 dark:text-white/50">Fuerza laboral — ocupacion, utilizacion, shrinkage, adherencia y asistencia.</p>}
                {activeModule === 'operaciones' && <p className="text-xs text-slate-500 dark:text-white/50">Volumen y servicio — llamadas, SLA, abandono, velocidad de respuesta y duracion.</p>}
                {activeModule === 'calidad'     && <p className="text-xs text-slate-500 dark:text-white/50">Calidad — FCR, transferencias, QA score y satisfaccion del cliente.</p>}
              </div>

              {/* KPI cards */}
              <section id="kpi-section" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activeKpis.map((kpi, i) => (
                  <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} helper={kpi.helper}
                    target={kpi.target} status={kpi.status} index={i} />
                ))}
              </section>

              {/* Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-white/50" data-no-print>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Cumple meta</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> En riesgo</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Fuera de meta</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-que-teal" /> Referencial</span>
              </div>

              {/* Report builder */}
              <div id="report-builder" className="mt-8" data-no-print>
                <ReportBuilder selected={selectedCharts} onChange={setSelectedCharts} layout={layout} onLayoutChange={setLayout} />
              </div>

              {/* Chart grid */}
              <section className={`mt-6 ${gridClass}`}>
                <Suspense fallback={<ChartSkeleton />}>
                  {selectedCharts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center dark:border-white/10 dark:bg-white/5">
                      <BarChart3 size={40} className="mb-3 text-slate-300 dark:text-white/20" aria-hidden="true" />
                      <p className="text-sm font-semibold text-slate-500 dark:text-white/40">Ninguna gráfica seleccionada</p>
                      <button type="button" onClick={() => setSelectedCharts(['hourly', 'mix', 'scores'])}
                        className="mt-4 rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-ink shadow-sm transition hover:border-que-teal dark:border-white/10 dark:bg-white/10 dark:text-white">
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

          <DashboardFooter totalCalls={metrics.total} agentCount={agentCount} slaPercent={fmt(metrics.serviceLevel)} />
        </main>
      </div>
    </div>
  );
}

export default App;
