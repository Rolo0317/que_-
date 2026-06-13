#!/usr/bin/env node
/**
 * Generador de datos de muestra QUE+ Dashboard
 * Columnas → campo interno:
 *  fecha → date          documento → documento   tipo → type
 *  agente → agent        cola → queue            hora → hour
 *  duracion → durationSeconds (seg)              espera → waitSeconds
 *  abandonada → abandoned (bool)                 sla → answeredWithinSla
 *  fcr → resolvedFirstContact                    transferida → transferred
 *  calificacion → score (1-5)                    calidad → qaScore (0-100)
 *  programado → scheduledSeconds                 login → loginSeconds
 *  productivo → productiveSeconds                disponible → availableSeconds
 *  shrinkage → shrinkageSeconds                  adherencia → adherenceSeconds
 *  planificado → scheduled (bool)                conectado → staffed (bool)
 *  asistencia → attendanceStatus
 */

const XLSX = require('xlsx');
const path = require('path');

// Perfiles base de agentes (rendimiento base diferenciado)
const AGENTS = [
  { name: 'Ana Ruiz',   doc: '1045678923', slaRate: 0.93, fcrRate: 0.91, transRate: 0.04, abanRate: 0.02, score: 4.8, qa: 97, utilRate: 0.88, shrinkRate: 0.08, adherRate: 0.97 },
  { name: 'Luis Mora',  doc: '1023456789', slaRate: 0.84, fcrRate: 0.79, transRate: 0.10, abanRate: 0.05, score: 4.2, qa: 87, utilRate: 0.83, shrinkRate: 0.13, adherRate: 0.93 },
  { name: 'Mia Cano',   doc: '1067890123', slaRate: 0.78, fcrRate: 0.72, transRate: 0.14, abanRate: 0.07, score: 4.0, qa: 84, utilRate: 0.80, shrinkRate: 0.16, adherRate: 0.91 },
  { name: 'Nico Paz',   doc: '1034567890', slaRate: 0.88, fcrRate: 0.83, transRate: 0.08, abanRate: 0.04, score: 4.4, qa: 91, utilRate: 0.85, shrinkRate: 0.11, adherRate: 0.95 },
  { name: 'Sara Gil',   doc: '1056789012', slaRate: 0.91, fcrRate: 0.87, transRate: 0.06, abanRate: 0.03, score: 4.6, qa: 94, utilRate: 0.87, shrinkRate: 0.09, adherRate: 0.96 },
  { name: 'Pedro Alba', doc: '1012345678', slaRate: 0.63, fcrRate: 0.58, transRate: 0.22, abanRate: 0.14, score: 3.4, qa: 71, utilRate: 0.72, shrinkRate: 0.26, adherRate: 0.85 },
];

const QUEUES = ['Soporte', 'Ventas', 'Retencion', 'Billing', 'Encuestas'];
const HOURS  = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// 12 días en 3 meses
const DATES = [
  '2026-04-02', '2026-04-09', '2026-04-16', '2026-04-23',
  '2026-05-07', '2026-05-14', '2026-05-21', '2026-05-28',
  '2026-06-03', '2026-06-10', '2026-06-17', '2026-06-24',
];

// ─── Utilidades ───────────────────────────────────────────────────────────────
function rnd(min, max) { return min + Math.random() * (max - min); }
function chance(p)     { return Math.random() < Math.min(1, Math.max(0, p)); }
function pick(arr)     { return arr[Math.floor(Math.random() * arr.length)]; }

/** Varía una tasa (0-1) en ±spread, manteniéndola en [0, 1] */
function varyRate(rate, spread) {
  return Math.min(1, Math.max(0, rate + (Math.random() - 0.5) * 2 * spread));
}

/** Varía un valor absoluto en ±pct% */
function varyAbs(base, pct) {
  return base * (1 + (Math.random() - 0.5) * 2 * pct);
}

const rows = [];
let rowId = 1;

for (const date of DATES) {
  for (const agent of AGENTS) {

    // ── Variación diaria del desempeño (buen día / mal día) ──
    const dayMood = rnd(0.82, 1.18);  // factor aleatorio por día

    const slaToday   = varyRate(agent.slaRate * dayMood,  0.08);
    const fcrToday   = varyRate(agent.fcrRate * dayMood,  0.08);
    const transToday = varyRate(agent.transRate / dayMood, 0.06);
    const abanToday  = varyRate(agent.abanRate / dayMood,  0.05);

    // ── WFM diario — en segundos reales (no Math.round sobre tasas) ──
    const scheduledSeconds  = 28800;                              // 8 h exactas
    const absent            = chance(0.04);
    const late              = !absent && chance(0.07);
    const attendanceStatus  = absent ? 'Ausente' : late ? 'Tarde' : 'Presente';
    const staffed           = !absent;

    // loginSeconds: 88-97% del turno; 0 si ausente
    const loginRate         = absent ? 0 : varyRate(0.925, 0.04);
    const loginSeconds      = Math.round(scheduledSeconds * loginRate);

    // productivo: utilRate del agente ±10 pp, aplicado sobre login
    const utilToday         = varyRate(agent.utilRate * dayMood, 0.10);
    const productiveSeconds = Math.round(loginSeconds * utilToday);
    const availableDayTotal = Math.max(0, loginSeconds - productiveSeconds);

    // shrinkage: shrinkRate del agente ±8 pp de scheduled
    const shrinkRateToday   = varyRate(agent.shrinkRate, 0.08);
    const shrinkageSeconds  = Math.round(scheduledSeconds * shrinkRateToday);

    // adherencia: adherRate ±5 pp de scheduled
    const adherRateToday    = varyRate(agent.adherRate * (absent ? 0 : 1), 0.05);
    const adherenceSeconds  = Math.round(scheduledSeconds * adherRateToday);

    // Llamadas del día: 5-9 franjas horarias
    const nSlots = 5 + Math.floor(Math.random() * 5);
    const callHours = [...HOURS]
      .sort(() => Math.random() - 0.5)
      .slice(0, absent ? 0 : nSlots)
      .sort();

    const nCalls = callHours.length;
    const availablePerCall = nCalls > 0 ? Math.round(availableDayTotal / nCalls) : 0;

    for (const hour of callHours) {
      const tipo = chance(0.60) ? 'Inbound' : 'Outbound';
      const cola = pick(QUEUES);

      const abandonada       = chance(abanToday);
      const sla              = !abandonada && chance(slaToday);
      const fcr              = !abandonada && chance(fcrToday);
      const transferida      = !fcr && !abandonada && chance(transToday);

      // Duración: más larga si no FCR, más corta si abandonada
      const baseDur          = abandonada ? rnd(10, 60) : fcr ? rnd(120, 600) : rnd(200, 900);
      const duracion         = Math.round(baseDur);
      const espera           = Math.round(rnd(5, abandonada ? 150 : 55));

      // Score: variación amplia (±1.5 puntos del base del agente)
      const rawScore         = agent.score + (Math.random() - 0.5) * 3;
      const calificacion     = parseFloat(Math.min(5, Math.max(1, rawScore)).toFixed(1));

      // QA: variación amplia (±15 puntos del base del agente)
      const calidad          = Math.round(Math.min(100, Math.max(50, agent.qa + rnd(-15, 15))));

      rows.push({
        id:          rowId++,
        fecha:       date,
        documento:   agent.doc,
        hora:        hour,
        tipo,
        agente:      agent.name,
        cola,
        duracion,
        espera,
        abandonada,
        sla,
        fcr,
        transferida,
        calificacion,
        calidad,
        // WFM — mismos por cada fila del agente ese día
        programado:  scheduledSeconds,
        login:       loginSeconds,
        productivo:  productiveSeconds,
        disponible:  availablePerCall,
        shrinkage:   shrinkageSeconds,
        adherencia:  adherenceSeconds,
        planificado: staffed,
        conectado:   staffed,
        asistencia:  attendanceStatus,
      });
    }
  }
}

// ─── Generar Excel ────────────────────────────────────────────────────────────
const ws = XLSX.utils.json_to_sheet(rows);

ws['!cols'] = [
  { wch: 6 },  // id
  { wch: 12 }, // fecha
  { wch: 12 }, // documento
  { wch: 8 },  // hora
  { wch: 10 }, // tipo
  { wch: 18 }, // agente
  { wch: 14 }, // cola
  { wch: 10 }, // duracion
  { wch: 8 },  // espera
  { wch: 12 }, // abandonada
  { wch: 6 },  // sla
  { wch: 6 },  // fcr
  { wch: 12 }, // transferida
  { wch: 13 }, // calificacion
  { wch: 8 },  // calidad
  { wch: 12 }, // programado
  { wch: 8 },  // login
  { wch: 11 }, // productivo
  { wch: 11 }, // disponible
  { wch: 11 }, // shrinkage
  { wch: 11 }, // adherencia
  { wch: 12 }, // planificado
  { wch: 10 }, // conectado
  { wch: 12 }, // asistencia
];

// Hoja guía
const guide = [
  { columna: 'fecha',        tipo: 'Texto (YYYY-MM-DD)',  descripcion: 'Fecha de la llamada',                   ejemplo: '2026-06-15' },
  { columna: 'documento',    tipo: 'Texto',               descripcion: 'Cédula o documento del agente',         ejemplo: '1045678923' },
  { columna: 'hora',         tipo: 'Texto (HH:MM)',       descripcion: 'Hora de inicio de la llamada',          ejemplo: '09:00' },
  { columna: 'tipo',         tipo: 'Texto',               descripcion: 'Inbound o Outbound',                    ejemplo: 'Inbound' },
  { columna: 'agente',       tipo: 'Texto',               descripcion: 'Nombre del agente',                     ejemplo: 'Ana Ruiz' },
  { columna: 'cola',         tipo: 'Texto',               descripcion: 'Cola o skill del agente',               ejemplo: 'Soporte' },
  { columna: 'duracion',     tipo: 'Número (segundos)',   descripcion: 'Duración de la llamada',                ejemplo: '312' },
  { columna: 'espera',       tipo: 'Número (segundos)',   descripcion: 'Tiempo de espera del cliente',          ejemplo: '25' },
  { columna: 'abandonada',   tipo: 'Booleano',            descripcion: 'TRUE si el cliente colgó antes',        ejemplo: 'FALSE' },
  { columna: 'sla',          tipo: 'Booleano',            descripcion: 'TRUE si se contestó dentro del SLA',    ejemplo: 'TRUE' },
  { columna: 'fcr',          tipo: 'Booleano',            descripcion: 'TRUE si se resolvió en 1er contacto',   ejemplo: 'TRUE' },
  { columna: 'transferida',  tipo: 'Booleano',            descripcion: 'TRUE si fue transferida',               ejemplo: 'FALSE' },
  { columna: 'calificacion', tipo: 'Número (1.0–5.0)',   descripcion: 'Satisfacción del cliente',              ejemplo: '4.5' },
  { columna: 'calidad',      tipo: 'Número (0–100)',      descripcion: 'QA Score interno',                      ejemplo: '92' },
  { columna: 'programado',   tipo: 'Número (segundos)',   descripcion: 'Segundos planificados del turno (28800 = 8 h)', ejemplo: '28800' },
  { columna: 'login',        tipo: 'Número (segundos)',   descripcion: 'Segundos que el agente estuvo conectado', ejemplo: '26640' },
  { columna: 'productivo',   tipo: 'Número (segundos)',   descripcion: 'Segundos en producción (en llamada)',   ejemplo: '23443' },
  { columna: 'disponible',   tipo: 'Número (segundos)',   descripcion: 'Segundos disponible/idle por llamada',  ejemplo: '420' },
  { columna: 'shrinkage',    tipo: 'Número (segundos)',   descripcion: 'Segundos de shrinkage del turno',       ejemplo: '2880' },
  { columna: 'adherencia',   tipo: 'Número (segundos)',   descripcion: 'Segundos con adherencia al horario',    ejemplo: '27648' },
  { columna: 'planificado',  tipo: 'Booleano',            descripcion: 'TRUE si el agente estaba programado',   ejemplo: 'TRUE' },
  { columna: 'conectado',    tipo: 'Booleano',            descripcion: 'TRUE si el agente se presentó',         ejemplo: 'TRUE' },
  { columna: 'asistencia',   tipo: 'Texto',               descripcion: 'Presente / Ausente / Tarde',            ejemplo: 'Presente' },
];
const wsGuide = XLSX.utils.json_to_sheet(guide);
wsGuide['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 52 }, { wch: 14 }];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Llamadas');
XLSX.utils.book_append_sheet(wb, wsGuide, 'Guia de columnas');

const outputRoot   = path.join(__dirname, 'sample-data.xlsx');
const outputPublic = path.join(__dirname, 'frontend', 'public', 'plantilla-queplus.xlsx');

XLSX.writeFile(wb, outputRoot);
XLSX.writeFile(wb, outputPublic);

// ─── Reporte de sanidad ───────────────────────────────────────────────────────
const totalRows = rows.length;
for (const agent of AGENTS) {
  const agentRows = rows.filter((r) => r.agente === agent.name);
  const slaCount  = agentRows.filter((r) => r.sla).length;
  const abanCount = agentRows.filter((r) => r.abandonada).length;
  const avgDisp   = agentRows.length
    ? Math.round(agentRows.reduce((s, r) => s + r.disponible, 0) / agentRows.length)
    : 0;
  const avgProd   = agentRows.length
    ? Math.round(agentRows.reduce((s, r) => s + r.productivo, 0) / agentRows.length)
    : 0;
  const occup     = avgProd + avgDisp > 0
    ? ((agentRows.reduce((s, r) => s + r.duracion, 0) / agentRows.length) /
       ((agentRows.reduce((s, r) => s + r.duracion, 0) / agentRows.length) + avgDisp) * 100).toFixed(0)
    : 'N/A';
  console.log(
    `  ${agent.name.padEnd(12)} | ${agentRows.length.toString().padStart(3)} llamadas` +
    ` | SLA: ${(slaCount / agentRows.length * 100).toFixed(0).padStart(3)}%` +
    ` | Aban: ${(abanCount / agentRows.length * 100).toFixed(0).padStart(2)}%` +
    ` | Util: ${(avgProd / 27000 * 100).toFixed(0).padStart(3)}%` +
    ` | Ocup: ${String(occup).padStart(3)}%`
  );
}

console.log(`\n✅ Generado: ${outputRoot}`);
console.log(`✅ Copiado a public: ${outputPublic}`);
console.log(`📊 Total registros: ${totalRows}`);
