// app/registry/new/visuals/FinalResultVisual.tsx
import React, { useEffect, useState } from 'react';

interface FinalResultVisualProps {
  score: number;
  category: string;
  categoryLabel: string;
  zeroContrast: boolean;
  hospitalName: string;
  patientId: string;
}

export default function FinalResultVisual({ 
  score, 
  category, 
  categoryLabel, 
  zeroContrast, 
  hospitalName, 
  patientId 
}: FinalResultVisualProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const duration = 2000;
    const increment = score / (duration / 16); // ~60fps
    
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(start));
      }
    }, 16);

    return () => clearInterval(timer);
  }, [score]);

  // Determine color based on score category
  const getColorClasses = () => {
    switch(category) {
      case 'OPTIMAL': return { text: 'text-cyan-400', stroke: '#22d3ee', glow: 'shadow-[0_0_80px_rgba(34,211,238,0.25)]', bg: 'bg-cyan-950/40' };
      case 'SUBOPTIMAL_MILD': return { text: 'text-emerald-400', stroke: '#10b981', glow: 'shadow-[0_0_80px_rgba(16,185,129,0.25)]', bg: 'bg-emerald-950/40' };
      case 'SUBOPTIMAL_MODERATE': return { text: 'text-amber-400', stroke: '#fbbf24', glow: 'shadow-[0_0_80px_rgba(251,191,36,0.25)]', bg: 'bg-amber-950/40' };
      case 'HIGH_RISK': return { text: 'text-rose-400', stroke: '#f43f5e', glow: 'shadow-[0_0_80px_rgba(244,63,94,0.25)]', bg: 'bg-rose-950/40' };
      default: return { text: 'text-slate-400', stroke: '#94a3b8', glow: '', bg: 'bg-slate-900/40' };
    }
  };

  const colors = getColorClasses();
  
  // Calculate SVG circle properties for the score ring
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="w-full flex flex-col items-center py-8">
      {/* Central Visual: Animated Score Ring */}
      <div className={`relative w-72 h-72 rounded-full flex flex-col items-center justify-center mb-12 ${colors.glow} transition-all duration-1000`}>
        {/* Background glow layers */}
        <div className="absolute inset-0 bg-slate-950 rounded-full" />
        <div className={`absolute inset-2 rounded-full ${colors.bg} opacity-50 blur-xl`} />
        
        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
          <defs>
            <filter id="scoreGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          
          {/* Background track */}
          <circle 
            cx="144" cy="144" r={radius} 
            fill="none" stroke="#1e293b" strokeWidth="8" 
          />
          
          {/* Animated progress ring */}
          <circle 
            cx="144" cy="144" r={radius} 
            fill="none" stroke={colors.stroke} strokeWidth="12" 
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            filter="url(#scoreGlow)"
            className="transition-all duration-100 ease-out"
          />
        </svg>
        
        {/* Content inside ring */}
        <div className="relative z-10 flex flex-col items-center">
          <span className="text-[10px] font-black font-mono tracking-[0.3em] text-slate-500 uppercase mb-2">SCORE OPSTAR</span>
          <div className="flex items-baseline gap-1">
            <span className={`text-7xl font-black tracking-tighter ${colors.text}`}>{animatedScore}</span>
            <span className="text-xl font-bold text-slate-600">/100</span>
          </div>
          <span className={`mt-2 px-4 py-1 rounded-full text-xs font-bold font-mono tracking-wider border uppercase ${colors.text} ${colors.bg} border-current opacity-80`}>
            {categoryLabel}
          </span>
        </div>
      </div>

      {/* Case Details Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
        
        {/* Zero Contrast Card */}
        <div className={`p-5 rounded-2xl border flex flex-col gap-2 ${zeroContrast ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-slate-900/50 border-slate-800'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${zeroContrast ? 'bg-emerald-950 border border-emerald-800/50 text-emerald-400' : 'bg-slate-950 border border-slate-800 text-slate-500'}`}>
              💧
            </div>
            <div>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Protocolo</div>
              <div className={`text-sm font-bold ${zeroContrast ? 'text-emerald-400' : 'text-slate-300'}`}>Sin Contraste</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono">
            {zeroContrast ? '✓ Completado (0 mL)' : 'Contraste estándar utilizado'}
          </div>
        </div>

        {/* Center Card */}
        <div className="p-5 rounded-2xl border bg-slate-900/50 border-slate-800 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Centro</div>
              <div className="text-sm font-bold text-slate-200 truncate max-w-[120px]">{hospitalName || 'Local'}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono">
            Sincronizado con BD
          </div>
        </div>

        {/* Patient Card */}
        <div className="p-5 rounded-2xl border bg-slate-900/50 border-slate-800 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-950 border border-violet-800/50 flex items-center justify-center text-violet-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">ID de Sujeto</div>
              <div className="text-sm font-bold text-slate-200">{patientId || 'Pendiente'}</div>
            </div>
          </div>
          <div className="mt-2 text-xs text-slate-400 font-mono">
            Anonimizado para investigación (RGPD)
          </div>
        </div>

      </div>

    </div>
  );
}
