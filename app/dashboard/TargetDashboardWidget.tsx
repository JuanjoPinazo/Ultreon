'use client';

import React from 'react';
import Link from 'next/link';
import { getCenterProgress, getOperatorProgress } from '@/lib/metrics/progress';
import type { CenterTarget, OperatorTarget, RegistryCase } from '@/lib/metrics/progress';

export default function TargetDashboardWidget({
  centerTarget,
  operatorTarget,
  cases,
  role,
  hospitalName,
  operatorName
}: {
  centerTarget: CenterTarget | null;
  operatorTarget: OperatorTarget | null;
  cases: RegistryCase[];
  role: string;
  hospitalName: string;
  operatorName?: string;
}) {
  if (!centerTarget) return null;

  const centerProgress = getCenterProgress(centerTarget, cases);
  const opProgress = operatorTarget ? getOperatorProgress(operatorTarget, cases) : null;

  return (
    <div className="bg-gradient-to-r from-slate-900 to-slate-800 dark:from-slate-950 dark:to-slate-900 border border-slate-700 rounded-3xl p-6 shadow-xl relative overflow-hidden text-white">
      {/* Decorative background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center relative z-10">
        <div>
          <h3 className="text-xs font-bold text-slate-400 tracking-widest uppercase mb-1">
            Progreso del Registro • {hospitalName}
          </h3>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-black">{centerProgress.completed}</span>
            <span className="text-lg text-slate-400">/ {centerTarget.target_total} casos</span>
          </div>
        </div>

        <div className="flex-1 max-w-md w-full">
          <div className="flex justify-between text-xs font-bold mb-2">
            <span className="text-indigo-400">Cumplimiento Global</span>
            <span>{centerProgress.completionRate}%</span>
          </div>
          <div className="w-full bg-slate-700/50 rounded-full h-2.5 overflow-hidden border border-slate-600/50">
            <div 
              className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
              style={{ width: `${Math.min(100, centerProgress.completionRate)}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-slate-400 font-mono">
            <span>Ritmo: {centerProgress.actualRate}/mes</span>
            <span>Restantes: {centerProgress.remaining}</span>
          </div>
        </div>

        {opProgress && (
          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-xl min-w-[200px]">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Objetivo Personal ({operatorName})</h4>
            <div className="flex justify-between items-end mb-2">
              <span className="text-2xl font-black text-cyan-400">{opProgress.completed}<span className="text-sm text-slate-500">/{operatorTarget?.target_total}</span></span>
              <span className="text-sm font-bold">{opProgress.completionRate}%</span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-1 overflow-hidden">
              <div 
                className="bg-cyan-400 h-full"
                style={{ width: `${Math.min(100, opProgress.completionRate)}%` }}
              />
            </div>
          </div>
        )}

        {(role === 'admin' || role === 'monitor') && (
          <Link href="/admin/targets" className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-bold transition-all whitespace-nowrap">
            Gestionar Objetivos
          </Link>
        )}
      </div>
    </div>
  );
}
