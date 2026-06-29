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
    // Straight vertical line from aorta downward to bifurcation point
    path: 'M 300,45 L 300,75',
    baseStrokeWidth: 3.5,
    isMainVessel: true,
  },

  'LM-Body': {
    id: 'LM-Body',
    displayName: 'Tronco Común - Cuerpo',
    category: 'main',
    // Slight rightward curve as it approaches bifurcation
    path: 'M 300,75 Q 305,85 310,95',
    baseStrokeWidth: 3.2,
    isMainVessel: true,
  },

  'LM-Distal': {
    id: 'LM-Distal',
    displayName: 'Tronco Común - Distal',
    category: 'main',
    // Final segment just before split into LAD and LCx
    path: 'M 310,95 L 320,120',
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
    // Sharp leftward turn from LM bifurcation
    path: 'M 320,120 Q 280,130 250,145',
    baseStrokeWidth: 2.8,
    isMainVessel: true,
  },

  'LAD-Proximal': {
    id: 'LAD-Proximal',
    displayName: 'DA - Proximal',
    category: 'main',
    // Long descent along interventricular septum
    // Smooth curve with gentle leftward taper
    path: 'M 250,145 Q 245,220 240,290',
    baseStrokeWidth: 2.5,
    isMainVessel: true,
  },

  'LAD-Mid': {
    id: 'LAD-Mid',
    displayName: 'DA - Medio',
    category: 'main',
    // Continues descent with slight posterior curve
    path: 'M 240,290 Q 235,380 235,450',
    baseStrokeWidth: 2.0,
    isMainVessel: true,
  },

  'LAD-Distal': {
    id: 'LAD-Distal',
    displayName: 'DA - Distal',
    category: 'main',
    // Terminates at apex, curves around to posterior
    path: 'M 235,450 Q 240,520 245,600',
    baseStrokeWidth: 1.5,
    isMainVessel: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Diagonals (branches from LAD)

  'D1': {
    id: 'D1',
    displayName: 'Diagonal 1',
    category: 'diagonal',
    // First diagonal: branches rightward from proximal LAD
    path: 'M 248,175 Q 290,185 330,210',
    baseStrokeWidth: 1.8,
    isMainVessel: false,
  },

  'D2': {
    id: 'D2',
    displayName: 'Diagonal 2',
    category: 'diagonal',
    // Second diagonal: from mid LAD, curves right with gentle downward taper
    path: 'M 245,290 Q 280,300 320,320',
    baseStrokeWidth: 1.5,
    isMainVessel: false,
  },

  'D3': {
    id: 'D3',
    displayName: 'Diagonal 3',
    category: 'diagonal',
    // Third diagonal: smaller, from distal LAD
    path: 'M 238,380 Q 260,390 290,400',
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
    // Takes the rightward/downward path at bifurcation
    path: 'M 320,120 Q 360,130 400,150',
    baseStrokeWidth: 2.6,
    isMainVessel: true,
  },

  'LCX-Proximal': {
    id: 'LCX-Proximal',
    displayName: 'CX - Proximal',
    category: 'main',
    // Curves around left ventricle laterally
    // Smooth, gentle S-curve
    path: 'M 400,150 Q 450,160 480,220',
    baseStrokeWidth: 2.3,
    isMainVessel: true,
  },

  'LCX-Distal': {
    id: 'LCX-Distal',
    displayName: 'CX - Distal',
    category: 'main',
    // Continues around inferior wall
    path: 'M 480,220 Q 460,310 420,400',
    baseStrokeWidth: 1.8,
    isMainVessel: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Obtuse Marginalis branches (from LCx)

  'OM1': {
    id: 'OM1',
    displayName: 'Marginal 1',
    category: 'marginal',
    // First obtuse marginal: lateral branch from proximal LCx
    path: 'M 430,160 Q 480,150 520,180',
    baseStrokeWidth: 1.6,
    isMainVessel: false,
  },

  'OM2': {
    id: 'OM2',
    displayName: 'Marginal 2',
    category: 'marginal',
    // Second marginal: from mid LCx, goes lateral and inferior
    path: 'M 465,220 Q 510,250 540,310',
    baseStrokeWidth: 1.3,
    isMainVessel: false,
  },

  'OM3': {
    id: 'OM3',
    displayName: 'Marginal 3',
    category: 'marginal',
    // Third marginal: smaller, distal
    path: 'M 440,350 Q 470,380 490,420',
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
    // Originates from right aortic cusp, curves rightward immediately
    path: 'M 300,45 L 350,60',
    baseStrokeWidth: 3.0,
    isMainVessel: true,
  },

  'RCA-Proximal': {
    id: 'RCA-Proximal',
    displayName: 'CD - Proximal',
    category: 'main',
    // Curves along right atrium with gentle downward taper
    path: 'M 350,60 Q 390,80 420,130',
    baseStrokeWidth: 2.7,
    isMainVessel: true,
  },

  'RCA-Mid': {
    id: 'RCA-Mid',
    displayName: 'CD - Medio',
    category: 'main',
    // Continues around right ventricle
    // Curves posteriorly as it descends
    path: 'M 420,130 Q 450,200 460,300',
    baseStrokeWidth: 2.3,
    isMainVessel: true,
  },

  'RCA-Distal': {
    id: 'RCA-Distal',
    displayName: 'CD - Distal',
    category: 'main',
    // Reaches crux, prepares for PDA/PL bifurcation
    path: 'M 460,300 Q 450,380 430,480',
    baseStrokeWidth: 1.8,
    isMainVessel: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Posterior branches (from RCA)

  'PDA': {
    id: 'PDA',
    displayName: 'Arteria Descendente Posterior',
    category: 'posterior',
    // Posterior descending: main branch from RCA at crux
    // Descends along posterior IV septum
    path: 'M 430,480 Q 410,540 400,650',
    baseStrokeWidth: 1.8,
    isMainVessel: false,
  },

  'PL': {
    id: 'PL',
    displayName: 'Rama Posterolateral',
    category: 'posterior',
    // Posterolateral: branches laterally from crux region
    path: 'M 435,485 Q 480,520 510,580',
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
