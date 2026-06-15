import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import {
  AreaChart as AreaChartIcon,
  BarChart2,
  BarChartHorizontal,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
} from 'lucide-react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import type { AbandonHourBucket, AgentScore, HourlyBucket, QueueBucket, SlaHourBucket, TypeBucket } from '../types/calls';
import { BRAND } from '../lib/constants';

// ─── Constants ────────────────────────────────────────────────────────────────
const COLORS = [BRAND.teal, BRAND.orange, '#08777d', '#ff6f4f', '#6f5dd5', '#10b981'];
const LABEL_STYLE = { fontSize: 10, fontWeight: 600, fill: 'var(--chart-label)' };
const MARGIN = { top: 20, right: 16, left: 0, bottom: 0 };

const n = (v: unknown): number => (typeof v === 'number' ? v : 0);

// ─── Chart type system ────────────────────────────────────────────────────────
type ChartType = 'bar' | 'barh' | 'line' | 'area' | 'pie';

const TYPE_META: Record<ChartType, { icon: React.ComponentType<{ size?: number }>; label: string }> = {
  bar:  { icon: BarChart2,           label: 'Barras' },
  barh: { icon: BarChartHorizontal,  label: 'Horizontal' },
  line: { icon: LineChartIcon,       label: 'Líneas' },
  area: { icon: AreaChartIcon,       label: 'Área' },
  pie:  { icon: PieChartIcon,        label: 'Pastel' },
};

function useChartType(id: string, def: ChartType): [ChartType, (t: ChartType) => void] {
  const key = `que-ct-${id}`;
  const [type, setTypeState] = useState<ChartType>(() => {
    try { return (localStorage.getItem(key) as ChartType) ?? def; } catch { return def; }
  });
  function setType(t: ChartType) {
    setTypeState(t);
    try { localStorage.setItem(key, t); } catch {}
  }
  return [type, setType];
}

// ─── ChartPanel with type-switcher toolbar ────────────────────────────────────
interface ChartPanelProps {
  title: string;
  children: ReactNode;
  types?: ChartType[];
  activeType?: ChartType;
  onTypeChange?: (t: ChartType) => void;
}

function ChartPanel({ title, children, types, activeType, onTypeChange }: ChartPanelProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-panel dark:border-white/10 dark:bg-white/10">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-ink dark:text-white">{title}</h2>

        {types && types.length > 1 && onTypeChange && (
          <div className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5 dark:border-white/10 dark:bg-white/5">
            {types.map((t) => {
              const { icon: Icon, label } = TYPE_META[t];
              const active = t === activeType;
              return (
                <button
                  key={t}
                  type="button"
                  title={label}
                  aria-label={label}
                  onClick={() => onTypeChange(t)}
                  className={`flex h-6 w-7 items-center justify-center rounded-md transition ${
                    active
                      ? 'bg-que-teal text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-600 dark:text-white/30 dark:hover:text-white/60'
                  }`}
                >
                  <Icon size={13} />
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-4 h-72">{children}</div>
    </section>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 rounded-md bg-slate-50 dark:bg-white/5">
      <BarChart2 size={32} className="text-slate-300 dark:text-white/20" aria-hidden="true" />
      <p className="text-xs font-medium text-slate-400 dark:text-white/30">Sin datos para este período</p>
    </div>
  );
}

// ─── Pie label helpers ────────────────────────────────────────────────────────
function PieLabel(props: PieLabelRenderProps & { radiusOffset?: number }) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, name = '', value = 0, percent = 0, radiusOffset = 28 } = props;
  const R = Math.PI / 180;
  const radius = n(innerRadius) + (n(outerRadius) - n(innerRadius)) * 0.5 + radiusOffset;
  const x = n(cx) + radius * Math.cos(-n(midAngle) * R);
  const y = n(cy) + radius * Math.sin(-n(midAngle) * R);
  return (
    <text x={x} y={y} textAnchor={x > n(cx) ? 'start' : 'end'} dominantBaseline="central"
      fontSize={11} fontWeight={600} fill="var(--chart-label)">
      <tspan x={x} dy="0">{String(name)}</tspan>
      <tspan x={x} dy="14" fontWeight={700}>{n(value)} ({(n(percent) * 100).toFixed(1)}%)</tspan>
    </text>
  );
}

// ─── 1. Llamadas por hora ─────────────────────────────────────────────────────
export function HourlyChart({ data }: { data: HourlyBucket[] }) {
  const [type, setType] = useChartType('hourly', 'line');
  const tooltip = <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} formatter={(v) => [n(v), 'Llamadas'] as [number, string]} />;
  const grid = <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />;
  const xAxis = <XAxis dataKey="hour" tick={{ fontSize: 11 }} />;
  const yAxis = <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />;

  return (
    <ChartPanel title="Llamadas por hora" types={['line', 'bar', 'area']} activeType={type} onTypeChange={setType}>
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data} margin={MARGIN}>
              {grid}{xAxis}{yAxis}{tooltip}
              <Bar dataKey="calls" fill={BRAND.teal} radius={[6, 6, 0, 0]} name="Llamadas">
                <LabelList dataKey="calls" position="top" style={LABEL_STYLE} />
              </Bar>
            </BarChart>
          ) : type === 'area' ? (
            <AreaChart data={data} margin={MARGIN}>
              {grid}{xAxis}{yAxis}{tooltip}
              <Area type="monotone" dataKey="calls" stroke={BRAND.teal} fill={BRAND.teal} fillOpacity={0.15} strokeWidth={2.5} name="Llamadas">
                <LabelList dataKey="calls" position="top" style={LABEL_STYLE} />
              </Area>
            </AreaChart>
          ) : (
            <LineChart data={data} margin={MARGIN}>
              {grid}{xAxis}{yAxis}{tooltip}
              <Line type="monotone" dataKey="calls" stroke={BRAND.teal} strokeWidth={3} dot={{ r: 4, fill: '#11AEB3' }} name="Llamadas">
                <LabelList dataKey="calls" position="top" style={LABEL_STYLE} />
              </Line>
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

// ─── 2. Mix Inbound / Outbound ────────────────────────────────────────────────
export function TypeMixChart({ data }: { data: TypeBucket[] }) {
  const [type, setType] = useChartType('mix', 'pie');

  return (
    <ChartPanel title="Mix Inbound/Outbound" types={['pie', 'bar']} activeType={type} onTypeChange={setType}>
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v, name) => [n(v), String(name)] as [number, string]} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Llamadas">
                {data.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
                <LabelList dataKey="value" position="top" style={LABEL_STYLE} />
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82} labelLine={false} label={PieLabel}>
                {data.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v, name) => [n(v), String(name)] as [number, string]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

// ─── 3. Calificación por agente ───────────────────────────────────────────────
export function AgentScoreChart({ data }: { data: AgentScore[] }) {
  const [type, setType] = useChartType('scores', 'barh');
  const sorted = [...data].sort((a, b) => b.score - a.score);
  const top = type === 'barh' ? sorted.slice(0, 20) : sorted.slice(0, 10);
  const suffix = data.length > top.length ? ` · Top ${top.length} de ${data.length}` : '';
  const title = `Calificación por agente${suffix}`;

  return (
    <ChartPanel title={title} types={['barh', 'bar']} activeType={type} onTypeChange={setType}>
      {top.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={top} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
              <XAxis dataKey="agent" tick={{ fontSize: 9 }} interval={0} angle={-30} textAnchor="end" height={48} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [n(v).toFixed(2), 'Score'] as [string, string]} />
              <Bar dataKey="score" fill={BRAND.orange} radius={[6, 6, 0, 0]} name="Score">
                <LabelList dataKey="score" position="top" formatter={(v: unknown) => n(v).toFixed(2)} style={LABEL_STYLE} />
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={top} layout="vertical" margin={{ top: 4, right: 48, left: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" vertical={false} />
              <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="agent" tick={{ fontSize: 10 }} width={74} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [n(v).toFixed(2), 'Score'] as [string, string]} />
              <Bar dataKey="score" fill={BRAND.orange} radius={[0, 6, 6, 0]} name="Score">
                <LabelList dataKey="score" position="right" formatter={(v: unknown) => n(v).toFixed(2)} style={LABEL_STYLE} />
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

// ─── 4. SLA por hora ──────────────────────────────────────────────────────────
export function SlaHourChart({ data }: { data: SlaHourBucket[] }) {
  const [type, setType] = useChartType('slaHour', 'line');
  const tooltip = <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${n(v).toFixed(1)}%`, 'SLA'] as [string, string]} />;
  const grid    = <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />;
  const xAxis   = <XAxis dataKey="hour" tick={{ fontSize: 11 }} />;
  const yAxis   = <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />;
  const refLine = <ReferenceLine y={80} stroke="#ff6f4f" strokeDasharray="6 3" label={{ value: 'Meta 80%', fill: '#ff6f4f', fontSize: 10, fontWeight: 600, position: 'insideTopRight' }} />;
  const label   = <LabelList dataKey="sla" position="top" formatter={(v: unknown) => `${n(v).toFixed(1)}%`} style={LABEL_STYLE} />;

  return (
    <ChartPanel title="SLA por hora" types={['line', 'bar', 'area']} activeType={type} onTypeChange={setType}>
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data} margin={MARGIN}>
              {grid}{xAxis}{yAxis}{tooltip}{refLine}
              <Bar dataKey="sla" fill={BRAND.teal} radius={[6, 6, 0, 0]} name="SLA">{label}</Bar>
            </BarChart>
          ) : type === 'area' ? (
            <AreaChart data={data} margin={MARGIN}>
              {grid}{xAxis}{yAxis}{tooltip}{refLine}
              <Area type="monotone" dataKey="sla" stroke={BRAND.teal} fill={BRAND.teal} fillOpacity={0.15} strokeWidth={2.5} name="SLA">{label}</Area>
            </AreaChart>
          ) : (
            <LineChart data={data} margin={MARGIN}>
              {grid}{xAxis}{yAxis}{tooltip}{refLine}
              <Line type="monotone" dataKey="sla" stroke={BRAND.teal} strokeWidth={3} dot={{ r: 4, fill: '#11AEB3' }} name="SLA">{label}</Line>
            </LineChart>
          )}
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

// ─── 5. Abandono por hora ─────────────────────────────────────────────────────
export function AbandonHourChart({ data }: { data: AbandonHourBucket[] }) {
  const [type, setType] = useChartType('abandonHour', 'bar');
  const tooltip = <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => [`${n(v).toFixed(1)}%`, 'Abandono'] as [string, string]} />;
  const grid    = <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />;
  const xAxis   = <XAxis dataKey="hour" tick={{ fontSize: 11 }} />;
  const yAxis   = <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />;
  const refLine = <ReferenceLine y={5} stroke={BRAND.orange} strokeDasharray="6 3" label={{ value: 'Meta 5%', fill: '#FF9700', fontSize: 10, fontWeight: 600, position: 'insideTopRight' }} />;
  const label   = <LabelList dataKey="abandonRate" position="top" formatter={(v: unknown) => `${n(v).toFixed(1)}%`} style={LABEL_STYLE} />;

  return (
    <ChartPanel title="Abandono por hora" types={['bar', 'line', 'area']} activeType={type} onTypeChange={setType}>
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          {type === 'line' ? (
            <LineChart data={data} margin={MARGIN}>
              {grid}{xAxis}{yAxis}{tooltip}{refLine}
              <Line type="monotone" dataKey="abandonRate" stroke="#ff6f4f" strokeWidth={3} dot={{ r: 4, fill: '#ff6f4f' }} name="Abandono">{label}</Line>
            </LineChart>
          ) : type === 'area' ? (
            <AreaChart data={data} margin={MARGIN}>
              {grid}{xAxis}{yAxis}{tooltip}{refLine}
              <Area type="monotone" dataKey="abandonRate" stroke="#ff6f4f" fill="#ff6f4f" fillOpacity={0.15} strokeWidth={2.5} name="Abandono">{label}</Area>
            </AreaChart>
          ) : (
            <BarChart data={data} margin={MARGIN}>
              {grid}{xAxis}{yAxis}{tooltip}{refLine}
              <Bar dataKey="abandonRate" fill="#ff6f4f" radius={[6, 6, 0, 0]} name="Abandono %">{label}</Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

// ─── 6. Distribución por cola ─────────────────────────────────────────────────
export function QueueChart({ data }: { data: QueueBucket[] }) {
  const [type, setType] = useChartType('queues', 'pie');

  return (
    <ChartPanel title="Distribución por cola" types={['pie', 'bar']} activeType={type} onTypeChange={setType}>
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data} margin={MARGIN}>
              <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v, name) => [n(v), String(name)] as [number, string]} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} name="Llamadas">
                {data.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
                <LabelList dataKey="value" position="top" style={LABEL_STYLE} />
              </Bar>
            </BarChart>
          ) : (
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={82} labelLine={false} label={PieLabel}>
                {data.map((entry, i) => <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v, name) => [n(v), String(name)] as [number, string]} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          )}
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}
