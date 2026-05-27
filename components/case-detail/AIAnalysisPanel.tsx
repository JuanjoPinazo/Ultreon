'use client';

import React from 'react';

interface AIAnalysisPanelProps {
  severeCalcium?: boolean;
  lipidPlaque?: boolean;
  lipidArc?: number | null;
  ffrOct?: number | null;
  landingZone?: string;
}

interface AICard {
  title: string;
  icon: string;
  finding?: boolean | number | string | null;
  metrics?: { label: string; value: string | number }[];
  badge?: { label: string; color: string };
}

const getAICards = (props: AIAnalysisPanelProps): AICard[] => {
  const cards: AICard[] = [];

  // Calcium Card
  if (props.severeCalcium !== undefined) {
    cards.push({
      title: 'Calcio Severo',
      icon: '🏔️',
      finding: props.severeCalcium,
      badge: props.severeCalcium
        ? { label: 'SEVERO', color: 'text-red-400 bg-red-950/60 border-red-800/40' }
        : { label: 'No severo', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40' },
    });
  }

  // Lipid Plaque Card
  if (props.lipidPlaque !== undefined || props.lipidArc) {
    cards.push({
      title: 'Placa Lipídica',
      icon: '🔶',
      finding: props.lipidPlaque,
      metrics: props.lipidArc ? [{ label: 'Arco estimado', value: `${props.lipidArc}°` }] : [],
      badge: props.lipidPlaque
        ? { label: 'PRESENTE', color: 'text-yellow-400 bg-yellow-950/60 border-yellow-800/40' }
        : { label: 'Ausente', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40' },
    });
  }

  // EEL Reference Card
  if (props.landingZone) {
    cards.push({
      title: 'EEL Reference',
      icon: '📍',
      finding: props.landingZone,
      metrics: [{ label: 'Guía', value: props.landingZone === 'GUIADO_IA_EEL' ? 'IA-Guiado' : 'Manual' }],
      badge: {
        label: props.landingZone === 'GUIADO_IA_EEL' ? 'IA-GUIADO' : 'Manual',
        color: props.landingZone === 'GUIADO_IA_EEL' ? 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40' : 'text-blue-400 bg-blue-950/60 border-blue-800/40',
      },
    });
  }

  // FFR-OCT Card
  if (props.ffrOct !== undefined && props.ffrOct !== null) {
    cards.push({
      title: 'FFR-OCT',
      icon: '📊',
      finding: props.ffrOct,
      metrics: [{ label: 'Valor FFR', value: props.ffrOct.toFixed(2) }],
      badge: {
        label: props.ffrOct >= 0.8 ? 'ÓPTIMO' : 'Revisar',
        color: props.ffrOct >= 0.8 ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40' : 'text-yellow-400 bg-yellow-950/60 border-yellow-800/40',
      },
    });
  }

  return cards;
};

export default function AIAnalysisPanel(props: AIAnalysisPanelProps) {
  const cards = getAICards(props);

  if (cards.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8">
        <p className="text-sm text-slate-400">Sin hallazgos de análisis IA registrados</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-bold text-slate-50 mb-1">Análisis IA Pre-PCI</h2>
        <p className="text-xs text-slate-400">Hallazgos de análisis inteligente ULTREON™</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <div
            key={idx}
            className="bg-slate-900 border border-slate-850 rounded-2xl p-4 hover:border-slate-750 transition-all"
          >
            {/* Icon + Title */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{card.icon}</span>
              <h3 className="text-xs font-bold text-slate-200 flex-1">{card.title}</h3>
            </div>

            {/* Metrics */}
            {card.metrics && card.metrics.length > 0 && (
              <div className="space-y-2 mb-3 text-[10px]">
                {card.metrics.map((m, mIdx) => (
                  <div key={mIdx} className="flex justify-between items-center">
                    <span className="text-slate-500 font-mono">{m.label}</span>
                    <span className="font-bold text-cyan-400">{m.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Badge */}
            {card.badge && (
              <div className={`px-2 py-1 rounded-lg font-bold text-[9px] border text-center ${card.badge.color}`}>
                {card.badge.label}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
