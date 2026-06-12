import { Upload } from 'lucide-react';

export function FileUploader({ onFile }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-md border border-dashed border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-panel transition hover:border-teal">
      <Upload size={18} aria-hidden="true" />
      <span>Cargar Excel</span>
      <input
        className="sr-only"
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(event) => {
          const [file] = event.target.files || [];
          if (file) onFile(file);
        }}
      />
    </label>
  );
}
