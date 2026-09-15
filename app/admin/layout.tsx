// app/admin/layout.tsx
import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { logoutAction } from '@/lib/supabase/actions';
import AdminNav from './AdminNav';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Double check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, is_active')
    .eq('id', user.id)
    .single();

  if (!profile || !profile.is_active || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  async function handleLogout() {
    'use server';
    await logoutAction();
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row antialiased font-sans">
      
      {/* Sidebar - responsive on desktop, collapsed/header on mobile */}
      <aside className="w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-border flex flex-col justify-between flex-shrink-0">
        
        {/* Top brand */}
        <div>
          <div className="p-6 border-b border-border flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs">
              A
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">ULTREON™ 3.0</span>
              </div>
              <h2 className="text-sm font-bold text-foreground">Admin Console</h2>
            </div>
          </div>

          {/* Navigation Links */}
          <AdminNav />
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-border flex items-center justify-between gap-2 text-xs bg-background/20">
          <div className="flex flex-col">
            <span className="font-bold text-foreground truncate max-w-[120px]">{profile.full_name || user.email}</span>
            <span className="text-[10px] text-muted-foreground uppercase font-mono">Administrador</span>
          </div>
          <form action={handleLogout}>
            <button
              type="submit"
              className="p-2 bg-card hover:bg-red-950/40 border border-border text-muted-foreground hover:text-red-400 rounded-lg transition-all cursor-pointer"
              title="Cerrar Sesión"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Panel Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-background">
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
