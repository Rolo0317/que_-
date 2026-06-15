import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Props {
  onClose: () => void;
}

const MATCHES = [
  { date: '17 JUN', flag: '🇺🇿', rival: 'Uzbekistán', time: '9:00 pm',  city: 'Ciudad de México' },
  { date: '23 JUN', flag: '🇨🇩', rival: 'R.D. Congo',  time: '9:00 pm',  city: 'Guadalajara' },
  { date: '27 JUN', flag: '🇵🇹', rival: 'Portugal',    time: '6:30 pm',  city: 'Miami' },
];

export function WorldCupSplash({ onClose }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timer.current = setTimeout(onClose, 3500);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.4 } }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/90 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Splash Mundial 2026"
    >
      <motion.div
        initial={{ scale: 0.88, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative mx-4 w-full max-w-sm overflow-hidden rounded-2xl bg-[#001f3f] text-white shadow-2xl"
      >
        {/* Barra de colores Colombia */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ transformOrigin: 'left' }}
          className="flex h-2"
        >
          <div className="flex-[2] bg-[#FCD116]" />
          <div className="flex-1 bg-[#003087]" />
          <div className="flex-1 bg-[#CE1126]" />
        </motion.div>

        <div className="p-6">
          {/* Encabezado */}
          <div className="flex items-center gap-3">
            <motion.span
              initial={{ y: -80, rotate: 0 }}
              animate={{ y: 0, rotate: 720 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              className="text-4xl"
              aria-hidden="true"
            >
              ⚽
            </motion.span>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FCD116]">Mundial 2026</p>
              <p className="text-lg font-black leading-tight">🇨🇴 Colombia · Grupo K</p>
            </div>
          </div>

          {/* Partidos */}
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.15, delayChildren: 0.7 } } }}
            className="mt-5 space-y-2"
          >
            {MATCHES.map((m) => (
              <motion.li
                key={m.date}
                variants={{ hidden: { opacity: 0, x: -16 }, visible: { opacity: 1, x: 0 } }}
                className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2 text-sm"
              >
                <span className="w-12 text-[10px] font-bold text-[#FCD116] tabular-nums">{m.date}</span>
                <span aria-label="Colombia">🇨🇴</span>
                <span className="text-white/40 text-xs">vs</span>
                <span aria-label={m.rival}>{m.flag}</span>
                <span className="flex-1 text-xs text-white/70">{m.rival}</span>
                <span className="text-[10px] tabular-nums text-white/50">{m.time}</span>
              </motion.li>
            ))}
          </motion.ul>

          {/* Eslogan */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
            className="mt-4 text-center text-sm font-bold text-[#FCD116]"
          >
            ¡Arriba la Tricolor!
          </motion.p>

          {/* CTA */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
            type="button"
            onClick={onClose}
            className="mt-4 w-full rounded-lg bg-que-teal py-2.5 text-sm font-bold text-white transition hover:bg-que-teal-dark active:scale-95"
          >
            Ir al dashboard →
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
