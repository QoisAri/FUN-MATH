'use client';

// ============================================
// useAnimasi — Kontrol Animasi Step-by-Step
// ============================================
// Hook untuk mengelola animasi langkah per langkah pada mode pembelajaran.
// Auto-play dengan interval, manual prev/next, dan highlight kolom aktif.

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { solve, getCarrySteps, getBorrowSteps } from '@/lib/math-engine';
import { DELAY_ANIMASI_MS } from '@/lib/constants';
import type { Operasi, HasilPerhitungan, LangkahHitung } from '@/types/math';

interface UseAnimasiReturn {
  /** Langkah saat ini (0-indexed) */
  langkahSekarang: number;
  /** Total langkah */
  totalLangkah: number;
  /** Apakah sedang auto-play */
  isPlaying: boolean;
  /** Data langkah yang sedang ditampilkan */
  langkahAktif: LangkahHitung | null;
  /** Hasil perhitungan lengkap */
  perhitungan: HasilPerhitungan | null;
  /** Carry yang sudah terlihat sampai langkah ini */
  carryVisible: { kolom: number; carry: number }[];
  /** Borrow yang sudah terlihat sampai langkah ini */
  borrowVisible: { kolom: number; nilaiSebelum: number; nilaiSesudah: number }[];
  /** Penjelasan langkah saat ini */
  penjelasan: string;
  /** Navigasi: langkah berikutnya */
  nextStep: () => void;
  /** Navigasi: langkah sebelumnya */
  prevStep: () => void;
  /** Navigasi: ulangi dari awal */
  reset: () => void;
  /** Toggle auto-play */
  togglePlay: () => void;
  /** Set soal baru untuk animasi */
  setSoal: (angka1: number, angka2: number, operasi: Operasi) => void;
}

export function useAnimasi(): UseAnimasiReturn {
  const [angka1, setAngka1] = useState(0);
  const [angka2, setAngka2] = useState(0);
  const [operasi, setOperasi] = useState<Operasi>('penjumlahan');
  const [langkahSekarang, setLangkahSekarang] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Hitung sekali
  const perhitungan = useMemo(() => {
    if (angka1 === 0 && angka2 === 0) return null;
    return solve(angka1, angka2, operasi);
  }, [angka1, angka2, operasi]);

  const totalLangkah = perhitungan?.langkahLangkah.length ?? 0;

  const langkahAktif = perhitungan && langkahSekarang >= 0
    ? perhitungan.langkahLangkah[langkahSekarang] ?? null
    : null;

  // Carry/borrow yang visible sampai langkah ini
  const carryVisible = useMemo(() => {
    if (!perhitungan || langkahSekarang < 0) return [];
    return perhitungan.langkahLangkah
      .slice(0, langkahSekarang + 1)
      .filter((l) => l.carryBaru !== undefined && l.carryBaru > 0)
      .map((l) => ({ kolom: l.kolom, carry: l.carryBaru! }));
  }, [perhitungan, langkahSekarang]);

  const borrowVisible = useMemo(() => {
    if (!perhitungan || langkahSekarang < 0) return [];
    return perhitungan.langkahLangkah
      .slice(0, langkahSekarang + 1)
      .filter((l) => l.borrow === true)
      .map((l) => ({
        kolom: l.kolom,
        nilaiSebelum: l.nilaiSebelumBorrow ?? l.nilaiDigit1,
        nilaiSesudah: l.nilaiSetelahBorrow ?? l.nilaiDigit1 + 10,
      }));
  }, [perhitungan, langkahSekarang]);

  const penjelasan = langkahAktif?.penjelasan ?? 'Siap memulai...';

  // Auto-play interval
  useEffect(() => {
    if (isPlaying && langkahSekarang < totalLangkah - 1) {
      intervalRef.current = setInterval(() => {
        setLangkahSekarang((prev) => {
          if (prev >= totalLangkah - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, DELAY_ANIMASI_MS);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, totalLangkah, langkahSekarang]);

  // Stop auto-play when reaching the end
  useEffect(() => {
    if (langkahSekarang >= totalLangkah - 1 && isPlaying) {
      setIsPlaying(false);
    }
  }, [langkahSekarang, totalLangkah, isPlaying]);

  const nextStep = useCallback(() => {
    setLangkahSekarang((prev) => Math.min(prev + 1, totalLangkah - 1));
  }, [totalLangkah]);

  const prevStep = useCallback(() => {
    setLangkahSekarang((prev) => Math.max(prev - 1, -1));
  }, []);

  const reset = useCallback(() => {
    setLangkahSekarang(-1);
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (langkahSekarang >= totalLangkah - 1) {
      setLangkahSekarang(-1);
      setIsPlaying(true);
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [langkahSekarang, totalLangkah]);

  const setSoal = useCallback((a: number, b: number, op: Operasi) => {
    setAngka1(a);
    setAngka2(b);
    setOperasi(op);
    setLangkahSekarang(-1);
    setIsPlaying(false);
  }, []);

  return {
    langkahSekarang: Math.max(langkahSekarang, 0),
    totalLangkah,
    isPlaying,
    langkahAktif,
    perhitungan,
    carryVisible,
    borrowVisible,
    penjelasan,
    nextStep,
    prevStep,
    reset,
    togglePlay,
    setSoal,
  };
}
