import { motion } from 'framer-motion';
import { BrandLogo } from './BrandLogo';
import { TrendingUp, Users, Zap } from 'lucide-react';

export function DashboardFooter() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const stats = [
    { icon: TrendingUp, label: 'WFM', desc: 'Planeación', value: '100%', color: 'text-plus-orange' },
    { icon: Zap, label: 'Performance', desc: 'Real-time', value: '24/7', color: 'text-que-teal' },
    { icon: Users, label: 'Agentes', desc: 'Productivos', value: '∞', color: 'text-violet' },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative mt-16 overflow-hidden rounded-2xl border border-que-teal/30 bg-gradient-to-br from-ink via-slate-900 to-slate-800 text-white shadow-2xl dark:from-slate-950 dark:via-slate-900 dark:to-slate-800"
    >
      {/* Fondo decorativo */}
      <div className="pointer-events-none absolute inset-0 opacity-5">
        <div className="absolute top-0 right-0 w-96 h-96 bg-plus-orange rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-que-teal rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 grid gap-8 p-8 md:grid-cols-[1.2fr_0.8fr] md:items-start">
        {/* Sección Left */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <BrandLogo className="w-40 brightness-110" />
          <p className="mt-5 max-w-2xl text-sm leading-7 text-white/80">
            Dashboard integral para operaciones de <strong>BPO</strong>. Consolidamos datos de 
            <strong className="text-que-teal"> WFM</strong>, <strong className="text-plus-orange">Performance</strong> y 
            <strong className="text-violet"> Experiencia</strong> en una sola vista para decisiones rápidas y estratégicas.
          </p>
          <motion.div
            className="mt-6 flex flex-wrap gap-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {['React', 'Tailwind', 'Node.js', 'Docker'].map((tech) => (
              <motion.span
                key={tech}
                variants={itemVariants}
                whileHover={{ scale: 1.1 }}
                className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-white/10 text-white/80 border border-white/10 hover:border-que-teal/50 transition-colors"
              >
                {tech}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {/* Sección Right - Stats */}
        <motion.div
          className="grid grid-cols-1 gap-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {stats.map(({ icon: Icon, label, desc, value, color }) => (
            <motion.div
              key={label}
              variants={itemVariants}
              whileHover={{ scale: 1.05, x: 4 }}
              className="group rounded-lg bg-white/5 p-4 border border-white/10 hover:border-que-teal/30 transition-all backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-colors">
                    <Icon size={16} className={color} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-white/70">{label}</p>
                    <p className="text-xs text-white/50">{desc}</p>
                  </div>
                </div>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Gradiente de separación */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="origin-left h-1 bg-gradient-to-r from-que-teal via-plus-orange via-violet to-que-teal"
      />

      {/* Footer secundario */}
      <motion.div
        className="relative z-10 px-8 py-4 border-t border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-white/60">
          <p>© 2026 QUE+ Dashboard. Todos los derechos reservados.</p>
          <motion.div
            className="flex gap-6"
            whileHover={{ gap: 8 }}
          >
            {['Documentación', 'GitHub', 'Soporte'].map((link) => (
              <motion.a
                key={link}
                href="#"
                whileHover={{ color: '#11AEB3' }}
                className="transition-colors hover:text-que-teal"
              >
                {link}
              </motion.a>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </motion.footer>
  );
}
