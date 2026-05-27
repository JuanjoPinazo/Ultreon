'use client';

import React from 'react';
interface TriadaUltreeonProps {
  optimization?: Record<string, any> | null;
}

export default function TriadaUltreeon({ optimization }: TriadaUltreeonProps) {
  if (!optimization) {
    return (
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8">
        <h2 className="text-base font-bold text-slate-50 mb-1">Triada ULTREON™</h2>
        <p className="text-xs text-slate-400 mt-2">Sin resultados de optimización registrados</p>
      </div>
    );
  }

  const getBadgeColor = (value: string | undefined | null) => {
    if (value === 'yes') return 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40';
    if (value === 'no') return 'bg-cyan-950/60 text-cyan-400 border-cyan-800/40';
    if (value === 'na') return 'bg-slate-850 text-slate-400 border-slate-700';
    return 'bg-slate-850 text-slate-400 border-slate-700';
  };

  const getBadgeLabel = (value: string | undefined | null) => {
    if (value === 'yes') return 'Presente';
    if (value === 'no') return 'Ausente';
    if (value === 'na') return 'N/A';
    return 'Sin evaluar';
  };

  const getDissectionWarning = (hasProximal: boolean, hasDistal: boolean) => {
    if (!hasProximal && !hasDistal) return { color: 'emerald', label: 'Sin disección' };
    if (hasProximal || hasDistal) return { color: 'yellow', label: 'Disección presente' };
    return { color: 'slate', label: 'Sin datos' };
  };

  const dissectionStatus = getDissectionWarning(
    optimization.proximal_edge_dissection || false,
    optimization.distal_edge_dissection || false
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-50 mb-1">Triada ULTREON™ Optimization</h2>
        <p className="text-xs text-slate-400">Métricas clave de expansión, aposición y optimización de bordes</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A) EXPANSION */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5">
          <div className="mb-4 pb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span className="text-lg">📏</span> Expansión
            </h3>
          </div>

          {/* MSA Value */}
          {optimization.post_stent_msa_mm2 !== undefined && optimization.post_stent_msa_mm2 !== null && (
            <div className="mb-4">
              <p className="text-[10px] font-mono text-slate-500 mb-1 uppercase">MSA Post-Stent</p>
              <p className="text-2xl font-bold text-cyan-400">{optimization.post_stent_msa_mm2.toFixed(2)}</p>
              <p className="text-[9px] text-slate-500 font-mono">mm²</p>
            </div>
          )}

          {/* Expansion % */}
          {optimization.stent_expansion_percent !== undefined && optimization.stent_expansion_percent !== null && (
            <div className="mb-4">
              <p className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Expansión</p>
              <p className="text-2xl font-bold text-yellow-400">{optimization.stent_expansion_percent.toFixed(1)}%</p>
              <p className="text-[9px] text-slate-500 font-mono">del diámetro referencia</p>
            </div>
          )}

          {/* Adequate Expansion Badge */}
          {optimization.adequate_expansion && (
            <div className="mt-4 pt-4 border-t border-slate-800">
              <span
                className={`px-3 py-1.5 rounded-lg font-bold text-xs border inline-block ${getBadgeColor(optimization.adequate_expansion)}`}
              >
                ✓ Expansión Adecuada
              </span>
            </div>
          )}
        </div>

        {/* B) APPOSITION */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5">
          <div className="mb-4 pb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span className="text-lg">🎯</span> Aposición
            </h3>
          </div>

          {/* Malapposition Length */}
          {optimization.malapposition_length_mm !== undefined && optimization.malapposition_length_mm !== null && (
            <div className="mb-4">
              <p className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Longitud Malaposición</p>
              <p className={`text-2xl font-bold ${optimization.malapposition_length_mm > 0 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                {optimization.malapposition_length_mm.toFixed(2)}
              </p>
              <p className="text-[9px] text-slate-500 font-mono">mm</p>
            </div>
          )}

          {/* Significant Malapposition */}
          {optimization.significant_malapposition && (
            <div className="mb-4 pt-4">
              <span
                className={`px-3 py-1.5 rounded-lg font-bold text-xs border block text-center ${
                  optimization.significant_malapposition === 'no'
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                    : 'bg-yellow-950/60 text-yellow-400 border-yellow-800/40'
                }`}
              >
                {optimization.significant_malapposition === 'no' ? '✓ Sin Malaposición' : '⚠ Malaposición Significativa'}
              </span>
            </div>
          )}

          {/* Correction Status */}
          {optimization.requires_malapposition_correction && (
            <div className="mt-4 pt-4 border-t border-slate-800 bg-yellow-950/30 p-2 rounded-lg">
              <p className="text-[9px] text-yellow-300 font-mono">⚠ Requiere corrección de malaposición</p>
            </div>
          )}
        </div>

        {/* C) EDGE OPTIMIZATION */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-5">
          <div className="mb-4 pb-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <span className="text-lg">🔧</span> Bordes
            </h3>
          </div>

          {/* Proximal Edge Dissection */}
          <div className="mb-3">
            <p className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Disección Proximal</p>
            {optimization.proximal_dissection_length_mm !== undefined && optimization.proximal_dissection_length_mm > 0 && (
              <p className="text-sm font-bold text-yellow-400 mb-1">
                {optimization.proximal_dissection_length_mm.toFixed(1)} mm
              </p>
            )}
            <span
              className={`text-[9px] px-2 py-0.5 rounded border inline-block ${
                optimization.proximal_edge_dissection
                  ? 'bg-yellow-950/60 text-yellow-400 border-yellow-800/40'
                  : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
              }`}
            >
              {optimization.proximal_edge_dissection ? 'Presente' : 'Ausente'}
            </span>
          </div>

          {/* Distal Edge Dissection */}
          <div className="mb-4">
            <p className="text-[10px] font-mono text-slate-500 mb-1 uppercase">Disección Distal</p>
            {optimization.distal_dissection_length_mm !== undefined && optimization.distal_dissection_length_mm > 0 && (
              <p className="text-sm font-bold text-yellow-400 mb-1">
                {optimization.distal_dissection_length_mm.toFixed(1)} mm
              </p>
            )}
            <span
              className={`text-[9px] px-2 py-0.5 rounded border inline-block ${
                optimization.distal_edge_dissection
                  ? 'bg-yellow-950/60 text-yellow-400 border-yellow-800/40'
                  : 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
              }`}
            >
              {optimization.distal_edge_dissection ? 'Presente' : 'Ausente'}
            </span>
          </div>

          {/* Flap Warning */}
          {optimization.significant_flap_gt_3mm && (
            <div className="mt-4 pt-4 border-t border-slate-800 bg-red-950/30 p-2 rounded-lg">
              <p className="text-[9px] text-red-300 font-mono">⚠ Flap significativo &gt; 3mm detectado</p>
            </div>
          )}

          {/* Edge Treatment */}
          {optimization.requires_edge_treatment && (
            <div className="mt-2 pt-2 border-t border-slate-800 bg-yellow-950/30 p-2 rounded-lg">
              <p className="text-[9px] text-yellow-300 font-mono">⚠ Requiere tratamiento de borde</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Status */}
      <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4">
        <p className="text-xs font-bold text-slate-300 mb-3">ESTADO GENERAL TRIADA</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className={`p-2 rounded-lg text-[9px] font-mono ${optimization.adequate_expansion === 'yes' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-slate-900 text-slate-400'}`}>
            <p className="font-bold">Expansión</p>
            <p>{optimization.adequate_expansion === 'yes' ? '✓' : '—'}</p>
          </div>
          <div className={`p-2 rounded-lg text-[9px] font-mono ${optimization.significant_malapposition === 'no' ? 'bg-emerald-950/60 text-emerald-400' : 'bg-slate-900 text-slate-400'}`}>
            <p className="font-bold">Aposición</p>
            <p>{optimization.significant_malapposition === 'no' ? '✓' : '—'}</p>
          </div>
          <div
            className={`p-2 rounded-lg text-[9px] font-mono ${
              !optimization.proximal_edge_dissection && !optimization.distal_edge_dissection
                ? 'bg-emerald-950/60 text-emerald-400'
                : 'bg-slate-900 text-slate-400'
            }`}
          >
            <p className="font-bold">Bordes</p>
            <p>{!optimization.proximal_edge_dissection && !optimization.distal_edge_dissection ? '✓' : '—'}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
