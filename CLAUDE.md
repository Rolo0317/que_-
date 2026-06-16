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
├── frontend/          ← SPA React — TODO el trabajo de UI va aquí
│   ├── src/
│   │   ├── App.tsx            ← Estado global, routing, sync Supabase
│   │   ├── components/        ← OperacionesView, WfmView, CalidadView, AgentView, DataManager…
│   │   ├── lib/               ← metrics.ts, excel.ts, supabase.ts, cloudDatasets.ts
│   │   └── types/             ← calls.ts, dataset.ts
│   ├── tests/e2e/             ← Playwright (26 tests)
│   ├── .env.local             ← credenciales locales (NO subir a git)
│   └── .vercel/project.json   ← apunta a proyecto "que-frontend" en Vercel
├── backend/           ← API Express opcional (parser Excel + proxy)
│   ├── src/
│   │   ├── server.ts
│   │   ├── controllers/uploadController.ts   ← push a Supabase al subir
│   │   └── lib/supabase.ts
│   └── .env                   ← credenciales locales (NO subir a git)
├── CLAUDE.md          ← este archivo
├── vercel.json        ← ignora auto-deploy de GitHub (solo deploy manual)
└── package.json       ← scripts raíz
```

## Regla de deploy — SIEMPRE después de cada cambio

```bash
# Desde c:\que_+
git add -A
git commit -m "descripción"
git push origin main

# Desde c:\que_+\frontend
vercel --prod
```

## Proyecto Vercel correcto

- **Proyecto**: `que-frontend` (no usar el proyecto `frontend` que es un duplicado)
- **Linked en**: `frontend/.vercel/project.json` → `projectId: prj_8aRFlinyZxaLrPya4vnXb69D3rqz`
- **Env vars configuradas en Vercel**:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_API_URL` (vacío → el frontend usa parser local directo)
  - `VITE_APP_NAME`

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
| Backend | Express 4 + TypeScript |
| Tests unitarios | Vitest (43 tests) |
| Tests E2E | Playwright (26 tests) |

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

## Comandos útiles

```bash
# Desarrollo local
cd frontend && npm run dev        # http://localhost:5173
cd backend && npm run dev         # http://localhost:3000

# Tests
cd frontend && npx vitest run     # 43 tests unitarios
cd frontend && npx playwright test --project=chromium

# Verificar env vars en Vercel
cd frontend && vercel env ls

# Ver deployments
cd frontend && vercel ls
```

## Archivos que NUNCA se suben a git

```
frontend/.env.local
backend/.env
node_modules/
dist/
.vercel/
```
