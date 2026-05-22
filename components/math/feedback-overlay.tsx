'use client';

// ============================================
// FeedbackOverlay — Panel Feedback Saat Salah
// ============================================
// Tampil sebagai panel bawah (bukan modal fullscreen — jangan block soal).
// Konten: highlight kolom bermasalah, penjelasan singkat, tombol aksi.

import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FeedbackOverlayProps {
  /** Apakah overlay visible */
  visible: boolean;
  /** Pesan singkat (≤ 10 kata) */
  pesan: string;
  /** Kolom yang bermasalah */
  kolomSalah?: number;
  /** Jumlah percobaan yang telah dilakukan */
  percobaan: number;
  /** Max percobaan sebelum jawaban diungkap */
  maxPercobaan: number;
  /** Hint text (petunjuk carry/borrow yang terlupakan) */
  hint?: string;
  /** Callback: coba lagi */
  onCobaLagi: () => void;
  /** Callback: lihat cara penyelesaian */
  onLihatCara: () => void;
  /** Callback: tutup overlay */
  onTutup: () => void;
}

export default function FeedbackOverlay({
  visible,
  pesan,
  percobaan,
  maxPercobaan,
  hint,
  onCobaLagi,
  onLihatCara,
  onTutup,
}: FeedbackOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6 mx-auto max-w-lg"
        >
          <div
            className="rounded-2xl p-5 shadow-2xl border border-border"
            style={{
              background: 'oklch(0.98 0.02 25)',
              borderColor: 'var(--input-wrong-border)',
            }}
          >
            {/* Tombol tutup */}
            <button
              onClick={onTutup}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-black/5 transition-colors"
              aria-label="Tutup"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Pesan utama */}
            <div className="flex items-start gap-3 mb-3">
              <motion.div
                animate={{ rotate: [0, -10, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="text-2xl shrink-0"
              >
                😕
              </motion.div>
              <div>
                <p className="font-bold text-base" style={{ color: 'var(--input-wrong-border)' }}>
                  {pesan}
                </p>
                {hint && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-muted-foreground mt-1"
                  >
                    💡 {hint}
                  </motion.p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Percobaan {percobaan} dari {maxPercobaan}
                </p>
              </div>
            </div>

            {/* Tombol aksi */}
            <div className="flex gap-2">
              {percobaan < maxPercobaan ? (
                <Button
                  onClick={onCobaLagi}
                  className="flex-1 gap-2"
                  variant="default"
                >
                  <RotateCcw className="w-4 h-4" />
                  Coba Lagi
                </Button>
              ) : (
                <Button
                  onClick={onLihatCara}
                  className="flex-1 gap-2"
                  variant="default"
                >
                  <Eye className="w-4 h-4" />
                  Lihat Cara
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
