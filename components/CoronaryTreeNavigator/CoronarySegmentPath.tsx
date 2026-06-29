import React from 'react';
import { Segment } from './coronarySegments';
import { CoronaryPath } from './coronaryGeometry';

interface CoronarySegmentPathProps {
  segment: Segment;
  pathData: CoronaryPath;
  isSelected: boolean;
  onSelect: (segmentId: string) => void;
  showLabels: boolean;
}

export function CoronarySegmentPath({
  segment,
  pathData,
  isSelected,
  onSelect,
  showLabels,
}: CoronarySegmentPathProps) {
  return (
    <g
      className={`cursor-pointer transition-all duration-300 outline-none`}
      onClick={() => onSelect(segment.id)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(segment.id);
        }
      }}
    >
      {/* Invisible thicker path for easier clicking (hit area) */}
      <path
        d={pathData.d}
        fill="none"
        stroke="transparent"
        strokeWidth={Math.max(30, pathData.strokeWidth + 20)}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-auto"
      />

      {/* Glow effect when selected */}
      {isSelected && (
        <path
          d={pathData.d}
          fill="none"
          stroke="rgba(34, 211, 238, 0.4)" // cyan-400 with opacity
          strokeWidth={pathData.strokeWidth + 12}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none animate-pulse"
        />
      )}

      {/* Main visible path */}
      <path
        d={pathData.d}
        fill="none"
        stroke={isSelected ? '#22d3ee' : '#64748b'} // cyan-400 when selected, slate-500 base
        strokeWidth={isSelected ? pathData.strokeWidth + 2 : pathData.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`pointer-events-none transition-all duration-300 ${
          isSelected
            ? 'filter drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]'
            : 'hover:stroke-[#94a3b8] hover:drop-shadow-[0_0_5px_rgba(148,163,184,0.5)]' // slate-400 on hover
        }`}
      />

      {/* Add label along path or at midpoint if requested */}
      {showLabels && isSelected && (
        // Simple label at the start of the path - for a more complex approach we'd calculate bounding box
        // but this adds a nice floating badge feel to the selected segment
        <text
          x={0} // We will handle exact positioning in a higher order component or calculate bbox
          y={0}
          className="hidden" // Hiding here as we will render the active label floating over the SVG in the parent
        >
          {segment.shortLabel}
        </text>
      )}
    </g>
  );
}
