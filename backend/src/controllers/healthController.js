export function healthCheck(_request, response) {
  response.json({ status: 'ok', service: 'que-dashboard-api' });
}
