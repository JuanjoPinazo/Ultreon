'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';

interface MediaItem {
  id: string;
  reviewed_at?: string;
  corelab_quality?: string;
  media_category: string;
}

interface CaseItem {
  id: string;
  id_paciente: string;
  centro: string;
  vaso_diana: string;
  created_at: string;
  hospitals?: { name: string } | { name: string }[];
  opstar_case_media?: MediaItem[];
}

interface CoreLabDashboardClientProps {
  cases: CaseItem[];
  userRole: string;
}

export default function CoreLabDashboardClient({
  cases,
  userRole,
}: CoreLabDashboardClientProps) {
  const [filterHospital, setFilterHospital] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  // Get unique hospitals
  const hospitals = useMemo(() => {
    const hosp = new Set<string>();
    cases.forEach((c) => {
      const name = Array.isArray(c.hospitals)
        ? c.hospitals[0]?.name
        : (c.hospitals as any)?.name;
      if (name) hosp.add(name);
    });
    return Array.from(hosp).sort();
  }, [cases]);

  // Calculate stats for each case
  const casesWithStats = useMemo(() => {
    return cases.map((c) => {
      const media = c.opstar_case_media || [];
      const reviewed = media.filter((m) => m.reviewed_at).length;
      const pending = media.length - reviewed;
      const hasSuboptimal = media.some((m) => m.corelab_quality === 'suboptimal');

      return {
        ...c,
        totalMedia: media.length,
        reviewedMedia: reviewed,
        pendingMedia: pending,
        hasSuboptimal,
      };
    });
  }, [cases]);

  // Filter cases
  const filteredCases = useMemo(() => {
    return casesWithStats.filter((c) => {
      // Hospital filter
      const cHospital = Array.isArray(c.hospitals)
        ? c.hospitals[0]?.name
        : (c.hospitals as any)?.name;
      if (filterHospital !== 'all' && cHospital !== filterHospital) {
        return false;
      }

      // Status filter
      if (filterStatus === 'pending' && c.pendingMedia === 0) return false;
      if (filterStatus === 'suboptimal' && !c.hasSuboptimal) return false;
      if (filterStatus === 'no-images' && c.totalMedia > 0) return false;

      return true;
    });
  }, [casesWithStats, filterHospital, filterStatus]);

  // KPIs
  const kpis = {
    totalCases: cases.length,
    pendingReview: casesWithStats.filter((c) => c.pendingMedia > 0).length,
    totalImages: casesWithStats.reduce((sum, c) => sum + c.totalMedia, 0),
    reviewedImages: casesWithStats.reduce((sum, c) => sum + c.reviewedMedia, 0),
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card border-b border-border p-4 md:p-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold mb-2 inline-block">
              ← Volver al dashboard
            </Link>
            <h1 className="text-base font-bold text-foreground">Core Lab — Revisión Centralizada</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Validación de imágenes y calidad de procedimientos
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="space-y-8">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                Casos Totales
              </p>
              <p className="text-2xl font-bold text-cyan-400">{kpis.totalCases}</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                Pendientes
              </p>
              <p className="text-2xl font-bold text-yellow-400">⚠️ {kpis.pendingReview}</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                Imágenes Total
              </p>
              <p className="text-2xl font-bold text-muted-foreground">{kpis.totalImages}</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4">
              <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                Revisadas
              </p>
              <p className="text-2xl font-bold text-emerald-400">
                ✓ {kpis.reviewedImages}
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-foreground">Filtros</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hospital Filter */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Centro
                </label>
                <select
                  value={filterHospital}
                  onChange={(e) => setFilterHospital(e.target.value)}
                  className="w-full px-4 py-2 bg-card border border-border text-foreground rounded-lg text-sm outline-none focus:border-primary"
                >
                  <option value="all">Todos los centros</option>
                  {hospitals.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-2 block">
                  Estado
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-4 py-2 bg-card border border-border text-foreground rounded-lg text-sm outline-none focus:border-primary"
                >
                  <option value="pending">Pendiente de revisión</option>
                  <option value="suboptimal">Calidad subóptima detectada</option>
                  <option value="no-images">Sin imágenes</option>
                </select>
              </div>
            </div>
          </div>

          {/* Cases Table */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-background/50">
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground">
                      Caso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground">
                      Centro
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-muted-foreground">
                      Vaso
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground">
                      Imágenes
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground">
                      Revisadas
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-bold text-muted-foreground">
                      Acción
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCases.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <p className="text-muted-foreground text-sm">
                          {filterStatus === 'no-images'
                            ? 'Ningún caso sin imágenes'
                            : 'No hay casos pendientes en este filtro'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredCases.map((c) => (
                      <tr
                        key={c.id}
                        className="border-b border-border hover:bg-muted/50 transition-all"
                      >
                        <td className="px-4 py-3">
                          <p className="text-xs font-mono font-semibold text-cyan-400">
                            {c.id_paciente}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs text-muted-foreground">
                            {Array.isArray(c.hospitals)
                              ? c.hospitals[0]?.name
                              : (c.hospitals as any)?.name || 'N/A'}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-cyan-950/40 text-cyan-400 border border-cyan-800/40 rounded font-mono text-xs font-bold">
                            {c.vaso_diana}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <p className="text-xs font-semibold text-muted-foreground">
                            {c.totalMedia}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <p className={`text-xs font-semibold ${c.pendingMedia === 0 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                            {c.reviewedMedia}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {c.hasSuboptimal && (
                              <span className="px-2 py-0.5 bg-orange-950/60 text-orange-400 border border-orange-800/40 rounded text-[9px] font-bold">
                                ⚠️ Subóptima
                              </span>
                            )}
                            {c.pendingMedia > 0 && (
                              <span className="px-2 py-0.5 bg-yellow-950/60 text-yellow-400 border border-yellow-800/40 rounded text-[9px] font-bold">
                                ✏ Pendiente
                              </span>
                            )}
                            {c.pendingMedia === 0 && !c.hasSuboptimal && (
                              <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 rounded text-[9px] font-bold">
                                ✓ Completo
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={`/core-lab/cases/${c.id}`}
                            className="inline-block px-3 py-1.5 bg-primary/20 border border-cyan-700 text-cyan-400 rounded-lg text-xs font-semibold hover:bg-primary/30 transition-all"
                          >
                            Revisar →
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
