// ============================================
// API Route — CRUD Siswa
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** GET /api/siswa — Daftar semua siswa */
export async function GET() {
  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('siswa')
    .select('*')
    .order('nama');

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/** POST /api/siswa — Tambah siswa baru */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { nama, kelas, pin, avatar_url } = body;

  if (!nama) {
    return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('siswa')
    .insert({ nama, kelas, pin, avatar_url })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

/** PATCH /api/siswa — Update siswa */
export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('siswa')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
