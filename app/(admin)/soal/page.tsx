'use client';

import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { createClient } from '@/lib/supabase/client';
import type { SoalDB as Soal } from '@/lib/supabase/types';

export default function KelolaSoalPage() {
  const [soalList, setSoalList] = useState<Soal[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editSoal, setEditSoal] = useState<Soal | null>(null);
  
  // Form State
  const [operasi, setOperasi] = useState('penjumlahan');
  const [angka1, setAngka1] = useState<number | ''>('');
  const [angka2, setAngka2] = useState<number | ''>('');
  const [kesulitan, setKesulitan] = useState('mudah');
  const [aktif, setAktif] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  const fetchSoal = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('soal').select('*').order('operasi');
    if (!error && data) {
      setSoalList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSoal();
  }, []);

  const openDialog = (soal?: Soal) => {
    if (soal) {
      setEditSoal(soal);
      setOperasi(soal.operasi);
      setAngka1(soal.angka1);
      setAngka2(soal.angka2);
      setKesulitan(soal.kesulitan);
      setAktif(soal.aktif ?? true);
    } else {
      setEditSoal(null);
      setOperasi('penjumlahan');
      setAngka1('');
      setAngka2('');
      setKesulitan('mudah');
      setAktif(true);
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditSoal(null);
  };

  const handleSave = async () => {
    if (angka1 === '' || angka2 === '') return alert('Angka 1 dan Angka 2 wajib diisi!');
    
    setIsSaving(true);
    try {
      if (editSoal) {
        // Update
        // @ts-ignore
        const { error } = await supabase.from('soal').update({ operasi, angka1: Number(angka1), angka2: Number(angka2), kesulitan, aktif }).eq('id', editSoal.id);
        if (error) throw error;
      } else {
        // Insert
        // @ts-ignore
        const { error } = await supabase.from('soal').insert([{ operasi, angka1: Number(angka1), angka2: Number(angka2), kesulitan, aktif }]);
        if (error) throw error;
      }
      
      await fetchSoal();
      closeDialog();
    } catch (err: any) {
      alert('Gagal menyimpan data: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus soal ini?')) return;
    try {
      const { error } = await supabase.from('soal').delete().eq('id', id);
      if (error) throw error;
      await fetchSoal();
    } catch (err: any) {
      alert('Gagal menghapus data: ' + err.message);
    }
  };

  const getOperasiSymbol = (op: string) => {
    switch (op) {
      case 'penjumlahan': return '+';
      case 'pengurangan': return '-';
      case 'perkalian': return '×';
      case 'pembagian': return '÷';
      default: return op;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelola Soal Latihan</h1>
          <p className="text-sm text-muted-foreground">Tambah, edit, atau hapus soal-soal matematika untuk siswa.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" />
              Tambah Soal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editSoal ? 'Edit Data Soal' : 'Tambah Soal Baru'}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="operasi">Operasi Matematika</Label>
                <Select value={operasi} onValueChange={setOperasi}>
                  <SelectTrigger id="operasi">
                    <SelectValue placeholder="Pilih operasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="penjumlahan">Penjumlahan (+)</SelectItem>
                    <SelectItem value="pengurangan">Pengurangan (-)</SelectItem>
                    <SelectItem value="perkalian">Perkalian (×)</SelectItem>
                    <SelectItem value="pembagian">Pembagian (÷)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="angka1">Angka 1</Label>
                  <Input 
                    id="angka1" 
                    type="number"
                    value={angka1} 
                    onChange={(e) => setAngka1(e.target.value === '' ? '' : Number(e.target.value))} 
                    placeholder="Contoh: 12" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="angka2">Angka 2</Label>
                  <Input 
                    id="angka2" 
                    type="number"
                    value={angka2} 
                    onChange={(e) => setAngka2(e.target.value === '' ? '' : Number(e.target.value))} 
                    placeholder="Contoh: 5" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kesulitan">Tingkat Kesulitan</Label>
                <Select value={kesulitan} onValueChange={setKesulitan}>
                  <SelectTrigger id="kesulitan">
                    <SelectValue placeholder="Pilih kesulitan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mudah">Mudah</SelectItem>
                    <SelectItem value="sedang">Sedang</SelectItem>
                    <SelectItem value="sulit">Sulit</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                  <Label htmlFor="aktif">Status Aktif</Label>
                  <p className="text-xs text-muted-foreground">Soal non-aktif tidak akan muncul di latihan siswa.</p>
                </div>
                <Switch 
                  id="aktif" 
                  checked={aktif} 
                  onCheckedChange={setAktif} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog}>Batal</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : 'Simpan Data'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bank Soal</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex items-center justify-center py-8">
               <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
             </div>
          ) : soalList.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">Belum ada data soal.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operasi</TableHead>
                  <TableHead>Soal</TableHead>
                  <TableHead>Kesulitan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {soalList.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="capitalize">{s.operasi}</TableCell>
                    <TableCell className="font-mono font-medium text-lg">
                      {s.angka1} {getOperasiSymbol(s.operasi)} {s.angka2} = ?
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-semibold
                        ${s.kesulitan === 'mudah' ? 'bg-green-100 text-green-700' : 
                          s.kesulitan === 'sedang' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-red-100 text-red-700'}`}>
                        {s.kesulitan}
                      </span>
                    </TableCell>
                    <TableCell>
                      {s.aktif ? (
                        <span className="text-green-600 font-medium text-sm">Aktif</span>
                      ) : (
                        <span className="text-muted-foreground font-medium text-sm">Non-aktif</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(s)}>
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
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
