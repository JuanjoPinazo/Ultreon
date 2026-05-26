// app/registry/new/visuals/ProceduralTimeline.tsx
import React from 'react';

interface ProceduralTimelineProps {
  currentStep: number;
}

const STEPS = [
  {
    id: 1,
    title: 'PRE-ICP',
    subtitle: 'Mapeo Coronario',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    color: 'cyan',
  },
  {
    id: 2,
    title: 'ANÁLISIS IA',
    subtitle: 'Placa y FFR-OCT',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    color: 'violet',
  },
  {
    id: 3,
    title: 'OPTIMIZACIÓN ICP',
    subtitle: 'Tríada ULTREON™',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'emerald',
  },
  {
    id: 4,
    title: 'RESULTADO FINAL',
    subtitle: 'Score y Sin Contraste',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    color: 'sky',
  },
];

const colorClasses: Record<string, { activeIcon: string; completedLine: string; activeGlow: string }> = {
  cyan: { activeIcon: 'text-cyan-400 bg-cyan-950/80 border-cyan-500/50', completedLine: 'bg-cyan-500/50', activeGlow: 'shadow-[0_0_15px_rgba(34,211,238,0.4)]' },
  violet: { activeIcon: 'text-violet-400 bg-violet-950/80 border-violet-500/50', completedLine: 'bg-violet-500/50', activeGlow: 'shadow-[0_0_15px_rgba(139,92,246,0.4)]' },
  emerald: { activeIcon: 'text-emerald-400 bg-emerald-950/80 border-emerald-500/50', completedLine: 'bg-emerald-500/50', activeGlow: 'shadow-[0_0_15px_rgba(16,185,129,0.4)]' },
  sky: { activeIcon: 'text-sky-400 bg-sky-950/80 border-sky-500/50', completedLine: 'bg-sky-500/50', activeGlow: 'shadow-[0_0_15px_rgba(56,189,248,0.4)]' },
};

export default function ProceduralTimeline({ currentStep }: ProceduralTimelineProps) {
  return (
    <div className="w-full bg-slate-950/50 border-b border-slate-800/80 overflow-x-auto">
      <div className="min-w-[600px] max-w-4xl mx-auto px-6 py-5 flex items-center justify-between relative">
        {/* Background connecting line */}
        <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-slate-800 -translate-y-1/2 z-0" />

        {STEPS.map((step, idx) => {
          const isCompleted = currentStep > step.id;
          const isActive = currentStep === step.id;
          const isPending = currentStep < step.id;
          const c = colorClasses[step.color];

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              {/* Animated Progress Line between nodes */}
              {idx > 0 && (
                <div className="absolute top-5 right-1/2 w-[calc(100%+3rem)] h-0.5 -z-10" style={{ transform: 'translateX(-1.5rem)' }}>
                   <div className={`h-full transition-all duration-700 ease-in-out ${isCompleted || isActive ? colorClasses[STEPS[idx-1].color].completedLine : 'bg-transparent'}`} style={{ width: isCompleted || isActive ? '100%' : '0%' }} />
                </div>
              )}

              {/* Icon Container */}
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all duration-500 ${
                  isActive
                    ? `${c.activeIcon} ${c.activeGlow} scale-110`
                    : isCompleted
                    ? 'bg-slate-900 border-slate-700 text-slate-300'
                    : 'bg-slate-950 border-slate-800 text-slate-600'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step.icon
                )}
                
                {/* Active pulse dot */}
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                  </span>
                )}
              </div>

              {/* Text */}
              <div className="mt-3 flex flex-col items-center text-center">
                <span className={`text-[10px] font-black font-mono tracking-widest uppercase transition-colors ${isActive ? 'text-slate-100' : isCompleted ? 'text-slate-400' : 'text-slate-600'}`}>
                  {step.title}
                </span>
                <span className={`text-[9px] mt-0.5 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {step.subtitle}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
