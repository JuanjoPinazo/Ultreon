// components/CoronaryTreeNavigator/coronaryGeometry.ts

import { Segment } from './types';

/**
 * Realistic coronary artery geometry with heart silhouette.
 *
 * SVG viewBox: 600x800
 * Heart silhouette integrated as anatomical reference.
 * All coronary paths positioned relative to realistic heart anatomy.
 *
 * Cardiac positioning:
 * - Aortic root: ~(300, 50-80)
 * - Right atrium: (380-450, 100-200)
 * - Left atrium: (180-250, 100-200)
 * - Right ventricle: (300-420, 200-500)
 * - Left ventricle: (200-300, 300-600)
 * - Apex: (~250, 650)
 */

export interface CoronaryPath {
  id: Segment;
  displayName: string;
  category: 'main' | 'diagonal' | 'marginal' | 'posterior';
  path: string;
  baseStrokeWidth: number;
  isMainVessel: boolean;
}

/**
 * Heart silhouette path for anatomical reference.
 * Realistic cardiac contour showing chambers and great vessels area.
 */
export const HEART_SILHOUETTE = `
  M 250,40
  C 200,50 150,100 150,170
  C 150,220 170,280 200,320
  L 200,600
  C 200,650 220,700 250,700
  C 280,700 300,650 300,600
  L 300,320
  C 330,280 350,220 350,170
  C 350,100 300,50 250,40
  Z
`;

/**
 * Right atrium outline (subtle background element)
 */
export const RIGHT_ATRIUM = `
  M 350,80
  C 400,90 450,120 460,180
  C 465,220 450,260 420,270
  C 400,260 380,200 380,140
  C 380,110 365,90 350,80
  Z
`;

/**
 * Left atrium outline (subtle background element)
 */
export const LEFT_ATRIUM = `
  M 150,80
  C 100,90 50,120 40,180
  C 35,220 50,260 80,270
  C 100,260 120,200 120,140
  C 120,110 135,90 150,80
  Z
`;

export const CORONARY_GEOMETRY: Record<Segment, CoronaryPath> = {
  // ═══════════════════════════════════════════════════════════════
  // LEFT MAIN (TCI) — Origin at aortic root
  // ═══════════════════════════════════════════════════════════════

  'LM-Ostial': {
    id: 'LM-Ostial',
    displayName: 'Tronco Común - Ostial',
    category: 'main',
    // From left aortic cusp downward
    path: 'M 310,50 C 310,55 305,60 300,65',
    baseStrokeWidth: 3.5,
    isMainVessel: true,
  },

  'LM-Body': {
    id: 'LM-Body',
    displayName: 'Tronco Común - Cuerpo',
    category: 'main',
    // Short trunk before bifurcation
    path: 'M 300,65 C 298,75 292,85 285,95',
    baseStrokeWidth: 3.2,
    isMainVessel: true,
  },

  'LM-Distal': {
    id: 'LM-Distal',
    displayName: 'Tronco Común - Distal',
    category: 'main',
    // Final segment before LAD/LCx split
    path: 'M 285,95 C 275,105 265,110 255,120',
    baseStrokeWidth: 2.8,
    isMainVessel: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // LAD (Descendente Anterior) — Descends along anterior IV septum
  // ═══════════════════════════════════════════════════════════════

  'LAD-Ostial': {
    id: 'LAD-Ostial',
    displayName: 'DA - Ostial',
    category: 'main',
    // Sharp leftward turn from bifurcation
    path: 'M 255,120 C 240,125 225,135 210,155',
    baseStrokeWidth: 2.8,
    isMainVessel: true,
  },

  'LAD-Proximal': {
    id: 'LAD-Proximal',
    displayName: 'DA - Proximal',
    category: 'main',
    // Long smooth descent along IV septum
    path: 'M 210,155 C 205,200 202,260 200,320',
    baseStrokeWidth: 2.5,
    isMainVessel: true,
  },

  'LAD-Mid': {
    id: 'LAD-Mid',
    displayName: 'DA - Medio',
    category: 'main',
    // Continues descent with gentle leftward curve
    path: 'M 200,320 C 198,380 200,440 210,500',
    baseStrokeWidth: 2.0,
    isMainVessel: true,
  },

  'LAD-Distal': {
    id: 'LAD-Distal',
    displayName: 'DA - Distal',
    category: 'main',
    // Terminates at apex with posterior wrap
    path: 'M 210,500 C 225,560 250,630 265,700',
    baseStrokeWidth: 1.5,
    isMainVessel: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Diagonals (branches from LAD)

  'D1': {
    id: 'D1',
    displayName: 'Diagonal 1',
    category: 'diagonal',
    // First diagonal: lateral-rightward from proximal LAD
    path: 'M 208,180 C 235,190 260,210 280,240',
    baseStrokeWidth: 1.8,
    isMainVessel: false,
  },

  'D2': {
    id: 'D2',
    displayName: 'Diagonal 2',
    category: 'diagonal',
    // Second diagonal: from mid-LAD
    path: 'M 202,310 C 225,325 250,345 270,370',
    baseStrokeWidth: 1.5,
    isMainVessel: false,
  },

  'D3': {
    id: 'D3',
    displayName: 'Diagonal 3',
    category: 'diagonal',
    // Third diagonal: smaller, distal
    path: 'M 208,460 C 225,475 245,490 265,510',
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
    // Rightward turn from bifurcation
    path: 'M 255,120 C 270,125 285,135 300,160',
    baseStrokeWidth: 2.6,
    isMainVessel: true,
  },

  'LCX-Proximal': {
    id: 'LCX-Proximal',
    displayName: 'CX - Proximal',
    category: 'main',
    // Smooth lateral curve around left ventricle
    path: 'M 300,160 C 330,175 360,200 380,260',
    baseStrokeWidth: 2.3,
    isMainVessel: true,
  },

  'LCX-Distal': {
    id: 'LCX-Distal',
    displayName: 'CX - Distal',
    category: 'main',
    // Continues around inferior wall toward crux
    path: 'M 380,260 C 390,320 370,400 330,480',
    baseStrokeWidth: 1.8,
    isMainVessel: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Obtuse Marginalis branches (from LCx)

  'OM1': {
    id: 'OM1',
    displayName: 'Marginal 1',
    category: 'marginal',
    // First obtuse marginal: lateral branch
    path: 'M 335,190 C 365,190 395,210 420,250',
    baseStrokeWidth: 1.6,
    isMainVessel: false,
  },

  'OM2': {
    id: 'OM2',
    displayName: 'Marginal 2',
    category: 'marginal',
    // Second marginal: from mid-LCx
    path: 'M 375,280 C 405,310 430,350 450,400',
    baseStrokeWidth: 1.3,
    isMainVessel: false,
  },

  'OM3': {
    id: 'OM3',
    displayName: 'Marginal 3',
    category: 'marginal',
    // Third marginal: smaller, distal
    path: 'M 350,430 C 375,455 395,485 415,530',
    baseStrokeWidth: 1.0,
    isMainVessel: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // RCA (Coronaria Derecha) — Right side, curves toward crux
  // ═══════════════════════════════════════════════════════════════

  'RCA-Ostial': {
    id: 'RCA-Ostial',
    displayName: 'CD - Ostial',
    category: 'main',
    // From right aortic cusp
    path: 'M 290,50 C 320,55 350,65 370,85',
    baseStrokeWidth: 3.0,
    isMainVessel: true,
  },

  'RCA-Proximal': {
    id: 'RCA-Proximal',
    displayName: 'CD - Proximal',
    category: 'main',
    // Smooth curve around right atrium
    path: 'M 370,85 C 400,105 430,140 440,200',
    baseStrokeWidth: 2.7,
    isMainVessel: true,
  },

  'RCA-Mid': {
    id: 'RCA-Mid',
    displayName: 'CD - Medio',
    category: 'main',
    // Around right ventricle with posterior curve
    path: 'M 440,200 C 450,270 445,350 420,420',
    baseStrokeWidth: 2.3,
    isMainVessel: true,
  },

  'RCA-Distal': {
    id: 'RCA-Distal',
    displayName: 'CD - Distal',
    category: 'main',
    // Reaches crux for PDA/PL bifurcation
    path: 'M 420,420 C 400,470 370,520 340,570',
    baseStrokeWidth: 1.8,
    isMainVessel: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Posterior branches (from RCA at crux)

  'PDA': {
    id: 'PDA',
    displayName: 'Arteria Descendente Posterior',
    category: 'posterior',
    // Main posterior descending artery
    path: 'M 340,570 C 320,610 305,660 300,710',
    baseStrokeWidth: 1.8,
    isMainVessel: false,
  },

  'PL': {
    id: 'PL',
    displayName: 'Rama Posterolateral',
    category: 'posterior',
    // Posterolateral branch from crux
    path: 'M 345,575 C 365,610 385,650 405,690',
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
      stroke: '#00e5ff',
      strokeWidth: baseStrokeWidth + 1.2,
      opacity: 1,
      filter: 'url(#cyanGlow)',
    };
  }

  if (isHovered) {
    return {
      stroke: '#06b6d4',
      strokeWidth: baseStrokeWidth + 0.6,
      opacity: 1,
      filter: 'url(#hoverGlow)',
    };
  }

  if (isHighlighted) {
    return {
      stroke: '#0891b2',
      strokeWidth: baseStrokeWidth + 0.3,
      opacity: 0.9,
      filter: 'url(#softGlow)',
    };
  }

  return {
    stroke: '#64748b',
    strokeWidth: baseStrokeWidth,
    opacity: 0.75,
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

    <!-- Blue glow for heart silhouette background -->
    <radialGradient id="heartGlow" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stopColor="#0066ff" stopOpacity="0.15" />
      <stop offset="100%" stopColor="#001133" stopOpacity="0" />
    </radialGradient>
  </defs>
`;

/**
 * SVG label definitions with medical nomenclature
 */
export const CORONARY_LABELS = {
  'LM': { x: 280, y: 110, size: 15, text: 'TCI' },
  'LAD': { x: 170, y: 380, size: 15, text: 'DA' },
  'LCX': { x: 400, y: 300, size: 15, text: 'CX' },
  'RCA': { x: 470, y: 220, size: 15, text: 'CD' },
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
