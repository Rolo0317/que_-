export interface CallRecord {
  id: string | number;
  date?: string;
  type: 'Inbound' | 'Outbound' | string;
  agent: string;
  queue: string;
  hour: string;
  durationSeconds: number;
  waitSeconds?: number;
  abandoned: boolean;
  answeredWithinSla?: boolean;
  resolvedFirstContact?: boolean;
  transferred?: boolean;
  score: number;
  qaScore?: number;
  scheduledSeconds?: number;
  loginSeconds?: number;
  productiveSeconds?: number;
  availableSeconds?: number;
  shrinkageSeconds?: number;
  adherenceSeconds?: number;
  scheduled?: boolean;
  staffed?: boolean;
  attendanceStatus?: 'Presente' | 'Ausente' | 'Tarde' | string;
}

export interface Metrics {
  total: number;
  inbound: number;
  outbound: number;
  abandonRate: number;
  avgDuration: number;
  avgScore: number;
  occupancy: number;
  utilization: number;
  shrinkage: number;
  adherence: number;
  attendance: number;
  serviceLevel: number;
  avgSpeedAnswer: number;
  firstContactResolution: number;
  transferRate: number;
  avgQaScore: number;
}

export interface HourlyBucket {
  hour: string;
  calls: number;
}

export interface TypeBucket {
  name: string;
  value: number;
}

export interface AgentScore {
  agent: string;
  score: number;
}

export interface SlaHourBucket {
  hour: string;
  sla: number;
}

export interface AbandonHourBucket {
  hour: string;
  abandonRate: number;
}

export interface QueueBucket {
  name: string;
  value: number;
}

export interface ReportResponse {
  data: CallRecord[];
  metrics: Metrics;
}
