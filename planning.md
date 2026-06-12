# Planificacion del proyecto que_-

## Fase 1: Preparacion del entorno y repositorio

- Crear monorepo con `frontend/` y `backend/`.
- Configurar npm workspaces, Prettier, Git y README inicial.
- Documentar estructura, scripts y convenciones.

## Fase 2: Configuracion del frontend

- Crear aplicacion React con Vite.
- Configurar Tailwind CSS.
- Implementar carga de Excel con SheetJS.
- Crear componentes iniciales para KPI, graficos y seleccion de informe.

## Fase 3: Configuracion del backend

- Crear API Express.
- Implementar endpoint de salud y endpoints para procesar datos.
- Separar rutas, controladores, servicios y utilidades.
- Cargar variables de entorno con `dotenv`.

## Fase 4: Contenedorizacion con Docker

- Agregar Dockerfile multi-stage para frontend.
- Agregar Dockerfile para backend.
- Crear `docker-compose.yml`.
- Documentar ejecucion local con contenedores.

## Fase 5: Funcionalidades clave

- Dashboard principal con tarjetas de indicadores.
- Graficos dinamicos.
- Filtro Inbound/Outbound.
- Modulo "Arma tu informe" con visualizaciones seleccionables.

## Fase 6: Pruebas y documentacion

- Pruebas unitarias para procesamiento de datos.
- Pruebas basicas de API.
- README final con instalacion, ejecucion, Docker y despliegue.

## Entregables por fase

1. Fase 1: estructura, linters, README y `planning.md`.
2. Fase 2: frontend Vite/React/Tailwind con carga de Excel.
3. Fase 3: backend Express con API de datos.
4. Fase 4: Dockerfiles y Compose.
5. Fase 5: dashboard funcional con indicadores, graficos y filtros.
6. Fase 6: pruebas, documentacion y validacion final.
