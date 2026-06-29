'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CORONARY_SEGMENTS, Segment } from './coronarySegments';
import { CORONARY_GEOMETRY, AORTIC_ROOT_PATH } from './coronaryGeometry';
import { CoronarySegmentPath } from './CoronarySegmentPath';
import { SegmentSidebar } from './SegmentSidebar';
import { SelectedSegmentCard } from './SelectedSegmentCard';

export type CoronaryTreeNavigatorProps = {
  selectedSegmentId?: string | null;
  onSelectSegment: (segmentId: string) => void;
  readonly?: boolean;
  className?: string;
  showSidebar?: boolean;
};

export function CoronaryTreeNavigator({
  selectedSegmentId,
  onSelectSegment,
  readonly = false,
  className = '',
  showSidebar = true,
}: CoronaryTreeNavigatorProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const selectedSegment = CORONARY_SEGMENTS.find(s => s.id === selectedSegmentId) || null;
  const activeSegment = hoveredSegment ? CORONARY_SEGMENTS.find(s => s.id === hoveredSegment) : selectedSegment;

  return (
    <div className={`flex w-full h-full rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl relative ${className}`}>
      
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.03)_0%,rgba(15,23,42,1)_70%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-50" />
      
      {/* Main SVG Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative p-6">
        
        {/* Floating status / active segment label at the top */}
        <div className="absolute top-6 left-6 flex items-center gap-2 z-10 pointer-events-none">
          {activeSegment ? (
            <div className="animate-fade-in flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-cyan-500/30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-cyan-400">{activeSegment.label}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                Interacciona con el modelo para seleccionar
              </span>
            </div>
          )}
        </div>

        {/* SVG Container */}
        <div className="w-full max-w-[500px] aspect-square relative z-0">
          <svg
            ref={svgRef}
            viewBox="0 0 800 800"
            className="w-full h-full drop-shadow-2xl"
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <defs>
              {/* Optional: Define gradients or glow filters here if needed for deeper customization */}
              <filter id="aorta-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Aortic Root Reference (Subtle) */}
            <path
              d={AORTIC_ROOT_PATH}
              fill="rgba(51, 65, 85, 0.2)"
              stroke="rgba(71, 85, 105, 0.4)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="pointer-events-none"
            />
            
            {/* Render all coronary segments */}
            {CORONARY_SEGMENTS.map(segment => {
              const pathData = CORONARY_GEOMETRY[segment.id];
              if (!pathData) return null;

              return (
                <g 
                  key={segment.id}
                  onMouseEnter={() => setHoveredSegment(segment.id)}
                  onMouseLeave={() => setHoveredSegment(null)}
                >
                  <CoronarySegmentPath
                    segment={segment}
                    pathData={pathData}
                    isSelected={selectedSegmentId === segment.id}
                    onSelect={(id) => {
                      if (!readonly) onSelectSegment(id);
                    }}
                    showLabels={false}
                  />
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Segment Info Card */}
        <div className="absolute bottom-6 left-6 right-6 lg:right-auto lg:w-[400px] z-10">
          <SelectedSegmentCard segment={selectedSegment} />
        </div>
      </div>

      {/* Optional Sidebar */}
      {showSidebar && !readonly && (
        <SegmentSidebar 
          selectedSegmentId={selectedSegmentId || null}
          onSelectSegment={onSelectSegment}
        />
      )}
    </div>
  );
}
