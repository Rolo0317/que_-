import { Activity, BarChart3, Headphones, PhoneCall, RefreshCw, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { AgentScoreChart, HourlyChart, TypeMixChart } from './components/Charts';
import { FileUploader } from './components/FileUploader';
import { KpiCard } from './components/KpiCard';
import { ReportBuilder } from './components/ReportBuilder';
import { sampleCalls } from './data/sampleCalls';
import { fetchReport } from './lib/api';
import { parseExcelFile } from './lib/excel';
import { agentScores, calculateMetrics, callsByHour, callsByType, filterCalls } from './lib/metrics';
import type { CallRecord } from './types/calls';

const filters = ['Todos', 'Inbound', 'Outbound'] as const;
type CallFilter = (typeof filters)[number];
type ChartId = 'hourly' | 'mix' | 'scores';

const formatPercent = (value: number) => `${(value * 100).toFixed(1)}%`;
const formatDuration = (seconds: number) => `${Math.round(seconds)} s`;

function App() {
  const [calls, setCalls] = useState<CallRecord[]>(sampleCalls);
  const [filter, setFilter] = useState<CallFilter>('Todos');
  const [selectedCharts, setSelectedCharts] = useState<ChartId[]>(['hourly', 'mix', 'scores']);
  const [status, setStatus] = useState('Datos demo cargados');

  const visibleCalls = useMemo(() => filterCalls(calls, filter), [calls, filter]);
  const metrics = useMemo(() => calculateMetrics(visibleCalls), [visibleCalls]);
  const hourlyData = useMemo(() => callsByHour(visibleCalls), [visibleCalls]);
  const typeData = useMemo(() => callsByType(visibleCalls), [visibleCalls]);
  const scoreData = useMemo(() => agentScores(visibleCalls), [visibleCalls]);

  async function handleFile(file: File) {
    try {
      const rows = await parseExcelFile(file);
      setCalls(rows);
      setStatus(`${rows.length} registros cargados desde ${file.name}`);
    } catch (error) {
      setStatus('No se pudo leer el archivo. Revisa el formato del Excel.');
      console.error(error);
    }
  }

  async function loadApiData() {
    try {
      const report = await fetchReport(filter);
      setCalls(report.data);
      setStatus(`API conectada: ${report.data.length} registros recibidos`);
    } catch (error) {
      setStatus('No se pudo conectar con la API. Mantengo los datos actuales.');
      console.error(error);
    }
  }

  return (
    <div className="min-h-screen bg-mist">
      <aside className="fixed inset-y-0 left-0 hidden w-20 flex-col items-center gap-6 bg-ink py-6 text-white lg:flex">
        <Headphones size={28} aria-label="Operaciones" />
        <PhoneCall size={22} aria-label="Llamadas" />
        <BarChart3 size={22} aria-label="Reportes" />
        <Activity size={22} aria-label="Actividad" />
      </aside>

      <main className="mx-auto max-w-7xl px-4 py-6 lg:ml-20 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-teal">BPO Analytics</p>
            <h1 className="mt-1 text-3xl font-semibold text-ink">Dashboard de call center</h1>
            <p className="mt-2 text-sm text-slate-600">{status}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-ink shadow-sm"
              value={filter}
              onChange={(event) => setFilter(event.target.value as CallFilter)}
              aria-label="Filtrar tipo de llamada"
            >
              {filters.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button
              className="flex h-11 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-ink shadow-sm transition hover:border-teal"
              type="button"
              onClick={loadApiData}
              aria-label="Cargar datos desde la API"
              title="Cargar datos desde la API"
            >
              <RefreshCw size={17} aria-hidden="true" />
              API
            </button>
            <FileUploader onFile={handleFile} />
          </div>
        </header>

        <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard label="Total llamadas" value={metrics.total} helper="Registros filtrados" />
          <KpiCard label="Inbound" value={metrics.inbound} helper="Entrantes" />
          <KpiCard label="Outbound" value={metrics.outbound} helper="Salientes" />
          <KpiCard label="Abandono" value={formatPercent(metrics.abandonRate)} helper="Sobre total" />
          <KpiCard label="TMO" value={formatDuration(metrics.avgDuration)} helper="Duracion media" />
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="space-y-4">
            <ReportBuilder selected={selectedCharts} onChange={setSelectedCharts} />
            <article className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Star size={18} className="text-coral" aria-hidden="true" />
                Satisfaccion media
              </div>
              <p className="mt-3 text-4xl font-semibold text-ink">{metrics.avgScore.toFixed(2)}</p>
              <p className="mt-1 text-sm text-slate-500">Escala 1 a 5</p>
            </article>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            {selectedCharts.includes('hourly') && <HourlyChart data={hourlyData} />}
            {selectedCharts.includes('mix') && <TypeMixChart data={typeData} />}
            {selectedCharts.includes('scores') && <AgentScoreChart data={scoreData} />}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
