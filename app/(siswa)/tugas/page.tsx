'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ClipboardList, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function TugasPage() {
  const router = useRouter();
  const [tugasPerOperasi, setTugasPerOperasi] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchTugas = async () => {
      const siswaId = sessionStorage.getItem('siswaId');
      if (!siswaId) {
        router.replace('/');
        return;
      }
      
      const { data: soalAktif } = await supabase.from('soal').select('*').eq('aktif', true);
      if (!soalAktif || soalAktif.length === 0) {
        setTugasPerOperasi({ penjumlahan: 0, pengurangan: 0, perkalian: 0 });
        setLoading(false);
        return;
      }

      const { data: sesiList } = await supabase.from('sesi_latihan').select('id').eq('siswa_id', siswaId);
      
      const attempted = new Set();
      if (sesiList && sesiList.length > 0) {
        const sesiIds = (sesiList as any[]).map(s => s.id);
        const { data: detailList } = await supabase.from('detail_jawaban').select('soal').in('sesi_id', sesiIds);
        if (detailList) {
          (detailList as any[]).forEach(d => {
            if (d.soal && typeof d.soal === 'object') {
              const s = d.soal as any;
              attempted.add(`${s.angka1}-${s.angka2}-${s.operasi}`);
            }
          });
        }
      }

      const pending = (soalAktif as any[]).filter(s => !attempted.has(`${s.angka1}-${s.angka2}-${s.operasi}`));
      
      const counts: Record<string, number> = {
        penjumlahan: 0,
        pengurangan: 0,
        perkalian: 0,
      };

      pending.forEach(s => {
        if (counts[s.operasi] !== undefined) {
          counts[s.operasi]++;
        }
      });

      setTugasPerOperasi(counts);
      setLoading(false);
    };
    fetchTugas();
  }, [router]);

  const mulaiTugas = (operasi: string) => {
    router.push(`/tugas/kerjakan?op=${operasi}`);
  };

  const operasiList = [
    { id: 'penjumlahan', title: 'Penjumlahan', icon: '➕', color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200 hover:border-blue-400' },
    { id: 'pengurangan', title: 'Pengurangan', icon: '➖', color: 'text-emerald-600', bg: 'bg-emerald-100', border: 'border-emerald-200 hover:border-emerald-400' },
    { id: 'perkalian', title: 'Perkalian', icon: '✖️', color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200 hover:border-purple-400' },
  ];

  return (
    <div className="flex-1 flex flex-col items-center p-6">
      <div className="w-full max-w-md flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Daftar Tugas</h1>
            <p className="text-muted-foreground text-sm">Selesaikan tugas dari guru ya!</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col gap-4 mt-4">
            {operasiList.map((op, i) => {
              const count = tugasPerOperasi[op.id] || 0;
              const isSelesai = count === 0;

              return (
                <motion.button
                  key={op.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={!isSelesai ? { scale: 1.02 } : {}}
                  whileTap={!isSelesai ? { scale: 0.98 } : {}}
                  onClick={() => !isSelesai && mulaiTugas(op.id)}
                  disabled={isSelesai}
                  className={`relative flex items-center p-4 bg-card border-2 rounded-2xl shadow-sm transition-all text-left ${
                    isSelesai 
                      ? 'border-border opacity-60 cursor-default' 
                      : op.border + ' cursor-pointer'
                  }`}
                >
                  <div className={`w-12 h-12 ${op.bg} rounded-xl flex items-center justify-center text-xl mr-4 shrink-0`}>
                    {op.icon}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{op.title}</h3>
                    {isSelesai ? (
                      <p className="text-sm text-green-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Sudah Selesai
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground font-medium">
                        Ada {count} soal belum dikerjakan
                      </p>
                    )}
                  </div>

                  {!isSelesai && (
                    <div className="ml-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-lg shrink-0">
                      Mulai
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
