'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export interface HospitalInfo {
  id: string;
  name: string;
}

interface DashboardFiltersProps {
  hospitals: HospitalInfo[];
  showHospitalFilter: boolean;
}

export default function DashboardFilters({
  hospitals,
  showHospitalFilter,
}: DashboardFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentHospital = searchParams.get('hospital') || '';
  const currentSegment = searchParams.get('segment') || '';
  const currentDateRange = searchParams.get('dateRange') || 'all';

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="bg-slate-900 border border-slate-850 rounded-3xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
      {showHospitalFilter ? (
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
            Filtrar por Hospital
          </label>
          <select
            value={currentHospital}
            onChange={(e) => updateFilters('hospital', e.target.value)}
            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs text-slate-300 outline-none cursor-pointer"
          >
            <option value="">Todos los Hospitales</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="flex flex-col justify-center px-2 py-1 bg-slate-950/40 border border-slate-850/60 rounded-xl">
          <span className="text-[9px] font-mono font-bold text-slate-500 tracking-wider uppercase">Filtro de Hospital</span>
          <span className="text-xs text-slate-400 font-semibold mt-0.5">Limitado a tu Centro Asignado</span>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
          Segmento AHA (Vaso Diana)
        </label>
        <select
          value={currentSegment}
          onChange={(e) => updateFilters('segment', e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs text-slate-300 outline-none cursor-pointer"
        >
          <option value="">Todos los Segmentos</option>
          <option value="TCI">TCI (Tronco Común Izquierdo)</option>
          <option value="LAD">LAD (Descendente Anterior)</option>
          <option value="LCx">LCx (Circunfleja)</option>
          <option value="RCA">RCA (Coronaria Derecha)</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
          Periodo de Auditoría
        </label>
        <select
          value={currentDateRange}
          onChange={(e) => updateFilters('dateRange', e.target.value)}
          className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs text-slate-300 outline-none cursor-pointer"
        >
          <option value="all">Histórico Completo</option>
          <option value="30days">Últimos 30 días</option>
          <option value="90days">Últimos 90 días</option>
          <option value="thisyear">Este Año (2026)</option>
        </select>
      </div>
    </div>
  );
}
