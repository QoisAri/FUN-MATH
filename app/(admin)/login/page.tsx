'use client';

// ============================================
// Login Admin — Email + Password
// ============================================

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { GraduationCap, LogIn, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      router.push('/dashboard');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login gagal';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center min-h-screen p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Login Guru</h1>
          <p className="text-sm text-muted-foreground">
            Masuk ke dashboard admin FUN-MATH
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="guru@sekolah.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-1.5 text-sm text-destructive"
            >
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {error}
            </motion.p>
          )}

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            Masuk
          </Button>
        </form>

        {/* Back to student */}
        <Button
          variant="ghost"
          className="w-full mt-4 text-muted-foreground"
          onClick={() => router.push('/')}
        >
          ← Kembali ke halaman siswa
        </Button>
      </motion.div>
    </div>
  );
}
