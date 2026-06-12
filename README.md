# Que Call Center Dashboard

Dashboard analitico para operaciones de call center BPO. El proyecto permite cargar datos de Excel, calcular indicadores operativos y construir informes visuales con filtros Inbound/Outbound.

## Estructura

- `frontend/`: aplicacion React con Vite, Tailwind CSS, Recharts y SheetJS.
- `backend/`: API Node.js/Express para recibir, procesar y exponer datos.
- `planning.md`: fases del proyecto y entregables.
- `docker-compose.yml`: orquestacion local del frontend y backend.

## Requisitos

- Node.js 20 o superior.
- npm 10 o superior.
- Docker Desktop para ejecutar contenedores localmente.

## Instalacion

```bash
npm install
```

## Desarrollo

```bash
npm run dev:backend
npm run dev:frontend
```

Por defecto:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

## Scripts

```bash
npm run lint
npm run test
npm run build
```

## Docker

```bash
docker compose up --build
```

El frontend se sirve en `http://localhost:8080` y el backend en `http://localhost:3000`.

## Despliegue

Para Vercel, configura el proyecto apuntando a `frontend/`, usa `npm run build` como build command y `dist` como output directory. Define `VITE_API_URL` con la URL publica del backend.

El backend puede desplegarse como contenedor usando `backend/Dockerfile`; define `PORT` y `CORS_ORIGIN` segun el entorno.

## Buenas practicas

El proyecto usa modulos pequenos, responsabilidades claras, validaciones centralizadas y scripts comunes en el monorepo. La logica de metricas vive separada de la interfaz para facilitar pruebas y evitar duplicacion.
