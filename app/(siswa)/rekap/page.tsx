'use client';

// ============================================
// Halaman Rekap Sesi — Ringkasan Hasil Latihan
// ============================================
// Skor (benar/total), emoji reward, list soal yang dikerjakan,
// tombol: [Latihan Lagi] [Kembali]

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { RotateCcw, Home, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OPERASI_LABEL, OPERASI_SIMBOL, REWARD_EMOJI } from '@/lib/constants';
import type { RekapSoal, Operasi } from '@/types/math';

export default function RekapPage() {
  const router = useRouter();
  const [rekap, setRekap] = useState<RekapSoal[]>([]);
  const [operasi, setOperasi] = useState<Operasi>('penjumlahan');

  useEffect(() => {
    const rekapJson = sessionStorage.getItem('rekap');
    const op = sessionStorage.getItem('operasi') as Operasi | null;
    if (rekapJson) {
      setRekap(JSON.parse(rekapJson));
    }
    if (op) setOperasi(op);
  }, []);

  // Hitung skor
  const totalSoal = rekap.length;
  const benar = rekap.filter((r) => r.status === 'benar').length;
  const salah = rekap.filter((r) => r.status === 'salah').length;
  const diungkap = rekap.filter((r) => r.status === 'diungkap').length;
  const persentase = totalSoal > 0 ? Math.round((benar / totalSoal) * 100) : 0;

  // Emoji reward
  const reward = REWARD_EMOJI.find((r) => persentase >= r.min) ?? REWARD_EMOJI[REWARD_EMOJI.length - 1];

  // Status icon
  const statusIcon = (status: 'benar' | 'salah' | 'diungkap') => {
    switch (status) {
      case 'benar':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'salah':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'diungkap':
        return <Eye className="w-5 h-5 text-violet-500" />;
    }
  };

  // Pre-compute hasil untuk setiap soal
  const rekapWithHasil = useMemo(() =>
    rekap.map((r) => ({
      ...r,
      hasil: r.soal.operasi === 'penjumlahan'
        ? r.soal.angka1 + r.soal.angka2
        : r.soal.operasi === 'pengurangan'
          ? r.soal.angka1 - r.soal.angka2
          : r.soal.angka1 * r.soal.angka2,
    })),
  [rekap]);

  return (
    <div className="flex-1 flex flex-col items-center gap-6 p-6 max-w-md mx-auto">
      {/* Header reward */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="flex flex-col items-center gap-3 py-6"
      >
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: 3, duration: 0.4, repeatDelay: 0.2 }}
          className="text-6xl"
        >
          {reward.emoji}
        </motion.span>
        <h2 className="text-2xl font-black">{reward.pesan}</h2>
        <p className="text-muted-foreground">
          {OPERASI_LABEL[operasi]}
        </p>
      </motion.div>

      {/* Skor */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="w-full grid grid-cols-3 gap-3"
      >
        <div className="flex flex-col items-center p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl">
          <span className="text-2xl font-black text-emerald-600">{benar}</span>
          <span className="text-xs text-emerald-600 font-medium">Benar ✅</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-red-50 dark:bg-red-950/30 rounded-2xl">
          <span className="text-2xl font-black text-red-500">{salah + diungkap}</span>
          <span className="text-xs text-red-500 font-medium">Salah ❌</span>
        </div>
        <div className="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-950/30 rounded-2xl">
          <span className="text-2xl font-black text-blue-600">{persentase}%</span>
          <span className="text-xs text-blue-600 font-medium">Skor</span>
        </div>
      </motion.div>

      {/* Daftar soal */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full"
      >
        <h3 className="text-sm font-bold text-muted-foreground mb-2">Detail Soal</h3>
        <div className="flex flex-col gap-2">
          {rekapWithHasil.map((r, i) => {
            const simbol = OPERASI_SIMBOL[r.soal.operasi];

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-center justify-between p-3 bg-card rounded-xl border border-border"
              >
                <div className="flex items-center gap-3">
                  {statusIcon(r.status)}
                  <span className="font-mono font-bold text-sm">
                    {r.soal.angka1} {simbol} {r.soal.angka2} = {r.hasil}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{r.jumlahPercobaan}× coba</span>
                  {r.waktuDetik > 0 && <span>{r.waktuDetik}s</span>}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Tombol aksi */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex gap-3 w-full"
      >
        <Button
          variant="outline"
          onClick={() => router.push('/pilih-operasi')}
          className="flex-1 gap-2"
        >
          <Home className="w-4 h-4" />
          Kembali
        </Button>
        <Button
          onClick={() => {
            router.push('/latihan');
          }}
          className="flex-1 gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          Latihan Lagi
        </Button>
      </motion.div>
    </div>
  );
}
