import { Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  theme: 'light' | 'dark';
  onToggle: () => void;
}

export function ThemeToggle({ theme, onToggle }: ThemeToggleProps) {
  const isDark = theme === 'dark';

  return (
    <motion.button
      type="button"
      onClick={onToggle}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      className="relative flex h-12 w-[114px] items-center gap-0.5 rounded-full border-2 border-slate-200 bg-gradient-to-r from-white to-slate-50 p-1 shadow-lg transition-all dark:border-white/20 dark:from-slate-800 dark:to-slate-900 dark:bg-gradient-to-r"
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
    >
      <motion.span
        layout
        className={`absolute inset-1 rounded-full transition-all ${
          isDark
            ? 'translate-x-[52px] bg-gradient-to-br from-plus-orange to-amber-600'
            : 'translate-x-0 bg-gradient-to-br from-que-teal to-teal-600'
        }`}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      <motion.span
        className="relative z-10 grid h-10 w-[50px] place-items-center text-white"
        animate={{ opacity: isDark ? 0.4 : 1, scale: isDark ? 0.8 : 1 }}
        transition={{ duration: 0.2 }}
      >
        <Sun size={18} strokeWidth={2.5} aria-hidden="true" />
      </motion.span>
      <motion.span
        className="relative z-10 grid h-10 w-[50px] place-items-center text-slate-400 dark:text-white"
        animate={{ opacity: isDark ? 1 : 0.4, scale: isDark ? 1 : 0.8 }}
        transition={{ duration: 0.2 }}
      >
        <Moon size={18} strokeWidth={2.5} aria-hidden="true" />
      </motion.span>
    </motion.button>
  );
}
