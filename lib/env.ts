// ============================================
// Environment Variables Validation
// ============================================
// Validasi env var saat startup agar error jelas saat deployment.

const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
] as const;

// Validasi hanya di runtime, bukan saat build
if (typeof window !== 'undefined' || process.env.NODE_ENV !== 'production') {
  for (const key of required) {
    if (!process.env[key]) {
      console.warn(`⚠️ Missing environment variable: ${key}`);
    }
  }
}

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
};
