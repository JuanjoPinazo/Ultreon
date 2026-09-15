'use client';

import React from 'react';
import { calculateContrastReduction } from '@/lib/clinical';

interface ZeroContrastAnalysisProps {
  expectedContrastMl?: number | null;
  actualContrastMl?: number | null;
  zeroContrastCompleted?: boolean;
}

export default function ZeroContrastAnalysis({
  expectedContrastMl,
  actualContrastMl,
  zeroContrastCompleted,
}: ZeroContrastAnalysisProps) {
  const hasData =
    (expectedContrastMl !== undefined && expectedContrastMl !== null) ||
    (actualContrastMl !== undefined && actualContrastMl !== null);

  if (!hasData) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 md:p-8">
        <h2 className="text-base font-bold text-foreground mb-1">Análisis Suero / No-Contraste</h2>
        <p className="text-xs text-muted-foreground mt-2">Sin datos de contraste registrados</p>
      </div>
    );
  }

  const expected = expectedContrastMl || 0;
  const actual = actualContrastMl || 0;
  const reduction = calculateContrastReduction(expected, actual);

  const isZeroContrast = actual === 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-foreground mb-1">Análisis Suero / No-Contraste</h2>
        <p className="text-xs text-muted-foreground">Optimización de contraste e intravasculares</p>
      </div>

      {/* Main Metrics Card */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-850 border border-border rounded-2xl p-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          {/* Expected */}
          <div className="text-center">
            <p className="text-xs font-mono text-muted-foreground mb-2">CONTRASTE ESPERADO</p>
            <p className="text-2xl font-bold text-muted-foreground">{expected}</p>
            <p className="text-[9px] text-slate-600 mt-1 font-mono">mL</p>
          </div>

          {/* Actual */}
          <div className="text-center">
            <p className="text-xs font-mono text-muted-foreground mb-2">CONTRASTE UTILIZADO</p>
            <p className={`text-2xl font-bold ${isZeroContrast ? 'text-cyan-400' : 'text-yellow-400'}`}>
              {actual}
            </p>
            <p className="text-[9px] text-slate-600 mt-1 font-mono">mL</p>
          </div>

          {/* Reduction % */}
          <div className="text-center">
            <p className="text-xs font-mono text-muted-foreground mb-2">REDUCCIÓN</p>
            <p className={`text-2xl font-bold ${reduction >= 50 ? 'text-emerald-400' : 'text-yellow-400'}`}>
              {reduction}%
            </p>
            <p className="text-[9px] text-slate-600 mt-1 font-mono">Reducción</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-background rounded-full h-2 overflow-hidden border border-border dark:border-slate-700">
          <div
            className={`h-full transition-all ${
              reduction >= 80
                ? 'bg-emerald-500'
                : reduction >= 50
                  ? 'bg-cyan-500'
                  : reduction >= 25
                    ? 'bg-yellow-500'
                    : 'bg-orange-500'
            }`}
            style={{ width: `${Math.min(reduction, 100)}%` }}
          />
        </div>
      </div>

      {/* Zero-Contrast Badge */}
      {zeroContrastCompleted && (
        <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-bold text-emerald-400 text-sm">SUERO / NO-CONTRASTE COMPLETADO</p>
            <p className="text-xs text-emerald-300/80 mt-0.5">
              Procedimiento realizado sin contraste de gadolinio intravenoso
            </p>
          </div>
        </div>
      )}

      {/* Quality Assessment */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-bold text-muted-foreground mb-2">CALIDAD DEL LAVADO</p>
          <p className={`text-sm font-semibold ${actual === 0 ? 'text-cyan-400' : 'text-yellow-400'}`}>
            {actual === 0 ? 'Óptima' : 'Moderada'}
          </p>
          <p className="text-[9px] text-muted-foreground mt-1 font-mono">
            {actual === 0 ? 'Procedimiento sin contraste documentado' : 'Mínimo contraste utilizado'}
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-bold text-muted-foreground mb-2">RECONVERSIÓN A CONTRASTE</p>
          <p className="text-sm font-semibold text-muted-foreground">No registrada</p>
          <p className="text-[9px] text-muted-foreground mt-1 font-mono">Procedimiento completado exitosamente</p>
        </div>
      </div>

      {/* Clinical Impact */}
      <div className="bg-background/60 border border-border rounded-2xl p-4">
        <p className="text-xs font-bold text-muted-foreground mb-2">IMPACTO CLÍNICO</p>
        <ul className="space-y-1 text-xs text-muted-foreground font-mono">
          <li>
            • Reducción de contraste: <span className="text-cyan-400 font-bold">{reduction.toFixed(1)}%</span>
          </li>
          <li>
            • Protección renal mejorada para pacientes de alto riesgo
          </li>
          <li>
            • Compatibilidad con pacientes con insuficiencia renal
          </li>
          {isZeroContrast && <li>• Máxima protección: procedimiento sin gadolinio</li>}
        </ul>
      </div>
    </div>
  );
}
