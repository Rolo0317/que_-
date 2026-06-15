import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Props {
  onClose: () => void;
}

const MATCHES = [
  { date: '17 JUN', flag: '🇺🇿', rival: 'Uzbekistán', time: '9:00 pm' },
  { date: '23 JUN', flag: '🇨🇩', rival: 'R.D. Congo',  time: '9:00 pm' },
  { date: '27 JUN', flag: '🇵🇹', rival: 'Portugal',    time: '6:30 pm' },
];

const T = '#11AEB3';
const O = '#FF9700';
const S = '#F5C79A'; // skin
const INK = '#07181c';

// ─── Animated SVG Player ──────────────────────────────────────────────────────
function PlayerScene() {
  return (
    <div className="relative h-52 w-full select-none overflow-hidden">
      {/* Field arc decoration */}
      <div className="absolute bottom-0 left-1/2 h-20 w-36 -translate-x-1/2 rounded-t-full border border-[#11AEB3] opacity-10" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-[#11AEB3] opacity-15" />

      {/* === Player SVG === */}
      <svg viewBox="0 0 300 210" className="absolute inset-0 h-full w-full" aria-hidden="true">

        {/* Ground shadow */}
        <motion.ellipse cx="120" cy="198" rx="35" ry="7"
          fill={T} fillOpacity="0.15"
          animate={{ rx: [35, 26, 35], fillOpacity: [0.15, 0.08, 0.15] }}
          transition={{ delay: 0.78, duration: 0.4 }}
        />

        {/* === Planted left leg (static) === */}
        <line x1="104" y1="136" x2="92" y2="184" stroke={S} strokeWidth="12" strokeLinecap="round" />
        {/* Left foot */}
        <ellipse cx="86" cy="190" rx="19" ry="7" fill="#1e293b" />
        <ellipse cx="84" cy="188" rx="13" ry="5" fill="#334155" />

        {/* === Kicking right leg — pivot at hip (128, 136) === */}
        <g transform="translate(128,136)">
          <motion.g
            initial={{ rotate: -28 }}
            animate={{ rotate: 56 }}
            transition={{ delay: 0.74, duration: 0.36, ease: [0.15, 0, 0.45, 1.25] }}
          >
            <line x1="0" y1="0" x2="20" y2="46" stroke={S} strokeWidth="12" strokeLinecap="round" />
            {/* Orange kicking shoe */}
            <ellipse cx="26" cy="52" rx="21" ry="8" fill={O} />
            <ellipse cx="30" cy="50" rx="13" ry="5.5" fill="#d97706" />
          </motion.g>
        </g>

        {/* === Jersey (teal) === */}
        <rect x="88" y="74" width="64" height="64" rx="14" fill={T} />
        {/* Jersey side stripe */}
        <rect x="88" y="74" width="20" height="64" rx={0} fill="#0891b2" />
        <rect x="88" y="74" width="20" height="64" rx="14 0 0 14" fill="#0891b2" clipPath="url(#bodyClip)" />
        <clipPath id="bodyClip"><rect x="88" y="74" width="64" height="64" rx="14" /></clipPath>
        {/* Jersey number */}
        <text x="122" y="114" textAnchor="middle" fill="white" fontSize="20" fontWeight="900"
          fontFamily="Arial,sans-serif" opacity="0.95">10</text>
        {/* QUE+ brand on shirt */}
        <text x="122" y="132" textAnchor="middle" fill="white" fontSize="7.5" fontWeight="700"
          fontFamily="Arial,sans-serif" opacity="0.55" letterSpacing="1.5">QUE+</text>

        {/* Shorts */}
        <rect x="89" y="132" width="62" height="18" rx="8" fill="#0c4a6e" />

        {/* === Left arm — counter-swing (pivot 88, 92) === */}
        <g transform="translate(88,92)">
          <motion.g
            animate={{ rotate: [0, -22, -2] }}
            transition={{ delay: 0.70, duration: 0.42 }}
          >
            <line x1="0" y1="0" x2="-30" y2="30" stroke={T} strokeWidth="13" strokeLinecap="round" />
            <circle cx="-33" cy="33" r="9" fill={S} />
          </motion.g>
        </g>

        {/* === Right arm — forward swing (pivot 152, 90) === */}
        <g transform="translate(152,90)">
          <motion.g
            animate={{ rotate: [0, 26, 4] }}
            transition={{ delay: 0.70, duration: 0.42 }}
          >
            <line x1="0" y1="0" x2="30" y2="26" stroke={T} strokeWidth="13" strokeLinecap="round" />
            <circle cx="33" cy="29" r="9" fill={S} />
          </motion.g>
        </g>

        {/* === Head === */}
        <circle cx="120" cy="50" r="26" fill={S} />
        {/* Hair */}
        <path d="M94 45 Q120 20 146 45 Q136 28 120 26 Q104 28 94 45Z" fill="#1e1b30" />
        {/* Eyes */}
        <circle cx="111" cy="52" r="3.8" fill="#1e293b" />
        <circle cx="129" cy="52" r="3.8" fill="#1e293b" />
        {/* Excited open smile */}
        <path d="M108 64 Q120 76 132 64" stroke="#c27048" strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Cheeks */}
        <circle cx="105" cy="62" r="5" fill="#f87171" fillOpacity="0.3" />
        <circle cx="135" cy="62" r="5" fill="#f87171" fillOpacity="0.3" />
      </svg>

      {/* === Ball — absolute div for smooth arc === */}
      <motion.div
        className="absolute"
        style={{ bottom: 18, left: 'calc(50% + 26px)', width: 48, height: 48, pointerEvents: 'none' }}
        initial={{ x: 0, y: 0, rotate: 0 }}
        animate={{
          x: [0, 16, 62, 118, 158, 178],
          y: [0, -52, -84, -62, -22, 0],
          rotate: [0, 90, 210, 340, 465, 540],
        }}
        transition={{ duration: 1.18, delay: 0.87, ease: [0.12, 0.48, 0.48, 0.94] }}
      >
        <svg viewBox="0 0 48 48" className="h-full w-full drop-shadow-[0_4px_10px_rgba(17,174,179,0.5)]">
          <circle cx="24" cy="24" r="22" fill="white" />
          {/* Pentagon pattern in brand colors */}
          <polygon points="24,4 30,13 24,17 18,13" fill={T} />
          <polygon points="24,44 30,35 24,31 18,35" fill={T} />
          <polygon points="4,24 13,18 17,24 13,30" fill={O} />
          <polygon points="44,24 35,18 31,24 35,30" fill={O} />
          <circle cx="24" cy="24" r="7" fill={T} />
          <circle cx="24" cy="24" r="22" fill="none" stroke="#e2e8f0" strokeWidth="1.5" />
        </svg>
      </motion.div>

      {/* === Kick-impact sparkle particles === */}
      {Array.from({ length: 7 }, (_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            bottom: 26,
            left: 'calc(50% + 24px)',
            width: i % 2 === 0 ? 7 : 5,
            height: i % 2 === 0 ? 7 : 5,
            background: i % 3 === 0 ? T : i % 3 === 1 ? O : 'white',
          }}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 0],
            x: [0, (i - 3) * 22],
            y: [0, -(18 + Math.abs(i - 3) * 9)],
          }}
          transition={{ duration: 0.52, delay: 0.89 + i * 0.035, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ─── Main Splash ──────────────────────────────────────────────────────────────
export function WorldCupSplash({ onClose }: Props) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timer.current = setTimeout(onClose, 5800);
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
      aria-label="Splash Mundial 2026 — QUE+"
    >
      <motion.div
        initial={{ scale: 0.82, y: 32 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 270, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative mx-4 w-full max-w-md overflow-hidden rounded-2xl text-white shadow-2xl"
        style={{ background: `linear-gradient(148deg, ${INK} 0%, #0a2229 55%, #0b1f26 100%)` }}
      >
        {/* Brand color top bar */}
        <div className="flex h-1.5">
          <div className="flex-[3] bg-[#11AEB3]" />
          <div className="flex-[2] bg-[#FF9700]" />
          <div className="flex-[3] bg-[#11AEB3]" />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between px-5 pt-4 pb-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#11AEB3]/20">
              <span className="text-base">⚽</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#11AEB3]">Mundial 2026</span>
          </div>
          <span className="text-xs font-black tracking-wide">🇨🇴 Colombia · Grupo K</span>
        </div>

        {/* Player kick animation */}
        <PlayerScene />

        {/* Match schedule */}
        <div className="px-5 pb-5 pt-1">
          <motion.ul
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.13, delayChildren: 1.3 } } }}
            className="space-y-2"
          >
            {MATCHES.map((m) => (
              <motion.li
                key={m.date}
                variants={{ hidden: { opacity: 0, x: -18 }, visible: { opacity: 1, x: 0 } }}
                className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5"
              >
                <span className="w-12 text-[10px] font-bold tabular-nums text-[#FF9700]">{m.date}</span>
                <span aria-label="Colombia">🇨🇴</span>
                <span className="text-[10px] text-white/35">vs</span>
                <span aria-label={m.rival}>{m.flag}</span>
                <span className="flex-1 text-xs text-white/70">{m.rival}</span>
                <span className="text-[10px] tabular-nums text-white/40">{m.time}</span>
              </motion.li>
            ))}
          </motion.ul>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.85 }}
            className="mt-3 text-center text-sm font-black tracking-wide text-[#11AEB3]"
          >
            ¡Arriba la Tricolor!
          </motion.p>

          <motion.button
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0 }}
            type="button"
            onClick={onClose}
            className="mt-3 w-full rounded-xl py-2.5 text-sm font-bold text-white shadow-lg transition hover:opacity-90 active:scale-95"
            style={{ background: `linear-gradient(135deg, #11AEB3 0%, #0891b2 100%)` }}
          >
            Ir al dashboard →
          </motion.button>
        </div>

        {/* Bottom brand bar */}
        <div className="flex h-1">
          <div className="flex-1 bg-[#FF9700]" />
          <div className="flex-1 bg-[#11AEB3]" />
          <div className="flex-1 bg-[#FF9700]" />
        </div>
      </motion.div>
    </motion.div>
  );
}
