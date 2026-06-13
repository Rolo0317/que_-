#!/usr/bin/env node
/**
 * Generador de datos de muestra QUE+ Dashboard
 * Usa exactamente los nombres de columna que lee excel.ts
 *
 * Columnas → campo interno:
 *  fecha       → date               tipo      → type
 *  agente      → agent              cola      → queue
 *  hora        → hour               duracion  → durationSeconds (segundos)
 *  espera      → waitSeconds        abandonada→ abandoned (true/false)
 *  sla         → answeredWithinSla  fcr       → resolvedFirstContact
 *  transferida → transferred        calificacion→ score (1-5)
 *  calidad     → qaScore (0-100)    programado→ scheduledSeconds
 *  login       → loginSeconds       productivo→ productiveSeconds
 *  disponible  → availableSeconds   shrinkage → shrinkageSeconds
 *  adherencia  → adherenceSeconds   planificado→ scheduled (true/false)
 *  conectado   → staffed (true/false) asistencia→ attendanceStatus
 */

const XLSX = require('xlsx');
const path = require('path');

// ─── Perfiles de agentes (rendimiento diferenciado) ───────────────────────────
const AGENTS = [
  { name: 'Ana Ruiz',   slaRate: 0.93, fcrRate: 0.91, transRate: 0.04, abanRate: 0.02, score: 4.8, qa: 97, utilRate: 0.88, shrinkRate: 0.08, adherRate: 0.97, attendance: 'Presente' },
  { name: 'Luis Mora',  slaRate: 0.84, fcrRate: 0.79, transRate: 0.10, abanRate: 0.05, score: 4.2, qa: 87, utilRate: 0.83, shrinkRate: 0.13, adherRate: 0.93, attendance: 'Presente' },
  { name: 'Mia Cano',   slaRate: 0.78, fcrRate: 0.72, transRate: 0.14, abanRate: 0.07, score: 4.0, qa: 84, utilRate: 0.80, shrinkRate: 0.16, adherRate: 0.91, attendance: 'Presente' },
  { name: 'Nico Paz',   slaRate: 0.88, fcrRate: 0.83, transRate: 0.08, abanRate: 0.04, score: 4.4, qa: 91, utilRate: 0.85, shrinkRate: 0.11, adherRate: 0.95, attendance: 'Presente' },
  { name: 'Sara Gil',   slaRate: 0.91, fcrRate: 0.87, transRate: 0.06, abanRate: 0.03, score: 4.6, qa: 94, utilRate: 0.87, shrinkRate: 0.09, adherRate: 0.96, attendance: 'Presente' },
  { name: 'Pedro Alba', slaRate: 0.63, fcrRate: 0.58, transRate: 0.22, abanRate: 0.12, score: 3.4, qa: 73, utilRate: 0.72, shrinkRate: 0.24, adherRate: 0.87, attendance: 'Tarde' },
];

const QUEUES = ['Soporte', 'Ventas', 'Retencion', 'Billing', 'Encuestas'];
const HOURS  = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

// 12 días repartidos en 3 meses
const DATES = [
  '2026-04-02', '2026-04-09', '2026-04-16', '2026-04-23',
  '2026-05-07', '2026-05-14', '2026-05-21', '2026-05-28',
  '2026-06-03', '2026-06-10', '2026-06-17', '2026-06-24',
];

function rnd(min, max) { return min + Math.random() * (max - min); }
function chance(p)      { return Math.random() < p; }
function pick(arr)      { return arr[Math.floor(Math.random() * arr.length)]; }
function jitter(base, pct = 0.1) {
  return Math.round(base * (1 + (Math.random() - 0.5) * 2 * pct));
}

const rows = [];
let rowId = 1;

for (const date of DATES) {
  for (const agent of AGENTS) {

    // ── WFM diario (mismos valores para todas las llamadas del agente ese día) ──
    const scheduledSeconds  = 28800;                                     // 8 horas
    const attendanceOk      = !chance(0.03);                             // 97% asistencia
    const loginSeconds      = attendanceOk ? jitter(scheduledSeconds * 0.94, 0.03) : 0;
    const productiveSeconds = Math.round(loginSeconds * jitter(agent.utilRate, 0.05));
    const availableDayTotal = loginSeconds - productiveSeconds;
    const shrinkageSeconds  = Math.round(scheduledSeconds * jitter(agent.shrinkRate, 0.1));
    const adherenceSeconds  = Math.round(scheduledSeconds * jitter(agent.adherRate, 0.03));
    const staffed           = attendanceOk;
    const attendanceStatus  = !attendanceOk ? 'Ausente' : chance(0.08) ? 'Tarde' : 'Presente';

    // Elegir 6-9 horas del día para este agente
    const callHours = [...HOURS].sort(() => Math.random() - 0.5).slice(0, 6 + Math.floor(Math.random() * 4));
    const nCalls = callHours.length;

    // Distribuir disponible entre llamadas de forma proporcional
    const availablePerCall = Math.round(availableDayTotal / nCalls);

    for (const hour of callHours.sort()) {
      const type = chance(0.60) ? 'Inbound' : 'Outbound';
      const queue = pick(QUEUES);

      const abandoned       = chance(agent.abanRate);
      const answeredWithinSla = !abandoned && chance(agent.slaRate);
      const fcr             = !abandoned && chance(agent.fcrRate);
      const transferred     = !fcr && !abandoned && chance(agent.transRate);

      const duracion    = Math.round(rnd(60, 900));
      const espera      = Math.round(rnd(5, abandoned ? 120 : 60));
      const calificacion = Math.max(1, Math.min(5, Math.round(agent.score + rnd(-0.6, 0.6))));
      const calidad      = Math.max(50, Math.min(100, Math.round(agent.qa + rnd(-8, 8))));

      rows.push({
        id:           rowId++,
        fecha:        date,
        hora:         hour,
        tipo:         type,
        agente:       agent.name,
        cola:         queue,
        duracion,                                   // segundos de conversacion
        espera,                                     // segundos de espera del cliente
        abandonada:   abandoned,                    // true / false
        sla:          answeredWithinSla,            // true / false
        fcr:          fcr,                          // true / false
        transferida:  transferred,                  // true / false
        calificacion,                               // 1–5
        calidad,                                    // 0–100
        // WFM (totales diarios del agente — mismos por fila del mismo día)
        programado:   scheduledSeconds,             // segundos planificados
        login:        loginSeconds,                 // segundos conectado
        productivo:   productiveSeconds,            // segundos productivos
        disponible:   availablePerCall,             // segundos disponible (por llamada)
        shrinkage:    shrinkageSeconds,             // segundos de shrinkage
        adherencia:   adherenceSeconds,             // segundos con adherencia
        planificado:  staffed,                      // true / false
        conectado:    staffed,                      // true / false
        asistencia:   attendanceStatus,             // Presente / Ausente / Tarde
      });
    }
  }
}

// ─── Generar Excel ────────────────────────────────────────────────────────────
const ws = XLSX.utils.json_to_sheet(rows);

// Ancho de columnas
const COL_WIDTHS = {
  id: 6, fecha: 12, hora: 8, tipo: 10, agente: 18, cola: 14,
  duracion: 10, espera: 8, abandonada: 12, sla: 6, fcr: 6, transferida: 12,
  calificacion: 13, calidad: 8, programado: 12, login: 8, productivo: 11,
  disponible: 11, shrinkage: 11, adherencia: 11, planificado: 12, conectado: 10, asistencia: 12,
};
ws['!cols'] = Object.values(COL_WIDTHS).map((w) => ({ wch: w }));

// Segunda hoja: Guía de columnas
const guide = [
  { columna: 'fecha',        tipo: 'Texto (YYYY-MM-DD)',  descripcion: 'Fecha de la llamada',              ejemplo: '2026-06-15' },
  { columna: 'hora',         tipo: 'Texto (HH:MM)',       descripcion: 'Hora del inicio de llamada',       ejemplo: '09:00' },
  { columna: 'tipo',         tipo: 'Texto',               descripcion: 'Inbound o Outbound',               ejemplo: 'Inbound' },
  { columna: 'agente',       tipo: 'Texto',               descripcion: 'Nombre del agente',                ejemplo: 'Ana Ruiz' },
  { columna: 'cola',         tipo: 'Texto',               descripcion: 'Cola o skill del agente',          ejemplo: 'Soporte' },
  { columna: 'duracion',     tipo: 'Número (segundos)',   descripcion: 'Duración de la llamada en seg.',   ejemplo: '312' },
  { columna: 'espera',       tipo: 'Número (segundos)',   descripcion: 'Tiempo de espera del cliente',     ejemplo: '25' },
  { columna: 'abandonada',   tipo: 'Booleano',            descripcion: 'TRUE si el cliente colgó antes',   ejemplo: 'FALSE' },
  { columna: 'sla',          tipo: 'Booleano',            descripcion: 'TRUE si se contestó dentro del SLA', ejemplo: 'TRUE' },
  { columna: 'fcr',          tipo: 'Booleano',            descripcion: 'TRUE si se resolvió en 1er contacto', ejemplo: 'TRUE' },
  { columna: 'transferida',  tipo: 'Booleano',            descripcion: 'TRUE si fue transferida',          ejemplo: 'FALSE' },
  { columna: 'calificacion', tipo: 'Número (1–5)',        descripcion: 'Satisfacción del cliente',         ejemplo: '4.5' },
  { columna: 'calidad',      tipo: 'Número (0–100)',      descripcion: 'QA Score interno',                 ejemplo: '92' },
  { columna: 'programado',   tipo: 'Número (segundos)',   descripcion: 'Segundos planificados del turno',  ejemplo: '28800' },
  { columna: 'login',        tipo: 'Número (segundos)',   descripcion: 'Segundos conectado al sistema',    ejemplo: '27600' },
  { columna: 'productivo',   tipo: 'Número (segundos)',   descripcion: 'Segundos en producción',           ejemplo: '23000' },
  { columna: 'disponible',   tipo: 'Número (segundos)',   descripcion: 'Segundos disponible/idle (x llamada)', ejemplo: '450' },
  { columna: 'shrinkage',    tipo: 'Número (segundos)',   descripcion: 'Segundos de shrinkage del turno',  ejemplo: '2400' },
  { columna: 'adherencia',   tipo: 'Número (segundos)',   descripcion: 'Segundos con adherencia al horario', ejemplo: '27200' },
  { columna: 'planificado',  tipo: 'Booleano',            descripcion: 'TRUE si el agente estaba programado ese día', ejemplo: 'TRUE' },
  { columna: 'conectado',    tipo: 'Booleano',            descripcion: 'TRUE si el agente se presentó',   ejemplo: 'TRUE' },
  { columna: 'asistencia',   tipo: 'Texto',               descripcion: 'Presente / Ausente / Tarde',       ejemplo: 'Presente' },
];
const wsGuide = XLSX.utils.json_to_sheet(guide);
wsGuide['!cols'] = [{ wch: 14 }, { wch: 22 }, { wch: 46 }, { wch: 14 }];

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Llamadas');
XLSX.utils.book_append_sheet(wb, wsGuide, 'Guia de columnas');

// Guardar en dos lugares
const outputRoot     = path.join(__dirname, 'sample-data.xlsx');
const outputPublic   = path.join(__dirname, 'frontend', 'public', 'plantilla-queplus.xlsx');

XLSX.writeFile(wb, outputRoot);
XLSX.writeFile(wb, outputPublic);

console.log(`✅ Generado: ${outputRoot}`);
console.log(`✅ Copiado a public: ${outputPublic}`);
console.log(`📊 Registros: ${rows.length}`);
console.log(`👥 Agentes: ${AGENTS.length}`);
console.log(`📅 Días: ${DATES.length} (${DATES[0]} → ${DATES[DATES.length - 1]})`);
console.log(`📋 Columnas: ${Object.keys(rows[0]).join(', ')}`);
