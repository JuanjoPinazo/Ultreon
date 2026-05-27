'use client';

import React from 'react';
import Link from 'next/link';

interface FollowUp {
  id: string;
  case_id: string;
  followup_type: 'procedural' | '30days' | '6months' | '12months';
  followup_date: string;
  mace: boolean;
  tlr: boolean;
  tvr: boolean;
  rehospitalization: boolean;
  completed: boolean;
}

interface FollowUpPanelProps {
  caseId: string;
  followups?: FollowUp[];
}

export default function FollowUpPanel({ caseId, followups = [] }: FollowUpPanelProps) {
  const timepoints = ['procedural', '30days', '6months', '12months'] as const;

  const getLabelForType = (type: string) => {
    switch (type) {
      case 'procedural':
        return 'Procedimiento (Alta)';
      case '30days':
        return '30 Días';
      case '6months':
        return '6 Meses';
      case '12months':
        return '12 Meses';
      default:
        return type;
    }
  };

  const getTimepointStatus = (type: string) => {
    const fu = followups.find((f) => f.followup_type === type);
    if (!fu) return 'not_started';
    if (!fu.completed) return 'pending';
    if (fu.mace) return 'mace';
    return 'clean';
  };

  const getNodeColor = (type: string) => {
    const status = getTimepointStatus(type);
    if (status === 'mace')
      return 'bg-red-950/40 border-red-900/60 text-red-300 ring-red-500/20';
    if (status === 'clean')
      return 'bg-emerald-950/30 border-emerald-900/50 text-emerald-300 ring-emerald-500/20';
    if (status === 'pending')
      return 'bg-yellow-950/20 border-yellow-900/40 text-yellow-300 ring-yellow-500/20';
    return 'bg-slate-900/60 border-slate-800 text-slate-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-50 mb-1">Seguimiento Clínico Longitudinal</h2>
          <p className="text-xs text-slate-400">Timeline de outcomes y eventos adversos mayores (MACE)</p>
        </div>
        <Link
          href={`/cases/${caseId}/follow-up`}
          className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 transition-all"
        >
          Ver Detalles →
        </Link>
      </div>

      {/* Timeline */}
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6">
        {/* Desktop Timeline */}
        <div className="hidden sm:grid grid-cols-4 gap-2 relative">
          {timepoints.map((type, idx) => {
            const status = getTimepointStatus(type);
            const fu = followups.find((f) => f.followup_type === type);

            return (
              <div key={type} className="flex flex-col items-center">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 ring-2 transition-all ${getNodeColor(type)}`}>
                  {status === 'mace' && <span className="text-lg">⚠️</span>}
                  {status === 'clean' && <span className="text-lg">✓</span>}
                  {status === 'pending' && <span className="text-lg">✏</span>}
                  {status === 'not_started' && <span className="text-lg">—</span>}
                </div>

                <p className="mt-3 text-xs font-bold text-slate-300 text-center">{getLabelForType(type)}</p>

                {fu && (
                  <div className="mt-2 text-center text-[9px] text-slate-500 font-mono">
                    {new Date(fu.followup_date).toLocaleDateString('es-ES')}
                  </div>
                )}

                {status === 'mace' && (
                  <div className="mt-2 bg-red-950/30 border border-red-900/40 rounded-lg p-2 text-[9px] text-red-300 font-mono max-w-[100px]">
                    MACE presente
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Timeline */}
        <div className="sm:hidden space-y-4">
          {timepoints.map((type) => {
            const status = getTimepointStatus(type);
            const fu = followups.find((f) => f.followup_type === type);

            return (
              <div key={type} className="flex gap-4 items-start">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ring-2 flex-shrink-0 transition-all ${getNodeColor(type)}`}
                >
                  {status === 'mace' && <span>⚠️</span>}
                  {status === 'clean' && <span>✓</span>}
                  {status === 'pending' && <span>✏</span>}
                  {status === 'not_started' && <span>—</span>}
                </div>

                <div className="flex-1 pt-1">
                  <p className="text-sm font-bold text-slate-300">{getLabelForType(type)}</p>
                  {fu && (
                    <p className="text-[9px] text-slate-500 font-mono mt-1">
                      {new Date(fu.followup_date).toLocaleDateString('es-ES')}
                    </p>
                  )}
                  {status === 'mace' && (
                    <div className="mt-2 bg-red-950/30 border border-red-900/40 rounded-lg p-2 text-[9px] text-red-300 font-mono">
                      ⚠ MACE evento registrado
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Outcomes Grid */}
      {followups.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-slate-200 mb-3">Resumen de Eventos (Todos los Periodos)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* MACE */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 text-center">
              <p className="text-[9px] font-mono text-slate-500 uppercase mb-2">MACE</p>
              <p className={`text-sm font-bold ${followups.some((f) => f.mace) ? 'text-red-400' : 'text-emerald-400'}`}>
                {followups.some((f) => f.mace) ? '⚠ Sí' : '✓ No'}
              </p>
            </div>

            {/* TLR */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 text-center">
              <p className="text-[9px] font-mono text-slate-500 uppercase mb-2">TLR</p>
              <p className={`text-sm font-bold ${followups.some((f) => f.tlr) ? 'text-red-400' : 'text-emerald-400'}`}>
                {followups.some((f) => f.tlr) ? '⚠ Sí' : '✓ No'}
              </p>
            </div>

            {/* TVR */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 text-center">
              <p className="text-[9px] font-mono text-slate-500 uppercase mb-2">TVR</p>
              <p className={`text-sm font-bold ${followups.some((f) => f.tvr) ? 'text-red-400' : 'text-emerald-400'}`}>
                {followups.some((f) => f.tvr) ? '⚠ Sí' : '✓ No'}
              </p>
            </div>

            {/* Rehospitalization */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 text-center">
              <p className="text-[9px] font-mono text-slate-500 uppercase mb-2">Rehosp.</p>
              <p
                className={`text-sm font-bold ${followups.some((f) => f.rehospitalization) ? 'text-red-400' : 'text-emerald-400'}`}
              >
                {followups.some((f) => f.rehospitalization) ? '⚠ Sí' : '✓ No'}
              </p>
            </div>

            {/* Completed */}
            <div className="bg-slate-900 border border-slate-850 rounded-xl p-3 text-center">
              <p className="text-[9px] font-mono text-slate-500 uppercase mb-2">Completados</p>
              <p className="text-sm font-bold text-cyan-400">{followups.filter((f) => f.completed).length}</p>
            </div>
          </div>
        </div>
      )}

      {followups.length === 0 && (
        <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4 text-center">
          <p className="text-sm text-slate-400">No hay seguimientos registrados aún</p>
          <Link
            href={`/cases/${caseId}/follow-up`}
            className="mt-3 inline-block px-4 py-2 bg-cyan-950/60 hover:bg-cyan-950/80 border border-cyan-800/40 rounded-lg text-xs font-semibold text-cyan-400 transition-all"
          >
            Iniciar Seguimiento
          </Link>
        </div>
      )}
    </div>
  );
}
