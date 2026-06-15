import {
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
import { BarChart2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AbandonHourBucket, AgentScore, HourlyBucket, QueueBucket, SlaHourBucket, TypeBucket } from '../types/calls';

const COLORS = ['#11AEB3', '#FF9700', '#08777d', '#ff6f4f', '#6f5dd5', '#10b981'];
const LABEL_STYLE = { fontSize: 10, fontWeight: 600, fill: '#64748b' };

const n = (v: unknown): number => (typeof v === 'number' ? v : 0);

interface ChartPanelProps { title: string; children: ReactNode; }

function ChartPanel({ title, children }: ChartPanelProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-panel dark:border-white/10 dark:bg-white/10">
      <h2 className="text-base font-semibold text-ink dark:text-white">{title}</h2>
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

// ─── Llamadas por hora ────────────────────────────────────────────────────────
export function HourlyChart({ data }: { data: HourlyBucket[] }) {
  return (
    <ChartPanel title="Llamadas por hora">
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
              formatter={(v) => [n(v), 'Llamadas'] as [number, string]}
            />
            <Line type="monotone" dataKey="calls" stroke="#11AEB3" strokeWidth={3} dot={{ r: 4, fill: '#11AEB3' }} name="Llamadas">
              <LabelList dataKey="calls" position="top" style={LABEL_STYLE} />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

// ─── Mix Inbound / Outbound ───────────────────────────────────────────────────
function PieCustomLabel(props: PieLabelRenderProps) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, name = '', value = 0, percent = 0 } = props;
  const RADIAN = Math.PI / 180;
  const radius = n(innerRadius) + (n(outerRadius) - n(innerRadius)) * 0.5 + 28;
  const x = n(cx) + radius * Math.cos(-n(midAngle) * RADIAN);
  const y = n(cy) + radius * Math.sin(-n(midAngle) * RADIAN);
  return (
    <text x={x} y={y} textAnchor={x > n(cx) ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={600} fill="#475569">
      <tspan x={x} dy="0">{String(name)}</tspan>
      <tspan x={x} dy="14" fontWeight={700}>{n(value)} ({(n(percent) * 100).toFixed(1)}%)</tspan>
    </text>
  );
}

export function TypeMixChart({ data }: { data: TypeBucket[] }) {
  return (
    <ChartPanel title="Mix Inbound/Outbound">
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={82}
              labelLine={false}
              label={PieCustomLabel}
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(v, name) => [n(v), String(name)] as [number, string]}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

// ─── Calificación por agente ──────────────────────────────────────────────────
export function AgentScoreChart({ data }: { data: AgentScore[] }) {
  return (
    <ChartPanel title="Calificacion por agente">
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
            <XAxis dataKey="agent" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(v) => [n(v).toFixed(2), 'Score'] as [string, string]}
            />
            <Bar dataKey="score" fill="#FF9700" radius={[6, 6, 0, 0]} name="Score">
              <LabelList
                dataKey="score"
                position="top"
                formatter={(v: unknown) => n(v).toFixed(2)}
                style={LABEL_STYLE}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

// ─── SLA por hora ─────────────────────────────────────────────────────────────
export function SlaHourChart({ data }: { data: SlaHourBucket[] }) {
  return (
    <ChartPanel title="SLA por hora">
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(v) => [`${n(v).toFixed(1)}%`, 'SLA'] as [string, string]}
            />
            <ReferenceLine
              y={80}
              stroke="#ff6f4f"
              strokeDasharray="6 3"
              label={{ value: 'Meta 80%', fill: '#ff6f4f', fontSize: 10, fontWeight: 600, position: 'insideTopRight' }}
            />
            <Line type="monotone" dataKey="sla" stroke="#11AEB3" strokeWidth={3} dot={{ r: 4, fill: '#11AEB3' }} name="SLA">
              <LabelList
                dataKey="sla"
                position="top"
                formatter={(v: unknown) => `${n(v).toFixed(1)}%`}
                style={LABEL_STYLE}
              />
            </Line>
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

// ─── Abandono por hora ────────────────────────────────────────────────────────
export function AbandonHourChart({ data }: { data: AbandonHourBucket[] }) {
  return (
    <ChartPanel title="Abandono por hora">
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
            <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 11 }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(v) => [`${n(v).toFixed(1)}%`, 'Abandono'] as [string, string]}
            />
            <ReferenceLine
              y={5}
              stroke="#FF9700"
              strokeDasharray="6 3"
              label={{ value: 'Meta 5%', fill: '#FF9700', fontSize: 10, fontWeight: 600, position: 'insideTopRight' }}
            />
            <Bar dataKey="abandonRate" fill="#ff6f4f" radius={[6, 6, 0, 0]} name="Abandono %">
              <LabelList
                dataKey="abandonRate"
                position="top"
                formatter={(v: unknown) => `${n(v).toFixed(1)}%`}
                style={LABEL_STYLE}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

// ─── Distribución por cola ────────────────────────────────────────────────────
function QueueCustomLabel(props: PieLabelRenderProps) {
  const { cx = 0, cy = 0, midAngle = 0, innerRadius = 0, outerRadius = 0, name = '', value = 0, percent = 0 } = props;
  const RADIAN = Math.PI / 180;
  const radius = n(innerRadius) + (n(outerRadius) - n(innerRadius)) * 0.5 + 26;
  const x = n(cx) + radius * Math.cos(-n(midAngle) * RADIAN);
  const y = n(cy) + radius * Math.sin(-n(midAngle) * RADIAN);
  return (
    <text x={x} y={y} textAnchor={x > n(cx) ? 'start' : 'end'} dominantBaseline="central" fontSize={11} fontWeight={600} fill="#475569">
      <tspan x={x} dy="0">{String(name)}</tspan>
      <tspan x={x} dy="14" fontWeight={700}>{n(value)} ({(n(percent) * 100).toFixed(1)}%)</tspan>
    </text>
  );
}

export function QueueChart({ data }: { data: QueueBucket[] }) {
  return (
    <ChartPanel title="Distribucion por cola">
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={50}
              outerRadius={82}
              labelLine={false}
              label={QueueCustomLabel}
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8 }}
              formatter={(v, name) => [n(v), String(name)] as [number, string]}
            />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}
