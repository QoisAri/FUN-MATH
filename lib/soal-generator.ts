// ============================================
// Generator Soal — Random berdasarkan operasi + kesulitan
// ============================================
// Menghasilkan soal acak sesuai parameter.
// Khusus pengurangan: angka1 selalu >= angka2 (hasil tidak negatif).

import type { Operasi, Kesulitan, Soal } from '@/types/math';

// ============================================
// Range Angka per Kesulitan
// ============================================

interface RangeAngka {
  min: number;
  max: number;
}

/**
 * Definisi range angka berdasarkan kesulitan.
 * - Mudah: 2 digit tanpa carry/borrow yang kompleks
 * - Sedang: 2 digit dengan kemungkinan carry/borrow
 * - Sulit: 2-3 digit dengan carry/borrow beruntun
 */
const RANGE_PER_KESULITAN: Record<Kesulitan, { angka1: RangeAngka; angka2: RangeAngka }> = {
  mudah: {
    angka1: { min: 10, max: 49 },
    angka2: { min: 10, max: 49 },
  },
  sedang: {
    angka1: { min: 20, max: 99 },
    angka2: { min: 10, max: 99 },
  },
  sulit: {
    angka1: { min: 100, max: 999 },
    angka2: { min: 10, max: 999 },
  },
};

/**
 * Range khusus perkalian — digit lebih kecil karena hasil bisa sangat besar.
 */
const RANGE_PERKALIAN: Record<Kesulitan, { angka1: RangeAngka; angka2: RangeAngka }> = {
  mudah: {
    angka1: { min: 10, max: 49 },
    angka2: { min: 2, max: 9 },
  },
  sedang: {
    angka1: { min: 10, max: 99 },
    angka2: { min: 10, max: 49 },
  },
  sulit: {
    angka1: { min: 10, max: 99 },
    angka2: { min: 10, max: 99 },
  },
};

// ============================================
// Utilitas Random
// ============================================

/**
 * Generate angka random antara min dan max (inklusif).
 */
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================
// Generator Soal
// ============================================

/**
 * Generate satu soal random berdasarkan operasi dan kesulitan.
 *
 * Untuk pengurangan:
 * - Memastikan angka1 >= angka2 sehingga hasil tidak negatif
 *
 * Untuk perkalian:
 * - Menggunakan range lebih kecil agar hasil tidak terlalu besar
 */
export function generateSoal(operasi: Operasi, kesulitan: Kesulitan): Soal {
  const range = operasi === 'perkalian'
    ? RANGE_PERKALIAN[kesulitan]
    : RANGE_PER_KESULITAN[kesulitan];

  let angka1 = randomInt(range.angka1.min, range.angka1.max);
  let angka2 = randomInt(range.angka2.min, range.angka2.max);

  // Pengurangan: pastikan angka1 >= angka2
  if (operasi === 'pengurangan' && angka1 < angka2) {
    [angka1, angka2] = [angka2, angka1];
  }

  return { angka1, angka2, operasi, kesulitan };
}

/**
 * Generate array soal untuk satu sesi latihan.
 */
export function generateSesiSoal(
  operasi: Operasi,
  kesulitan: Kesulitan,
  jumlah: number
): Soal[] {
  const soalList: Soal[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < jumlah; i++) {
    let soal: Soal;
    let key: string;

    // Hindari soal duplikat dalam satu sesi
    do {
      soal = generateSoal(operasi, kesulitan);
      key = `${soal.angka1}-${soal.angka2}`;
    } while (seen.has(key) && seen.size < 50); // safety limit

    seen.add(key);
    soalList.push(soal);
  }

  return soalList;
}

/**
 * Validasi apakah soal valid berdasarkan constraint.
 */
export function isValidSoal(soal: Soal): boolean {
  const { angka1, angka2, operasi } = soal;

  // Angka harus positif
  if (angka1 <= 0 || angka2 <= 0) return false;

  // Angka harus dalam range 2-3 digit (kecuali pengali 1 digit untuk perkalian mudah)
  if (angka1 > 999 || angka2 > 999) return false;

  // Pengurangan: angka1 harus >= angka2
  if (operasi === 'pengurangan' && angka1 < angka2) return false;

  return true;
}
