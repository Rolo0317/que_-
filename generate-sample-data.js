#!/usr/bin/env node
/**
 * Generador de datos de muestra QUE+ — formato Vicidial
 *
 * Columnas que genera (mapeo al parser de excel.ts):
 *   uniqueid      → id
 *   calldate      → date + hour  (parser: vicidialDateTime)
 *   user          → agent
 *   cedula        → documento
 *   campaign_id   → queue
 *   status        → type / abandoned / answeredWithinSla / transferred / resolvedFirstContact
 *   length_in_sec → durationSeconds
 *   queue_seconds → waitSeconds
 *   calificacion  → score
 *   calidad       → qaScore
 *   login_sec     → loginSeconds
 *   dispo_sec     → productiveSeconds
 *   pause_sec     → shrinkageSeconds
 *   wait_sec      → availableSeconds
 *   programado    → scheduledSeconds
 *   adherencia    → adherenceSeconds
 *   planificado   → scheduled
 *   asistencia    → attendanceStatus
 */

const XLSX = require('xlsx');
const path = require('path');

// ─── Agentes ──────────────────────────────────────────────────────────────────
const AGENTS = [
  // Inbound
  { user: 'ANA.RUIZ',      cedula: '1045678923', nombre: 'Ana Ruiz',       tipo: 'IN',  slaRate: 0.93, fcrRate: 0.91, transRate: 0.04, abanRate: 0.02, score: 4.8, qa: 97, utilRate: 0.88, adherRate: 0.97, shrinkRate: 0.08 },
  { user: 'SARA.GIL',      cedula: '1056789012', nombre: 'Sara Gil',        tipo: 'IN',  slaRate: 0.91, fcrRate: 0.87, transRate: 0.06, abanRate: 0.03, score: 4.6, qa: 94, utilRate: 0.87, adherRate: 0.96, shrinkRate: 0.09 },
  { user: 'NICO.PAZ',      cedula: '1034567890', nombre: 'Nicolas Paz',     tipo: 'IN',  slaRate: 0.88, fcrRate: 0.83, transRate: 0.08, abanRate: 0.04, score: 4.4, qa: 91, utilRate: 0.85, adherRate: 0.95, shrinkRate: 0.11 },
  { user: 'LUIS.MORA',     cedula: '1023456789', nombre: 'Luis Mora',       tipo: 'IN',  slaRate: 0.84, fcrRate: 0.79, transRate: 0.10, abanRate: 0.05, score: 4.2, qa: 87, utilRate: 0.83, adherRate: 0.93, shrinkRate: 0.13 },
  { user: 'MIA.CANO',      cedula: '1067890123', nombre: 'Mia Cano',        tipo: 'IN',  slaRate: 0.78, fcrRate: 0.72, transRate: 0.14, abanRate: 0.07, score: 4.0, qa: 84, utilRate: 0.80, adherRate: 0.91, shrinkRate: 0.16 },
  { user: 'PEDRO.ALBA',    cedula: '1012345678', nombre: 'Pedro Alba',      tipo: 'IN',  slaRate: 0.63, fcrRate: 0.58, transRate: 0.22, abanRate: 0.14, score: 3.4, qa: 71, utilRate: 0.72, adherRate: 0.85, shrinkRate: 0.26 },
  { user: 'CAMILA.DIAZ',   cedula: '1089012345', nombre: 'Camila Diaz',     tipo: 'IN',  slaRate: 0.89, fcrRate: 0.84, transRate: 0.07, abanRate: 0.04, score: 4.5, qa: 93, utilRate: 0.86, adherRate: 0.95, shrinkRate: 0.10 },
  { user: 'JORGE.LEON',    cedula: '1078901234', nombre: 'Jorge Leon',      tipo: 'IN',  slaRate: 0.82, fcrRate: 0.77, transRate: 0.12, abanRate: 0.06, score: 4.1, qa: 85, utilRate: 0.81, adherRate: 0.92, shrinkRate: 0.15 },
  { user: 'PAOLA.VEGA',    cedula: '1095678901', nombre: 'Paola Vega',      tipo: 'IN',  slaRate: 0.86, fcrRate: 0.80, transRate: 0.09, abanRate: 0.05, score: 4.3, qa: 89, utilRate: 0.84, adherRate: 0.94, shrinkRate: 0.12 },
  // Outbound
  { user: 'DIANA.RIOS',    cedula: '1090123456', nombre: 'Diana Rios',      tipo: 'OUT', slaRate: 0.72, fcrRate: 0.68, transRate: 0.05, abanRate: 0.02, score: 4.3, qa: 90, utilRate: 0.82, adherRate: 0.94, shrinkRate: 0.12 },
  { user: 'CARLOS.PENA',   cedula: '1001234567', nombre: 'Carlos Pena',     tipo: 'OUT', slaRate: 0.68, fcrRate: 0.62, transRate: 0.06, abanRate: 0.03, score: 4.0, qa: 86, utilRate: 0.79, adherRate: 0.91, shrinkRate: 0.14 },
  { user: 'MARIA.VARGAS',  cedula: '1101234567', nombre: 'Maria Vargas',    tipo: 'OUT', slaRate: 0.81, fcrRate: 0.75, transRate: 0.04, abanRate: 0.02, score: 4.5, qa: 95, utilRate: 0.85, adherRate: 0.96, shrinkRate: 0.09 },
  { user: 'JULIAN.GOMEZ',  cedula: '1110234567', nombre: 'Julian Gomez',    tipo: 'OUT', slaRate: 0.55, fcrRate: 0.50, transRate: 0.08, abanRate: 0.04, score: 3.6, qa: 75, utilRate: 0.73, adherRate: 0.86, shrinkRate: 0.22 },
  { user: 'LUISA.TORRES',  cedula: '1120234567', nombre: 'Luisa Torres',    tipo: 'OUT', slaRate: 0.76, fcrRate: 0.70, transRate: 0.05, abanRate: 0.02, score: 4.2, qa: 89, utilRate: 0.80, adherRate: 0.93, shrinkRate: 0.13 },
  { user: 'ANDRES.SILVA',  cedula: '1130234567', nombre: 'Andres Silva',    tipo: 'OUT', slaRate: 0.65, fcrRate: 0.60, transRate: 0.07, abanRate: 0.03, score: 3.9, qa: 82, utilRate: 0.77, adherRate: 0.90, shrinkRate: 0.16 },
  { user: 'VALERIA.CRUZ',  cedula: '1140234567', nombre: 'Valeria Cruz',    tipo: 'OUT', slaRate: 0.85, fcrRate: 0.79, transRate: 0.04, abanRate: 0.02, score: 4.6, qa: 96, utilRate: 0.87, adherRate: 0.97, shrinkRate: 0.08 },
];

// ─── Campañas ─────────────────────────────────────────────────────────────────
// _IN → inbound (parser detecta por sufijo), _OUT → outbound
const INBOUND_CAMPAIGNS  = ['SOPORTE_IN', 'RETENCION_IN', 'BILLING_IN'];
const OUTBOUND_CAMPAIGNS = ['VENTAS_OUT', 'COBRANZA_OUT', 'ENCUESTAS_OUT'];

// ─── Días laborales Abr-Jun 2026 ─────────────────────────────────────────────
function getWorkdays(from, to) {
  const days = [];
  const d = new Date(from);
  const end = new Date(to);
  while (d <= end) {
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return days;
}
const WORKDAYS = getWorkdays('2026-04-01', '2026-06-13');

// ─── Utilidades ───────────────────────────────────────────────────────────────
let seq = 1000000;
function uid() {
  const ts = 1743465600 + Math.floor(Math.random() * 5000000);
  return `${ts}.${seq++}`;
}

function rnd(a, b)      { return a + Math.random() * (b - a); }
function irnd(a, b)     { return Math.round(rnd(a, b)); }
function chance(p)       { return Math.random() < Math.min(1, Math.max(0, p)); }
function pick(arr)       { return arr[Math.floor(Math.random() * arr.length)]; }
function vary(v, spread) { return Math.min(1, Math.max(0, v + (Math.random() - 0.5) * 2 * spread)); }

// Hora aleatoria con peso en horario laboral (8:00-18:00)
const HOUR_W = [0,0,0,0,0,0,0,0, 3,5,8,9, 7,6,8,9, 7,5,3,1, 0,0,0,0];
function pickCalltime(date) {
  const total = HOUR_W.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let h = 0; h < 24; h++) {
    r -= HOUR_W[h];
    if (r <= 0) {
      const mm = String(irnd(0, 59)).padStart(2, '0');
      const ss = String(irnd(0, 59)).padStart(2, '0');
      return `${date} ${String(h).padStart(2, '0')}:${mm}:${ss}`;
    }
  }
  return `${date} 10:00:00`;
}

// Status Vicidial según tipo de campaña
function pickStatus(isInbound, sla, fcr, trans, aban) {
  const r = Math.random();
  if (isInbound) {
    // Inbound: AB, CLOSER, A, DC, DROP
    const abProb     = aban;
    const closerProb = trans * 0.5;
    const aProb      = (1 - abProb - closerProb) * fcr;
    const dcProb     = (1 - abProb - closerProb) * (1 - fcr) * 0.55;
    if (r < abProb)                               return 'AB';
    if (r < abProb + closerProb)                  return 'CLOSER';
    if (r < abProb + closerProb + aProb)          return 'A';
    if (r < abProb + closerProb + aProb + dcProb) return 'DC';
    return 'DROP';
  } else {
    // Outbound: NA, SALE, A, DC, DNC, DROP
    const naProb   = 0.38;
    const saleProb = fcr * 0.28;
    const aProb    = sla * 0.35;
    const dcProb   = 0.08;
    const dncProb  = 0.04;
    if (r < naProb)                                    return 'NA';
    if (r < naProb + saleProb)                         return 'SALE';
    if (r < naProb + saleProb + aProb)                 return 'A';
    if (r < naProb + saleProb + aProb + dcProb)        return 'DC';
    if (r < naProb + saleProb + aProb + dcProb + dncProb) return 'DNC';
    return 'DROP';
  }
}

// ─── Generación de filas ──────────────────────────────────────────────────────
const rows = [];

for (const date of WORKDAYS) {
  for (const agent of AGENTS) {
    const isIN   = agent.tipo === 'IN';
    const mood   = rnd(0.85, 1.15);   // factor de rendimiento del día

    // Asistencia
    const absent = chance(0.04);
    const late   = !absent && chance(0.07);
    const asistencia  = absent ? 'Ausente' : late ? 'Tarde' : 'Presente';
    const planificado = !absent;

    if (absent) continue;   // sin llamadas ese día

    // WFM diario (en segundos)
    const scheduledSec  = 28800;
    const loginSec      = Math.round(scheduledSec * vary(0.93, 0.04));
    const utilToday     = vary(agent.utilRate * mood, 0.08);
    const dispoSec      = Math.round(loginSec * utilToday);          // productivo
    const pauseSec      = Math.round(scheduledSec * vary(agent.shrinkRate, 0.06));
    const waitSecDay    = Math.max(0, loginSec - dispoSec - pauseSec);
    const adherenciaSec = Math.round(scheduledSec * vary(agent.adherRate, 0.04));

    // Tasas del día
    const slaT   = vary(agent.slaRate * mood, 0.07);
    const fcrT   = vary(agent.fcrRate * mood, 0.07);
    const transT = vary(agent.transRate / mood, 0.05);
    const abanT  = vary(agent.abanRate, 0.04);

    // Cantidad de llamadas: inbound 5-12, outbound 18-35
    const nCalls = isIN ? irnd(5, 12) : irnd(18, 35);

    for (let c = 0; c < nCalls; c++) {
      const campaign = isIN ? pick(INBOUND_CAMPAIGNS) : pick(OUTBOUND_CAMPAIGNS);
      const status   = pickStatus(isIN, slaT, fcrT, transT, abanT);

      const isAbandoned = ['AB', 'DROP'].includes(status);
      const isNA        = status === 'NA';

      const lengthInSec = isNA        ? irnd(5, 30)
                        : isAbandoned ? irnd(5, 60)
                        : status === 'SALE' ? irnd(180, 720)
                        : irnd(80, 580);

      const queueSeconds = isAbandoned ? irnd(20, 180) : irnd(4, 45);

      const rawScore      = agent.score + (Math.random() - 0.5) * 3;
      const calificacion  = parseFloat(Math.min(5, Math.max(1, rawScore)).toFixed(1));
      const calidad       = irnd(
        Math.max(50, agent.qa - 15),
        Math.min(100, agent.qa + 15),
      );

      rows.push({
        uniqueid:      uid(),
        calldate:      pickCalltime(date),
        user:          agent.user,
        cedula:        agent.cedula,
        campaign_id:   campaign,
        status,
        length_in_sec: lengthInSec,
        queue_seconds: queueSeconds,
        calificacion,
        calidad,
        // WFM distribuido por llamada (suma del día = total del agente)
        login_sec:     Math.round(loginSec      / nCalls),
        dispo_sec:     Math.round(dispoSec      / nCalls),
        pause_sec:     Math.round(pauseSec      / nCalls),
        wait_sec:      Math.round(waitSecDay    / nCalls),
        programado:    Math.round(scheduledSec  / nCalls),
        adherencia:    Math.round(adherenciaSec / nCalls),
        planificado,
        asistencia,
      });
    }
  }
}

// Ordenar por fecha/hora
rows.sort((a, b) => a.calldate.localeCompare(b.calldate));

// ─── Hoja de llamadas (formato Vicidial) ─────────────────────────────────────
const ws = XLSX.utils.json_to_sheet(rows);
ws['!cols'] = [
  { wch: 22 }, // uniqueid
  { wch: 22 }, // calldate
  { wch: 16 }, // user
  { wch: 14 }, // cedula
  { wch: 16 }, // campaign_id
  { wch: 10 }, // status
  { wch: 14 }, // length_in_sec
  { wch: 14 }, // queue_seconds
  { wch: 13 }, // calificacion
  { wch: 9  }, // calidad
  { wch: 11 }, // login_sec
  { wch: 11 }, // dispo_sec
  { wch: 11 }, // pause_sec
  { wch: 11 }, // wait_sec
  { wch: 12 }, // programado
  { wch: 12 }, // adherencia
  { wch: 12 }, // planificado
  { wch: 12 }, // asistencia
];

// ─── Hoja de referencia de columnas ──────────────────────────────────────────
const guide = [
  { columna: 'uniqueid',      tipo: 'Texto',                          tabla_vicidial: 'vicidial_log.uniqueid',             descripcion: 'ID unico de la llamada (generado por Asterisk/Vicidial)' },
  { columna: 'calldate',      tipo: 'Fecha/hora YYYY-MM-DD HH:MM:SS', tabla_vicidial: 'vicidial_log.call_date',            descripcion: 'Fecha y hora de inicio de la llamada' },
  { columna: 'user',          tipo: 'Texto (login)',                   tabla_vicidial: 'vicidial_log.user',                 descripcion: 'Login del agente en Vicidial' },
  { columna: 'cedula',        tipo: 'Texto',                          tabla_vicidial: 'vicidial_users.cedula',             descripcion: 'Documento de identidad del agente' },
  { columna: 'campaign_id',   tipo: 'Texto',                          tabla_vicidial: 'vicidial_log.campaign_id',          descripcion: 'ID de campana. Termina en _IN = inbound, _OUT = outbound' },
  { columna: 'status',        tipo: 'Codigo Vicidial',                tabla_vicidial: 'vicidial_log.status',               descripcion: 'A=Contesto | AB=Abandono | SALE=Venta | CLOSER=Transfer | NA=Sin respuesta | DC=Colgo | DNC=No llamar | DROP=Caida' },
  { columna: 'length_in_sec', tipo: 'Numero (segundos)',              tabla_vicidial: 'vicidial_log.length_in_sec',        descripcion: 'Duracion total de la llamada en segundos' },
  { columna: 'queue_seconds', tipo: 'Numero (segundos)',              tabla_vicidial: 'vicidial_log.queue_seconds',        descripcion: 'Segundos que el cliente espero en cola antes de ser atendido' },
  { columna: 'calificacion',  tipo: 'Numero (1.0-5.0)',               tabla_vicidial: 'Campo personalizado',               descripcion: 'Satisfaccion del cliente (CSAT) al finalizar la llamada' },
  { columna: 'calidad',       tipo: 'Numero (0-100)',                  tabla_vicidial: 'Campo personalizado',               descripcion: 'Score de monitoreo QA interno (escucha de calidad)' },
  { columna: 'login_sec',     tipo: 'Numero (segundos)',              tabla_vicidial: 'vicidial_agent_log.login_sec',      descripcion: 'Segundos que el agente estuvo logueado en el sistema' },
  { columna: 'dispo_sec',     tipo: 'Numero (segundos)',              tabla_vicidial: 'vicidial_agent_log.dispo_sec',      descripcion: 'Segundos en disposicion (en llamada + wrap-up) = tiempo productivo' },
  { columna: 'pause_sec',     tipo: 'Numero (segundos)',              tabla_vicidial: 'vicidial_agent_log.pause_sec',      descripcion: 'Segundos en pausa (break, almuerzo, training) = shrinkage' },
  { columna: 'wait_sec',      tipo: 'Numero (segundos)',              tabla_vicidial: 'vicidial_agent_log.wait_sec',       descripcion: 'Segundos disponible/idle esperando llamadas' },
  { columna: 'programado',    tipo: 'Numero (segundos)',              tabla_vicidial: 'Campo personalizado',               descripcion: 'Segundos planificados del turno. 28800 = 8 horas' },
  { columna: 'adherencia',    tipo: 'Numero (segundos)',              tabla_vicidial: 'Campo personalizado',               descripcion: 'Segundos con adherencia al horario planificado' },
  { columna: 'planificado',   tipo: 'Booleano',                       tabla_vicidial: 'Campo personalizado',               descripcion: 'TRUE si el agente estaba en el rol del dia' },
  { columna: 'asistencia',    tipo: 'Texto',                          tabla_vicidial: 'Campo personalizado',               descripcion: 'Presente | Ausente | Tarde' },
];
const wsGuide = XLSX.utils.json_to_sheet(guide);
wsGuide['!cols'] = [{ wch: 16 }, { wch: 30 }, { wch: 38 }, { wch: 70 }];

// ─── Hoja de agentes (referencia) ────────────────────────────────────────────
const agentRef = AGENTS.map(a => ({
  login:    a.user,
  cedula:   a.cedula,
  nombre:   a.nombre,
  tipo:     a.tipo === 'IN' ? 'Inbound' : 'Outbound',
}));
const wsAgents = XLSX.utils.json_to_sheet(agentRef);
wsAgents['!cols'] = [{ wch: 18 }, { wch: 14 }, { wch: 20 }, { wch: 12 }];

// ─── Generar workbook ─────────────────────────────────────────────────────────
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws,       'vicidial_log');
XLSX.utils.book_append_sheet(wb, wsGuide,  'Referencia columnas');
XLSX.utils.book_append_sheet(wb, wsAgents, 'Agentes');

const outputRoot   = path.join(__dirname, 'sample-data.xlsx');
const outputPublic = path.join(__dirname, 'frontend', 'public', 'plantilla-queplus.xlsx');

XLSX.writeFile(wb, outputRoot);
XLSX.writeFile(wb, outputPublic);

// ─── Reporte de sanidad ───────────────────────────────────────────────────────
const totalRows = rows.length;
const answered  = ['A', 'SALE', 'CLOSER', 'DC', 'DNC'];
const fcr       = ['A', 'SALE', 'DC'];
const aban      = ['AB', 'DROP'];

console.log('\nAgente               | Tipo | Llamadas | SLA  | FCR  | Aban  | Avg Score');
console.log('─'.repeat(72));
for (const a of AGENTS) {
  const ar   = rows.filter(r => r.user === a.user);
  const n    = ar.length;
  if (n === 0) { console.log(`  ${a.nombre.padEnd(18)} | ${a.tipo}  |      n/a`); continue; }
  const sla  = ar.filter(r => answered.includes(r.status)).length;
  const fcrN = ar.filter(r => fcr.includes(r.status)).length;
  const abN  = ar.filter(r => aban.includes(r.status)).length;
  const avg  = (ar.reduce((s, r) => s + r.calificacion, 0) / n).toFixed(2);
  console.log(
    `  ${a.nombre.padEnd(18)} | ${a.tipo}  | ${String(n).padStart(8)} ` +
    `| ${(sla/n*100).toFixed(0).padStart(3)}% ` +
    `| ${(fcrN/n*100).toFixed(0).padStart(3)}% ` +
    `| ${(abN/n*100).toFixed(0).padStart(4)}% ` +
    `| ${avg}`
  );
}
console.log(`\n  Total llamadas: ${totalRows}`);
console.log(`  Dias laborales: ${WORKDAYS.length}  (2026-04-01 → 2026-06-13)`);
console.log(`  Agentes: ${AGENTS.length}  (${AGENTS.filter(a=>a.tipo==='IN').length} inbound, ${AGENTS.filter(a=>a.tipo==='OUT').length} outbound)`);
console.log(`  Campanas: ${INBOUND_CAMPAIGNS.concat(OUTBOUND_CAMPAIGNS).join(', ')}`);
console.log(`\n  Archivo: ${outputRoot}`);
console.log(`  Plantilla publica: ${outputPublic}`);
