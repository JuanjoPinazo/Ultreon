// components/CoronaryTreeNavigator/types.ts

export type CoronarySystem = 'LM' | 'LAD' | 'LCX' | 'RCA';
export type Segment =
  | 'LM-Ostial' | 'LM-Body' | 'LM-Distal'
  | 'LAD-Ostial' | 'LAD-Proximal' | 'LAD-Mid' | 'LAD-Distal'
  | 'D1' | 'D2' | 'D3'
  | 'LCX-Ostial' | 'LCX-Proximal' | 'LCX-Distal'
  | 'OM1' | 'OM2' | 'OM3'
  | 'RCA-Ostial' | 'RCA-Proximal' | 'RCA-Mid' | 'RCA-Distal'
  | 'PDA' | 'PL';

export type Projection = 'Frontal' | 'Lateral' | 'LAO' | 'RAO' | 'Cranial' | 'Caudal' | '3D';

export interface CoronaryPoint {
  x: number;
  y: number;
  z?: number; // For future 3D projections
}

export interface SegmentPath {
  id: Segment;
  displayName: string;
  system: CoronarySystem;
  path: string; // SVG path data
  points: CoronaryPoint[]; // Control points for projection
  strokeWidth: number; // Default stroke width
  isMainBranch: boolean;
}

export interface CoronaryTreeState {
  selectedSegment: Segment | null;
  hoveredSegment: Segment | null;
  zoom: number;
  pan: { x: number; y: number };
  projection: Projection;
}

export interface CoronaryTreeNavigatorProps {
  selectedSegment?: Segment | null;
  onSelectSegment?: (segment: Segment) => void;
  projection?: Projection;
  zoom?: number;
  pan?: { x: number; y: number };
  highlight?: Segment[];
  readonly?: boolean;
  showLabels?: boolean;
  animationEnabled?: boolean;
}

export interface SelectionCardData {
  segment: Segment;
  displayName: string;
  system: CoronarySystem;
  description: string;
}

export const SYSTEM_NAMES: Record<CoronarySystem, string> = {
  LM: 'Left Main',
  LAD: 'Left Anterior Descending',
  LCX: 'Left Circumflex',
  RCA: 'Right Coronary Artery',
};

export const SEGMENT_NAMES: Record<Segment, string> = {
  'LM-Ostial': 'Left Main - Ostial',
  'LM-Body': 'Left Main - Body',
  'LM-Distal': 'Left Main - Distal',
  'LAD-Ostial': 'LAD - Ostial',
  'LAD-Proximal': 'LAD - Proximal',
  'LAD-Mid': 'LAD - Mid',
  'LAD-Distal': 'LAD - Distal',
  'D1': 'Diagonal 1',
  'D2': 'Diagonal 2',
  'D3': 'Diagonal 3',
  'LCX-Ostial': 'LCX - Ostial',
  'LCX-Proximal': 'LCX - Proximal',
  'LCX-Distal': 'LCX - Distal',
  'OM1': 'Obtuse Marginal 1',
  'OM2': 'Obtuse Marginal 2',
  'OM3': 'Obtuse Marginal 3',
  'RCA-Ostial': 'RCA - Ostial',
  'RCA-Proximal': 'RCA - Proximal',
  'RCA-Mid': 'RCA - Mid',
  'RCA-Distal': 'RCA - Distal',
  'PDA': 'Posterior Descending Artery',
  'PL': 'Posterolateral Branch',
};

export const SEGMENT_TO_SYSTEM: Record<Segment, CoronarySystem> = {
  'LM-Ostial': 'LM',
  'LM-Body': 'LM',
  'LM-Distal': 'LM',
  'LAD-Ostial': 'LAD',
  'LAD-Proximal': 'LAD',
  'LAD-Mid': 'LAD',
  'LAD-Distal': 'LAD',
  'D1': 'LAD',
  'D2': 'LAD',
  'D3': 'LAD',
  'LCX-Ostial': 'LCX',
  'LCX-Proximal': 'LCX',
  'LCX-Distal': 'LCX',
  'OM1': 'LCX',
  'OM2': 'LCX',
  'OM3': 'LCX',
  'RCA-Ostial': 'RCA',
  'RCA-Proximal': 'RCA',
  'RCA-Mid': 'RCA',
  'RCA-Distal': 'RCA',
  'PDA': 'RCA',
  'PL': 'RCA',
};
