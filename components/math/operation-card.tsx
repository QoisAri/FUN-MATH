'use client';

// ============================================
// OperationCard — Kartu Pilih Operasi
// ============================================
// Kartu besar dengan ikon untuk memilih jenis operasi.
// Visual: warna unik per operasi, hover effect, animasi.

import { motion } from 'framer-motion';
import { Plus, Minus, X } from 'lucide-react';
import type { Operasi } from '@/types/math';
import { OPERASI_LABEL } from '@/lib/constants';

interface OperationCardProps {
  operasi: Operasi;
  onClick: (operasi: Operasi) => void;
  delay?: number;
}

const ICON_MAP: Record<Operasi, React.ReactNode> = {
  penjumlahan: <Plus className="w-12 h-12" strokeWidth={3} />,
  pengurangan: <Minus className="w-12 h-12" strokeWidth={3} />,
  perkalian: <X className="w-12 h-12" strokeWidth={3} />,
};

const COLOR_MAP: Record<Operasi, { bg: string; hover: string; icon: string; border: string }> = {
  penjumlahan: {
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    hover: 'hover:bg-blue-100 dark:hover:bg-blue-950/50',
    icon: 'text-blue-500',
    border: 'border-blue-200 dark:border-blue-800',
  },
  pengurangan: {
    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    hover: 'hover:bg-emerald-100 dark:hover:bg-emerald-950/50',
    icon: 'text-emerald-500',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  perkalian: {
    bg: 'bg-violet-50 dark:bg-violet-950/30',
    hover: 'hover:bg-violet-100 dark:hover:bg-violet-950/50',
    icon: 'text-violet-500',
    border: 'border-violet-200 dark:border-violet-800',
  },
};

const EMOJI_MAP: Record<Operasi, string> = {
  penjumlahan: '➕',
  pengurangan: '➖',
  perkalian: '✖️',
};

export default function OperationCard({ operasi, onClick, delay = 0 }: OperationCardProps) {
  const colors = COLOR_MAP[operasi];
  const label = OPERASI_LABEL[operasi];

  return (
    <motion.button
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(operasi)}
      className={`
        flex flex-col items-center justify-center gap-4 p-8 rounded-3xl
        border-2 ${colors.border} ${colors.bg} ${colors.hover}
        transition-colors duration-200 cursor-pointer
        w-full max-w-[200px] aspect-square
        shadow-sm hover:shadow-lg
      `}
      aria-label={`Pilih ${label}`}
    >
      {/* Emoji besar */}
      <span className="text-5xl">{EMOJI_MAP[operasi]}</span>

      {/* Label */}
      <span className="text-lg font-bold text-foreground">{label}</span>
    </motion.button>
  );
}
