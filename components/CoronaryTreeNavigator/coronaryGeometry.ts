// components/CoronaryTreeNavigator/coronaryGeometry.ts

import { Segment } from './types';

/**
 * Realistic coronary artery geometry with natural bezier curves.
 *
 * SVG viewBox: 600x800 (larger canvas for readability)
 *
 * Anatomical reference system:
 * - Origin (TCI): ~(300, 80) at top center
 * - LAD: Descends vertically along interventricular septum (left side)
 * - LCx: Curves laterally around left ventricle
 * - RCA: Right side, curves toward PDA/PL
 * - Diagonals: Branch from LAD rightward
 * - Obtuse Marginalis: Branch from LCx downward/lateral
 * - PDA: Posterior descending artery from RCA
 * - PL: Posterolateral branch from RCA
 *
 * All paths use smooth bezier curves (Q and C commands) for natural appearance.
 */

export interface CoronaryPath {
  id: Segment;
  displayName: string;
  category: 'main' | 'diagonal' | 'marginal' | 'posterior';
  path: string; // SVG path data
  baseStrokeWidth: number;
  isMainVessel: boolean;
}

export const CORONARY_GEOMETRY: Record<Segment, CoronaryPath> = {
  // ═══════════════════════════════════════════════════════════════
  // LEFT MAIN (TCI) — Origin bifurcation at top center
  // ═══════════════════════════════════════════════════════════════

  'LM-Ostial': {
    id: 'LM-Ostial',
    displayName: 'Tronco Común - Ostial',
    category: 'main',
    path: 'M 300,45 L 300,70',
    baseStrokeWidth: 3.5,
    isMainVessel: true,
  },

  'LM-Body': {
    id: 'LM-Body',
    displayName: 'Tronco Común - Cuerpo',
    category: 'main',
    path: 'M 300,70 C 300,80 305,88 315,100',
    baseStrokeWidth: 3.2,
    isMainVessel: true,
  },

  'LM-Distal': {
    id: 'LM-Distal',
    displayName: 'Tronco Común - Distal',
    category: 'main',
    path: 'M 315,100 C 325,110 330,115 340,125',
    baseStrokeWidth: 2.8,
    isMainVessel: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // LAD (Descendente Anterior) — Descends along IV septum
  // ═══════════════════════════════════════════════════════════════

  'LAD-Ostial': {
    id: 'LAD-Ostial',
    displayName: 'DA - Ostial',
    category: 'main',
    // Smooth leftward turn from LM bifurcation
    path: 'M 340,125 C 310,135 280,140 260,160',
    baseStrokeWidth: 2.8,
    isMainVessel: true,
  },

  'LAD-Proximal': {
    id: 'LAD-Proximal',
    displayName: 'DA - Proximal',
    category: 'main',
    // Long smooth descent along IV septum with natural curve
    path: 'M 260,160 C 255,200 250,250 245,310',
    baseStrokeWidth: 2.5,
    isMainVessel: true,
  },

  'LAD-Mid': {
    id: 'LAD-Mid',
    displayName: 'DA - Medio',
    category: 'main',
    // Continues descent with smooth posterior taper
    path: 'M 245,310 C 240,370 238,410 240,480',
    baseStrokeWidth: 2.0,
    isMainVessel: true,
  },

  'LAD-Distal': {
    id: 'LAD-Distal',
    displayName: 'DA - Distal',
    category: 'main',
    // Curves smoothly to apex and posterior wrap
    path: 'M 240,480 C 245,540 255,600 270,680',
    baseStrokeWidth: 1.5,
    isMainVessel: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Diagonals (branches from LAD)

  'D1': {
    id: 'D1',
    displayName: 'Diagonal 1',
    category: 'diagonal',
    // Smooth rightward branch from proximal LAD
    path: 'M 258,195 C 290,200 320,210 350,235',
    baseStrokeWidth: 1.8,
    isMainVessel: false,
  },

  'D2': {
    id: 'D2',
    displayName: 'Diagonal 2',
    category: 'diagonal',
    // Second diagonal from mid-LAD, curves smoothly
    path: 'M 248,300 C 280,310 310,325 340,350',
    baseStrokeWidth: 1.5,
    isMainVessel: false,
  },

  'D3': {
    id: 'D3',
    displayName: 'Diagonal 3',
    category: 'diagonal',
    // Smaller distal diagonal
    path: 'M 242,430 C 265,445 290,460 320,475',
    baseStrokeWidth: 1.2,
    isMainVessel: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // LCx (Circunfleja) — Curves around left ventricle
  // ═══════════════════════════════════════════════════════════════

  'LCX-Ostial': {
    id: 'LCX-Ostial',
    displayName: 'CX - Ostial',
    category: 'main',
    // Smooth rightward turn from LM bifurcation
    path: 'M 340,125 C 370,130 390,140 420,165',
    baseStrokeWidth: 2.6,
    isMainVessel: true,
  },

  'LCX-Proximal': {
    id: 'LCX-Proximal',
    displayName: 'CX - Proximal',
    category: 'main',
    // Gentle lateral curve with smooth S-curve around ventricle
    path: 'M 420,165 C 455,180 480,210 495,260',
    baseStrokeWidth: 2.3,
    isMainVessel: true,
  },

  'LCX-Distal': {
    id: 'LCX-Distal',
    displayName: 'CX - Distal',
    category: 'main',
    // Smooth continuation around inferior wall
    path: 'M 495,260 C 500,310 480,370 440,440',
    baseStrokeWidth: 1.8,
    isMainVessel: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Obtuse Marginalis branches (from LCx)

  'OM1': {
    id: 'OM1',
    displayName: 'Marginal 1',
    category: 'marginal',
    // Smooth lateral branch from proximal LCx
    path: 'M 445,185 C 485,180 520,195 555,225',
    baseStrokeWidth: 1.6,
    isMainVessel: false,
  },

  'OM2': {
    id: 'OM2',
    displayName: 'Marginal 2',
    category: 'marginal',
    // Second marginal: smooth lateral-inferior branch
    path: 'M 490,260 C 525,285 550,320 570,365',
    baseStrokeWidth: 1.3,
    isMainVessel: false,
  },

  'OM3': {
    id: 'OM3',
    displayName: 'Marginal 3',
    category: 'marginal',
    // Smaller distal marginal
    path: 'M 465,400 C 495,415 525,440 550,480',
    baseStrokeWidth: 1.0,
    isMainVessel: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // RCA (Coronaria Derecha) — Right side, curves toward PDA
  // ═══════════════════════════════════════════════════════════════

  'RCA-Ostial': {
    id: 'RCA-Ostial',
    displayName: 'CD - Ostial',
    category: 'main',
    // Smooth rightward curve from aorta
    path: 'M 300,45 C 330,55 355,60 375,70',
    baseStrokeWidth: 3.0,
    isMainVessel: true,
  },

  'RCA-Proximal': {
    id: 'RCA-Proximal',
    displayName: 'CD - Proximal',
    category: 'main',
    // Smooth curve around right atrium with natural taper
    path: 'M 375,70 C 410,90 435,120 450,165',
    baseStrokeWidth: 2.7,
    isMainVessel: true,
  },

  'RCA-Mid': {
    id: 'RCA-Mid',
    displayName: 'CD - Medio',
    category: 'main',
    // Smooth curve around right ventricle
    path: 'M 450,165 C 470,220 480,270 485,330',
    baseStrokeWidth: 2.3,
    isMainVessel: true,
  },

  'RCA-Distal': {
    id: 'RCA-Distal',
    displayName: 'CD - Distal',
    category: 'main',
    // Smooth continuation to crux for PDA/PL bifurcation
    path: 'M 485,330 C 480,390 470,450 455,520',
    baseStrokeWidth: 1.8,
    isMainVessel: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Posterior branches (from RCA)

  'PDA': {
    id: 'PDA',
    displayName: 'Arteria Descendente Posterior',
    category: 'posterior',
    // Smooth posterior descending from crux
    path: 'M 455,520 C 438,575 425,630 420,700',
    baseStrokeWidth: 1.8,
    isMainVessel: false,
  },

  'PL': {
    id: 'PL',
    displayName: 'Rama Posterolateral',
    category: 'posterior',
    // Smooth posterolateral branch from crux
    path: 'M 460,525 C 490,555 520,590 545,650',
    baseStrokeWidth: 1.4,
    isMainVessel: false,
  },
};

/**
 * Get visual properties for a segment based on state
 */
export interface SegmentVisualProps {
  stroke: string;
  strokeWidth: number;
  opacity: number;
  filter?: string;
}

export function getSegmentVisuals(
  baseStrokeWidth: number,
  isSelected: boolean,
  isHovered: boolean,
  isHighlighted: boolean
): SegmentVisualProps {
  if (isSelected) {
    return {
      stroke: '#00e5ff', // Bright cyan
      strokeWidth: baseStrokeWidth + 1.2,
      opacity: 1,
      filter: 'url(#cyanGlow)',
    };
  }

  if (isHovered) {
    return {
      stroke: '#06b6d4', // Cyan-500
      strokeWidth: baseStrokeWidth + 0.6,
      opacity: 1,
      filter: 'url(#hoverGlow)',
    };
  }

  if (isHighlighted) {
    return {
      stroke: '#0891b2', // Cyan-600
      strokeWidth: baseStrokeWidth + 0.3,
      opacity: 0.9,
      filter: 'url(#softGlow)',
    };
  }

  // Resting state: grayish-blue, subtle
  return {
    stroke: '#64748b', // Slate-500
    strokeWidth: baseStrokeWidth,
    opacity: 0.7,
    filter: undefined,
  };
}

/**
 * SVG filter definitions for premium medical appearance
 */
export const SVG_FILTER_DEFS = `
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

    <!-- Hover glow: less intense -->
    <filter id="hoverGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="1.5" result="blur1" />
      <feGaussianBlur stdDeviation="4" result="blur2" />
      <feMerge>
        <feMergeNode in="blur2" />
        <feMergeNode in="blur1" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>

    <!-- Soft glow for highlighted segments -->
    <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="screen" />
    </filter>

    <!-- Background grid pattern -->
    <pattern id="coronaryGridBg" x="40" y="40" width="80" height="80" patternUnits="userSpaceOnUse">
      <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#1c2436" strokeWidth="0.5" opacity="0.2" />
    </pattern>

    <!-- Radial gradient for subtle depth -->
    <radialGradient id="depthGrad" cx="50%" cy="35%">
      <stop offset="0%" stopColor="#1c2436" stopOpacity="0.08" />
      <stop offset="100%" stopColor="#000000" stopOpacity="0.15" />
    </radialGradient>
  </defs>
`;

/**
 * SVG label definitions with medical nomenclature
 */
export const CORONARY_LABELS = {
  'LM': { x: 280, y: 60, size: 14, text: 'TCI' },
  'LAD': { x: 200, y: 300, size: 14, text: 'DA' },
  'LCX': { x: 450, y: 280, size: 14, text: 'CX' },
  'RCA': { x: 480, y: 200, size: 14, text: 'CD' },
};

/**
 * Get all segments, optionally filtered by category
 */
export function getCoronarySegments(category?: string): CoronaryPath[] {
  return Object.values(CORONARY_GEOMETRY).filter(
    seg => !category || seg.category === category
  );
}

/**
 * Get main vessels only (TCI, LAD, LCx, RCA)
 */
export function getMainVessels(): CoronaryPath[] {
  return Object.values(CORONARY_GEOMETRY).filter(seg => seg.isMainVessel);
}

/**
 * Get branches only (diagonals, marginalis, posteriors)
 */
export function getBranches(): CoronaryPath[] {
  return Object.values(CORONARY_GEOMETRY).filter(seg => !seg.isMainVessel);
}
