// ============================================
// Database Types — Auto-generated from schema
// ============================================
// Tipe ini harus sinkron dengan schema SQL di supabase/schema.sql

export interface Database {
  public: {
    Tables: {
      siswa: {
        Row: {
          id: string;
          nama: string;
          kelas: string | null;
          avatar_url: string | null;
          pin: string | null;
          dibuat_pada: string;
        };
        Insert: {
          id?: string;
          nama: string;
          kelas?: string | null;
          avatar_url?: string | null;
          pin?: string | null;
          dibuat_pada?: string;
        };
        Update: {
          id?: string;
          nama?: string;
          kelas?: string | null;
          avatar_url?: string | null;
          pin?: string | null;
          dibuat_pada?: string;
        };
      };
      sesi_latihan: {
        Row: {
          id: string;
          siswa_id: string;
          operasi: 'penjumlahan' | 'pengurangan' | 'perkalian';
          skor: number;
          total_soal: number;
          benar: number;
          salah: number;
          durasi_detik: number | null;
          selesai_pada: string;
        };
        Insert: {
          id?: string;
          siswa_id: string;
          operasi: 'penjumlahan' | 'pengurangan' | 'perkalian';
          skor?: number;
          total_soal?: number;
          benar?: number;
          salah?: number;
          durasi_detik?: number | null;
          selesai_pada?: string;
        };
        Update: {
          id?: string;
          siswa_id?: string;
          operasi?: 'penjumlahan' | 'pengurangan' | 'perkalian';
          skor?: number;
          total_soal?: number;
          benar?: number;
          salah?: number;
          durasi_detik?: number | null;
          selesai_pada?: string;
        };
      };
      detail_jawaban: {
        Row: {
          id: string;
          sesi_id: string;
          soal: {
            angka1: number;
            angka2: number;
            operasi: string;
          };
          jawaban_siswa: {
            kolom: number[];
          } | null;
          status: 'benar' | 'salah' | 'diungkap';
          jumlah_percobaan: number;
          waktu_detik: number | null;
        };
        Insert: {
          id?: string;
          sesi_id: string;
          soal: {
            angka1: number;
            angka2: number;
            operasi: string;
          };
          jawaban_siswa?: {
            kolom: number[];
          } | null;
          status: 'benar' | 'salah' | 'diungkap';
          jumlah_percobaan?: number;
          waktu_detik?: number | null;
        };
        Update: {
          id?: string;
          sesi_id?: string;
          soal?: {
            angka1: number;
            angka2: number;
            operasi: string;
          };
          jawaban_siswa?: {
            kolom: number[];
          } | null;
          status?: 'benar' | 'salah' | 'diungkap';
          jumlah_percobaan?: number;
          waktu_detik?: number | null;
        };
      };
      soal: {
        Row: {
          id: string;
          operasi: string;
          angka1: number;
          angka2: number;
          kesulitan: 'mudah' | 'sedang' | 'sulit';
          aktif: boolean;
        };
        Insert: {
          id?: string;
          operasi: string;
          angka1: number;
          angka2: number;
          kesulitan: 'mudah' | 'sedang' | 'sulit';
          aktif?: boolean;
        };
        Update: {
          id?: string;
          operasi?: string;
          angka1?: number;
          angka2?: number;
          kesulitan?: 'mudah' | 'sedang' | 'sulit';
          aktif?: boolean;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

/** Shortcut types for convenience */
export type Siswa = Database['public']['Tables']['siswa']['Row'];
export type SesiLatihan = Database['public']['Tables']['sesi_latihan']['Row'];
export type DetailJawaban = Database['public']['Tables']['detail_jawaban']['Row'];
export type SoalDB = Database['public']['Tables']['soal']['Row'];
