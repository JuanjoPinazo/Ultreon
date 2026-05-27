'use client';

import React from 'react';
import Link from 'next/link';

// Components
import CaseHero from '@/components/case-detail/CaseHero';
import ProceduralTimeline from '@/components/case-detail/ProceduralTimeline';
import AIAnalysisPanel from '@/components/case-detail/AIAnalysisPanel';
import StrategyModificationPanel from '@/components/case-detail/StrategyModificationPanel';
import ZeroContrastAnalysis from '@/components/case-detail/ZeroContrastAnalysis';
import TriadaUltreeon from '@/components/case-detail/TriadaUltreeon';
import FollowUpPanel from '@/components/case-detail/FollowUpPanel';
import CongressExportButton from '@/components/case-detail/CongressExportButton';

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

interface CaseRecord {
  id: string;
  id_paciente: string;
  centro: string;
  vaso_diana: string;
  created_at: string;
  calcio_ia?: boolean;
  placa_lipida_ia?: boolean;
  arco_lipidico_estimado?: number | null;
  landing_zone?: string;
  ffr_oct?: number | null;
  expected_contrast_ml?: number | null;
  actual_contrast_ml?: number | null;
  zero_contrast_completed?: boolean;
  hospitals?: { name: string } | { name: string }[];
  opstar_strategy_changes?: Array<Record<string, any>> | null;
  opstar_optimization_results?: Array<Record<string, any>> | null;
}

interface CaseDetailClientProps {
  caseRecord: CaseRecord;
  followups: FollowUp[];
}

export default function CaseDetailClient({ caseRecord, followups }: CaseDetailClientProps) {
  // Resolve hospital name (handle both single object and array)
  const hospitalName = caseRecord.hospitals
    ? Array.isArray(caseRecord.hospitals)
      ? caseRecord.hospitals[0]?.name || 'Centro no definido'
      : (caseRecord.hospitals as any).name || 'Centro no definido'
    : 'Centro no definido';

  // Get first strategy change record if exists
  const strategyChanges = caseRecord.opstar_strategy_changes?.[0] || null;

  // Get first optimization result if exists
  const optimization = caseRecord.opstar_optimization_results?.[0] || null;

  // Determine follow-up status
  const getFollowupStatus = () => {
    if (followups.length === 0) return undefined;
    const hasMAace = followups.some((f) => f.mace);
    if (hasMAace) return 'mace';
    const allCompleted = followups.every((f) => f.completed);
    if (allCompleted) return 'clean';
    return 'pending';
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 md:px-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="h-8 w-8 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-300 font-bold transition-all"
            >
              ←
            </Link>
            <div>
              <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                CASE DETAIL
              </span>
              <h1 className="text-base font-bold text-slate-50 mt-0.5">Revisión de Caso Clínico</h1>
            </div>
          </div>

          <Link
            href="/dashboard"
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-medium transition-all"
          >
            Volver
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        <div className="space-y-8">
          {/* 1. CASE HERO */}
          <CaseHero
            caseId={caseRecord.id}
            patientId={caseRecord.id_paciente}
            hospitalName={hospitalName}
            procedureDate={caseRecord.created_at}
            segment={caseRecord.vaso_diana}
            zeroContrastCompleted={caseRecord.zero_contrast_completed}
            opstarScore={optimization?.opstar_score}
            opstarScoreCategory={optimization?.opstar_score_category}
            followupStatus={getFollowupStatus()}
          />

          {/* 2. PROCEDURAL TIMELINE */}
          <ProceduralTimeline />

          {/* 3. AI ANALYSIS PANEL */}
          <AIAnalysisPanel
            severeCalcium={caseRecord.calcio_ia}
            lipidPlaque={caseRecord.placa_lipida_ia}
            lipidArc={caseRecord.arco_lipidico_estimado}
            ffrOct={caseRecord.ffr_oct}
            landingZone={caseRecord.landing_zone}
          />

          {/* 4. STRATEGY MODIFICATION */}
          <StrategyModificationPanel strategyChanges={strategyChanges} />

          {/* 5. ZERO-CONTRAST ANALYSIS */}
          <ZeroContrastAnalysis
            expectedContrastMl={caseRecord.expected_contrast_ml}
            actualContrastMl={caseRecord.actual_contrast_ml}
            zeroContrastCompleted={caseRecord.zero_contrast_completed}
          />

          {/* 6. TRIADA ULTREON™ */}
          <TriadaUltreeon optimization={optimization} />

          {/* 7. FOLLOW-UP PANEL */}
          <FollowUpPanel caseId={caseRecord.id} followups={followups} />

          {/* 8. CONGRESS EXPORT */}
          <CongressExportButton />
        </div>
      </div>
    </main>
  );
}
