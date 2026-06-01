'use client';

// ============================================
// Halaman Kerjakan Tugas — Sesi Latihan dari Admin
// ============================================
// MathBoard mode 'latihan' + state machine useLatihan.
// Mengambil data soal spesifik dari tabel 'soal' yang belum pernah dikerjakan.

import { useEffect, useState, useCallback, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { Timer, SkipForward, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ErrorBoundary } from 'react-error-boundary';
import MathBoard from '@/components/math/math-board';
import FeedbackOverlay from '@/components/math/feedback-overlay';
import { useLatihan } from '@/hooks/use-latihan';
import { OPERASI_LABEL, MAX_PERCOBAAN, TIMER_DEFAULT_DETIK } from '@/lib/constants';
import type { Operasi } from '@/types/math';
import { createClient } from '@/lib/supabase/client';

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

function KerjakanTugasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const operasiRaw = searchParams.get('op') as Operasi | null;
  const operasi = operasiRaw ?? 'penjumlahan';
  
  const latihan = useLatihan();
  const supabase = createClient();
  
  const [timerDetik, setTimerDetik] = useState(TIMER_DEFAULT_DETIK);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const sesiMulaiRef = useRef(Date.now());

  const lewatiSoalRef = useRef(latihan.lewatiSoal);
  lewatiSoalRef.current = latihan.lewatiSoal;

  useEffect(() => {
    const fetchSoal = async () => {
      const siswaId = sessionStorage.getItem('siswaId');
      if (!siswaId) {
        router.replace('/');
        return;
      }
      
      const { data: soalAktif } = await supabase.from('soal').select('*').eq('aktif', true).eq('operasi', operasi);
      if (!soalAktif || soalAktif.length === 0) {
        setIsFetching(false);
        return;
      }

      const { data: sesiList } = await supabase.from('sesi_latihan').select('id').eq('siswa_id', siswaId);
      
      const attempted = new Set();
      if (sesiList && sesiList.length > 0) {
        const sesiIds = (sesiList as any[]).map(s => s.id);
        const { data: detailList } = await supabase.from('detail_jawaban').select('soal').in('sesi_id', sesiIds);
        if (detailList) {
          (detailList as any[]).forEach(d => {
            if (d.soal && typeof d.soal === 'object') {
              const s = d.soal as any;
              attempted.add(`${s.angka1}-${s.angka2}-${s.operasi}`);
            }
          });
        }
      }

      const pending = (soalAktif as any[]).filter(s => !attempted.has(`${s.angka1}-${s.angka2}-${s.operasi}`));
      
      if (pending.length === 0) {
        setIsFetching(false);
        return;
      }

      latihan.mulaiSesi(pending.map((s: any) => ({
        angka1: s.angka1,
        angka2: s.angka2,
        operasi: s.operasi as Operasi,
        kesulitan: s.kesulitan as any
      })));
      setIsTimerRunning(true);
      sesiMulaiRef.current = Date.now();
      setIsFetching(false);
    };

    fetchSoal();
  }, [operasi]);

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

  const handleSoalBerikutnya = useCallback(() => {
    setTimerDetik(TIMER_DEFAULT_DETIK);
    latihan.soalBerikutnya();
  }, [latihan]);

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

    sessionStorage.setItem('rekap', JSON.stringify(rekap));
    // Kembali ke halaman tugas alih-alih rekap jika diperlukan, tapi rekap lebih baik untuk memberikan skor!
    router.push('/rekap');
  }, [latihan.sesiSelesai, latihan.rekap, router, operasi]);

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

  if (isFetching) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Menyiapkan soal tugas...</p>
        </div>
      </div>
    );
  }

  if (!latihan.soalAktif) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
        <span className="text-4xl">✅</span>
        <h2 className="text-2xl font-bold">Hebat!</h2>
        <p className="text-muted-foreground">Semua tugas pada kategori ini sudah kamu kerjakan.</p>
        <Button onClick={() => router.push('/tugas')}>Kembali ke Daftar Tugas</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-6 p-6 relative">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between w-full max-w-sm"
      >
        <div className="flex flex-col gap-1 flex-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-orange-600">
              📋 Tugas {OPERASI_LABEL[operasi]} — Soal {latihan.indexSoal + 1}/{latihan.totalSoal}
            </span>
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

      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <MathBoard
          angka1={latihan.soalAktif.angka1}
          angka2={latihan.soalAktif.angka2}
          operasi={latihan.soalAktif.operasi}
          mode="latihan"
          jawabanState={latihan.jawabanState}
          carryJawabanState={latihan.carryJawabanState}
          barisPerkalianJawaban={latihan.barisPerkalianJawaban}
          barisPerkalianCarryJawaban={latihan.barisPerkalianCarryJawaban}
          onJawaban={latihan.isiJawaban}
          onCarryJawaban={latihan.isiCarryJawaban}
          onParsialJawaban={latihan.isiParsialJawaban}
          carryVisible={latihan.carryVisible}
          borrowVisible={latihan.borrowVisible}
        />
      </ErrorBoundary>

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
              <Button onClick={handleSoalBerikutnya} className="gap-2">
                Soal Berikutnya →
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

export default function Page() {
  return (
    <Suspense fallback={<div>Memuat tugas...</div>}>
      <KerjakanTugasPage />
    </Suspense>
  );
}
