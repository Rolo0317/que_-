import React from 'react';
import type { ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  moduleName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ModuleErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-rose-200 bg-rose-50 py-16 text-center dark:border-rose-800/50 dark:bg-rose-950/20">
        <AlertTriangle size={36} className="mb-3 text-rose-400" aria-hidden="true" />
        <p className="text-sm font-bold text-rose-700 dark:text-rose-400">
          Error en {this.props.moduleName ?? 'este módulo'}
        </p>
        <p className="mt-1 max-w-xs text-xs text-rose-500 dark:text-rose-500/80">
          {this.state.error?.message ?? 'Ocurrió un error inesperado.'}
        </p>
        <button
          type="button"
          onClick={() => this.setState({ hasError: false, error: undefined })}
          className="mt-5 flex items-center gap-2 rounded-lg border border-rose-300 bg-white px-4 py-2 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 dark:border-rose-700 dark:bg-rose-950/50 dark:text-rose-300"
        >
          <RefreshCw size={13} />
          Reintentar
        </button>
      </div>
    );
  }
}
