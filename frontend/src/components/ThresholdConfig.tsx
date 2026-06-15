import { RotateCcw, X } from 'lucide-react';
import type { ThresholdSet } from '../lib/useThresholds';

interface Props {
  thresholds: ThresholdSet;
  onUpdate: (patch: Partial<ThresholdSet>) => void;
  onReset: () => void;
  onClose: () => void;
}

function PctField({
  label, value, onChange, invert = false,
}: {
  label: string; value: number; onChange: (v: number) => void; invert?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 text-xs text-slate-500 dark:text-white/50">{label}</span>
      <input
        type="number"
        min={0}
        max={100}
        step={1}
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="h-8 w-20 rounded-md border border-slate-300 bg-white px-2 text-center text-xs font-semibold text-ink tabular-nums shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-white"
      />
      <span className="text-xs text-slate-400">%</span>
      <span className="text-[10px] text-slate-400 dark:text-white/30">{invert ? '(menor = mejor)' : '(mayor = mejor)'}</span>
    </div>
  );
}

function SecField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-28 text-xs text-slate-500 dark:text-white/50">{label}</span>
      <input
        type="number"
        min={0}
        step={5}
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 w-20 rounded-md border border-slate-300 bg-white px-2 text-center text-xs font-semibold text-ink tabular-nums shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-white"
      />
      <span className="text-xs text-slate-400">s</span>
    </div>
  );
}

export function ThresholdConfig({ thresholds: t, onUpdate, onReset, onClose }: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel dark:border-white/10 dark:bg-slate-900">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink dark:text-white">Configurar umbrales de semáforo</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 dark:border-white/10 dark:text-white/60"
          >
            <RotateCcw size={12} />
            Restaurar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition hover:text-slate-600 dark:border-white/10"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Operaciones */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-white/30">Operaciones</p>
          <PctField label="SLA – bueno ≥"    value={t.sla.good}    onChange={(v) => onUpdate({ sla: { ...t.sla,    good: v } })} />
          <PctField label="SLA – riesgo ≥"   value={t.sla.warning} onChange={(v) => onUpdate({ sla: { ...t.sla,    warning: v } })} />
          <PctField label="Abandono – bueno ≤" value={t.abandon.good}    onChange={(v) => onUpdate({ abandon: { ...t.abandon, good: v } })} invert />
          <PctField label="Abandono – riesgo ≤" value={t.abandon.warning} onChange={(v) => onUpdate({ abandon: { ...t.abandon, warning: v } })} invert />
          <SecField  label="ASA – bueno ≤"   value={t.asa.good}    onChange={(v) => onUpdate({ asa: { ...t.asa,    good: v } })} />
          <SecField  label="ASA – riesgo ≤"  value={t.asa.warning} onChange={(v) => onUpdate({ asa: { ...t.asa,    warning: v } })} />
        </div>

        {/* WFM */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-white/30">WFM</p>
          <PctField label="Ocup. mínima"     value={t.occupancyMin}          onChange={(v) => onUpdate({ occupancyMin: v })} />
          <PctField label="Ocup. máxima"     value={t.occupancyMax}          onChange={(v) => onUpdate({ occupancyMax: v })} />
          <PctField label="Utiliz. buena ≥"  value={t.utilization.good}      onChange={(v) => onUpdate({ utilization: { ...t.utilization, good: v } })} />
          <PctField label="Shrinkage buen ≤" value={t.shrinkage.good}        onChange={(v) => onUpdate({ shrinkage:   { ...t.shrinkage,   good: v } })} invert />
          <PctField label="Adherencia ≥"     value={t.adherence.good}        onChange={(v) => onUpdate({ adherence:   { ...t.adherence,   good: v } })} />
        </div>

        {/* Calidad */}
        <div className="space-y-2 md:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-white/30">Calidad</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <PctField label="FCR bueno ≥"       value={t.fcr.good}          onChange={(v) => onUpdate({ fcr:          { ...t.fcr,          good: v } })} />
            <PctField label="Transfer. buen ≤"  value={t.transferRate.good} onChange={(v) => onUpdate({ transferRate: { ...t.transferRate, good: v } })} invert />
          </div>
        </div>
      </div>

      <p className="mt-4 text-[10px] text-slate-400 dark:text-white/25">
        Los umbrales se guardan en tu navegador. Los cambios se reflejan inmediatamente en los semáforos.
      </p>
    </div>
  );
}
