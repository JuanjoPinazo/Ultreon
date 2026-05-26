// app/registry/new/visuals/PrePciVisuals.tsx
import React from 'react';

// -----------------------------------------------------------------------------
// CalciumOverlayVisual
// -----------------------------------------------------------------------------
interface CalciumOverlayVisualProps {
  isActive: boolean;
}

export function CalciumOverlayVisual({ isActive }: CalciumOverlayVisualProps) {
  return (
    <div className={`relative transition-all duration-700 w-full h-full ${isActive ? 'opacity-100 scale-100' : 'opacity-40 scale-95 grayscale'}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
        <defs>
          <filter id="calciumGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="4" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Vessel outline */}
        <circle cx="100" cy="100" r="70" fill="none" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
        
        {/* Lumen */}
        <circle cx="100" cy="100" r="45" fill="#0f172a" stroke="#334155" strokeWidth="1" />

        {/* Calcium Arc (>180 degrees) */}
        {isActive && (
          <g>
            <path 
              d="M 145,100 A 45,45 0 1,0 68,131" 
              fill="none" 
              stroke="#fbbf24" 
              strokeWidth="12" 
              strokeLinecap="round" 
              filter="url(#calciumGlow)"
              className="opacity-90 animate-pulse"
            />
            <path 
              d="M 145,100 A 45,45 0 1,0 68,131" 
              fill="none" 
              stroke="#fffbeb" 
              strokeWidth="4" 
              strokeLinecap="round" 
            />
          </g>
        )}
      </svg>
      
      {/* Overlay label */}
      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-[10px] font-black font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800/50 uppercase tracking-widest shadow-[0_0_10px_rgba(251,191,36,0.3)]">
          Arco de Calcio {'>'} 180°
        </span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// LipidArcVisual
// -----------------------------------------------------------------------------
interface LipidArcVisualProps {
  isActive: boolean;
  arcValue: number | '';
}

export function LipidArcVisual({ isActive, arcValue }: LipidArcVisualProps) {
  // Simple visualization: larger arc value = larger red stroke
  const strokeDash = arcValue ? Math.min((arcValue / 360) * 280, 280) : 0;

  return (
    <div className={`relative transition-all duration-700 w-full h-full ${isActive ? 'opacity-100 scale-100' : 'opacity-40 scale-95 grayscale'}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
        <defs>
          <filter id="lipidGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur1" />
            <feGaussianBlur stdDeviation="4" result="blur2" />
            <feMerge>
              <feMergeNode in="blur1" />
              <feMergeNode in="blur2" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {/* Vessel outline */}
        <circle cx="100" cy="100" r="70" fill="none" stroke="#1e293b" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="100" cy="100" r="45" fill="#0f172a" stroke="#334155" strokeWidth="1" />

        {/* Lipid Core */}
        {isActive && (
          <g transform="rotate(-90 100 100)">
            <circle 
              cx="100" 
              cy="100" 
              r="55" 
              fill="none" 
              stroke="#f43f5e" 
              strokeWidth="18" 
              strokeDasharray={`${strokeDash} 280`} 
              strokeLinecap="round"
              filter="url(#lipidGlow)"
              className="opacity-80 transition-all duration-1000 ease-out"
            />
          </g>
        )}
      </svg>

      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-opacity duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-[10px] font-black font-mono text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/50 uppercase tracking-widest shadow-[0_0_10px_rgba(244,63,94,0.3)]">
          Arco Lipídico: {arcValue || 0}°
        </span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// FFROCTVisual
// -----------------------------------------------------------------------------
interface FFROCTVisualProps {
  ffrValue: number | '';
}

export function FFROCTVisual({ ffrValue }: FFROCTVisualProps) {
  const isIschemic = typeof ffrValue === 'number' && ffrValue <= 0.80;
  const hasValue = typeof ffrValue === 'number';

  return (
    <div className={`relative transition-all duration-700 w-full h-full ${hasValue ? 'opacity-100' : 'opacity-40 grayscale'}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
        <defs>
          <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isIschemic ? "#f43f5e" : "#22d3ee"} stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.2" />
          </linearGradient>
          <filter id="ffrGlow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Vessel pipe */}
        <path d="M 20,80 Q 100,70 180,80 L 180,120 Q 100,130 20,120 Z" fill="#0f172a" stroke="#1e293b" strokeWidth="2" />
        
        {hasValue && (
          <g>
            {/* Flow representation */}
            <path d="M 25,90 Q 100,85 175,90 L 175,110 Q 100,115 25,110 Z" fill="url(#flowGrad)" filter="url(#ffrGlow)" className="animate-pulse" />
            
            {/* Pressure markers */}
            <line x1="50" y1="65" x2="50" y2="135" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
            <text x="50" y="60" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">Pa</text>
            
            <line x1="150" y1="65" x2="150" y2="135" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />
            <text x="150" y="60" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">Pd</text>
          </g>
        )}
      </svg>

      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-opacity duration-500 ${hasValue ? 'opacity-100' : 'opacity-0'}`}>
        <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded border uppercase tracking-widest shadow-lg ${isIschemic ? 'text-rose-400 bg-rose-950/80 border-rose-800/50 shadow-rose-500/20' : 'text-cyan-400 bg-cyan-950/80 border-cyan-800/50 shadow-cyan-500/20'}`}>
          FFR-OCT: {ffrValue} {isIschemic ? '(Isquémico)' : '(Normal)'}
        </span>
      </div>
    </div>
  );
}
