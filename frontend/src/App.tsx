import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BarChart3, Calendar, RefreshCw, Settings, Upload } from 'lucide-react';
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
import { QuickGuide } from './components/QuickGuide';
import { ExportButton } from './components/ExportButton';
import { LS, SS } from './lib/constants';
import { MODULES } from './config/modules';
import { pushCloudDataset, fetchCloudDatasets, fetchCloudDataset, deleteCloudDataset } from './lib/cloudDatasets';
import { isCloudEnabled } from './lib/supabase';
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
  name: 'Sin datos · carga tu Excel',
  calls: [],
  loadedAt: new Date(),
  source: 'demo',
};


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

  // ── Splash — once per browser session (sessionStorage, not localStorage) ─
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem(SS.splash));
  function closeSplash() {
    sessionStorage.setItem(SS.splash, '1');
    setShowSplash(false);
  }

  // ── Data — persisted in localStorage so datos sobreviven al cerrar la pestaña
  const [datasets, setDatasets] = useState<Dataset[]>(() => {
    try {
      const raw = localStorage.getItem(LS.datasets);
      if (raw) {
        const parsed = JSON.parse(raw) as Array<{ id: string; name: string; calls: CallRecord[]; loadedAt: string; source: Dataset['source'] }>;
        const restored = parsed.filter((d) => d.id !== 'demo').map((d) => ({ ...d, loadedAt: new Date(d.loadedAt) }));
        if (restored.length) return [DEMO_DATASET, ...restored];
      }
    } catch {}
    return [DEMO_DATASET];
  });

  const [activeDatasetId, setActiveDatasetId] = useState<string>(() => localStorage.getItem(LS.activeDataset) ?? 'demo');
  const [compareId, setCompareId]             = useState<string | null>(null);
  const [apiStatus, setApiStatus]             = useState<'checking' | 'online' | 'offline'>('checking');

  // ── Theme ────────────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(LS.theme) as 'light' | 'dark' | null;
    if (saved) return saved;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    localStorage.setItem(LS.theme, theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // ── Filters from URL ─────────────────────────────────────────────────────
  const typeFilter    = (searchParams.get('type')     ?? 'Todos') as TypeFilter;
  const period        = (searchParams.get('period')   ?? 'todos') as Period;
  const periodValue   = searchParams.get('pv') ?? '';
  const campaignFilter = searchParams.get('campaign') ?? '';

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
  function setCampaignFilter(v: string) {
    setSearchParams((p) => { v ? p.set('campaign', v) : p.delete('campaign'); return p; }, { replace: true });
  }

  // ── Report builder state — persisted in localStorage ────────────────────
  const VALID_IDS = new Set<ChartId>(['hourly', 'mix', 'scores', 'slaHour', 'abandonHour', 'queues']);
  const [selectedCharts, setSelectedCharts] = useState<ChartId[]>(() => {
    try {
      const raw = localStorage.getItem(LS.reportCharts);
      if (raw) {
        const parsed = JSON.parse(raw) as ChartId[];
        const valid = parsed.filter((id) => VALID_IDS.has(id));
        if (valid.length > 0) return valid;
      }
    } catch { /* ignore */ }
    return ['hourly', 'mix', 'scores'];
  });
  const [layout, setLayout] = useState<ReportLayout>(() => {
    const saved = localStorage.getItem(LS.reportLayout);
    return saved === '3' ? '3' : '2';
  });
  const [showThresholds, setShowThresholds] = useState(false);
  const [chartFrom, setChartFrom]           = useState('');
  const [chartTo,   setChartTo]             = useState('');

  useEffect(() => {
    localStorage.setItem(LS.reportCharts, JSON.stringify(selectedCharts));
  }, [selectedCharts]);

  useEffect(() => {
    localStorage.setItem(LS.reportLayout, layout);
  }, [layout]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const activeDataset = useMemo(
    () => datasets.find((d) => d.id === activeDatasetId) ?? DEMO_DATASET,
    [datasets, activeDatasetId],
  );
  const activeCalls = useMemo(() => activeDataset.calls, [activeDataset]);

  const periodCalls   = useMemo(() => filterByPeriod(activeCalls, period, periodValue), [activeCalls, period, periodValue]);
  const campaignCalls = useMemo(() => campaignFilter ? periodCalls.filter((c) => c.queue === campaignFilter) : periodCalls, [periodCalls, campaignFilter]);
  const visibleCalls  = useMemo(() => filterCalls(campaignCalls, typeFilter), [campaignCalls, typeFilter]);

  // Cascading filter options — each reflects the other active filters
  // Campaigns available: only those with calls matching the current type (in the selected period)
  const availableQueues = useMemo(() => {
    const base = filterCalls(periodCalls, typeFilter);
    return [...new Set(base.map((c) => c.queue).filter(Boolean))].sort() as string[];
  }, [periodCalls, typeFilter]);

  // Types available: only those present in calls matching the current campaign (in the selected period)
  const availableTypes = useMemo(() => {
    const base = campaignFilter ? periodCalls.filter((c) => c.queue === campaignFilter) : periodCalls;
    const present = new Set(base.map((c) => c.type));
    return (typeFilters as readonly string[]).filter((f) => f === 'Todos' || present.has(f));
  }, [periodCalls, campaignFilter]);

  // Dates available: only dates that have calls matching current type + campaign
  const datesBase = useMemo(() => {
    let calls = filterCalls(activeCalls, typeFilter);
    if (campaignFilter) calls = calls.filter((c) => c.queue === campaignFilter);
    return calls;
  }, [activeCalls, typeFilter, campaignFilter]);

  const availableDays   = useMemo(() => [...new Set(datesBase.map((c) => c.date).filter(Boolean))].sort().reverse() as string[], [datesBase]);
  const availableMonths = useMemo(() => [...new Set(datesBase.map((c) => c.date?.slice(0, 7)).filter(Boolean))].sort().reverse() as string[], [datesBase]);
  const availableYears  = useMemo(() => [...new Set(datesBase.map((c) => c.date?.slice(0, 4)).filter(Boolean))].sort().reverse() as string[], [datesBase]);
  const hasDates = availableDays.length > 0;

  // Auto-reset campaign when it's no longer in the available list after type changes
  useEffect(() => {
    if (campaignFilter && availableQueues.length > 0 && !availableQueues.includes(campaignFilter)) {
      setCampaignFilter('');
    }
  }, [availableQueues, campaignFilter]);

  // Auto-reset type when it's no longer available after campaign changes
  useEffect(() => {
    if (typeFilter !== 'Todos' && !availableTypes.includes(typeFilter)) {
      setTypeFilter('Todos');
    }
  }, [availableTypes, typeFilter]);
  const metrics      = useMemo(() => calculateMetrics(visibleCalls), [visibleCalls]);

  // Additional date range filter applied only to the chart grid
  const chartCalls = useMemo(() => {
    if (!chartFrom && !chartTo) return visibleCalls;
    return visibleCalls.filter((c) => {
      if (!c.date) return true;
      if (chartFrom && c.date < chartFrom) return false;
      if (chartTo   && c.date > chartTo)   return false;
      return true;
    });
  }, [visibleCalls, chartFrom, chartTo]);

  // Preset date ranges (computed once at mount)
  const chartPresets = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const ago = (n: number) => {
      const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10);
    };
    return [
      { label: 'Hoy',     from: today,  to: today },
      { label: '7 días',  from: ago(6),  to: today },
      { label: '1 mes',   from: ago(29), to: today },
      { label: '3 meses', from: ago(89), to: today },
      { label: 'Todo',    from: '',      to: ''    },
    ];
  }, []);

  const hourlyData  = useMemo(() => callsByHour(chartCalls),   [chartCalls]);
  const typeData    = useMemo(() => callsByType(chartCalls),    [chartCalls]);
  const scoreData   = useMemo(() => agentScores(chartCalls),   [chartCalls]);
  const slaData     = useMemo(() => slaByHour(chartCalls),     [chartCalls]);
  const abandonData = useMemo(() => abandonByHour(chartCalls), [chartCalls]);
  const queueData   = useMemo(() => callsByQueue(chartCalls),  [chartCalls]);
  const agentCount  = useMemo(() => new Set(visibleCalls.map((c) => c.agent)).size, [visibleCalls]);
  const agentStats  = useMemo(() => agentDetailStats(visibleCalls), [visibleCalls]);
  const kpiAlerts   = useKpiAlerts(visibleCalls);

  const statusText = `${activeDataset.name} · ${visibleCalls.length} de ${activeCalls.length} registros`;
  const fmt = (v: number) => `${(v * 100).toFixed(2)}%`;

  const filtersStr = useMemo(() => {
    const parts: string[] = [];
    if (campaignFilter) parts.push(`Campaña: ${campaignFilter}`);
    if (typeFilter !== 'Todos') parts.push(`Tipo: ${typeFilter}`);
    if (period !== 'todos' && periodValue) parts.push(`Período: ${periodValue}`);
    return parts.length > 0 ? parts.join(' | ') : 'Sin filtros';
  }, [campaignFilter, typeFilter, period, periodValue]);

  // ── API ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    fetchHealth()
      .then(() => { if (mounted) setApiStatus('online'); })
      .catch(() => { if (mounted) setApiStatus('offline'); });
    return () => { mounted = false; };
  }, []);

  // ── Cloud sync — on mount, pull datasets from Supabase not already in localStorage ──
  useEffect(() => {
    if (!isCloudEnabled) return;
    fetchCloudDatasets()
      .then(async (metas) => {
        const localIds = new Set(datasets.map((d) => d.id));
        let firstNewId: string | null = null;
        for (const meta of metas) {
          if (localIds.has(meta.id)) continue;
          const cloud = await fetchCloudDataset(meta.id);
          if (cloud) {
            if (!firstNewId) firstNewId = cloud.id;
            setDatasets((prev) => [
              ...prev,
              {
                id: cloud.id,
                name: cloud.name,
                calls: cloud.calls,
                loadedAt: new Date(cloud.loaded_at),
                source: (cloud.source as Dataset['source']) || 'excel',
              },
            ]);
          }
        }
        // Auto-activate the first cloud dataset if still on the empty demo
        if (firstNewId) {
          setActiveDatasetId((cur) => (cur === 'demo' ? firstNewId! : cur));
        }
      })
      .catch(() => { /* cloud unavailable — silent, app works offline */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist uploaded datasets in localStorage (survives tab close + browser restart)
  useEffect(() => {
    const toSave = datasets.filter((d) => d.id !== 'demo');
    try {
      if (toSave.length > 0) {
        localStorage.setItem(LS.datasets, JSON.stringify(toSave));
      } else {
        localStorage.removeItem(LS.datasets);
      }
    } catch {
      toast.warning('Almacenamiento lleno — el archivo se perdería al cerrar. Exporta un Excel primero.');
    }
  }, [datasets]);

  useEffect(() => {
    localStorage.setItem(LS.activeDataset, activeDatasetId);
  }, [activeDatasetId]);

  function addDataset(dataset: Dataset) {
    setDatasets((p) => [...p, dataset]);
    setActiveDatasetId(dataset.id);
  }

  function deleteDataset(id: string) {
    setDatasets((p) => p.filter((d) => d.id !== id));
    if (activeDatasetId === id) setActiveDatasetId('demo');
    if (isCloudEnabled) deleteCloudDataset(id).catch(() => {});
  }

  async function handleFile(file: File) {
    const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
    const tryApi = Boolean(apiUrl) && apiStatus !== 'offline' && navigator.onLine;
    if (tryApi) {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 1500);
        await fetch(`${apiUrl}/health`, { signal: ctrl.signal });
        clearTimeout(timer);
        const report = await uploadReport(file, typeFilter);
        const dataset: Dataset = { id: `api-${Date.now()}`, name: file.name.replace(/\.xlsx$/i, ''), calls: report.data, loadedAt: new Date(), source: 'api' };
        addDataset(dataset);
        if (isCloudEnabled) pushCloudDataset({ id: dataset.id, name: dataset.name, calls: dataset.calls, source: dataset.source })
          .then(() => toast.info('Datos disponibles para todos los usuarios'))
          .catch(() => { /* sincronización en segundo plano — no interrumpir al usuario */ });
        setApiStatus('online');
        toast.success(`Dataset "${file.name.replace(/\.xlsx$/i, '')}" cargado desde API`);
        return;
      } catch {
        setApiStatus('offline');
      }
    }
    const rows = await parseExcelFile(file);
    if (rows.length === 0) throw new Error('El archivo está vacío o no tiene filas de datos.');
    const allDefault = rows.every((r) => r.agent === 'Sin agente') || rows.every((r) => r.hour === 'Sin hora');
    if (allDefault) throw new Error(`${rows.length} filas cargadas pero los encabezados no coinciden.`);
    const name = file.name.replace(/\.xlsx$/i, '');
    const id = `excel-${Date.now()}`;
    const dataset: Dataset = { id, name, calls: rows, loadedAt: new Date(), source: 'excel' };
    addDataset(dataset);
    if (isCloudEnabled) pushCloudDataset({ id, name, calls: rows, source: 'excel' })
      .then(() => toast.info('Datos disponibles para todos los usuarios'))
      .catch(() => { /* sincronización en segundo plano — no interrumpir al usuario */ });
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
                to={{ pathname: path, search: searchParams.toString() }}
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
                <span className="hidden sm:inline">Metas</span>
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
              <ExportButton
                options={{
                  datasetName: activeDataset.name,
                  calls: visibleCalls,
                  agentStats,
                  filters: filtersStr,
                }}
              />
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
                    to={{ pathname: path, search: searchParams.toString() }}
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
              {availableQueues.length > 0 && (
                <select
                  value={campaignFilter}
                  onChange={(e) => setCampaignFilter(e.target.value)}
                  className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-ink shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white"
                  aria-label="Filtrar por campaña"
                >
                  <option value="">Todas las campañas</option>
                  {availableQueues.map((q) => <option key={q} value={q}>{q}</option>)}
                </select>
              )}

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-ink shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white"
                aria-label="Filtrar por tipo"
              >
                {availableTypes.map((f) => <option key={f}>{f}</option>)}
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

              {campaignFilter && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-plus-orange/10 px-3 py-1 text-xs font-semibold text-plus-orange">
                  Campaña: {campaignFilter}
                  <button type="button" onClick={() => setCampaignFilter('')} className="ml-0.5 hover:text-ink">×</button>
                </span>
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

          {/* ── Quick guide — shown once when data is loaded ── */}
          {activeCalls.length > 0 && !isArchivos && <QuickGuide />}

          {/* ── No-data onboarding banner ── */}
          {activeCalls.length === 0 && !isArchivos && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 rounded-2xl border-2 border-dashed border-que-teal/20 bg-que-teal/5 p-10 text-center dark:border-que-teal/10 dark:bg-que-teal/[0.04]"
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-que-teal/10 dark:bg-que-teal/20">
                <Upload size={24} className="text-que-teal" aria-hidden="true" />
              </div>
              <h2 className="text-lg font-bold text-ink dark:text-white">Sin datos cargados</h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-white/50">
                Carga un archivo <span className="font-semibold text-que-teal">.xlsx</span> con los datos de tu call center para visualizar el dashboard
              </p>
              <NavLink
                to="/archivos"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-que-teal px-6 py-2.5 text-sm font-bold text-white shadow-lg transition hover:bg-que-teal/90 active:scale-95"
              >
                <Upload size={15} aria-hidden="true" />
                Ir a Archivos → cargar Excel
              </NavLink>
            </motion.div>
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
                  <AgentView stats={agentStats} rawCalls={visibleCalls} />
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
                    cloudEnabled={isCloudEnabled}
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

              {/* Date range filter for chart grid */}
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-white/10 dark:bg-slate-900" data-no-print>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-que-teal" aria-hidden="true" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-white/30">Rango gráficas</span>
                  </div>
                  <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
                  {chartPresets.map((p) => {
                    const active = chartFrom === p.from && chartTo === p.to;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => { setChartFrom(p.from); setChartTo(p.to); }}
                        className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                          active
                            ? 'bg-que-teal text-white shadow-sm'
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100 dark:bg-white/5 dark:text-white/40 dark:hover:bg-white/10'
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                  <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400 dark:text-white/30">Desde</span>
                    <input
                      type="date"
                      value={chartFrom}
                      min={availableDays[availableDays.length - 1]}
                      max={chartTo || availableDays[0]}
                      onChange={(e) => setChartFrom(e.target.value)}
                      className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                    <span className="text-[11px] text-slate-400 dark:text-white/30">hasta</span>
                    <input
                      type="date"
                      value={chartTo}
                      min={chartFrom || availableDays[availableDays.length - 1]}
                      max={availableDays[0]}
                      onChange={(e) => setChartTo(e.target.value)}
                      className="h-7 rounded-lg border border-slate-200 bg-slate-50 px-2 text-[11px] text-ink dark:border-white/10 dark:bg-white/5 dark:text-white"
                    />
                  </div>
                  {(chartFrom || chartTo) && (
                    <button
                      type="button"
                      onClick={() => { setChartFrom(''); setChartTo(''); }}
                      className="text-[11px] font-semibold text-rose-400 transition hover:text-rose-600 dark:text-rose-400/70 dark:hover:text-rose-400"
                    >
                      × Limpiar
                    </button>
                  )}
                  <span className="ml-auto rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-slate-500 dark:bg-white/5 dark:text-white/40">
                    {chartCalls.length.toLocaleString('es-CO')} registros
                  </span>
                </div>
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
