// app/admin/layout.tsx
import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { logoutAction } from '@/lib/supabase/actions';

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row antialiased font-sans">
      
      {/* Sidebar - responsive on desktop, collapsed/header on mobile */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between flex-shrink-0">
        
        {/* Top brand */}
        <div>
          <div className="p-6 border-b border-slate-850 flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs">
              A
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">ULTREON™ 3.0</span>
              </div>
              <h2 className="text-sm font-bold text-slate-50">Admin Console</h2>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            <Link
              href="/admin"
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold font-mono tracking-wide uppercase text-slate-400 hover:text-cyan-400 hover:bg-slate-950/30 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2v-4zM14 16a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2v-4z" />
              </svg>
              Resumen
            </Link>

            <Link
              href="/admin/hospitals"
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold font-mono tracking-wide uppercase text-slate-400 hover:text-cyan-400 hover:bg-slate-950/30 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Hospitales
            </Link>

            <Link
              href="/admin/users"
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold font-mono tracking-wide uppercase text-slate-400 hover:text-cyan-400 hover:bg-slate-950/30 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Usuarios
            </Link>

            <Link
              href="/admin/investigators"
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold font-mono tracking-wide uppercase text-slate-400 hover:text-cyan-400 hover:bg-slate-950/30 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Investigadores
            </Link>

            <Link
              href="/admin/operators"
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold font-mono tracking-wide uppercase text-slate-400 hover:text-cyan-400 hover:bg-slate-950/30 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Operadores
            </Link>

            <Link
              href="/admin/business-intelligence"
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold font-mono tracking-wide uppercase text-slate-400 hover:text-cyan-400 hover:bg-slate-950/30 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Inteligencia de Negocios
            </Link>

            <Link
              href="/admin/site-monitoring"
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold font-mono tracking-wide uppercase text-slate-400 hover:text-cyan-400 hover:bg-slate-950/30 rounded-xl transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Site Monitoring
            </Link>

            <Link
              href="/dashboard"
              className="flex items-center gap-3 px-4 py-3 text-xs font-bold font-mono tracking-wide uppercase text-cyan-400/80 hover:text-cyan-450 hover:bg-slate-950/30 rounded-xl transition-all border border-dashed border-cyan-800/25 mt-6"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Ver Registro
            </Link>
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-850 flex items-center justify-between gap-2 text-xs bg-slate-950/20">
          <div className="flex flex-col">
            <span className="font-bold text-slate-200 truncate max-w-[120px]">{profile.full_name || user.email}</span>
            <span className="text-[10px] text-slate-500 uppercase font-mono">Administrador</span>
          </div>
          <form action={handleLogout}>
            <button
              type="submit"
              className="p-2 bg-slate-900 hover:bg-red-950/40 border border-slate-800 text-slate-400 hover:text-red-400 rounded-lg transition-all cursor-pointer"
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
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950">
        <div className="p-6 md:p-8 space-y-6 overflow-y-auto h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
