'use client';

// ============================================
// InputBox — Kotak Input Per Kolom Digit
// ============================================
// Setiap kolom pada papan hitung memiliki satu InputBox.
// Hanya menerima 1 digit (0-9). Auto-focus ke kolom berikutnya.

import { useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Check, HelpCircle } from 'lucide-react';
import type { InputBoxState } from '@/types/math';
import { cn } from '@/lib/utils';

interface InputBoxProps {
  /** State visual saat ini */
  state: InputBoxState;
  /** Nilai yang ditampilkan (null = kosong) */
  nilai: number | null;
  /** Callback saat siswa mengisi nilai */
  onChange: (nilai: number) => void;
  /** Apakah input ini aktif dan bisa diisi */
  disabled?: boolean;
  /** Ref untuk focus management antar kolom */
  onFocusNext?: () => void;
  /** Auto-focus saat mount */
  autoFocus?: boolean;
  /** ID unik untuk testing */
  id?: string;
}

/** Map state ke CSS class */
const STATE_CLASSES: Record<InputBoxState, string> = {
  idle: 'input-box',
  focused: 'input-box input-box--focused',
  correct: 'input-box input-box--correct',
  wrong: 'input-box input-box--wrong',
  hint: 'input-box input-box--hint',
  revealed: 'input-box input-box--revealed',
};

/** Map state ke animasi */
const STATE_ANIMATIONS: Record<InputBoxState, Record<string, number[]>> = {
  idle: {},
  focused: {},
  correct: { scale: [0.9, 1.1, 1] },
  wrong: { x: [0, -4, 4, -4, 4, 0] },
  hint: {},
  revealed: { opacity: [0, 1] },
};

export default function InputBox({
  state,
  nilai,
  onChange,
  disabled = false,
  onFocusNext,
  autoFocus = false,
  id,
}: InputBoxProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      const digit = raw.replace(/\D/g, '').slice(-1);
      if (digit !== '') {
        onChange(parseInt(digit, 10));
        if (onFocusNext) {
          setTimeout(() => onFocusNext(), 50);
        }
      }
    },
    [onChange, onFocusNext]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (
        !/^[0-9]$/.test(e.key) &&
        !['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete'].includes(e.key)
      ) {
        e.preventDefault();
      }
    },
    []
  );

  const isReadOnly = state === 'correct' || state === 'revealed' || disabled;

  return (
    <div className="relative inline-flex flex-col items-center">
      <motion.div
        animate={STATE_ANIMATIONS[state]}
        transition={{ duration: 0.4, ease: 'easeInOut' }}
        className="relative"
      >
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="numeric"
          pattern="[0-9]"
          maxLength={1}
          value={nilai !== null ? nilai.toString() : ''}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          readOnly={isReadOnly}
          disabled={disabled}
          className={cn(
            STATE_CLASSES[state],
            state === 'hint' && 'animate-hint-pulse',
            isReadOnly && 'cursor-default',
            disabled && 'opacity-40 cursor-not-allowed bg-secondary/50 border-dashed border-border'
          )}
          aria-label={`Kolom jawaban ${id ?? ''}`}
        />

        {/* Icon overlay — correct */}
        {state === 'correct' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--input-correct-border)' }}
          >
            <Check className="w-3 h-3 text-white" strokeWidth={3} />
          </motion.div>
        )}

        {/* Icon overlay — hint */}
        {state === 'hint' && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center animate-hint-pulse"
            style={{ backgroundColor: 'var(--input-hint-border)' }}
          >
            <HelpCircle className="w-3 h-3 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
