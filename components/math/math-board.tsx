'use client';

// ============================================
// MathBoard — Papan Hitung Utama
// ============================================
// Komponen inti yang menampilkan soal dalam format susun ke bawah.
// 3 mode: tampil (read-only), latihan (interactive input), animasi (step-by-step).
// Semua logika kalkulasi menggunakan mathEngine — komponen hanya render.

import { useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getDigits, solve } from '@/lib/math-engine';
import { OPERASI_SIMBOL } from '@/lib/constants';
import type { Operasi, MathBoardMode, InputBoxState, HasilPerhitungan } from '@/types/math';
import InputBox from './input-box';
import CarryIndicator from './carry-indicator';
import BorrowIndicator from './borrow-indicator';
import OffsetIndicator from './offset-indicator';

interface MathBoardProps {
  angka1: number;
  angka2: number;
  operasi: Operasi;
  mode: MathBoardMode;
  /** Callback saat siswa mengisi jawaban di kolom tertentu */
  onJawaban?: (kolom: number, nilai: number) => void;
  /** Callback saat siswa mengisi jawaban simpanan di kolom tertentu */
  onCarryJawaban?: (kolom: number, nilai: number, barisIdx?: number) => void;
  /** State per kolom jawaban (mode latihan) */
  jawabanState?: { nilai: number | null; state: InputBoxState }[];
  /** State per kolom simpanan (mode latihan) */
  carryJawabanState?: { nilai: number | null; state: InputBoxState }[];
  /** State per kolom simpanan untuk perkalian parsial (mode latihan) */
  barisPerkalianCarryJawaban?: { nilai: number | null; state: InputBoxState }[][];
  /** Langkah animasi yang aktif (mode animasi) */
  langkahAktif?: number;
  /** Carry values yang visible per kolom */
  carryVisible?: { kolom: number; carry: number; barisPerkalianIdx?: number }[];
  /** Borrow values yang visible per kolom */
  borrowVisible?: { kolom: number; nilaiSebelum: number; nilaiSesudah: number }[];
  /** Override perhitungan (misal: enriched untuk mode belajar) */
  perhitunganOverride?: HasilPerhitungan;
  /** State jawaban hasil parsial perkalian (mode latihan) */
  barisPerkalianJawaban?: { nilai: number | null; state: InputBoxState }[][];
  /** Callback saat siswa mengisi jawaban hasil parsial perkalian */
  onParsialJawaban?: (barisIdx: number, kolom: number, nilai: number) => void;
}

export default function MathBoard({
  angka1,
  angka2,
  operasi,
  mode,
  onJawaban,
  onCarryJawaban,
  jawabanState,
  carryJawabanState,
  langkahAktif,
  carryVisible = [],
  borrowVisible = [],
  perhitunganOverride,
  barisPerkalianJawaban,
  barisPerkalianCarryJawaban,
  onParsialJawaban,
}: MathBoardProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Hitung hasil menggunakan math engine (atau gunakan override jika ada)
  const perhitunganRaw: HasilPerhitungan = useMemo(
    () => solve(angka1, angka2, operasi),
    [angka1, angka2, operasi]
  );
  const perhitungan = perhitunganOverride ?? perhitunganRaw;

  // Pecah angka jadi digit
  const digits1 = useMemo(() => getDigits(angka1), [angka1]);
  const digits2 = useMemo(() => getDigits(angka2), [angka2]);
  const digitsHasil = useMemo(() => getDigits(perhitungan.hasil), [perhitungan.hasil]);

  // Max kolom (termasuk kemungkinan carry tambahan)
  const maxKolom = Math.max(digits1.length, digits2.length, digitsHasil.length);

  // Pad digits agar sama panjang
  const padded1 = useMemo(() => {
    const d = [...digits1];
    while (d.length < maxKolom) d.push(0);
    return d;
  }, [digits1, maxKolom]);

  const padded2 = useMemo(() => {
    const d = [...digits2];
    while (d.length < maxKolom) d.push(0);
    return d;
  }, [digits2, maxKolom]);

  const paddedHasil = useMemo(() => {
    const d = [...digitsHasil];
    while (d.length < maxKolom) d.push(0);
    return d;
  }, [digitsHasil, maxKolom]);

  // Focus kolom berikutnya
  const focusKolom = useCallback((index: number) => {
    const nextInput = document.getElementById(`input-kolom-${index}`);
    if (nextInput) (nextInput as HTMLInputElement).focus();
  }, []);

  // Simbol operasi
  const simbol = OPERASI_SIMBOL[operasi];

  // Render baris perkalian (jika perkalian)
  const isPerkalian = operasi === 'perkalian';
  const barisPerkalian = perhitungan.barisPerkalian;

  // Menentukan baris perkalian parsial aktif pada mode latihan
  const barisLatihanAktifIdx = useMemo(() => {
    if (mode !== 'latihan' || !barisPerkalianJawaban) return 0;
    const idx = barisPerkalianJawaban.findIndex(
      (row) => !row.every((col) => col?.state === 'correct')
    );
    return idx === -1 ? 0 : idx;
  }, [mode, barisPerkalianJawaban]);

  // Cek apakah baris parsial perkalian ke-bIdx sudah selesai sepenuhnya dan benar
  const isBarisParsialSelesai = useCallback((bIdx: number): boolean => {
    if (!barisPerkalianJawaban || !barisPerkalianJawaban[bIdx]) return true;
    return barisPerkalianJawaban[bIdx].every((colState) => colState?.state === 'correct');
  }, [barisPerkalianJawaban]);

  // Cek apakah digit parsial perkalian ke-bIdx pada kolom col harus di-disable
  const isParsialDigitDisabled = useCallback((bIdx: number, col: number): boolean => {
    if (mode !== 'latihan') return false;

    // Jika baris sebelumnya belum selesai semua, baris ini disabled
    for (let b = 0; b < bIdx; b++) {
      if (!isBarisParsialSelesai(b)) return true;
    }

    // Kolom di sebelah kanan (k < col) pada baris yang sama harus selesai dengan benar
    const rowState = barisPerkalianJawaban?.[bIdx];
    if (!rowState) return false;
    for (let k = 0; k < col; k++) {
      if (rowState[k]?.state !== 'correct') return true;
    }

    // Jika ada carry yang ditargetkan ke kolom 'col' pada baris ini,
    // maka digit di kolom 'col' ini di-disable sampai carry tersebut diisi dengan benar!
    const baris = barisPerkalian?.[bIdx];
    if (baris) {
      const kolomGlobal = col + baris.offset;
      const adaCarryUntukKolomIni = carryVisible.some(
        (c) => c.kolom === kolomGlobal && c.barisPerkalianIdx === bIdx
      );
      if (adaCarryUntukKolomIni) {
        const carryState = barisPerkalianCarryJawaban?.[bIdx]?.[kolomGlobal];
        if (carryState?.state !== 'correct') return true;
      }
    }

    return false;
  }, [mode, isBarisParsialSelesai, barisPerkalianJawaban, barisPerkalian, carryVisible, barisPerkalianCarryJawaban]);

  // Pindah focus ke digit parsial berikutnya
  const focusNextParsial = useCallback((barisIdx: number, col: number) => {
    if (!barisPerkalian || !barisPerkalianJawaban) return;

    const baris = barisPerkalian[barisIdx];
    const len = baris.langkahLangkah.length;

    // Cari kolom berikutnya di baris yang sama (ke kiri = col + 1)
    if (col + 1 < len) {
      const nextCol = col + 1;
      const kolomGlobal = nextCol + baris.offset;
      const adaCarryBerikutnya = carryVisible.some(
        (c) => c.kolom === kolomGlobal && c.barisPerkalianIdx === barisIdx
      );
      if (adaCarryBerikutnya) {
        const carryState = barisPerkalianCarryJawaban?.[barisIdx]?.[kolomGlobal];
        if (carryState?.state !== 'correct') {
          const carryInput = document.getElementById(`carry-kolom-${kolomGlobal}`);
          if (carryInput) {
            carryInput.focus();
            return;
          }
        }
      }

      const nextInput = document.getElementById(`input-parsial-${barisIdx}-${nextCol}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
        return;
      }
    }

    // Jika baris yang sama sudah habis (sudah mencapai kolom paling kiri dari baris tersebut)
    // Pindah ke baris parsial berikutnya (barisIdx + 1) pada kolom paling kanan (col = 0)
    if (barisIdx + 1 < barisPerkalian.length) {
      const nextInput = document.getElementById(`input-parsial-${barisIdx + 1}-0`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
        return;
      }
    }

    // Jika seluruh baris parsial sudah selesai, pindah ke input hasil akhir kolom 0
    const finalInput = document.getElementById(`input-kolom-0`);
    if (finalInput) {
      (finalInput as HTMLInputElement).focus();
    }
  }, [barisPerkalian, barisPerkalianJawaban, carryVisible, barisPerkalianCarryJawaban]);

  // Cari carry/borrow untuk kolom tertentu
  const getCarryForKolom = (kolom: number) => {
    if (mode === 'latihan' && operasi === 'perkalian') {
      const semuaParsialSelesai = barisPerkalianJawaban?.every(
        (row) => row.every((colState) => colState?.state === 'correct')
      );
      if (semuaParsialSelesai) {
        return carryVisible.find(
          (c) => c.kolom === kolom && c.barisPerkalianIdx === undefined
        );
      }
      return carryVisible.find(
        (c) => c.kolom === kolom && c.barisPerkalianIdx === barisLatihanAktifIdx
      );
    }
    if (langkahAktif === undefined) {
      return carryVisible.find((c) => c.kolom === kolom);
    }
    const langkah = perhitungan.langkahLangkah[langkahAktif];
    const activeBarisIdx = langkah?.barisPerkalianIdx;

    return carryVisible.find(
      (c) => c.kolom === kolom && c.barisPerkalianIdx === activeBarisIdx
    );
  };
  const getBorrowForKolom = (kolom: number) =>
    borrowVisible.find((b) => b.kolom === kolom);

  // Cek apakah kolom k sudah selesai dengan benar (jawaban utama + carry tujuan)
  const isKolomSelesai = useCallback((k: number): boolean => {
    const jawabanBenar = jawabanState?.[k]?.state === 'correct';
    if (!jawabanBenar) return false;

    const carryTujuan = k + 1;
    // Jika perkalian, hanya cek carry hasil akhir (yang barisPerkalianIdx === undefined)
    const adaCarry = carryVisible.some(
      (c) => c.kolom === carryTujuan && (operasi !== 'perkalian' || c.barisPerkalianIdx === undefined)
    );
    if (adaCarry) {
      const carryBenar = carryJawabanState?.[carryTujuan]?.state === 'correct';
      if (!carryBenar) return false;
    }

    return true;
  }, [jawabanState, carryJawabanState, carryVisible, operasi]);

  // Cek apakah jawaban di kolom ini harus di-disable
  const isJawabanDisabled = useCallback((kolom: number): boolean => {
    if (mode !== 'latihan') return false;

    // Untuk perkalian bertingkat, hasil akhir di bawah baru boleh diisi jika semua baris parsial selesai
    if (operasi === 'perkalian' && barisPerkalian && barisPerkalian.length > 1) {
      for (let b = 0; b < barisPerkalian.length; b++) {
        if (!isBarisParsialSelesai(b)) return true;
      }
    }

    // Kolom satuan (paling kanan) tidak pernah di-disable jika prasyarat di atas terpenuhi
    if (kolom === 0) return false;
    // Semua kolom di sebelah kanan (k < kolom) harus selesai
    for (let k = 0; k < kolom; k++) {
      if (!isKolomSelesai(k)) return true;
    }
    return false;
  }, [mode, operasi, barisPerkalian, isBarisParsialSelesai, isKolomSelesai]);

  // Cek apakah carry di kolom ini harus di-disable
  const isCarryDisabled = useCallback((kolom: number): boolean => {
    if (mode !== 'latihan') return false;

    if (operasi === 'perkalian') {
      if (kolom <= 1) return false;
      const rowState = barisPerkalianJawaban?.[barisLatihanAktifIdx];
      if (!rowState) return false;
      // Cek apakah digit perkalian parsial kolom - 1 di baris aktif sudah diisi benar
      for (let k = 0; k < kolom - 1; k++) {
        if (rowState[k]?.state !== 'correct') return true;
      }
      return false;
    }

    // Carry kolom 1 (puluhan, dihasilkan dari satuan) tidak pernah di-disable
    if (kolom <= 1) return false;
    // Semua kolom sebelum kolom - 1 harus selesai
    for (let k = 0; k < kolom - 1; k++) {
      if (!isKolomSelesai(k)) return true;
    }
    return false;
  }, [mode, operasi, barisLatihanAktifIdx, barisPerkalianJawaban, isKolomSelesai]);

  // Cek highlight per baris pada langkah aktif
  const getHighlightForBaris = (baris: 1 | 2, kolom: number): boolean => {
    if (langkahAktif === undefined) return false;
    const langkah = perhitungan.langkahLangkah[langkahAktif];
    if (!langkah) return false;
    // Jika ada penentuan highlight spesifik per baris, gunakan itu secara mutlak
    if (baris === 1 && langkah.highlightBaris1 !== undefined) {
      return langkah.highlightBaris1.includes(kolom);
    }
    if (baris === 2 && langkah.highlightBaris2 !== undefined) {
      return langkah.highlightBaris2.includes(kolom);
    }
    // Cek kolom utama (berlaku untuk kedua baris sebagai fallback)
    if (langkah.kolom === kolom) return true;
    return false;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="inline-flex flex-col items-end gap-1 p-6 bg-card rounded-2xl shadow-lg border border-border"
    >
      {/* ============================================
          Baris Carry/Borrow Indicators
          ============================================ */}
      <div className="flex gap-0.5 justify-end" style={{ minHeight: '1.25rem' }}>
        {/* Spacer untuk simbol operasi */}
        <div className="w-8" />
        {[...Array(maxKolom)].map((_, i) => {
          const kolom = maxKolom - 1 - i;
          const carry = getCarryForKolom(kolom);
          const borrow = getBorrowForKolom(kolom);
          const semuaParsialSelesai = mode === 'latihan' && operasi === 'perkalian' && barisPerkalianJawaban?.every(
            (row) => row.every((colState) => colState?.state === 'correct')
          );
          const cState = mode === 'latihan' && operasi === 'perkalian'
            ? (semuaParsialSelesai ? carryJawabanState?.[kolom] : barisPerkalianCarryJawaban?.[barisLatihanAktifIdx]?.[kolom])
            : carryJawabanState?.[kolom];
          const isCarryActive = (() => {
            if (langkahAktif === undefined) return false;
            if (langkahAktif === perhitungan.langkahLangkah.length - 1) return false;
            const langkah = perhitungan.langkahLangkah[langkahAktif];
            if (!langkah) return false;

            const isNewlyGenerated =
              langkah.kolom === kolom - 1 &&
              langkah.carryBaru !== undefined &&
              langkah.carryBaru > 0;

            const isBeingUsed =
              langkah.kolom === kolom &&
              langkah.carry !== undefined &&
              langkah.carry > 0;

            return isNewlyGenerated || isBeingUsed;
          })();

          return (
            <div key={`indicator-${kolom}`} className="math-digit relative flex justify-center items-end" style={{ height: '2rem' }}>
              {carry && (
                mode === 'latihan' ? (
                  <div className="absolute bottom-0 scale-75 origin-bottom">
                    <InputBox
                      id={`carry-kolom-${kolom}`}
                      state={cState?.state ?? 'idle'}
                      nilai={cState?.nilai ?? null}
                      onChange={(nilai) => {
                        onCarryJawaban?.(
                          kolom,
                          nilai,
                          (operasi === 'perkalian' && !semuaParsialSelesai) ? barisLatihanAktifIdx : undefined
                        );
                      }}
                      disabled={isCarryDisabled(kolom)}
                      onFocusNext={() => {
                        const inputId = operasi === 'perkalian' && !semuaParsialSelesai
                          ? `input-parsial-${barisLatihanAktifIdx}-${kolom}`
                          : `input-kolom-${kolom}`;
                        const nextInput = document.getElementById(inputId);
                        if (nextInput) (nextInput as HTMLInputElement).focus();
                      }}
                    />
                  </div>
                ) : (
                  <CarryIndicator nilai={carry.carry} isNew={isCarryActive} />
                )
              )}
              {borrow && (
                <BorrowIndicator
                  nilaiAsli={borrow.nilaiSebelum}
                  nilaiBaru={borrow.nilaiSesudah}
                  onlyNewValue={true}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ============================================
          Baris Angka 1 (atas)
          ============================================ */}
      <div className="flex gap-0.5 justify-end">
        {/* Spacer untuk simbol */}
        <div className="w-8" />
        {[...Array(maxKolom)].map((_, i) => {
          const kolom = maxKolom - 1 - i;
          const digit = padded1[kolom];
          const isLeading = kolom >= digits1.length;
          const borrow = getBorrowForKolom(kolom);

          return (
            <motion.div
              key={`d1-${kolom}`}
              className="math-digit"
              animate={
                getHighlightForBaris(1, kolom)
                  ? { backgroundColor: 'hsla(249, 47%, 90%, 1)' }
                  : { backgroundColor: 'hsla(249, 47%, 90%, 0)' }
              }
            >
              {!isLeading && (
                borrow ? (
                  <span className="borrow-strikethrough text-muted-foreground opacity-60">{digit}</span>
                ) : (
                  digit
                )
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ============================================
          Baris Angka 2 (bawah) + Simbol Operasi
          ============================================ */}
      <div className="flex gap-0.5 justify-end">
        {/* Simbol operasi */}
        <div className="w-8 flex items-center justify-center font-bold text-xl" style={{ color: 'var(--primary)' }}>
          {simbol}
        </div>
        {[...Array(maxKolom)].map((_, i) => {
          const kolom = maxKolom - 1 - i;
          const digit = padded2[kolom];
          const isLeading = kolom >= digits2.length;

          return (
            <motion.div
              key={`d2-${kolom}`}
              className="math-digit"
              animate={
                getHighlightForBaris(2, kolom)
                  ? { backgroundColor: 'hsla(249, 47%, 90%, 1)' }
                  : { backgroundColor: 'hsla(249, 47%, 90%, 0)' }
              }
            >
              {!isLeading && digit}
            </motion.div>
          );
        })}
      </div>

      {/* ============================================
          Garis Pemisah
          ============================================ */}
      <div className="math-separator my-1" />

      {/* ============================================
          PERKALIAN: Baris-baris Hasil Parsial
          ============================================ */}
      {isPerkalian && barisPerkalian && barisPerkalian.length > 1 && (() => {
        // Cari barisAktifMaks
        const barisAktifMaks = barisPerkalian.reduce((max, _, idx) => {
          const aktif = mode !== 'animasi' ||
            (langkahAktif !== undefined &&
              perhitungan.langkahLangkah
                .slice(0, langkahAktif + 1)
                .some(
                  (l) =>
                    l.barisPerkalianIdx === idx ||
                    (l.barisPerkalianIdx === undefined && l.kolom !== -1)
                ));
          return aktif ? idx : max;
        }, -1);

        return (
          <>
            {barisPerkalian.map((baris, barisIdx) => {
              const digitsBaris = baris.langkahLangkah.map((l) => l.hasil);
              const totalWidth = digitsBaris.length + baris.offset;

              const isBarisAktif = barisIdx <= barisAktifMaks;
              if (!isBarisAktif) return null;

              return (
                <div key={`baris-${barisIdx}`} className="flex gap-0.5 justify-end items-center">
                  <div className="w-8 flex items-center justify-center font-bold text-lg text-muted-foreground">
                    {barisIdx === barisAktifMaks ? '+' : ''}
                  </div>
                  {/* Padding kiri agar rata kanan */}
                  {[...Array(Math.max(0, maxKolom - totalWidth))].map((_, i) => (
                    <div key={`pad-${i}`} className="math-digit" />
                  ))}
                  {/* Digit hasil parsial (reversed untuk display) */}
                  {[...digitsBaris].reverse().map((d, i) => {
                    const c = digitsBaris.length - 1 - i;
                    
                    if (mode === 'latihan' && barisPerkalianJawaban) {
                      const digitState = barisPerkalianJawaban[barisIdx]?.[c];
                      return (
                        <InputBox
                          key={`baris-${barisIdx}-input-${c}`}
                          id={`input-parsial-${barisIdx}-${c}`}
                          state={digitState?.state ?? 'idle'}
                          nilai={digitState?.nilai ?? null}
                          onChange={(nilai) => onParsialJawaban?.(barisIdx, c, nilai)}
                          disabled={isParsialDigitDisabled(barisIdx, c)}
                          onFocusNext={() => focusNextParsial(barisIdx, c)}
                          autoFocus={barisIdx === 0 && c === 0 && !digitState?.nilai}
                        />
                      );
                    }

                    const isDigitRevealed =
                      mode !== 'animasi' ||
                      (langkahAktif !== undefined &&
                        perhitungan.langkahLangkah
                          .slice(0, langkahAktif + 1)
                          .some(
                            (l) =>
                              (l.barisPerkalianIdx === barisIdx && l.kolom === c) ||
                              (l.barisPerkalianIdx === undefined && l.kolom !== -1)
                          ));

                    const langkah = langkahAktif !== undefined ? perhitungan.langkahLangkah[langkahAktif] : null;
                    const isPenjumlahanParsial =
                      langkah &&
                      operasi === 'perkalian' &&
                      langkah.barisPerkalianIdx === undefined &&
                      langkah.kolom !== -1;
                    
                    const isDigitHighlighted =
                      isPenjumlahanParsial && langkah && langkah.kolom === c + baris.offset;

                    const isBarisSedangDihitung =
                      langkah && langkah.barisPerkalianIdx === barisIdx;

                    return (
                      <motion.div
                        key={`baris-${barisIdx}-digit-${i}`}
                        initial={{ opacity: 0 }}
                        animate={
                          isDigitHighlighted
                            ? { opacity: 1, backgroundColor: 'hsla(249, 47%, 90%, 1)' }
                            : { opacity: 1, backgroundColor: 'hsla(249, 47%, 90%, 0)' }
                        }
                        transition={{ duration: 0.2 }}
                        className="math-digit"
                        style={{
                          color: isBarisSedangDihitung ? 'var(--primary)' : 'inherit',
                        }}
                      >
                        {isDigitRevealed ? d : ''}
                      </motion.div>
                    );
                  })}
                  {/* Offset placeholders */}
                  {baris.offset > 0 && (
                    <OffsetIndicator offset={baris.offset} baris={barisIdx} />
                  )}
                </div>
              );
            })}

            {/* Garis pemisah kedua (sebelum hasil akhir) */}
            <div className="math-separator my-1" />
          </>
        );
      })()}

      {/* ============================================
          Baris Hasil / Input Jawaban
          ============================================ */}
      <AnimatePresence mode="wait">
        <div className="flex gap-0.5 justify-end">
          {/* Spacer */}
          <div className="w-8" />
          {[...Array(maxKolom)].map((_, i) => {
            const kolom = maxKolom - 1 - i;

            // Mode TAMPIL: tampilkan digit hasil langsung
            if (mode === 'tampil') {
              const isLeading = kolom >= digitsHasil.length;
              return (
                <motion.div
                  key={`hasil-${kolom}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="math-digit font-extrabold"
                  style={{ color: 'var(--primary)' }}
                >
                  {!isLeading && paddedHasil[kolom]}
                </motion.div>
              );
            }

            // Mode ANIMASI: tampilkan digit sesuai langkah aktif
            if (mode === 'animasi') {
              const isRevealed =
                langkahAktif !== undefined &&
                perhitungan.langkahLangkah
                  .slice(0, langkahAktif + 1)
                  .some((l) =>
                    operasi === 'perkalian'
                      ? l.barisPerkalianIdx === undefined && l.kolom === kolom
                      : l.kolom === kolom
                  );

              return (
                <motion.div
                  key={`animasi-${kolom}`}
                  className="math-digit font-extrabold"
                  style={{ color: 'var(--primary)' }}
                >
                  {isRevealed ? paddedHasil[kolom] : ''}
                </motion.div>
              );
            }

            // Mode LATIHAN: InputBox per kolom
            const kolomState = jawabanState?.[kolom];
            const isLeading = kolom >= digitsHasil.length;
            if (isLeading) return <div key={`empty-${kolom}`} className="math-digit" />;

            return (
              <InputBox
                key={`input-${kolom}`}
                id={`input-kolom-${kolom}`}
                state={kolomState?.state ?? 'idle'}
                nilai={kolomState?.nilai ?? null}
                onChange={(nilai) => onJawaban?.(kolom, nilai)}
                disabled={isJawabanDisabled(kolom)}
                onFocusNext={() => {
                  // Cari kolom berikutnya yang belum terjawab (ke kiri = index lebih besar)
                  for (let next = kolom + 1; next < maxKolom; next++) {
                    if (
                      next < digitsHasil.length &&
                      jawabanState?.[next]?.state !== 'correct'
                    ) {
                      // Cek apakah kolom berikutnya punya input simpanan yang belum diisi
                      if (mode === 'latihan' && carryJawabanState) {
                        const carry = getCarryForKolom(next);
                        const cState = carryJawabanState[next];
                        if (carry && cState?.state !== 'correct') {
                          const carryInput = document.getElementById(`carry-kolom-${next}`);
                          if (carryInput) {
                            (carryInput as HTMLInputElement).focus();
                            return;
                          }
                        }
                      }
                      focusKolom(next);
                      return;
                    }
                  }
                }}
                autoFocus={kolom === 0 && !kolomState?.nilai && !isPerkalian}
              />
            );
          })}
        </div>
      </AnimatePresence>
    </motion.div>
  );
}
