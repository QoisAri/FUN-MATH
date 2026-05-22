// ============================================
// Unit Tests — Math Engine
// ============================================
// Minimal 5 test case per operasi, termasuk edge cases:
// - angka 0
// - carry/borrow beruntun
// - edge case batas digit

import { describe, it, expect } from 'vitest';
import {
  getDigits,
  solveAddition,
  solveSubtraction,
  solveMultiplication,
  solve,
  validateColumn,
  getExpectedDigits,
  getCarrySteps,
  getBorrowSteps,
  getMultiplicationRows,
} from '../lib/math-engine';

// ============================================
// getDigits
// ============================================

describe('getDigits', () => {
  it('mengembalikan [0] untuk angka 0', () => {
    expect(getDigits(0)).toEqual([0]);
  });

  it('memecah angka 1 digit', () => {
    expect(getDigits(5)).toEqual([5]);
  });

  it('memecah angka 2 digit (satuan dulu)', () => {
    expect(getDigits(42)).toEqual([2, 4]);
  });

  it('memecah angka 3 digit', () => {
    expect(getDigits(385)).toEqual([5, 8, 3]);
  });

  it('memecah angka dengan trailing zero', () => {
    expect(getDigits(100)).toEqual([0, 0, 1]);
  });
});

// ============================================
// Penjumlahan
// ============================================

describe('solveAddition', () => {
  it('penjumlahan tanpa carry: 23 + 14 = 37', () => {
    const result = solveAddition(23, 14);
    expect(result.hasil).toBe(37);
    expect(result.langkahLangkah.length).toBe(2);
    // Tidak ada carry baru
    expect(result.langkahLangkah.every(l => !l.carryBaru)).toBe(true);
  });

  it('penjumlahan dengan carry tunggal: 38 + 45 = 83', () => {
    const result = solveAddition(38, 45);
    expect(result.hasil).toBe(83);
    // Kolom satuan: 8+5=13, carry=1
    expect(result.langkahLangkah[0].carryBaru).toBe(1);
    expect(result.langkahLangkah[0].hasil).toBe(3);
  });

  it('penjumlahan dengan carry beruntun: 99 + 11 = 110', () => {
    const result = solveAddition(99, 11);
    expect(result.hasil).toBe(110);
    // Harus ada carry dari satuan ke puluhan
    expect(result.langkahLangkah[0].carryBaru).toBe(1);
  });

  it('penjumlahan dengan carry menghasilkan digit tambahan: 999 + 1 = 1000', () => {
    const result = solveAddition(999, 1);
    expect(result.hasil).toBe(1000);
    // Harus ada langkah carry terakhir
    const lastStep = result.langkahLangkah[result.langkahLangkah.length - 1];
    expect(lastStep.hasil).toBe(1);
  });

  it('penjumlahan dengan angka 0: 50 + 0 = 50', () => {
    const result = solveAddition(50, 0);
    expect(result.hasil).toBe(50);
  });

  it('penjumlahan 3 digit: 456 + 789 = 1245', () => {
    const result = solveAddition(456, 789);
    expect(result.hasil).toBe(1245);
  });
});

// ============================================
// Pengurangan
// ============================================

describe('solveSubtraction', () => {
  it('pengurangan tanpa borrow: 85 - 42 = 43', () => {
    const result = solveSubtraction(85, 42);
    expect(result.hasil).toBe(43);
    expect(result.langkahLangkah.every(l => !l.borrow)).toBe(true);
  });

  it('pengurangan dengan borrow tunggal: 62 - 28 = 34', () => {
    const result = solveSubtraction(62, 28);
    expect(result.hasil).toBe(34);
    // Kolom satuan: 2 < 8, perlu borrow
    expect(result.langkahLangkah[0].borrow).toBe(true);
    expect(result.langkahLangkah[0].hasil).toBe(4);
  });

  it('pengurangan dengan borrow beruntun: 300 - 156 = 144', () => {
    const result = solveSubtraction(300, 156);
    expect(result.hasil).toBe(144);
    // Kolom satuan perlu borrow, tapi puluhan juga 0 sehingga harus pinjam dari ratusan
    expect(result.langkahLangkah[0].borrow).toBe(true);
  });

  it('pengurangan edge case: 100 - 1 = 99', () => {
    const result = solveSubtraction(100, 1);
    expect(result.hasil).toBe(99);
  });

  it('pengurangan sama: 50 - 50 = 0', () => {
    const result = solveSubtraction(50, 50);
    expect(result.hasil).toBe(0);
  });

  it('throw error jika angka1 < angka2', () => {
    expect(() => solveSubtraction(10, 20)).toThrow();
  });

  it('pengurangan 3 digit dengan borrow: 500 - 267 = 233', () => {
    const result = solveSubtraction(500, 267);
    expect(result.hasil).toBe(233);
  });
});

// ============================================
// Perkalian
// ============================================

describe('solveMultiplication', () => {
  it('perkalian 2 digit × 1 digit: 42 × 3 = 126', () => {
    const result = solveMultiplication(42, 3);
    expect(result.hasil).toBe(126);
    // Hanya 1 baris parsial (pengali 1 digit)
    expect(result.barisPerkalian).toHaveLength(1);
    expect(result.barisPerkalian![0].offset).toBe(0);
  });

  it('perkalian 2 digit × 2 digit: 42 × 13 = 546', () => {
    const result = solveMultiplication(42, 13);
    expect(result.hasil).toBe(546);
    // 2 baris parsial
    expect(result.barisPerkalian).toHaveLength(2);
    // Baris 1 (×3): offset=0, hasil=126
    expect(result.barisPerkalian![0].hasilParsial).toBe(126);
    expect(result.barisPerkalian![0].offset).toBe(0);
    // KRITIS: Baris 2 (×1): offset=1, hasil=42
    expect(result.barisPerkalian![1].hasilParsial).toBe(42);
    expect(result.barisPerkalian![1].offset).toBe(1);
  });

  it('perkalian dengan carry: 67 × 8 = 536', () => {
    const result = solveMultiplication(67, 8);
    expect(result.hasil).toBe(536);
  });

  it('perkalian dengan angka bulat: 50 × 20 = 1000', () => {
    const result = solveMultiplication(50, 20);
    expect(result.hasil).toBe(1000);
  });

  it('perkalian 3 digit × 1 digit: 123 × 4 = 492', () => {
    const result = solveMultiplication(123, 4);
    expect(result.hasil).toBe(492);
  });

  it('offset baris perkalian benar untuk 35 × 24 = 840', () => {
    const result = solveMultiplication(35, 24);
    expect(result.hasil).toBe(840);
    // Baris 1 (×4): 35 × 4 = 140, offset 0
    expect(result.barisPerkalian![0].hasilParsial).toBe(140);
    expect(result.barisPerkalian![0].offset).toBe(0);
    // Baris 2 (×2): 35 × 2 = 70, offset 1 (×10)
    expect(result.barisPerkalian![1].hasilParsial).toBe(70);
    expect(result.barisPerkalian![1].offset).toBe(1);
    // 140 + 700 = 840
  });
});

// ============================================
// Dispatcher & Utilitas
// ============================================

describe('solve', () => {
  it('dispatch penjumlahan', () => {
    expect(solve(10, 20, 'penjumlahan').hasil).toBe(30);
  });

  it('dispatch pengurangan', () => {
    expect(solve(30, 10, 'pengurangan').hasil).toBe(20);
  });

  it('dispatch perkalian', () => {
    expect(solve(12, 5, 'perkalian').hasil).toBe(60);
  });
});

describe('validateColumn', () => {
  it('true jika jawaban benar', () => {
    expect(validateColumn(3, 3)).toBe(true);
  });

  it('false jika jawaban salah', () => {
    expect(validateColumn(3, 5)).toBe(false);
  });
});

describe('getExpectedDigits', () => {
  it('mengembalikan digit hasil yang benar', () => {
    const result = solveAddition(38, 45);
    const digits = getExpectedDigits(result);
    // 83 → [3, 8]
    expect(digits).toEqual([3, 8]);
  });
});

describe('getCarrySteps', () => {
  it('mengembalikan langkah carry', () => {
    const result = solveAddition(38, 45);
    const carries = getCarrySteps(result);
    expect(carries.length).toBeGreaterThan(0);
    expect(carries[0].carry).toBe(1);
  });
});

describe('getBorrowSteps', () => {
  it('mengembalikan langkah borrow', () => {
    const result = solveSubtraction(62, 28);
    const borrows = getBorrowSteps(result);
    expect(borrows.length).toBeGreaterThan(0);
  });
});

describe('getMultiplicationRows', () => {
  it('mengembalikan baris-baris perkalian', () => {
    const result = solveMultiplication(42, 13);
    const rows = getMultiplicationRows(result);
    expect(rows).toHaveLength(2);
    expect(rows[0].offset).toBe(0);
    expect(rows[1].offset).toBe(1);
  });
});
