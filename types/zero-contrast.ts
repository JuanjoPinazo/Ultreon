export interface ZeroContrastRecord {
  id: string;
  hospital_id: string;
  operator_id: string;
  procedure_date: string;
  patient_code: string;
  local_nhc?: string | null;
  local_sip?: string | null;
  anonymous_code?: string | null;
  
  // Anatomy
  coronary_segment: string;
  coronary_vessel?: string | null;
  coronary_group?: string | null;
  
  // Projections
  projection_horizontal?: string | null;
  projection_vertical?: string | null;
  axial_rotation?: number | null;
  
  // Saline protocol
  saline_protocol_used?: boolean;
  syringe_size_ml?: number | null;
  fast_pullback_seconds?: number | null;
  contrast_during_oct_ml: number;
  total_contrast_ml?: number | null;
  wash_quality: string;
  
  // Contrast conversion
  contrast_conversion_needed?: boolean;
  contrast_conversion_reason?: string | null;
  
  // ULTREON AI
  ultreon_calcium?: boolean;
  border_disection?: boolean;
  ultreon_calcium_arc_gt_180?: boolean;
  ultreon_eel_detected?: boolean;
  lesion_length_mm?: number | null;
  proximal_reference_mm?: number | null;
  distal_reference_mm?: number | null;
  mla_mm2?: number | null;
  
  // Optimization
  final_stent_expansion_percent?: number | null;
  
  // Strategy
  ultreon_modified_strategy?: boolean;
  strategy_change_type?: string | null;
  strategy_change_notes?: string | null;
  
  // Management
  case_status?: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ZeroContrastInsertPayload = Omit<
  ZeroContrastRecord,
  'id' | 'created_at' | 'updated_at' | 'created_by'
> & {
  created_by?: string;
};
