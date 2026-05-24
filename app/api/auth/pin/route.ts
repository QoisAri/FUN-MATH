// ============================================
// API Route — Verifikasi PIN Siswa (Server-side)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** POST /api/auth/pin — Validasi PIN siswa */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { siswa_id, pin } = body;

  if (!siswa_id || !pin) {
    return NextResponse.json({ error: 'siswa_id dan pin wajib diisi' }, { status: 400 });
  }

  const supabase = await createClient();

  const { data, error } = await (supabase as any)
    .from('siswa')
    .select('id, pin')
    .eq('id', siswa_id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Siswa tidak ditemukan' }, { status: 404 });
  }

  if (data.pin !== pin) {
    return NextResponse.json({ valid: false, error: 'PIN salah' }, { status: 401 });
  }

  // Set secure HttpOnly cookie untuk autentikasi siswa
  const response = NextResponse.json({ valid: true });
  response.cookies.set({
    name: 'siswa_session',
    value: siswa_id,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 1 minggu
  });

  return response;
}
