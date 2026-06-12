# Planificacion del proyecto que_-

## Fase 1: Preparacion del entorno y repositorio ✅

- Crear monorepo con `frontend/` y `backend/`.
- Configurar npm workspaces, Prettier, Git y README inicial.
- Documentar estructura, scripts y convenciones.

## Fase 2: Configuracion del frontend ✅

- Crear aplicacion React con Vite.
- Configurar Tailwind CSS con paleta de colores QUE+ (#11AEB3 Turquesa, #FF9700 Naranja).
- Implementar carga de Excel con SheetJS.
- Crear componentes iniciales para KPI, graficos y seleccion de informe.
- **MEJORAS V2:**
  - ✅ Agregar tema oscuro/claro con persistencia en localStorage
  - ✅ Mejorar componentes KPI con animaciones Framer Motion
  - ✅ ThemeToggle mejorado con gradientes y transiciones suaves
  - ✅ DashboardFooter llamativo con estadísticas dinámicas
  - ✅ Logo con fondo transparente integrado en diseño
  - ✅ Animaciones staggered en KPI cards

## Fase 3: Configuracion del backend ✅

- Crear API Express.
- Implementar endpoint de salud y endpoints para procesar datos.
- Separar rutas, controladores, servicios y utilidades.
- Cargar variables de entorno con `dotenv`.

## Fase 4: Contenedorizacion con Docker ✅

- Agregar Dockerfile multi-stage para frontend.
- Agregar Dockerfile para backend.
- Crear `docker-compose.yml`.
- Documentar ejecucion local con contenedores.

## Fase 5: Funcionalidades clave ✅

- Dashboard principal con tarjetas de indicadores.
- Graficos dinamicos.
- Filtro Inbound/Outbound.
- Modulo "Arma tu informe" con visualizaciones seleccionables.
- **Indicadores WFM implementados:**
  - ✅ Ocupación (Occupancy %): % de tiempo productivo
  - ✅ Utilización (Utilization %): % tiempo en llamadas vs disponible
  - ✅ Shrinkage %: % tiempo no productivo (breaks, training)
  - ✅ Adherencia (Adherence %): % cumplimiento del horario
  - ✅ Asistencia (Attendance %): % agentes presentes
  - ✅ AHT (Average Handle Time)
  - ✅ ASA (Average Speed to Answer)
  - ✅ Tasa de abandono
  - ✅ SLA (Service Level Agreement)
  - ✅ FCR (First Contact Resolution)
  - ✅ Transfer Rate
  - ✅ QA Score (Calidad)

## Fase 6: Pruebas y documentacion

- **Pruebas unitarias Vitest:**
  - ✅ Tests para cálculo de métricas WFM
  - ✅ Tests para filtrado de llamadas
  - ✅ Tests para distribuciones horarias
  - ✅ Tests para indicadores de desempeño
  - ✅ Validación de ocupación, utilización, shrinkage, adherencia
  - ✅ Manejo de arrays vacíos

- **Pruebas E2E Playwright:**
  - ✅ Tests de navegación y carga
  - ✅ Tests de filtrado (Inbound/Outbound)
  - ✅ Tests de tema claro/oscuro
  - ✅ Tests de carga de archivos Excel
  - ✅ Tests de visualización de indicadores WFM
  - ✅ Tests de animaciones
  - ✅ Tests de responsividad
  - ✅ Tests de despliegue en Vercel

- README final con instalacion, ejecucion, Docker y despliegue.

## Fase 7: Optimización y despliegue (NUEVA)

- **Despliegue en Vercel:**
  - ✅ Configuración de variables de entorno (.env.example)
  - ✅ Setup de build y deploy
  - ✅ Documentación de CI/CD

- **Mejoras de rendimiento:**
  - ✅ Lazy loading de componentes gráficos
  - ✅ Memoización de cálculos
  - ✅ Animaciones optimizadas con Framer Motion

- **Datos de prueba:**
  - ✅ Excel generado con 4950 registros de WFM
  - ✅ 15 agentes, 5 colas, 30 días de datos
  - ✅ Indicadores realistas

## Entregables por fase

1. Fase 1: estructura, linters, README y `planning.md`. ✅
2. Fase 2: frontend Vite/React/Tailwind con carga de Excel + Tema oscuro + Animaciones. ✅
3. Fase 3: backend Express con API de datos. ✅
4. Fase 4: Dockerfiles y Compose. ✅
5. Fase 5: dashboard funcional con 12+ indicadores WFM, filtros, gráficos y animaciones. ✅
6. Fase 6: pruebas unitarias (Vitest) + E2E (Playwright) + documentación completa. ✅
7. Fase 7: despliegue en Vercel, datos de prueba Excel, optimizaciones. ✅

## Stack Tecnológico

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS + Framer Motion + Recharts
- **Backend:** Node.js + Express + TypeScript
- **Pruebas:** Vitest (unitarias) + Playwright (E2E)
- **Infraestructura:** Docker + Docker Compose + Vercel
- **Datos:** Excel (.xlsx) con SheetJS
- **Herramientas:** ESLint + Prettier + npm workspaces

## Características principales

### Dashboard
- 12+ indicadores operativos y de WFM
- Tema claro/oscuro con persistencia
- Animaciones suaves con Framer Motion
- Responsive design (mobile, tablet, desktop)
- Filtrado por Inbound/Outbound
- Carga de datos Excel

### Indicadores
- Métricas de operación: llamadas, abandonos, SLA
- Métricas de WFM: ocupación, utilización, shrinkage, adherencia, asistencia
- Métricas de calidad: AHT, ASA, FCR, Transfer Rate, QA Score

### Experiencia
- Footer llamativo con estadísticas dinámicas
- Logo con fondo transparente
- Interfaz intuitiva y atractiva
- Animaciones performantes
- Accesibilidad (ARIA labels)

## Scripts disponibles

```bash
npm run dev              # Desarrollo local frontend + backend
npm run dev:frontend    # Solo frontend
npm run dev:backend     # Solo backend
npm run build           # Build de producción
npm run test            # Vitest
npm run test:e2e        # Playwright
npm run lint            # ESLint
npm run docker:up       # Docker Compose up
npm run docker:build    # Docker build
```

## Próximos pasos (roadmap)

- [ ] Integración con base de datos (PostgreSQL)
- [ ] Autenticación y autorización
- [ ] Exportación de reportes (PDF)
- [ ] Alertas y notificaciones
- [ ] Dashboard personalizable por usuario
- [ ] Análisis histórico y tendencias
- [ ] API GraphQL
- [ ] Mobile app

