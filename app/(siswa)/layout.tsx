'use client';

// ============================================
// Layout Siswa — Shared layout untuk alur siswa
// ============================================
// Header sederhana (nama siswa + avatar kecil)
// Session guard: redirect ke / jika session kosong
// Tombol kembali (navigasi mundur)

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowLeft, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SiswaLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isReady, setIsReady] = useState(false);

  // Session guard — redirect jika session kosong (misal setelah refresh)
  useEffect(() => {
    const siswaId = sessionStorage.getItem('siswaId');
    if (!siswaId) {
      router.replace('/');
      return;
    }
    setNama(sessionStorage.getItem('siswaNama') ?? 'Siswa');
    setAvatar(sessionStorage.getItem('siswaAvatar') ?? '');
    setIsReady(true);
  }, [router]);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push('/');
  };

  // Jangan render content sebelum session di-cek
  if (!isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-md border-b border-border"
      >
        {/* Kiri: tombol kembali */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          aria-label="Kembali"
          className="rounded-full"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Tengah: logo kecil */}
        <span className="text-lg font-extrabold bg-linear-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
          FUN-MATH
        </span>

        {/* Kanan: profil */}
        <div className="flex items-center gap-2">
          {avatar ? (
            <Image
              src={avatar}
              alt={nama}
              width={32}
              height={32}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
          )}
          <span className="text-sm font-bold hidden sm:block">{nama}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            aria-label="Keluar"
            className="rounded-full w-8 h-8"
          >
            <LogOut className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
      </motion.header>

      {/* Content */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
