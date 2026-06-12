import { Activity, BarChart3, PhoneCall, RefreshCw, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { BrandLogo } from './components/BrandLogo';
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
import type { CallRecord } from './types/calls';

const filters = ['Todos', 'Inbound', 'Outbound'] as const;
type CallFilter = (typeof filters)[number];
type Module = 'wfm' | 'operaciones' | 'calidad';

const HourlyChart = lazy(() => import('./components/Charts').then((m) => ({ default: m.HourlyChart })));
const TypeMixChart = lazy(() => import('./components/Charts').then((m) => ({ default: m.TypeMixChart })));
const AgentScoreChart = lazy(() => import('./components/Charts').then((m) => ({ default: m.AgentScoreChart })));
const SlaHourChart = lazy(() => import('./components/Charts').then((m) => ({ default: m.SlaHourChart })));
const AbandonHourChart = lazy(() => import('./components/Charts').then((m) => ({ default: m.AbandonHourChart })));
const QueueChart = lazy(() => import('./components/Charts').then((m) => ({ default: m.QueueChart })));

const formatPercent = (v: number) => `${(v * 100).toFixed(1)}%`;
const formatDuration = (s: number) => `${Math.round(s)} s`;

const pct = (v: number, good: number, warn: number): KpiStatus =>
  v >= good ? 'good' : v >= warn ? 'warning' : 'bad';

const pctInv = (v: number, good: number, warn: number): KpiStatus =>
  v <= good ? 'good' : v <= warn ? 'warning' : 'bad';

const secInv = (v: number, good: number, warn: number): KpiStatus =>
  v <= good ? 'good' : v <= warn ? 'warning' : 'bad';

const occupancyStatus = (v: number): KpiStatus =>
  v >= 0.75 && v <= 0.9 ? 'good' : v >= 0.6 && v <= 0.95 ? 'warning' : 'neutral';

const modules: { id: Module; label: string; icon: typeof Users }[] = [
  { id: 'wfm',         label: 'WFM',        icon: Users },
  { id: 'operaciones', label: 'Operaciones', icon: TrendingUp },
  { id: 'calidad',     label: 'Calidad',     icon: ShieldCheck },
];

const ChartSkeleton = () => (
  <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel dark:border-white/10 dark:bg-white/10">
    <div className="h-72 animate-pulse rounded-md bg-slate-100 dark:bg-white/5" />
  </div>
);

function App() {
  const shouldReduceMotion = useReducedMotion();
  const [calls, setCalls] = useState<CallRecord[]>(sampleCalls);
  const [filter, setFilter] = useState<CallFilter>('Todos');
  const [activeModule, setActiveModule] = useState<Module>('wfm');
  const [selectedCharts, setSelectedCharts] = useState<ChartId[]>(['hourly', 'mix', 'scores']);
  const [layout, setLayout] = useState<ReportLayout>('2');
  const [status, setStatus] = useState('Datos demo cargados');
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'light';
    const saved = localStorage.getItem('theme-preference') as 'light' | 'dark' | null;
    if (saved) return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem('theme-preference', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const visibleCalls = useMemo(() => filterCalls(calls, filter), [calls, filter]);
  const metrics     = useMemo(() => calculateMetrics(visibleCalls), [visibleCalls]);
  const hourlyData  = useMemo(() => callsByHour(visibleCalls), [visibleCalls]);
  const typeData    = useMemo(() => callsByType(visibleCalls), [visibleCalls]);
  const scoreData   = useMemo(() => agentScores(visibleCalls), [visibleCalls]);
  const slaData     = useMemo(() => slaByHour(visibleCalls), [visibleCalls]);
  const abandonData = useMemo(() => abandonByHour(visibleCalls), [visibleCalls]);
  const queueData   = useMemo(() => callsByQueue(visibleCalls), [visibleCalls]);

  const wfmKpis = useMemo(() => [
    { label: 'Ocupacion',  value: formatPercent(metrics.occupancy),   helper: 'Talk / disponible',    target: 'Meta: 80–85%', status: occupancyStatus(metrics.occupancy) },
    { label: 'Utilizacion', value: formatPercent(metrics.utilization), helper: 'Productivo / login',  target: 'Meta: >85%',   status: pct(metrics.utilization, 0.85, 0.75) },
    { label: 'Shrinkage',  value: formatPercent(metrics.shrinkage),    helper: 'Fuera de produccion', target: 'Meta: <25%',   status: pctInv(metrics.shrinkage, 0.25, 0.35) },
    { label: 'Adherencia', value: formatPercent(metrics.adherence),    helper: 'Horario plan vs real', target: 'Meta: >95%',  status: pct(metrics.adherence, 0.95, 0.90) },
    { label: 'Asistencia', value: formatPercent(metrics.attendance),   helper: 'Presencia programada', target: 'Meta: >95%', status: pct(metrics.attendance, 0.95, 0.90) },
  ], [metrics]);

  const operacionesKpis = useMemo(() => [
    { label: 'Total llamadas', value: metrics.total,                        helper: 'Registros filtrados',  status: 'neutral' as KpiStatus },
    { label: 'Inbound',        value: metrics.inbound,                      helper: 'Entrantes',            status: 'neutral' as KpiStatus },
    { label: 'Outbound',       value: metrics.outbound,                     helper: 'Salientes',            status: 'neutral' as KpiStatus },
    { label: 'SLA',            value: formatPercent(metrics.serviceLevel),  helper: 'Contestadas a tiempo', target: 'Meta: >80%', status: pct(metrics.serviceLevel, 0.80, 0.70) },
    { label: 'Abandono',       value: formatPercent(metrics.abandonRate),   helper: 'Sobre total',          target: 'Meta: <5%',  status: pctInv(metrics.abandonRate, 0.05, 0.10) },
    { label: 'ASA',            value: formatDuration(metrics.avgSpeedAnswer), helper: 'Espera promedio',    target: 'Meta: <30 s', status: secInv(metrics.avgSpeedAnswer, 30, 60) },
    { label: 'AHT / TMO',      value: formatDuration(metrics.avgDuration),  helper: 'Duracion media',       status: 'neutral' as KpiStatus },
  ], [metrics]);

  const calidadKpis = useMemo(() => [
    { label: 'FCR',           value: formatPercent(metrics.firstContactResolution), helper: 'Resuelto primer contacto', target: 'Meta: >80%',  status: pct(metrics.firstContactResolution, 0.80, 0.70) },
    { label: 'Transferencias', value: formatPercent(metrics.transferRate),           helper: 'Derivaciones',            target: 'Meta: <10%', status: pctInv(metrics.transferRate, 0.10, 0.20) },
    { label: 'QA Score',      value: metrics.avgQaScore.toFixed(1),                 helper: 'Calidad (0–100)',          target: 'Meta: >85',   status: pct(metrics.avgQaScore / 100, 0.85, 0.75) },
    { label: 'Satisfaccion',  value: metrics.avgScore.toFixed(2),                   helper: 'Escala 1 a 5',            target: 'Meta: >4.0',  status: pct(metrics.avgScore / 5, 0.80, 0.70) },
  ], [metrics]);

  const activeKpis = activeModule === 'wfm' ? wfmKpis : activeModule === 'operaciones' ? operacionesKpis : calidadKpis;

  useEffect(() => {
    let mounted = true;
    fetchHealth()
      .then(() => { if (mounted) setApiStatus('online'); })
      .catch(() => { if (mounted) setApiStatus('offline'); });
    return () => { mounted = false; };
  }, []);

  async function handleFile(file: File) {
    try {
      const report = await uploadReport(file, filter);
      setCalls(report.data);
      setApiStatus('online');
      setStatus(`${report.data.length} registros procesados por API desde ${file.name}`);
    } catch {
      try {
        const rows = await parseExcelFile(file);
        setCalls(rows);
        setApiStatus('offline');
        setStatus(`${rows.length} registros cargados localmente desde ${file.name}`);
      } catch {
        setStatus('No se pudo leer el archivo. Revisa el formato del Excel.');
      }
    }
  }

  async function loadApiData() {
    try {
      const report = await fetchReport(filter);
      setCalls(report.data);
      setStatus(`API: ${report.data.length} registros recibidos`);
    } catch {
      setStatus('API no disponible. Mantengo datos actuales.');
    }
  }

  const gridClass =
    layout === '3'
      ? 'grid gap-6 md:grid-cols-2 xl:grid-cols-3'
      : 'grid gap-6 xl:grid-cols-2';

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''}`}>
      <div className="relative min-h-screen bg-mist text-ink transition-colors dark:bg-[#07181c] dark:text-white">
        <img
          src="/logo-que-plus.svg"
          alt=""
          className="pointer-events-none absolute right-[-64px] top-8 w-[360px] opacity-[0.045] dark:opacity-[0.08]"
          aria-hidden="true"
        />

        {/* Sidebar */}
        <aside className="fixed inset-y-0 left-0 hidden w-20 flex-col items-center gap-6 bg-ink py-6 text-white lg:flex">
          <div className="flex flex-col items-center gap-1">
            <BrandLogo className="w-12" />
            <span className="text-[9px] font-bold tracking-[0.2em] text-white/50 uppercase">BPO</span>
          </div>
          <div className="h-px w-8 bg-white/10" />
          <PhoneCall size={20} aria-label="Llamadas" className="text-white/70 hover:text-que-teal transition-colors" />
          <BarChart3 size={20} aria-label="Reportes" className="text-white/70 hover:text-que-teal transition-colors" />
          <Activity size={20} aria-label="Actividad" className="text-white/70 hover:text-que-teal transition-colors" />
          <div className="mt-auto">
            <div className="h-px w-8 bg-white/10 mb-4" />
            <img src="/logo-que-plus.svg" alt="" aria-hidden="true" className="w-8 opacity-20" />
          </div>
        </aside>

        <main className="relative mx-auto max-w-7xl px-4 py-6 lg:ml-20 lg:px-8">
          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.4 }}
            className="flex flex-col gap-4 border-b border-slate-200 pb-5 dark:border-white/10 md:flex-row md:items-center md:justify-between"
          >
            <div>
              <BrandLogo className="mb-3 w-40 lg:mb-2 lg:w-28" />
              <p className="text-sm font-semibold uppercase tracking-wide text-que-teal">BPO Analytics</p>
              <h1 className="mt-1 text-3xl font-semibold text-ink dark:text-white">Dashboard de call center</h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
                <span className="text-slate-600 dark:text-white/70">{status}</span>
                <span className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium dark:border-white/10 dark:bg-white/10 dark:text-white">
                  <span className={`h-2 w-2 rounded-full ${apiStatus === 'online' ? 'bg-que-teal' : apiStatus === 'offline' ? 'bg-coral' : 'bg-slate-300'}`} />
                  API {apiStatus === 'online' ? 'online' : apiStatus === 'offline' ? 'offline' : 'verificando'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3" data-no-print>
              <ThemeToggle theme={theme} onToggle={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
              <select
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-ink shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white"
                value={filter}
                onChange={(e) => setFilter(e.target.value as CallFilter)}
                aria-label="Filtrar tipo de llamada"
              >
                {filters.map((f) => <option key={f}>{f}</option>)}
              </select>
              <button
                className="flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-ink shadow-sm transition hover:border-que-teal dark:border-white/10 dark:bg-slate-900 dark:text-white"
                type="button"
                onClick={loadApiData}
                aria-label="Cargar datos desde la API"
              >
                <RefreshCw size={17} aria-hidden="true" />
                API
              </button>
              <FileUploader onFile={handleFile} />
            </div>
          </motion.header>

          {/* Module tabs */}
          <div className="mt-6 flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:w-fit" data-no-print>
            {modules.map(({ id, label, icon: Icon }) => {
              const active = activeModule === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveModule(id)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                    active
                      ? 'bg-ink text-white shadow dark:bg-que-teal dark:text-white'
                      : 'text-slate-500 hover:text-ink dark:text-white/50 dark:hover:text-white'
                  }`}
                >
                  <Icon size={15} aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Module description */}
          <div className="mt-3 mb-5" data-no-print>
            {activeModule === 'wfm' && (
              <p className="text-xs text-slate-500 dark:text-white/50">
                Indicadores de fuerza laboral: ocupacion, utilizacion, shrinkage, adherencia y asistencia.
              </p>
            )}
            {activeModule === 'operaciones' && (
              <p className="text-xs text-slate-500 dark:text-white/50">
                Volumenes y servicio: llamadas totales, SLA, abandono, velocidad de respuesta y duracion media.
              </p>
            )}
            {activeModule === 'calidad' && (
              <p className="text-xs text-slate-500 dark:text-white/50">
                Indicadores de calidad: FCR, tasa de transferencias, QA y satisfaccion del cliente.
              </p>
            )}
          </div>

          {/* KPI cards */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-white/50" data-no-print>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Cumple meta</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> En riesgo</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-rose-500" /> Fuera de meta</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-que-teal" /> Referencial</span>
          </div>

          {/* Report Builder */}
          <div className="mt-8" data-no-print>
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
              {selectedCharts.includes('hourly')      && <HourlyChart data={hourlyData} />}
              {selectedCharts.includes('mix')         && <TypeMixChart data={typeData} />}
              {selectedCharts.includes('scores')      && <AgentScoreChart data={scoreData} />}
              {selectedCharts.includes('slaHour')     && <SlaHourChart data={slaData} />}
              {selectedCharts.includes('abandonHour') && <AbandonHourChart data={abandonData} />}
              {selectedCharts.includes('queues')      && <QueueChart data={queueData} />}
            </Suspense>
          </section>

          <DashboardFooter />
        </main>
      </div>
    </div>
  );
}

export default App;
