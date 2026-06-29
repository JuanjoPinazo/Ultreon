// components/CoronaryTreeNavigator/CoronaryTreeNavigator.tsx
'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Segment,
  Projection,
  CoronaryTreeNavigatorProps,
  SEGMENT_NAMES,
  SEGMENT_TO_SYSTEM,
} from './types';
import { CORONARY_GEOMETRY, getSegmentVisuals, SVG_FILTER_DEFS, CORONARY_LABELS } from './coronaryGeometry';

/**
 * CoronaryTreeNavigator — Premium Medical Edition
 *
 * Professional, anatomically realistic interactive coronary artery selector.
 * Realistic bezier curves, natural anatomy, premium medical aesthetic.
 *
 * Features:
 * - Anatomically realistic curves (bezier smoothness)
 * - Direct segment interaction (large clickable areas)
 * - Smooth animations with cyan glow
 * - Zoom/pan/reset navigation
 * - Premium dark/cyan aesthetic (ULTREON/Philips/Abbott quality)
 * - Larger canvas for legibility (viewBox 600x800)
 * - Professional labels (16px minimum)
 */

export default function CoronaryTreeNavigator({
  selectedSegment = null,
  onSelectSegment,
  projection = 'Frontal',
  readonly = false,
  showLabels = true,
  animationEnabled = true,
}: CoronaryTreeNavigatorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [hoveredSegment, setHoveredSegment] = useState<Segment | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.08 : 0.08;
    const newZoom = Math.max(0.6, Math.min(2.5, zoom + delta));
    setZoom(newZoom);
  };

  // Pan with drag (but not on paths)
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    const target = e.target as SVGElement;
    if (target.tagName === 'path' || target.tagName === 'text') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Select segment
  const handleSegmentClick = (segment: Segment) => {
    if (readonly) return;
    onSelectSegment?.(segment);
  };

  // Reset zoom/pan
  const handleDoubleClick = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const isSelected = (seg: Segment) => seg === selectedSegment;
  const isHovered = (seg: Segment) => seg === hoveredSegment;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex flex-col bg-slate-950 rounded-2xl border border-slate-900 overflow-hidden select-none group"
    >
      {/* Premium background */}
      <div className="absolute inset-0 bg-slate-950">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/8 via-transparent to-cyan-950/12 pointer-events-none" />
      </div>

      {/* SVG Coronary Tree */}
      <svg
        ref={svgRef}
        viewBox="0 0 600 800"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full cursor-grab active:cursor-grabbing relative z-10"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center',
          transition: isDragging ? 'none' : 'transform 200ms ease-out',
        }}
      >
        {/* SVG Filters and gradients */}
        <g dangerouslySetInnerHTML={{ __html: SVG_FILTER_DEFS }} />

        {/* Background patterns */}
        <rect width="600" height="800" fill="url(#coronaryGridBg)" opacity="0.4" />
        <rect width="600" height="800" fill="url(#depthGrad)" opacity="0.5" />

        {/* Render all coronary segments */}
        {Object.entries(CORONARY_GEOMETRY).map(([segId, geometry]) => {
          const segment = segId as Segment;
          const selected = isSelected(segment);
          const hovered = isHovered(segment);
          const visuals = getSegmentVisuals(
            geometry.baseStrokeWidth,
            selected,
            hovered,
            false
          );

          return (
            <motion.path
              key={segment}
              d={geometry.path}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              stroke={visuals.stroke}
              strokeWidth={visuals.strokeWidth}
              opacity={visuals.opacity}
              filter={visuals.filter}
              className={readonly ? 'cursor-default' : 'cursor-pointer transition-all'}
              onClick={() => handleSegmentClick(segment)}
              onMouseEnter={() => !readonly && setHoveredSegment(segment)}
              onMouseLeave={() => setHoveredSegment(null)}
              animate={{
                stroke: visuals.stroke,
                strokeWidth: visuals.strokeWidth,
                opacity: visuals.opacity,
              }}
              transition={animationEnabled ? { duration: 0.2 } : { duration: 0 }}
            />
          );
        })}

        {/* Coronary system labels (large, legible) */}
        {showLabels && (
          <>
            {/* TCI Label */}
            <text
              x={CORONARY_LABELS.LM.x}
              y={CORONARY_LABELS.LM.y}
              fontSize={CORONARY_LABELS.LM.size}
              fontWeight="bold"
              fontFamily="monospace"
              fill="#94a3b8"
              textAnchor="middle"
              className="pointer-events-none opacity-60 select-none"
            >
              {CORONARY_LABELS.LM.text}
            </text>

            {/* DA Label */}
            <text
              x={CORONARY_LABELS.LAD.x}
              y={CORONARY_LABELS.LAD.y}
              fontSize={CORONARY_LABELS.LAD.size}
              fontWeight="bold"
              fontFamily="monospace"
              fill="#94a3b8"
              textAnchor="middle"
              className="pointer-events-none opacity-60 select-none"
            >
              {CORONARY_LABELS.LAD.text}
            </text>

            {/* CX Label */}
            <text
              x={CORONARY_LABELS.LCX.x}
              y={CORONARY_LABELS.LCX.y}
              fontSize={CORONARY_LABELS.LCX.size}
              fontWeight="bold"
              fontFamily="monospace"
              fill="#94a3b8"
              textAnchor="middle"
              className="pointer-events-none opacity-60 select-none"
            >
              {CORONARY_LABELS.LCX.text}
            </text>

            {/* CD Label */}
            <text
              x={CORONARY_LABELS.RCA.x}
              y={CORONARY_LABELS.RCA.y}
              fontSize={CORONARY_LABELS.RCA.size}
              fontWeight="bold"
              fontFamily="monospace"
              fill="#94a3b8"
              textAnchor="middle"
              className="pointer-events-none opacity-60 select-none"
            >
              {CORONARY_LABELS.RCA.text}
            </text>
          </>
        )}
      </svg>

      {/* Floating hover tooltip */}
      <AnimatePresence>
        {hoveredSegment && !isSelected(hoveredSegment) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-6 right-6 z-50 bg-slate-950/95 border border-slate-800/60 backdrop-blur-sm px-3 py-2.5 rounded-lg pointer-events-none shadow-lg"
          >
            <div className="text-sm font-bold text-cyan-400 font-mono">
              {SEGMENT_NAMES[hoveredSegment]}
            </div>
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-0.5">
              Click para seleccionar
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection info card */}
      <AnimatePresence>
        {selectedSegment && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={animationEnabled ? { duration: 0.25 } : { duration: 0 }}
            className="absolute bottom-6 left-6 z-50 bg-slate-900/98 border border-cyan-800/50 backdrop-blur-md p-4 rounded-xl shadow-2xl w-64"
          >
            <div className="space-y-3">
              <div>
                <div className="text-sm font-black text-cyan-300 font-mono">
                  {SEGMENT_NAMES[selectedSegment]}
                </div>
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest mt-1">
                  {SEGMENT_TO_SYSTEM[selectedSegment]}
                </div>
              </div>
              <div className="h-px bg-slate-800/50" />
              <div className="text-[10px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sistema:</span>
                  <span className="text-cyan-300 font-mono font-bold">
                    {SEGMENT_TO_SYSTEM[selectedSegment]}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls info (shown on group hover) */}
      <div className="absolute bottom-4 right-4 z-30 text-[9px] text-slate-500 font-mono space-y-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div>🖱️ Rueda: zoom</div>
        <div>🖱️ Arrastra: pan</div>
        <div>🖱️ 2x clic: reset</div>
      </div>

      {/* View info (top-left) */}
      <div className="absolute top-4 left-4 z-30 text-[11px] font-mono text-slate-500 bg-slate-950/50 px-3 py-1.5 rounded-lg">
        {projection} • {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
