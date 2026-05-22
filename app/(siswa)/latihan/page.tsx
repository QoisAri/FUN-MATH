'use client';

// ============================================
// Halaman Latihan — Sesi Latihan Interaktif
// ============================================
// MathBoard mode 'latihan' + state machine useLatihan.
// Validasi real-time per kolom, hint system, feedback overlay.
// Timer per soal. Simpan ke DB setelah sesi selesai.

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Timer, SkipForward, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ErrorBoundary } from 'react-error-boundary';
import MathBoard from '@/components/math/math-board';
import FeedbackOverlay from '@/components/math/feedback-overlay';
import { useLatihan } from '@/hooks/use-latihan';
import { generateSesiSoal } from '@/lib/soal-generator';
import { OPERASI_LABEL, MAX_PERCOBAAN, SOAL_PER_SESI, TIMER_DEFAULT_DETIK } from '@/lib/constants';
import type { Operasi, Kesulitan } from '@/types/math';

/** Fallback saat ErrorBoundary menangkap error */
function ErrorFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6">
      <span className="text-4xl">⚠️</span>
      <p className="text-sm text-muted-foreground text-center">
        Terjadi kesalahan. Coba refresh halaman.
      </p>
      <Button onClick={resetErrorBoundary}>Coba Lagi</Button>
    </div>
  );
}

export default function LatihanPage() {
  const router = useRouter();
  const latihan = useLatihan();
  const [operasi, setOperasi] = useState<Operasi>('penjumlahan');
  const [kesulitan, setKesulitan] = useState<Kesulitan>('mudah');
  const [timerDetik, setTimerDetik] = useState(TIMER_DEFAULT_DETIK);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const sesiMulaiRef = useRef(Date.now());

  // Simpan referensi fungsi yang stabil untuk dipakai di timer
  const lewatiSoalRef = useRef(latihan.lewatiSoal);
  lewatiSoalRef.current = latihan.lewatiSoal;

  // Load pilihan dan mulai sesi
  useEffect(() => {
    const op = sessionStorage.getItem('operasi') as Operasi | null;
    const ks = sessionStorage.getItem('kesulitan') as Kesulitan | null;
    if (op) setOperasi(op);
    if (ks) setKesulitan(ks);

    const soalList = generateSesiSoal(op ?? 'penjumlahan', ks ?? 'mudah', SOAL_PER_SESI);
    latihan.mulaiSesi(soalList);
    setIsTimerRunning(true);
    sesiMulaiRef.current = Date.now();
  }, []);

  // Timer countdown — gunakan ref untuk menghindari dependency pada object latihan
  useEffect(() => {
    if (!isTimerRunning || latihan.state !== 'MENGERJAKAN') return;

    const interval = setInterval(() => {
      setTimerDetik((prev) => {
        if (prev <= 1) {
          lewatiSoalRef.current();
          return TIMER_DEFAULT_DETIK;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, latihan.state]);

  // Reset timer saat soal berikutnya
  const handleSoalBerikutnya = useCallback(() => {
    setTimerDetik(TIMER_DEFAULT_DETIK);
    latihan.soalBerikutnya();
  }, [latihan]);

  // Simpan sesi ke DB + navigasi ke rekap saat sesi selesai
  useEffect(() => {
    if (!latihan.sesiSelesai) return;

    const rekap = latihan.rekap;
    const benar = rekap.filter((r) => r.status === 'benar').length;
    const salah = rekap.filter((r) => r.status !== 'benar').length;
    const skor = rekap.length > 0 ? Math.round((benar / rekap.length) * 100) : 0;

    // Kirim ke database (fire-and-forget)
    fetch('/api/sesi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siswa_id: sessionStorage.getItem('siswaId'),
        operasi,
        skor,
        total_soal: rekap.length,
        benar,
        salah,
        durasi_detik: Math.floor((Date.now() - sesiMulaiRef.current) / 1000),
        detail: rekap.map((r) => ({
          soal: { angka1: r.soal.angka1, angka2: r.soal.angka2, operasi: r.soal.operasi },
          jawaban_siswa: r.jawabanSiswa,
          status: r.status,
          jumlah_percobaan: r.jumlahPercobaan,
          waktu_detik: r.waktuDetik,
        })),
      }),
    }).catch(console.error);

    // Simpan rekap ke sessionStorage dan navigate
    sessionStorage.setItem('rekap', JSON.stringify(rekap));
    router.push('/rekap');
  }, [latihan.sesiSelesai, latihan.rekap, router, operasi]);

  // Format timer
  const formatTimer = (detik: number) => {
    const m = Math.floor(detik / 60);
    const s = detik % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const timerColor = timerDetik <= 30
    ? 'text-red-500'
    : timerDetik <= 60
      ? 'text-amber-500'
      : 'text-muted-foreground';

  if (!latihan.soalAktif) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Menyiapkan soal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 relative">
      {/* Header info */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between w-full max-w-sm"
      >
        {/* Progress soal */}
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold">
              ✏️ {OPERASI_LABEL[operasi]} — Soal {latihan.indexSoal + 1}/{latihan.totalSoal}
            </span>
            {/* Timer */}
            <div className={`flex items-center gap-1 font-mono font-bold ${timerColor}`}>
              <Timer className="w-3.5 h-3.5" />
              {formatTimer(timerDetik)}
            </div>
          </div>
          <Progress
            value={((latihan.indexSoal) / latihan.totalSoal) * 100}
            className="h-2"
          />
        </div>
      </motion.div>

      {/* MathBoard — mode latihan, dibungkus ErrorBoundary */}
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <MathBoard
          angka1={latihan.soalAktif.angka1}
          angka2={latihan.soalAktif.angka2}
          operasi={latihan.soalAktif.operasi}
          mode="latihan"
          jawabanState={latihan.jawabanState}
          onJawaban={latihan.isiJawaban}
          carryVisible={latihan.carryVisible}
          borrowVisible={latihan.borrowVisible}
        />
      </ErrorBoundary>

      {/* Status message */}
      <AnimatePresence mode="wait">
        {latihan.state === 'SELESAI_BENAR' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <motion.span
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ repeat: 2, duration: 0.3 }}
              className="text-4xl"
            >
              🎉
            </motion.span>
            <p className="font-bold text-lg" style={{ color: 'var(--input-correct-border)' }}>
              Benar! Hebat!
            </p>
            <Button onClick={handleSoalBerikutnya} className="gap-2">
              Soal Berikutnya →
            </Button>
          </motion.div>
        )}

        {latihan.state === 'REVEALED' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-3"
          >
            <span className="text-3xl">💡</span>
            <p className="text-sm text-muted-foreground text-center max-w-xs">
              Tidak apa-apa! Perhatikan jawabannya, lalu coba soal berikutnya.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => router.push('/belajar')} className="gap-2">
                <BookOpen className="w-4 h-4" />
                Pelajari Dulu
              </Button>
              <Button onClick={handleSoalBerikutnya} className="gap-2">
                Soal Berikutnya →
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tombol lewati */}
      {(latihan.state === 'MENGERJAKAN' || latihan.state === 'WRONG') && (
        <Button
          variant="ghost"
          size="sm"
          onClick={latihan.lewatiSoal}
          className="text-xs text-muted-foreground gap-1"
        >
          <SkipForward className="w-3.5 h-3.5" />
          Lewati
        </Button>
      )}

      {/* Feedback overlay */}
      <FeedbackOverlay
        visible={latihan.state === 'WRONG' && latihan.feedbackPesan !== ''}
        pesan={latihan.feedbackPesan}
        hint={latihan.feedbackHint}
        kolomSalah={latihan.kolomSalah ?? undefined}
        percobaan={latihan.percobaanAktif}
        maxPercobaan={MAX_PERCOBAAN}
        onCobaLagi={latihan.cobaLagi}
        onLihatCara={latihan.lihatCara}
        onTutup={latihan.tutupFeedback}
      />
    </div>
  );
}
