export type SegmentGroup = 'TCI' | 'DA' | 'CX' | 'CD' | 'RAMAS';

export interface Segment {
  id: string;
  label: string;
  shortLabel: string;
  group: SegmentGroup;
  vessel: 'LM' | 'LAD' | 'LCX' | 'RCA';
}

export const CORONARY_SEGMENTS: Segment[] = [
  // TCI
  { id: 'lm_ostial', label: 'TCI Ostial', shortLabel: 'LM Ost', group: 'TCI', vessel: 'LM' },
  { id: 'lm_body', label: 'TCI Cuerpo', shortLabel: 'LM Mid', group: 'TCI', vessel: 'LM' },
  { id: 'lm_distal', label: 'TCI Distal', shortLabel: 'LM Dist', group: 'TCI', vessel: 'LM' },
  
  // DA (LAD)
  { id: 'lad_ostial', label: 'DA Ostial', shortLabel: 'LAD Ost', group: 'DA', vessel: 'LAD' },
  { id: 'lad_proximal', label: 'DA Proximal', shortLabel: 'LAD Prox', group: 'DA', vessel: 'LAD' },
  { id: 'lad_mid', label: 'DA Media', shortLabel: 'LAD Mid', group: 'DA', vessel: 'LAD' },
  { id: 'lad_distal', label: 'DA Distal', shortLabel: 'LAD Dist', group: 'DA', vessel: 'LAD' },
  
  // Diagonales
  { id: 'd1', label: 'Diagonal 1', shortLabel: 'D1', group: 'DA', vessel: 'LAD' },
  { id: 'd2', label: 'Diagonal 2', shortLabel: 'D2', group: 'DA', vessel: 'LAD' },
  { id: 'd3', label: 'Diagonal 3', shortLabel: 'D3', group: 'DA', vessel: 'LAD' },

  // CX (LCX)
  { id: 'lcx_ostial', label: 'CX Ostial', shortLabel: 'LCX Ost', group: 'CX', vessel: 'LCX' },
  { id: 'lcx_proximal', label: 'CX Proximal', shortLabel: 'LCX Prox', group: 'CX', vessel: 'LCX' },
  { id: 'lcx_distal', label: 'CX Distal', shortLabel: 'LCX Dist', group: 'CX', vessel: 'LCX' },

  // Marginales
  { id: 'om1', label: 'Marginal 1', shortLabel: 'OM1', group: 'CX', vessel: 'LCX' },
  { id: 'om2', label: 'Marginal 2', shortLabel: 'OM2', group: 'CX', vessel: 'LCX' },
  { id: 'om3', label: 'Marginal 3', shortLabel: 'OM3', group: 'CX', vessel: 'LCX' },

  // CD (RCA)
  { id: 'rca_ostial', label: 'CD Ostial', shortLabel: 'RCA Ost', group: 'CD', vessel: 'RCA' },
  { id: 'rca_proximal', label: 'CD Proximal', shortLabel: 'RCA Prox', group: 'CD', vessel: 'RCA' },
  { id: 'rca_mid', label: 'CD Media', shortLabel: 'RCA Mid', group: 'CD', vessel: 'RCA' },
  { id: 'rca_distal', label: 'CD Distal', shortLabel: 'RCA Dist', group: 'CD', vessel: 'RCA' },

  // Ramas CD
  { id: 'pda', label: 'Descendente Posterior', shortLabel: 'PDA', group: 'RAMAS', vessel: 'RCA' },
  { id: 'pl', label: 'Postero-Lateral', shortLabel: 'PL', group: 'RAMAS', vessel: 'RCA' },
];
