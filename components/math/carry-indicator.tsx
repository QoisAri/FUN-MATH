'use client';

// ============================================
// CarryIndicator — Visualisasi Angka Simpanan
// ============================================
// Tampil sebagai angka kecil (superscript) di sudut kiri atas kolom berikutnya.
// Warna amber/oranye agar kontras. Animasi slide-in dari bawah.

import { motion } from 'framer-motion';

interface CarryIndicatorProps {
  /** Nilai carry (biasanya 1) */
  nilai: number;
  /** Apakah indicator visible */
  visible?: boolean;
}

export default function CarryIndicator({ nilai, visible = true }: CarryIndicatorProps) {
  if (!visible || nilai === 0) return null;

  return (
    <motion.span
      initial={{ y: 8, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -8, opacity: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="carry-indicator animate-slide-in-up"
      aria-label={`Simpanan ${nilai}`}
    >
      {nilai}
    </motion.span>
  );
}
