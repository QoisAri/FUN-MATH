'use client';

// ============================================
// Layout Admin — Sidebar + Content
// ============================================

import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, BookOpen, LogOut, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard?tab=siswa', icon: Users, label: 'Siswa' },
  { href: '/dashboard?tab=soal', icon: BookOpen, label: 'Soal' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar — hidden di mobile */}
      <motion.aside
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-60 border-r border-border bg-card flex-col p-4 gap-2 hidden md:flex"
      >
        {/* Logo */}
        <div className="flex items-center gap-2 px-3 py-4 mb-4">
          <GraduationCap className="w-6 h-6 text-primary" />
          <span className="font-bold text-lg">FUN-MATH</span>
          <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
            Admin
          </span>
        </div>

        {/* Nav items — sekarang memiliki href unik */}
        {NAV_ITEMS.map((item) => {
          const isActive = pathname + (typeof window !== 'undefined' ? window.location.search : '') === item.href
            || (item.href === '/dashboard' && pathname === '/dashboard');
          return (
            <Button
              key={item.label}
              variant={isActive ? 'secondary' : 'ghost'}
              className="w-full justify-start gap-3"
              onClick={() => router.push(item.href)}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Button>
          );
        })}

        <div className="flex-1" />

        {/* Logout */}
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4" />
          Keluar
        </Button>
      </motion.aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-primary" />
          <span className="font-bold">Admin</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
        </Button>
      </div>

      {/* Content */}
      <main className="flex-1 flex flex-col md:p-6 p-4 pt-16 md:pt-6">
        {children}
      </main>
    </div>
  );
}
