type Period = 'todos' | 'dia' | 'mes' | 'año';

interface PeriodPickerProps {
  period: Period;
  value: string;
  availableDays: string[];
  availableMonths: string[];
  availableYears: string[];
  onChange: (value: string) => void;
}

const SELECT_CLASS =
  'h-9 rounded-md border border-slate-300 bg-white px-2 text-xs text-ink shadow-sm dark:border-white/10 dark:bg-slate-900 dark:text-white';

export function PeriodPicker({ period, value, availableDays, availableMonths, availableYears, onChange }: PeriodPickerProps) {
  if (period === 'todos') return null;

  if (period === 'dia') return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS} aria-label="Seleccionar día">
      <option value="">Todos los días</option>
      {availableDays.map((d) => <option key={d} value={d}>{d}</option>)}
    </select>
  );

  if (period === 'mes') return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS} aria-label="Seleccionar mes">
      <option value="">Todos los meses</option>
      {availableMonths.map((m) => <option key={m} value={m}>{m}</option>)}
    </select>
  );

  if (period === 'año') return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLASS} aria-label="Seleccionar año">
      <option value="">Todos los años</option>
      {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
    </select>
  );

  return null;
}
