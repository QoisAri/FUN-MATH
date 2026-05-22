// ============================================
// API Route — Simpan Sesi Latihan
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/** POST /api/sesi — Simpan sesi latihan + detail jawaban */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { siswa_id, operasi, skor, total_soal, benar, salah, durasi_detik, detail } = body;

  if (!siswa_id || !operasi) {
    return NextResponse.json({ error: 'siswa_id dan operasi wajib diisi' }, { status: 400 });
  }

  const supabase = await createClient();

  // Insert sesi — use explicit type assertion
  const { data: sesi, error: sesiError } = await (supabase as any)
    .from('sesi_latihan')
    .insert({ siswa_id, operasi, skor, total_soal, benar, salah, durasi_detik })
    .select()
    .single();

  if (sesiError) {
    return NextResponse.json({ error: sesiError.message }, { status: 500 });
  }

  // Insert detail jawaban (jika ada)
  if (detail && Array.isArray(detail) && detail.length > 0) {
    const detailWithSesiId = detail.map((d: Record<string, unknown>) => ({
      ...d,
      sesi_id: sesi.id,
    }));

    const { error: detailError } = await (supabase as any)
      .from('detail_jawaban')
      .insert(detailWithSesiId);

    if (detailError) {
      return NextResponse.json({ error: detailError.message }, { status: 500 });
    }
  }

  return NextResponse.json(sesi, { status: 201 });
}

/** GET /api/sesi?siswa_id=xxx — Daftar sesi per siswa */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const siswaId = searchParams.get('siswa_id');

  const supabase = await createClient();

  let query = (supabase as any).from('sesi_latihan').select('*').order('selesai_pada', { ascending: false });

  if (siswaId) {
    query = query.eq('siswa_id', siswaId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

