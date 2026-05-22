// ============================================
// Middleware — Proteksi Route Admin
// ============================================
// Route /dashboard dan /siswa/* memerlukan auth Supabase.
// Redirect ke /login jika belum login.

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const PROTECTED_ROUTES = ['/dashboard', '/siswa'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Hanya cek route admin yang dilindungi
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route));
  if (!isProtected) return NextResponse.next();

  // Buat Supabase client untuk membaca session dari cookies
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response = NextResponse.next({ request });
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Cek apakah user sudah login
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Redirect ke login
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*', '/siswa/:path*'],
};
