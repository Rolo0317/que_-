import { Database, Headphones, ShieldCheck, TrendingUp, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { KpiAlerts } from '../lib/useKpiAlerts';

export type ModuleId = 'wfm' | 'operaciones' | 'calidad' | 'agentes' | 'archivos';

export interface ModuleConfig {
  id: ModuleId;
  label: string;
  icon: LucideIcon;
  path: string;
  abbr: string;
  kpiAlertKey?: keyof KpiAlerts;
  description: string;
}

export const MODULES: ModuleConfig[] = [
  {
    id: 'wfm',
    label: 'WFM',
    icon: Users,
    path: '/wfm',
    abbr: 'WFM',
    kpiAlertKey: 'wfm',
    description: 'Fuerza laboral — ocupacion, utilizacion, shrinkage, adherencia y asistencia.',
  },
  {
    id: 'operaciones',
    label: 'Operaciones',
    icon: TrendingUp,
    path: '/operaciones',
    abbr: 'OPS',
    kpiAlertKey: 'operaciones',
    description: 'Volumen y servicio — llamadas, SLA, abandono, velocidad de respuesta y duracion.',
  },
  {
    id: 'calidad',
    label: 'Calidad',
    icon: ShieldCheck,
    path: '/calidad',
    abbr: 'QA',
    kpiAlertKey: 'calidad',
    description: 'Calidad — FCR, transferencias, QA score y satisfaccion del cliente.',
  },
  {
    id: 'agentes',
    label: 'Agentes',
    icon: Headphones,
    path: '/agentes',
    abbr: 'AGT',
    description: 'Vista por agente con metricas individuales, busqueda y exportacion.',
  },
  {
    id: 'archivos',
    label: 'Archivos',
    icon: Database,
    path: '/archivos',
    abbr: 'DAT',
    description: 'Gestion de datasets: cargar, comparar y eliminar fuentes de datos.',
  },
];
