import {
  Award, Briefcase, CalendarDays, CheckCircle, Clock,
  Coffee, PhoneCall, PhoneOff, RotateCcw, Shuffle,
  TrendingDown, TrendingUp, X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { ThresholdSet } from '../lib/useThresholds';

interface Props {
  thresholds: ThresholdSet;
  onUpdate: (patch: Partial<ThresholdSet>) => void;
  onReset: () => void;
  onClose: () => void;
}

// ─── Color gradient bar showing the three semáforo zones ─────────────────────
function ZoneBar({ good, warning, min, max, invert }: {
  good: number; warning: number; min: number; max: number; invert: boolean;
}) {
  const span = max - min || 1;
  const gp = Math.min(100, Math.max(0, ((good - min) / span) * 100));
  const wp = Math.min(100, Math.max(0, ((warning - min) / span) * 100));

  // normal  (higher=better): red ─▶ yellow ─▶ green
  // inverted (lower=better): green ─▶ yellow ─▶ red
  const gradient = invert
    ? `linear-gradient(to right,#22c55e 0%,#22c55e ${gp}%,#eab308 ${gp}%,#eab308 ${wp}%,#ef4444 ${wp}%,#ef4444 100%)`
    : `linear-gradient(to right,#ef4444 0%,#ef4444 ${wp}%,#eab308 ${wp}%,#eab308 ${gp}%,#22c55e ${gp}%,#22c55e 100%)`;

  return (
    <div className="relative h-3 w-full overflow-hidden rounded-full" style={{ background: gradient }}>
      <div className="absolute inset-y-0 w-px bg-white/70" style={{ left: `${wp}%` }} />
      <div className="absolute inset-y-0 w-px bg-white/70" style={{ left: `${gp}%` }} />
    </div>
  );
}

// ─── Single-value progress bar (for occupancy single thresholds) ──────────────
function SingleBar({ value, min, max }: { value: number; min: number; max: number }) {
  const pct = Math.min(100, Math.max(0, ((value - min) / (max - min || 1)) * 100));
  return (
    <div className="h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
      <div className="h-full rounded-full bg-que-teal transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Labeled slider row ───────────────────────────────────────────────────────
function SliderRow({ label, value, onChange, min, max, step, unit, dot }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit: string; dot: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${dot}`} />
      <span className="w-20 flex-shrink-0 text-[11px] text-slate-500 dark:text-white/40">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-slate-200 accent-[#11AEB3] dark:bg-white/10"
      />
      <span className="w-16 text-right text-sm font-bold tabular-nums text-ink dark:text-white">
        {value}{unit}
      </span>
    </div>
  );
}

// ─── Metric card with zone bar + two sliders ──────────────────────────────────
function MetricCard({
  icon, title, description, invert = false, unit = '%',
  goodLabel, goodValue, onGoodChange,
  warnLabel, warnValue, onWarnChange,
  min = 0, max = 100, step = 1,
}: {
  icon: ReactNode; title: string; description: string; invert?: boolean; unit?: string;
  goodLabel: string; goodValue: number; onGoodChange: (v: number) => void;
  warnLabel: string; warnValue: number; onWarnChange: (v: number) => void;
  min?: number; max?: number; step?: number;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/[0.02]">
      <div className="mb-3 flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200/60 text-slate-500 dark:bg-white/10 dark:text-white/50" aria-hidden="true">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink dark:text-white">{title}</p>
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-white/30">{description}</p>
        </div>
        <span className={`ml-1 flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
          invert
            ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/30 dark:text-rose-400'
            : 'bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400'
        }`}>
          {invert ? '↓ menor' : '↑ mayor'}
        </span>
      </div>

      {/* Zone gradient bar */}
      <div className="mb-3">
        <ZoneBar good={goodValue} warning={warnValue} min={min} max={max} invert={invert} />
        <div className="mt-1 flex justify-between text-[9px] text-slate-300 dark:text-white/15">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-2.5">
        <SliderRow
          label={goodLabel}
          value={goodValue}
          onChange={onGoodChange}
          min={min} max={max} step={step} unit={unit}
          dot="bg-green-500"
        />
        <SliderRow
          label={warnLabel}
          value={warnValue}
          onChange={onWarnChange}
          min={min} max={max} step={step} unit={unit}
          dot="bg-amber-400"
        />
      </div>
    </div>
  );
}

// ─── Single-threshold card ────────────────────────────────────────────────────
function SingleCard({
  icon, title, description, unit = '%',
  label, value, onChange, min = 0, max = 100, step = 1,
}: {
  icon: ReactNode; title: string; description: string; unit?: string;
  label: string; value: number; onChange: (v: number) => void;
  min?: number; max?: number; step?: number;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-white/5 dark:bg-white/[0.02]">
      <div className="mb-3 flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-200/60 text-slate-500 dark:bg-white/10 dark:text-white/50" aria-hidden="true">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink dark:text-white">{title}</p>
          <p className="mt-0.5 text-[11px] text-slate-400 dark:text-white/30">{description}</p>
        </div>
      </div>
      <SingleBar value={value} min={min} max={max} />
      <div className="mt-3">
        <SliderRow label={label} value={value} onChange={onChange} min={min} max={max} step={step} unit={unit} dot="bg-que-teal" />
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/25">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export function ThresholdConfig({ thresholds: t, onUpdate, onReset, onClose }: Props) {
  // Convert internal ratio (0–1) ↔ display percent (0–100)
  const pct = (v: number) => Math.round(v * 100);
  const rat = (v: number) => v / 100;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel dark:border-white/10 dark:bg-slate-900">

      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-ink dark:text-white">Editar metas del dashboard</h3>
          <p className="mt-0.5 text-xs text-slate-400 dark:text-white/30">
            Mueve los controles — el semáforo cambia en tiempo real en todos los módulos
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:border-slate-400 dark:border-white/10 dark:text-white/50"
          >
            <RotateCcw size={12} />
            Restaurar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:border-slate-400 hover:text-slate-600 dark:border-white/10"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="mb-5 flex flex-wrap items-center gap-4 rounded-lg bg-slate-50 px-4 py-2.5 dark:bg-white/5">
        <span className="text-[11px] font-semibold text-slate-400 dark:text-white/30">Semáforo:</span>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-white/40">
          <div className="h-2.5 w-5 rounded-full bg-green-500 opacity-80" />
          Meta cumplida
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-white/40">
          <div className="h-2.5 w-5 rounded-full bg-amber-400 opacity-80" />
          En riesgo
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-white/40">
          <div className="h-2.5 w-5 rounded-full bg-red-500 opacity-80" />
          Por debajo de meta
        </div>
      </div>

      <div className="space-y-7">

        {/* ── Operaciones ──────────────────────────────────────────────────── */}
        <Section title="Operaciones · ¿qué tan bien respondemos?">
          <MetricCard
            icon={<PhoneCall size={16} />} title="SLA de servicio"
            description="% llamadas atendidas dentro del tiempo objetivo"
            goodLabel="Meta ≥" goodValue={pct(t.sla.good)}
            onGoodChange={(v) => onUpdate({ sla: { ...t.sla, good: rat(v) } })}
            warnLabel="Riesgo ≥" warnValue={pct(t.sla.warning)}
            onWarnChange={(v) => onUpdate({ sla: { ...t.sla, warning: rat(v) } })}
          />
          <MetricCard
            icon={<PhoneOff size={16} />} title="Tasa de abandono"
            description="% llamadas que cuelgan sin ser atendidas" invert
            goodLabel="Meta ≤" goodValue={pct(t.abandon.good)}
            onGoodChange={(v) => onUpdate({ abandon: { ...t.abandon, good: rat(v) } })}
            warnLabel="Riesgo ≤" warnValue={pct(t.abandon.warning)}
            onWarnChange={(v) => onUpdate({ abandon: { ...t.abandon, warning: rat(v) } })}
          />
          <MetricCard
            icon={<Clock size={16} />} title="Tiempo de respuesta (ASA)"
            description="Segundos promedio antes de que un agente atienda"
            invert unit="s" min={0} max={120} step={5}
            goodLabel="Meta ≤" goodValue={t.asa.good}
            onGoodChange={(v) => onUpdate({ asa: { ...t.asa, good: v } })}
            warnLabel="Riesgo ≤" warnValue={t.asa.warning}
            onWarnChange={(v) => onUpdate({ asa: { ...t.asa, warning: v } })}
          />
        </Section>

        {/* ── WFM ──────────────────────────────────────────────────────────── */}
        <Section title="WFM · ¿cómo administramos la fuerza laboral?">
          <MetricCard
            icon={<Briefcase size={16} />} title="Utilizacion"
            description="% del tiempo que el agente está productivamente ocupado"
            goodLabel="Meta ≥" goodValue={pct(t.utilization.good)}
            onGoodChange={(v) => onUpdate({ utilization: { ...t.utilization, good: rat(v) } })}
            warnLabel="Riesgo ≥" warnValue={pct(t.utilization.warning)}
            onWarnChange={(v) => onUpdate({ utilization: { ...t.utilization, warning: rat(v) } })}
          />
          <MetricCard
            icon={<Coffee size={16} />} title="Shrinkage"
            description="% tiempo fuera de servicio (pausas, capacitaciones, ausencias)" invert
            goodLabel="Meta ≤" goodValue={pct(t.shrinkage.good)}
            onGoodChange={(v) => onUpdate({ shrinkage: { ...t.shrinkage, good: rat(v) } })}
            warnLabel="Riesgo ≤" warnValue={pct(t.shrinkage.warning)}
            onWarnChange={(v) => onUpdate({ shrinkage: { ...t.shrinkage, warning: rat(v) } })}
          />
          <MetricCard
            icon={<CalendarDays size={16} />} title="Adherencia al horario"
            description="% del horario programado que el agente realmente cumplió"
            goodLabel="Meta ≥" goodValue={pct(t.adherence.good)}
            onGoodChange={(v) => onUpdate({ adherence: { ...t.adherence, good: rat(v) } })}
            warnLabel="Riesgo ≥" warnValue={pct(t.adherence.warning)}
            onWarnChange={(v) => onUpdate({ adherence: { ...t.adherence, warning: rat(v) } })}
          />
          <SingleCard
            icon={<TrendingDown size={16} />} title="Ocupacion minima"
            description="Mínimo de tiempo que el agente debe estar en llamadas activas"
            label="Mínimo" value={pct(t.occupancyMin)}
            onChange={(v) => onUpdate({ occupancyMin: rat(v) })}
          />
          <SingleCard
            icon={<TrendingUp size={16} />} title="Ocupacion maxima"
            description="Tope de ocupación para evitar sobrecarga del agente"
            label="Máximo" value={pct(t.occupancyMax)}
            onChange={(v) => onUpdate({ occupancyMax: rat(v) })}
          />
        </Section>

        {/* ── Calidad ──────────────────────────────────────────────────────── */}
        <Section title="Calidad · ¿qué tan bien resolvemos?">
          <MetricCard
            icon={<CheckCircle size={16} />} title="Resolucion en primera llamada (FCR)"
            description="Casos resueltos sin que el cliente tenga que volver a llamar"
            goodLabel="Meta ≥" goodValue={pct(t.fcr.good)}
            onGoodChange={(v) => onUpdate({ fcr: { ...t.fcr, good: rat(v) } })}
            warnLabel="Riesgo ≥" warnValue={pct(t.fcr.warning)}
            onWarnChange={(v) => onUpdate({ fcr: { ...t.fcr, warning: rat(v) } })}
          />
          <MetricCard
            icon={<Shuffle size={16} />} title="Tasa de transferencia"
            description="% llamadas redirigidas a otro agente o área" invert
            goodLabel="Meta ≤" goodValue={pct(t.transferRate.good)}
            onGoodChange={(v) => onUpdate({ transferRate: { ...t.transferRate, good: rat(v) } })}
            warnLabel="Riesgo ≤" warnValue={pct(t.transferRate.warning)}
            onWarnChange={(v) => onUpdate({ transferRate: { ...t.transferRate, warning: rat(v) } })}
          />
          <MetricCard
            icon={<Award size={16} />} title="Puntaje de calidad (QA)"
            description="Calificación promedio obtenida en monitoreos de calidad"
            unit=" pts" min={0} max={100} step={1}
            goodLabel="Meta ≥" goodValue={t.qaScore.good}
            onGoodChange={(v) => onUpdate({ qaScore: { ...t.qaScore, good: v } })}
            warnLabel="Riesgo ≥" warnValue={t.qaScore.warning}
            onWarnChange={(v) => onUpdate({ qaScore: { ...t.qaScore, warning: v } })}
          />
        </Section>

      </div>

      <p className="mt-5 text-[10px] text-slate-400 dark:text-white/25">
        Guardado en tu navegador · Los cambios se reflejan en tiempo real en todos los semáforos del dashboard
      </p>
    </div>
  );
}
