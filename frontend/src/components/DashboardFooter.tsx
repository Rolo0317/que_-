import { motion } from 'framer-motion';
import { BrandLogo } from './BrandLogo';
import { CheckCircle2, PhoneCall, ShieldCheck, Users } from 'lucide-react';

interface DashboardFooterProps {
  totalCalls: number;
  agentCount: number;
  slaPercent: string;
}

export function DashboardFooter({ totalCalls, agentCount, slaPercent }: DashboardFooterProps) {
  const stats = [
    { Icon: PhoneCall,   label: 'Total de llamadas', value: totalCalls.toLocaleString('es'), color: 'text-que-teal' },
    { Icon: Users,       label: 'Agentes activos',   value: String(agentCount),              color: 'text-plus-orange' },
    { Icon: ShieldCheck, label: 'SLA actual',         value: slaPercent,                      color: 'text-violet' },
  ];

  const features = [
    'Datos en tiempo real desde Excel o API',
    'Módulos WFM, Operaciones y Calidad',
    'Exporta informes a PDF desde el constructor',
  ];

  return (
    <motion.footer
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative mt-16 overflow-hidden rounded-2xl border border-que-teal/30 bg-gradient-to-br from-ink via-slate-900 to-slate-800 text-white shadow-2xl dark:from-slate-950 dark:via-slate-900 dark:to-slate-800"
    >
      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06]">
        <div className="absolute -right-16 top-0 h-80 w-80 rounded-full bg-plus-orange blur-3xl" />
        <div className="absolute -bottom-16 -left-16 h-80 w-80 rounded-full bg-que-teal blur-3xl" />
      </div>

      <div className="relative z-10 grid gap-8 p-8 md:grid-cols-[1.3fr_0.7fr] md:items-center">
        {/* Left: branding + features */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BrandLogo className="w-36 brightness-110" />
          <p className="mt-4 max-w-md text-sm leading-6 text-white/70">
            Plataforma de analítica BPO que unifica{' '}
            <strong className="text-que-teal">WFM</strong>,{' '}
            <strong className="text-plus-orange">Operaciones</strong> y{' '}
            <strong className="text-violet">Calidad</strong> para decisiones rápidas y con respaldo de datos.
          </p>
          <ul className="mt-5 space-y-2">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-white/60">
                <CheckCircle2 size={13} className="flex-shrink-0 text-que-teal" />
                {f}
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Right: live stats */}
        <motion.div
          className="grid grid-cols-1 gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {stats.map(({ Icon, label, value, color }) => (
            <div
              key={label}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-white/10 p-2">
                  <Icon size={15} className={color} />
                </div>
                <p className="text-xs font-medium text-white/60">{label}</p>
              </div>
              <p className={`text-xl font-bold tabular-nums ${color}`}>{value}</p>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Gradient separator */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="h-[2px] origin-left bg-gradient-to-r from-que-teal via-plus-orange to-violet"
      />

      {/* Bottom bar */}
      <div className="relative z-10 flex flex-col gap-3 px-8 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-white/40">© 2026 QUE+ Dashboard. Todos los derechos reservados.</p>
        <div className="flex gap-5">
          {['Ayuda', 'GitHub', 'Soporte'].map((link) => (
            <a
              key={link}
              href="#"
              className="text-xs text-white/40 transition hover:text-que-teal"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </motion.footer>
  );
}
