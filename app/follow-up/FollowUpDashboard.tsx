'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export interface FollowUpDashboardProps {
  initialCases: any[];
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
  useEffect(() => setIsMounted(true), []);

  const [filterHospital, setFilterHospital] = useState('');
  const [filterDateRange, setFilterDateRange] = useState('all');
  const [filterCaseType, setFilterCaseType] = useState('real');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    if (profile.role === 'hospital_user' && profile.hospitalId) {
      setFilterHospital(profile.hospitalId);
    }
  }, [profile]);

  const filteredCases = useMemo(() => {
    return initialCases.filter((c) => {
      // Demo Filter
      if (filterCaseType === 'real' && c.is_demo === true) return false;
      if (filterCaseType === 'demo' && c.is_demo !== true) return false;

      // Hospital Filter
      if (profile.role === 'hospital_user') {
        if (c.hospital_id !== profile.hospitalId) return false;
      } else if (filterHospital && c.hospital_id !== filterHospital) {
        return false;
      }
      
      // Status filter
      if (filterStatus !== 'all') {
        const isCompleted = c.case_status === 'complete' || c.case_status === 'completed' || c.status === 'COMPLETED';
        if (filterStatus === 'completed' && !isCompleted) return false;
        if (filterStatus === 'draft' && isCompleted) return false;
      }

      // Date Range Filter
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
  }, [initialCases, filterHospital, filterDateRange, filterCaseType, filterStatus, profile]);

  const total = filteredCases.length;
  const completed = filteredCases.filter(c => c.case_status === 'complete' || c.case_status === 'completed' || c.status === 'COMPLETED').length;
  const draft = total - completed;
  const demo = filteredCases.filter(c => c.is_demo).length;

  // Export functions (CSV)
  const handleExport = () => {
    const headers = ['ID Caso', 'Centro', 'Operador', 'Fecha', 'Estado', 'Tipo'];
    const rows = filteredCases.map(c => [
      c.id_paciente || 'N/A',
      c.hospitals?.name || 'N/A',
      c.operator?.full_name || 'N/A',
      new Date(c.created_at).toLocaleDateString(),
      (c.case_status === 'complete' || c.case_status === 'completed' || c.status === 'COMPLETED') ? 'Completado' : 'Borrador',
      c.is_demo ? 'DEMO' : 'Real'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ultreon_registry_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-6 md:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-foreground tracking-tight">Casos Registrados</h1>
            <p className="text-sm text-muted-foreground mt-1">Auditoría y listado de registros eCRF clínicos.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              className="px-4 py-2 bg-background border border-border hover:border-slate-300 text-foreground font-bold rounded-xl text-xs transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar Datos
            </button>
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-slate-200 dark:hover:bg-slate-200 dark:hover:bg-slate-800 border border-border font-bold rounded-xl text-xs transition-colors"
            >
              Volver
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6 md:p-8 space-y-6">
        
        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Casos</p>
            <p className="text-3xl font-black text-foreground mt-1">{total}</p>
          </div>
          <div className="bg-card border border-emerald-500/30 rounded-2xl p-5 bg-emerald-50/30 dark:bg-emerald-950/20">
            <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Completados</p>
            <p className="text-3xl font-black text-emerald-700 dark:text-emerald-400 mt-1">{completed}</p>
          </div>
          <div className="bg-card border border-amber-500/30 rounded-2xl p-5 bg-amber-50/30 dark:bg-amber-950/20">
            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Borradores</p>
            <p className="text-3xl font-black text-amber-700 dark:text-amber-400 mt-1">{draft}</p>
          </div>
          {(profile.role === 'admin' || profile.role === 'super_admin') && (
            <div className="bg-card border border-orange-500/30 rounded-2xl p-5 bg-orange-50/30 dark:bg-orange-950/20">
              <p className="text-[10px] font-bold text-orange-700 dark:text-orange-400 uppercase tracking-wider">Casos DEMO</p>
              <p className="text-3xl font-black text-orange-700 dark:text-orange-400 mt-1">{demo}</p>
            </div>
          )}
        </div>

        {/* FILTERS */}
        <div className="bg-card border border-border rounded-2xl p-5 grid grid-cols-1 md:grid-cols-4 gap-4">
          {profile.role !== 'hospital_user' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Hospital</label>
              <select
                value={filterHospital}
                onChange={(e) => setFilterHospital(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground outline-none"
              >
                <option value="">Todos los Centros</option>
                {hospitals.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Estado</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground outline-none"
            >
              <option value="all">Todos los estados</option>
              <option value="completed">Completados</option>
              <option value="draft">Borradores</option>
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Fecha</label>
            <select
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
              className="px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground outline-none"
            >
              <option value="all">Histórico Completo</option>
              <option value="30days">Últimos 30 días</option>
              <option value="90days">Últimos 90 días</option>
              <option value="thisyear">Este Año (2026)</option>
            </select>
          </div>
          {(profile.role === 'admin' || profile.role === 'super_admin') && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Tipo</label>
              <select
                value={filterCaseType}
                onChange={(e) => setFilterCaseType(e.target.value)}
                className="px-3 py-2 bg-background border border-border rounded-xl text-xs text-foreground outline-none"
              >
                <option value="real">Casos Reales</option>
                <option value="demo">Casos DEMO</option>
                <option value="all">Todos</option>
              </select>
            </div>
          )}
        </div>

        {/* LIST */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="px-6 py-4">Código Caso</th>
                  <th className="px-6 py-4">Centro Médico</th>
                  <th className="px-6 py-4">Operador</th>
                  <th className="px-6 py-4">Fecha</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Tipo</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCases.map((c) => {
                  const isCompleted = c.case_status === 'complete' || c.case_status === 'completed' || c.status === 'COMPLETED';
                  return (
                    <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-foreground">
                        {c.id_paciente || 'S/N'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground font-medium">
                        {c.hospitals?.name || 'Desconocido'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {c.operator?.full_name || 'Desconocido'}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${isCompleted ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/50' : 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/50'}`}>
                          {isCompleted ? 'Completado' : 'Borrador'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {c.is_demo ? (
                          <span className="px-2.5 py-1 bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-950/50 dark:text-orange-400 dark:border-orange-800/50 text-[10px] font-bold uppercase tracking-wider rounded-full border">DEMO</span>
                        ) : (
                          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-800/50 text-[10px] font-bold uppercase tracking-wider rounded-full border">Real</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/cases/${c.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-background border border-border hover:border-cyan-500/50 text-cyan-600 dark:text-cyan-400 text-xs font-bold rounded-lg transition-all"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  );
                })}
                {filteredCases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-muted-foreground">
                      No se encontraron casos con los filtros seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
