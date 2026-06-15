import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
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
import { BarChart2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { AbandonHourBucket, AgentScore, HourlyBucket, QueueBucket, SlaHourBucket, TypeBucket } from '../types/calls';

const colors = ['#11AEB3', '#FF9700', '#08777d', '#ff6f4f'];

interface ChartPanelProps {
  title: string;
  children: ReactNode;
}

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

export function HourlyChart({ data }: { data: HourlyBucket[] }) {
  return (
    <ChartPanel title="Llamadas por hora">
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
            <XAxis dataKey="hour" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line type="monotone" dataKey="calls" stroke="#11AEB3" strokeWidth={3} dot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

export function TypeMixChart({ data }: { data: TypeBucket[] }) {
  return (
    <ChartPanel title="Mix Inbound/Outbound">
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={60} outerRadius={95} label>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

export function AgentScoreChart({ data }: { data: AgentScore[] }) {
  return (
    <ChartPanel title="Calificacion por agente">
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
            <XAxis dataKey="agent" />
            <YAxis domain={[0, 5]} />
            <Tooltip />
            <Bar dataKey="score" fill="#FF9700" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

export function SlaHourChart({ data }: { data: SlaHourBucket[] }) {
  return (
    <ChartPanel title="SLA por hora">
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
            <XAxis dataKey="hour" />
            <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v) => [`${v}%`, 'SLA']} />
            <ReferenceLine y={80} stroke="#ff6f4f" strokeDasharray="6 3" label={{ value: 'Meta 80%', fill: '#ff6f4f', fontSize: 11, position: 'insideTopRight' }} />
            <Line type="monotone" dataKey="sla" stroke="#11AEB3" strokeWidth={3} dot={{ r: 4 }} name="SLA" />
          </LineChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

export function AbandonHourChart({ data }: { data: AbandonHourBucket[] }) {
  return (
    <ChartPanel title="Abandono por hora">
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
            <XAxis dataKey="hour" />
            <YAxis tickFormatter={(v) => `${v}%`} />
            <Tooltip formatter={(v) => [`${v}%`, 'Abandono']} />
            <ReferenceLine y={5} stroke="#FF9700" strokeDasharray="6 3" label={{ value: 'Meta 5%', fill: '#FF9700', fontSize: 11, position: 'insideTopRight' }} />
            <Bar dataKey="abandonRate" fill="#ff6f4f" radius={[4, 4, 0, 0]} name="Abandono %" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}

export function QueueChart({ data }: { data: QueueBucket[] }) {
  return (
    <ChartPanel title="Distribucion por cola">
      {data.length === 0 ? <EmptyChart /> : (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(2)}%`} labelLine={false}>
              {data.map((entry, index) => (
                <Cell key={entry.name} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      )}
    </ChartPanel>
  );
}
