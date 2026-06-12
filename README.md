# Que Call Center Dashboard

Dashboard analitico para operaciones de call center BPO. El proyecto permite cargar datos de Excel, calcular indicadores operativos y construir informes visuales con filtros Inbound/Outbound.

## Estructura

- `frontend/`: aplicacion React + TypeScript con Vite, Tailwind CSS, Recharts y lector de Excel.
- `backend/`: API Node.js/Express + TypeScript para recibir, procesar y exponer datos.
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

Copia las variables de entorno cuando necesites correr el backend con valores locales:

```bash
copy backend\.env.example backend\.env
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

## Datos esperados

El Excel debe ser `.xlsx` y puede incluir columnas en espanol o ingles:

- `tipo` o `type`: `Inbound` / `Outbound`.
- `agente` o `agent`.
- `cola` o `queue`.
- `hora` o `hour`.
- `duracion` o `durationSeconds`.
- `abandonada` o `abandoned`.
- `calificacion` o `score`.

Si no cargas archivo, el dashboard usa datos demo. El boton `API` consulta `GET /api/data` y el cargador de Excel procesa el archivo en el navegador.

## API

- `GET /api/health`: estado del servicio.
- `GET /api/data?type=Inbound`: datos demo con metricas calculadas.
- `POST /api/data`: recibe `{ "data": [...] }` y devuelve reporte.
- `POST /api/upload`: recibe un formulario multipart con campo `file`.

## Buenas practicas

El proyecto usa modulos pequenos, responsabilidades claras, validaciones centralizadas y scripts comunes en el monorepo. La logica de metricas vive separada de la interfaz para facilitar pruebas y evitar duplicacion.
