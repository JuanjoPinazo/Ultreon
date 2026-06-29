// components/CoronaryTreeNavigator/geometry/colors.ts

import { Segment } from '../types';

/**
 * Visual language for coronary segments.
 * Professional, minimal, dark mode aesthetic.
 */

export const COLORS = {
  // Base
  background: '#0f172a', // slate-950
  border: '#1c2436', // slate-900

  // Text
  text: {
    primary: '#f1f5f9', // slate-100
    secondary: '#94a3b8', // slate-400
    muted: '#64748b', // slate-500
  },

  // Coronary paths (at rest)
  segment: {
    rest: '#475569', // slate-600
    main: '#64748b', // slate-500 (slightly brighter for main branches)
  },

  // Interactive states
  hover: {
    stroke: '#06b6d4', // cyan-500
    glow: '#06b6d4',
  },

  selected: {
    stroke: '#00e5ff', // cyan-400 (brightest)
    glow: '#06b6d4', // cyan-500 (glow halo)
  },

  highlight: {
    stroke: '#0891b2', // cyan-600 (for other highlighted segments)
  },
};

/**
 * Get the visual state for a segment.
 */
export interface SegmentVisualState {
  stroke: string;
  strokeWidth: number;
  opacity: number;
  filter?: string;
}

export function getSegmentColor(
  segment: Segment,
  isSelected: boolean,
  isHovered: boolean,
  isHighlighted: boolean,
  baseStrokeWidth: number
): SegmentVisualState {
  if (isSelected) {
    return {
      stroke: COLORS.selected.stroke,
      strokeWidth: baseStrokeWidth + 1.5,
      opacity: 1,
      filter: 'url(#cyanGlow)',
    };
  }

  if (isHovered) {
    return {
      stroke: COLORS.hover.stroke,
      strokeWidth: baseStrokeWidth + 0.8,
      opacity: 1,
      filter: 'url(#hoverGlow)',
    };
  }

  if (isHighlighted) {
    return {
      stroke: COLORS.highlight.stroke,
      strokeWidth: baseStrokeWidth + 0.5,
      opacity: 0.9,
      filter: 'url(#softGlow)',
    };
  }

  return {
    stroke: COLORS.segment.rest,
    strokeWidth: baseStrokeWidth,
    opacity: 0.7,
    filter: undefined,
  };
}

/**
 * SVG Filter definitions for visual effects.
 */
export const SVG_FILTERS = `
  <defs>
    <!-- Cyan glow for selected segments -->
    <filter id="cyanGlow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="2.5" result="blur1" />
      <feGaussianBlur stdDeviation="6" result="blur2" />
      <feGaussianBlur stdDeviation="12" result="blur3" />
      <feMerge>
        <feMergeNode in="blur3" />
        <feMergeNode in="blur2" />
        <feMergeNode in="blur1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- Hover glow (slightly less intense) -->
    <filter id="hoverGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="2" result="blur1" />
      <feGaussianBlur stdDeviation="5" result="blur2" />
      <feMerge>
        <feMergeNode in="blur2" />
        <feMergeNode in="blur1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- Soft glow for highlighted segments -->
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.5" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="screen" />
    </filter>

    <!-- Subtle background grid -->
    <pattern id="coronaryGrid" x="25" y="25" width="50" height="50" patternUnits="userSpaceOnUse">
      <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#1c2436" strokeWidth="0.5" opacity="0.3" />
    </pattern>

    <!-- Radial gradient for subtle depth -->
    <radialGradient id="depthGradient" cx="50%" cy="40%">
      <stop offset="0%" stopColor="#1c2436" stopOpacity="0.1" />
      <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
    </radialGradient>
  </defs>
`;

/**
 * Tooltip styling
 */
export const TOOLTIP_STYLE = {
  background: 'rgba(15, 23, 42, 0.95)', // slate-950 with transparency
  border: '1px solid #1c2436',
  text: '#f1f5f9',
  label: '#06b6d4',
};

/**
 * Animation timings (Framer Motion)
 */
export const ANIMATION_TIMINGS = {
  pathSelect: { duration: 0.3 },
  pathHover: { duration: 0.2 },
  cardOpen: { duration: 0.4 },
  cardClose: { duration: 0.2 },
};
