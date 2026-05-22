'use client';

// ============================================
// Dashboard Admin — Ringkasan Data
// ============================================
// Total siswa, total sesi, rata-rata skor.
// Chart performa. List siswa terbaru. Export PDF.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Users, BookOpen, TrendingUp, FileDown, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { createClient } from '@/lib/supabase/client';
import type { Siswa, SesiLatihan } from '@/lib/supabase/types';

interface SiswaWithStats extends Siswa {
  totalSesi: number;
  rataRataSkor: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [siswaList, setSiswaList] = useState<SiswaWithStats[]>([]);
  const [totalSesi, setTotalSesi] = useState(0);
  const [rataRata, setRataRata] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createClient();

        // Fetch siswa
        const { data: siswa } = await supabase.from('siswa').select('*').order('nama') as { data: Siswa[] | null };

        // Fetch sesi
        const { data: sesi } = await supabase.from('sesi_latihan').select('*') as { data: SesiLatihan[] | null };

        if (siswa && sesi) {
          const withStats: SiswaWithStats[] = siswa.map((s) => {
            const sesiSiswa = sesi.filter((se) => se.siswa_id === s.id);
            const totalSkor = sesiSiswa.reduce((acc, se) => acc + (se.skor ?? 0), 0);
            return {
              ...s,
              totalSesi: sesiSiswa.length,
              rataRataSkor: sesiSiswa.length > 0 ? Math.round(totalSkor / sesiSiswa.length) : 0,
            };
          });

          setSiswaList(withStats);
          setTotalSesi(sesi.length);
          const allSkor = sesi.reduce((acc, se) => acc + (se.skor ?? 0), 0);
          setRataRata(sesi.length > 0 ? Math.round(allSkor / sesi.length) : 0);
        }
      } catch (err) {
        console.error('Gagal memuat data dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Export PDF (basic)
  const handleExport = async () => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Laporan FUN-MATH', 14, 20);
    doc.setFontSize(10);
    doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 28);

    doc.setFontSize(12);
    doc.text('Daftar Siswa:', 14, 40);

    let y = 48;
    siswaList.forEach((s, i) => {
      doc.setFontSize(10);
      doc.text(
        `${i + 1}. ${s.nama} (${s.kelas ?? '-'}) — Sesi: ${s.totalSesi}, Rata-rata: ${s.rataRataSkor}`,
        14,
        y
      );
      y += 8;
    });

    doc.save('laporan-funmath.pdf');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Ringkasan data pembelajaran</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2">
          <FileDown className="w-4 h-4" />
          Export PDF
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Siswa</CardTitle>
              <Users className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{siswaList.length}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Sesi</CardTitle>
              <BookOpen className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{totalSesi}</p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata Skor</CardTitle>
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{rataRata}%</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabel siswa */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Siswa</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead className="text-center">Sesi</TableHead>
                  <TableHead className="text-center">Rata-rata</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {siswaList.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer hover:bg-muted/50" onClick={() => router.push(`/siswa/${s.id}`)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {s.avatar_url ? (
                          <Image src={s.avatar_url} alt={s.nama} width={32} height={32} className="rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                        )}
                        <span className="font-medium">{s.nama}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{s.kelas ?? '-'}</TableCell>
                    <TableCell className="text-center">{s.totalSesi}</TableCell>
                    <TableCell className="text-center font-semibold">{s.rataRataSkor}%</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">Detail →</TableCell>
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
