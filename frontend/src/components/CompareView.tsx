import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useMemo } from 'react';
import { calculateMetrics, callsByHour } from '../lib/metrics';
import type { Dataset } from '../types/dataset';

interface CompareViewProps {
  datasetA: Dataset;
  datasetB: Dataset;
  onClose: () => void;
}

const fmt  = (v: number) => `${(v * 100).toFixed(2)}%`;
const fmtS = (s: number) => `${Math.round(s)}s`;

function StatRow({ label, a, b }: { label: string; a: string; b: string }) {
  return (
    <div className="grid grid-cols-3 gap-2 border-b border-slate-100 py-2 text-sm dark:border-white/10">
      <span className="text-slate-500 dark:text-white/50">{label}</span>
      <span className="text-center font-semibold text-que-teal tabular-nums">{a}</span>
      <span className="text-center font-semibold text-plus-orange tabular-nums">{b}</span>
    </div>
  );
}

export function CompareView({ datasetA, datasetB, onClose }: CompareViewProps) {
  const mA = useMemo(() => calculateMetrics(datasetA.calls), [datasetA]);
  const mB = useMemo(() => calculateMetrics(datasetB.calls), [datasetB]);

  const hourlyA = useMemo(() => callsByHour(datasetA.calls), [datasetA]);
  const hourlyB = useMemo(() => callsByHour(datasetB.calls), [datasetB]);

  // Merge hourly data for combined chart
  const mergedHourly = useMemo(() => {
    const hours = new Set([...hourlyA.map((h) => h.hour), ...hourlyB.map((h) => h.hour)]);
    return [...hours].sort().map((hour) => ({
      hour,
      [datasetA.name]: hourlyA.find((h) => h.hour === hour)?.calls ?? 0,
      [datasetB.name]: hourlyB.find((h) => h.hour === hour)?.calls ?? 0,
    }));
  }, [hourlyA, hourlyB, datasetA.name, datasetB.name]);

  // KPI comparison bars
  const kpiBars = [
    { label: 'SLA',         a: mA.serviceLevel,         b: mB.serviceLevel },
    { label: 'FCR',         a: mA.firstContactResolution, b: mB.firstContactResolution },
    { label: 'Utilización', a: mA.utilization,           b: mB.utilization },
    { label: 'Adherencia',  a: mA.adherence,             b: mB.adherence },
  ].map(({ label, a, b }) => ({ label, [datasetA.name]: +(a * 100).toFixed(2), [datasetB.name]: +(b * 100).toFixed(2) }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.25 }}
      className="mt-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink dark:text-white">Comparación de datasets</h2>
          <div className="mt-1 flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-que-teal" />{datasetA.name} ({datasetA.calls.length.toLocaleString('es')} reg.)</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-plus-orange" />{datasetB.name} ({datasetB.calls.length.toLocaleString('es')} reg.)</span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-slate-400 hover:text-ink dark:border-white/10 dark:hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* KPI table */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel dark:border-white/10 dark:bg-slate-900">
          <h3 className="mb-3 text-sm font-bold text-ink dark:text-white">Métricas clave</h3>
          <div className="grid grid-cols-3 gap-2 border-b border-slate-200 pb-2 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:border-white/10 dark:text-white/30">
            <span>Indicador</span>
            <span className="text-center text-que-teal">{datasetA.name.slice(0, 14)}</span>
            <span className="text-center text-plus-orange">{datasetB.name.slice(0, 14)}</span>
          </div>
          <StatRow label="Total llamadas" a={String(mA.total)}             b={String(mB.total)} />
          <StatRow label="SLA"            a={fmt(mA.serviceLevel)}         b={fmt(mB.serviceLevel)} />
          <StatRow label="Abandono"       a={fmt(mA.abandonRate)}          b={fmt(mB.abandonRate)} />
          <StatRow label="FCR"            a={fmt(mA.firstContactResolution)} b={fmt(mB.firstContactResolution)} />
          <StatRow label="Transferencias" a={fmt(mA.transferRate)}         b={fmt(mB.transferRate)} />
          <StatRow label="AHT"            a={fmtS(mA.avgDuration)}         b={fmtS(mB.avgDuration)} />
          <StatRow label="ASA"            a={fmtS(mA.avgSpeedAnswer)}      b={fmtS(mB.avgSpeedAnswer)} />
          <StatRow label="Satisfacción"   a={mA.avgScore.toFixed(2)}       b={mB.avgScore.toFixed(2)} />
          <StatRow label="QA Score"       a={mA.avgQaScore.toFixed(1)}     b={mB.avgQaScore.toFixed(1)} />
          <StatRow label="Ocupación"      a={fmt(mA.occupancy)}            b={fmt(mB.occupancy)} />
          <StatRow label="Utilización"    a={fmt(mA.utilization)}          b={fmt(mB.utilization)} />
        </div>

        {/* KPI bars chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel dark:border-white/10 dark:bg-slate-900">
          <h3 className="mb-3 text-sm font-bold text-ink dark:text-white">KPIs de calidad (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kpiBars} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="label" width={80} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Legend />
                <Bar dataKey={datasetA.name} fill="#11AEB3" radius={[0, 4, 4, 0]}>
                  {kpiBars.map((_, i) => <Cell key={i} fill="#11AEB3" />)}
                </Bar>
                <Bar dataKey={datasetB.name} fill="#FF9700" radius={[0, 4, 4, 0]}>
                  {kpiBars.map((_, i) => <Cell key={i} fill="#FF9700" />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Hourly volume chart */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel dark:border-white/10 dark:bg-slate-900">
        <h3 className="mb-3 text-sm font-bold text-ink dark:text-white">Volumen de llamadas por hora</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={mergedHourly}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
              <XAxis dataKey="hour" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey={datasetA.name} stroke="#11AEB3" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey={datasetB.name} stroke="#FF9700" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
