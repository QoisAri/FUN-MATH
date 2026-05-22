'use client';

// ============================================
// StepControls — Kontrol Navigasi Langkah Animasi
// ============================================
// Tombol: ⏮ Ulangi | ◀ Sebelumnya | ▶ Berikutnya
// Progress bar visual (langkah ke-N dari total).

import { motion } from 'framer-motion';
import { SkipBack, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface StepControlsProps {
  /** Langkah saat ini (0-indexed) */
  langkahSekarang: number;
  /** Total langkah */
  totalLangkah: number;
  /** Apakah sedang auto-play */
  isPlaying: boolean;
  /** Callback: langkah sebelumnya */
  onPrev: () => void;
  /** Callback: langkah berikutnya */
  onNext: () => void;
  /** Callback: ulangi dari awal */
  onReset: () => void;
  /** Callback: toggle auto-play */
  onTogglePlay: () => void;
}

export default function StepControls({
  langkahSekarang,
  totalLangkah,
  isPlaying,
  onPrev,
  onNext,
  onReset,
  onTogglePlay,
}: StepControlsProps) {
  const progress = totalLangkah > 0
    ? ((langkahSekarang + 1) / totalLangkah) * 100
    : 0;

  const isFirst = langkahSekarang <= 0;
  const isLast = langkahSekarang >= totalLangkah - 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-3 w-full max-w-sm mx-auto"
    >
      {/* Progress bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground w-16 text-right">
          {langkahSekarang + 1} / {totalLangkah}
        </span>
        <Progress value={progress} className="flex-1 h-2" />
      </div>

      {/* Tombol kontrol */}
      <div className="flex items-center justify-center gap-2">
        {/* Ulangi */}
        <Button
          variant="outline"
          size="icon"
          onClick={onReset}
          disabled={isFirst && !isPlaying}
          aria-label="Ulangi dari awal"
        >
          <SkipBack className="w-4 h-4" />
        </Button>

        {/* Sebelumnya */}
        <Button
          variant="outline"
          size="icon"
          onClick={onPrev}
          disabled={isFirst}
          aria-label="Langkah sebelumnya"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Play/Pause */}
        <Button
          variant="default"
          size="icon"
          onClick={onTogglePlay}
          disabled={isLast && !isPlaying}
          aria-label={isPlaying ? 'Jeda' : 'Putar otomatis'}
          className="w-12 h-12 rounded-full"
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </Button>

        {/* Berikutnya */}
        <Button
          variant="outline"
          size="icon"
          onClick={onNext}
          disabled={isLast}
          aria-label="Langkah berikutnya"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </motion.div>
  );
}
