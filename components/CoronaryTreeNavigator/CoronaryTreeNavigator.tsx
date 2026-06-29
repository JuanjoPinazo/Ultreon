// components/CoronaryTreeNavigator/CoronaryTreeNavigator.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Segment,
  Projection,
  CoronaryTreeNavigatorProps,
  SEGMENT_NAMES,
  SEGMENT_TO_SYSTEM,
} from './types';
import { CORONARY_SEGMENTS } from './geometry/segments';
import { COLORS, getSegmentColor, SVG_FILTERS, ANIMATION_TIMINGS } from './geometry/colors';

/**
 * CoronaryTreeNavigator
 *
 * Professional, anatomically accurate interactive coronary artery selector.
 * Designed for use during interventional procedures in hemodynamics labs.
 *
 * Features:
 * - Direct anatomical interaction (click segments, not buttons)
 * - Smooth hover/selection animations
 * - Zoom & pan capability
 * - Projection-aware (ready for LAO/RAO/Cranial/Caudal)
 * - Elegant selection card with segment details
 */

export default function CoronaryTreeNavigator({
  selectedSegment,
  onSelectSegment,
  projection = 'Frontal',
  zoom = 1,
  pan = { x: 0, y: 0 },
  highlight = [],
  readonly = false,
  showLabels = true,
  animationEnabled = true,
}: CoronaryTreeNavigatorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredSegment, setHoveredSegment] = useState<Segment | null>(null);
  const [localZoom, setLocalZoom] = useState(zoom);
  const [localPan, setLocalPan] = useState(pan);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newZoom = Math.max(0.5, Math.min(3, localZoom + delta));
    setLocalZoom(newZoom);
  };

  // Handle pan drag
  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if ((e.target as SVGElement).tagName === 'path') return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - localPan.x, y: e.clientY - localPan.y });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      setLocalPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Handle segment click
  const handleSegmentClick = (segment: Segment) => {
    if (readonly) return;
    onSelectSegment?.(segment);
  };

  // Handle double-click to reset
  const handleDoubleClick = () => {
    setLocalZoom(1);
    setLocalPan({ x: 0, y: 0 });
  };

  const isSelected = (segment: Segment): boolean => {
    return segment === selectedSegment;
  };

  const isHovered = (segment: Segment): boolean => {
    return segment === hoveredSegment;
  };

  const isHighlighted = (segment: Segment): boolean => {
    return highlight.includes(segment);
  };

  return (
    <div className="relative w-full h-full flex flex-col bg-slate-950 rounded-2xl border border-slate-900 overflow-hidden select-none group">
      {/* Background and grid */}
      <div className="absolute inset-0 bg-slate-950">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-cyan-950/10 pointer-events-none" />

        {/* SVG Container with coronary tree */}
        <svg
          ref={svgRef}
          viewBox="0 0 300 350"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          style={{
            transform: `translate(${localPan.x}px, ${localPan.y}px) scale(${localZoom})`,
            transformOrigin: 'center',
            transition: isDragging ? 'none' : 'transform 200ms ease-out',
          }}
        >
          {/* Defs: Filters, gradients, patterns */}
          <g dangerouslySetInnerHTML={{ __html: SVG_FILTERS }} />

          {/* Background grid (subtle) */}
          <rect width="300" height="350" fill="url(#coronaryGrid)" />

          {/* Background depth gradient */}
          <rect width="300" height="350" fill="url(#depthGradient)" opacity="0.3" />

          {/* Coronary segments */}
          {Object.entries(CORONARY_SEGMENTS).map(([segmentId, segment]) => {
            const seg = segmentId as Segment;
            const selected = isSelected(seg);
            const hovered = isHovered(seg);
            const highlighted = isHighlighted(seg);

            const visualState = getSegmentColor(
              seg,
              selected,
              hovered,
              highlighted,
              segment.strokeWidth
            );

            return (
              <motion.path
                key={seg}
                d={segment.path}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                stroke={visualState.stroke}
                strokeWidth={visualState.strokeWidth}
                opacity={visualState.opacity}
                filter={visualState.filter}
                className={readonly ? 'cursor-default' : 'cursor-pointer'}
                onClick={() => handleSegmentClick(seg)}
                onMouseEnter={() => !readonly && setHoveredSegment(seg)}
                onMouseLeave={() => setHoveredSegment(null)}
                animate={{
                  strokeWidth: visualState.strokeWidth,
                  stroke: visualState.stroke,
                  opacity: visualState.opacity,
                }}
                transition={animationEnabled ? ANIMATION_TIMINGS.pathHover : { duration: 0 }}
              />
            );
          })}

          {/* Labels (if enabled) */}
          {showLabels && (
            <>
              <text x="25" y="60" fill="#475569" fontSize="10" fontWeight="bold" fontFamily="monospace" className="pointer-events-none opacity-50">
                CD
              </text>
              <text x="145" y="20" fill="#475569" fontSize="10" fontWeight="bold" fontFamily="monospace" className="pointer-events-none opacity-50">
                TCI
              </text>
              <text x="110" y="180" fill="#475569" fontSize="10" fontWeight="bold" fontFamily="monospace" className="pointer-events-none opacity-50">
                DA
              </text>
              <text x="220" y="120" fill="#475569" fontSize="10" fontWeight="bold" fontFamily="monospace" className="pointer-events-none opacity-50">
                CX
              </text>
            </>
          )}
        </svg>
      </div>

      {/* Hover tooltip (floating) */}
      <AnimatePresence>
        {hoveredSegment && !isSelected(hoveredSegment) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-6 right-6 z-30 bg-slate-950/95 border border-slate-800 backdrop-blur-md px-3 py-2.5 rounded-lg pointer-events-none shadow-xl"
          >
            <div className="text-[11px] font-bold text-cyan-400 font-mono block">{SEGMENT_NAMES[hoveredSegment]}</div>
            <div className="text-[8px] font-mono text-slate-500 uppercase tracking-widest mt-0.5 block">
              Pulse para seleccionar
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selection card (if segment selected) */}
      <AnimatePresence>
        {selectedSegment && (
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={animationEnabled ? ANIMATION_TIMINGS.cardOpen : { duration: 0 }}
            className="absolute bottom-6 left-6 z-40 bg-slate-900/98 border border-cyan-800/40 backdrop-blur-md p-4 rounded-xl shadow-2xl w-56"
          >
            <div className="space-y-2">
              {/* Segment name (bright cyan) */}
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs font-black text-cyan-400 font-mono">
                    {SEGMENT_NAMES[selectedSegment]}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mt-1">
                    {SEGMENT_TO_SYSTEM[selectedSegment]} — Segmento Seleccionado
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-800 my-2" />

              {/* System info */}
              <div className="text-[9px] text-slate-400 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Sistema Coronario:</span>
                  <span className="text-cyan-400 font-mono font-bold">
                    {SEGMENT_TO_SYSTEM[selectedSegment]}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Código CASS:</span>
                  <span className="text-slate-300 font-mono">{selectedSegment}</span>
                </div>
              </div>

              {/* Close hint */}
              <div className="text-[8px] text-slate-600 mt-2 italic">
                Pulse otra arteria o ESC para cambiar
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control hints (bottom-right, shown on hover) */}
      <div className="absolute bottom-4 right-4 z-20 text-[8px] text-slate-600 font-mono space-y-0.5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div>🖱️ Rueda: zoom</div>
        <div>🖱️ Arrastrar: pan</div>
        <div>🖱️ Doble clic: reset</div>
      </div>

      {/* Projection indicator (top-left) */}
      <div className="absolute top-3 left-3 z-20 text-[8px] font-mono text-slate-600 bg-slate-950/50 px-2 py-1 rounded">
        {projection}
      </div>

      {/* Zoom indicator (top-right) */}
      <div className="absolute top-3 right-3 z-20 text-[8px] font-mono text-slate-600 bg-slate-950/50 px-2 py-1 rounded">
        {Math.round(localZoom * 100)}%
      </div>
    </div>
  );
}
