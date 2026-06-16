# QUE+ Dashboard — Guía de trabajo para Claude Code

## Repositorio y deploy

| Recurso | URL |
|---|---|
| GitHub | https://github.com/Rolo0317/que_- |
| Vercel (producción) | https://que-frontend.vercel.app |
| Supabase | https://supabase.com/dashboard/project/iruhpncijutsypkftpfh |

## Estructura del monorepo

```
c:\que_+\
├── frontend/
│   ├── src/
│   │   ├── App.tsx                   ← Estado global, routing, sidebar, sync Supabase
│   │   ├── config/modules.ts         ← Registro de módulos: id, ruta, icono, abbr, descripción
│   │   ├── components/
│   │   │   ├── OperacionesView.tsx   ← SLA, ASA, Abandono, Llamadas
│   │   │   ├── WfmView.tsx           ← Ocupación, Utilización, Adherencia
│   │   │   ├── CalidadView.tsx       ← FCR, Transferencias, QA Score
│   │   │   ├── AgentView.tsx         ← Tabla por agente, búsqueda, exportación
│   │   │   ├── DataManager.tsx       ← Carga Excel, cards de datasets, zona drag-and-drop
│   │   │   ├── KpiCard.tsx           ← Tarjeta KPI con count-up animation y estado semafórico
│   │   │   ├── ToastContainer.tsx    ← Notificaciones glassmorphism con barra de progreso
│   │   │   ├── FileUploader.tsx      ← Botón con shimmer gradient para subir Excel
│   │   │   ├── WorldCupSplash.tsx    ← Splash FIFA 2026 con balón 3D animado (4 escenas)
│   │   │   ├── Charts.tsx            ← HourlyChart, TypeMixChart, AgentScoreChart…
│   │   │   ├── ReportBuilder.tsx     ← Constructor de informes con toggle de gráficas
│   │   │   ├── ThresholdConfig.tsx   ← Panel de umbrales COPC editables
│   │   │   ├── CompareView.tsx       ← Comparación entre dos datasets
│   │   │   ├── QuickGuide.tsx        ← Guía rápida (se muestra una sola vez)
│   │   │   ├── ExportButton.tsx      ← Exportación PDF/CSV
│   │   │   ├── PeriodPicker.tsx      ← Selector de día / mes / año
│   │   │   ├── BrandLogo.tsx         ← Logo SVG QUE+
│   │   │   ├── ThemeToggle.tsx       ← Botón claro/oscuro
│   │   │   ├── DashboardFooter.tsx   ← Pie de página con totales
│   │   │   └── ModuleErrorBoundary.tsx ← Error boundary por módulo
│   │   ├── lib/
│   │   │   ├── metrics.ts            ← Fórmulas COPC: SLA, ASA, AHT, Ocupación, FCR…
│   │   │   ├── excel.ts              ← Parser local de .xlsx (xlsx library)
│   │   │   ├── supabase.ts           ← Cliente Supabase + cleanEnv() anti-BOM
│   │   │   ├── cloudDatasets.ts      ← push / fetch / delete en Supabase REST
│   │   │   ├── constants.ts          ← BRAND colors, LS keys, SS keys
│   │   │   ├── useKpiAlerts.ts       ← Hook: detecta KPIs fuera de umbral
│   │   │   ├── useThresholds.ts      ← Hook: umbrales con localStorage
│   │   │   └── ToastContext.tsx      ← Context + hook useToast()
│   │   └── types/
│   │       ├── calls.ts              ← CallRecord
│   │       └── dataset.ts            ← Dataset
│   ├── tests/e2e/                    ← Playwright (26 tests)
│   ├── public/logo-que-plus.svg      ← Logo para sidebar y watermark
│   ├── Dockerfile                    ← Imagen Docker: node:22-alpine build + nginx:1.27-alpine serve
│   ├── nginx.conf                    ← nginx SPA config: gzip, cache 1y, security headers
│   ├── .dockerignore                 ← Excluye node_modules, dist, .env*
│   ├── .env.local                    ← credenciales locales (NO subir a git)
│   └── .vercel/project.json          ← apunta a proyecto "que-frontend" (prj_8aRFlinyZxaLrPya4vnXb69D3rqz)
├── backend/                          ← API Express — NO se usa en producción
│   ├── src/server.ts
│   ├── src/controllers/uploadController.ts
│   └── .env                          ← credenciales locales (NO subir a git)
├── CLAUDE.md                         ← este archivo
├── docker-compose.yml                ← Sólo frontend; args VITE_* baked en build time
├── .env.example                      ← Plantilla para docker-compose
├── vercel.json                       ← ignoreCommand → evita auto-deploy de GitHub
└── package.json                      ← scripts raíz
```

## Regla de deploy — SIEMPRE después de cada cambio

```bash
# Paso 1: commit y push
cd c:\que_+
git add -A
git commit -m "descripción"
git push origin main

# Paso 2: deploy a Vercel (DESDE LA RAIZ c:\que_+, NO desde frontend)
vercel --prod
```

> El proyecto Vercel tiene `rootDirectory=frontend`, por eso el CLI DEBE
> ejecutarse desde la raíz del monorepo. Si se ejecuta desde `frontend/`,
> Vercel concatena y busca `frontend/frontend` y falla.

## Proyecto Vercel correcto

- **Proyecto**: `que-frontend` (no usar el proyecto `frontend` que es un duplicado)
- **Linked en**: `frontend/.vercel/project.json` → `projectId: prj_8aRFlinyZxaLrPya4vnXb69D3rqz`
- **Env vars configuradas en Vercel**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_APP_NAME`
  - `VITE_API_URL` (vacío — frontend usa parser local)

## Variables de entorno (NO subir al repo)

### `frontend/.env.local`
```
VITE_SUPABASE_URL=https://iruhpncijutsypkftpfh.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_S5Va6s4sEAcLFvaJIyLhAg_NVVzQ218
VITE_API_URL=http://localhost:3000
```

### `backend/.env`
```
PORT=3000
CORS_ORIGIN=http://localhost:5173
SUPABASE_URL=https://iruhpncijutsypkftpfh.supabase.co
SUPABASE_ANON_KEY=sb_publishable_S5Va6s4sEAcLFvaJIyLhAg_NVVzQ218
DATABASE_URL=postgresql://postgres:...@db.iruhpncijutsypkftpfh.supabase.co:5432/postgres
```

## Stack técnico

| Capa | Tecnología |
|---|---|
| Frontend | React 19 + TypeScript 5.7 + Vite 7 |
| Estilos | Tailwind CSS 3.4 |
| Animaciones | Framer Motion 12 |
| Gráficas | Recharts 3 |
| Routing | React Router 7 |
| Cloud sync | Supabase (PostgreSQL JSONB) |
| Backend | Express 4 + TypeScript (no activo en prod) |
| Tests unitarios | Vitest (43 tests) |
| Tests E2E | Playwright (26 tests) |
| Contenedor | Docker multi-stage (node:22-alpine + nginx:1.27-alpine) |

## Módulos de la app

| Ruta | Componente | KPIs principales |
|---|---|---|
| `/operaciones` | OperacionesView | SLA, Abandono, ASA, Llamadas |
| `/wfm` | WfmView | Ocupación, Utilización, Adherencia |
| `/calidad` | CalidadView | FCR, Transferencias, Calificación |
| `/agentes` | AgentView | Tabla detallada por agente |
| `/archivos` | DataManager | Carga Excel, sync Supabase |

## Norma COPC CX — fórmulas implementadas

```
AHT        = (Talk + ACW) / llamadas_atendidas     (abandonadas excluidas)
Ocupación  = HandleTime / (HandleTime + Disponible)
Utilización = HandleTime / LoginTime
SLA        = llamadas_atendidas_en_20s / total_ofrecidas
ASA        = espera_promedio (meta: < 20 s)
Abandono   = abandonadas / total_ofrecidas
FCR        = resueltas_en_1er_contacto / atendidas
```

## Sincronización global (Supabase)

- **Tabla**: `public.datasets` (JSONB)
- **Flujo**: usuario carga Excel → parser local → push a Supabase → otros navegadores ven los datos al montar
- **RLS**: políticas públicas de SELECT / INSERT / DELETE
- **Sin credenciales**: la app funciona solo con localStorage (modo offline)
- **Anti-BOM**: `cleanEnv()` en `supabase.ts` elimina caracteres invisibles de env vars antes de usar en headers HTTP. Importante: un BOM (`U+FEFF`) en la Vercel UI causa `TypeError: String contains non ISO-8859-1 code point`.

## Patrones de UI establecidos

### KpiCard — count-up animation
- `parseAnimatable()` detecta si el valor tiene formato numérico (porcentaje, segundos, número)
- `useCountUp()` usa `requestAnimationFrame` con easing cúbico, 850ms de duración
- Cada tarjeta tiene delay escalonado para efecto en cascada
- Estado semafórico: `ok` (teal) / `warning` (amarillo) / `critical` (rojo) / `neutral` (gris)

### ToastContainer — glassmorphism
- `bg-white/95 backdrop-blur-xl shadow-2xl` para glassmorphism
- Barra de progreso `scaleX: 1 → 0` sincronizada con `duration` del toast
- Slide in: `x: 72 → 0` con spring `stiffness: 420, damping: 30`
- Usar `useToast()` para disparar: `toast.success()`, `toast.error()`, `toast.warning()`, `toast.info()`

### Sidebar — botones de navegación
- Tooltips CSS puro (`group-hover:opacity-100 group-hover:translate-x-0`) con nombre + descripción
- Indicador activo animado: `motion.span` con `layoutId="sidebar-indicator"` → barra izquierda que desliza entre ítems
- Badge de alerta KPI: círculo rojo con `ring-[1.5px] ring-ink` para visibilidad sobre fondo oscuro
- Deploy desde raíz: `vercel --prod` siempre desde `c:\que_+`, nunca desde `frontend/`

### WorldCupSplash — balón 3D
- 4 escenas aleatorias por mount: `roll`, `drop`, `curve`, `spin`
- Esfera CSS 3D: `perspective: 380px` en el padre + `rotateY: [0, 360]` continuo en Framer Motion
- El patrón SVG de pentágonos se aplana con la rotación, creando ilusión de esfera real
- Sparkles flotantes en colores Colombia (amarillo/azul/rojo) tras el aterrizaje
- Selección de escena: `useState(() => SCENES[Math.floor(Math.random() * SCENES.length)])`

### FileUploader — shimmer button
- Gradiente `from-que-teal to-teal-600` con span de shimmer que cruza en hover (`-translate-x-full → translate-x-full`)
- Área drag-and-drop con borde gradiente usando el truco de `padding: 1px` en wrapper con `bg-gradient-*`

### DataManager — zona drop animada
- Borde gradiente activo al arrastrar: wrapper div con `bg-gradient-to-br from-que-teal via-plus-orange to-violet p-px`
- `UploadCloud` animado con `scale: 1.15, rotate: -8` via Framer Motion cuando `isDragging`

## Docker

```bash
# Build con env vars (desde c:\que_+)
docker compose --env-file .env.example up --build

# Producción con env reales
VITE_SUPABASE_URL=xxx VITE_SUPABASE_ANON_KEY=yyy docker compose up --build
```

- Vite bake los env vars en build time via `ARG` → `ENV` en Dockerfile
- nginx sirve la SPA con: gzip nivel 6, `Cache-Control: immutable 1y` para assets hasheados, `no-cache` para index.html, headers de seguridad

## Comandos útiles

```bash
# Desarrollo local
cd frontend && npm run dev              # http://localhost:5173

# Tests
cd frontend && npx vitest run           # 43 tests unitarios
cd frontend && npx playwright test --project=chromium

# TypeScript check
cd frontend && npx tsc --noEmit

# Build de producción local
cd frontend && npm run build

# Vercel
vercel --prod                           # DESDE c:\que_+  (raíz del monorepo)
vercel env ls                           # ver env vars configuradas
vercel ls                               # ver deployments

# Docker
docker compose up --build               # desde c:\que_+
```

## Archivos que NUNCA se suben a git

```
frontend/.env.local
backend/.env
node_modules/
dist/
.vercel/
```

## Reglas de estilo del proyecto

- **Sin emojis** en código ni respuestas (regla del usuario)
- Errores de cloud sync: siempre silenciosos para el usuario (`console.error` solo)
- No usar el backend Express en producción — el frontend hace todo (parser local + Supabase directo)
- Commits siempre en español o inglés con mensaje descriptivo
