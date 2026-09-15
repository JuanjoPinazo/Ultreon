import React from 'react';
import { getOpstarScoreCategoryLabel } from '@/lib/clinical';

interface CaseHeroProps {
  caseId: string;
  patientId: string;
  hospitalName: string;
  procedureDate: string;
  segment: string;
  operatorName?: string;
  zeroContrastCompleted?: boolean;
  opstarScore?: number | null;
  opstarScoreCategory?: string | null;
  followupStatus?: 'pending' | 'clean' | 'mace';
  isDemo?: boolean;
}

const getScoreBgColor = (category: string | null | undefined) => {
  if (!category) return 'bg-background border-border text-muted-foreground';
  if (category === 'optimal') return 'bg-cyan-950/60 border-cyan-800/40 text-cyan-400';
  if (category === 'suboptimal_mild') return 'bg-yellow-950/60 border-yellow-800/40 text-yellow-400';
  if (category === 'suboptimal_moderate') return 'bg-orange-950/60 border-orange-800/40 text-orange-400';
  return 'bg-red-950/60 border-red-800/40 text-red-400';
};

export default function CaseHero({
  caseId,
  patientId,
  hospitalName,
  procedureDate,
  segment,
  operatorName,
  zeroContrastCompleted,
  opstarScore,
  opstarScoreCategory,
  followupStatus,
  isDemo,
}: CaseHeroProps) {
  const formattedDate = new Date(procedureDate).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  return (
    <div className="bg-card border border-border rounded-3xl p-6 md:p-8">
      {/* Header Badge */}
      <div className="mb-6 flex items-center gap-2">
        <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
          ULTREON™ 3.0
        </span>
        <span className="text-[8px] font-mono font-bold text-muted-foreground uppercase">CASO CLÍNICO</span>
        {isDemo && (
          <span className="text-[8px] font-mono font-black text-orange-400 bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-900/40 uppercase tracking-widest">
            DEMO
          </span>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">

        {/* Case ID */}
        <div className="space-y-1">
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block">ID Caso</span>
          <p className="text-base font-bold font-mono text-cyan-400 truncate">{caseId.slice(0, 12)}...</p>
        </div>

        {/* Patient ID */}
        <div className="space-y-1">
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block">ID Paciente</span>
          <p className="text-base font-bold font-mono text-muted-foreground">{patientId}</p>
        </div>

        {/* Hospital */}
        <div className="space-y-1">
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block">Centro</span>
          <p className="text-sm font-semibold text-foreground truncate">{hospitalName}</p>
        </div>

        {/* Procedure Date */}
        <div className="space-y-1">
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block">Fecha PCI</span>
          <p className="text-sm font-semibold text-foreground">{formattedDate}</p>
        </div>

        {/* Segment AHA */}
        <div className="space-y-1">
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block">Vaso (AHA)</span>
          <p className="px-2 py-0.5 bg-cyan-950 text-cyan-400 border border-cyan-800/35 rounded font-mono font-bold text-xs text-center">
            {segment}
          </p>
        </div>

        {/* OPSTAR Score */}
        <div className="space-y-1">
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider block">OPSTAR Score</span>
          {opstarScore !== undefined && opstarScore !== null ? (
            <div className="flex flex-col gap-1">
              <span className={`px-2 py-1 rounded font-bold border font-mono text-xs text-center ${getScoreBgColor(opstarScoreCategory)}`}>
                {opstarScore}
              </span>
              <span className="text-[9px] text-muted-foreground font-mono text-center">
                {getOpstarScoreCategoryLabel(opstarScoreCategory || '')}
              </span>
            </div>
          ) : (
            <span className="text-xs text-muted-foreground font-mono">No evaluado</span>
          )}
        </div>
      </div>

      {/* Badges Row */}
      <div className="mt-6 pt-6 border-t border-border flex flex-wrap items-center gap-3">

        {/* Zero-Contrast Badge */}
        {zeroContrastCompleted && (
          <span className="px-3 py-1.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 rounded-full font-bold text-[10px] font-mono">
            ✓ SUERO / NO-CONTRASTE COMPLETADO
          </span>
        )}

        {/* Follow-up Status */}
        {followupStatus === 'clean' && (
          <span className="px-3 py-1.5 bg-emerald-950/40 text-emerald-400 border border-emerald-900/40 rounded-full font-bold text-[10px] font-mono">
            ✓ SEGUIMIENTO LIMPIO
          </span>
        )}
        {followupStatus === 'mace' && (
          <span className="px-3 py-1.5 bg-red-950/40 text-red-400 border border-red-900/40 rounded-full font-bold text-[10px] font-mono">
            ⚠ MACE REGISTRADO
          </span>
        )}
        {followupStatus === 'pending' && (
          <span className="px-3 py-1.5 bg-yellow-950/40 text-yellow-400 border border-yellow-900/40 rounded-full font-bold text-[10px] font-mono">
            ✏ SEGUIMIENTO PENDIENTE
          </span>
        )}

        {/* Operator */}
        {operatorName && (
          <span className="text-[10px] text-muted-foreground font-mono ml-auto">
            Operador: <span className="text-muted-foreground font-semibold">{operatorName}</span>
          </span>
        )}
      </div>
    </div>
  );
}
