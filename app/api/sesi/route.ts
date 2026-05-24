// ============================================
// API Route — Simpan Sesi Latihan
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

/** POST /api/sesi — Simpan sesi latihan + detail jawaban */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { siswa_id, operasi, skor, total_soal, benar, salah, durasi_detik, detail } = body;

  // Autentikasi: Verifikasi bahwa yang submit adalah siswa yang login
  const sessionCookie = request.cookies.get('siswa_session')?.value;
  if (!sessionCookie || sessionCookie !== siswa_id) {
    return NextResponse.json({ error: 'Unauthorized: sesi tidak valid atau bukan milik Anda' }, { status: 401 });
  }

  // Gunakan admin client untuk insert data (bypassing RLS)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Insert sesi
  const { data: sesi, error: sesiError } = await supabaseAdmin
    .from('sesi_latihan')
    .insert({ siswa_id, operasi, skor, total_soal, benar, salah, durasi_detik })
    .select()
    .single();

  if (sesiError || !sesi) {
    return NextResponse.json({ error: sesiError?.message || 'Gagal menyimpan sesi' }, { status: 500 });
  }

  // Insert detail jawaban (jika ada)
  if (detail && Array.isArray(detail) && detail.length > 0) {
    const detailWithSesiId = detail.map((d: Record<string, unknown>) => ({
      ...d,
      sesi_id: sesi.id,
    }));

    const { error: detailError } = await supabaseAdmin
      .from('detail_jawaban')
      .insert(detailWithSesiId);

    if (detailError) {
      return NextResponse.json({ error: detailError.message }, { status: 500 });
    }
  }

  return NextResponse.json(sesi, { status: 201 });
}

/** GET /api/sesi?siswa_id=xxx — Daftar sesi per siswa (HANYA ADMIN) */
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Autentikasi: Hanya admin (user yang terautentikasi di Supabase Auth) yang bisa baca
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: hanya admin yang dapat mengakses' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const siswaId = searchParams.get('siswa_id');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
