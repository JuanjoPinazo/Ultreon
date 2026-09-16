// app/dashboard/page.tsx
import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { toggleCaseLockAction, toggleCaseValidationAction, logoutAction } from '@/lib/supabase/actions';
import DashboardFilters from './DashboardFilters';
import { ThemeToggle } from '@/components/ThemeToggle';

export default async function DashboardPage(props: {
  searchParams: Promise<{
    hospital?: string;
    segment?: string;
    dateRange?: string;
    caseType?: string;
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

  // Fetch cases according to role, using V3 schema
  let query = supabase
    .from('ultreon_registry_cases')
    .select('*, hospitals(name)');

  if (profile.role === 'hospital_user') {
    if (profile.hospital_id) {
      query = query.eq('hospital_id', profile.hospital_id);
    } else {
      // If no hospital_id assigned, return empty list
      query = query.eq('id', '00000000-0000-0000-0000-000000000000');
    }
  }

  const { data: cases, error: casesError } = await query.order('created_at', { ascending: false });

  if (cases) {
    const total = cases.length;
    const reales = cases.filter(c => !c.is_demo).length;
    const demos = cases.filter(c => c.is_demo).length;
    const drafts = cases.filter(c => c.status === 'DRAFT').length;
    const completeds = cases.filter(c => c.status === 'COMPLETED').length;
    console.log(`[DEBUG DASHBOARD] Total V3: ${total} | Reales: ${reales} | Demo: ${demos} | Drafts: ${drafts} | Completeds: ${completeds}`);
  }

  // Get search params for filtering
  const searchParams = await props.searchParams;
  const filterHospital = searchParams.hospital || '';
  const filterSegment = searchParams.segment || '';
  const filterDateRange = searchParams.dateRange || 'all';
  const filterCaseType = searchParams.caseType || 'real';

  // Apply filters in memory
  const filteredCases = (cases || []).filter((record) => {
    // 0. Demo Filter (Real by default)
    if (filterCaseType === 'real' && record.is_demo === true) return false;
    if (filterCaseType === 'demo' && record.is_demo !== true) return false;

    // 1. Hospital Filter (only applicable to admins/monitors)
    if (profile.role === 'admin' || profile.role === 'monitor') {
      if (filterHospital && record.hospital_id !== filterHospital) {
        return false;
      }
    }

    // 2. Segment Filter (AHA Vaso Diana)
    if (filterSegment) {
      const vessel = record.core_data?.vessel?.value || record.core_data?.vessel || record.acquisition_data?.pullbacks?.[0]?.vessel?.value;
      if (vessel !== filterSegment) return false;
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

  // Completed cases
  const completedCount = filteredCases.filter(
    (r) => r.status === 'COMPLETED' || r.status === 'complete' || r.case_status === 'completed'
  ).length;
  const completedPercent = totalCases > 0 ? Math.round((completedCount / totalCases) * 100) : 0;

  // Strategy modified count
  const strategyModCount = filteredCases.filter((r) => {
    // V3 Strategy modification is tracked in calcium_module.different_strategy_without_ultreon (Si/No)
    return r.calcium_module?.different_strategy_without_ultreon === 'Si';
  }).length;
  const strategyModPercent = totalCases > 0 ? Math.round((strategyModCount / totalCases) * 100) : 0;

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

  const getScoreColorClass = (score: number) => {
    if (score >= 85) return 'text-cyan-400 border-cyan-800/40 bg-cyan-950/60';
    if (score >= 65) return 'text-yellow-400 border-yellow-800/40 bg-yellow-950/60';
    if (score >= 40) return 'text-orange-400 border-orange-850/40 bg-orange-950/60';
    return 'text-red-400 border-red-900/40 bg-red-950/60';
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col antialiased font-sans">
      
      {/* Header Bar */}
      <header className="bg-card border-b border-border p-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">ULTREON™ 3.0</span>
              <span className="text-[8px] font-mono font-bold text-muted-foreground uppercase">REGISTRO CLÍNICO</span>
            </div>
            <h1 className="text-base font-bold text-foreground">Panel de Control</h1>
          </div>
        </div>

        {/* User profile & Actions */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-foreground">{profile.full_name || user.email}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
              {profile.role} {profile.role === 'hospital_user' && `· ${hospitalName}`}
            </p>
          </div>
          <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800" />
          
          <ThemeToggle />

          <div className="h-8 w-[1px] bg-slate-100 dark:bg-slate-800" />
          
          <form action={handleLogout}>
            <button
              type="submit"
              className="px-3 py-1.5 bg-background hover:bg-red-950/30 hover:text-red-400 border border-border rounded-xl text-xs font-medium transition-all cursor-pointer"
            >
              Cerrar Sesión
            </button>
          </form>
        </div>
      </header>

      {/* Content Area */}
      <div className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Welcome and Call to Actions */}
        <div className="bg-card border border-border rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-foreground">
              Bienvenido, {profile.full_name || 'Colega médico'}
            </h2>
            <p className="text-xs text-muted-foreground font-medium">
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
                className="px-5 py-3 bg-surface border border-input-border hover:border-primary hover:bg-surface-secondary text-foreground font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-focus-ring shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Panel de Administración
              </Link>
            )}

            {/* Resultados y Análisis (Visible para todos los investigadores) */}
            <Link
              href="/analytics"
              className="px-5 py-3 bg-surface-secondary border border-border hover:border-primary/50 hover:bg-surface text-foreground font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Resultados y Análisis
            </Link>

            {(profile.role === 'admin' || profile.role === 'hospital_user') && (
              <Link
                href="/registry/new"
                className="px-5 py-3 bg-primary hover:bg-primary-hover text-surface font-black rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-primary/10"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nuevo Caso (eCRF)
              </Link>
            )}

            {/* Casos Registrados */}
            <Link
              href="/follow-up"
              className="px-5 py-3 bg-surface border border-border hover:border-primary/50 hover:bg-surface-secondary text-foreground font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Casos Registrados
            </Link>

            {/* Sobre el Registro (Iniciativa Científica) */}
            <Link
              href="/about"
              className="px-5 py-3 bg-surface border border-border hover:border-input-border hover:bg-surface-secondary text-foreground-secondary font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              Sobre el Registro
            </Link>
            {/* Documentación */}
            <Link
              href="/documentation"
              className="px-5 py-3 bg-surface border border-border hover:border-input-border hover:bg-surface-secondary text-foreground-secondary font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 shadow-sm"
            >
              Documentación
            </Link>
          </div>
        </div>

        {/* Quick-Access Resource Banners */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Study Overview */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden hover:border-cyan-900/50 transition-all">
            <div className="p-4 md:px-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400 flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">Sobre el Registro</span>
                    <span className="text-[8px] font-black font-mono px-1.5 py-0.5 rounded-full bg-cyan-950/60 text-cyan-400 border border-cyan-800/40 uppercase tracking-wider">Proyecto</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Objetivo · Metodología · Centros · Documentación</p>
                </div>
              </div>
              <Link
                href="/study"
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-primary/10 border border-cyan-700/50 hover:bg-primary/20 text-cyan-400 font-bold text-xs transition-all"
              >
                Abrir
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Analítica Científica */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden hover:border-violet-900/50 transition-all shadow-[0_0_20px_rgba(139,92,246,0.02)]">
            <div className="p-4 md:px-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-violet-950/60 border border-violet-800/50 flex items-center justify-center text-violet-400 flex-shrink-0 font-mono font-black text-sm">
                  📊
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">Resultados y Análisis</span>
                    <span className="text-[8px] font-black font-mono px-1.5 py-0.5 rounded-full bg-violet-950/60 text-violet-400 border border-violet-800/40 uppercase tracking-wider">Datos Científicos</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Estadísticas en vivo · Gráficos IA · Purgas OCT · Centros</p>
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

          {/* Casos Registrados */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden hover:border-blue-900/50 transition-all shadow-[0_0_20px_rgba(59,130,246,0.02)]">
            <div className="p-4 md:px-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-blue-950/60 border border-blue-800/50 flex items-center justify-center text-blue-400 flex-shrink-0 font-mono font-black text-sm">
                  📋
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-foreground">Casos Registrados</span>
                    <span className="text-[8px] font-black font-mono px-1.5 py-0.5 rounded-full bg-blue-950/60 text-blue-400 border border-blue-800/40 uppercase tracking-wider">Datos</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Listado de casos · eCRFs · Auditoría local</p>
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
          <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Total Casos</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-foreground tracking-tight">{totalCases}</span>
              <span className="text-[10px] text-muted-foreground dark:text-muted-foreground font-mono">fichas</span>
            </div>
            <span className="text-[9px] text-muted-foreground font-mono mt-1">Registrados {profile.role === 'hospital_user' ? 'en tu centro' : 'globales'}</span>
          </div>

          {/* Card 2: Completed Cases */}
          <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Casos Completados</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight">{completedPercent}%</span>
              <span className="text-[10px] text-muted-foreground dark:text-muted-foreground font-mono">({completedCount})</span>
            </div>
            <span className="text-[9px] text-emerald-600/80 font-mono mt-1">Estado: COMPLETED</span>
          </div>

          {/* Card 3: Strategy Modified */}
          <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <svg className="w-8 h-8 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Estrategia Cambiada</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-3xl font-black text-violet-700 dark:text-violet-400 tracking-tight">{strategyModPercent}%</span>
              <span className="text-[10px] text-muted-foreground dark:text-muted-foreground font-mono">({strategyModCount})</span>
            </div>
            <span className="text-[9px] text-violet-600/80 font-mono mt-1">Decision Change Rate</span>
          </div>

          {/* Card 4: Additional Info OCT */}
          <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[110px]">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Info Adicional OCT</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/50 px-2 py-1 rounded tracking-tight border border-blue-200 dark:border-blue-800/50 uppercase">Próximamente</span>
            </div>
            <span className="text-[9px] text-muted-foreground font-mono mt-1">Recopilando métricas...</span>
          </div>

          {/* Card 5: Post-PCI Optimization */}
          <div className="bg-card border border-border rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[110px] col-span-2 lg:col-span-1">
            <div className="absolute top-0 right-0 p-3 opacity-10">
              <svg className="w-8 h-8 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Optimización Post-PCI</span>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-[10px] font-bold text-pink-700 dark:text-pink-400 bg-pink-100 dark:bg-pink-950/50 px-2 py-1 rounded tracking-tight border border-pink-200 dark:border-pink-800/50 uppercase">Próximamente</span>
            </div>
            <span className="text-[9px] text-muted-foreground font-mono mt-1">Tratamientos adicionales</span>
          </div>
        </div>

        {/* Case List Section */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-muted-foreground dark:text-muted-foreground tracking-wider uppercase font-mono">
              Casos Clínicos Registrados ({filteredCases.length})
            </h3>
          </div>

          {filteredCases.length === 0 ? (
            <div className="bg-card border border-border rounded-3xl p-12 text-center">
              <p className="text-sm text-muted-foreground font-mono">No se han encontrado registros con los filtros activos.</p>
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
            <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
              {/* Responsive table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border text-[10px] uppercase font-mono text-muted-foreground tracking-wider">
                      <th className="p-4 pl-6">Código de Caso</th>
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
                  <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                    {filteredCases.map((record) => {
                      const dateString = record.procedure_date ? new Date(record.procedure_date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : (record.created_at ? new Date(record.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'N/A');
                      const recordScore = null; // No OPSTAR score in V3 yet
                      const vessel = record.core_data?.vessel?.value || record.core_data?.vessel || record.acquisition_data?.pullbacks?.[0]?.vessel?.value || 'N/A';
                      const ffr_oct = record.ffr_oct_module?.pullback_corrections_made ? 'Si' : 'No';
                      const expansion = record.findings_data?.expansion_percentage;
                      const pullbacks = record.acquisition_data?.pullbacks || [];
                      const contrast = pullbacks.length > 0 ? pullbacks.reduce((sum: number, pb: any) => sum + (Number(pb.fast_volume_ml) || 0), 0) : null;

                      return (
                        <tr key={record.id} className="hover:bg-background/20 transition-all">
                          <td className="p-4 pl-6 font-bold text-slate-800 dark:text-foreground">
                            <div className="flex items-center gap-2">
                              {record.anonymous_code || 'N/A'}
                              {record.is_demo && (
                                <span className="px-1.5 py-0.5 bg-demo-soft text-demo dark:bg-demo/20 dark:text-demo-soft text-[9px] rounded font-bold uppercase">
                                  DEMO
                                </span>
                              )}
                              {record.status === 'DRAFT' && (
                                <span className="px-1.5 py-0.5 bg-warning-soft text-warning dark:bg-warning/20 dark:text-warning-soft text-[9px] rounded font-bold uppercase">
                                  BORRADOR
                                </span>
                              )}
                              {record.status === 'COMPLETED' && (
                                <span className="px-1.5 py-0.5 bg-success-soft text-success dark:bg-success/20 dark:text-success-soft text-[9px] rounded font-bold uppercase">
                                  COMPLETADO
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-muted-foreground font-normal">{dateString}</div>
                          </td>
                          <td className="p-4 text-muted-foreground dark:text-muted-foreground">
                            {record.hospitals ? (Array.isArray(record.hospitals) ? record.hospitals[0]?.name : (record.hospitals as any).name) : 'N/A'}
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800/40 rounded">
                              {vessel}
                            </span>
                          </td>
                          <td className="p-4 text-center text-muted-foreground">
                            {ffr_oct !== null ? ffr_oct : 'N/A'}
                          </td>
                          <td className="p-4 text-center text-muted-foreground">
                            {expansion !== null && expansion !== undefined ? `${expansion}%` : 'N/A'}
                          </td>
                          <td className="p-4 text-center text-muted-foreground font-semibold">
                            {contrast !== null && contrast !== undefined ? `${contrast}ml` : 'N/A'}
                          </td>
                          <td className="p-4 text-center">
                            {recordScore !== undefined && recordScore !== null ? (
                              <span className={`px-2 py-0.5 rounded font-bold border text-[10px] ${getScoreColorClass(recordScore)}`}>
                                {recordScore}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {record.monitor_validated ? (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                                <span className="h-1 w-1 rounded-full bg-emerald-400" />
                                Validado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-background text-muted-foreground border border-border">
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
                              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold bg-background text-muted-foreground border border-border">
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
                                      ? 'bg-background border-border text-muted-foreground dark:text-muted-foreground hover:bg-muted'
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
                                      ? 'bg-background border-border text-muted-foreground dark:text-muted-foreground hover:bg-muted'
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
