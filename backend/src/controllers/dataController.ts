import { sampleCalls } from '../data/sampleCalls.js';
import { buildReport } from '../services/metricsService.js';
import type { Request, Response } from 'express';
import type { CallRecord } from '../types/calls.js';

function getTypeQuery(request: Request): string {
  return typeof request.query.type === 'string' ? request.query.type : 'Todos';
}

export function getData(request: Request, response: Response) {
  const report = buildReport(sampleCalls, getTypeQuery(request));
  response.json(report);
}

export function postData(request: Request, response: Response) {
  const rows = Array.isArray(request.body?.data) ? (request.body.data as CallRecord[]) : [];
  const report = buildReport(rows, getTypeQuery(request));
  response.status(201).json(report);
}
