'use client';

// ============================================
// Landing Page — Pilih Profil Siswa
// ============================================
// Grid avatar/foto siswa (visual, minimal teks).
// Input PIN 4 digit sederhana — validasi di SERVER.
// Tombol besar, warna cerah.
// Opsi "Masuk sebagai Guru" di pojok.

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { User, Lock, GraduationCap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { createClient } from '@/lib/supabase/client';

/** Tipe siswa publik (TANPA pin) */
interface SiswaPublik {
  id: string;
  nama: string;
  kelas: string | null;
  avatar_url: string | null;
}

export default function LandingPage() {
  const router = useRouter();
  const [siswaList, setSiswaList] = useState<SiswaPublik[]>([]);
  const [selectedSiswa, setSelectedSiswa] = useState<SiswaPublik | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  // Fetch daftar siswa — TANPA kolom pin
  useEffect(() => {
    async function fetchSiswa() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('siswa')
          .select('id, nama, kelas, avatar_url')
          .order('nama');

        if (error) throw error;
        setSiswaList(data ?? []);
      } catch (err) {
        console.error('Gagal mengambil data siswa:', err);
        setSiswaList([]);
      } finally {
        setLoading(false);
      }
    }
    fetchSiswa();
  }, []);

  // Handle PIN submit — validasi di SERVER
  const handlePinComplete = async (value: string) => {
    setPin(value);
    if (!selectedSiswa || value.length < 4) return;

    setVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siswa_id: selectedSiswa.id, pin: value }),
      });

      const data = await res.json();

      if (data.valid) {
        sessionStorage.setItem('siswaId', selectedSiswa.id);
        sessionStorage.setItem('siswaNama', selectedSiswa.nama);
        sessionStorage.setItem('siswaAvatar', selectedSiswa.avatar_url ?? '');
        router.push('/pilih-operasi');
      } else {
        setError('PIN salah, coba lagi!');
        setTimeout(() => {
          setPin('');
          setError('');
        }, 1500);
      }
    } catch {
      setError('Gagal memverifikasi PIN');
      setTimeout(() => {
        setPin('');
        setError('');
      }, 1500);
    } finally {
      setVerifying(false);
    }
  };

  // Warna avatar random per siswa
  const avatarColors = [
    'bg-blue-400', 'bg-emerald-400', 'bg-violet-400',
    'bg-amber-400', 'bg-rose-400', 'bg-cyan-400',
    'bg-indigo-400', 'bg-teal-400',
  ];

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-blue-100 opacity-50 blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 rounded-full bg-violet-100 opacity-50 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-100 opacity-30 blur-3xl" />
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="text-4xl md:text-5xl font-black bg-linear-to-r from-blue-500 via-violet-500 to-emerald-500 bg-clip-text text-transparent">
          FUN-MATH
        </h1>
        <p className="text-muted-foreground mt-2 text-lg font-medium">
          Belajar Matematika Menyenangkan! 🎉
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {!selectedSiswa ? (
          /* ============================================
             Grid Pilih Siswa
             ============================================ */
          <motion.div
            key="grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md"
          >
            <p className="text-center text-sm font-semibold text-muted-foreground mb-4">
              Siapa yang mau belajar? 👋
            </p>

            {loading ? (
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {siswaList.map((siswa, i) => (
                  <motion.button
                    key={siswa.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.1 }}
                    whileHover={{ scale: 1.08, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedSiswa(siswa)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-transparent hover:border-primary/30 bg-card shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    {/* Avatar */}
                    {siswa.avatar_url ? (
                      <Image
                        src={siswa.avatar_url}
                        alt={siswa.nama}
                        width={64}
                        height={64}
                        className="rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-16 h-16 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center`}
                      >
                        <User className="w-8 h-8 text-white" />
                      </div>
                    )}
                    <span className="text-sm font-bold truncate w-full text-center">
                      {siswa.nama}
                    </span>
                    {siswa.kelas && (
                      <span className="text-xs text-muted-foreground">{siswa.kelas}</span>
                    )}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          /* ============================================
             Input PIN
             ============================================ */
          <motion.div
            key="pin"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center gap-6 w-full max-w-sm"
          >
            {/* Avatar & nama */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="flex flex-col items-center gap-2"
            >
              {selectedSiswa.avatar_url ? (
                <Image
                  src={selectedSiswa.avatar_url}
                  alt={selectedSiswa.nama}
                  width={80}
                  height={80}
                  className="rounded-full object-cover ring-4 ring-primary/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center ring-4 ring-primary/10">
                  <User className="w-10 h-10 text-primary" />
                </div>
              )}
              <h2 className="text-xl font-bold">{selectedSiswa.nama}</h2>
            </motion.div>

            {/* PIN input */}
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-4 h-4" />
                <span className="text-sm font-medium">Masukkan PIN</span>
              </div>

              <InputOTP
                maxLength={4}
                value={pin}
                onChange={handlePinComplete}
                disabled={verifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>

              {/* Loading indicator saat verifikasi */}
              {verifying && (
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              )}

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-1.5 text-sm font-semibold animate-shake"
                    style={{ color: 'var(--input-wrong-border)' }}
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Tombol kembali */}
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedSiswa(null);
                setPin('');
                setError('');
              }}
              className="text-muted-foreground"
            >
              ← Pilih siswa lain
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Link admin */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 right-4"
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/login')}
          className="text-xs text-muted-foreground gap-1 opacity-60 hover:opacity-100"
        >
          <GraduationCap className="w-3.5 h-3.5" />
          Guru
        </Button>
      </motion.div>
    </div>
  );
}
