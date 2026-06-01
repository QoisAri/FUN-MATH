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
export function padDigits(digits: number[], panjang: number): number[] {
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
    if (carry > 0) penjelasan += ` <span style="color: var(--carry-color)">+ ${carry} (simpanan)</span>`;
    penjelasan += ` = <span style="color: var(--primary)">${jumlah}</span>`;
    if (carryBaru > 0) penjelasan += `, <span style="color: var(--primary)">tulis ${hasilDigit}</span> <span style="color: var(--carry-color)">simpan ${carryBaru}</span>`;

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
      penjelasan: `Tulis <span style="color: var(--carry-color)"> simpanan ${carry}</span>`,
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
        digitAtasAktif: [...workingA],
        penjelasan: `Kolom ${namaKolom}: ${d1} − ${d2} = <span style="color: var(--primary)"> ${hasilDigit}</span>`,
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
        digitAtasAktif: [...workingA],
        penjelasan: `Kolom ${namaKolom}: ${paddedA[i]} <i>kurang dari</i> ${d2}, <span style="color: var(--borrow-color)"> pinjam → ${workingA[i]}</span> − ${d2} = <span style="color: var(--primary)"> ${hasilDigit}</span>`,
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
function multiplyByDigit(angka: number, digit: number, indexPengali: number): { hasil: number; langkahLangkah: LangkahHitung[] } {
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
    let penjelasan = `${d} ×  ${digit}`;
    if (carry > 0) penjelasan += ` + <span style="color: var(--carry-color)"> ${carry} (simpanan)</span>`;
    penjelasan += ` = <span style="color: var(--primary)"> ${product} </span>`;
    if (carryBaru > 0) penjelasan += `, <span style="color: var(--primary)">tulis ${hasilDigit}</span> <span style="color: var(--carry-color)">simpan ${carryBaru}</span>`;

    langkahLangkah.push({
      kolom: i,
      nilaiDigit1: d,
      nilaiDigit2: digit,
      carry,
      hasil: hasilDigit,
      carryBaru: carryBaru > 0 ? carryBaru : undefined,
      highlightBaris1: [i],
      highlightBaris2: [indexPengali],
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
      highlightBaris1: [digitsAngka.length],
      highlightBaris2: [indexPengali],
      penjelasan: `Tulis <span style="color: var(--carry-color)"> simpanan ${carry} </span>`,
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
    const { hasil: hasilParsial, langkahLangkah } = multiplyByDigit(a, digitPengali, i);

    for (const step of langkahLangkah) {
      step.barisPerkalianIdx = i;
    }

    // Tambah trailing zeros untuk offset di digit array
    const digits: number[] = [];
    // Tambah offset zeros di awal (posisi satuan dst.)
    for (let z = 0; z < i; z++) {
      digits.push(0);
    }
    // Tambah digit hasil
    const digitsParsial = langkahLangkah.map(l => l.hasil);
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

  // Langkah penjumlahan baris-baris parsial secara manual
  const langkahPenjumlahan: LangkahHitung[] = [];
  if (barisPerkalian.length > 1) {
    const baris0 = barisPerkalian[0];
    const baris1 = barisPerkalian[1];
    const maxLen = Math.max(baris0.digits.length, baris1.digits.length);
    let carry = 0;

    for (let col = 0; col < maxLen; col++) {
      const d1 = baris0.digits[col]; // digit dari baris 0
      const d2 = baris1.digits[col]; // digit dari baris 1
      const isOffset1 = col < baris0.offset;
      const isOffset2 = col < baris1.offset;
      const namaKolom = ['satuan', 'puluhan', 'ratusan', 'ribuan'][col] ?? `kolom-${col}`;

      if (d1 === undefined) {
        // Baris 0 sudah habis, langsung tulis dari baris 1
        const val2 = d2 ?? 0;
        const jumlah = val2 + carry;
        const hasilDigit = jumlah % 10;
        const carryBaru = Math.floor(jumlah / 10);

        let penjelasan = `Kolom ${namaKolom}: `;
        if (carry === 0) {
          penjelasan += `langsung tulis <span style="color: var(--primary)">${val2}</span>`;
        } else {
          penjelasan += `${val2} + <span style="color: var(--carry-color)">${carry} (simpanan)</span> = <span style="color: var(--primary)">${jumlah}</span>`;
          if (carryBaru > 0) {
            penjelasan += `, <span style="color: var(--primary)">tulis ${hasilDigit}</span> <span style="color: var(--carry-color)">simpan ${carryBaru}</span>`;
          }
        }

        langkahPenjumlahan.push({
          kolom: col,
          nilaiDigit1: 0,
          nilaiDigit2: val2,
          carry,
          hasil: hasilDigit,
          carryBaru: carryBaru > 0 ? carryBaru : undefined,
          highlightBaris1: [],
          highlightBaris2: [],
          penjelasan,
        });

        carry = carryBaru;
      } else if (isOffset2) {
        // Kolom ini adalah offset (dot) di baris 1, langsung tulis dari baris 0
        const val1 = d1;
        const jumlah = val1 + carry;
        const hasilDigit = jumlah % 10;
        const carryBaru = Math.floor(jumlah / 10);

        let penjelasan = `Kolom ${namaKolom}: `;
        if (carry === 0) {
          penjelasan += `langsung tulis <span style="color: var(--primary)">${val1}</span>`;
        } else {
          penjelasan += `${val1} + <span style="color: var(--carry-color)">${carry} (simpanan)</span> = <span style="color: var(--primary)">${jumlah}</span>`;
          if (carryBaru > 0) {
            penjelasan += `, <span style="color: var(--primary)">tulis ${hasilDigit}</span> <span style="color: var(--carry-color)">simpan ${carryBaru}</span>`;
          }
        }

        langkahPenjumlahan.push({
          kolom: col,
          nilaiDigit1: val1,
          nilaiDigit2: 0,
          carry,
          hasil: hasilDigit,
          carryBaru: carryBaru > 0 ? carryBaru : undefined,
          highlightBaris1: [],
          highlightBaris2: [],
          penjelasan,
        });

        carry = carryBaru;
      } else {
        // Penjumlahan biasa
        const val1 = d1;
        const val2 = d2 ?? 0;
        const jumlah = val1 + val2 + carry;
        const hasilDigit = jumlah % 10;
        const carryBaru = Math.floor(jumlah / 10);

        let penj = `${val1} + ${val2}`;
        if (carry > 0) {
          penj += ` + <span style="color: var(--carry-color)">${carry} (simpanan)</span>`;
        }
        penj += ` = <span style="color: var(--primary)">${jumlah}</span>`;
        if (carryBaru > 0) {
          penj += `, <span style="color: var(--primary)">tulis ${hasilDigit}</span> <span style="color: var(--carry-color)">simpan ${carryBaru}</span>`;
        }

        langkahPenjumlahan.push({
          kolom: col,
          nilaiDigit1: val1,
          nilaiDigit2: val2,
          carry,
          hasil: hasilDigit,
          carryBaru: carryBaru > 0 ? carryBaru : undefined,
          highlightBaris1: [],
          highlightBaris2: [],
          penjelasan: `Kolom ${namaKolom}: ${penj}`,
        });

        carry = carryBaru;
      }
    }

    if (carry > 0) {
      langkahPenjumlahan.push({
        kolom: maxLen,
        nilaiDigit1: 0,
        nilaiDigit2: 0,
        carry,
        hasil: carry,
        highlightBaris1: [],
        highlightBaris2: [],
        penjelasan: `Tulis <span style="color: var(--carry-color)">simpanan ${carry}</span>`,
      });
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
// Enrichment — Langkah Deskriptif untuk Mode Belajar
// ============================================

/**
 * Target jumlah langkah minimum per tingkat kesulitan.
 * Berlaku untuk semua operasi (penjumlahan, pengurangan, perkalian).
 */
const TARGET_LANGKAH: Record<import('@/types/math').Kesulitan, { min: number; max: number }> = {
  mudah: { min: 3, max: 3 },
  sedang: { min: 4, max: 5 },
  sulit: { min: 5, max: 6 },
};

/**
 * Buat langkah deskriptif (pengantar/observasi/kesimpulan).
 * Kolom: -1 supaya MathBoard tidak highlight kolom apapun.
 */
function buatLangkahDeskriptif(
  penjelasan: string,
  highlight?: { baris1?: number[]; baris2?: number[] },
): LangkahHitung {
  return {
    kolom: -1,
    nilaiDigit1: 0,
    nilaiDigit2: 0,
    hasil: 0,
    highlightBaris1: highlight?.baris1,
    highlightBaris2: highlight?.baris2,
    penjelasan,
  };
}

/**
 * Buat langkah pengantar berdasarkan operasi dan soal.
 */
function langkahPengantar(
  perhitungan: HasilPerhitungan,
): LangkahHitung {
  const { angka1, angka2, operasi } = perhitungan;
  const simbol = operasi === 'penjumlahan' ? '+' : operasi === 'pengurangan' ? '−' : '×';
  return buatLangkahDeskriptif(
    `Perhatikan soalnya: ${angka1} ${simbol} ${angka2}. Kita kerjakan dari kolom satuan (kanan).`
  );
}

/**
 * Buat langkah persiapan yang menjelaskan strategi.
 */
function langkahPersiapan(perhitungan: HasilPerhitungan): LangkahHitung {
  const { operasi, langkahLangkah } = perhitungan;

  if (operasi === 'penjumlahan') {
    const adaCarry = langkahLangkah.some((l) => l.carryBaru && l.carryBaru > 0);
    return buatLangkahDeskriptif(
      adaCarry
        ? 'Soal ini memiliki simpanan. Jika jumlah lebih dari atau sama dengan 10, tulis satuan, simpan puluhannya.'
        : 'Soal ini tanpa simpanan. Jumlahkan tiap kolom dari kanan ke kiri.'
    );
  }

  if (operasi === 'pengurangan') {
    const adaBorrow = langkahLangkah.some((l) => l.borrow === true);
    if (adaBorrow) {
      // Ambil langkah borrow pertama untuk menunjukkan contoh nyata
      const firstBorrow = langkahLangkah.find((l) => l.borrow === true)!;
      const namaKolom = ['satuan', 'puluhan', 'ratusan', 'ribuan'][firstBorrow.kolom] ?? `kolom-${firstBorrow.kolom}`;
      const kolomKiriIdx = firstBorrow.kolom + 1;
      const namaKolomKiri = ['satuan', 'puluhan', 'ratusan', 'ribuan'][kolomKiriIdx] ?? `kolom-${kolomKiriIdx}`;

      // Gunakan nilaiSebelumBorrow (angka asli sebelum dipinjam)
      const digitKolomKiri = firstBorrow.nilaiSebelumBorrow ?? 0;

      return buatLangkahDeskriptif(
        `Soal ini memerlukan peminjaman. Pada kolom ${namaKolom}, ` +
        `<span style="color: var(--primary); font-weight: 700">digit atas (${firstBorrow.nilaiDigit1})</span> ` +
        `lebih kecil dari ` +
        `<span style="color: var(--borrow-color); font-weight: 700">digit bawah (${firstBorrow.nilaiDigit2})</span>, ` +
        `pinjam dari ` +
        `<span style="color: var(--carry-color); font-weight: 700">kolom ${namaKolomKiri} (${digitKolomKiri})</span>.`,
        {
          baris1: [firstBorrow.kolom, kolomKiriIdx], // highlight digit atas satuan + kolom kiri
          baris2: [firstBorrow.kolom],                // highlight digit bawah satuan saja
        },
      );
    }
    return buatLangkahDeskriptif(
      'Soal ini tanpa peminjaman. Kurangkan tiap kolom dari kanan ke kiri.'
    );
  }

  // Perkalian
  return buatLangkahDeskriptif(
    'Kalikan angka atas dengan setiap digit pengali, mulai dari satuan pengali.'
  );
}

/**
 * Buat langkah observasi carry/borrow yang terpisah.
 */
function langkahObservasi(perhitungan: HasilPerhitungan): LangkahHitung | null {
  const { operasi, langkahLangkah } = perhitungan;

  if (operasi === 'penjumlahan') {
    const carries = langkahLangkah.filter((l) => l.carryBaru && l.carryBaru > 0);
    if (carries.length > 1) {
      return buatLangkahDeskriptif(
        `Ada ${carries.length} simpanan berturut-turut. Jangan lupa tambahkan simpanan di setiap kolom berikutnya!`
      );
    }
  }

  if (operasi === 'pengurangan') {
    const borrows = langkahLangkah.filter((l) => l.borrow === true);
    if (borrows.length > 1) {
      return buatLangkahDeskriptif(
        `Ada ${borrows.length} peminjaman. Perhatikan setiap kolom yang memerlukan pinjaman dari kiri.`
      );
    }
  }

  if (operasi === 'perkalian' && perhitungan.barisPerkalian && perhitungan.barisPerkalian.length > 1) {
    return buatLangkahDeskriptif(
      `Setelah mengalikan tiap digit, jumlahkan semua baris hasil dengan memperhatikan posisi geser (offset).`
    );
  }

  return null;
}

/**
 * Buat langkah kesimpulan akhir.
 */
function langkahKesimpulan(perhitungan: HasilPerhitungan): LangkahHitung {
  const { angka1, angka2, operasi, hasil } = perhitungan;
  const simbol = operasi === 'penjumlahan' ? '+' : operasi === 'pengurangan' ? '−' : '×';
  return buatLangkahDeskriptif(
    `Selesai! ${angka1} ${simbol} ${angka2} = <span style="color: var(--primary)">${hasil} ✓</span>`
  );
}

/**
 * Perkaya langkah perhitungan dengan langkah deskriptif tambahan
 * agar jumlah total langkah sesuai target per tingkat kesulitan.
 *
 * Langkah deskriptif menggunakan kolom: -1, sehingga MathBoard
 * tidak meng-highlight kolom apapun dan tidak mengungkap digit.
 *
 * Berlaku untuk semua operasi (penjumlahan, pengurangan, perkalian).
 */
export function enrichStepsForLearning(
  perhitungan: HasilPerhitungan,
  kesulitan: import('@/types/math').Kesulitan,
): HasilPerhitungan {
  const target = TARGET_LANGKAH[kesulitan];
  const langkahInti = [...perhitungan.langkahLangkah];
  const enriched: LangkahHitung[] = [];

  // 1. Langkah pengantar (selalu ada)
  enriched.push(langkahPengantar(perhitungan));

  // 2. Langkah persiapan/strategi (untuk sedang & sulit)
  if (kesulitan !== 'mudah') {
    enriched.push(langkahPersiapan(perhitungan));
  }

  // 3. Langkah-langkah inti perhitungan
  enriched.push(...langkahInti);

  // 4. Langkah observasi tambahan (untuk sulit, jika ada carry/borrow beruntun)
  if (kesulitan === 'sulit') {
    const obs = langkahObservasi(perhitungan);
    if (obs) {
      // Sisipkan observasi sebelum langkah inti terakhir jika jumlah masih kurang
      if (enriched.length < target.max - 1) {
        enriched.push(obs);
      }
    }
  }

  // 5. Langkah kesimpulan (selalu ada)
  enriched.push(langkahKesimpulan(perhitungan));

  // Isi digitAtasAktif untuk langkah deskriptif pada pengurangan
  if (perhitungan.operasi === 'pengurangan') {
    const digitsA = getDigits(perhitungan.angka1);
    const maxLen = langkahInti.find((l) => l.digitAtasAktif)?.digitAtasAktif?.length ?? digitsA.length;
    const digitAtasAwal = padDigits(digitsA, maxLen);
    
    let currentDigitAtas = [...digitAtasAwal];
    for (const l of enriched) {
      if (l.kolom !== -1 && l.digitAtasAktif) {
        currentDigitAtas = [...l.digitAtasAktif];
      } else {
        l.digitAtasAktif = [...currentDigitAtas];
      }
    }
  }

  return {
    ...perhitungan,
    langkahLangkah: enriched,
  };
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
export function getCarrySteps(perhitungan: HasilPerhitungan): { kolom: number; carry: number; barisPerkalianIdx?: number }[] {
  const lenA = getDigits(perhitungan.angka1).length;
  return perhitungan.langkahLangkah
    .filter((l) => {
      if (l.carryBaru === undefined || l.carryBaru <= 0) return false;
      // Abaikan carry dari digit terakhir perkalian parsial
      if (l.barisPerkalianIdx !== undefined && l.kolom === lenA - 1) return false;
      return true;
    })
    .map((l) => ({
      kolom: l.kolom + 1,
      carry: l.carryBaru!,
      barisPerkalianIdx: l.barisPerkalianIdx,
    }));
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
