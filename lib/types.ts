// lib/types.ts

export interface StrategyChangesPayload {
  modified_strategy: boolean;
  change_magnitude?: 'minor' | 'moderate' | 'major' | null;
  change_description?: string | null;
  changed_stent_diameter?: boolean;
  changed_stent_length?: boolean;
  changed_landing_zone_proximal?: boolean;
  changed_landing_zone_distal?: boolean;
  required_plaque_preparation?: boolean;
  used_nc_balloon?: boolean;
  used_scoring_cutting_balloon?: boolean;
  used_ivl?: boolean;
  used_atherectomy?: boolean;
  decided_no_stent?: boolean;
  treated_edge?: boolean;
  additional_postdilatation?: boolean;
  global_strategy_change?: boolean;
  other_change?: boolean;
}

export interface OptimizationResultsPayload {
  post_stent_msa_mm2?: number | null;
  stent_expansion_percent?: number | null;
  adequate_expansion?: 'yes' | 'no' | 'na' | null;
  significant_malapposition?: 'yes' | 'no' | 'na' | null;
  malapposition_length_mm?: number | null;
  requires_malapposition_correction?: boolean;
  proximal_edge_dissection?: boolean;
  distal_edge_dissection?: boolean;
  proximal_dissection_length_mm?: number | null;
  distal_dissection_length_mm?: number | null;
  significant_flap_gt_3mm?: boolean;
  requires_edge_treatment?: boolean;
  opstar_score?: number | null;
  opstar_score_category?: string | null;
}

export interface CaseRecordPayload {
  id_paciente: string;
  centro: string;
  vaso_diana: string;
  tecnica_purga_oct: string;
  ffr_oct: number | null;
  calcio_ia: boolean;
  placa_lipida_ia: boolean;
  arco_lipidico_estimado: number | null;
  landing_zone: string;
  diametro: number | null;
  modifico_estrategia: boolean;
  expansion: number | null;
  malaposicion_struts: boolean;
  diseccion_bordes: boolean;
  contraste_ml: number | null;
  hospital_id: string | null;
  created_by: string;
  expected_contrast_ml?: number | null;
  actual_contrast_ml?: number | null;
  contrast_reduction_percent?: number | null;
  zero_contrast_completed?: boolean;
}
