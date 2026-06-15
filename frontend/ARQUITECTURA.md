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
| Deploy | Vercel (auto desde main) | — |

---

## Estructura de carpetas

```
frontend/
├── public/
│   ├── logo-que-plus.svg          # Watermark y sidebar
│   └── plantilla-queplus.xlsx     # Template descargable
│
└── src/
    ├── App.tsx                    # Raíz: estado global, routing de módulos, KPIs
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
        ├── App.tsx                # (ver sección Estado)
        ├── AgentView.tsx          # Módulo Agentes: cards, búsqueda, detalle, export CSV
        ├── BrandLogo.tsx          # Logo SVG como componente
        ├── Charts.tsx             # 6 gráficas Recharts (lazy-loaded)
        ├── CompareView.tsx        # Modo comparación lado a lado de dos datasets
        ├── DashboardFooter.tsx    # Footer con estadísticas en vivo
        ├── DataManager.tsx        # Módulo Archivos: CRUD de datasets, drag & drop
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

## Tipos principales (`types/calls.ts`)

```ts
interface CallRecord {
  id: string | number
  date?: string              // 'YYYY-MM-DD'
  type: string               // 'Inbound' | 'Outbound'
  agent: string
  documento?: string         // cédula del agente
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
  // WFM (en segundos)
  scheduledSeconds?: number  // 8 h = 28800
  loginSeconds?: number
  productiveSeconds?: number
  availableSeconds?: number
  shrinkageSeconds?: number
  adherenceSeconds?: number
  scheduled?: boolean
  staffed?: boolean
  attendanceStatus?: string  // 'Presente' | 'Ausente' | 'Tarde'
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

---

## Sistema de semáforos (`KpiCard`)

```ts
type KpiStatus = 'good' | 'warning' | 'bad' | 'neutral'
```

| Estado | Color | Significado |
|--------|-------|-------------|
| `good` | Verde esmeralda | Cumple la meta |
| `warning` | Ámbar | En zona de riesgo |
| `bad` | Rosa/rojo | Fuera de meta |
| `neutral` | Teal | Referencial (sin meta) |

**Helpers usados en App.tsx:**
```ts
pct(v, g, w)     // v >= g → good, v >= w → warning, else bad  (mayor es mejor)
pctInv(v, g, w)  // v <= g → good, v <= w → warning, else bad  (menor es mejor)
secInv(v, g, w)  // igual que pctInv pero para segundos
occupancy(v)     // 0.75–0.90 → good · >0.60 → warning · else bad
```

---

## Tokens de diseño (Tailwind)

```js
// tailwind.config.js
colors: {
  ink:          '#102027',  // fondo sidebar, texto principal
  mist:         '#f5f7f8',  // fondo claro de la app
  'que-teal':   '#11AEB3',  // acento primario (botones, activo)
  'que-teal-dark': '#08777d',
  'plus-orange':'#FF9700',  // acento secundario, comparación B
  coral:        '#ff6f4f',  // errores, abandono
  violet:       '#6f5dd5',  // fuente demo
}

boxShadow: {
  panel: '0 16px 36px rgba(16, 32, 39, 0.1)'  // sombra de tarjetas
}
```

Dark mode: `darkMode: 'class'` → `document.documentElement.classList.toggle('dark', ...)`  
Preferencia guardada en `localStorage('theme-preference')`.

---

## Carga de Excel

`lib/excel.ts` usa `read-excel-file/browser` para parsear el archivo en el navegador (sin servidor).

**Pipeline de normalización:**
1. Lee la hoja → array de filas `[header[], ...data[]]`
2. `normalizeKey(key)` → limpia espacios/guiones bajos y busca en `columnMap`
3. Mapeo bilingüe: acepta columnas en español (`agente`, `duracion`, `abandonada`...) e inglés (`agent`, `durationSeconds`, `abandoned`...)
4. Booleans: acepta `true` nativo, `'true'`, `'si'`, `'yes'`, `'1'`
5. Devuelve `CallRecord[]`

**Flujo de carga en `handleFile`:**
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

| Módulo | Ruta (`activeModule`) | Componente | KPIs |
|--------|-----------------------|-----------|------|
| WFM | `'wfm'` | KpiCard × 5 + Charts | Ocupación, Utilización, Shrinkage, Adherencia, Asistencia |
| Operaciones | `'operaciones'` | KpiCard × 7 + Charts | SLA, Abandono, ASA, AHT, Inbound/Outbound |
| Calidad | `'calidad'` | KpiCard × 4 + Charts | FCR, Transferencias, QA Score, Satisfacción |
| Agentes | `'agentes'` | AgentView | Cards por agente, búsqueda nombre/documento, export CSV |
| Archivos | `'archivos'` | DataManager + CompareView | CRUD datasets, comparación lado a lado |

---

## Gráficas disponibles (`ChartId`)

| ID | Título | Tipo | Módulo sugerido |
|----|--------|------|-----------------|
| `hourly` | Llamadas por hora | Línea | Operaciones |
| `mix` | Mix Inbound/Outbound | Donut | Operaciones |
| `scores` | Calificación por agente | Barras | Calidad |
| `slaHour` | SLA por hora | Línea + ReferenceLine 80% | Operaciones |
| `abandonHour` | Abandono por hora | Barras + ReferenceLine 5% | Operaciones |
| `queues` | Distribución por cola | Donut | WFM |

Las gráficas se cargan con `React.lazy` + `Suspense` para reducir el bundle inicial.

---

## Alertas de KPI (`useKpiAlerts`)

`lib/useKpiAlerts.ts` detecta si algún KPI está en estado `bad` y retorna `{ wfm, operaciones, calidad }`.  
Se muestra un punto rojo en el tab correspondiente cuando el módulo no está activo.

Umbrales de alerta:
- **WFM**: ocupación <60%, utilización <75%, shrinkage >35%, adherencia <90%, asistencia <90%
- **Operaciones**: SLA <70%, abandono >10%, ASA >60 s
- **Calidad**: FCR <70%, transferencias >20%, QA <75%, satisfacción <70%

---

## Comparación de datasets (`CompareView`)

Disponible en el módulo **Archivos** cuando hay 2 o más datasets cargados.

Muestra:
- Tabla comparativa de 11 métricas (dataset A en teal, dataset B en naranja)
- Gráfico de barras horizontales: SLA, FCR, Utilización, Adherencia
- Gráfico de líneas: volumen por hora (ambos datasets superpuestos)

---

## Exportación

### PDF (impresión)
`@media print` en `styles.css` oculta `aside` (sidebar) y todo elemento `[data-no-print]` (tabs, filtros, ReportBuilder). El usuario usa `Ctrl+P` desde cualquier módulo analytics.

### CSV de agentes
`lib/exportCsv.ts` → `exportAgentsToCsv(agents[])`:
- Columnas: Agente, Documento, Llamadas, TMO, Satisfacción, QA Score, SLA, FCR, Transferencias, Abandono, ASA
- BOM UTF-8 para compatibilidad con Excel
- Nombre de archivo: `agentes_YYYY-MM-DD.csv`

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

El proyecto se despliega automáticamente en **Vercel** al hacer `git push origin main`.

- URL de producción: `https://que-frontend.vercel.app`
- Config: `frontend/vercel.json`
- El frontend es 100% estático (SPA) — no requiere servidor para funcionar
- El backend Express es opcional; si no responde, el parser local toma el control
