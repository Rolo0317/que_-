export interface CallRecord {
  id: string | number;
  type: 'Inbound' | 'Outbound' | string;
  agent: string;
  queue: string;
  hour: string;
  durationSeconds: number;
  abandoned: boolean;
  score: number;
}

export interface Metrics {
  total: number;
  inbound: number;
  outbound: number;
  abandonRate: number;
  avgDuration: number;
  avgScore: number;
}

export interface ReportResponse {
  data: CallRecord[];
  metrics: Metrics;
}
