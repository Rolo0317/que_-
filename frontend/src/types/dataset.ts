import type { CallRecord } from './calls';

export type DataSource = 'demo' | 'excel' | 'api';

export interface Dataset {
  id: string;
  name: string;
  calls: CallRecord[];
  loadedAt: Date;
  source: DataSource;
}
