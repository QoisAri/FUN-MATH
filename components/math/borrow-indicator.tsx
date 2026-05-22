'use client';

// ============================================
// BorrowIndicator — Visualisasi Pinjaman
// ============================================
// Menampilkan coretan pada digit asli + digit baru setelah dipinjam.
// Angka asli dicoret, angka baru muncul di atas.

import { motion } from 'framer-motion';

interface BorrowIndicatorProps {
  /** Angka asli sebelum dipinjam */
  nilaiAsli: number;
  /** Angka setelah dipinjam (biasanya nilaiAsli - 1) */
  nilaiBaru: number;
  /** Apakah indicator visible */
  visible?: boolean;
}

export default function BorrowIndicator({
  nilaiAsli,
  nilaiBaru,
  visible = true,
}: BorrowIndicatorProps) {
  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="borrow-indicator flex flex-col items-center leading-none"
      aria-label={`Dipinjam: ${nilaiAsli} menjadi ${nilaiBaru}`}
    >
      {/* Angka asli dicoret */}
      <span className="borrow-strikethrough text-xs">{nilaiAsli}</span>
      {/* Angka baru */}
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.3 }}
        className="text-xs font-bold"
        style={{ color: 'var(--borrow-color)' }}
      >
        {nilaiBaru}
      </motion.span>
    </motion.div>
  );
}
