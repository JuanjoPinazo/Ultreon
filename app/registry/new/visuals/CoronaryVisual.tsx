// app/registry/new/visuals/CoronaryVisual.tsx
'use client';

import React, { useState } from 'react';

interface CoronaryVisualProps {
  selectedSegment: string;
  onSelectSegment: (segment: string) => void;
  projHorizDeg: number;
  projHorizDir: 'OAD' | 'OAI';
  projVertDeg: number;
  projVertDir: 'CRANEAL' | 'CAUDAL';
  projAxial: number;
  onUpdateProjections: (
    horizDeg: number,
    horizDir: 'OAD' | 'OAI',
    vertDeg: number,
    vertDir: 'CRANEAL' | 'CAUDAL',
    axial: number
  ) => void;
}

export default function CoronaryVisual({
  selectedSegment,
  onSelectSegment,
  projHorizDeg,
  projHorizDir,
  projVertDeg,
  projVertDir,
  projAxial,
  onUpdateProjections,
}: CoronaryVisualProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'3D' | 'FRONTAL' | 'LATERAL' | 'CAUDAL' | 'CRANEAL'>('3D');

  const isSelected = (label: string) => {
    return selectedSegment.toLowerCase() === label.toLowerCase();
  };

  const getStyleForSegment = (label: string, defaultWidth: number) => {
    const active = isSelected(label);
    return {
      stroke: active ? '#00E5FF' : '#334155',
      strokeWidth: active ? defaultWidth + 4 : defaultWidth,
      filter: active ? 'url(#cyanGlow)' : 'url(#softGlow)',
      cursor: 'pointer',
    };
  };

  const handleSegmentClick = (label: string) => {
    onSelectSegment(label);
  };

  // Convert projection angles to 3D rotation angles for CSS transforms
  const rotY = projHorizDir === 'OAD' ? projHorizDeg : -projHorizDeg;
  const rotX = projVertDir === 'CRANEAL' ? -projVertDeg : projVertDeg; // Craneal tilts forward, Caudal tilts backward
  const rotZ = projAxial;

  const heartTransformStyle = {
    transform: `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) rotateZ(${rotZ}deg)`,
    transition: 'transform 200ms ease-out',
  };

  // Handle Preset View Clicks
  const handleViewPreset = (view: '3D' | 'FRONTAL' | 'LATERAL' | 'CAUDAL' | 'CRANEAL') => {
    setActiveView(view);
    if (view === '3D') {
      onUpdateProjections(10, 'OAD', 20, 'CRANEAL', 0);
    } else if (view === 'FRONTAL') {
      onUpdateProjections(0, 'OAD', 0, 'CRANEAL', 0);
    } else if (view === 'LATERAL') {
      onUpdateProjections(90, 'OAD', 0, 'CRANEAL', 0);
    } else if (view === 'CAUDAL') {
      onUpdateProjections(0, 'OAD', 30, 'CAUDAL', 0);
    } else if (view === 'CRANEAL') {
      onUpdateProjections(0, 'OAD', 30, 'CRANEAL', 0);
    }
  };

  return (
    <div className="relative aspect-square w-full bg-slate-950/80 border border-[#1C2436] p-5 flex flex-col items-center justify-center overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(0,229,255,0.04)] select-none">
      
      {/* Background grids and gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:25px_25px] opacity-60" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-950/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-950/10 rounded-full blur-3xl" />

      {/* Floating interactive tooltip */}
      <div className="absolute bottom-[80px] right-5 z-20 bg-slate-950/90 border border-[#1C2436] backdrop-blur-md px-3 py-2 rounded-xl text-left pointer-events-none shadow-xl min-w-[140px]">
        <span className="text-[10px] font-bold text-[#00E5FF] font-mono block">
          {hoveredSegment || selectedSegment || 'Ningún segmento'}
        </span>
        <span className="text-[7px] font-mono font-bold text-[#9BA4B2] uppercase tracking-widest block mt-0.5">
          {selectedSegment ? 'Segmento seleccionado' : 'Sitúe el cursor o pulse'}
        </span>
      </div>

      {/* Arrastre para rotar indicator */}
      <div className="absolute bottom-[80px] left-5 z-20 flex flex-col items-center gap-1 opacity-50 pointer-events-none">
        <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
        <span className="text-[7px] font-mono font-bold text-[#9BA4B2] uppercase tracking-widest">
          Arrastre para rotar
        </span>
      </div>

      {/* Heart tree SVG viewer with live 3D CSS rotate transform */}
      <div 
        style={heartTransformStyle}
        className="w-full h-full p-2 relative z-10"
      >
        <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-2xl">
          <defs>
            <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur1" />
              <feGaussianBlur stdDeviation="8" result="blur2" />
              <feMerge>
                <feMergeNode in="blur2" />
                <feMergeNode in="blur1" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <radialGradient id="heartGradient" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#0f172a" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#020617" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#000000" stopOpacity="1" />
            </radialGradient>
          </defs>

          {/* Glowing Silhouette */}
          <path
            d="M 120,45 C 95,15 45,25 45,75 C 45,120 100,165 120,205 C 140,165 195,120 195,75 C 195,25 145,15 120,45 Z"
            fill="url(#heartGradient)"
            stroke="#1c2436"
            strokeWidth="2.5"
            className="opacity-70"
          />

          {/* ── RCA TREE ── */}
          <g>
            <path 
              d="M 105,50 Q 95,51 90,53" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('RCA - Ostial', 7)}
              onClick={() => handleSegmentClick('RCA - Ostial')}
              onMouseEnter={() => setHoveredSegment('RCA - Ostial')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 90,53 Q 65,59 55,85" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('RCA - Proximal', 6)}
              onClick={() => handleSegmentClick('RCA - Proximal')}
              onMouseEnter={() => setHoveredSegment('RCA - Proximal')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 55,85 Q 46,120 50,150" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('RCA - Mid', 5)}
              onClick={() => handleSegmentClick('RCA - Mid')}
              onMouseEnter={() => setHoveredSegment('RCA - Mid')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 50,150 T 70,195 T 115,215" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('RCA - Distal', 4)}
              onClick={() => handleSegmentClick('RCA - Distal')}
              onMouseEnter={() => setHoveredSegment('RCA - Distal')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 115,215 Q 119,230 116,238" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('RCA - PDA', 3)}
              onClick={() => handleSegmentClick('RCA - PDA')}
              onMouseEnter={() => setHoveredSegment('RCA - PDA')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 115,215 Q 130,222 140,218" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('RCA - PL', 3)}
              onClick={() => handleSegmentClick('RCA - PL')}
              onMouseEnter={() => setHoveredSegment('RCA - PL')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          </g>

          {/* ── LEFT MAIN (LM) ── */}
          <g>
            <path 
              d="M 135,50 L 142,52" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('Left Main - Ostial', 8.5)}
              onClick={() => handleSegmentClick('Left Main - Ostial')}
              onMouseEnter={() => setHoveredSegment('Left Main - Ostial')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 142,52 L 150,55" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('Left Main - Body', 8)}
              onClick={() => handleSegmentClick('Left Main - Body')}
              onMouseEnter={() => setHoveredSegment('Left Main - Body')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 150,55 L 160,58" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('Left Main - Distal', 7.5)}
              onClick={() => handleSegmentClick('Left Main - Distal')}
              onMouseEnter={() => setHoveredSegment('Left Main - Distal')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          </g>

          {/* ── LAD & DIAGONALS ── */}
          <g>
            <path 
              d="M 160,58 Q 158,68 156,76" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('LAD - Ostial', 5.5)}
              onClick={() => handleSegmentClick('LAD - Ostial')}
              onMouseEnter={() => setHoveredSegment('LAD - Ostial')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 156,76 Q 152,100 148,122" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('LAD - Proximal', 5)}
              onClick={() => handleSegmentClick('LAD - Proximal')}
              onMouseEnter={() => setHoveredSegment('LAD - Proximal')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 148,122 Q 140,155 133,175" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('LAD - Mid', 4)}
              onClick={() => handleSegmentClick('LAD - Mid')}
              onMouseEnter={() => setHoveredSegment('LAD - Mid')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 133,175 Q 138,205 142,225" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('LAD - Distal', 3)}
              onClick={() => handleSegmentClick('LAD - Distal')}
              onMouseEnter={() => setHoveredSegment('LAD - Distal')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 154,90 Q 172,106 182,120" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('Diagonal - D1', 2.8)}
              onClick={() => handleSegmentClick('Diagonal - D1')}
              onMouseEnter={() => setHoveredSegment('Diagonal - D1')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 146,138 Q 163,155 168,170" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('Diagonal - D2', 2.2)}
              onClick={() => handleSegmentClick('Diagonal - D2')}
              onMouseEnter={() => setHoveredSegment('Diagonal - D2')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 137,172 Q 150,188 153,198" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('Diagonal - D3', 1.8)}
              onClick={() => handleSegmentClick('Diagonal - D3')}
              onMouseEnter={() => setHoveredSegment('Diagonal - D3')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          </g>

          {/* ── LCX & OM ── */}
          <g>
            <path 
              d="M 160,58 Q 170,61 176,65" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('LCX - Ostial', 5.5)}
              onClick={() => handleSegmentClick('LCX - Ostial')}
              onMouseEnter={() => setHoveredSegment('LCX - Ostial')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 176,65 Q 192,76 198,100" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('LCX - Proximal', 5)}
              onClick={() => handleSegmentClick('LCX - Proximal')}
              onMouseEnter={() => setHoveredSegment('LCX - Proximal')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 198,100 Q 205,125 192,175" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('LCX - Distal', 4)}
              onClick={() => handleSegmentClick('LCX - Distal')}
              onMouseEnter={() => setHoveredSegment('LCX - Distal')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 188,82 Q 206,92 216,108" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('OM - OM1', 3)}
              onClick={() => handleSegmentClick('OM - OM1')}
              onMouseEnter={() => setHoveredSegment('OM - OM1')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 200,115 Q 218,126 225,142" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('OM - OM2', 2.5)}
              onClick={() => handleSegmentClick('OM - OM2')}
              onMouseEnter={() => setHoveredSegment('OM - OM2')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
            <path 
              d="M 196,142 Q 210,153 216,168" 
              fill="none" 
              strokeLinecap="round"
              style={getStyleForSegment('OM - OM3', 2)}
              onClick={() => handleSegmentClick('OM - OM3')}
              onMouseEnter={() => setHoveredSegment('OM - OM3')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          </g>

          {/* Anatomical main branch tags */}
          <text x="28" y="55" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="monospace" className="pointer-events-none">CD</text>
          <text x="133" y="32" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="monospace" className="pointer-events-none">TCI</text>
          <text x="110" y="145" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="monospace" className="pointer-events-none">DA</text>
          <text x="210" y="70" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="monospace" className="pointer-events-none">CX</text>
        </svg>
      </div>

      {/* 3D view mode selector buttons footer */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between gap-1.5 z-20 pointer-events-auto">
        {(['3D', 'FRONTAL', 'LATERAL', 'CAUDAL', 'CRANEAL'] as const).map((view) => (
          <button
            key={view}
            type="button"
            onClick={() => handleViewPreset(view)}
            className={`flex-1 py-1 rounded-lg text-[8px] font-mono font-bold border transition-all ${
              activeView === view
                ? 'bg-cyan-950/60 border-[#00E5FF]/50 text-[#00E5FF]'
                : 'bg-slate-900/60 border-[#1C2436] text-slate-500 hover:text-slate-400'
            }`}
          >
            VISTA {view}
          </button>
        ))}
      </div>

    </div>
  );
}
