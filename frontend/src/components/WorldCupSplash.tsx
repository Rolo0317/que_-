import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { BRAND } from '../lib/constants';

interface Props {
  onClose: () => void;
}

const MATCHES = [
  { date: '17 JUN', home: 'COL', away: 'UZB', rival: 'Uzbekistan',  time: '21:00' },
  { date: '23 JUN', home: 'COL', away: 'COD', rival: 'R.D. Congo',  time: '21:00' },
  { date: '27 JUN', home: 'COL', away: 'POR', rival: 'Portugal',    time: '18:30' },
];

// Colombia flag proportions: yellow 1/2, blue 1/4, red 1/4
function FlagBar() {
  return (
    <div className="flex h-1.5 w-full">
      <div className="flex-[2] bg-[#FCD116]" />
      <div className="flex-[1] bg-[#003087]" />
      <div className="flex-[1] bg-[#CE1126]" />
    </div>
  );
}

// Subtle abstract pitch decoration — low-opacity field arc
function PitchDecoration() {
  return (
    <svg
      viewBox="0 0 220 220"
      className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 opacity-[0.035]"
      aria-hidden="true"
    >
      <circle cx="110" cy="110" r="80"  fill="none" stroke="white" strokeWidth="1.5" />
      <circle cx="110" cy="110" r="50"  fill="none" stroke="white" strokeWidth="1" />
      <circle cx="110" cy="110" r="20"  fill="none" stroke="white" strokeWidth="1" />
      <circle cx="110" cy="110" r="4"   fill="white" />
      <line   x1="30"  y1="110" x2="190" y2="110" stroke="white" strokeWidth="1" />
      <line   x1="110" y1="30"  x2="110" y2="190" stroke="white" strokeWidth="1" />
    </svg>
  );
}

const CARD_BG = `radial-gradient(ellipse at 40% 0%, rgba(17,174,179,0.07) 0%, transparent 60%),
                 linear-gradient(160deg, #07181c 0%, #091e24 60%, #07181c 100%)`;

const AUTO_CLOSE_MS = 6000;

export function WorldCupSplash({ onClose }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timer.current = setTimeout(onClose, AUTO_CLOSE_MS);
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
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/85 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Colombia — FIFA World Cup 2026"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26, delay: 0.05 }}
        onClick={(e) => e.stopPropagation()}
        className="relative mx-4 w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: CARD_BG }}
      >
        {/* Colombia flag top bar */}
        <FlagBar />

        {/* Pitch graphic watermark */}
        <PitchDecoration />

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/40 transition hover:bg-white/20 hover:text-white"
        >
          <X size={14} />
        </button>

        {/* Header */}
        <div className="px-6 pt-5 pb-0">
          {/* Brand tag */}
          <div className="mb-5 flex items-center gap-2">
            <div className="h-px flex-1" style={{ background: BRAND.teal, opacity: 0.4 }} />
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">
              FIFA World Cup 2026
            </span>
            <div className="h-px flex-1" style={{ background: BRAND.teal, opacity: 0.4 }} />
          </div>

          {/* Hero text */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/35">
              Grupo K
            </p>
            <h2 className="mt-0.5 text-[2.8rem] font-black leading-none tracking-tighter text-white">
              Colombia
            </h2>
            <p className="mt-1 text-[11px] text-white/30">
              USA · Canada · México — Sede
            </p>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="mx-6 mt-5 mb-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/20">
            Fase de grupos
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Fixtures */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.09, delayChildren: 0.45 } } }}
          className="space-y-1.5 px-6"
        >
          {MATCHES.map((m) => (
            <motion.div
              key={m.date}
              variants={{ hidden: { opacity: 0, x: -14 }, visible: { opacity: 1, x: 0 } }}
              className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2.5"
            >
              <span
                className="w-12 shrink-0 text-[10px] font-bold tabular-nums"
                style={{ color: BRAND.orange }}
              >
                {m.date}
              </span>
              <div className="flex items-center gap-1.5 font-bold">
                <span className="text-xs" style={{ color: BRAND.teal }}>{m.home}</span>
                <span className="text-[10px] text-white/20">vs</span>
                <span className="text-xs text-white/70">{m.away}</span>
              </div>
              <span className="flex-1 truncate text-[11px] text-white/45">{m.rival}</span>
              <span className="shrink-0 text-[10px] tabular-nums text-white/25">{m.time}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <div className="px-6 pt-5 pb-5">
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg, ${BRAND.teal} 0%, #0891b2 100%)` }}
          >
            Ir al dashboard
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-2.5 text-center text-[10px] text-white/20"
          >
            Presiona Esc o haz clic fuera para cerrar
          </motion.p>
        </div>

        {/* Auto-close progress bar */}
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: AUTO_CLOSE_MS / 1000, ease: 'linear' }}
          style={{ transformOrigin: 'left', background: BRAND.teal }}
          className="h-0.5 w-full opacity-40"
        />
      </motion.div>
    </motion.div>
  );
}
