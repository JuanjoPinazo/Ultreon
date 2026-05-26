// app/dashboard/page.tsx
import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { toggleCaseLockAction, toggleCaseValidationAction, logoutAction } from '@/lib/supabase/actions';
import DashboardFilters from './DashboardFilters';

export default async function DashboardPage(props: {
  searchParams: Promise<{
    hospital?: string;
    segment?: string;
    dateRange?: string;
  }>;
}) {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/login');
  }

  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('full_name, role, hospital_id, is_active, hospitals(name)')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    redirect('/login?error=inactive');
  }

  // Fetch all active hospitals from the database for filter purposes (Admins/Monitors only)
  let hospitals: { id: string; name: string }[] = [];
  if (profile.role === 'admin' || profile.role === 'monitor') {
    const { data: hospitalsData } = await supabase
      .from('hospitals')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    hospitals = hospitalsData || [];
  }

  // Fetch cases according to role, including joined strategy changes and optimization results
  let query = supabase
    .from('ecrf_opstar_records')
    .select('*, hospitals(name), opstar_strategy_changes(*), opstar_optimization_results(*)');

  if (profile.role === 'hospital_user') {
    if (profile.hospital_id) {
      query = query.eq('hospital_id', profile.hospital_id);
    } else {
      // If no hospital_id assigned, return empty list
      query = query.eq('id', '00000000-0000-0000-0000-000000000000');
    }
  }

  const { data: cases, error: casesError } = await query.order('created_at', { ascending: false });

  // Get search params for filtering
  const searchParams = await props.searchParams;
  const filterHospital = searchParams.hospital || '';
  const filterSegment = searchParams.segment || '';
  const filterDateRange = searchParams.dateRange || 'all';

  // Apply filters in memory
  const filteredCases = (cases || []).filter((record) => {
    // 1. Hospital Filter (only applicable to admins/monitors)
    if (profile.role === 'admin' || profile.role === 'monitor') {
      if (filterHospital && record.hospital_id !== filterHospital) {
        return false;
      }
    }

    // 2. Segment Filter (AHA Vaso Diana)
    if (filterSegment && record.vaso_diana !== filterSegment) {
      return false;
    }

    // 3. Date Range Filter
    if (filterDateRange !== 'all' && record.created_at) {
      const recordDate = new Date(record.created_at);
      const now = new Date();
      if (filterDateRange === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);
        if (recordDate < thirtyDaysAgo) return false;
      } else if (filterDateRange === '90days') {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(now.getDate() - 90);
        if (recordDate < ninetyDaysAgo) return false;
      } else if (filterDateRange === 'thisyear') {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        if (recordDate < startOfYear) return false;
      }
    }

    return true;
  });

  // Calculate clinical registry KPIs
  const totalCases = filteredCases.length;

  // Zero-contrast count
  const zeroContrastCount = filteredCases.filter(
    (r) => r.zero_contrast_completed || r.actual_contrast_ml === 0 || r.contraste_ml === 0
  ).length;
  const zeroContrastPercent = totalCases > 0 ? Math.round((zeroContrastCount / totalCases) * 100) : 0;

  // Strategy modified count
  const strategyModCount = filteredCases.filter((r) => {
    if (r.modifico_estrategia) return true;
    if (r.opstar_strategy_changes && r.opstar_strategy_changes[0]?.modified_strategy) return true;
    return false;
  }).length;
  const strategyModPercent = totalCases > 0 ? Math.round((strategyModCount / totalCases) * 100) : 0;

  // Average OPSTAR Score and suboptimal count (< 85 score)
  const scoreResults = filteredCases
    .map((r) => r.opstar_optimization_results?.[0]?.opstar_score)
    .filter((score) => score !== null && score !== undefined) as number[];

  const avgScore = scoreResults.length > 0 ? Math.round(scoreResults.reduce((a, b) => a + b, 0) / scoreResults.length) : 0;
  const suboptimalCount = scoreResults.filter((score) => score < 85).length;

  // Handle logout Server Action trigger
  async function handleLogout() {
    'use server';
    await logoutAction();
    redirect('/login');
  }

  // Lock handler
  async function handleToggleLock(id: string, currentStatus: boolean) {
    'use server';
    await toggleCaseLockAction(id, !currentStatus);
  }

  // Validation handler
  async function handleToggleValidate(id: string, currentStatus: boolean) {
    'use server';
    await toggleCaseValidationAction(id, !currentStatus);
  }

  const hospitalName = profile.hospitals
    ? (Array.isArray(profile.hospitals) ? profile.hospitals[0]?.name : (profile.hospitals as any).name)
    : 'Ninguno asignado';

  // Helper to color/label score on dashboard
  const getScoreColorClass = (score: number) => {
    if (score >= 85) return 'text-cyan-400 border-cyan-800/40 bg-cyan-950/60';
    if (score >= 65) return 'text-yellow-400 border-yellow-800/40 bg-yellow-950/60';
    if (score >= 40) return 'text-orange-400 border-orange-850/40 bg-orange-950/60';
    return 'text-red-400 border-red-900/40 bg-red-950/60';
  };

  const getScoreCategoryText = (score: number) => {
    if (score >= 85) return 'Óptimo';
    if (score >= 65) return 'Subóptimo Leve';
    if (score >= 40) return 'Subóptimo Mod.';
    return 'Alto Riesgo';
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased font-sans">
      
      {/* Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">ULTREON™ 3.0</span>
              <span className="text-[8px] font-mono font-bold text-slate-500 uppercase">LEVANTE REGISTRY</span>
            </div>
            <h1 className="text-base font-bold text-slate-50">Panel de Control</h1>
          </div>
        </div>

        {/* User profile & Actions */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-200">{profile.full_name || user.email}</p>
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              {profile.role} {profile.role === 'hospital_user' && `· ${hospitalName}`}
            </p>
          </div>
          <div className="h-8 w-[1px] bg-slate-800" />
          
          <form action={handleLogout}>
            <button
              type="submit"
              className="px-3 py-1.5 bg-slate-950 hover:bg-red-950/30 hover:text-red-400 border border-slate-800 rounded-xl text-xs font-medium transition-all cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </form>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Welcome and Call to Actions */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-slate-50">
              Bienvenido, {profile.full_name || 'Colega médico'}
            </h2>
            <p className="text-xs text-slate-450">
              {profile.role === 'admin'
                ? 'Tienes acceso total para gestionar hospitales, usuarios y ver la telemetría clínica de todos los centros.'
                : profile.role === 'hospital_user'
                ? `Registrado en: ${hospitalName}. Puedes crear nuevos casos y consultar tu historial.`
                : 'Acceso de monitorización activo. Puedes revisar y validar fichas clínicas.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {profile.role === 'admin' && (
              <Link
                href="/admin"
                className="px-5 py-3 bg-slate-950 border border-slate-800 hover:border-cyan-500/30 text-cyan-400 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
              >
                Panel de Administración
              </Link>
            )}

            {/* Analítica Científica (Visible para todos los investigadores) */}
            <Link
              href="/analytics"
              className="px-5 py-3 bg-slate-950 border border-violet-800/40 hover:border-violet-600/60 hover:bg-violet-950/20 text-violet-400 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-violet-500/5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analítica Científica
            </Link>

            {/* Seguimiento Clínico */}
            <Link
              href="/follow-up"
              className="px-5 py-3 bg-slate-950 border border-blue-800/40 hover:border-blue-600/60 hover:bg-blue-950/20 text-blue-400 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Seguimiento Clínico
            </Link>

            {(profile.role === 'admin' || profile.role === 'hospital_user') && (
              <Link
                href="/registry/new"
                className="px-5 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-cyan-500/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Caso (eCRF)
              </Link>
            )}

            {/* Zero-Contrast Protocol — visible para todos los roles */}
            <Link
              href="/protocols/zero-contrast"
              className="px-5 py-3 bg-slate-950 border border-emerald-800/40 hover:border-emerald-600/60 hover:bg-emerald-950/20 text-emerald-450 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 group"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Zero-Contrast OCT
            </Link>

            {/* Sobre el Registro (Iniciativa Científica) */}
            <Link
              href="/about"
              className="px-5 py-3 bg-slate-950 border border-slate-800 hover:border-cyan-500/30 hover:bg-cyan-950/10 text-slate-300 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
            >
              Sobre el Registro
            </Link>
          </div>
        </div>

        {/* Quick-Access Resource Banners */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Zero-Contrast Protocol */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-emerald-900/50 transition-all">
            <div className="p-4 md:px-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center text-emerald-400 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-100">Zero-Contrast OCT</span>
                    <span className="text-[8px] font-black font-mono px-1.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 uppercase tracking-wider">Protocol</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Guía interactiva · 4 pasos · Modo Sala · ULTREON™</p>
                </div>
              </div>
              <Link
                href="/protocols/zero-contrast"
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-700/50 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs transition-all"
              >
                Abrir
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Study Overview */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-cyan-900/50 transition-all">
            <div className="p-4 md:px-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-100">Descripción del Estudio</span>
                    <span className="text-[8px] font-black font-mono px-1.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 uppercase tracking-wider">Guía del Investigador</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Justificación · Endpoints · Tríada · 6 Centros · Métricas en vivo</p>
                </div>
              </div>
              <Link
                href="/study"
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-700/50 hover:bg-cyan-500/20 text-cyan-400 font-bold text-xs transition-all"
              >
                Abrir
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Analítica Científica */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-violet-900/50 transition-all shadow-[0_0_20px_rgba(139,92,246,0.02)]">
            <div className="p-4 md:px-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-violet-400 flex-shrink-0 font-mono font-black text-sm">
                  📊
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-100">Analítica Científica</span>
                    <span className="text-[8px] font-black font-mono px-1.5 py-0.5 rounded-full bg-violet-950/60 text-violet-400 border border-violet-800/40 uppercase tracking-wider">Datos Científicos</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">Estadísticas en vivo · Gráficos IA · Purgas OCT · Centros</p>
                </div>
              </div>
              <Link
                href="/analytics"
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-violet-500/10 border border-violet-700/50 hover:bg-violet-500/20 text-violet-400 font-bold text-xs transition-all"
              >
                Abrir
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Seguimiento Clínico */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-blue-900/50 transition-all shadow-[0_0_20px_rgba(59,130,246,0.02)]">
            <div className="p-4 md:px-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400 flex-shrink-0 font-mono font-black text-sm">
                  ❤️
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-slate-100">Seguimiento Clínico</span>
                    <span className="text-[8px] font-black font-mono px-1.5 py-0.5 rounded-full bg-blue-950/60 text-blue-400 border border-blue-800/40 uppercase tracking-wider">Outcomes</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">MACE · 30D / 6M / 12M · Auditoría · Validaciones</p>
                </div>
              </div>
              <Link
                href="/follow-up"
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-blue-500/10 border border-blue-700/50 hover:bg-blue-500/20 text-blue-400 font-bold text-xs transition-all"
              >
                Abrir
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Dashboard Filters Component */}
        <DashboardFilters
          hospitals={hospitals}
          showHospitalFilter={profile.role === 'admin' || profile.role === 'monitor'}
        />

        {/* KPIs Summary Panel */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Total Cases */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Total Casos</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-50 tracking-tight">{totalCases}</span>
              <span className="text-[10px] text-slate-450 font-mono">fichas</span>
            </div>
            <span className="text-[9px] text-slate-500 font-mono mt-1">Válidos en periodo</span>
          </div>

          {/* Card 2: Zero Contrast */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Zero-Contraste</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400 tracking-tight">{zeroContrastPercent}%</span>
              <span className="text-[10px] text-slate-450 font-mono">({zeroContrastCount})</span>
            </div>
            <span className="text-[9px] text-emerald-500/80 font-mono mt-1">Con 0ml contraste real</span>
          </div>

          {/* Card 3: Strategy Modified */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Estrategia Cambiada</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-violet-400 tracking-tight">{strategyModPercent}%</span>
              <span className="text-[10px] text-slate-450 font-mono">({strategyModCount})</span>
            </div>
            <span className="text-[9px] text-violet-500/80 font-mono mt-1">Inducido por ULTREON™</span>
          </div>

          {/* Card 4: Average Score */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Score Promedio</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-cyan-400 tracking-tight">{avgScore}</span>
              <span className="text-[10px] text-slate-450 font-mono">/100</span>
            </div>
            <span className="text-[9px] text-cyan-500/80 font-mono mt-1">
              Cat: {getScoreCategoryText(avgScore)}
            </span>
          </div>

          {/* Card 5: Suboptimal Cases */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[110px] col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Casos Subóptimos</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-500 tracking-tight">{suboptimalCount}</span>
              <span className="text-[10px] text-slate-450 font-mono">casos</span>
            </div>
            <span className="text-[9px] text-amber-500/80 font-mono mt-1">Score &lt; 85 (Revisar)</span>
          </div>
        </div>

        {/* Case List Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-350 tracking-wider uppercase font-mono">
              Casos Clínicos Registrados ({filteredCases.length})
            </h3>
          </div>

          {filteredCases.length === 0 ? (
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-12 text-center">
              <p className="text-sm text-slate-500 font-mono">No se han encontrado registros con los filtros activos.</p>
              {(profile.role === 'admin' || profile.role === 'hospital_user') && (
                <Link
                  href="/registry/new"
                  className="inline-block mt-4 text-xs text-cyan-400 font-bold hover:underline"
                >
                  Registra el primer caso clínico →
                </Link>
              )}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-xl">
              {/* Responsive table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                      <th className="p-4 pl-6">ID Paciente</th>
                      <th className="p-4">Centro</th>
                      <th className="p-4">Vaso (AHA)</th>
                      <th className="p-4 text-center">FFR-OCT</th>
                      <th className="p-4 text-center">Expansión</th>
                      <th className="p-4 text-center">Contraste</th>
                      <th className="p-4 text-center">Score OPSTAR</th>
                      <th className="p-4 text-center">Validado (Monitor)</th>
                      <th className="p-4 text-center">Bloqueado</th>
                      {(profile.role === 'admin' || profile.role === 'monitor') && <th className="p-4 pr-6 text-right">Acciones</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/60 text-xs font-mono">
                    {filteredCases.map((record) => {
                      const dateString = record.created_at ? new Date(record.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'N/A';
                      const recordScore = record.opstar_optimization_results?.[0]?.opstar_score;

                      return (
                        <tr key={record.id} className="hover:bg-slate-950/20 transition-all">
                          <td className="p-4 pl-6 font-bold text-slate-200">
                            <div>{record.id_paciente}</div>
                            <div className="text-[9px] text-slate-500 font-normal">{dateString}</div>
                          </td>
                          <td className="p-4 text-slate-350">
                            {record.hospitals ? (Array.isArray(record.hospitals) ? record.hospitals[0]?.name : (record.hospitals as any).name) : record.centro}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800/40 rounded">
                              {record.vaso_diana}
                            </span>
                          </td>
                          <td className="p-4 text-center text-slate-300">
                            {record.ffr_oct !== null ? record.ffr_oct : 'N/A'}
                          </td>
                          <td className="p-4 text-center text-slate-300">
                            {record.expansion !== null ? `${record.expansion}%` : 'N/A'}
                          </td>
                          <td className="p-4 text-center text-slate-300 font-semibold">
                            {record.actual_contrast_ml !== null ? `${record.actual_contrast_ml}ml` : (record.contraste_ml !== null ? `${record.contraste_ml}ml` : 'N/A')}
                          </td>
                          <td className="p-4 text-center">
                            {recordScore !== undefined && recordScore !== null ? (
                              <span className={`px-2 py-0.5 rounded font-bold border text-[10px] ${getScoreColorClass(recordScore)}`}>
                                {recordScore}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {record.monitor_validated ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                                Validado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-950 text-slate-500 border border-slate-800">
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {record.locked ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-950/80 text-red-400 border border-red-900/40">
                                Locked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-950 text-slate-500 border border-slate-800">
                                Abierto
                              </span>
                            )}
                          </td>
                          {(profile.role === 'admin' || profile.role === 'monitor') && (
                            <td className="p-4 pr-6 text-right space-x-2">
                              {/* Toggle Validation Action Button */}
                              <form action={handleToggleValidate.bind(null, record.id, record.monitor_validated)} className="inline-block">
                                <button
                                  type="submit"
                                  className={`px-2 py-1 rounded border text-[10px] font-bold transition-all cursor-pointer ${
                                    record.monitor_validated
                                      ? 'bg-slate-950 border-slate-800 text-slate-450 hover:bg-slate-850'
                                      : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400 hover:bg-emerald-950'
                                  }`}
                                >
                                  {record.monitor_validated ? 'Invalidar' : 'Validar'}
                                </button>
                              </form>

                              {/* Toggle Lock Action Button */}
                              <form action={handleToggleLock.bind(null, record.id, record.locked)} className="inline-block">
                                <button
                                  type="submit"
                                  className={`px-2 py-1 rounded border text-[10px] font-bold transition-all cursor-pointer ${
                                    record.locked
                                      ? 'bg-slate-950 border-slate-800 text-slate-450 hover:bg-slate-850'
                                      : 'bg-red-950/40 border-red-800/40 text-red-400 hover:bg-red-950'
                                  }`}
                                >
                                  {record.locked ? 'Abrir' : 'Bloquear'}
                                </button>
                              </form>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
