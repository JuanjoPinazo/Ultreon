// app/registry/new/visuals/CoronaryVisual.tsx
import React from 'react';

interface CoronaryVisualProps {
  selectedVessel: string;
}

export default function CoronaryVisual({ selectedVessel }: CoronaryVisualProps) {
  return (
    <div className="relative w-full aspect-square max-w-sm mx-auto bg-slate-950 rounded-3xl border border-slate-800 p-6 flex flex-col items-center justify-center overflow-hidden shadow-[inset_0_0_80px_rgba(0,0,0,0.8)]">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900/50 via-slate-950/80 to-slate-950" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-900/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-900/10 rounded-full blur-3xl" />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />

      <svg viewBox="0 0 240 240" className="w-full h-full relative z-10 drop-shadow-2xl">
        <defs>
          <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur1" />
            <feGaussianBlur stdDeviation="12" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Anatomical background guide (Aorta root) */}
        <circle cx="120" cy="120" r="100" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="4 8" />
        <path d="M 105,40 Q 120,25 135,40 Q 120,60 105,40" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />

        {/* RCA (Right Coronary Artery) */}
        <g className="transition-all duration-500">
          <path 
            d="M 108,45 Q 60,60 50,110 T 75,180 T 120,210" 
            fill="none" 
            stroke={selectedVessel === 'RCA' ? '#22d3ee' : '#334155'} 
            strokeWidth={selectedVessel === 'RCA' ? '8' : '4'} 
            strokeLinecap="round"
            filter={selectedVessel === 'RCA' ? 'url(#cyanGlow)' : 'url(#softGlow)'}
            className="transition-all duration-500"
          />
          {selectedVessel === 'RCA' && (
            <>
              {/* Highlight inner core */}
              <path d="M 108,45 Q 60,60 50,110 T 75,180 T 120,210" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" className="opacity-80" />
              {/* Pulse circle at start */}
              <circle cx="108" cy="45" r="4" fill="#22d3ee" className="animate-pulse" />
              {/* Overlay lines */}
              <text x="35" y="83" fill="#22d3ee" fontSize="6" fontFamily="monospace" textAnchor="end" className="opacity-70">RCA Proximal</text>
            </>
          )}
        </g>

        {/* TCI (Left Main) */}
        <g className="transition-all duration-500">
          <path 
            d="M 130,45 Q 150,55 160,65" 
            fill="none" 
            stroke={selectedVessel === 'TCI' ? '#22d3ee' : '#334155'} 
            strokeWidth={selectedVessel === 'TCI' ? '12' : '7'} 
            strokeLinecap="round"
            filter={selectedVessel === 'TCI' ? 'url(#cyanGlow)' : 'url(#softGlow)'}
            className="transition-all duration-500"
          />
          {selectedVessel === 'TCI' && (
            <>
              <path d="M 130,45 Q 150,55 160,65" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" className="opacity-80" />
              <circle cx="145" cy="55" r="5" fill="#22d3ee" className="animate-pulse" />
              <text x="145" y="25" fill="#22d3ee" fontSize="6" fontFamily="monospace" textAnchor="middle" className="opacity-70">TCI Diám: 4.5mm</text>
            </>
          )}
        </g>

        {/* LAD (Left Anterior Descending) */}
        <g className="transition-all duration-500">
          <path 
            d="M 160,65 Q 155,110 135,160 T 145,215" 
            fill="none" 
            stroke={selectedVessel === 'LAD' ? '#22d3ee' : '#334155'} 
            strokeWidth={selectedVessel === 'LAD' ? '7' : '3.5'} 
            strokeLinecap="round"
            filter={selectedVessel === 'LAD' ? 'url(#cyanGlow)' : 'url(#softGlow)'}
            className="transition-all duration-500"
          />
          {/* Diagonals */}
          <path d="M 148,100 Q 170,120 180,140" fill="none" stroke={selectedVessel === 'LAD' ? '#0891b2' : '#1e293b'} strokeWidth="2" strokeLinecap="round" className="transition-all duration-500" />
          <path d="M 140,140 Q 160,160 165,180" fill="none" stroke={selectedVessel === 'LAD' ? '#0891b2' : '#1e293b'} strokeWidth="1.5" strokeLinecap="round" className="transition-all duration-500" />
          
          {selectedVessel === 'LAD' && (
            <>
              <path d="M 160,65 Q 155,110 135,160 T 145,215" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" className="opacity-80" />
              <circle cx="160" cy="65" r="4" fill="#22d3ee" className="animate-pulse" />
              <text x="205" y="142" fill="#22d3ee" fontSize="6" fontFamily="monospace" className="opacity-70">Rama D1</text>
            </>
          )}
        </g>

        {/* LCx (Left Circumflex) */}
        <g className="transition-all duration-500">
          <path 
            d="M 160,65 Q 195,80 205,125 T 190,190" 
            fill="none" 
            stroke={selectedVessel === 'LCx' ? '#22d3ee' : '#334155'} 
            strokeWidth={selectedVessel === 'LCx' ? '7' : '3.5'} 
            strokeLinecap="round"
            filter={selectedVessel === 'LCx' ? 'url(#cyanGlow)' : 'url(#softGlow)'}
            className="transition-all duration-500"
          />
          {/* Obtuse Marginals */}
          <path d="M 188,95 Q 210,105 220,130" fill="none" stroke={selectedVessel === 'LCx' ? '#0891b2' : '#1e293b'} strokeWidth="2" strokeLinecap="round" className="transition-all duration-500" />
          
          {selectedVessel === 'LCx' && (
            <>
              <path d="M 160,65 Q 195,80 205,125 T 190,190" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" className="opacity-80" />
              <circle cx="160" cy="65" r="4" fill="#22d3ee" className="animate-pulse" />
              <path d="M 220,130 L 220,150" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2 2" className="opacity-50" />
              <text x="220" y="158" fill="#22d3ee" fontSize="6" fontFamily="monospace" textAnchor="middle" className="opacity-70">OM1</text>
            </>
          )}
        </g>

        {/* Base Labels (always visible but dimmed if not selected) */}
        <text x="40" y="45" fill={selectedVessel === 'RCA' ? '#22d3ee' : '#475569'} fontSize="10" fontWeight="bold" fontFamily="monospace" className="transition-colors">RCA</text>
        <text x="125" y="30" fill={selectedVessel === 'TCI' ? '#22d3ee' : '#475569'} fontSize="10" fontWeight="bold" fontFamily="monospace" className="transition-colors">TCI</text>
        <text x="110" y="165" fill={selectedVessel === 'LAD' ? '#22d3ee' : '#475569'} fontSize="10" fontWeight="bold" fontFamily="monospace" className="transition-colors">LAD</text>
        <text x="210" y="105" fill={selectedVessel === 'LCx' ? '#22d3ee' : '#475569'} fontSize="10" fontWeight="bold" fontFamily="monospace" className="transition-colors">LCx</text>
      </svg>
      
      {/* UI Overlay */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
        <div className="bg-slate-950/80 border border-slate-800 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${selectedVessel ? 'bg-cyan-500 animate-pulse' : 'bg-slate-700'}`} />
          <span className="text-[10px] font-mono font-bold text-slate-300">
            {selectedVessel ? `MAPEO: ${selectedVessel}` : 'ESPERANDO SELECCIÓN'}
          </span>
        </div>
        <div className="w-8 h-8 rounded-full border border-slate-800 bg-slate-900 flex items-center justify-center text-slate-600">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}
