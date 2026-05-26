'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  Cell
} from 'recharts';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface FollowUpRecord {
  id: string;
  case_id: string;
  followup_type: 'procedural' | '30days' | '6months' | '12months';
  followup_date: string;
  mace: boolean;
  death_type: 'cardiovascular' | 'non-cardiovascular' | 'unknown' | null;
  myocardial_infarction: boolean;
  tlr: boolean;
  tvr: boolean;
  stent_thrombosis_type: 'acute' | 'subacute' | 'late' | 'very_late' | null;
  rehospitalization: boolean;
  repeat_pci: boolean;
  cabg: boolean;
  followup_angio: boolean;
  followup_oct: boolean;
  clinical_status: 'asymptomatic' | 'stable_angina' | 'unstable_angina' | 'heart_failure' | 'other';
  investigator_notes: string | null;
  completed: boolean;
  monitor_validated: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface CaseWithFollowUp {
  id: string;
  id_paciente: string;
  centro: string;
  vaso_diana: string;
  tecnica_purga_oct: string;
  ffr_oct: number | null;
  calcio_ia: boolean;
  placa_lipida_ia: boolean;
  landing_zone: string;
  diametro: number | null;
  modifico_estrategia: boolean;
  expansion: number | null;
  contraste_ml: number | null;
  expected_contrast_ml: number | null;
  actual_contrast_ml: number | null;
  contrast_reduction_percent: number | null;
  zero_contrast_completed: boolean;
  hospital_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  hospitals: { name: string } | null;
  opstar_strategy_changes?: any[] | null;
  opstar_optimization_results?: Array<{
    opstar_score: number | null;
    opstar_score_category: string | null;
  }> | null;
  opstar_followup?: FollowUpRecord[] | null;
}

interface FollowUpDashboardProps {
  initialCases: CaseWithFollowUp[];
  profile: {
    fullName: string;
    role: string;
    hospitalId: string;
    hospitalName: string;
  };
  hospitals: { id: string; name: string }[];
}

export default function FollowUpDashboard({
  initialCases,
  profile,
  hospitals,
}: FollowUpDashboardProps) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter states
  const [filterHospital, setFilterHospital] = useState('');
  const [filterVessel, setFilterVessel] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterMaceOnly, setFilterMaceOnly] = useState(false);

  // Sync security scoping for hospital users
  useEffect(() => {
    if (profile.role === 'hospital_user' && profile.hospitalId) {
      setFilterHospital(profile.hospitalId);
    }
  }, [profile]);

  // Apply filters memoized
  const filteredCases = useMemo(() => {
    return initialCases.filter((c) => {
      // 1. Hospital Filter (locked for hospital_user)
      if (profile.role === 'hospital_user') {
        if (c.hospital_id !== profile.hospitalId) return false;
      } else if (filterHospital && c.hospital_id !== filterHospital) {
        return false;
      }

      // 2. Vaso Filter
      if (filterVessel && c.vaso_diana !== filterVessel) return false;

      // 3. MACE Filter
      if (filterMaceOnly) {
        const hasMace = c.opstar_followup?.some((f) => f.mace) ?? false;
        if (!hasMace) return false;
      }

      // 4. Date Range Filter (based on case creation)
      if (filterDateRange !== 'all' && c.created_at) {
        const recordDate = new Date(c.created_at);
        const now = new Date();
        if (filterDateRange === '30days') {
          const limit = new Date();
          limit.setDate(now.getDate() - 30);
          if (recordDate < limit) return false;
        } else if (filterDateRange === '90days') {
          const limit = new Date();
          limit.setDate(now.getDate() - 90);
          if (recordDate < limit) return false;
        } else if (filterDateRange === 'thisyear') {
          const startOfYear = new Date(now.getFullYear(), 0, 1);
          if (recordDate < startOfYear) return false;
        }
      }

      return true;
    });
  }, [initialCases, filterHospital, filterVessel, filterMaceOnly, filterDateRange, profile]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CLINICAL CALCULATIONS
  // ─────────────────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filteredCases.length;
    if (total === 0) {
      return {
        total,
        completionRate: 0,
        maceCount: 0,
        maceRate: 0,
        tlrCount: 0,
        tlrRate: 0,
        tvrCount: 0,
        tvrRate: 0,
        rehospitalizationCount: 0,
        rehospitalizationRate: 0,
        stentThrombosisCount: 0,
        stentThrombosisRate: 0,
        totalExpectedFollowups: 0,
        totalCompletedFollowups: 0,
      };
    }

    let maceCount = 0;
    let tlrCount = 0;
    let tvrCount = 0;
    let rehospitalizationCount = 0;
    let stentThrombosisCount = 0;

    // Expected followups: 3 timepoints per case (30d, 6m, 12m)
    // Procedural is usually discharge, let's include 30d, 6m, and 12m as follow-up expected
    const totalExpectedFollowups = total * 3;
    let totalCompletedFollowups = 0;

    filteredCases.forEach((c) => {
      const followups = c.opstar_followup || [];
      
      // Calculate completion count
      const activeFollowups = followups.filter((f) => f.completed && f.followup_type !== 'procedural');
      totalCompletedFollowups += activeFollowups.length;

      // Check if patient experienced MACE at any point
      const hasMace = followups.some((f) => f.mace);
      if (hasMace) maceCount++;

      const hasTlr = followups.some((f) => f.tlr);
      if (hasTlr) tlrCount++;

      const hasTvr = followups.some((f) => f.tvr);
      if (hasTvr) tvrCount++;

      const hasRehosp = followups.some((f) => f.rehospitalization);
      if (hasRehosp) rehospitalizationCount++;

      const hasThrombosis = followups.some((f) => f.stent_thrombosis_type !== null);
      if (hasThrombosis) stentThrombosisCount++;
    });

    const completionRate = Math.round((totalCompletedFollowups / (totalExpectedFollowups || 1)) * 100);
    const maceRate = Math.round((maceCount / total) * 100);
    const tlrRate = Math.round((tlrCount / total) * 100);
    const tvrRate = Math.round((tvrCount / total) * 100);
    const rehospitalizationRate = Math.round((rehospitalizationCount / total) * 100);
    const stentThrombosisRate = Math.round((stentThrombosisCount / total) * 100);

    return {
      total,
      completionRate,
      maceCount,
      maceRate,
      tlrCount,
      tlrRate,
      tvrCount,
      tvrRate,
      rehospitalizationCount,
      rehospitalizationRate,
      stentThrombosisCount,
      stentThrombosisRate,
      totalExpectedFollowups,
      totalCompletedFollowups,
    };
  }, [filteredCases]);

  // ─────────────────────────────────────────────────────────────────────────────
  // CHARTS DATA PREPARATION
  // ─────────────────────────────────────────────────────────────────────────────
  const chartsData = useMemo(() => {
    // 1. Kaplan-Meier Survival Analysis (MACE-free survival)
    // We compute the survival rates at: Base/Procedure (100%), 30 Days, 6 Months, 12 Months.
    const total = filteredCases.length || 1;
    let maceProcedural = 0;
    let mace30D = 0;
    let mace6M = 0;
    let mace12M = 0;

    filteredCases.forEach((c) => {
      const followups = c.opstar_followup || [];
      if (followups.some((f) => f.followup_type === 'procedural' && f.mace)) maceProcedural++;
      if (followups.some((f) => f.followup_type === '30days' && f.mace)) mace30D++;
      if (followups.some((f) => f.followup_type === '6months' && f.mace)) mace6M++;
      if (followups.some((f) => f.followup_type === '12months' && f.mace)) mace12M++;
    });

    const survivalProc = 100 - Math.round((maceProcedural / total) * 100);
    const survival30D = survivalProc - Math.round((mace30D / total) * 100);
    const survival6M = survival30D - Math.round((mace6M / total) * 100);
    const survival12M = survival6M - Math.round((mace12M / total) * 100);

    const survivalData = [
      { name: 'Procedimiento', supervivencia: Math.max(0, survivalProc) },
      { name: '30 Días', supervivencia: Math.max(0, survival30D) },
      { name: '6 Meses', supervivencia: Math.max(0, survival6M) },
      { name: '12 Meses', supervivencia: Math.max(0, survival12M) },
    ];

    // 2. OPSTAR Score vs MACE Correlation
    // Divide cases by OPSTAR score groups: Optimal (>=85), Mild Suboptimal (65-84), High Risk (<65)
    // And calculate MACE rate in each group.
    let optCases = 0, optMace = 0;
    let subCases = 0, subMace = 0;
    let riskCases = 0, riskMace = 0;

    filteredCases.forEach((c) => {
      const score = c.opstar_optimization_results?.[0]?.opstar_score;
      if (score === null || score === undefined) return;

      const hasMace = c.opstar_followup?.some((f) => f.mace) ?? false;

      if (score >= 85) {
        optCases++;
        if (hasMace) optMace++;
      } else if (score >= 65) {
        subCases++;
        if (hasMace) subMace++;
      } else {
        riskCases++;
        if (hasMace) riskMace++;
      }
    });

    const correlationData = [
      { name: 'Óptimo (≥85)', tasaMace: optCases > 0 ? Math.round((optMace / optCases) * 100) : 0, casos: optCases },
      { name: 'Subóptimo (65-84)', tasaMace: subCases > 0 ? Math.round((subMace / subCases) * 100) : 0, casos: subCases },
      { name: 'Alto Riesgo (<65)', tasaMace: riskCases > 0 ? Math.round((riskMace / riskCases) * 100) : 0, casos: riskCases },
    ];

    return {
      survivalData,
      correlationData,
    };
  }, [filteredCases]);

  // ─────────────────────────────────────────────────────────────────────────────
  // EXPORTER
  // ─────────────────────────────────────────────────────────────────────────────
  const exportLongitudinalCSV = (type: 'standard' | 'publication') => {
    const headers = [
      'ID Paciente (Pseudonimizado)',
      'Vaso Diana',
      'Score OPSTAR',
      'Categoría Score',
      'Purga OCT',
      'FFR-OCT',
      'Calcio Severo IA',
      'MACE General',
      'Muerte CV',
      'Muerte No-CV',
      'Infarto Miocardio',
      'TLR',
      'TVR',
      'Trombosis Stent Tipo',
      'Rehospitalización',
      'CABG',
      'OCT Seguimiento',
      'Seguimientos Completados',
    ];

    const rows = filteredCases.map((c) => {
      const opt = c.opstar_optimization_results?.[0];
      const followups = c.opstar_followup || [];
      const activeFollowups = followups.filter((f) => f.completed);
      
      const hasMace = followups.some((f) => f.mace);
      const hasMi = followups.some((f) => f.myocardial_infarction);
      const hasTlr = followups.some((f) => f.tlr);
      const hasTvr = followups.some((f) => f.tvr);
      const hasRehosp = followups.some((f) => f.rehospitalization);
      const hasCabg = followups.some((f) => f.cabg);
      const hasFollowupOct = followups.some((f) => f.followup_oct);
      
      const deathType = followups.find((f) => f.death_type !== null)?.death_type || 'no';
      const stentThrombosis = followups.find((f) => f.stent_thrombosis_type !== null)?.stent_thrombosis_type || 'no';

      return [
        c.id_paciente, // Pseudonymized patient ID (already alphanumeric without name)
        c.vaso_diana,
        opt?.opstar_score !== null ? opt?.opstar_score : 'N/A',
        opt?.opstar_score_category || 'N/A',
        c.tecnica_purga_oct,
        c.ffr_oct !== null ? c.ffr_oct : 'N/A',
        c.calcio_ia ? 'SI' : 'NO',
        hasMace ? 'SI' : 'NO',
        deathType === 'cardiovascular' ? 'SI' : 'NO',
        deathType === 'non-cardiovascular' ? 'SI' : 'NO',
        hasMi ? 'SI' : 'NO',
        hasTlr ? 'SI' : 'NO',
        hasTvr ? 'SI' : 'NO',
        stentThrombosis,
        hasRehosp ? 'SI' : 'NO',
        hasCabg ? 'SI' : 'NO',
        hasFollowupOct ? 'SI' : 'NO',
        `${activeFollowups.length}/4`,
      ];
    });

    const separator = ';';
    const csvContent =
      '\uFEFF' +
      [headers.join(separator), ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(separator))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const filename = type === 'publication'
      ? `opstar_publication_longitudinal_${new Date().toISOString().slice(0, 10)}.csv`
      : `opstar_followup_export_${new Date().toISOString().slice(0, 10)}.csv`;

    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to color/label score on dashboard
  const getScoreColorClass = (score: number) => {
    if (score >= 85) return 'text-cyan-400 border-cyan-800/40 bg-cyan-950/60';
    if (score >= 65) return 'text-yellow-400 border-yellow-800/40 bg-yellow-950/60';
    if (score >= 40) return 'text-orange-400 border-orange-850/40 bg-orange-950/60';
    return 'text-red-400 border-red-900/40 bg-red-950/60';
  };

  // Helper to draw timeline status
  const getNodeColorClass = (c: CaseWithFollowUp, type: 'procedural' | '30days' | '6months' | '12months') => {
    const f = c.opstar_followup?.find((x) => x.followup_type === type);
    if (!f) return 'bg-slate-900 border-slate-800 text-slate-650'; // Grey (not entered)
    if (!f.completed) return 'bg-slate-900 border-yellow-800 text-yellow-500 hover:bg-yellow-950/20'; // Amber (pending/incomplete)
    if (f.mace) return 'bg-red-950/80 border-red-900 text-red-400 hover:bg-red-950'; // Red (MACE)
    return 'bg-emerald-950/80 border-emerald-900 text-emerald-400 hover:bg-emerald-950'; // Green (completed, no events)
  };

  const getTimelineLabel = (type: 'procedural' | '30days' | '6months' | '12months') => {
    switch (type) {
      case 'procedural': return 'Proc';
      case '30days': return '30D';
      case '6months': return '6M';
      case '12months': return '12M';
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased font-sans">
      
      {/* Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs">
            A
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">ULTREON™ 3.0</span>
              <span className="text-[8px] font-mono font-bold text-slate-500 uppercase">SEGUIMIENTO CLÍNICO</span>
            </div>
            <h1 className="text-base font-bold text-slate-50">Registro de Outcomes y MACE</h1>
          </div>
        </div>

        {/* User profile & Actions */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-200">{profile.fullName}</p>
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              {profile.role === 'admin' ? 'Administrador' : profile.role === 'monitor' ? 'Monitor' : 'Investigador'} {profile.role === 'hospital_user' && `· ${profile.hospitalName}`}
            </p>
          </div>
          <div className="h-8 w-[1px] bg-slate-800" />
          
          <Link
            href="/dashboard"
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-medium transition-all"
          >
            Volver al Panel
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-6">

        {/* ── HERO BANNER ── */}
        <div className="relative bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 overflow-hidden">
          <div className="absolute top-0 right-0 w-[450px] h-[300px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="space-y-2">
              <span className="text-[9px] font-black font-mono tracking-[0.3em] text-cyan-400 uppercase">
                Seguimiento Longitudinal del Registro
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-50 tracking-tight">
                Outcomes Clínicos y MACE
              </h2>
              <p className="text-sm text-slate-400 font-light max-w-2xl leading-relaxed">
                Monitorización científica multicéntrica de eventos adversos (muerte cardiovascular, infarto, revascularización de lesión diana y trombosis del stent) a los 30 días, 6 meses y 12 meses de la ICP.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full lg:w-auto flex-shrink-0">
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 min-w-[130px]">
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">Seguimientos Completados</span>
                <span className="text-2xl font-black text-slate-100 mt-1 block">{stats.completionRate}%</span>
                <span className="text-[8px] font-mono text-slate-650">({stats.totalCompletedFollowups} / {stats.totalExpectedFollowups})</span>
              </div>
              
              <div className="bg-slate-950/60 border border-red-950/40 rounded-2xl p-4 min-w-[130px] shadow-[0_0_15px_rgba(239,68,68,0.02)]">
                <span className="text-[9px] font-mono text-red-400 font-bold uppercase tracking-wider block">Tasa MACE</span>
                <span className="text-2xl font-black text-red-400 mt-1 block">{stats.maceRate}%</span>
                <span className="text-[8px] font-mono text-red-500/80">({stats.maceCount} casos MACE)</span>
              </div>

              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 min-w-[130px]">
                <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-wider block">Rehospitalización</span>
                <span className="text-2xl font-black text-slate-100 mt-1 block">{stats.rehospitalizationRate}%</span>
                <span className="text-[8px] font-mono text-slate-650">({stats.rehospitalizationCount} casos)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FILTER SYSTEM ── */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Hospital</span>
            {profile.role === 'admin' || profile.role === 'monitor' ? (
              <select
                value={filterHospital}
                onChange={(e) => setFilterHospital(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs text-slate-300 outline-none cursor-pointer"
              >
                <option value="">Todos los Hospitales</option>
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full px-3 py-2.5 rounded-xl bg-slate-950/50 border border-slate-850 text-xs text-slate-500 font-mono font-medium">
                {profile.hospitalName} (Fijado)
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Vaso Diana (AHA)</span>
            <select
              value={filterVessel}
              onChange={(e) => setFilterVessel(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs text-slate-300 outline-none cursor-pointer"
            >
              <option value="">Todos los vasos</option>
              <option value="TCI">TCI</option>
              <option value="LAD">Descendente Anterior (DA)</option>
              <option value="LCx">Circunfleja (CX)</option>
              <option value="RCA">Coronaria Derecha (CD)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Fecha de Inclusión</span>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs text-slate-300 outline-none cursor-pointer"
            >
              <option value="all">Todo el Historial</option>
              <option value="30days">Últimos 30 días</option>
              <option value="90days">Últimos 90 días</option>
              <option value="thisyear">Año 2026</option>
            </select>
          </div>

          <div className="flex items-center gap-3 h-full pt-4 pl-2">
            <input
              type="checkbox"
              id="maceFilter"
              checked={filterMaceOnly}
              onChange={(e) => setFilterMaceOnly(e.target.checked)}
              className="h-4.5 w-4.5 rounded bg-slate-950 border border-slate-800 accent-red-500 cursor-pointer"
            />
            <label htmlFor="maceFilter" className="text-xs font-bold font-mono text-slate-400 cursor-pointer select-none">
              Solo pacientes con MACE/Evento
            </label>
          </div>
        </div>

        {/* ── CHARTS SECTION ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Survival Chart (Kaplan-Meier-like) */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6">
            <div className="mb-4">
              <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">Curva de Supervivencia</span>
              <h3 className="text-sm font-bold text-slate-200 mt-1">Supervivencia Libre de MACE (%)</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Porcentaje acumulativo de pacientes libres de eventos adversos cardiovasculares mayores en cada periodo.</p>
            </div>
            <div className="w-full h-[240px] flex items-center justify-center">
              {isMounted && filteredCases.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartsData.survivalData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorSurvival" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} className="font-mono font-bold" tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} className="font-mono" tickLine={false} domain={[50, 100]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#10b981', fontSize: '12px' }}
                    />
                    <Area type="monotone" dataKey="supervivencia" name="Libre de MACE (%)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSurvival)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-500 font-mono">Cargando datos o sin muestras...</span>
              )}
            </div>
          </div>

          {/* OPSTAR Score Correlation Chart */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6">
            <div className="mb-4">
              <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">Correlación de Score Clínico</span>
              <h3 className="text-sm font-bold text-slate-200 mt-1">Tasa de MACE según Puntuación de Optimización OPSTAR</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Demostración científica de cómo puntuaciones óptimas reducen la incidencia de MACE tardío.</p>
            </div>
            <div className="w-full h-[240px] flex items-center justify-center">
              {isMounted && filteredCases.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartsData.correlationData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis dataKey="name" stroke="#64748b" fontSize={9} className="font-mono font-bold" tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={9} className="font-mono" tickLine={false} label={{ value: 'Tasa MACE (%)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 9 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                      itemStyle={{ color: '#22d3ee', fontSize: '12px' }}
                    />
                    <Bar dataKey="tasaMace" name="Tasa MACE (%)" fill="#22d3ee" radius={[4, 4, 0, 0]} barSize={40}>
                      {chartsData.correlationData.map((entry, index) => {
                        const colors = ['#0891b2', '#eab308', '#ef4444'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <span className="text-xs text-slate-500 font-mono">Sin datos disponibles</span>
              )}
            </div>
          </div>

        </div>

        {/* ── CASES LONGITUDINAL STATUS LIST ── */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-400 tracking-wider uppercase font-mono pl-1">
            Pacientes y Seguimiento Longitudinal ({filteredCases.length})
          </h3>

          {filteredCases.length === 0 ? (
            <div className="bg-slate-900 border border-slate-850 rounded-3xl p-12 text-center">
              <p className="text-xs text-slate-500 font-mono">No se han encontrado registros con los filtros activos.</p>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-850 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                      <th className="p-4 pl-6">ID Paciente (Pseudonimizado)</th>
                      <th className="p-4">Centro</th>
                      <th className="p-4">Vaso (AHA)</th>
                      <th className="p-4 text-center">Score OPSTAR</th>
                      <th className="p-4 text-center">Línea de Tiempo Seguimiento</th>
                      <th className="p-4 text-center">MACE</th>
                      <th className="p-4 pr-6 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50 text-xs font-mono">
                    {filteredCases.map((c) => {
                      const opt = c.opstar_optimization_results?.[0];
                      const score = opt?.opstar_score;
                      const hasMace = c.opstar_followup?.some((f) => f.mace) ?? false;

                      return (
                        <tr key={c.id} className="hover:bg-slate-950/20 transition-all">
                          <td className="p-4 pl-6 font-bold text-slate-350">{c.id_paciente}</td>
                          <td className="p-4 text-slate-450">{c.hospitals?.name || c.centro}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800/40 rounded">
                              {c.vaso_diana}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {score !== undefined && score !== null ? (
                              <span className={`px-2 py-0.5 rounded font-bold border text-[10px] ${getScoreColorClass(score)}`}>
                                {score}
                              </span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </td>
                          
                          {/* Timeline representation */}
                          <td className="p-4">
                            <div className="flex items-center justify-center gap-2">
                              {['procedural', '30days', '6months', '12months'].map((type) => {
                                const cClass = getNodeColorClass(c, type as any);
                                return (
                                  <Link
                                    key={type}
                                    href={`/cases/${c.id}/follow-up`}
                                    className={`h-7 w-10 rounded border flex items-center justify-center font-bold text-[9px] transition-all ${cClass}`}
                                    title={`Seguimiento ${type}`}
                                  >
                                    {getTimelineLabel(type as any)}
                                  </Link>
                                );
                              })}
                            </div>
                          </td>

                          {/* Event / MACE status */}
                          <td className="p-4 text-center">
                            {hasMace ? (
                              <span className="px-2.5 py-0.5 bg-red-950 text-red-400 border border-red-900/40 rounded-full font-bold text-[9px]">
                                Evento
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 bg-emerald-950/40 text-emerald-450 border border-emerald-900/30 rounded-full font-bold text-[9px]">
                                Libre MACE
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="p-4 pr-6 text-right">
                            <Link
                              href={`/cases/${c.id}/follow-up`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-cyan-500/30 text-cyan-400 font-bold rounded-lg text-[10px] transition-all"
                            >
                              Ver Seguimiento
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* ── EXPORTlongitudinal SECTION ── */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">Exportación Científica</span>
            <h3 className="text-sm font-bold text-slate-200">Dataset Longitudinal Completo</h3>
            <p className="text-[10px] text-slate-500 leading-normal">
              Descarga la información de seguimiento cruzada con los datos de optimización de la angioplastia por OCT para fines de publicación.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 md:col-span-2 md:justify-end">
            <button
              onClick={() => exportLongitudinalCSV('standard')}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 font-mono text-xs transition-colors cursor-pointer group"
            >
              <span>📊</span>
              Exportar Outcomes (Separador ;)
            </button>
            
            <button
              onClick={() => exportLongitudinalCSV('publication')}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-cyan-950/20 hover:bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 font-mono text-xs font-bold transition-colors cursor-pointer group"
            >
              <span>🎓</span>
              Dataset para Publicación (R/SPSS)
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
