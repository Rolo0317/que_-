import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { AgentStats } from '../types/calls';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fp = (v: number) => `${(v * 100).toFixed(0)}%`;
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
  if (score >= 4.5 && sla >= 0.85 && fcr >= 0.8)  return 'destacado';
  if (score >= 4.0 && sla >= 0.75 && fcr >= 0.7)   return 'bueno';
  if (score >= 3.5 && sla >= 0.6)                   return 'regular';
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
      key === 'calls' ? a.totalCalls  - b.totalCalls  :
      key === 'score' ? a.avgScore    - b.avgScore     :
      key === 'sla'   ? a.slaRate     - b.slaRate      :
      key === 'fcr'   ? a.fcrRate     - b.fcrRate      :
      a.avgDuration   - b.avgDuration;
    return asc ? diff : -diff;
  });
}

// ─── Metric pill ──────────────────────────────────────────────────────────────
function Pill({ label, value, good, warn, invert = false }: {
  label: string; value: string; good: boolean; warn: boolean; invert?: boolean;
}) {
  const color = good
    ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30'
    : warn
    ? 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/30'
    : 'text-rose-700 bg-rose-50 dark:text-rose-400 dark:bg-rose-900/30';
  void invert;
  return (
    <div className="flex flex-col items-center">
      <span className={`rounded-md px-2 py-0.5 text-xs font-bold tabular-nums ${color}`}>{value}</span>
      <span className="mt-0.5 text-[9px] uppercase tracking-wide text-slate-400 dark:text-white/30">{label}</span>
    </div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function AgentDetailPanel({ stats, onClose }: { stats: AgentStats; onClose: () => void }) {
  const tier = agentTier(stats);
  const cfg  = TIER_CFG[tier];
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

      <div className="flex flex-wrap items-start gap-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          <div className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-black ${avatarColor(stats.agent)}`}>
            {initials(stats.agent)}
          </div>
          <div>
            <p className="text-base font-bold text-ink dark:text-white">{stats.agent}</p>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${cfg.cls}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden h-14 w-px bg-slate-200 dark:bg-white/10 sm:block" />

        {/* All metrics */}
        <div className="flex flex-1 flex-wrap gap-x-6 gap-y-3">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-white/30">Llamadas</p>
            <p className="text-2xl font-black text-ink dark:text-white tabular-nums">{stats.totalCalls}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-white/30">Score</p>
            <p className={`text-2xl font-black tabular-nums ${stats.avgScore >= 4.5 ? 'text-emerald-600' : stats.avgScore >= 4.0 ? 'text-amber-600' : 'text-rose-600'}`}>
              {stats.avgScore.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-white/30">QA</p>
            <p className={`text-2xl font-black tabular-nums ${stats.avgQaScore >= 90 ? 'text-emerald-600' : stats.avgQaScore >= 80 ? 'text-amber-600' : 'text-rose-600'}`}>
              {stats.avgQaScore.toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-white/30">SLA</p>
            <p className={`text-2xl font-black tabular-nums ${stats.slaRate >= 0.8 ? 'text-emerald-600' : stats.slaRate >= 0.7 ? 'text-amber-600' : 'text-rose-600'}`}>
              {fp(stats.slaRate)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-white/30">FCR</p>
            <p className={`text-2xl font-black tabular-nums ${stats.fcrRate >= 0.8 ? 'text-emerald-600' : stats.fcrRate >= 0.7 ? 'text-amber-600' : 'text-rose-600'}`}>
              {fp(stats.fcrRate)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-white/30">Transferencias</p>
            <p className={`text-2xl font-black tabular-nums ${stats.transferRate <= 0.1 ? 'text-emerald-600' : stats.transferRate <= 0.2 ? 'text-amber-600' : 'text-rose-600'}`}>
              {fp(stats.transferRate)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-white/30">AHT</p>
            <p className="text-2xl font-black tabular-nums text-ink dark:text-white">{fs(stats.avgDuration)}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-white/30">ASA (espera)</p>
            <p className={`text-2xl font-black tabular-nums ${stats.avgWait <= 30 ? 'text-emerald-600' : stats.avgWait <= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
              {fs(stats.avgWait)}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Agent card ───────────────────────────────────────────────────────────────
function AgentCard({ stats, selected, onClick }: {
  stats: AgentStats; selected: boolean; onClick: () => void;
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
      {/* Performance badge */}
      <div className="flex items-start justify-between">
        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${cfg.cls}`}>
          {cfg.label}
        </span>
        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 tabular-nums dark:bg-white/10 dark:text-white/50">
          {stats.totalCalls} llamadas
        </span>
      </div>

      {/* Avatar + name */}
      <div className="mt-3 flex items-center gap-3">
        <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-black ${avatarColor(stats.agent)}`}>
          {initials(stats.agent)}
        </div>
        <p className="truncate text-sm font-bold text-ink dark:text-white">{stats.agent}</p>
      </div>

      {/* Metrics */}
      <div className="mt-4 flex items-center justify-around border-t border-slate-100 pt-4 dark:border-white/10">
        <Pill
          label="Score"
          value={stats.avgScore.toFixed(1)}
          good={stats.avgScore >= 4.5}
          warn={stats.avgScore >= 4.0}
        />
        <Pill
          label="SLA"
          value={fp(stats.slaRate)}
          good={stats.slaRate >= 0.8}
          warn={stats.slaRate >= 0.7}
        />
        <Pill
          label="FCR"
          value={fp(stats.fcrRate)}
          good={stats.fcrRate >= 0.8}
          warn={stats.fcrRate >= 0.7}
        />
        <Pill
          label="AHT"
          value={fs(stats.avgDuration)}
          good={stats.avgDuration <= 300}
          warn={stats.avgDuration <= 480}
        />
      </div>
    </motion.button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface AgentViewProps {
  stats: AgentStats[];
}

export function AgentView({ stats }: AgentViewProps) {
  const [search, setSearch]       = useState('');
  const [sortKey, setSortKey]     = useState<SortKey>('calls');
  const [sortAsc, setSortAsc]     = useState(false);
  const [selected, setSelected]   = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = q ? stats.filter((s) => s.agent.toLowerCase().includes(q)) : stats;
    return sortStats(base, sortKey, sortAsc);
  }, [stats, search, sortKey, sortAsc]);

  const selectedStats = useMemo(
    () => filtered.find((s) => s.agent === selected) ?? null,
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
            {(Object.entries(counts) as [Tier, number][]).map(([tier, n]) => n > 0 && (
              <span key={tier} className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TIER_CFG[tier].cls}`}>
                {n} {TIER_CFG[tier].label}
              </span>
            ))}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar agente..."
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
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      {/* Agent cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white py-16 text-center dark:border-white/10 dark:bg-white/5">
          <Search size={36} className="mx-auto mb-3 text-slate-300 dark:text-white/20" aria-hidden="true" />
          <p className="text-sm font-semibold text-slate-500 dark:text-white/40">Sin resultados para "{search}"</p>
          <button type="button" onClick={() => setSearch('')} className="mt-3 text-xs text-que-teal hover:underline">
            Limpiar búsqueda
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s) => (
            <AgentCard
              key={s.agent}
              stats={s}
              selected={selected === s.agent}
              onClick={() => setSelected((prev) => (prev === s.agent ? null : s.agent))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
