# Arquitectura del Frontend — QUE+ Dashboard

## Stack tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework UI | React | 19 |
| Lenguaje | TypeScript | 5.7 |
| Build tool | Vite | 7 |
| Estilos | Tailwind CSS | 3.4 |
| Animaciones | Framer Motion | 12 |
| Gráficas | Recharts | 3 |
| Íconos | Lucide React | 0.468 |
| Parser Excel | read-excel-file | 9.2 |
| Testing | Vitest + Playwright | — |
| Deploy | Vercel (manual `vercel --prod`) | — |

---

## Estructura de carpetas

```
frontend/
├── public/
│   ├── logo-que-plus.svg          # Watermark y sidebar
│   └── plantilla-queplus.xlsx     # Template descargable (generado por generate-sample-data.js)
│
└── src/
    ├── App.tsx                    # Raíz: estado global, routing de módulos, KPIs
    ├── main.tsx                   # Entry point React
    ├── styles.css                 # Tailwind base + @media print
    │
    ├── types/
    │   ├── calls.ts               # CallRecord, Metrics, AgentStats, buckets de gráficas
    │   └── dataset.ts             # Dataset, DataSource ('demo'|'excel'|'api')
    │
    ├── data/
    │   └── sampleCalls.ts         # 48 registros demo (6 agentes · 3 meses)
    │
    ├── lib/
    │   ├── metrics.ts             # Cálculos: calculateMetrics, agentDetailStats, slaByHour...
    │   ├── excel.ts               # parseExcelFile: lee .xlsx → CallRecord[]
    │   ├── api.ts                 # fetchReport, uploadReport, fetchHealth
    │   ├── exportCsv.ts           # exportAgentsToCsv: descarga CSV con métricas
    │   └── useKpiAlerts.ts        # Hook: detecta KPIs en rojo por módulo
    │
    └── components/
        ├── AgentView.tsx          # Módulo Agentes: cards, tier, búsqueda, detalle, export CSV
        ├── BrandLogo.tsx          # Logo SVG como componente
        ├── Charts.tsx             # 6 gráficas Recharts (lazy-loaded) + EmptyChart
        ├── CompareView.tsx        # Modo comparación lado a lado de dos datasets
        ├── DashboardFooter.tsx    # Footer con estadísticas en vivo
        ├── DataManager.tsx        # Módulo Archivos: CRUD datasets, drag & drop, plantilla
        ├── FileUploader.tsx       # Botón "Cargar Excel" del header
        ├── KpiCard.tsx            # Tarjeta KPI con semáforo (good/warning/bad/neutral)
        ├── PeriodPicker.tsx       # Select de día/mes/año derivado de los datos
        ├── ReportBuilder.tsx      # Selector de gráficas + layout + exportar PDF
        └── ThemeToggle.tsx        # Botón dark/light mode
```

---

## Flujo de datos

```
Excel / API / Demo
        │
        ▼
 parseExcelFile()          uploadReport()        sampleCalls[]
 (read-excel-file)         (backend Express)     (datos demo)
        │                        │                    │
        └──────────────────── Dataset ────────────────┘
                                 │
                          datasets[] state
                          activeDatasetId
                                 │
                          activeCalls (useMemo)
                                 │
                      filterByPeriod(period, value)
                                 │
                      filterCalls(typeFilter)
                                 │
                          visibleCalls
                         /     |      \
              calculateMetrics  agentDetailStats  callsByHour...
                    │                │                 │
                 KPI cards      AgentView          Recharts
```

---

## Estado global (`App.tsx`)

Todo el estado vive en `App.tsx` con `useState` y `useMemo`. No hay Context ni Redux.

### Estado principal

```ts
// Datasets cargados
datasets: Dataset[]          // pool de datasets
activeDatasetId: string      // id del dataset activo

// Filtros
typeFilter: 'Todos' | 'Inbound' | 'Outbound'
period: 'todos' | 'dia' | 'mes' | 'año'
periodValue: string          // valor seleccionado del PeriodPicker

// UI
activeModule: 'wfm' | 'operaciones' | 'calidad' | 'agentes' | 'archivos'
selectedCharts: ChartId[]    // gráficas activas en ReportBuilder
layout: '2' | '3'            // columnas del grid de gráficas
compareId: string | null     // segundo dataset para comparación
theme: 'light' | 'dark'
apiStatus: 'checking' | 'online' | 'offline'
```

### Derivados (useMemo)

```ts
activeCalls      = activeDataset.calls
availableDays    = fechas únicas del dataset → PeriodPicker
availableMonths  = meses únicos
availableYears   = años únicos
periodCalls      = filterByPeriod(activeCalls, period, periodValue)
visibleCalls     = filterCalls(periodCalls, typeFilter)
metrics          = calculateMetrics(visibleCalls)
hourlyData       = callsByHour(visibleCalls)
typeData         = callsByType(visibleCalls)
scoreData        = agentScores(visibleCalls)
slaData          = slaByHour(visibleCalls)
abandonData      = abandonByHour(visibleCalls)
queueData        = callsByQueue(visibleCalls)
agentStats       = agentDetailStats(visibleCalls)
kpiAlerts        = useKpiAlerts(visibleCalls)  // badges rojos en tabs
```

---

## Tipos principales

### `types/calls.ts`

```ts
interface CallRecord {
  id: string | number
  date?: string              // 'YYYY-MM-DD'
  type: string               // 'Inbound' | 'Outbound'
  agent: string
  documento?: string         // cédula / NIT del agente
  queue: string
  hour: string               // 'HH:MM'
  durationSeconds: number
  waitSeconds?: number
  abandoned: boolean
  answeredWithinSla?: boolean
  resolvedFirstContact?: boolean
  transferred?: boolean
  score: number              // 1–5
  qaScore?: number           // 0–100
  // WFM (en segundos, no en porcentaje)
  scheduledSeconds?: number  // turno programado (ej. 8 h = 28800)
  loginSeconds?: number      // tiempo efectivo conectado
  productiveSeconds?: number // tiempo en llamada
  availableSeconds?: number  // tiempo disponible (loginSeconds - productiveSeconds)
  shrinkageSeconds?: number  // tiempo no productivo (capacitación, baños, etc.)
  adherenceSeconds?: number  // tiempo cumpliendo el horario programado
  scheduled?: boolean
  staffed?: boolean
  attendanceStatus?: string  // 'Presente' | 'Ausente' | 'Tarde'
}

interface AgentStats {
  agent: string
  documento?: string
  totalCalls: number
  avgScore: number
  avgQaScore: number
  slaRate: number
  fcrRate: number
  transferRate: number
  abandonRate: number
  avgDuration: number
  avgWait: number
}

interface Dataset {
  id: string
  name: string
  calls: CallRecord[]
  loadedAt: Date
  source: 'demo' | 'excel' | 'api'
}
```

---

## Cálculo de métricas (`lib/metrics.ts`)

| KPI | Fórmula |
|-----|---------|
| Ocupación | `sum(durationSeconds) / (sum(durationSeconds) + sum(availableSeconds))` |
| Utilización | `sum(productiveSeconds) / sum(loginSeconds)` |
| Shrinkage | `sum(shrinkageSeconds) / sum(scheduledSeconds)` |
| Adherencia | `sum(adherenceSeconds) / sum(scheduledSeconds)` |
| Asistencia | `count(staffed) / count(scheduled)` |
| SLA | `count(answeredWithinSla=true) / total` |
| Abandono | `count(abandoned=true) / total` |
| ASA | `sum(waitSeconds) / total` |
| AHT | `sum(durationSeconds) / total` |
| FCR | `count(resolvedFirstContact=true) / total` |
| Transferencias | `count(transferred=true) / total` |

Todas las métricas WFM se calculan en **segundos** en los registros fuente. Los porcentajes se generan al momento de formatear (`(v * 100).toFixed(2) + '%'`).

---

## Sistema de semáforos (`KpiCard`)

```ts
type KpiStatus = 'good' | 'warning' | 'bad' | 'neutral'
```

| Estado | Color | Barra lateral | Significado |
|--------|-------|--------------|-------------|
| `good` | Verde esmeralda | `bg-emerald-500` | Cumple la meta |
| `warning` | Ámbar | `bg-amber-400` | En zona de riesgo |
| `bad` | Rosa/rojo | `bg-rose-500` | Fuera de meta |
| `neutral` | Teal | `bg-que-teal` | Referencial (sin meta) |

**Helpers en App.tsx:**

```ts
pct(v, g, w)     // v >= g → good, v >= w → warning, else bad  (mayor es mejor)
pctInv(v, g, w)  // v <= g → good, v <= w → warning, else bad  (menor es mejor)
secInv(v, g, w)  // igual que pctInv pero para segundos
occupancy(v)     // 0.75–0.90 → good · >0.60 → warning · else bad
```

**Formateador estándar de porcentajes:**

```ts
const fmt  = (v: number) => `${(v * 100).toFixed(2)}%`  // 2 decimales siempre
const fmtS = (s: number) => `${Math.round(s)} s`
```

---

## Tokens de diseño (Tailwind)

```js
// tailwind.config.js
colors: {
  ink:              '#102027',  // fondo sidebar, texto principal dark
  mist:             '#f5f7f8',  // fondo claro de la app
  'que-teal':       '#11AEB3',  // acento primario (botones, activo, dataset A)
  'que-teal-dark':  '#08777d',  // hover del teal
  'plus-orange':    '#FF9700',  // acento secundario, dataset B en comparación
  coral:            '#ff6f4f',  // errores, abandono
  violet:           '#6f5dd5',  // badge fuente demo
}

boxShadow: {
  panel: '0 16px 36px rgba(16, 32, 39, 0.1)'  // sombra de tarjetas
}
```

Dark mode: `darkMode: 'class'` → `document.documentElement.classList.toggle('dark', ...)`.
Preferencia guardada en `localStorage('theme-preference')`.

---

## Carga de Excel (`lib/excel.ts`)

Usa `read-excel-file/browser` para parsear el archivo en el navegador (sin servidor).

**Pipeline de normalización:**
1. Lee la hoja → array de filas `[header[], ...data[]]`
2. `normalizeKey(key)` → quita espacios, guiones bajos y busca en `columnMap`
3. Mapeo bilingüe: acepta columnas en español (`agente`, `duracion`, `abandonada`, `documento`...) e inglés (`agent`, `durationSeconds`, `abandoned`...)
4. Booleans: acepta `true` nativo, `'true'`, `'si'`, `'yes'`, `'1'`
5. Devuelve `CallRecord[]`

**Columnas reconocidas (selección):**

| Excel (ES / EN) | Campo en CallRecord |
|-----------------|---------------------|
| `tipo` / `type` | `type` |
| `agente` / `agent` | `agent` |
| `documento` / `cedula` / `nit` | `documento` |
| `cola` / `queue` | `queue` |
| `hora` / `hour` | `hour` |
| `duracion` / `durationSeconds` | `durationSeconds` |
| `espera` / `waitSeconds` | `waitSeconds` |
| `abandonada` / `abandoned` | `abandoned` |
| `sla` / `answeredWithinSla` | `answeredWithinSla` |
| `fcr` / `resolvedFirstContact` | `resolvedFirstContact` |
| `calificacion` / `score` | `score` |
| `calidad` / `qaScore` | `qaScore` |

**Flujo de carga con `handleFile` en App.tsx:**

```
1. ¿apiStatus !== 'offline' && navigator.onLine?
   └─ SÍ → health-check al backend (timeout 1.5 s)
       ├─ OK  → uploadReport() → fuente 'api'
       └─ FAIL → setApiStatus('offline') → paso 2
2. parseExcelFile(file) → fuente 'excel'
3. Validación: filas > 0 && no todos 'Sin agente'
4. addDataset() → activa el nuevo dataset
```

---

## Módulos de la aplicación

| Módulo | `activeModule` | Componente principal | KPIs |
|--------|---------------|---------------------|------|
| WFM | `'wfm'` | KpiCard × 5 + Charts | Ocupación, Utilización, Shrinkage, Adherencia, Asistencia |
| Operaciones | `'operaciones'` | KpiCard × 7 + Charts | SLA, Abandono, ASA, AHT, Inbound, Outbound, Total |
| Calidad | `'calidad'` | KpiCard × 4 + Charts | FCR, Transferencias, QA Score, Satisfacción |
| Agentes | `'agentes'` | AgentView | Cards por agente, tier, búsqueda nombre/documento, export CSV |
| Archivos | `'archivos'` | DataManager + CompareView | CRUD datasets, plantilla, comparación lado a lado |

---

## Módulo Agentes (`AgentView`)

Características principales:

- **Tier automático** por agente: `destacado | bueno | regular | riesgo`
  ```ts
  if (score >= 4.5 && sla >= 0.85 && fcr >= 0.8)  → 'destacado'
  if (score >= 4.0 && sla >= 0.75 && fcr >= 0.7)   → 'bueno'
  if (score >= 3.5 && sla >= 0.6)                   → 'regular'
  else                                               → 'riesgo'
  ```
- **Avatar** con iniciales y color derivado del nombre (hash determinista)
- **Búsqueda** por nombre o número de documento (`documento`)
- **Ordenamiento** por: Llamadas, Score, SLA, FCR, AHT (asc/desc toggle)
- **Panel de detalle** desplegable: 8 métricas con semáforo individual
- **Exportar CSV**: descarga `agentes_YYYY-MM-DD.csv` con todas las métricas

---

## Módulo Archivos (`DataManager`)

- **Cards de dataset**: muestra fuente (Demo/Excel/API), nombre, registros y fecha+hora de carga
- **Zona de drop** (drag & drop) además del botón "Cargar Excel"
- **Descarga de plantilla**: enlace a `/plantilla-queplus.xlsx`
- **Guía de columnas**: toggle que muestra las columnas esperadas en el Excel
- **Límite**: archivos `.xlsx` de máximo 5 MB

---

## Comparación de datasets (`CompareView`)

Disponible en el módulo Archivos cuando hay 2 o más datasets cargados.

Muestra:
- Tabla comparativa de 11 métricas (dataset A en `que-teal`, dataset B en `plus-orange`)
- Gráfico de barras horizontales: SLA, FCR, Utilización, Adherencia
- Gráfico de líneas: volumen por hora (ambos datasets superpuestos)

---

## Gráficas disponibles (`ChartId`)

| ID | Título | Tipo Recharts | Módulo sugerido |
|----|--------|--------------|-----------------|
| `hourly` | Llamadas por hora | `LineChart` | Operaciones |
| `mix` | Mix Inbound/Outbound | `PieChart` (donut) | Operaciones |
| `scores` | Calificación por agente | `BarChart` | Calidad |
| `slaHour` | SLA por hora | `LineChart` + `ReferenceLine` 80% | Operaciones |
| `abandonHour` | Abandono por hora | `BarChart` + `ReferenceLine` 5% | Operaciones |
| `queues` | Distribución por cola | `PieChart` (donut) | WFM |

Las gráficas se cargan con `React.lazy` + `Suspense`.  
Cuando no hay datos, cada gráfica muestra `<EmptyChart />` en lugar de un Recharts vacío.

---

## Alertas de KPI (`useKpiAlerts`)

`lib/useKpiAlerts.ts` retorna `{ wfm: boolean, operaciones: boolean, calidad: boolean }`.  
Se muestra un punto rojo en el tab correspondiente cuando el módulo no está activo.

| Módulo | Condición de alerta |
|--------|---------------------|
| WFM | ocupación <60%, utilización <75%, shrinkage >35%, adherencia <90%, asistencia <90% |
| Operaciones | SLA <70%, abandono >10%, ASA >60 s |
| Calidad | FCR <70%, transferencias >20%, QA <75%, satisfacción <70% |

---

## Exportación

### PDF (impresión del navegador)
`@media print` en `styles.css` oculta `aside` (sidebar) y todo elemento `[data-no-print]` (tabs, filtros, ReportBuilder). El usuario usa `Ctrl+P` desde cualquier módulo analytics.

### CSV de agentes (`lib/exportCsv.ts`)
```ts
exportAgentsToCsv(agents: AgentStats[], filename?: string): void
```
- Columnas: Agente, Documento, Llamadas, TMO, Satisfacción, QA Score, SLA, FCR, Transferencias, Abandono, ASA
- BOM UTF-8 para compatibilidad con Excel en Windows
- Nombre de archivo por defecto: `agentes_YYYY-MM-DD.csv`
- Los porcentajes usan 2 decimales: `(v * 100).toFixed(2) + '%'`

---

## Generador de datos de muestra (`generate-sample-data.js`)

Script Node.js en la raíz del repositorio. Genera:
- `sample-data.xlsx`: 495 registros, 6 agentes, 12 días (abril–junio 2026)
- `frontend/public/plantilla-queplus.xlsx`: misma plantilla, disponible para descarga en la app

Agentes incluidos y sus cédulas:

| Agente | Documento |
|--------|-----------|
| Ana Ruiz | 1045678923 |
| Luis Mora | 1023456789 |
| Mia Cano | 1067890123 |
| Nico Paz | 1034567890 |
| Sara Gil | 1056789012 |
| Pedro Alba | 1012345678 |

---

## Desarrollo local

```bash
# Instalar dependencias
cd frontend
npm install

# Servidor de desarrollo (hot reload)
npm run dev          # http://localhost:5173

# Verificar tipos
npx tsc --noEmit

# Tests unitarios
npm test

# Build de producción
npm run build
```

**Variable de entorno:**
```
VITE_API_URL=http://localhost:3000/api   # URL del backend Express (opcional)
```
Si no está definida, el dashboard funciona en modo offline (solo parser local).

---

## Deploy

El proyecto se despliega manualmente a **Vercel** con:

```bash
cd frontend
vercel --prod
```

- URL de producción: `https://frontend-lovat-one-39.vercel.app`
- Config: `frontend/vercel.json`
- El frontend es 100% estático (SPA) — no requiere servidor para funcionar
- El backend Express es opcional; si no responde en 1.5 s, el parser local toma el control
- Después de cada cambio: `git push origin main` + `vercel --prod` desde `frontend/`
