import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number;
}

interface ToastCtx {
  toasts: Toast[];
  add: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
}

export const ToastContext = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((p) => p.filter((t) => t.id !== id));
  }, []);

  const add = useCallback(
    (t: Omit<Toast, 'id'>) => {
      const id = `t${++counter.current}`;
      setToasts((p) => [...p.slice(-4), { ...t, id }]);
      setTimeout(() => dismiss(id), t.duration);
    },
    [dismiss],
  );

  return <ToastContext.Provider value={{ toasts, add, dismiss }}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast requires ToastProvider');
  const { add } = ctx;
  return {
    success: (msg: string, d = 4000) => add({ type: 'success', message: msg, duration: d }),
    error:   (msg: string, d = 5000) => add({ type: 'error',   message: msg, duration: d }),
    warning: (msg: string, d = 4000) => add({ type: 'warning', message: msg, duration: d }),
    info:    (msg: string, d = 3000) => add({ type: 'info',    message: msg, duration: d }),
  };
}
