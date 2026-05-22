'use client';

// ============================================
// OffsetIndicator — Visualisasi Geser Perkalian
// ============================================
// Tampil sebagai tanda '·' atau kotak abu-abu di posisi yang digeser.
// KRITIS: baris hasil perkalian ke-N digeser (N-1) kolom ke kiri.
// Muncul dengan highlight kuning pada baris kedua beserta label "×10", "×100".

import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface OffsetIndicatorProps {
  /** Jumlah posisi offset (1 = ×10, 2 = ×100) */
  offset: number;
  /** Index baris (untuk label) */
  baris: number;
}

export default function OffsetIndicator({ offset, baris }: OffsetIndicatorProps) {
  if (offset === 0) return null;

  const label = `×${Math.pow(10, offset)}`;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: offset }).map((_, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.3 }}
                className="offset-placeholder"
                style={{
                  backgroundColor: 'oklch(0.95 0.04 85)',
                  borderRadius: 'var(--radius-md)',
                  border: '2px dashed oklch(0.8 0.1 85)',
                }}
              >
                ·
              </motion.div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p>
                Baris {baris + 1} digeser {offset} posisi ({label})
              </p>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Label ×10, ×100 */}
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="text-xs font-bold ml-1 px-1.5 py-0.5 rounded"
          style={{
            color: 'oklch(0.5 0.15 85)',
            backgroundColor: 'oklch(0.95 0.04 85)',
          }}
        >
          {label}
        </motion.span>
      </div>
    </TooltipProvider>
  );
}
