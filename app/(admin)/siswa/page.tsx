'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';
import { toast } from "sonner";
import type { Siswa } from '@/lib/supabase/types';

export default function KelolaSiswaPage() {
  const [siswaList, setSiswaList] = useState<Siswa[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editSiswa, setEditSiswa] = useState<Siswa | null>(null);
  const [siswaToDelete, setSiswaToDelete] = useState<string | null>(null);
  
  // Form State
  const [nama, setNama] = useState('');
  const [kelas, setKelas] = useState('');
  const [pin, setPin] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  const fetchSiswa = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('siswa').select('*').order('nama');
    if (!error && data) {
      setSiswaList(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSiswa();
  }, []);

  const openDialog = (siswa?: Siswa) => {
    if (siswa) {
      setEditSiswa(siswa);
      setNama(siswa.nama);
      setKelas(siswa.kelas ?? '');
      setPin(siswa.pin ?? '');
    } else {
      setEditSiswa(null);
      setNama('');
      setKelas('');
      setPin('');
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditSiswa(null);
  };

  const handleSave = async () => {
    if (!nama || !pin) {
      toast.error('Nama dan PIN wajib diisi!');
      return;
    }
    if (pin.length !== 4) {
      toast.error('PIN harus 4 digit angka!');
      return;
    }
    
    setIsSaving(true);
    try {
      if (editSiswa) {
        // Update
        // @ts-ignore
        const { error } = await supabase.from('siswa').update({ nama, kelas: kelas || null, pin: pin || null }).eq('id', editSiswa.id);
        if (error) throw error;
      } else {
        // Insert
        // @ts-ignore
        const { error } = await supabase.from('siswa').insert([{ nama, kelas: kelas || null, pin: pin || null }]);
        if (error) throw error;
      }
      
      await fetchSiswa();
      closeDialog();
      toast.success(`Data siswa berhasil ${editSiswa ? 'diperbarui' : 'ditambahkan'}!`);
    } catch (err: any) {
      toast.error('Gagal menyimpan data: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!siswaToDelete) return;
    try {
      const { error } = await supabase.from('siswa').delete().eq('id', siswaToDelete);
      if (error) throw error;
      await fetchSiswa();
      toast.success('Data siswa berhasil dihapus!');
    } catch (err: any) {
      toast.error('Gagal menghapus data: ' + err.message);
    } finally {
      setSiswaToDelete(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kelola Akun Siswa</h1>
          <p className="text-sm text-muted-foreground">Tambah, edit, atau hapus data siswa dan PIN login mereka.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => openDialog()} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4" />
              Tambah Siswa
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input 
                  id="nama" 
                  value={nama} 
                  onChange={(e) => setNama(e.target.value)} 
                  placeholder="Contoh: Budi Santoso" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="kelas">Kelas</Label>
                <Input 
                  id="kelas" 
                  value={kelas} 
                  onChange={(e) => setKelas(e.target.value)} 
                  placeholder="Contoh: Kelas 7" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pin">PIN (4 Digit)</Label>
                <Input 
                  id="pin" 
                  type="text" 
                  maxLength={4}
                  value={pin} 
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} 
                  placeholder="Contoh: 1234" 
                />
                <p className="text-xs text-muted-foreground">PIN ini digunakan siswa untuk masuk ke aplikasi.</p>
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
          <CardTitle>Daftar Siswa Terdaftar</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex items-center justify-center py-8">
               <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
             </div>
          ) : siswaList.length === 0 ? (
             <div className="text-center py-8 text-muted-foreground">Belum ada data siswa.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kelas</TableHead>
                  <TableHead>PIN</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {siswaList.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {s.avatar_url ? (
                          <Image src={s.avatar_url} alt={s.nama} width={32} height={32} className="rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <User className="w-4 h-4 text-blue-600" />
                          </div>
                        )}
                        <span className="font-medium">{s.nama}</span>
                      </div>
                    </TableCell>
                    <TableCell>{s.kelas || '-'}</TableCell>
                    <TableCell>
                      <span className="font-mono bg-muted px-2 py-1 rounded text-sm">{s.pin}</span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(s)}>
                        <Pencil className="w-4 h-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setSiswaToDelete(s.id)}>
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

      <AlertDialog open={!!siswaToDelete} onOpenChange={(open) => !open && setSiswaToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Siswa</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin ingin menghapus siswa ini? Semua sesi latihan dan riwayat nilainya akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700 text-white">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
