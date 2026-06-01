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
import { solve, validateColumn, getDigits, getCarrySteps, padDigits } from '@/lib/math-engine';
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
  /** State jawaban hasil parsial perkalian (mode latihan) */
  barisPerkalianJawaban: JawabanKolomState[][];
  /** State jawaban simpanan hasil parsial perkalian (mode latihan) */
  barisPerkalianCarryJawaban: JawabanKolomState[][];
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
  isiCarryJawaban: (kolom: number, nilai: number, barisIdx?: number) => void;
  /** Handle jawaban hasil parsial perkalian */
  isiParsialJawaban: (barisIdx: number, kolom: number, nilai: number) => void;
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
  const [barisPerkalianJawaban, setBarisPerkalianJawaban] = useState<JawabanKolomState[][]>([]);
  const [barisPerkalianCarryJawaban, setBarisPerkalianCarryJawaban] = useState<JawabanKolomState[][]>([]);
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

    const listBorrow: { kolom: number; nilaiSebelum: number; nilaiSesudah: number }[] = [];
    const digitsA = getDigits(soalAktif.angka1);
    const maxLen = perhitungan.langkahLangkah.find((l) => l.digitAtasAktif)?.digitAtasAktif?.length ?? digitsA.length;
    const paddedA = padDigits(digitsA, maxLen);

    for (const l of perhitungan.langkahLangkah) {
      if (l.kolom === -1 || !l.digitAtasAktif) continue;

      let kolomKananSelesai = true;
      for (let k = 0; k < l.kolom; k++) {
        if (jawabanState[k]?.state !== 'correct') {
          kolomKananSelesai = false;
          break;
        }
      }
      if (!kolomKananSelesai) continue;

      for (let col = 0; col < maxLen; col++) {
        const nilaiAsli = paddedA[col];
        const nilaiAktif = l.digitAtasAktif[col];
        if (nilaiAktif !== nilaiAsli) {
          if (col === l.kolom) {
            if (!listBorrow.some((b) => b.kolom === col)) {
              listBorrow.push({
                kolom: col,
                nilaiSebelum: nilaiAsli,
                nilaiSesudah: nilaiAktif,
              });
            }
          } else if (col > l.kolom) {
            const peminjamSelesai = jawabanState[l.kolom]?.state === 'correct';
            if (peminjamSelesai) {
              if (!listBorrow.some((b) => b.kolom === col)) {
                listBorrow.push({
                  kolom: col,
                  nilaiSebelum: nilaiAsli,
                  nilaiSesudah: nilaiAktif,
                });
              }
            }
          }
        }
      }
    }

    return listBorrow;
  }, [perhitungan, soalAktif, jawabanState]);

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

    if (soal.operasi === 'perkalian' && hasil.barisPerkalian) {
      const parsial = hasil.barisPerkalian.map((baris) => {
        const len = baris.langkahLangkah.length;
        return Array(len).fill(null).map(() => ({
          nilai: null,
          state: 'idle' as InputBoxState,
          jumlahPercobaan: 0,
        }));
      });
      setBarisPerkalianJawaban(parsial);

      const parsialCarry = hasil.barisPerkalian.map(() => {
        return digits.map(() => ({
          nilai: null,
          state: 'idle' as InputBoxState,
          jumlahPercobaan: 0,
        }));
      });
      setBarisPerkalianCarryJawaban(parsialCarry);
    } else {
      setBarisPerkalianJawaban([]);
      setBarisPerkalianCarryJawaban([]);
    }

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

  /** Pengecekan status selesai sesi latihan */
  const checkSelesaiSesi = useCallback((
    updatedJawaban?: JawabanKolomState[],
    updatedCarry?: JawabanKolomState[],
    updatedParsial?: JawabanKolomState[][],
    updatedParsialCarry?: JawabanKolomState[][]
  ) => {
    if (!perhitungan) return;

    const currentJawaban = updatedJawaban ?? jawabanState;
    const currentCarry = updatedCarry ?? carryJawabanState;
    const currentParsial = updatedParsial ?? barisPerkalianJawaban;
    const currentParsialCarry = updatedParsialCarry ?? barisPerkalianCarryJawaban;

    const jawabanBenar = currentJawaban.every((j) => j.state === 'correct');
    if (!jawabanBenar) return;

    const carryBenar = carryVisible.every((cv) => {
      if (soalAktif?.operasi === 'perkalian') {
        if (cv.barisPerkalianIdx !== undefined) {
          const cState = currentParsialCarry?.[cv.barisPerkalianIdx]?.[cv.kolom];
          return cState?.state === 'correct';
        } else {
          const cState = currentCarry[cv.kolom];
          return cState?.state === 'correct';
        }
      }
      const cState = currentCarry[cv.kolom];
      return cState?.state === 'correct';
    });
    if (!carryBenar) return;

    if (soalAktif?.operasi === 'perkalian' && perhitungan.barisPerkalian) {
      const parsialBenar = currentParsial.every((row) =>
        row.every((j) => j.state === 'correct')
      );
      if (!parsialBenar) return;
    }

    setState('SELESAI_BENAR');
    const waktu = Math.round((Date.now() - waktuMulai) / 1000);
    setWaktuDetik(waktu);
    setRekap((r) => [
      ...r,
      {
        soal: soalAktif!,
        jawabanSiswa: currentJawaban.map((j) => ({
          kolom: 0,
          nilai: j.nilai,
          state: j.state,
          jumlahPercobaan: j.jumlahPercobaan,
        })),
        status: 'benar',
        jumlahPercobaan: Math.max(
          ...currentJawaban.map((j) => j.jumlahPercobaan),
          ...currentCarry.map((c) => c?.jumlahPercobaan ?? 0),
          ...currentParsial.flatMap((row) => row.map((j) => j.jumlahPercobaan ?? 0)),
          1
        ),
        waktuDetik: waktu,
      },
    ]);
  }, [perhitungan, jawabanState, carryJawabanState, barisPerkalianJawaban, barisPerkalianCarryJawaban, carryVisible, soalAktif, waktuMulai]);

  /** Handle jawaban siswa di kolom tertentu */
  const isiJawaban = useCallback((kolom: number, nilai: number) => {
    if (!perhitungan || state !== 'MENGERJAKAN') return;

    const nilaiBenar = digitsHasil[kolom];
    const isBenar = validateColumn(nilai, nilaiBenar);

    let nextJawabanState: JawabanKolomState[] = [];

    setJawabanState((prev) => {
      const updated = [...prev];
      const current = { ...updated[kolom] };
      current.nilai = nilai;
      current.jumlahPercobaan += 1;
      current.state = isBenar ? 'correct' : 'wrong';
      updated[kolom] = current;
      nextJawabanState = updated;
      return updated;
    });

    if (isBenar) {
      setTimeout(() => checkSelesaiSesi(nextJawabanState, carryJawabanState, barisPerkalianJawaban), 10);
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
  }, [perhitungan, state, digitsHasil, jawabanState, carryJawabanState, barisPerkalianJawaban, carryVisible, borrowVisible, waktuMulai, checkSelesaiSesi, soalAktif]);

  /** Handle jawaban siswa untuk simpanan (carry) */
  const isiCarryJawaban = useCallback((kolom: number, nilai: number, barisIdx?: number) => {
    if (!perhitungan || state !== 'MENGERJAKAN') return;

    const expectedCarry = carryVisible.find(
      (c) => c.kolom === kolom && (barisIdx === undefined || c.barisPerkalianIdx === barisIdx)
    )?.carry;
    if (expectedCarry === undefined) return;

    const isBenar = validateColumn(nilai, expectedCarry);

    if (soalAktif?.operasi === 'perkalian' && barisIdx !== undefined) {
      let nextParsialCarryState: JawabanKolomState[][] = [];
      setBarisPerkalianCarryJawaban((prev) => {
        const updated = prev.map((row, bIdx) => {
          if (bIdx !== barisIdx) return row;
          const updatedRow = [...row];
          if (!updatedRow[kolom]) {
            updatedRow[kolom] = { nilai: null, state: 'idle', jumlahPercobaan: 0 };
          }
          const current = { ...updatedRow[kolom] };
          current.nilai = nilai;
          current.jumlahPercobaan = (current.jumlahPercobaan ?? 0) + 1;
          current.state = isBenar ? 'correct' : 'wrong';
          updatedRow[kolom] = current;
          return updatedRow;
        });
        nextParsialCarryState = updated;
        return updated;
      });

      if (isBenar) {
        setTimeout(() => checkSelesaiSesi(jawabanState, carryJawabanState, barisPerkalianJawaban, nextParsialCarryState), 10);
      } else {
        setKolomSalah(kolom);
        setState('WRONG');
        setFeedbackPesan('Simpanan belum tepat, coba lagi!');
        setFeedbackHint('Hitung kembali nilai simpanan di atas');
      }
    } else {
      let nextCarryState: JawabanKolomState[] = [];
      setCarryJawabanState((prev) => {
        const updated = [...prev];
        if (!updated[kolom]) {
          updated[kolom] = { nilai: null, state: 'idle', jumlahPercobaan: 0 };
        }
        const current = { ...updated[kolom] };
        current.nilai = nilai;
        current.jumlahPercobaan += 1;
        current.state = isBenar ? 'correct' : 'wrong';
        updated[kolom] = current;
        nextCarryState = updated;
        return updated;
      });

      if (isBenar) {
        setTimeout(() => checkSelesaiSesi(jawabanState, nextCarryState, barisPerkalianJawaban, barisPerkalianCarryJawaban), 10);
      } else {
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
    }
  }, [perhitungan, state, carryVisible, carryJawabanState, jawabanState, barisPerkalianJawaban, barisPerkalianCarryJawaban, checkSelesaiSesi, soalAktif]);

  /** Handle jawaban siswa untuk perkalian parsial */
  const isiParsialJawaban = useCallback((barisIdx: number, kolom: number, nilai: number) => {
    if (!perhitungan || state !== 'MENGERJAKAN' || !perhitungan.barisPerkalian) return;

    const baris = perhitungan.barisPerkalian[barisIdx];
    if (!baris) return;

    const nilaiBenar = baris.langkahLangkah[kolom].hasil;
    const isBenar = validateColumn(nilai, nilaiBenar);

    let nextParsialState: JawabanKolomState[][] = [];

    setBarisPerkalianJawaban((prev) => {
      const updated = prev.map((bRow, bIdx) => {
        if (bIdx !== barisIdx) return bRow;
        const updatedRow = [...bRow];
        const current = { ...updatedRow[kolom] };
        current.nilai = nilai;
        current.jumlahPercobaan = (current.jumlahPercobaan ?? 0) + 1;
        current.state = isBenar ? 'correct' : 'wrong';
        updatedRow[kolom] = current;
        return updatedRow;
      });
      nextParsialState = updated;
      return updated;
    });

    if (isBenar) {
      setTimeout(() => checkSelesaiSesi(jawabanState, carryJawabanState, nextParsialState), 10);
    } else {
      setKolomSalah(kolom);
      setState('WRONG');
      setFeedbackPesan('Jawaban belum tepat, coba lagi!');
      setFeedbackHint('Periksa kembali perkalian digit ini');
    }
  }, [perhitungan, state, jawabanState, carryJawabanState, barisPerkalianJawaban, checkSelesaiSesi]);

  /** Coba lagi kolom yang salah */
  const cobaLagi = useCallback(() => {
    setJawabanState((prev) => 
      prev.map(j => j.state === 'wrong' ? { ...j, nilai: null, state: 'hint' } : j)
    );
    setCarryJawabanState((prev) => 
      prev.map(c => c?.state === 'wrong' ? { ...c, nilai: null, state: 'hint' } : c)
    );
    setBarisPerkalianJawaban((prev) =>
      prev.map(row =>
        row.map(j => j.state === 'wrong' ? { ...j, nilai: null, state: 'hint' } : j)
      )
    );
    setBarisPerkalianCarryJawaban((prev) =>
      prev.map(row =>
        row.map(c => c?.state === 'wrong' ? { ...c, nilai: null, state: 'hint' } : c)
      )
    );

    setState('MENGERJAKAN');
    setFeedbackPesan('');

    // Focus kembali ke kolom yang salah
    setTimeout(() => {
      // 1. Cari jika ada carry parsial perkalian yang salah
      for (let b = 0; b < barisPerkalianCarryJawaban.length; b++) {
        const wrongCarryIdx = barisPerkalianCarryJawaban[b].findIndex(c => c?.state === 'wrong');
        if (wrongCarryIdx !== -1) {
          const input = document.getElementById(`carry-kolom-${wrongCarryIdx}`);
          if (input) (input as HTMLInputElement).focus();
          return;
        }
      }

      // 2. Cari jika ada carry standard yang salah
      const wrongCarryIdx = carryJawabanState.findIndex(c => c?.state === 'wrong');
      if (wrongCarryIdx !== -1) {
        const input = document.getElementById(`carry-kolom-${wrongCarryIdx}`);
        if (input) (input as HTMLInputElement).focus();
        return;
      }

      // 3. Cari jika ada baris parsial perkalian yang salah
      for (let b = 0; b < barisPerkalianJawaban.length; b++) {
        const wrongCol = barisPerkalianJawaban[b].findIndex(j => j.state === 'wrong');
        if (wrongCol !== -1) {
          const input = document.getElementById(`input-parsial-${b}-${wrongCol}`);
          if (input) (input as HTMLInputElement).focus();
          return;
        }
      }
      
      // 4. Cari jika ada hasil akhir yang salah
      const wrongIdx = jawabanState.findIndex(j => j.state === 'wrong');
      if (wrongIdx !== -1) {
        const input = document.getElementById(`input-kolom-${wrongIdx}`);
        if (input) (input as HTMLInputElement).focus();
      }
    }, 100);
  }, [jawabanState, carryJawabanState, barisPerkalianJawaban, barisPerkalianCarryJawaban]);

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
    setBarisPerkalianJawaban((prev) => {
      if (!perhitungan || !perhitungan.barisPerkalian) return prev;
      return prev.map((row, barisIdx) => {
        const baris = perhitungan.barisPerkalian![barisIdx];
        return row.map((j, col) => ({
          ...j,
          nilai: baris.langkahLangkah[col].hasil,
          state: 'revealed' as InputBoxState,
        }));
      });
    });
    setBarisPerkalianCarryJawaban((prev) => {
      if (!perhitungan || !perhitungan.barisPerkalian) return prev;
      return prev.map((row, barisIdx) => {
        return row.map((c, col) => {
          const expectedCarry = carryVisible.find(
            (cv) => cv.kolom === col && cv.barisPerkalianIdx === barisIdx
          )?.carry;
          if (expectedCarry !== undefined) {
            return { ...c, nilai: expectedCarry, state: 'revealed' as InputBoxState };
          }
          return c;
        });
      });
    });

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
  }, [digitsHasil, soalAktif, jawabanState, waktuMulai, carryVisible, perhitungan]);

  /** Lewati soal */
  const lewatiSoal = useCallback(() => {
    lihatCara();
  }, [lihatCara]);

  /** Tutup feedback overlay */
  const tutupFeedback = useCallback(() => {
    if (percobaanAktif >= MAX_PERCOBAAN) {
      lihatCara();
    } else {
      cobaLagi();
    }
  }, [cobaLagi, lihatCara, percobaanAktif]);

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
    barisPerkalianJawaban,
    barisPerkalianCarryJawaban,
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
    isiParsialJawaban,
    lewatiSoal,
    cobaLagi,
    lihatCara,
    tutupFeedback,
    soalBerikutnya,
    sesiSelesai,
  };
}
