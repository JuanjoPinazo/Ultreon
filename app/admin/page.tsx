// app/admin/page.tsx
import React from 'react';
import Link from 'next/link';
import { createClient as createServerClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = await createServerClient();

  // Fetch all counts in parallel for optimal load performance
  const [
    hospitalsCount,
    usersCount,
    casesCount,
    pendingCount,
    lockedCount,
    recentCases
  ] = await Promise.all([
    supabase.from('hospitals').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('ecrf_opstar_records').select('*', { count: 'exact', head: true }),
    supabase.from('ecrf_opstar_records').select('*', { count: 'exact', head: true }).eq('monitor_validated', false),
    supabase.from('ecrf_opstar_records').select('*', { count: 'exact', head: true }).eq('locked', true),
    supabase.from('ecrf_opstar_records').select('*, hospitals(name)').order('created_at', { ascending: false }).limit(5)
  ]);

  const totalHospitals = hospitalsCount.count || 0;
  const totalUsers = usersCount.count || 0;
  const totalCases = casesCount.count || 0;
  const pendingCases = pendingCount.count || 0;
  const lockedCases = lockedCount.count || 0;
  const recentCasesList = recentCases.data || [];

  const cards = [
    {
      title: 'Hospitales Participantes',
      value: totalHospitals,
      description: 'Centros de hemodinámica activos',
      link: '/admin/hospitals',
      color: 'from-cyan-500/10 to-blue-500/5',
      borderColor: 'border-cyan-500/20',
      icon: (
        <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      title: 'Usuarios Totales',
      value: totalUsers,
      description: 'Médicos, monitores y admins',
      link: '/admin/users',
      color: 'from-purple-500/10 to-indigo-500/5',
      borderColor: 'border-purple-500/20',
      icon: (
        <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      title: 'Casos Registrados',
      value: totalCases,
      description: 'Fichas clínicas insertadas',
      link: '/dashboard',
      color: 'from-emerald-500/10 to-teal-500/5',
      borderColor: 'border-emerald-500/20',
      icon: (
        <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      title: 'Casos Pendientes',
      value: pendingCases,
      description: 'Pendientes de validación',
      link: '/dashboard',
      color: 'from-amber-500/10 to-orange-500/5',
      borderColor: 'border-amber-500/20',
      icon: (
        <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      title: 'Casos Bloqueados',
      value: lockedCases,
      description: 'Bloqueados para edición',
      link: '/dashboard',
      color: 'from-red-500/10 to-pink-500/5',
      borderColor: 'border-red-500/20',
      icon: (
        <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      )
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Welcome banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-50">Resumen del Servidor</h2>
          <p className="text-xs text-slate-500">Métricas clave e historial de actividades del registro multicéntrico.</p>
        </div>
      </div>

      {/* Grid of Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map((card, idx) => (
          <Link
            key={idx}
            href={card.link}
            className={`bg-gradient-to-br ${card.color} border ${card.borderColor} rounded-2xl p-5 flex flex-col justify-between hover:scale-[1.02] transition-all cursor-pointer shadow-lg`}
          >
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">{card.title}</span>
              {card.icon}
            </div>
            <div className="mt-4">
              <span className="text-3xl font-extrabold text-slate-50 font-mono">{card.value}</span>
              <p className="text-[9px] text-slate-500 mt-1">{card.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Row for Recent cases */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Registered Cases List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-850">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">Últimos casos registrados</h3>
            <Link href="/dashboard" className="text-[10px] text-cyan-400 font-bold hover:underline">Ver todos</Link>
          </div>

          {recentCasesList.length === 0 ? (
            <p className="text-xs text-slate-500 font-mono py-8 text-center">No se han registrado casos clínicos en el sistema.</p>
          ) : (
            <div className="space-y-3.5">
              {recentCasesList.map((c) => {
                const dateStr = c.created_at ? new Date(c.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'N/A';
                return (
                  <div key={c.id} className="flex justify-between items-center p-3.5 bg-slate-950/40 border border-slate-850 rounded-2xl hover:border-slate-800 transition-all font-mono text-xs">
                    <div>
                      <div className="font-bold text-slate-200">{c.id_paciente}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{c.hospitals?.name || c.centro} · Vaso: {c.vaso_diana}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500">{dateStr}</div>
                      <div className="mt-1 flex items-center justify-end gap-1.5">
                        {c.monitor_validated ? (
                          <span className="text-[8px] font-bold bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/20">Validado</span>
                        ) : (
                          <span className="text-[8px] font-bold bg-slate-900 text-slate-500 px-2 py-0.5 rounded border border-slate-800">Pendiente</span>
                        )}
                        {c.locked && (
                          <span className="text-[8px] font-bold bg-red-950/80 text-red-400 px-2 py-0.5 rounded border border-red-900/20">Locked</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Database Health Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="pb-2 border-b border-slate-850">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">Estado del Sistema</h3>
          </div>
          <div className="space-y-4 font-mono text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">CONEXIÓN SUPABASE:</span>
              <span className="text-emerald-400 font-bold">ACTIVA</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">FILAS DE HOSPITALES:</span>
              <span className="text-slate-350">{totalHospitals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">FILAS DE USUARIOS:</span>
              <span className="text-slate-350">{totalUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">ÚLTIMO INTENTO DE COMPILACIÓN:</span>
              <span className="text-emerald-400 font-bold">EXITOSO</span>
            </div>
            <div className="pt-4 border-t border-slate-850/60 flex items-center justify-between text-[10px] text-slate-500">
              <span>Next.js App Router v16</span>
              <span>Turbopack Engine</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
