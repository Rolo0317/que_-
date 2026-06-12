const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export async function fetchReport(type = 'Todos') {
  const query = new URLSearchParams();
  if (type && type !== 'Todos') query.set('type', type);

  const response = await fetch(`${API_URL}/data?${query.toString()}`);
  if (!response.ok) {
    throw new Error('No se pudo consultar la API.');
  }

  return response.json();
}
