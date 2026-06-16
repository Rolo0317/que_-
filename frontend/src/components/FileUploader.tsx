import { Upload } from 'lucide-react';

interface FileUploaderProps {
  onFile: (file: File) => void;
}

export function FileUploader({ onFile }: FileUploaderProps) {
  return (
    <label
      className="group relative flex cursor-pointer items-center gap-2.5 overflow-hidden rounded-xl
                 bg-gradient-to-r from-que-teal to-teal-600 px-5 py-2.5
                 text-sm font-semibold text-white
                 shadow-lg shadow-que-teal/30 transition-all duration-300
                 hover:shadow-xl hover:shadow-que-teal/40 hover:brightness-110
                 active:scale-[0.96] active:shadow-md"
    >
      {/* Shimmer sweep on hover */}
      <span
        aria-hidden="true"
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent
                   transition-transform duration-700 ease-out group-hover:translate-x-full"
      />
      <Upload
        size={15}
        aria-hidden="true"
        className="relative z-10 transition-transform duration-200 group-hover:-translate-y-px"
      />
      <span className="relative z-10">Cargar Excel</span>
      <input
        className="sr-only"
        type="file"
        accept=".xlsx"
        onChange={(e) => {
          const [file] = e.target.files ?? [];
          if (file) {
            onFile(file);
            e.target.value = '';
          }
        }}
      />
    </label>
  );
}
