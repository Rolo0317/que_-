import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ReactNode } from 'react';
import type { AgentScore, HourlyBucket, TypeBucket } from '../types/calls';

const colors = ['#1e8f86', '#f9735b', '#6f5dd5', '#c8f169'];

interface ChartPanelProps {
  title: string;
  children: ReactNode;
}

function ChartPanel({ title, children }: ChartPanelProps) {
  return (
    <section className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
      <h2 className="text-base font-semibold text-ink">{title}</h2>
      <div className="mt-4 h-72">{children}</div>
    </section>
  );
}

export function HourlyChart({ data }: { data: HourlyBucket[] }) {
  return (
    <ChartPanel title="Llamadas por hora">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
          <XAxis dataKey="hour" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Line type="monotone" dataKey="calls" stroke="#1e8f86" strokeWidth={3} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}

export function TypeMixChart({ data }: { data: TypeBucket[] }) {
  return (
    <ChartPanel title="Mix Inbound/Outbound">
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
    </ChartPanel>
  );
}

export function AgentScoreChart({ data }: { data: AgentScore[] }) {
  return (
    <ChartPanel title="Calificacion por agente">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#dbe4ee" />
          <XAxis dataKey="agent" />
          <YAxis domain={[0, 5]} />
          <Tooltip />
          <Bar dataKey="score" fill="#6f5dd5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartPanel>
  );
}
