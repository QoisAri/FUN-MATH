'use client';

// ============================================
// Halaman Belajar — Animasi Step-by-Step
// ============================================
// Menggunakan MathBoard mode 'animasi' + StepControls.
// Menampilkan cara mengerjakan soal langkah demi langkah.

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MathBoard from '@/components/math/math-board';
import StepControls from '@/components/math/step-controls';
import { useAnimasi } from '@/hooks/use-animasi';
import { generateSoal } from '@/lib/soal-generator';
import { OPERASI_LABEL } from '@/lib/constants';
import type { Operasi, Kesulitan } from '@/types/math';

export default function BelajarPage() {
  const router = useRouter();
  const animasi = useAnimasi();
  const [operasi, setOperasi] = useState<Operasi>('penjumlahan');
  const [kesulitan, setKesulitan] = useState<Kesulitan>('mudah');

  // Load pilihan dari sessionStorage
  useEffect(() => {
    const op = sessionStorage.getItem('operasi') as Operasi | null;
    const ks = sessionStorage.getItem('kesulitan') as Kesulitan | null;
    if (op) setOperasi(op);
    if (ks) setKesulitan(ks);

    // Generate soal awal
    const soal = generateSoal(op ?? 'penjumlahan', ks ?? 'mudah');
    animasi.setSoal(soal.angka1, soal.angka2, soal.operasi);
  }, []);

  // Generate soal baru
  const soalBaru = () => {
    const soal = generateSoal(operasi, kesulitan);
    animasi.setSoal(soal.angka1, soal.angka2, soal.operasi);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 p-6">
      {/* Judul */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h2 className="text-xl font-bold">
          📖 Belajar {OPERASI_LABEL[operasi]}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Perhatikan langkah demi langkah
        </p>
      </motion.div>

      {/* MathBoard — mode animasi */}
      {animasi.perhitungan && (
        <MathBoard
          angka1={animasi.perhitungan.angka1}
          angka2={animasi.perhitungan.angka2}
          operasi={operasi}
          mode="animasi"
          langkahAktif={animasi.langkahSekarang}
          carryVisible={animasi.carryVisible}
          borrowVisible={animasi.borrowVisible}
        />
      )}

      {/* Penjelasan langkah */}
      <motion.div
        key={animasi.langkahSekarang}
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center px-4 py-3 bg-card rounded-xl border border-border max-w-sm"
      >
        <p className="text-sm font-medium">{animasi.penjelasan}</p>
      </motion.div>

      {/* Kontrol navigasi */}
      <StepControls
        langkahSekarang={animasi.langkahSekarang}
        totalLangkah={animasi.totalLangkah}
        isPlaying={animasi.isPlaying}
        onPrev={animasi.prevStep}
        onNext={animasi.nextStep}
        onReset={animasi.reset}
        onTogglePlay={animasi.togglePlay}
      />

      {/* Tombol soal baru */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={soalBaru}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Soal Baru
        </Button>
        <Button
          variant="default"
          onClick={() => router.push('/latihan')}
        >
          ✏️ Coba Latihan
        </Button>
      </div>
    </div>
  );
}
