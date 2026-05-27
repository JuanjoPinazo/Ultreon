import React from 'react';

interface TimelineStep {
  label: string;
  description: string;
  icon: string;
  status?: 'completed' | 'current' | 'pending';
}

const steps: TimelineStep[] = [
  {
    label: 'Pre-PCI',
    description: 'Evaluación inicial y preprocedural',
    icon: '📋',
    status: 'completed',
  },
  {
    label: 'AI Analysis',
    description: 'Análisis de ULTREON™ IA',
    icon: '🤖',
    status: 'completed',
  },
  {
    label: 'Strategy',
    description: 'Modificación de estrategia',
    icon: '📊',
    status: 'completed',
  },
  {
    label: 'PCI',
    description: 'Intervención coronaria percutánea',
    icon: '⚕️',
    status: 'completed',
  },
  {
    label: 'Post-OCT',
    description: 'Optimización OCT',
    icon: '🔍',
    status: 'completed',
  },
  {
    label: 'Follow-up',
    description: 'Seguimiento clínico',
    icon: '📈',
    status: 'pending',
  },
];

export default function ProceduralTimeline() {
  return (
    <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8">
      <div className="mb-6">
        <h2 className="text-base font-bold text-slate-50 mb-1">Timeline del Procedimiento</h2>
        <p className="text-xs text-slate-400">Recorrido desde evaluación inicial hasta seguimiento clínico</p>
      </div>

      {/* Desktop: Horizontal Timeline */}
      <div className="hidden sm:grid grid-cols-6 gap-2">
        {steps.map((step, idx) => (
          <div key={idx} className="flex flex-col items-center">
            {/* Step Circle */}
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all ${
                step.status === 'completed'
                  ? 'bg-cyan-950/60 border-cyan-700 text-cyan-400'
                  : step.status === 'current'
                    ? 'bg-yellow-950/60 border-yellow-700 text-yellow-400 ring-2 ring-yellow-500/30'
                    : 'bg-slate-850 border-slate-700 text-slate-500'
              }`}
            >
              {step.icon}
            </div>

            {/* Label and Description */}
            <div className="mt-3 text-center">
              <p className="text-xs font-bold text-slate-300">{step.label}</p>
              <p className="text-[9px] text-slate-500 mt-0.5 max-w-[90px]">{step.description}</p>
            </div>

            {/* Connector Line */}
            {idx < steps.length - 1 && (
              <div className="absolute w-2 h-0.5 bg-gradient-to-r from-cyan-500/50 to-cyan-500/20 mt-16" />
            )}
          </div>
        ))}
      </div>

      {/* Mobile: Vertical Timeline */}
      <div className="sm:hidden space-y-4">
        {steps.map((step, idx) => (
          <div key={idx} className="flex gap-4">
            {/* Vertical Line + Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold border-2 transition-all ${
                  step.status === 'completed'
                    ? 'bg-cyan-950/60 border-cyan-700 text-cyan-400'
                    : step.status === 'current'
                      ? 'bg-yellow-950/60 border-yellow-700 text-yellow-400'
                      : 'bg-slate-850 border-slate-700 text-slate-500'
                }`}
              >
                {step.icon}
              </div>
              {idx < steps.length - 1 && (
                <div className="w-0.5 h-12 bg-gradient-to-b from-cyan-500/30 to-transparent mt-2" />
              )}
            </div>

            {/* Content */}
            <div className="pt-1">
              <p className="text-sm font-bold text-slate-300">{step.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{step.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
