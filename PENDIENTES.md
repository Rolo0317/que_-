# QUE+ · Tareas pendientes

Usa este archivo para guiarme. Dime qué número hacer primero y lo implemento.

---

## Tareas pendientes

### 1. Metas y semáforos editables (UI mejorada)
**Estado:** La lógica ya existe (botón "Metas" en el header abre el panel `ThresholdConfig`).  
**Pendiente:** Hacerlo más visible e intuitivo — quizás tarjetas con colores del semáforo, sliders en lugar de inputs numéricos, y previsualización en tiempo real del impacto en los KPIs.

---

### ~~2. Selector de tipo de gráfica por panel~~ ✅ Listo
Toolbar de íconos (top-right de cada tarjeta): Barras / Barras horiz. / Líneas / Área / Pastel según la gráfica. Persiste en localStorage por chart-id.

---

### 3. Dashboard más intuitivo para cualquier persona
**Estado:** En progreso.  
**Pendiente:**
- Tooltips explicativos en cada KPI ("¿Qué significa SLA?")  
- Guía/tour inicial (onboarding steps) la primera vez que el usuario carga datos  
- Colores y etiquetas más claras en los semáforos (verde = bien, amarillo = riesgo, rojo = alerta)  
- Simplificar el lenguaje técnico en los títulos

---

### 4. Módulo de agentes más visual
**Estado:** Existe la tabla de agentes en `/agentes`.  
**Pendiente:** Agregar mini-gráficas de tendencia por agente, ranking visual, comparación contra la meta.

---

### 5. Exportar informe en PDF / Excel
**Estado:** No implementado (existe `data-no-print` en elementos no imprimibles).  
**Pendiente:** Botón "Exportar PDF" que dispara `window.print()` con estilos de impresión ya configurados. Opcionalmente exportar los datos filtrados a Excel (xlsx).

---

### 6. Persistencia de la selección de gráficas y layout
**Estado:** La selección de gráficas y el layout se reinician en F5.  
**Pendiente:** Guardar `selectedCharts` y `layout` en localStorage junto con los thresholds.

---

## Ya implementado esta sesión
- [x] **Tarea 1** — Panel "Metas" rediseñado: zone-bars de colores, sliders, descripciones en español
- [x] **Tarea 2** — Selector de tipo de gráfica por panel (Barras/Líneas/Área/Pastel), persiste en localStorage
- [x] Filtro de rango de fechas ("Desde / Hasta") en el panel de gráficas
- [x] Filtro por campaña/cola en la barra de filtros
- [x] Etiquetas de datos en gráficas adaptadas a modo oscuro y claro
- [x] "Calificación por agente" → horizontal Top 20 (ya no aplasta con 100+ agentes)
- [x] Dashboard arranca vacío → onboarding para cargar Excel
- [x] Botón "Umbrales" renombrado a "Metas"
- [x] "En uso" → botón "Apagar" para volver al dataset demo
- [x] Datos del Excel persisten con F5 (sessionStorage)
- [x] Splash animado del Mundial con jugador y colores de marca
- [x] Datos de muestra en formato Vicidial (125 agentes, 3 meses, 6 campañas)
