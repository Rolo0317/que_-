# Que+ Call Center Dashboard

Dashboard analítico profesional para operaciones de BPO con indicadores WFM en tiempo real. Carga datos de Excel, calcula 12+ métricas operativas y construye informes visuales con tema claro/oscuro, animaciones suaves y despliegue en Vercel.

## 🚀 Características principales

### Dashboard
- ✅ 12+ indicadores operativos y de WFM
- ✅ Tema claro/oscuro con persistencia
- ✅ Animaciones suaves con Framer Motion
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Filtrado por Inbound/Outbound en tiempo real
- ✅ Carga de datos Excel (.xlsx)
- ✅ Logo con fondo transparente
- ✅ Footer dinámico con estadísticas

### Indicadores WFM (Workforce Management)
- **Ocupación (Occupancy)**: % de tiempo productivo
- **Utilización (Utilization)**: % tiempo en llamadas vs disponible
- **Shrinkage**: % tiempo no productivo (breaks, training)
- **Adherencia (Adherence)**: % cumplimiento del horario
- **Asistencia (Attendance)**: % agentes presentes
- **AHT (Average Handle Time)**: duración media de llamadas
- **ASA (Average Speed to Answer)**: tiempo de espera promedio
- **SLA (Service Level Agreement)**: % contestadas a tiempo
- **FCR (First Contact Resolution)**: resuelto en primer contacto
- **Transfer Rate**: % de derivaciones
- **QA Score**: calificación de calidad
- **Abandono**: % de llamadas abandonadas

### Datos de prueba
- Excel con 4,950 registros de WFM
- 15 agentes virtuales
- 5 colas operativas
- 30 días de datos históricos
- Indicadores realistas

## 📋 Estructura

```
que_+/
├── frontend/                    # React + Vite + Tailwind
│   ├── src/
│   │   ├── components/         # Componentes React
│   │   ├── lib/                # Lógica de negocio
│   │   ├── types/              # TypeScript types
│   │   ├── data/               # Datos de prueba
│   │   └── App.tsx
│   ├── tests/
│   │   └── e2e/               # Tests Playwright
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── .env.example
│   └── vercel.json            # Configuración Vercel
│
├── backend/                    # Node.js + Express
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── routes/
│   │   └── app.ts
│   └── Dockerfile
│
├── sample-data.xlsx           # Datos de prueba generados
├── docker-compose.yml
├── planning.md
└── README.md
```

## ⚙️ Requisitos

- Node.js 20 o superior
- npm 10 o superior
- Docker Desktop (opcional, para desarrollo local)
- Git

## 🛠️ Instalación

```bash
# Clonar y instalar
git clone <tu-repo>
cd que_+
npm install

# Copiar variables de entorno
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

## 🚀 Desarrollo local

### Sin Docker (recomendado para desarrollo)

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend  
npm run dev:frontend
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000

### Con Docker Compose

```bash
docker compose up --build
```

- Frontend: http://localhost:8080
- Backend: http://localhost:3000

## 🧪 Pruebas

### Pruebas unitarias (Vitest)

```bash
npm run test                  # Ejecutar todas
npm run test:watch          # Modo watch
```

Pruebas incluidas:
- Cálculo de métricas WFM
- Filtrado de llamadas
- Distribuciones horarias
- Indicadores de desempeño
- Ocupación, utilización, shrinkage, adherencia

### Pruebas E2E (Playwright)

```bash
npm run test:e2e            # Headless
npx playwright test --ui    # UI mode
```

Tests incluidos:
- Navegación y carga
- Filtrado Inbound/Outbound
- Tema claro/oscuro
- Carga de archivos Excel
- Indicadores WFM
- Animaciones
- Responsividad

## 📦 Scripts disponibles

```bash
npm run dev              # Desarrollo (frontend + backend)
npm run dev:frontend    # Solo frontend
npm run dev:backend     # Solo backend

npm run build           # Build de producción
npm run preview         # Preview del build

npm run lint            # ESLint
npm run test            # Vitest
npm run test:e2e        # Playwright

npm run docker:build    # Build Docker
npm run docker:up       # Compose up
```

## 🌐 Despliegue en Vercel

### Configuración inicial

1. Conecta tu repositorio en [Vercel Dashboard](https://vercel.com)
2. Configura las variables de entorno en Project Settings:
   ```
   VITE_API_URL=https://api-backend.domain.com
   VITE_APP_NAME=QUE+ Dashboard
   ```
3. Build Command: `npm run build`
4. Output Directory: `dist` (Vercel detecta Vite automáticamente)

### Deploy automático

El frontend se despliega automáticamente en cada push a main:
- Vercel ejecuta `npm run build`
- Sirve el contenido de `dist/`
- URL: `https://proyecto.vercel.app`

### Backend

Para el backend, despliega como contenedor en:
- DigitalOcean App Platform
- AWS ECS
- Google Cloud Run
- Railway
- Render

Variables de entorno:
```
PORT=3000
CORS_ORIGIN=https://proyecto.vercel.app
NODE_ENV=production
```

## 📊 Carga de datos

### Archivo Excel

El archivo debe ser `.xlsx` con columnas:

```
fecha       | hora    | tipo     | agente | cola    | duracion_segundos | ...
2024-01-01  | 09:00   | Inbound  | Juan   | Soporte | 300              | ...
```

Columnas soportadas (español o inglés):
- `tipo`/`type`: Inbound/Outbound
- `agente`/`agent`: nombre del agente
- `cola`/`queue`: nombre de la cola
- `hora`/`hour`: hora de la llamada
- `duracion_segundos`/`durationSeconds`: segundos
- `abandonada`/`abandoned`: true/false
- `calificacion`/`score`: 1-5
- `ocupacion_pct`, `utilizacion_pct`, `shrinkage_pct`, `adherencia_pct`
- `asistencia`, `aht_segundos`, `tiempo_espera_segundos`

### Generar datos de prueba

```bash
node generate-sample-data.js
```

Crea `sample-data.xlsx` con 4,950 registros.

## 🎨 Paleta de colores

- **Primario (Turquesa)**: #11AEB3 - `text-que-teal`
- **Secundario (Naranja)**: #FF9700 - `text-plus-orange`
- **Oscuro**: #102027 - `bg-ink`
- **Claro**: #f5f7f8 - `bg-mist`
- **Violeta**: #6f5dd5 - `text-violet`

## 🔌 API

### Endpoints

```
GET  /api/health              # Status
GET  /api/data?type=Inbound  # Datos con métricas
POST /api/data                # Procesar datos
POST /api/upload              # Cargar Excel
```

### Respuesta de `/api/data`

```json
{
  "data": [
    {
      "id": "1",
      "type": "Inbound",
      "agent": "Juan",
      "queue": "Soporte",
      "durationSeconds": 300,
      "score": 5,
      "occupancy": 0.75,
      "utilization": 0.85,
      "shrinkage": 0.05,
      "adherence": 0.95,
      "attendance": "Presente"
    }
  ],
  "metrics": {
    "total": 1500,
    "inbound": 1000,
    "outbound": 500,
    "abandonRate": 0.03,
    "occupancy": 0.78,
    "utilization": 0.82,
    "shrinkage": 0.08,
    "adherence": 0.91,
    "attendance": 0.97,
    "serviceLevel": 0.96,
    "avgDuration": 245,
    "avgScore": 4.2
  }
}
```

## 🛡️ Buenas prácticas

- ✅ Clean Code: funciones pequeñas, nombres claros
- ✅ DRY: lógica centralizada, sin repetición
- ✅ SOLID: responsabilidades únicas, extensible
- ✅ Accesibilidad: ARIA labels, navegación por teclado
- ✅ Performance: lazy loading, memoización, optimización
- ✅ Seguridad: validación de datos, CORS configurado
- ✅ Tipos: TypeScript strict mode en todo
- ✅ Tests: unitarias + E2E

## 📚 Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| **Frontend** | React 19, TypeScript, Vite |
| **Estilos** | Tailwind CSS 3 |
| **Animaciones** | Framer Motion 12 |
| **Gráficas** | Recharts 3 |
| **Backend** | Node.js, Express, TypeScript |
| **Pruebas** | Vitest, Playwright |
| **Infraestructura** | Docker, Docker Compose, Vercel |
| **Base de datos** | Excel (SheetJS) |
| **Linter** | ESLint 9 |

## 🚦 Roadmap futuro

- [ ] Base de datos PostgreSQL
- [ ] Autenticación y autorización
- [ ] Exportación PDF/CSV
- [ ] Alertas y notificaciones
- [ ] Dashboard personalizable
- [ ] Análisis histórico y tendencias
- [ ] API GraphQL
- [ ] Mobile app
- [ ] Integración con sistemas WFM (Genesys, Five9)

## 📞 Soporte

Para preguntas o problemas:
1. Revisa `planning.md` para el estado del proyecto
2. Consulta los tests en `tests/e2e/` y `src/lib/*.test.ts`
3. Abre un issue en GitHub

## 📝 Licencia

Proyecto desarrollado con ❤️ para operaciones de BPO.

---

**Última actualización:** 2026-01-06 | **Versión:** 0.2.0 (V2 - WFM Enhanced)
