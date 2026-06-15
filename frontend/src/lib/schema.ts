import { z } from 'zod';

export const CallRecordSchema = z.object({
  id: z.union([z.string(), z.number()]),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  type: z.string().default('Inbound'),
  agent: z.string().min(1).default('Sin agente'),
  documento: z.string().optional(),
  queue: z.string().default('General'),
  hour: z.string().default('00:00'),
  durationSeconds: z.number().min(0).default(0),
  waitSeconds: z.number().min(0).optional(),
  abandoned: z.boolean().default(false),
  answeredWithinSla: z.boolean().optional(),
  resolvedFirstContact: z.boolean().optional(),
  transferred: z.boolean().optional(),
  score: z.number().min(0).max(5).default(0),
  qaScore: z.number().min(0).max(100).optional(),
  scheduledSeconds: z.number().min(0).optional(),
  loginSeconds: z.number().min(0).optional(),
  productiveSeconds: z.number().min(0).optional(),
  availableSeconds: z.number().min(0).optional(),
  shrinkageSeconds: z.number().min(0).optional(),
  adherenceSeconds: z.number().min(0).optional(),
  scheduled: z.boolean().optional(),
  staffed: z.boolean().optional(),
  attendanceStatus: z.string().optional(),
});
