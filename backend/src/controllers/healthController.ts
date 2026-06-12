import type { Request, Response } from 'express';

export function healthCheck(_request: Request, response: Response) {
  response.json({ status: 'ok', service: 'que-dashboard-api' });
}
