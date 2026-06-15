import type { CallRecord } from '../types/calls';

// ─── Dataset Vicidial simulado · 125 agentes · ABR–JUN 2026 · ~6 200 registros ─
//
// Mapeo Vicidial → CallRecord:
//   vicidial_log.uniqueid        → id  (VID-XXXXXX)
//   vicidial_log.user            → agent  (login Vicidial)
//   vicidial_log.campaign_id     → queue
//   vicidial_log.call_date       → date + hour
//   vicidial_log.length_in_sec   → durationSeconds
//   vicidial_log.queue_seconds   → waitSeconds
//   vicidial_log.status (A/AB/CLOSER/SALE/NI/N/B) → abandoned/answeredWithinSla/transferred
//   vicidial_agent_log.talk_sec + dispo_sec → parte de productiveSeconds
//   vicidial_agent_log.pause_sec (BREAK/LUNCH/TRAIN/MEET) → shrinkageSeconds
//   vicidial_agent_log.login_sec → loginSeconds
//   vicidial_agent_log.wait_sec  → availableSeconds

// ─── 125 Agentes (user Vicidial · cédula colombiana) ────────────────────────
const AGENTS = [
  // ── Equipo SOPORTE_IN (30 agentes) ────────────────────────────────────────
  { login: 'jrodriguez',   doc: '1020456789' },
  { login: 'mlopez',       doc: '1023567890' },
  { login: 'cgarcia',      doc: '1015678901' },
  { login: 'amoreno',      doc: '1018789012' },
  { login: 'dperez',       doc: '1022890123' },
  { login: 'lmartinez',    doc: '1019901234' },
  { login: 'fgomez',       doc: '1021012345' },
  { login: 'pherrera',     doc: '1024123456' },
  { login: 'sjimenez',     doc: '1016234567' },
  { login: 'vtorres',      doc: '1017345678' },
  { login: 'jvargas',      doc: '1025456789' },
  { login: 'mcastro',      doc: '1026567890' },
  { login: 'cortiz',       doc: '1027678901' },
  { login: 'aramos',       doc: '1028789012' },
  { login: 'dmendoza',     doc: '1029890123' },
  { login: 'lcruz',        doc: '1030901234' },
  { login: 'freyes',       doc: '1031012345' },
  { login: 'psuarez',      doc: '1032123456' },
  { login: 'aflores',      doc: '1033234567' },
  { login: 'mguerrero',    doc: '1034345678' },
  { login: 'jruiz',        doc: '1035456789' },
  { login: 'drojas',       doc: '1036567890' },
  { login: 'rdiaz',        doc: '1037678901' },
  { login: 'jmolina',      doc: '1038789012' },
  { login: 'kchavez',      doc: '1039890123' },
  { login: 'oramirez',     doc: '1040901234' },
  { login: 'nsilva',       doc: '1041012345' },
  { login: 'emedina',      doc: '1042123456' },
  { login: 'csalazar',     doc: '1043234567' },
  { login: 'jaguilar',     doc: '1044345678' },
  // ── Equipo VENTAS_IN / VENTAS_OUT (40 agentes) ────────────────────────────
  { login: 'spena',        doc: '1045456789' },
  { login: 'vmunoz',       doc: '1046567890' },
  { login: 'farias',       doc: '1047678901' },
  { login: 'kpinto',       doc: '1048789012' },
  { login: 'jacosta',      doc: '1049890123' },
  { login: 'gbernal',      doc: '1050901234' },
  { login: 'acardona',     doc: '1051012345' },
  { login: 'mvega',        doc: '1052123456' },
  { login: 'csanchez',     doc: '1053234567' },
  { login: 'darroyo',      doc: '1054345678' },
  { login: 'jospina',      doc: '1055456789' },
  { login: 'mquintero',    doc: '1056567890' },
  { login: 'lpalomino',    doc: '1057678901' },
  { login: 'hlozano',      doc: '1058789012' },
  { login: 'mpatino',      doc: '1059890123' },
  { login: 'rnieto',       doc: '1060901234' },
  { login: 'abonilla',     doc: '1061012345' },
  { login: 'ymarin',       doc: '1062123456' },
  { login: 'pcastano',     doc: '1063234567' },
  { login: 'lvergara',     doc: '1064345678' },
  { login: 'jleon',        doc: '1065456789' },
  { login: 'csoto',        doc: '1066567890' },
  { login: 'afuentes',     doc: '1067678901' },
  { login: 'erestrepo',    doc: '1068789012' },
  { login: 'mbotero',      doc: '1069890123' },
  { login: 'jvalencia',    doc: '1070901234' },
  { login: 'cgiraldo',     doc: '1071012345' },
  { login: 'macevedo',     doc: '1072123456' },
  { login: 'hzapata',      doc: '1073234567' },
  { login: 'jcamacho',     doc: '1074345678' },
  { login: 'moviedo',      doc: '1075456789' },
  { login: 'lcaballero',   doc: '1076567890' },
  { login: 'drobles',      doc: '1077678901' },
  { login: 'fhenriquez',   doc: '1078789012' },
  { login: 'amillan',      doc: '1079890123' },
  { login: 'jmendez',      doc: '1080901234' },
  { login: 'rguerrero',    doc: '1081012345' },
  { login: 'djara',        doc: '1082123456' },
  { login: 'npaez',        doc: '1083234567' },
  { login: 'ivelez',       doc: '1084345678' },
  // ── Equipo COBROS_IN / COBROS_OUT (30 agentes) ────────────────────────────
  { login: 'jcontreras',   doc: '1085456789' },
  { login: 'acontreras',   doc: '1086567890' },
  { login: 'pcorrea',      doc: '1087678901' },
  { login: 'gcarrillo',    doc: '1088789012' },
  { login: 'lceballos',    doc: '1089890123' },
  { login: 'rcaicedo',     doc: '1090901234' },
  { login: 'fcabrera',     doc: '1091012345' },
  { login: 'acamargo',     doc: '1092123456' },
  { login: 'zcardenas',    doc: '1093234567' },
  { login: 'lcarrero',     doc: '1094345678' },
  { login: 'mcelis',       doc: '1095456789' },
  { login: 'jcerda',       doc: '1096567890' },
  { login: 'dcifuentes',   doc: '1097678901' },
  { login: 'acobos',       doc: '1098789012' },
  { login: 'gcordoba',     doc: '1099890123' },
  { login: 'hcortez',      doc: '1100901234' },
  { login: 'jcrespillo',   doc: '1101012345' },
  { login: 'ldaza',        doc: '1102123456' },
  { login: 'jdelgado',     doc: '1103234567' },
  { login: 'mdelgado',     doc: '1104345678' },
  { login: 'adurango',     doc: '1105456789' },
  { login: 'lespinoza',    doc: '1106567890' },
  { login: 'gesterling',   doc: '1107678901' },
  { login: 'nfajardo',     doc: '1108789012' },
  { login: 'jfernandez',   doc: '1109890123' },
  { login: 'gferrer',      doc: '1110901234' },
  { login: 'efigueroa',    doc: '1111012345' },
  { login: 'mflorez',      doc: '1112123456' },
  { login: 'jfranco',      doc: '1113234567' },
  { login: 'afguerrero',   doc: '1114345678' },
  // ── Equipo QA / CALIDAD / ENCUESTAS (25 agentes) ─────────────────────────
  { login: 'agomez',       doc: '1115456789' },
  { login: 'lgomez',       doc: '1116567890' },
  { login: 'mgomez',       doc: '1117678901' },
  { login: 'pgomez',       doc: '1118789012' },
  { login: 'sgomez',       doc: '1119890123' },
  { login: 'vgonzalez',    doc: '1120901234' },
  { login: 'rgonzalez',    doc: '1121012345' },
  { login: 'pgonzalez',    doc: '1122123456' },
  { login: 'ngonzalez',    doc: '1123234567' },
  { login: 'jguerra',      doc: '1124345678' },
  { login: 'mguerra',      doc: '1125456789' },
  { login: 'aguerra',      doc: '1126567890' },
  { login: 'lguerrero',    doc: '1127678901' },
  { login: 'mguevara',     doc: '1128789012' },
  { login: 'iguevara',     doc: '1129890123' },
  { login: 'jgutierrez',   doc: '1130901234' },
  { login: 'mgutierrez',   doc: '1131012345' },
  { login: 'agutierrez',   doc: '1132123456' },
  { login: 'mhernandez',   doc: '1133234567' },
  { login: 'ahernandez',   doc: '1134345678' },
  { login: 'jhernandez',   doc: '1135456789' },
  { login: 'nhidalgo',     doc: '1136567890' },
  { login: 'lhidalgo',     doc: '1137678901' },
  { login: 'dholguin',     doc: '1138789012' },
  { login: 'nholguin',     doc: '1139890123' },
] as const;

// ─── Campañas Vicidial (campaign_id) ─────────────────────────────────────────
const CAMPAIGNS = [
  { id: 'SOPORTE_IN',    type: 'Inbound'  as const, slaTarget: 20 },
  { id: 'VENTAS_IN',     type: 'Inbound'  as const, slaTarget: 25 },
  { id: 'COBROS_IN',     type: 'Inbound'  as const, slaTarget: 30 },
  { id: 'VENTAS_OUT',    type: 'Outbound' as const, slaTarget: 0  },
  { id: 'COBROS_OUT',    type: 'Outbound' as const, slaTarget: 0  },
  { id: 'ENCUESTAS_OUT', type: 'Outbound' as const, slaTarget: 0  },
];

// ─── Días hábiles ABR 1 – JUN 14, 2026 (lun–sáb) ────────────────────────────
function workDays(from: string, to: string): string[] {
  const days: string[] = [];
  const cur = new Date(from + 'T12:00:00Z');
  const end = new Date(to + 'T12:00:00Z');
  while (cur <= end) {
    if (cur.getUTCDay() !== 0) days.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return days;
}
const DAYS = workDays('2026-04-01', '2026-06-14');

// Franjas horarias de operación
const HOURS   = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];
// Pesos por hora: picos 09-11 y 14-16, almuerzo bajo en 12-13, cierre suave
const WEIGHTS = [  0.40,   0.70,   1.00,   1.00,   0.90,   0.52,   0.60,   1.00,   0.95,   0.75,   0.55,   0.35];

// ─── RNG determinístico (sin Math.random → datos reproducibles) ───────────────
let _s = 0;
const rn  = () => { const x = Math.sin(++_s * 9301 + 49297) * 233280; return x - Math.floor(x); };
const pick = <T>(a: readonly T[]) => a[Math.floor(rn() * a.length)];
const btw  = (lo: number, hi: number) => Math.round(lo + rn() * (hi - lo));

// ─── Generación de llamadas ───────────────────────────────────────────────────
const _calls: CallRecord[] = [];
let _uid = 1;

for (const date of DAYS) {
  for (let hi = 0; hi < HOURS.length; hi++) {
    const hour   = HOURS[hi];
    const weight = WEIGHTS[hi];
    // ~8 llamadas por hora en promedio ponderado → ~80 llamadas/día → ~6 200 total
    const n = Math.max(1, Math.round((4 + rn() * 6) * weight));

    for (let c = 0; c < n; c++) {
      const agent    = pick(AGENTS);
      const campaign = pick(CAMPAIGNS);

      // ── Vicidial status logic ──────────────────────────────────────────────
      // Inbound:  ~6.2% abandonadas (AB), resto A / CLOSER / DC
      // Outbound: N (no answer) / B (busy) / SALE / NI / A — nunca AB
      const abandoned = campaign.type === 'Inbound' && rn() < 0.062;

      // queue_seconds: tiempo en cola antes de atención (Vicidial: queue_seconds)
      const waitSeconds = abandoned ? btw(22, 210) : btw(3, 95);

      // SLA: meta < slaTarget seg → status A dentro de tiempo
      const slaOk = campaign.slaTarget > 0
        ? !abandoned && (waitSeconds <= campaign.slaTarget ? rn() < 0.94 : rn() < 0.22)
        : rn() < 0.58; // outbound SLA conceptual

      // length_in_sec: duración (Vicidial: length_in_sec)
      const durationSeconds = abandoned
        ? btw(10, 80)
        : campaign.type === 'Inbound'
          ? btw(75, 560)
          : btw(25, 440);

      // CLOSER / transfer: ~12%
      const transferred = !abandoned && rn() < 0.12;

      // FCR: ~74% cuando no abandonada ni transferida
      const resolvedFirstContact = !abandoned && !transferred && rn() < 0.74;

      // ── vicidial_agent_log ─────────────────────────────────────────────────
      const loginSeconds      = btw(24300, 34200); // 6.75–9.5 h
      const productiveSeconds = Math.round(loginSeconds * (0.58 + rn() * 0.24));
      const shrinkageSeconds  = Math.round(loginSeconds * (0.07 + rn() * 0.09));
      const scheduledSeconds  = 28800; // turno estándar 8h
      const adherenceSeconds  = Math.round(scheduledSeconds * (0.86 + rn() * 0.12));
      const availableSeconds  = btw(10, 100);

      // Asistencia
      const ar = rn();
      const attendanceStatus  = ar < 0.83 ? 'Presente' : ar < 0.93 ? 'Tarde' : 'Ausente';
      const staffed           = attendanceStatus !== 'Ausente';

      // CSAT (1-5) y QA score
      const rawScore = abandoned ? 1.2 + rn() * 1.4 : transferred ? 2.9 + rn() * 1.3 : 3.3 + rn() * 1.7;
      const score    = Math.round(Math.min(5, rawScore) * 10) / 10;
      const qaScore  = abandoned ? btw(42, 70) : transferred ? btw(60, 83) : btw(68, 100);

      _calls.push({
        id:                   `VID-${String(_uid++).padStart(6, '0')}`,
        date,
        type:                 campaign.type,
        agent:                agent.login,
        documento:            agent.doc,
        queue:                campaign.id,
        hour,
        durationSeconds,
        waitSeconds,
        abandoned,
        answeredWithinSla:    !abandoned && slaOk,
        resolvedFirstContact,
        transferred,
        score,
        qaScore,
        scheduledSeconds,
        loginSeconds,
        productiveSeconds,
        availableSeconds,
        shrinkageSeconds,
        adherenceSeconds,
        scheduled:            true,
        staffed,
        attendanceStatus,
      });
    }
  }
}

export const sampleCalls: CallRecord[] = _calls;
