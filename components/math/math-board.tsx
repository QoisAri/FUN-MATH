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
  /** State per kolom jawaban (mode latihan) */
  jawabanState?: { nilai: number | null; state: InputBoxState }[];
  /** Langkah animasi yang aktif (mode animasi) */
  langkahAktif?: number;
  /** Carry values yang visible per kolom */
  carryVisible?: { kolom: number; carry: number }[];
  /** Borrow values yang visible per kolom */
  borrowVisible?: { kolom: number; nilaiSebelum: number; nilaiSesudah: number }[];
}

export default function MathBoard({
  angka1,
  angka2,
  operasi,
  mode,
  onJawaban,
  jawabanState,
  langkahAktif,
  carryVisible = [],
  borrowVisible = [],
}: MathBoardProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Hitung hasil menggunakan math engine
  const perhitungan: HasilPerhitungan = useMemo(
    () => solve(angka1, angka2, operasi),
    [angka1, angka2, operasi]
  );

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

  // Cari carry/borrow untuk kolom tertentu
  const getCarryForKolom = (kolom: number) =>
    carryVisible.find((c) => c.kolom === kolom);
  const getBorrowForKolom = (kolom: number) =>
    borrowVisible.find((b) => b.kolom === kolom);

  // Render baris perkalian (jika perkalian)
  const isPerkalian = operasi === 'perkalian';
  const barisPerkalian = perhitungan.barisPerkalian;

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

          return (
            <div key={`indicator-${kolom}`} className="math-digit relative" style={{ height: '1.25rem' }}>
              {carry && <CarryIndicator nilai={carry.carry} />}
              {borrow && (
                <BorrowIndicator
                  nilaiAsli={borrow.nilaiSebelum}
                  nilaiBaru={borrow.nilaiSesudah}
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

          return (
            <motion.div
              key={`d1-${kolom}`}
              className="math-digit"
              animate={
                langkahAktif !== undefined &&
                perhitungan.langkahLangkah[langkahAktif]?.kolom === kolom
                  ? { backgroundColor: 'oklch(0.93 0.04 260)' }
                  : {}
              }
            >
              {!isLeading && digit}
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
                langkahAktif !== undefined &&
                perhitungan.langkahLangkah[langkahAktif]?.kolom === kolom
                  ? { backgroundColor: 'oklch(0.93 0.04 260)' }
                  : {}
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
      {isPerkalian && barisPerkalian && barisPerkalian.length > 1 && (
        <>
          {barisPerkalian.map((baris, barisIdx) => {
            const digitsBaris = getDigits(baris.hasilParsial);
            const totalWidth = digitsBaris.length + baris.offset;

            return (
              <div key={`baris-${barisIdx}`} className="flex gap-0.5 justify-end items-center">
                <div className="w-8" />
                {/* Padding kiri agar rata kanan */}
                {[...Array(Math.max(0, maxKolom - totalWidth))].map((_, i) => (
                  <div key={`pad-${i}`} className="math-digit" />
                ))}
                {/* Digit hasil parsial (reversed untuk display) */}
                {[...digitsBaris].reverse().map((d, i) => (
                  <motion.div
                    key={`baris-${barisIdx}-digit-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: barisIdx * 0.3 + i * 0.05 }}
                    className="math-digit"
                  >
                    {d}
                  </motion.div>
                ))}
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
      )}

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
                  .some((l) => l.kolom === kolom);

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
                onFocusNext={() => {
                  // Cari kolom berikutnya yang belum terjawab (ke kiri = index lebih besar)
                  for (let next = kolom + 1; next < maxKolom; next++) {
                    if (
                      next < digitsHasil.length &&
                      jawabanState?.[next]?.state !== 'correct'
                    ) {
                      focusKolom(next);
                      return;
                    }
                  }
                }}
                autoFocus={kolom === 0 && !kolomState?.nilai}
              />
            );
          })}
        </div>
      </AnimatePresence>
    </motion.div>
  );
}
