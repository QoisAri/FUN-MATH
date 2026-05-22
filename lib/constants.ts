// ============================================
// Konstanta Global — FUN-MATH
// ============================================
// Tidak boleh ada magic number. Semua angka penting didefinisikan di sini.

import type { Operasi, Kesulitan } from '@/types/math';

/** Jumlah percobaan salah sebelum jawaban diungkap */
export const MAX_PERCOBAAN = 3;

/** Delay animasi per langkah (ms) */
export const DELAY_ANIMASI_MS = 600;

/** Jumlah kolom digit maksimum yang didukung (2-3 digit) */
// TODO: konfirmasi client — saat ini mendukung 2-3 digit
export const KOLOM_MAKS = 3;

/** Digit minimum soal */
export const DIGIT_MIN = 2;

/** Digit maksimum soal */
export const DIGIT_MAKS = 3;

/** Daftar operasi yang didukung */
export const OPERASI_LIST: readonly Operasi[] = [
  'penjumlahan',
  'pengurangan',
  'perkalian',
] as const;

/** Daftar tingkat kesulitan */
export const KESULITAN_LIST: readonly Kesulitan[] = [
  'mudah',
  'sedang',
  'sulit',
] as const;

/** Label operasi untuk tampilan UI (Bahasa Indonesia) */
export const OPERASI_LABEL: Record<Operasi, string> = {
  penjumlahan: 'Penjumlahan',
  pengurangan: 'Pengurangan',
  perkalian: 'Perkalian',
};

/** Simbol operasi matematika */
export const OPERASI_SIMBOL: Record<Operasi, string> = {
  penjumlahan: '+',
  pengurangan: '−',
  perkalian: '×',
};

/** Warna tema per operasi */
export const OPERASI_WARNA: Record<Operasi, { bg: string; text: string; accent: string }> = {
  penjumlahan: { bg: 'bg-blue-50', text: 'text-blue-700', accent: 'border-blue-400' },
  pengurangan: { bg: 'bg-emerald-50', text: 'text-emerald-700', accent: 'border-emerald-400' },
  perkalian: { bg: 'bg-violet-50', text: 'text-violet-700', accent: 'border-violet-400' },
};

/** Label kesulitan untuk tampilan UI */
export const KESULITAN_LABEL: Record<Kesulitan, string> = {
  mudah: 'Mudah',
  sedang: 'Sedang',
  sulit: 'Sulit',
};

/** Emoji reward berdasarkan persentase skor */
export const REWARD_EMOJI: { min: number; emoji: string; pesan: string }[] = [
  { min: 90, emoji: '🌟', pesan: 'Luar Biasa!' },
  { min: 70, emoji: '⭐', pesan: 'Hebat!' },
  { min: 50, emoji: '👍', pesan: 'Bagus!' },
  { min: 0, emoji: '💪', pesan: 'Ayo Coba Lagi!' },
];

/** Durasi default timer per soal (detik) — 0 berarti tanpa batas */
// TODO: konfirmasi client — timer diaktifkan
export const TIMER_DEFAULT_DETIK = 120;

/** Jumlah soal per sesi latihan */
export const SOAL_PER_SESI = 5;
