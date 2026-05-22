// ============================================
// API Route — Manajemen Soal
// ============================================
// TODO: konfirmasi client — guru bisa menambahkan soal kustom

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** GET /api/soal — Daftar soal */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const operasi = searchParams.get('operasi');
  const kesulitan = searchParams.get('kesulitan');

  const supabase = await createClient();

  let query = (supabase as any).from('soal').select('*').eq('aktif', true);

  if (operasi) query = query.eq('operasi', operasi);
  if (kesulitan) query = query.eq('kesulitan', kesulitan);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/** POST /api/soal — Tambah soal kustom dari guru */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { operasi, angka1, angka2, kesulitan } = body;

  if (!operasi || !angka1 || !angka2 || !kesulitan) {
    return NextResponse.json(
      { error: 'operasi, angka1, angka2, dan kesulitan wajib diisi' },
      { status: 400 }
    );
  }

  // Validasi angka
  if (angka1 < 1 || angka1 > 999 || angka2 < 1 || angka2 > 999) {
    return NextResponse.json(
      { error: 'Angka harus antara 1-999' },
      { status: 400 }
    );
  }

  // Pengurangan: angka1 harus >= angka2
  if (operasi === 'pengurangan' && angka1 < angka2) {
    return NextResponse.json(
      { error: 'Untuk pengurangan, angka1 harus >= angka2' },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await (supabase as any)
    .from('soal')
    .insert({ operasi, angka1, angka2, kesulitan })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
