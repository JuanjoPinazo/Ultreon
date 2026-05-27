'use client';

import React from 'react';
interface StrategyModificationPanelProps {
  strategyChanges?: Record<string, any> | null;
}

export default function StrategyModificationPanel({ strategyChanges }: StrategyModificationPanelProps) {
  if (!strategyChanges || !strategyChanges.modified_strategy) {
    return (
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8">
        <h2 className="text-base font-bold text-slate-50 mb-1">Modificación de Estrategia</h2>
        <p className="text-xs text-slate-400 mt-2">Sin cambios de estrategia en este caso</p>
      </div>
    );
  }

  const getMagnitudeColor = (mag?: string | null) => {
    if (mag === 'minor') return 'bg-blue-950/60 text-blue-400 border-blue-800/40';
    if (mag === 'moderate') return 'bg-yellow-950/60 text-yellow-400 border-yellow-800/40';
    if (mag === 'major') return 'bg-red-950/60 text-red-400 border-red-800/40';
    return 'bg-slate-850 text-slate-400 border-slate-750';
  };

  const getMagnitudeLabel = (mag?: string | null) => {
    if (mag === 'minor') return 'Cambio Menor';
    if (mag === 'moderate') return 'Cambio Moderado';
    if (mag === 'major') return 'Cambio Mayor';
    return 'Sin clasificar';
  };

  const modifications = [];

  if (strategyChanges.changed_stent_diameter)
    modifications.push('Diámetro stent modificado');
  if (strategyChanges.changed_stent_length)
    modifications.push('Largo stent modificado');
  if (strategyChanges.changed_landing_zone_proximal || strategyChanges.changed_landing_zone_distal)
    modifications.push('Zona de desembarco ajustada');
  if (strategyChanges.required_plaque_preparation)
    modifications.push('Preparación de placa requerida');
  if (strategyChanges.used_nc_balloon)
    modifications.push('Balón NC utilizado');
  if (strategyChanges.used_scoring_cutting_balloon)
    modifications.push('Balón de corte/scoring utilizado');
  if (strategyChanges.used_ivl)
    modifications.push('IVL utilizado');
  if (strategyChanges.used_atherectomy)
    modifications.push('Aterectomía realizada');
  if (strategyChanges.decided_no_stent)
    modifications.push('Decisión sin stent');
  if (strategyChanges.treated_edge)
    modifications.push('Borde tratado');
  if (strategyChanges.additional_postdilatation)
    modifications.push('Postdilatación adicional');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-50 mb-1">Modificación de Estrategia ULTREON™</h2>
        <p className="text-xs text-slate-400">Cambios de procedimiento recomendados e implementados</p>
      </div>

      {/* Main Impact Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-850 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100 mb-1">ULTREON™ modificó la estrategia</h3>
            {strategyChanges.change_description && (
              <p className="text-xs text-slate-400 font-mono mt-2">{strategyChanges.change_description}</p>
            )}
          </div>
          <span
            className={`px-3 py-1 rounded-full font-bold text-xs border whitespace-nowrap ${getMagnitudeColor(strategyChanges.change_magnitude)}`}
          >
            {getMagnitudeLabel(strategyChanges.change_magnitude)}
          </span>
        </div>
      </div>

      {/* Modification Details Grid */}
      {modifications.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {modifications.map((mod, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center gap-2"
            >
              <span className="text-cyan-400 font-bold text-lg">✓</span>
              <span className="text-xs font-semibold text-slate-300">{mod}</span>
            </div>
          ))}
        </div>
      )}

      {/* Preparation Techniques */}
      {(strategyChanges.used_nc_balloon ||
        strategyChanges.used_scoring_cutting_balloon ||
        strategyChanges.used_ivl ||
        strategyChanges.used_atherectomy) && (
        <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-300 mb-3">Técnicas de Preparación Utilizadas</p>
          <div className="space-y-2 text-xs font-mono text-slate-400">
            {strategyChanges.used_nc_balloon && (
              <p>• Balón No-Compliant (NC) - Preparación inicial y dilatación</p>
            )}
            {strategyChanges.used_scoring_cutting_balloon && (
              <p>• Balón de Corte/Scoring - Modificación de fisuración</p>
            )}
            {strategyChanges.used_ivl && (
              <p>• Intravascular Lithotripsy (IVL) - Ablación de calcio</p>
            )}
            {strategyChanges.used_atherectomy && (
              <p>• Aterectomía - Remoción de ateroma</p>
            )}
          </div>
        </div>
      )}

      {/* Post-PCI Interventions */}
      {(strategyChanges.treated_edge || strategyChanges.additional_postdilatation) && (
        <div className="bg-slate-950/60 border border-slate-850 rounded-2xl p-4">
          <p className="text-xs font-bold text-slate-300 mb-3">Intervenciones Post-PCI</p>
          <div className="space-y-2 text-xs font-mono text-slate-400">
            {strategyChanges.treated_edge && (
              <p>• Borde tratado para optimizar aposición y cobertura</p>
            )}
            {strategyChanges.additional_postdilatation && (
              <p>• Postdilatación adicional para expansión óptima</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
