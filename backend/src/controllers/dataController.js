import { sampleCalls } from '../data/sampleCalls.js';
import { buildReport } from '../services/metricsService.js';

export function getData(request, response) {
  const report = buildReport(sampleCalls, request.query.type);
  response.json(report);
}

export function postData(request, response) {
  const rows = Array.isArray(request.body?.data) ? request.body.data : [];
  const report = buildReport(rows, request.query.type);
  response.status(201).json(report);
}
