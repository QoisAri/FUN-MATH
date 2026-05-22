'use client';

// ============================================
// Detail Siswa — Riwayat Sesi + Analisis
// ============================================

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, User, Calendar, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { OPERASI_LABEL } from '@/lib/constants';
import type { Siswa, SesiLatihan } from '@/lib/supabase/types';

export default function DetailSiswaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: siswaId } = use(params);

  const router = useRouter();
  const [siswa, setSiswa] = useState<Siswa | null>(null);
  const [sesiList, setSesiList] = useState<SesiLatihan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!siswaId) return;

    async function fetchData() {
      try {
        const supabase = createClient();

        const { data: siswaData } = await supabase
          .from('siswa')
          .select('*')
          .eq('id', siswaId)
          .single();

        const { data: sesiData } = await supabase
          .from('sesi_latihan')
          .select('*')
          .eq('siswa_id', siswaId)
          .order('selesai_pada', { ascending: false });

        if (siswaData) setSiswa(siswaData);
        if (sesiData) setSesiList(sesiData);
      } catch {
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [siswaId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!siswa) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-[50vh]">
        <p className="text-muted-foreground">Siswa tidak ditemukan</p>
        <Button onClick={() => router.back()}>← Kembali</Button>
      </div>
    );
  }

  const totalSesi = sesiList.length;
  const rataRata = totalSesi > 0
    ? Math.round(sesiList.reduce((acc, s) => acc + s.skor, 0) / totalSesi)
    : 0;
  const totalBenar = sesiList.reduce((acc, s) => acc + s.benar, 0);
  const totalSoal = sesiList.reduce((acc, s) => acc + s.total_soal, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <div className="flex items-center gap-3">
          {siswa.avatar_url ? (
            <Image src={siswa.avatar_url} alt={siswa.nama} width={48} height={48} className="rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-6 h-6 text-primary" />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">{siswa.nama}</h1>
            <p className="text-sm text-muted-foreground">{siswa.kelas ?? 'Belum ada kelas'}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{totalSesi}</p>
            <p className="text-xs text-muted-foreground">Total Sesi</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{rataRata}%</p>
            <p className="text-xs text-muted-foreground">Rata-rata</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{totalBenar}</p>
            <p className="text-xs text-muted-foreground">Soal Benar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{totalSoal}</p>
            <p className="text-xs text-muted-foreground">Total Soal</p>
          </CardContent>
        </Card>
      </div>

      {/* Riwayat sesi */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Sesi Latihan</CardTitle>
        </CardHeader>
        <CardContent>
          {sesiList.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Belum ada sesi latihan
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Operasi</TableHead>
                  <TableHead className="text-center">Skor</TableHead>
                  <TableHead className="text-center">Benar</TableHead>
                  <TableHead className="text-center">Salah</TableHead>
                  <TableHead className="text-center">Durasi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sesiList.map((sesi) => (
                  <TableRow key={sesi.id}>
                    <TableCell className="text-sm">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                        {new Date(sesi.selesai_pada).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        {OPERASI_LABEL[sesi.operasi as keyof typeof OPERASI_LABEL] ?? sesi.operasi}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center font-bold">
                      <div className="flex items-center justify-center gap-1">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        {sesi.skor}%
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-emerald-600 font-medium">
                      {sesi.benar}
                    </TableCell>
                    <TableCell className="text-center text-red-500 font-medium">
                      {sesi.salah}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground text-sm">
                      {sesi.durasi_detik ? `${Math.floor(sesi.durasi_detik / 60)}m ${sesi.durasi_detik % 60}s` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
