// ============================================
// Math Engine — Logika Kalkulasi Inti
// ============================================
// PENTING: Semua logika hitung ada di file ini.
// Komponen React TIDAK BOLEH menyimpan logika kalkulasi.
// ASUMSI: angka tidak negatif, tidak lebih dari 999

import type {
  Operasi,
  HasilPerhitungan,
  LangkahHitung,
  BarisPerkalian,
} from '@/types/math';

// ============================================
// Utilitas Dasar
// ============================================

/**
 * Pecah angka menjadi array digit (dari satuan ke ratusan).
 * Contoh: 385 → [5, 8, 3]
 */
export function getDigits(angka: number): number[] {
  if (angka === 0) return [0];
  const digits: number[] = [];
  let sisa = Math.abs(angka);
  while (sisa > 0) {
    digits.push(sisa % 10);
    sisa = Math.floor(sisa / 10);
  }
  return digits;
}

/**
 * Pad array digit agar memiliki panjang tertentu (isi 0 di depan).
 */
function padDigits(digits: number[], panjang: number): number[] {
  const hasil = [...digits];
  while (hasil.length < panjang) {
    hasil.push(0);
  }
  return hasil;
}

// ============================================
// Penjumlahan
// ============================================

/**
 * Hitung penjumlahan susun ke bawah, langkah per langkah.
 * Carry ditampilkan sebagai angka kecil di atas kolom berikutnya.
 */
export function solveAddition(a: number, b: number): HasilPerhitungan {
  const hasil = a + b;
  const digitsA = getDigits(a);
  const digitsB = getDigits(b);
  const maxLen = Math.max(digitsA.length, digitsB.length);
  const paddedA = padDigits(digitsA, maxLen);
  const paddedB = padDigits(digitsB, maxLen);

  const langkahLangkah: LangkahHitung[] = [];
  let carry = 0;

  for (let i = 0; i < maxLen; i++) {
    const d1 = paddedA[i];
    const d2 = paddedB[i];
    const jumlah = d1 + d2 + carry;
    const hasilDigit = jumlah % 10;
    const carryBaru = Math.floor(jumlah / 10);

    const namaKolom = ['satuan', 'puluhan', 'ratusan', 'ribuan'][i] ?? `kolom-${i}`;
    let penjelasan = `${d1} + ${d2}`;
    if (carry > 0) penjelasan += ` + ${carry} (simpanan)`;
    penjelasan += ` = ${jumlah}`;
    if (carryBaru > 0) penjelasan += `, tulis ${hasilDigit} simpan ${carryBaru}`;

    langkahLangkah.push({
      kolom: i,
      nilaiDigit1: d1,
      nilaiDigit2: d2,
      carry,
      hasil: hasilDigit,
      carryBaru: carryBaru > 0 ? carryBaru : undefined,
      penjelasan: `Kolom ${namaKolom}: ${penjelasan}`,
    });

    carry = carryBaru;
  }

  // Jika ada carry terakhir, tambah langkah
  if (carry > 0) {
    langkahLangkah.push({
      kolom: maxLen,
      nilaiDigit1: 0,
      nilaiDigit2: 0,
      carry,
      hasil: carry,
      penjelasan: `Tulis simpanan ${carry}`,
    });
  }

  return { angka1: a, angka2: b, operasi: 'penjumlahan', hasil, langkahLangkah };
}

// ============================================
// Pengurangan
// ============================================

/**
 * Hitung pengurangan susun ke bawah, langkah per langkah.
 * Borrow divisualisasikan sebagai coretan pada digit yang dipinjam.
 * ASUMSI: a >= b (hasil tidak negatif)
 */
export function solveSubtraction(a: number, b: number): HasilPerhitungan {
  if (a < b) {
    throw new Error(`solveSubtraction: angka1 (${a}) harus >= angka2 (${b})`);
  }

  const hasil = a - b;
  const digitsA = getDigits(a);
  const digitsB = getDigits(b);
  const maxLen = Math.max(digitsA.length, digitsB.length);
  const paddedA = padDigits(digitsA, maxLen);
  const paddedB = padDigits(digitsB, maxLen);

  // Copy agar bisa mutasi saat borrow
  const workingA = [...paddedA];
  const langkahLangkah: LangkahHitung[] = [];

  for (let i = 0; i < maxLen; i++) {
    const d1 = workingA[i];
    const d2 = paddedB[i];
    const namaKolom = ['satuan', 'puluhan', 'ratusan', 'ribuan'][i] ?? `kolom-${i}`;

    if (d1 >= d2) {
      const hasilDigit = d1 - d2;
      langkahLangkah.push({
        kolom: i,
        nilaiDigit1: d1,
        nilaiDigit2: d2,
        borrow: false,
        hasil: hasilDigit,
        penjelasan: `Kolom ${namaKolom}: ${d1} − ${d2} = ${hasilDigit}`,
      });
    } else {
      // Perlu borrow dari kolom sebelah
      // Cari kolom yang bisa dipinjam
      let j = i + 1;
      while (j < maxLen && workingA[j] === 0) {
        j++;
      }

      // Pinjam berantai
      const nilaiSebelumBorrow = workingA[j];
      workingA[j] -= 1;
      j--;
      while (j > i) {
        workingA[j] = 9; // kolom yang tadinya 0 jadi 9 setelah dipinjam
        j--;
      }
      workingA[i] += 10;

      const hasilDigit = workingA[i] - d2;

      langkahLangkah.push({
        kolom: i,
        nilaiDigit1: paddedA[i],
        nilaiDigit2: d2,
        borrow: true,
        nilaiSebelumBorrow,
        nilaiSetelahBorrow: workingA[i],
        hasil: hasilDigit,
        penjelasan: `Kolom ${namaKolom}: ${paddedA[i]} < ${d2}, pinjam → ${workingA[i]} − ${d2} = ${hasilDigit}`,
      });
    }
  }

  return { angka1: a, angka2: b, operasi: 'pengurangan', hasil, langkahLangkah };
}

// ============================================
// Perkalian
// ============================================

/**
 * Hitung perkalian satu baris: angka × 1 digit.
 * Mengembalikan langkah per kolom + hasil parsial.
 */
function multiplyByDigit(angka: number, digit: number): { hasil: number; langkahLangkah: LangkahHitung[] } {
  const digitsAngka = getDigits(angka);
  const langkahLangkah: LangkahHitung[] = [];
  let carry = 0;
  let hasil = 0;

  for (let i = 0; i < digitsAngka.length; i++) {
    const d = digitsAngka[i];
    const product = d * digit + carry;
    const hasilDigit = product % 10;
    const carryBaru = Math.floor(product / 10);

    const namaKolom = ['satuan', 'puluhan', 'ratusan', 'ribuan'][i] ?? `kolom-${i}`;
    let penjelasan = `${d} × ${digit}`;
    if (carry > 0) penjelasan += ` + ${carry}`;
    penjelasan += ` = ${product}`;
    if (carryBaru > 0) penjelasan += `, tulis ${hasilDigit} simpan ${carryBaru}`;

    langkahLangkah.push({
      kolom: i,
      nilaiDigit1: d,
      nilaiDigit2: digit,
      carry,
      hasil: hasilDigit,
      carryBaru: carryBaru > 0 ? carryBaru : undefined,
      penjelasan: `Kolom ${namaKolom}: ${penjelasan}`,
    });

    carry = carryBaru;
  }

  // Carry terakhir
  if (carry > 0) {
    langkahLangkah.push({
      kolom: digitsAngka.length,
      nilaiDigit1: 0,
      nilaiDigit2: digit,
      carry,
      hasil: carry,
      penjelasan: `Tulis simpanan ${carry}`,
    });
  }

  hasil = angka * digit;
  return { hasil, langkahLangkah };
}

/**
 * Hitung perkalian susun ke bawah lengkap.
 *
 * KRITIS: baris hasil perkalian ke-N digeser (N-1) kolom ke kiri.
 * Geser kiri = tambah (N-1) angka nol di belakang sebelum dijumlah.
 * UI harus menampilkan placeholder di posisi yang "kosong" di kanan.
 */
export function solveMultiplication(a: number, b: number): HasilPerhitungan {
  const hasil = a * b;
  const digitsPengali = getDigits(b);
  const barisPerkalian: BarisPerkalian[] = [];

  for (let i = 0; i < digitsPengali.length; i++) {
    const digitPengali = digitsPengali[i];
    const { hasil: hasilParsial, langkahLangkah } = multiplyByDigit(a, digitPengali);

    // KRITIS: offset = i posisi ke kiri (tambah i nol di belakang)
    const hasilDenganOffset = hasilParsial * Math.pow(10, i);
    const digitsHasil = getDigits(hasilDenganOffset);

    // Tambah trailing zeros untuk offset di digit array
    const digits: number[] = [];
    // Tambah offset zeros di awal (posisi satuan dst.)
    for (let z = 0; z < i; z++) {
      digits.push(0);
    }
    // Tambah digit hasil
    const digitsParsial = getDigits(hasilParsial);
    digits.push(...digitsParsial);

    barisPerkalian.push({
      indexPengali: i,
      digitPengali,
      hasilParsial,
      offset: i,
      digits,
      langkahLangkah,
    });
  }

  // Langkah penjumlahan baris-baris parsial
  let langkahPenjumlahan: LangkahHitung[] = [];
  if (barisPerkalian.length > 1) {
    // Jumlahkan semua baris parsial
    const nilaiParsial = barisPerkalian.map(
      (b) => b.hasilParsial * Math.pow(10, b.offset)
    );
    // Gunakan solveAddition untuk penjumlahan bertahap
    let totalSementara = nilaiParsial[0];
    for (let i = 1; i < nilaiParsial.length; i++) {
      const addResult = solveAddition(totalSementara, nilaiParsial[i]);
      if (i === nilaiParsial.length - 1) {
        langkahPenjumlahan = addResult.langkahLangkah;
      }
      totalSementara = addResult.hasil;
    }
  }

  // Gabungkan semua langkah untuk timeline animasi
  const semuaLangkah: LangkahHitung[] = [];
  for (const baris of barisPerkalian) {
    semuaLangkah.push(...baris.langkahLangkah);
  }
  semuaLangkah.push(...langkahPenjumlahan);

  return {
    angka1: a,
    angka2: b,
    operasi: 'perkalian',
    hasil,
    langkahLangkah: semuaLangkah,
    barisPerkalian,
    langkahPenjumlahan,
  };
}

// ============================================
// Dispatcher Utama
// ============================================

/**
 * Selesaikan soal berdasarkan operasi.
 * Entry point utama yang digunakan oleh komponen.
 */
export function solve(
  angka1: number,
  angka2: number,
  operasi: Operasi
): HasilPerhitungan {
  switch (operasi) {
    case 'penjumlahan':
      return solveAddition(angka1, angka2);
    case 'pengurangan':
      return solveSubtraction(angka1, angka2);
    case 'perkalian':
      return solveMultiplication(angka1, angka2);
    default:
      throw new Error(`Operasi tidak dikenal: ${operasi}`);
  }
}

// ============================================
// Validasi Per Kolom
// ============================================

/**
 * Validasi jawaban siswa untuk satu kolom.
 * Mengembalikan true jika jawaban benar.
 */
export function validateColumn(
  nilaiSiswa: number,
  nilaiBenar: number
): boolean {
  return nilaiSiswa === nilaiBenar;
}

/**
 * Dapatkan digit hasil yang benar per kolom.
 * Mengembalikan array digit (index 0 = satuan).
 */
export function getExpectedDigits(perhitungan: HasilPerhitungan): number[] {
  return getDigits(perhitungan.hasil);
}

/**
 * Dapatkan detail carry per langkah (untuk visualisasi).
 */
export function getCarrySteps(perhitungan: HasilPerhitungan): { kolom: number; carry: number }[] {
  return perhitungan.langkahLangkah
    .filter((l) => l.carryBaru !== undefined && l.carryBaru > 0)
    .map((l) => ({ kolom: l.kolom, carry: l.carryBaru! }));
}

/**
 * Dapatkan detail borrow per langkah (untuk visualisasi).
 */
export function getBorrowSteps(perhitungan: HasilPerhitungan): { kolom: number; nilaiSebelum: number; nilaiSesudah: number }[] {
  return perhitungan.langkahLangkah
    .filter((l) => l.borrow === true)
    .map((l) => ({
      kolom: l.kolom,
      nilaiSebelum: l.nilaiSebelumBorrow ?? l.nilaiDigit1,
      nilaiSesudah: l.nilaiSetelahBorrow ?? l.nilaiDigit1 + 10,
    }));
}

/**
 * Dapatkan baris-baris perkalian untuk visualisasi offset.
 * KRITIS: tiap baris ke-N punya offset (N-1) posisi ke kiri.
 */
export function getMultiplicationRows(perhitungan: HasilPerhitungan): BarisPerkalian[] {
  return perhitungan.barisPerkalian ?? [];
}
