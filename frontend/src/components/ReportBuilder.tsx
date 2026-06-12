import { BrandLogo } from './BrandLogo';

const options = [
  { id: 'hourly', label: 'Llamadas por hora' },
  { id: 'mix', label: 'Mix Inbound/Outbound' },
  { id: 'scores', label: 'Calificacion por agente' },
] as const;

type ChartId = (typeof options)[number]['id'];

interface ReportBuilderProps {
  selected: ChartId[];
  onChange: (selected: ChartId[]) => void;
}

export function ReportBuilder({ selected, onChange }: ReportBuilderProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel dark:border-white/10 dark:bg-white/10">
      {/* Header con logo */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-gradient-to-r from-ink to-slate-800 px-4 py-3 dark:border-white/10">
        <span className="text-sm font-semibold text-white">Arma tu informe</span>
        <BrandLogo className="w-16 opacity-90" />
      </div>
      <fieldset className="p-4">
        <legend className="sr-only">Selecciona las graficas a mostrar</legend>
        <div className="grid gap-3">
          {options.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center gap-3 rounded-md p-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-white/75 dark:hover:bg-white/5"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-que-teal"
                checked={selected.includes(option.id)}
                onChange={(event) => {
                  const next = event.target.checked
                    ? [...selected, option.id]
                    : selected.filter((item) => item !== option.id);
                  onChange(next);
                }}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
