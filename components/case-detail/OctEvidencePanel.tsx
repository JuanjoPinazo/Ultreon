'use client';

import React from 'react';
import Link from 'next/link';

interface OctEvidenceStats {
  totalEvidence: number;
  keyEvidenceCount: number;
  pendingCorelab: number;
  preOciKey: boolean;
  postPciKey: boolean;
  strategyChangeEvidence: number;
}

interface OctEvidencePanelProps {
  caseId: string;
  stats?: OctEvidenceStats;
  canUpload: boolean;
}

export default function OctEvidencePanel({
  caseId,
  stats = {
    totalEvidence: 0,
    keyEvidenceCount: 0,
    pendingCorelab: 0,
    preOciKey: false,
    postPciKey: false,
    strategyChangeEvidence: 0,
  },
  canUpload,
}: OctEvidencePanelProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-850">
        <div>
          <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">
            OCT Evidence
          </h3>
          <p className="text-sm font-bold text-slate-50 mt-1">
            {stats.totalEvidence} evidencias cargadas
          </p>
        </div>
        <Link
          href={`/cases/${caseId}/evidence`}
          className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 px-4 py-2 rounded-xl text-xs font-bold transition-all"
        >
          Gestionar
        </Link>
      </div>

      {/* Evidence Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Total</span>
          <span className="text-lg font-bold text-slate-100 mt-1">{stats.totalEvidence}</span>
        </div>

        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Key</span>
          <span className="text-lg font-bold text-emerald-400 mt-1">
            {stats.keyEvidenceCount}
          </span>
        </div>

        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">
            Strategy
          </span>
          <span className="text-lg font-bold text-purple-400 mt-1">
            {stats.strategyChangeEvidence}
          </span>
        </div>

        <div className="bg-slate-950/50 border border-slate-800 rounded-lg p-3 text-center">
          <span className="text-[10px] font-mono text-slate-400 uppercase block">Core Lab</span>
          <span
            className={`text-lg font-bold mt-1 ${
              stats.pendingCorelab === 0 ? 'text-emerald-400' : 'text-yellow-400'
            }`}
          >
            {stats.pendingCorelab}
          </span>
        </div>
      </div>

      {/* Alerts */}
      <div className="space-y-2">
        {!stats.preOciKey && (
          <div className="bg-yellow-950/40 border border-yellow-800/40 rounded-lg p-3 flex items-start gap-2">
            <span className="text-yellow-400 font-bold mt-0.5">⚠</span>
            <span className="text-xs text-yellow-300">
              No hay evidencia clave pre-PCI. Adjunta OCT pre-stent.
            </span>
          </div>
        )}

        {!stats.postPciKey && (
          <div className="bg-yellow-950/40 border border-yellow-800/40 rounded-lg p-3 flex items-start gap-2">
            <span className="text-yellow-400 font-bold mt-0.5">⚠</span>
            <span className="text-xs text-yellow-300">
              No hay evidencia clave post-PCI. Adjunta OCT post-stent.
            </span>
          </div>
        )}

        {stats.pendingCorelab > 0 && (
          <div className="bg-amber-950/40 border border-amber-800/40 rounded-lg p-3 flex items-start gap-2">
            <span className="text-amber-400 font-bold mt-0.5">🔄</span>
            <span className="text-xs text-amber-300">
              {stats.pendingCorelab} evidencias pendientes de validación core lab.
            </span>
          </div>
        )}
      </div>

      {canUpload && stats.totalEvidence === 0 && (
        <Link
          href={`/cases/${caseId}/evidence`}
          className="block bg-gradient-to-r from-cyan-950/60 to-blue-950/60 hover:from-cyan-950 hover:to-blue-950 border border-cyan-800/40 rounded-lg p-4 text-center transition-all"
        >
          <span className="text-sm font-bold text-cyan-400">
            📸 Comenzar a cargar evidencia OCT
          </span>
        </Link>
      )}
    </div>
  );
}
