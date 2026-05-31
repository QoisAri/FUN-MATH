'use client';

// ============================================
// Pilih Operasi — Halaman pemilihan operasi + mode
// ============================================
// 3 kartu besar dengan ikon: ➕ ➖ ✖️
// Setelah pilih operasi → pilih kesulitan + mode (Belajar / Latihan)

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, PenTool, ArrowLeft, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OperationCard from '@/components/math/operation-card';
import type { Operasi, Kesulitan } from '@/types/math';
import { OPERASI_LABEL, KESULITAN_LIST, KESULITAN_LABEL } from '@/lib/constants';

export default function PilihOperasiPage() {
  const router = useRouter();
  const [operasiTerpilih, setOperasiTerpilih] = useState<Operasi | null>(null);
  const [kesulitanTerpilih, setKesulitanTerpilih] = useState<Kesulitan | null>(null);

  const handlePilihOperasi = (operasi: Operasi) => {
    setOperasiTerpilih(operasi);
  };

  const handlePilihMode = (mode: 'belajar' | 'latihan') => {
    if (!operasiTerpilih || !kesulitanTerpilih) return;

    // Simpan pilihan ke sessionStorage
    sessionStorage.setItem('operasi', operasiTerpilih);
    sessionStorage.setItem('kesulitan', kesulitanTerpilih);

    if (mode === 'belajar') {
      router.push('/belajar');
    } else {
      router.push('/latihan');
    }
  };

  const KESULITAN_EMOJI: Record<Kesulitan, string> = {
    mudah: '🌟',
    sedang: '⭐',
    sulit: '🔥',
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {!operasiTerpilih ? (
          /* ============================================
             Step 1: Pilih Operasi
             ============================================ */
          <motion.div
            key="operasi"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col items-center gap-8"
          >
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl font-bold text-center"
            >
              Mau belajar apa? 🤔
            </motion.h2>

            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/tugas')}
              className="flex items-center justify-between w-full max-w-sm p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl hover:border-orange-400 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <ClipboardList className="w-6 h-6 text-orange-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-orange-800 text-lg">Tugas & PR</h3>
                  <p className="text-sm text-orange-600/80 font-medium">Kerjakan tugas dari Guru</p>
                </div>
              </div>
            </motion.button>

            <div className="flex flex-wrap justify-center gap-4">
              <OperationCard operasi="penjumlahan" onClick={handlePilihOperasi} delay={0.1} />
              <OperationCard operasi="pengurangan" onClick={handlePilihOperasi} delay={0.2} />
              <OperationCard operasi="perkalian" onClick={handlePilihOperasi} delay={0.3} />
            </div>
          </motion.div>
        ) : !kesulitanTerpilih ? (
          /* ============================================
             Step 2: Pilih Kesulitan
             ============================================ */
          <motion.div
            key="kesulitan"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col items-center gap-6 w-full max-w-sm"
          >
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOperasiTerpilih(null)}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-xl font-bold">
                {OPERASI_LABEL[operasiTerpilih]} — Pilih Tingkat
              </h2>
            </div>

            <div className="flex flex-col gap-3 w-full">
              {KESULITAN_LIST.map((k, i) => (
                <motion.button
                  key={k}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setKesulitanTerpilih(k)}
                  className="flex items-center gap-4 p-5 rounded-2xl bg-card border-2 border-border hover:border-primary/30 shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <span className="text-3xl">{KESULITAN_EMOJI[k]}</span>
                  <div className="text-left">
                    <p className="font-bold text-base">{KESULITAN_LABEL[k]}</p>
                    <p className="text-xs text-muted-foreground">
                      {k === 'mudah' && '2 digit, tanpa simpanan'}
                      {k === 'sedang' && '2 digit, dengan simpanan'}
                      {k === 'sulit' && '2-3 digit, simpanan beruntun'}
                    </p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* ============================================
             Step 3: Pilih Mode (Belajar / Latihan)
             ============================================ */
          <motion.div
            key="mode"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center gap-6 w-full max-w-sm"
          >
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setKesulitanTerpilih(null)}
                className="rounded-full"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h2 className="text-xl font-bold">
                Pilih Mode
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 w-full">
              {/* Mode Belajar */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePilihMode('belajar')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 shadow-sm hover:shadow-lg transition-all cursor-pointer"
              >
                <BookOpen className="w-10 h-10 text-blue-500" />
                <span className="text-base font-bold text-blue-700 dark:text-blue-300">
                  📖 Belajar
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  Lihat cara mengerjakan langkah demi langkah
                </span>
              </motion.button>

              {/* Mode Latihan */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                whileHover={{ scale: 1.05, y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePilihMode('latihan')}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border-2 border-emerald-200 dark:border-emerald-800 hover:border-emerald-400 shadow-sm hover:shadow-lg transition-all cursor-pointer"
              >
                <PenTool className="w-10 h-10 text-emerald-500" />
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">
                  ✏️ Latihan
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  Kerjakan soal sendiri dengan bantuan
                </span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
