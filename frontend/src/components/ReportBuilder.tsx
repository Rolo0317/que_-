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
    <fieldset className="rounded-md border border-slate-200 bg-white p-4 shadow-panel">
      <legend className="px-1 text-sm font-semibold text-ink">Arma tu informe</legend>
      <div className="mt-3 grid gap-2">
        {options.map((option) => (
          <label key={option.id} className="flex items-center gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              className="h-4 w-4 accent-teal"
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
  );
}
