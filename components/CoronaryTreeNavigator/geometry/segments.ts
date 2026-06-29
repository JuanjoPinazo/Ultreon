// components/CoronaryTreeNavigator/geometry/segments.ts

import { SegmentPath, Segment, CoronaryPoint } from '../types';

/**
 * Coronary tree geometry.
 *
 * SVG viewBox: 300x350
 * Anatomically correct paths with control points for future projection rotations.
 *
 * Coordinate system:
 * - Origin (0,0): Top-left
 * - X: Left (0) → Right (300)
 * - Y: Top (0) → Bottom (350)
 *
 * Anatomical mapping:
 * - RCA: Right-sided (x > 150), descends
 * - LM: Center-top, immediately bifurcates
 * - LAD: Left-center, descends vertically with diagonals branching right
 * - LCX: Left-center, curves around left ventricle
 */

export const CORONARY_SEGMENTS: Record<Segment, SegmentPath> = {
  // ═══════════════════════════════════════════════════════════════
  // LEFT MAIN (LM) — Tronco Común Izquierdo
  // ═══════════════════════════════════════════════════════════════

  'LM-Ostial': {
    id: 'LM-Ostial',
    displayName: 'Left Main - Ostial',
    system: 'LM',
    path: 'M 150,30 L 150,45',
    points: [
      { x: 150, y: 30 },
      { x: 150, y: 45 },
    ],
    strokeWidth: 3.5,
    isMainBranch: true,
  },

  'LM-Body': {
    id: 'LM-Body',
    displayName: 'Left Main - Body',
    system: 'LM',
    path: 'M 150,45 Q 150,60 148,75',
    points: [
      { x: 150, y: 45 },
      { x: 150, y: 60 },
      { x: 148, y: 75 },
    ],
    strokeWidth: 3.2,
    isMainBranch: true,
  },

  'LM-Distal': {
    id: 'LM-Distal',
    displayName: 'Left Main - Distal',
    system: 'LM',
    path: 'M 148,75 L 140,85',
    points: [
      { x: 148, y: 75 },
      { x: 140, y: 85 },
    ],
    strokeWidth: 2.8,
    isMainBranch: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // LAD (Left Anterior Descending) — Descendente Anterior
  // ═══════════════════════════════════════════════════════════════

  'LAD-Ostial': {
    id: 'LAD-Ostial',
    displayName: 'LAD - Ostial',
    system: 'LAD',
    path: 'M 140,85 Q 135,95 130,110',
    points: [
      { x: 140, y: 85 },
      { x: 135, y: 95 },
      { x: 130, y: 110 },
    ],
    strokeWidth: 2.8,
    isMainBranch: true,
  },

  'LAD-Proximal': {
    id: 'LAD-Proximal',
    displayName: 'LAD - Proximal',
    system: 'LAD',
    path: 'M 130,110 Q 125,140 120,170',
    points: [
      { x: 130, y: 110 },
      { x: 125, y: 140 },
      { x: 120, y: 170 },
    ],
    strokeWidth: 2.5,
    isMainBranch: true,
  },

  'LAD-Mid': {
    id: 'LAD-Mid',
    displayName: 'LAD - Mid',
    system: 'LAD',
    path: 'M 120,170 Q 118,205 115,235',
    points: [
      { x: 120, y: 170 },
      { x: 118, y: 205 },
      { x: 115, y: 235 },
    ],
    strokeWidth: 2.0,
    isMainBranch: true,
  },

  'LAD-Distal': {
    id: 'LAD-Distal',
    displayName: 'LAD - Distal',
    system: 'LAD',
    path: 'M 115,235 Q 118,270 120,300',
    points: [
      { x: 115, y: 235 },
      { x: 118, y: 270 },
      { x: 120, y: 300 },
    ],
    strokeWidth: 1.5,
    isMainBranch: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Diagonals (from LAD)

  'D1': {
    id: 'D1',
    displayName: 'Diagonal 1',
    system: 'LAD',
    path: 'M 125,125 Q 140,135 155,145',
    points: [
      { x: 125, y: 125 },
      { x: 140, y: 135 },
      { x: 155, y: 145 },
    ],
    strokeWidth: 1.8,
    isMainBranch: false,
  },

  'D2': {
    id: 'D2',
    displayName: 'Diagonal 2',
    system: 'LAD',
    path: 'M 120,165 Q 135,175 150,185',
    points: [
      { x: 120, y: 165 },
      { x: 135, y: 175 },
      { x: 150, y: 185 },
    ],
    strokeWidth: 1.4,
    isMainBranch: false,
  },

  'D3': {
    id: 'D3',
    displayName: 'Diagonal 3',
    system: 'LAD',
    path: 'M 118,210 Q 130,220 140,230',
    points: [
      { x: 118, y: 210 },
      { x: 130, y: 220 },
      { x: 140, y: 230 },
    ],
    strokeWidth: 1.2,
    isMainBranch: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // LCX (Left Circumflex) — Circunfleja Izquierda
  // ═══════════════════════════════════════════════════════════════

  'LCX-Ostial': {
    id: 'LCX-Ostial',
    displayName: 'LCX - Ostial',
    system: 'LCX',
    path: 'M 140,85 Q 155,90 170,100',
    points: [
      { x: 140, y: 85 },
      { x: 155, y: 90 },
      { x: 170, y: 100 },
    ],
    strokeWidth: 2.6,
    isMainBranch: true,
  },

  'LCX-Proximal': {
    id: 'LCX-Proximal',
    displayName: 'LCX - Proximal',
    system: 'LCX',
    path: 'M 170,100 Q 185,110 190,135',
    points: [
      { x: 170, y: 100 },
      { x: 185, y: 110 },
      { x: 190, y: 135 },
    ],
    strokeWidth: 2.3,
    isMainBranch: true,
  },

  'LCX-Distal': {
    id: 'LCX-Distal',
    displayName: 'LCX - Distal',
    system: 'LCX',
    path: 'M 190,135 Q 185,175 175,210',
    points: [
      { x: 190, y: 135 },
      { x: 185, y: 175 },
      { x: 175, y: 210 },
    ],
    strokeWidth: 1.8,
    isMainBranch: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Obtuse Marginals (from LCX)

  'OM1': {
    id: 'OM1',
    displayName: 'Obtuse Marginal 1',
    system: 'LCX',
    path: 'M 182,115 Q 195,125 210,140',
    points: [
      { x: 182, y: 115 },
      { x: 195, y: 125 },
      { x: 210, y: 140 },
    ],
    strokeWidth: 1.6,
    isMainBranch: false,
  },

  'OM2': {
    id: 'OM2',
    displayName: 'Obtuse Marginal 2',
    system: 'LCX',
    path: 'M 188,150 Q 202,165 215,180',
    points: [
      { x: 188, y: 150 },
      { x: 202, y: 165 },
      { x: 215, y: 180 },
    ],
    strokeWidth: 1.3,
    isMainBranch: false,
  },

  'OM3': {
    id: 'OM3',
    displayName: 'Obtuse Marginal 3',
    system: 'LCX',
    path: 'M 182,185 Q 192,200 200,215',
    points: [
      { x: 182, y: 185 },
      { x: 192, y: 200 },
      { x: 200, y: 215 },
    ],
    strokeWidth: 1.0,
    isMainBranch: false,
  },

  // ═══════════════════════════════════════════════════════════════
  // RCA (Right Coronary Artery) — Coronaria Derecha
  // ═══════════════════════════════════════════════════════════════

  'RCA-Ostial': {
    id: 'RCA-Ostial',
    displayName: 'RCA - Ostial',
    system: 'RCA',
    path: 'M 150,30 L 170,45',
    points: [
      { x: 150, y: 30 },
      { x: 170, y: 45 },
    ],
    strokeWidth: 3.0,
    isMainBranch: true,
  },

  'RCA-Proximal': {
    id: 'RCA-Proximal',
    displayName: 'RCA - Proximal',
    system: 'RCA',
    path: 'M 170,45 Q 185,60 190,90',
    points: [
      { x: 170, y: 45 },
      { x: 185, y: 60 },
      { x: 190, y: 90 },
    ],
    strokeWidth: 2.7,
    isMainBranch: true,
  },

  'RCA-Mid': {
    id: 'RCA-Mid',
    displayName: 'RCA - Mid',
    system: 'RCA',
    path: 'M 190,90 Q 195,130 190,170',
    points: [
      { x: 190, y: 90 },
      { x: 195, y: 130 },
      { x: 190, y: 170 },
    ],
    strokeWidth: 2.3,
    isMainBranch: true,
  },

  'RCA-Distal': {
    id: 'RCA-Distal',
    displayName: 'RCA - Distal',
    system: 'RCA',
    path: 'M 190,170 Q 185,210 175,250',
    points: [
      { x: 190, y: 170 },
      { x: 185, y: 210 },
      { x: 175, y: 250 },
    ],
    strokeWidth: 1.8,
    isMainBranch: true,
  },

  // ─────────────────────────────────────────────────────────────
  // Posterior branches (from RCA)

  'PDA': {
    id: 'PDA',
    displayName: 'Posterior Descending Artery',
    system: 'RCA',
    path: 'M 175,250 Q 168,280 160,310',
    points: [
      { x: 175, y: 250 },
      { x: 168, y: 280 },
      { x: 160, y: 310 },
    ],
    strokeWidth: 1.6,
    isMainBranch: false,
  },

  'PL': {
    id: 'PL',
    displayName: 'Posterolateral Branch',
    system: 'RCA',
    path: 'M 177,260 Q 195,280 215,295',
    points: [
      { x: 177, y: 260 },
      { x: 195, y: 280 },
      { x: 215, y: 295 },
    ],
    strokeWidth: 1.4,
    isMainBranch: false,
  },
};

// Helper to get all segments
export function getAllSegments(): SegmentPath[] {
  return Object.values(CORONARY_SEGMENTS);
}

// Helper to get main branches only
export function getMainBranches(): SegmentPath[] {
  return Object.values(CORONARY_SEGMENTS).filter(s => s.isMainBranch);
}

// Helper to get segments by system
export function getSegmentsBySystem(system: string): SegmentPath[] {
  return Object.values(CORONARY_SEGMENTS).filter(s => s.system === system);
}
