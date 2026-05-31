'use client';

// ============================================
// useLatihan — State Machine Alur Latihan
// ============================================
// Mengimplementasikan alur latihan sesuai AGENTS.md Section 8:
// IDLE → MENGERJAKAN → WRONG (percobaan < 3 → hint → MENGERJAKAN)
//                          → WRONG (percobaan ≥ 3 → REVEALED)
//      → SELESAI_BENAR → simpan ke DB → rekap → soal berikutnya
//      → LEWATI → REVEALED → soal berikutnya

import { useState, useCallback, useMemo } from 'react';
import { solve, validateColumn, getDigits, getCarrySteps, getBorrowSteps } from '@/lib/math-engine';
import { MAX_PERCOBAAN } from '@/lib/constants';
import type { LatihanState, InputBoxState, Operasi, Soal, RekapSoal } from '@/types/math';

interface JawabanKolomState {
  nilai: number | null;
  state: InputBoxState;
  jumlahPercobaan: number;
}

interface UseLatihanReturn {
  /** State machine saat ini */
  state: LatihanState;
  /** State per kolom jawaban */
  jawabanState: JawabanKolomState[];
  /** State per kolom simpanan (carry) */
  carryJawabanState: JawabanKolomState[];
  /** Soal yang sedang dikerjakan */
  soalAktif: Soal | null;
  /** Index soal saat ini */
  indexSoal: number;
  /** Total soal dalam sesi */
  totalSoal: number;
  /** Rekap semua soal yang sudah dikerjakan */
  rekap: RekapSoal[];
  /** Carry visible untuk MathBoard */
  carryVisible: { kolom: number; carry: number }[];
  /** Borrow visible untuk MathBoard */
  borrowVisible: { kolom: number; nilaiSebelum: number; nilaiSesudah: number }[];
  /** Feedback message */
  feedbackPesan: string;
  /** Feedback hint */
  feedbackHint: string;
  /** Kolom yang salah */
  kolomSalah: number | null;
  /** Percobaan saat ini untuk kolom aktif */
  percobaanAktif: number;
  /** Timer detik */
  waktuDetik: number;
  /** Mulai sesi baru */
  mulaiSesi: (daftarSoal: Soal[]) => void;
  /** Handle jawaban di kolom tertentu */
  isiJawaban: (kolom: number, nilai: number) => void;
  /** Handle jawaban simpanan di kolom tertentu */
  isiCarryJawaban: (kolom: number, nilai: number) => void;
  /** Lewati soal */
  lewatiSoal: () => void;
  /** Coba lagi kolom yang salah */
  cobaLagi: () => void;
  /** Lihat cara penyelesaian (reveal semua) */
  lihatCara: () => void;
  /** Tutup feedback */
  tutupFeedback: () => void;
  /** Lanjut ke soal berikutnya */
  soalBerikutnya: () => void;
  /** Apakah semua soal sudah selesai */
  sesiSelesai: boolean;
}

export function useLatihan(): UseLatihanReturn {
  const [state, setState] = useState<LatihanState>('IDLE');
  const [daftarSoal, setDaftarSoal] = useState<Soal[]>([]);
  const [indexSoal, setIndexSoal] = useState(0);
  const [jawabanState, setJawabanState] = useState<JawabanKolomState[]>([]);
  const [carryJawabanState, setCarryJawabanState] = useState<JawabanKolomState[]>([]);
  const [rekap, setRekap] = useState<RekapSoal[]>([]);
  const [feedbackPesan, setFeedbackPesan] = useState('');
  const [feedbackHint, setFeedbackHint] = useState('');
  const [kolomSalah, setKolomSalah] = useState<number | null>(null);
  const [waktuMulai, setWaktuMulai] = useState(0);
  const [waktuDetik, setWaktuDetik] = useState(0);

  const soalAktif = daftarSoal[indexSoal] ?? null;
  const sesiSelesai = indexSoal >= daftarSoal.length && daftarSoal.length > 0;

  // Hitung hasil soal aktif
  const perhitungan = useMemo(() => {
    if (!soalAktif) return null;
    return solve(soalAktif.angka1, soalAktif.angka2, soalAktif.operasi);
  }, [soalAktif]);

  const digitsHasil = useMemo(() => {
    if (!perhitungan) return [];
    return getDigits(perhitungan.hasil);
  }, [perhitungan]);

  // Carry/borrow visibility
  const carryVisible = useMemo(() => {
    if (!perhitungan || soalAktif?.operasi === 'pengurangan') return [];
    return getCarrySteps(perhitungan);
  }, [perhitungan, soalAktif]);

  const borrowVisible = useMemo(() => {
    if (!perhitungan || soalAktif?.operasi !== 'pengurangan') return [];
    return getBorrowSteps(perhitungan);
  }, [perhitungan, soalAktif]);

  // Percobaan aktif (untuk kolom yang salah)
  const percobaanAktif = kolomSalah !== null
    ? (jawabanState[kolomSalah]?.jumlahPercobaan ?? 0)
    : 0;

  /** Inisialisasi jawaban state untuk soal baru */
  const initJawaban = useCallback((soal: Soal) => {
    const hasil = solve(soal.angka1, soal.angka2, soal.operasi);
    const digits = getDigits(hasil.hasil);
    const jawaban: JawabanKolomState[] = digits.map(() => ({
      nilai: null,
      state: 'idle' as InputBoxState,
      jumlahPercobaan: 0,
    }));
    const carryJawaban: JawabanKolomState[] = digits.map(() => ({
      nilai: null,
      state: 'idle' as InputBoxState,
      jumlahPercobaan: 0,
    }));
    setJawabanState(jawaban);
    setCarryJawabanState(carryJawaban);
    setFeedbackPesan('');
    setFeedbackHint('');
    setKolomSalah(null);
  }, []);

  /** Mulai sesi baru */
  const mulaiSesi = useCallback((soalList: Soal[]) => {
    setDaftarSoal(soalList);
    setIndexSoal(0);
    setRekap([]);
    setWaktuMulai(Date.now());
    setWaktuDetik(0);
    setState('MENGERJAKAN');
    if (soalList.length > 0) {
      initJawaban(soalList[0]);
    }
  }, [initJawaban]);

  /** Handle jawaban siswa di kolom tertentu */
  const isiJawaban = useCallback((kolom: number, nilai: number) => {
    if (!perhitungan || state !== 'MENGERJAKAN') return;

    const nilaiBenar = digitsHasil[kolom];
    const isBenar = validateColumn(nilai, nilaiBenar);

    setJawabanState((prev) => {
      const updated = [...prev];
      const current = { ...updated[kolom] };
      current.nilai = nilai;
      current.jumlahPercobaan += 1;

      if (isBenar) {
        current.state = 'correct';
      } else {
        current.state = 'wrong';
      }

      updated[kolom] = current;
      return updated;
    });

    if (isBenar) {
      setJawabanState((prev) => {
        const semuaBenar = prev.every(
          (j, i) => i === kolom ? true : j.state === 'correct'
        );

        if (semuaBenar) {
          setState('SELESAI_BENAR');
          const waktu = Math.round((Date.now() - waktuMulai) / 1000);
          setWaktuDetik(waktu);
          setRekap((r) => [
            ...r,
            {
              soal: soalAktif!,
              jawabanSiswa: prev.map((j) => ({
                kolom: 0,
                nilai: j.nilai,
                state: j.state,
                jumlahPercobaan: j.jumlahPercobaan,
              })),
              status: 'benar',
              jumlahPercobaan: Math.max(...prev.map((j) => j.jumlahPercobaan)),
              waktuDetik: waktu,
            },
          ]);
        }

        return prev;
      });
    } else {
      setKolomSalah(kolom);
      setState('WRONG');

      const percobaan = (jawabanState[kolom]?.jumlahPercobaan ?? 0) + 1;

      if (percobaan >= MAX_PERCOBAAN) {
        setFeedbackPesan('Jawaban akan ditampilkan');
        setFeedbackHint('');
      } else {
        setFeedbackPesan('Belum tepat, coba lagi!');
        if (soalAktif?.operasi === 'penjumlahan') {
          const carry = carryVisible.find((c) => c.kolom === kolom - 1);
          if (carry) {
            setFeedbackHint(`Jangan lupa simpanan ${carry.carry} dari kolom sebelumnya`);
          } else {
            setFeedbackHint('Hitung kembali digit ini');
          }
        } else if (soalAktif?.operasi === 'pengurangan') {
          const borrow = borrowVisible.find((b) => b.kolom === kolom);
          if (borrow) {
            setFeedbackHint('Perlu pinjam dari kolom sebelah');
          } else {
            setFeedbackHint('Hitung kembali digit ini');
          }
        } else {
          setFeedbackHint('Periksa perkalian digit ini');
        }
      }
    }
  }, [perhitungan, state, digitsHasil, jawabanState, soalAktif, carryVisible, borrowVisible, waktuMulai]);

  /** Handle jawaban siswa untuk simpanan (carry) */
  const isiCarryJawaban = useCallback((kolom: number, nilai: number) => {
    if (!perhitungan || state !== 'MENGERJAKAN') return;

    const expectedCarry = carryVisible.find((c) => c.kolom === kolom)?.carry;
    if (expectedCarry === undefined) return;

    const isBenar = validateColumn(nilai, expectedCarry);

    setCarryJawabanState((prev) => {
      const updated = [...prev];
      if (!updated[kolom]) {
        updated[kolom] = { nilai: null, state: 'idle', jumlahPercobaan: 0 };
      }
      const current = { ...updated[kolom] };
      current.nilai = nilai;
      current.jumlahPercobaan += 1;

      if (isBenar) {
        current.state = 'correct';
      } else {
        current.state = 'wrong';
      }

      updated[kolom] = current;
      return updated;
    });

    if (!isBenar) {
      setKolomSalah(kolom);
      setState('WRONG');

      const percobaan = (carryJawabanState[kolom]?.jumlahPercobaan ?? 0) + 1;

      if (percobaan >= MAX_PERCOBAAN) {
        setFeedbackPesan('Jawaban akan ditampilkan');
        setFeedbackHint('');
      } else {
        setFeedbackPesan('Simpanan belum tepat, coba lagi!');
        setFeedbackHint('Hitung kembali nilai simpanan di atas');
      }
    }
  }, [perhitungan, state, carryVisible, carryJawabanState]);

  /** Coba lagi kolom yang salah */
  const cobaLagi = useCallback(() => {
    setJawabanState((prev) => 
      prev.map(j => j.state === 'wrong' ? { ...j, nilai: null, state: 'hint' } : j)
    );
    setCarryJawabanState((prev) => 
      prev.map(c => c?.state === 'wrong' ? { ...c, nilai: null, state: 'hint' } : c)
    );

    setState('MENGERJAKAN');
    setFeedbackPesan('');

    // Focus kembali ke kolom yang salah
    setTimeout(() => {
      // Cari jika ada carry yang salah
      const wrongCarryIdx = carryJawabanState.findIndex(c => c?.state === 'wrong');
      if (wrongCarryIdx !== -1) {
        const input = document.getElementById(`carry-kolom-${wrongCarryIdx}`);
        if (input) (input as HTMLInputElement).focus();
        return;
      }
      
      const wrongIdx = jawabanState.findIndex(j => j.state === 'wrong');
      if (wrongIdx !== -1) {
        const input = document.getElementById(`input-kolom-${wrongIdx}`);
        if (input) (input as HTMLInputElement).focus();
      }
    }, 100);
  }, [jawabanState, carryJawabanState]);

  /** Lihat cara penyelesaian (reveal semua) */
  const lihatCara = useCallback(() => {
    setJawabanState((prev) =>
      prev.map((j, i) => ({
        ...j,
        nilai: digitsHasil[i],
        state: 'revealed' as InputBoxState,
      }))
    );
    setCarryJawabanState((prev) =>
      prev.map((c, i) => {
        const expectedCarry = carryVisible.find(cv => cv.kolom === i)?.carry;
        if (expectedCarry !== undefined) {
          return { ...c, nilai: expectedCarry, state: 'revealed' as InputBoxState };
        }
        return c;
      })
    );
    setState('REVEALED');
    setFeedbackPesan('');

    // Simpan rekap sebagai "diungkap"
    const waktu = Math.round((Date.now() - waktuMulai) / 1000);
    setWaktuDetik(waktu);
    setRekap((r) => [
      ...r,
      {
        soal: soalAktif!,
        jawabanSiswa: jawabanState.map((j) => ({
          kolom: 0,
          nilai: j.nilai,
          state: j.state,
          jumlahPercobaan: j.jumlahPercobaan,
        })),
        status: 'diungkap',
        jumlahPercobaan: MAX_PERCOBAAN,
        waktuDetik: waktu,
      },
    ]);
  }, [digitsHasil, soalAktif, jawabanState, waktuMulai]);

  /** Lewati soal */
  const lewatiSoal = useCallback(() => {
    lihatCara();
  }, [lihatCara]);

  /** Tutup feedback overlay */
  const tutupFeedback = useCallback(() => {
    setFeedbackPesan('');
  }, []);

  /** Lanjut ke soal berikutnya */
  const soalBerikutnya = useCallback(() => {
    const nextIndex = indexSoal + 1;
    if (nextIndex >= daftarSoal.length) {
      // Sesi selesai
      setIndexSoal(nextIndex);
      setState('IDLE');
      return;
    }

    setIndexSoal(nextIndex);
    setState('MENGERJAKAN');
    setWaktuMulai(Date.now());
    initJawaban(daftarSoal[nextIndex]);
  }, [indexSoal, daftarSoal, initJawaban]);

  return {
    state,
    jawabanState,
    carryJawabanState,
    soalAktif,
    indexSoal,
    totalSoal: daftarSoal.length,
    rekap,
    carryVisible,
    borrowVisible,
    feedbackPesan,
    feedbackHint,
    kolomSalah,
    percobaanAktif,
    waktuDetik,
    mulaiSesi,
    isiJawaban,
    isiCarryJawaban,
    lewatiSoal,
    cobaLagi,
    lihatCara,
    tutupFeedback,
    soalBerikutnya,
    sesiSelesai,
  };
}
