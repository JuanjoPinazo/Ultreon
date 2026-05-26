// app/registry/new/visuals/PostPciVisuals.tsx
import React from 'react';

// -----------------------------------------------------------------------------
// StentExpansionVisual
// -----------------------------------------------------------------------------
interface StentExpansionVisualProps {
  expansionPercent: number | '';
  isAdequate: 'yes' | 'no' | 'na' | '';
}

export function StentExpansionVisual({ expansionPercent, isAdequate }: StentExpansionVisualProps) {
  const percent = typeof expansionPercent === 'number' ? Math.min(expansionPercent, 120) : 0;
  const hasValue = typeof expansionPercent === 'number';
  const isOptimal = isAdequate === 'yes';

  // Base radius 35. At 100%, radius is 55. 
  const radius = 35 + (percent / 100) * 20;

  return (
    <div className={`relative transition-all duration-700 w-full h-full ${hasValue ? 'opacity-100 scale-100' : 'opacity-40 scale-95 grayscale'}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
        <defs>
          <filter id="expansionGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Vessel Target (EEL ideal) */}
        <circle cx="100" cy="100" r="55" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="4 4" />
        
        {/* Stent Mesh representation */}
        {hasValue && (
          <g>
            <circle 
              cx="100" 
              cy="100" 
              r={radius} 
              fill="none" 
              stroke={isOptimal ? '#10b981' : '#f59e0b'} 
              strokeWidth="4" 
              filter="url(#expansionGlow)"
              className="transition-all duration-1000 ease-out"
            />
            {/* Strut cross-sections */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
              const rad = (angle * Math.PI) / 180;
              const cx = 100 + radius * Math.cos(rad);
              const cy = 100 + radius * Math.sin(rad);
              return (
                <circle 
                  key={angle} 
                  cx={cx} 
                  cy={cy} 
                  r="3" 
                  fill={isOptimal ? '#34d399' : '#fbbf24'} 
                  className="transition-all duration-1000 ease-out" 
                />
              );
            })}
          </g>
        )}
      </svg>
      
      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-opacity duration-500 ${hasValue ? 'opacity-100' : 'opacity-0'}`}>
        <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded border uppercase tracking-widest shadow-lg ${isOptimal ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800/50 shadow-emerald-500/20' : 'text-amber-400 bg-amber-950/80 border-amber-800/50 shadow-amber-500/20'}`}>
          Expansión: {percent}%
        </span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// MalappositionVisual
// -----------------------------------------------------------------------------
interface MalappositionVisualProps {
  hasMalapposition: 'yes' | 'no' | 'na' | '';
  lengthMm: number | '';
}

export function MalappositionVisual({ hasMalapposition, lengthMm }: MalappositionVisualProps) {
  const isMalapposed = hasMalapposition === 'yes';
  const hasValue = hasMalapposition !== '';

  return (
    <div className={`relative transition-all duration-700 w-full h-full ${hasValue ? 'opacity-100 scale-100' : 'opacity-40 scale-95 grayscale'}`}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
        <defs>
          <filter id="malapposedGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Vessel wall */}
        <path d="M 20,80 Q 100,80 180,80" fill="none" stroke="#1e293b" strokeWidth="4" />
        <path d="M 20,120 Q 100,120 180,120" fill="none" stroke="#1e293b" strokeWidth="4" />

        {hasValue && (
          <g>
            {/* Stent Struts */}
            {[40, 70, 100, 130, 160].map((x, i) => {
              // Create a malapposed gap in the middle
              const gap = isMalapposed && i > 0 && i < 4 ? 15 : 0;
              const color = gap > 0 ? '#f43f5e' : '#22d3ee';
              
              return (
                <g key={x} className="transition-all duration-700 ease-in-out">
                  {/* Top strut */}
                  <circle cx={x} cy={80 + gap} r="4" fill={color} filter={gap > 0 ? "url(#malapposedGlow)" : ""} />
                  {gap > 0 && <line x1={x} y1="80" x2={x} y2={80 + gap} stroke="#f43f5e" strokeWidth="1" strokeDasharray="1 1" className="opacity-50 animate-pulse" />}
                  
                  {/* Bottom strut */}
                  <circle cx={x} cy={120 - gap} r="4" fill={color} filter={gap > 0 ? "url(#malapposedGlow)" : ""} />
                  {gap > 0 && <line x1={x} y1="120" x2={x} y2={120 - gap} stroke="#f43f5e" strokeWidth="1" strokeDasharray="1 1" className="opacity-50 animate-pulse" />}
                </g>
              );
            })}
          </g>
        )}
      </svg>
      
      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-opacity duration-500 ${hasValue ? 'opacity-100' : 'opacity-0'}`}>
        <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded border uppercase tracking-widest shadow-lg ${isMalapposed ? 'text-rose-400 bg-rose-950/80 border-rose-800/50 shadow-rose-500/20' : 'text-emerald-400 bg-emerald-950/80 border-emerald-800/50 shadow-emerald-500/20'}`}>
          {isMalapposed ? `Malaposición: ${lengthMm || '?'} mm` : 'Bien Adosado'}
        </span>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// EdgeDissectionVisual
// -----------------------------------------------------------------------------
interface EdgeDissectionVisualProps {
  hasProximal: boolean;
  hasDistal: boolean;
  hasFlap: boolean;
}

export function EdgeDissectionVisual({ hasProximal, hasDistal, hasFlap }: EdgeDissectionVisualProps) {
  const hasAny = hasProximal || hasDistal;

  return (
    <div className={`relative transition-all duration-700 w-full h-full opacity-100 scale-100`}>
      <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-xl">
        <defs>
          <filter id="dissectionGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Vessel Wall */}
        <path d="M 20,80 Q 100,80 180,80" fill="none" stroke="#1e293b" strokeWidth="4" />
        <path d="M 20,120 Q 100,120 180,120" fill="none" stroke="#1e293b" strokeWidth="4" />

        {/* Stent body */}
        <rect x="50" y="80" width="100" height="40" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2 4" className="opacity-50" />
        
        {/* Proximal Edge Marker */}
        <line x1="50" y1="60" x2="50" y2="140" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />
        <text x="50" y="50" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">Borde Prox</text>

        {/* Distal Edge Marker */}
        <line x1="150" y1="60" x2="150" y2="140" stroke="#475569" strokeWidth="1" strokeDasharray="4 4" />
        <text x="150" y="50" fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">Borde Distal</text>

        {/* Dissections */}
        {hasProximal && (
          <path d="M 45,80 Q 30,95 20,80" fill="none" stroke="#fbbf24" strokeWidth="3" filter="url(#dissectionGlow)" className="animate-pulse" />
        )}
        
        {hasDistal && (
          <path d="M 155,120 Q 170,105 180,120" fill="none" stroke="#fbbf24" strokeWidth="3" filter="url(#dissectionGlow)" className="animate-pulse" />
        )}

      </svg>
      
      <div className={`absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-opacity duration-500`}>
        <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded border uppercase tracking-widest shadow-lg ${hasAny ? (hasFlap ? 'text-rose-400 bg-rose-950/80 border-rose-800/50 shadow-rose-500/20' : 'text-amber-400 bg-amber-950/80 border-amber-800/50 shadow-amber-500/20') : 'text-emerald-400 bg-emerald-950/80 border-emerald-800/50 shadow-emerald-500/20'}`}>
          {hasAny ? (hasFlap ? 'Disección Mayor' : 'Disección Menor') : 'Bordes Intactos'}
        </span>
      </div>
    </div>
  );
}
