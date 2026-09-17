import React from 'react';

type RegistryPhase = 'PRELAUNCH' | 'LIVE' | 'CLOSED' | string;

export function RegistryPhaseBanner({ phase, officialStartDate }: { phase?: RegistryPhase, officialStartDate?: string | null }) {
  if (!phase) return null;

  if (phase === 'PRELAUNCH') {
    return (
      <div className="bg-[#FFFBEB] dark:bg-amber-950/30 border border-[#F59E0B] dark:border-amber-900/50 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-[#D97706] dark:text-amber-500 flex-shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-[#92400E] dark:text-amber-400">REGISTRO EN PRELANZAMIENTO</h3>
          <p className="text-xs font-medium text-[#475569] dark:text-muted-foreground mt-1 max-w-3xl leading-relaxed">
            Los datos actuales son de prueba y no computan oficialmente en las métricas científicas, objetivos ni consumo de stock. 
            Toda la actividad realizada se etiquetará como prelanzamiento.
          </p>
        </div>
      </div>
    );
  }

  if (phase === 'LIVE') {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 dark:border-emerald-900/40 rounded-lg py-2 px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-400">Registro Oficial Activo</span>
        </div>
        <div className="text-xs font-medium text-emerald-800 dark:text-emerald-500/70 font-mono">
          desde {officialStartDate ? new Date(officialStartDate).toLocaleDateString('es-ES') : ''}
        </div>
      </div>
    );
  }

  if (phase === 'CLOSED') {
    return (
      <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-300 dark:border-slate-800 rounded-lg py-2 px-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-400">Registro Cerrado</span>
        </div>
      </div>
    );
  }

  return null;
}
