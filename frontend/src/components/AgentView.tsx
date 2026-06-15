import { ChevronDown, ChevronUp, Download, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { exportAgentsToCsv } from '../lib/exportCsv';
import type { AgentStats, CallRecord } from '../types/calls';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fp = (v: number) => `${(v * 100).toFixed(1)}%`;
const fs = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = [
  'bg-que-teal text-white',
  'bg-plus-orange text-white',
  'bg-violet text-white',
  'bg-coral text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-white',
];
function avatarColor(name: string): string {
  let hash = 0;
  for (const c of name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

type Tier = 'destacado' | 'bueno' | 'regular' | 'riesgo';
function agentTier(s: AgentStats): Tier {
  const score = s.avgScore;
  const sla   = s.slaRate;
  const fcr   = s.fcrRate;
  if (score >= 4.5 && sla >= 0.85 && fcr >= 0.8) return 'destacado';
  if (score >= 4.0 && sla >= 0.75 && fcr >= 0.7) return 'bueno';
  if (score >= 3.5 && sla >= 0.6)                return 'regular';
  return 'riesgo';
}

const TIER_CFG = {
  destacado: { label: 'Destacado', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' },
  bueno:     { label: 'Bueno',     cls: 'bg-teal-100    text-teal-700    dark:bg-teal-900/40    dark:text-teal-400' },
  regular:   { label: 'Regular',   cls: 'bg-amber-100   text-amber-700   dark:bg-amber-900/40   dark:text-amber-400' },
  riesgo:    { label: 'En riesgo', cls: 'bg-rose-100    text-rose-700    dark:bg-rose-900/40    dark:text-rose-400' },
};

type SortKey = 'calls' | 'score' | 'sla' | 'fcr' | 'aht';
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'calls', label: 'Llamadas' },
  { key: 'score', label: 'Score' },
  { key: 'sla',   label: 'SLA' },
  { key: 'fcr',   label: 'FCR' },
  { key: 'aht',   label: 'AHT' },
];

function sortStats(data: AgentStats[], key: SortKey, asc: boolean): AgentStats[] {
  return [...data].sort((a, b) => {
    const diff =
      key === 'calls' ? a.totalCalls  - b.totalCalls :
      key === 'score' ? a.avgScore    - b.avgScore    :
      key === 'sla'   ? a.slaRate     - b.slaRate     :
      key === 'fcr'   ? a.fcrRate     - b.fcrRate     :
      a.avgDuration   - b.avgDuration;
    return asc ? diff : -diff;
  });
}

// ─── Trend builder ────────────────────────────────────────────────────────────
type TrendPoint = { label: string; score: number };

function buildTrendMap(calls: CallRecord[]): Map<string, TrendPoint[]> {
  const agentWeeks = new Map<string, Map<string, { total: number; count: number }>>();

  for (const c of calls) {
    if (!c.date || !c.agent) continue;
    const d = new Date(c.date);
    if (isNaN(d.getTime())) continue;
    const jan1 = new Date(d.getFullYear(), 0, 1);
    const weekNum = Math.ceil(
      ((d.getTime() - jan1.getTime()) / 86400000 + jan1.getDay() + 1) / 7,
    );
    const weekKey = `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;

    if (!agentWeeks.has(c.agent)) agentWeeks.set(c.agent, new Map());
    const wm = agentWeeks.get(c.agent)!;
    const cur = wm.get(weekKey) ?? { total: 0, count: 0 };
    cur.total += c.score || 0;
    cur.count += 1;
    wm.set(weekKey, cur);
  }

  const result = new Map<string, TrendPoint[]>();
  for (const [agent, wm] of agentWeeks) {
    result.set(
      agent,
      Array.from(wm.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-8)
        .map(([label, { total, count }]) => ({
          label: label.slice(5),
          score: count ? +(total / count).toFixed(2) : 0,
        })),
    );
  }
  return result;
}

function cssId(name: string) {
  return name.replace(/[^a-zA-Z0-9]/g, '_');
}

// ─── Sparkline ────────────────────────────────────────────────────────────────
function Sparkline({ data, gradPrefix, height = 40 }: {
  data: TrendPoint[]; gradPrefix: string; height?: number;
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <span className="text-[10px] text-slate-300 dark:text-white/20">sin tendencia</span>
      </div>
    );
  }
  const gid = `${gradPrefix}-${cssId(data[0]?.label ?? 'x')}`;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#11AEB3" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#11AEB3" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="score"
          stroke="#11AEB3"
          strokeWidth={1.5}
          fill={`url(#${gid})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── MetaBar ──────────────────────────────────────────────────────────────────
function MetaBar({ label, value, max, goal, format, invert = false }: {
  label: string; value: number; max: number; goal: number;
  format: (v: number) => string; invert?: boolean;
}) {
  const pct     = Math.min(100, (value / max) * 100);
  const goalPct = Math.min(100, (goal  / max) * 100);
  const ok      = invert ? value <= goal : value >= goal;

  return (
    <div className="flex items-center gap-2">
      <span className="w-9 shrink-0 text-[10px] text-slate-400 dark:text-white/30">{label}</span>
      <div className="relative h-1.5 flex-1 rounded-full bg-slate-100 dark:bg-white/10">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all ${ok ? 'bg-emerald-500' : 'bg-amber-400'}`}
          style={{ width: `${pct}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded bg-slate-400/60 dark:bg-white/30"
          style={{ left: `${goalPct}%` }}
          title={`Meta: ${format(goal)}`}
        />
      </div>
      <span className={`w-10 shrink-0 text-right text-[10px] font-bold tabular-nums ${
        ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
      }`}>
        {format(value)}
      </span>
    </div>
  );
}

// ─── Rank badge ───────────────────────────────────────────────────────────────
function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-base leading-none" aria-label="1er lugar">🥇</span>;
  if (rank === 2) return <span className="text-base leading-none" aria-label="2do lugar">🥈</span>;
  if (rank === 3) return <span className="text-base leading-none" aria-label="3er lugar">🥉</span>;
  return (
    <span className="min-w-[22px] text-center text-[10px] font-bold text-slate-400 tabular-nums dark:text-white/30">
      #{rank}
    </span>
  );
}

// ─── Vs-grupo chip ────────────────────────────────────────────────────────────
function VsGroup({ agentVal, groupVal, format, invert = false }: {
  agentVal: number; groupVal: number; format: (v: number) => string; invert?: boolean;
}) {
  const diff = agentVal - groupVal;
  const better = invert ? diff < 0 : diff > 0;
  const sign = diff > 0 ? '+' : '';
  if (Math.abs(diff) < 0.001) return null;
  return (
    <span className={`ml-1 text-[9px] font-semibold ${better ? 'text-emerald-500' : 'text-rose-400'}`}>
      ({sign}{format(diff)} vs grupo)
    </span>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function AgentDetailPanel({
  stats, trend, groupAvg, rank, onClose,
}: {
  stats: AgentStats; trend: TrendPoint[]; groupAvg: AgentStats; rank: number; onClose: () => void;
}) {
  const tier = agentTier(stats);
  const cfg  = TIER_CFG[tier];

  const detailRows = [
    { label: 'Llamadas',      value: String(stats.totalCalls), raw: stats.totalCalls,  grp: groupAvg.totalCalls,  fmt: (v: number) => String(Math.round(v)), neutral: true },
    { label: 'Score',         value: stats.avgScore.toFixed(2), raw: stats.avgScore,   grp: groupAvg.avgScore,    fmt: (v: number) => v.toFixed(2) },
    { label: 'QA',            value: stats.avgQaScore.toFixed(0), raw: stats.avgQaScore, grp: groupAvg.avgQaScore, fmt: (v: number) => v.toFixed(1) },
    { label: 'SLA',           value: fp(stats.slaRate),  raw: stats.slaRate,  grp: groupAvg.slaRate,  fmt: (v: number) => fp(v) },
    { label: 'FCR',           value: fp(stats.fcrRate),  raw: stats.fcrRate,  grp: groupAvg.fcrRate,  fmt: (v: number) => fp(v) },
    { label: 'Transferencias',value: fp(stats.transferRate), raw: stats.transferRate, grp: groupAvg.transferRate, fmt: (v: number) => fp(v), invert: true },
    { label: 'AHT',           value: fs(stats.avgDuration), raw: stats.avgDuration, grp: groupAvg.avgDuration, fmt: (v: number) => fs(v), invert: true, neutral: true },
    { label: 'Espera (ASA)',  value: fs(stats.avgWait),  raw: stats.avgWait,  grp: groupAvg.avgWait,  fmt: (v: number) => fs(v), invert: true },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className="relative rounded-xl border-2 border-que-teal bg-white p-5 shadow-panel dark:bg-slate-900"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-400 hover:text-slate-700 dark:border-white/10 dark:hover:text-white"
      >
        <X size={14} />
      </button>

      {/* Top: avatar + name + rank */}
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-black ${avatarColor(stats.agent)}`}>
              {initials(stats.agent)}
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm dark:bg-slate-800">
              <RankBadge rank={rank} />
            </div>
          </div>
          <div>
            <p className="text-base font-bold text-ink dark:text-white">{stats.agent}</p>
            {stats.documento && (
              <p className="text-[11px] tabular-nums text-slate-400 dark:text-white/40">Doc: {stats.documento}</p>
            )}
            <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.cls}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        <div className="hidden h-14 w-px bg-slate-200 dark:bg-white/10 sm:block" />

        {/* Metric grid */}
        <div className="flex flex-1 flex-wrap gap-x-6 gap-y-3">
          {detailRows.map(({ label, value, raw, grp, fmt, invert, neutral }) => {
            const diff = raw - grp;
            const better = invert ? diff < 0 : diff > 0;
            const color = neutral
              ? 'text-ink dark:text-white'
              : better ? 'text-emerald-600' : Math.abs(diff) < 0.001 ? 'text-ink dark:text-white' : 'text-rose-500';
            return (
              <div key={label}>
                <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-white/30">{label}</p>
                <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
                {!neutral && (
                  <p className="text-[10px] text-slate-400 dark:text-white/30">
                    grupo: {fmt(grp)}
                    <VsGroup agentVal={raw} groupVal={grp} format={fmt} invert={invert} />
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sparkline trend */}
      {trend.length >= 2 && (
        <div className="mt-4 border-t border-slate-100 pt-4 dark:border-white/10">
          <p className="mb-2 text-[10px] uppercase tracking-wide text-slate-400 dark:text-white/30">
            Puntaje por semana · últimas {trend.length} semanas
          </p>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <Sparkline data={trend} gradPrefix={`det-${cssId(stats.agent)}`} height={64} />
            </div>
            <div className="text-right">
              <p className="text-[9px] text-slate-400 dark:text-white/30">Última sem.</p>
              <p className="text-lg font-black text-que-teal tabular-nums">
                {trend[trend.length - 1]?.score.toFixed(2) ?? '—'}
              </p>
            </div>
          </div>
          {/* week labels */}
          <div className="mt-1 flex justify-between px-1">
            {trend.map((t, i) => (
              <span key={i} className="text-[8px] text-slate-300 dark:text-white/20">{t.label}</span>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ─── Agent card ───────────────────────────────────────────────────────────────
function AgentCard({ stats, trend, rank, selected, onClick }: {
  stats: AgentStats; trend: TrendPoint[]; rank: number; selected: boolean; onClick: () => void;
}) {
  const tier = agentTier(stats);
  const cfg  = TIER_CFG[tier];

  return (
    <motion.button
      type="button"
      onClick={onClick}
      layout
      whileTap={{ scale: 0.98 }}
      className={`group relative w-full rounded-xl border-2 bg-white p-4 text-left shadow-panel transition-all dark:bg-slate-900 ${
        selected
          ? 'border-que-teal shadow-que-teal/15'
          : 'border-slate-200 hover:border-slate-300 dark:border-white/10 dark:hover:border-white/20'
      }`}
    >
      {/* Top row: rank + tier + calls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <RankBadge rank={rank} />
          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cfg.cls}`}>
            {cfg.label}
          </span>
        </div>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold tabular-nums text-slate-500 dark:bg-white/10 dark:text-white/50">
          {stats.totalCalls} llamadas
        </span>
      </div>

      {/* Avatar + name */}
      <div className="mt-3 flex items-center gap-2.5">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${avatarColor(stats.agent)}`}>
          {initials(stats.agent)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink dark:text-white">{stats.agent}</p>
          {stats.documento && (
            <p className="truncate text-[10px] tabular-nums text-slate-400 dark:text-white/30">{stats.documento}</p>
          )}
        </div>
      </div>

      {/* Mini sparkline */}
      <div className="mt-3 border-t border-slate-100 pt-2 dark:border-white/10">
        <p className="mb-0.5 text-[9px] uppercase tracking-wide text-slate-400 dark:text-white/20">
          Puntaje · semanas recientes
        </p>
        <Sparkline data={trend} gradPrefix={`card-${cssId(stats.agent)}`} height={36} />
      </div>

      {/* Progress bars vs meta */}
      <div className="mt-3 space-y-2 border-t border-slate-100 pt-3 dark:border-white/10">
        <MetaBar
          label="Score"
          value={stats.avgScore}
          max={5}
          goal={4.5}
          format={(v) => v.toFixed(1)}
        />
        <MetaBar
          label="SLA"
          value={stats.slaRate * 100}
          max={100}
          goal={80}
          format={(v) => `${v.toFixed(0)}%`}
        />
        <MetaBar
          label="FCR"
          value={stats.fcrRate * 100}
          max={100}
          goal={75}
          format={(v) => `${v.toFixed(0)}%`}
        />
      </div>
    </motion.button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface AgentViewProps {
  stats: AgentStats[];
  rawCalls?: CallRecord[];
}

export function AgentView({ stats, rawCalls = [] }: AgentViewProps) {
  const [search, setSearch]     = useState('');
  const [sortKey, setSortKey]   = useState<SortKey>('calls');
  const [sortAsc, setSortAsc]   = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const trendMap = useMemo(() => buildTrendMap(rawCalls), [rawCalls]);

  const groupAvg = useMemo<AgentStats>(() => {
    const n = stats.length;
    if (n === 0) return {
      agent: '', totalCalls: 0, avgScore: 0, avgQaScore: 0,
      slaRate: 0, fcrRate: 0, transferRate: 0, abandonRate: 0, avgDuration: 0, avgWait: 0,
    };
    const sum = <K extends keyof AgentStats>(key: K) =>
      (stats.reduce((acc, a) => acc + (a[key] as number), 0) / n) as number;
    return {
      agent: 'Grupo',
      totalCalls:   Math.round(sum('totalCalls')),
      avgScore:     sum('avgScore'),
      avgQaScore:   sum('avgQaScore'),
      slaRate:      sum('slaRate'),
      fcrRate:      sum('fcrRate'),
      transferRate: sum('transferRate'),
      abandonRate:  sum('abandonRate'),
      avgDuration:  sum('avgDuration'),
      avgWait:      sum('avgWait'),
    };
  }, [stats]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = q
      ? stats.filter(
          (s) =>
            s.agent.toLowerCase().includes(q) ||
            (s.documento?.toLowerCase().includes(q) ?? false),
        )
      : stats;
    return sortStats(base, sortKey, sortAsc);
  }, [stats, search, sortKey, sortAsc]);

  const selectedStats = useMemo(
    () => filtered.find((s) => s.agent === selected) ?? null,
    [filtered, selected],
  );
  const selectedRank = useMemo(
    () => filtered.findIndex((s) => s.agent === selected) + 1,
    [filtered, selected],
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  }

  const counts = useMemo(() => {
    const tiers: Record<Tier, number> = { destacado: 0, bueno: 0, regular: 0, riesgo: 0 };
    stats.forEach((s) => { tiers[agentTier(s)]++; });
    return tiers;
  }, [stats]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink dark:text-white">Vista por agente</h2>
          <div className="mt-1 flex flex-wrap gap-2">
            {(Object.entries(counts) as [Tier, number][]).map(
              ([tier, n]) =>
                n > 0 && (
                  <span
                    key={tier}
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TIER_CFG[tier].cls}`}
                  >
                    {n} {TIER_CFG[tier].label}
                  </span>
                ),
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => exportAgentsToCsv(filtered)}
          className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-ink shadow-sm transition hover:border-que-teal dark:border-white/10 dark:bg-slate-800 dark:text-white"
        >
          <Download size={13} aria-hidden="true" />
          Exportar CSV
        </button>

        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar por nombre o documento..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setSelected(null); }}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-9 text-sm text-ink shadow-sm placeholder:text-slate-400 focus:border-que-teal focus:outline-none dark:border-white/10 dark:bg-slate-800 dark:text-white dark:placeholder:text-white/30"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Sort bar */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-slate-500 dark:text-white/40">Ordenar:</span>
        {SORT_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => toggleSort(key)}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              sortKey === key
                ? 'bg-ink text-white dark:bg-que-teal'
                : 'border border-slate-200 bg-white text-slate-500 hover:border-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-white/50 dark:hover:border-white/30'
            }`}
          >
            {label}
            {sortKey === key && (sortAsc ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
          </button>
        ))}
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selectedStats && (
          <AgentDetailPanel
            key={selectedStats.agent}
            stats={selectedStats}
            trend={trendMap.get(selectedStats.agent) ?? []}
            groupAvg={groupAvg}
            rank={selectedRank}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center dark:border-white/10 dark:bg-white/5">
          <Search size={36} className="mx-auto mb-3 text-slate-300 dark:text-white/20" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-500 dark:text-white/40">
            Sin resultados para &ldquo;{search}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setSearch('')}
            className="mt-3 text-xs text-que-teal hover:underline"
          >
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s, i) => (
            <AgentCard
              key={s.agent}
              stats={s}
              trend={trendMap.get(s.agent) ?? []}
              rank={i + 1}
              selected={selected === s.agent}
              onClick={() => setSelected((prev) => (prev === s.agent ? null : s.agent))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
