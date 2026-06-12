import type { ReportResponse } from '../types/calls';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface HealthResponse {
  status: 'ok' | string;
  service: string;
}

export async function fetchReport(type = 'Todos'): Promise<ReportResponse> {
  const query = new URLSearchParams();
  if (type && type !== 'Todos') query.set('type', type);

  const response = await fetch(`${API_URL}/data?${query.toString()}`);
  if (!response.ok) {
    throw new Error('No se pudo consultar la API.');
  }

  return response.json() as Promise<ReportResponse>;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch(`${API_URL}/health`);
  if (!response.ok) {
    throw new Error('No se pudo consultar el estado de la API.');
  }

  return response.json() as Promise<HealthResponse>;
}

export async function uploadReport(file: File, type = 'Todos'): Promise<ReportResponse> {
  const query = new URLSearchParams();
  if (type && type !== 'Todos') query.set('type', type);

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/upload?${query.toString()}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('No se pudo procesar el Excel en la API.');
  }

  return response.json() as Promise<ReportResponse>;
}
