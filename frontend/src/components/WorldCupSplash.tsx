import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'framer-motion';
import { BRAND } from '../lib/constants';

interface Props {
  onClose: () => void;
}

const MATCHES = [
  { date: '17 JUN', home: 'COL', away: 'UZB', rival: 'Uzbekistan', time: '21:00' },
  { date: '23 JUN', home: 'COL', away: 'COD', rival: 'R.D. Congo', time: '21:00' },
  { date: '27 JUN', home: 'COL', away: 'POR', rival: 'Portugal',   time: '18:30' },
];

// ── 4 random scenes ───────────────────────────────────────────────────────────
const SCENES = ['roll', 'drop', 'curve', 'spin'] as const;
type Scene = typeof SCENES[number];

const ENTRY: Record<Scene, {
  initial: Record<string, number | string>;
  animate: Record<string, number | string>;
  transition: Record<string, unknown>;
}> = {
  // Ball rolls in from left, sliding along the ground
  roll: {
    initial: { x: -240, rotate: -600, opacity: 0 },
    animate: { x: 0,    rotate: 0,    opacity: 1 },
    transition: { type: 'spring', stiffness: 80, damping: 18, delay: 0.1 },
  },
  // Ball falls from above with bouncy spring
  drop: {
    initial: { y: -260, scale: 0.55, opacity: 0 },
    animate: { y: 0,    scale: 1,    opacity: 1 },
    transition: { type: 'spring', stiffness: 260, damping: 22, delay: 0.1 },
  },
  // Ball curves in from top-right (like a cross pass)
  curve: {
    initial: { x: 230, y: -90, rotate: 480, opacity: 0 },
    animate: { x: 0,   y: 0,   rotate: 0,   opacity: 1 },
    transition: { type: 'spring', stiffness: 120, damping: 20, delay: 0.08 },
  },
  // Ball materializes with a tightening spin
  spin: {
    initial: { scale: 0, rotate: -720, opacity: 0 },
    animate: { scale: 1, rotate: 0,    opacity: 1 },
    transition: { type: 'spring', stiffness: 230, damping: 18, delay: 0.15 },
  },
};

// ── Colombia flag bar ─────────────────────────────────────────────────────────
function FlagBar() {
  return (
    <div className="flex h-1.5 w-full">
      <div className="flex-[2] bg-[#FCD116]" />
      <div className="flex-[1] bg-[#003087]" />
      <div className="flex-[1] bg-[#CE1126]" />
    </div>
  );
}

// ── Realistic football SVG (pentagon pattern, radial gradient for 3D depth) ───
function FootballSVG() {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
      <defs>
        <clipPath id="ballClip">
          <circle cx="50" cy="50" r="47" />
        </clipPath>
        <radialGradient id="ballGrad" cx="33%" cy="26%" r="68%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="70%"  stopColor="#e6e6e6" />
          <stop offset="100%" stopColor="#b8b8b8" />
        </radialGradient>
        <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#FCD116" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#FCD116" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Base sphere */}
      <circle cx="50" cy="50" r="47" fill="url(#ballGrad)" />

      {/* Pentagon panels — classic football pattern */}
      {/* Center */}
      <polygon clipPath="url(#ballClip)" fill="#111"
        points="50,29 64,38 59,55 41,55 36,38" />
      {/* Top */}
      <polygon clipPath="url(#ballClip)" fill="#111"
        points="50,2 65,11 64,29 50,29 36,29 35,11" />
      {/* Top-right */}
      <polygon clipPath="url(#ballClip)" fill="#111"
        points="87,12 97,31 83,44 64,38 65,20" />
      {/* Bottom-right */}
      <polygon clipPath="url(#ballClip)" fill="#111"
        points="84,73 70,88 53,86 50,68 59,55 77,58" />
      {/* Bottom-left */}
      <polygon clipPath="url(#ballClip)" fill="#111"
        points="16,73 23,58 41,55 50,68 47,86 30,88" />
      {/* Top-left */}
      <polygon clipPath="url(#ballClip)" fill="#111"
        points="13,12 35,20 36,38 17,44 3,31" />

      {/* Colombia-colored shine overlay (subtle gold glow) */}
      <circle cx="50" cy="50" r="47" clipPath="url(#ballClip)" fill="url(#glowGrad)" />

      {/* Specular highlight — top-left white shine */}
      <ellipse cx="36" cy="32" rx="11" ry="7"
        fill="white" opacity="0.45"
        clipPath="url(#ballClip)" />

      {/* Ball seam outline */}
      <circle cx="50" cy="50" r="47" fill="none" stroke="#222" strokeWidth="2" />
    </svg>
  );
}

// ── Sparkle dots that float around the ball ───────────────────────────────────
const SPARKS = [
  { dx: -52, dy: -8,   size: 4,   delay: 0.0, color: '#FCD116' },
  { dx:  54, dy: -16,  size: 3,   delay: 0.4, color: '#11AEB3' },
  { dx:  14, dy: -58,  size: 5,   delay: 0.8, color: '#CE1126' },
  { dx: -18, dy:  52,  size: 3,   delay: 1.2, color: '#FCD116' },
  { dx:  44, dy:  42,  size: 4,   delay: 0.6, color: '#ffffff' },
  { dx: -46, dy:  26,  size: 3,   delay: 1.6, color: '#11AEB3' },
];

function Sparkles({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <>
      {SPARKS.map((s, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute left-1/2 top-1/2 rounded-full"
          style={{
            width: s.size,
            height: s.size,
            background: s.color,
            marginLeft: s.dx,
            marginTop: s.dy,
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale:   [0, 1.4, 0],
            y: [0, s.dy > 0 ? 6 : -6, 0],
          }}
          transition={{
            duration: 1.8,
            delay: s.delay + 0.4,
            repeat: Infinity,
            repeatDelay: 1.5 + i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
}

// ── Pitch watermark ───────────────────────────────────────────────────────────
function PitchDecoration() {
  return (
    <svg
      viewBox="0 0 220 220"
      className="pointer-events-none absolute -right-10 -top-8 h-52 w-52 opacity-[0.03]"
      aria-hidden="true"
    >
      <circle cx="110" cy="110" r="80"  fill="none" stroke="white" strokeWidth="1.5" />
      <circle cx="110" cy="110" r="50"  fill="none" stroke="white" strokeWidth="1" />
      <circle cx="110" cy="110" r="20"  fill="none" stroke="white" strokeWidth="1" />
      <circle cx="110" cy="110" r="4"   fill="white" />
      <line x1="30"  y1="110" x2="190" y2="110" stroke="white" strokeWidth="1" />
      <line x1="110" y1="30"  x2="110" y2="190" stroke="white" strokeWidth="1" />
    </svg>
  );
}

const CARD_BG = `radial-gradient(ellipse at 40% 0%, rgba(17,174,179,0.08) 0%, transparent 60%),
                 linear-gradient(160deg, #07181c 0%, #091e24 60%, #07181c 100%)`;

const AUTO_CLOSE_MS = 8000;

// ── Main component ────────────────────────────────────────────────────────────
export function WorldCupSplash({ onClose }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // Pick a random scene each time the splash mounts
  const [scene] = useState<Scene>(() => SCENES[Math.floor(Math.random() * SCENES.length)]);
  const [sparklesOn, setSparklesOn] = useState(false);

  useEffect(() => {
    timer.current = setTimeout(onClose, AUTO_CLOSE_MS);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // Turn on sparkles after the ball finishes its entry
    const sparkTimer = setTimeout(() => setSparklesOn(true), 900);
    return () => {
      clearTimeout(timer.current);
      clearTimeout(sparkTimer);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const entry = ENTRY[scene];

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
        initial={{ scale: 0.88, y: 24, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.05 }}
        onClick={(e) => e.stopPropagation()}
        className="relative mx-4 w-full max-w-sm overflow-hidden rounded-2xl shadow-2xl"
        style={{ background: CARD_BG }}
      >
        <FlagBar />
        <PitchDecoration />

        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/40 transition hover:bg-white/20 hover:text-white"
        >
          <X size={14} />
        </button>

        {/* ── 3D Football hero ── */}
        <div className="flex justify-center pt-6 pb-1">
          <div className="relative" style={{ perspective: '380px' }}>
            {/* Entry + position animation */}
            <motion.div
              initial={entry.initial}
              animate={entry.animate}
              transition={entry.transition as never}
              onAnimationComplete={() => setSparklesOn(true)}
              className="relative h-[88px] w-[88px]"
            >
              {/* Continuous 3D Y-axis spin */}
              <motion.div
                className="h-full w-full"
                animate={{ rotateY: [0, 360] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'linear', delay: 0.6 }}
              >
                <FootballSVG />
              </motion.div>

              {/* Ground shadow — pulses with the spin */}
              <motion.div
                className="absolute -bottom-3 left-1/2 h-2.5 w-16 -translate-x-1/2 rounded-full blur-sm"
                style={{ background: 'rgba(0,0,0,0.35)' }}
                animate={{ scaleX: [1, 0.6, 1], opacity: [0.35, 0.15, 0.35] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
              />
            </motion.div>

            {/* Floating sparkles */}
            <Sparkles visible={sparklesOn} />
          </div>
        </div>

        {/* Scene label — subtle indicator of which animation played */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center text-[9px] font-bold uppercase tracking-[0.2em] text-white/15 -mt-0.5 mb-1"
        >
          {scene === 'roll'  && 'Rodando'}
          {scene === 'drop'  && 'Cayendo'}
          {scene === 'curve' && 'Centro al area'}
          {scene === 'spin'  && 'Giro perfecto'}
        </motion.p>

        {/* Header */}
        <div className="px-6 pt-2 pb-0">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-px flex-1" style={{ background: BRAND.teal, opacity: 0.35 }} />
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-white/30">
              FIFA World Cup 2026
            </span>
            <div className="h-px flex-1" style={{ background: BRAND.teal, opacity: 0.35 }} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-white/35">
              Grupo K
            </p>
            <h2 className="mt-0.5 text-[2.6rem] font-black leading-none tracking-tighter text-white">
              Colombia
            </h2>
            <p className="mt-1 text-[11px] text-white/30">
              USA · Canada · Mexico — Sede
            </p>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="mx-6 mt-4 mb-2.5 flex items-center gap-3">
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
          variants={{ visible: { transition: { staggerChildren: 0.09, delayChildren: 0.5 } } }}
          className="space-y-1.5 px-6"
        >
          {MATCHES.map((m) => (
            <motion.div
              key={m.date}
              variants={{ hidden: { opacity: 0, x: -14 }, visible: { opacity: 1, x: 0 } }}
              className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2.5"
            >
              <span className="w-12 shrink-0 text-[10px] font-bold tabular-nums" style={{ color: BRAND.orange }}>
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
        <div className="px-6 pt-4 pb-5">
          <motion.button
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-3 text-sm font-bold text-white"
            style={{ background: `linear-gradient(135deg, ${BRAND.teal} 0%, #0891b2 100%)` }}
          >
            Ir al dashboard
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.15 }}
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
