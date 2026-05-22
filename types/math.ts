// ============================================
// Type Definitions — Logika Matematika
// ============================================

/** Jenis operasi hitung yang didukung */
export type Operasi = 'penjumlahan' | 'pengurangan' | 'perkalian';

/** Tingkat kesulitan soal */
export type Kesulitan = 'mudah' | 'sedang' | 'sulit';

/** State visual kotak input per kolom */
export type InputBoxState = 'idle' | 'focused' | 'correct' | 'wrong' | 'hint' | 'revealed';

/** Mode tampilan MathBoard */
export type MathBoardMode = 'tampil' | 'latihan' | 'animasi';

/** State machine alur latihan (AGENTS.md Section 8) */
export type LatihanState = 'IDLE' | 'MENGERJAKAN' | 'WRONG' | 'SELESAI_BENAR' | 'REVEALED';

// ============================================
// Interfaces — Langkah Perhitungan
// ============================================

/** Satu langkah perhitungan pada kolom tertentu */
export interface LangkahHitung {
  /** Index kolom (0 = satuan, 1 = puluhan, 2 = ratusan) */
  kolom: number;
  /** Digit dari angka1 di kolom ini */
  nilaiDigit1: number;
  /** Digit dari angka2 di kolom ini */
  nilaiDigit2: number;
  /** Carry masuk dari kolom sebelumnya (penjumlahan/perkalian) */
  carry?: number;
  /** Apakah terjadi borrow dari kolom ini (pengurangan) */
  borrow?: boolean;
  /** Angka asli sebelum dipinjam (untuk visualisasi coret) */
  nilaiSebelumBorrow?: number;
  /** Angka setelah dipinjam */
  nilaiSetelahBorrow?: number;
  /** Hasil digit di kolom ini */
  hasil: number;
  /** Carry keluar ke kolom berikutnya */
  carryBaru?: number;
  /** Penjelasan singkat langkah ini (≤ 10 kata, Bahasa Indonesia) */
  penjelasan: string;
}

/** Satu baris hasil perkalian parsial */
export interface BarisPerkalian {
  /** Index digit pengali (0 = satuan pengali, 1 = puluhan pengali) */
  indexPengali: number;
  /** Digit pengali yang digunakan */
  digitPengali: number;
  /** Hasil perkalian parsial (sebelum offset) */
  hasilParsial: number;
  /** Jumlah offset posisi ke kiri (= indexPengali) */
  offset: number;
  /** Digit-digit hasil (sudah termasuk trailing zeros dari offset) */
  digits: number[];
  /** Langkah-langkah perhitungan per kolom dalam baris ini */
  langkahLangkah: LangkahHitung[];
}

/** Hasil lengkap satu perhitungan */
export interface HasilPerhitungan {
  angka1: number;
  angka2: number;
  operasi: Operasi;
  hasil: number;
  /** Langkah-langkah perhitungan kolom per kolom */
  langkahLangkah: LangkahHitung[];
  /** Khusus perkalian: baris-baris hasil parsial */
  barisPerkalian?: BarisPerkalian[];
  /** Khusus perkalian: langkah penjumlahan baris-baris parsial */
  langkahPenjumlahan?: LangkahHitung[];
}

// ============================================
// Interfaces — Soal & Jawaban
// ============================================

/** Satu soal matematika */
export interface Soal {
  angka1: number;
  angka2: number;
  operasi: Operasi;
  kesulitan: Kesulitan;
}

/** Jawaban siswa per kolom */
export interface JawabanKolom {
  kolom: number;
  nilai: number | null;
  state: InputBoxState;
  jumlahPercobaan: number;
}

/** Rekap satu soal yang dikerjakan */
export interface RekapSoal {
  soal: Soal;
  jawabanSiswa: JawabanKolom[];
  status: 'benar' | 'salah' | 'diungkap';
  jumlahPercobaan: number;
  waktuDetik: number;
}

/** Rekap satu sesi latihan */
export interface RekapSesi {
  siswaId: string;
  operasi: Operasi;
  totalSoal: number;
  benar: number;
  salah: number;
  skor: number;
  durasiDetik: number;
  detailSoal: RekapSoal[];
}
