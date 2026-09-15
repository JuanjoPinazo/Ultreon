// Core Entity
export interface UltreonRegistryCase {
  id: string;
  hospital_id: string;
  operator_id: string;
  procedure_date: string;
  anonymous_code: string;
  
  // KPI Relational Columns
  ultreon_changed_strategy: boolean;
  incremental_diagnostic_yield: boolean;
  post_pci_correction_needed: boolean | null;
  calcium_impacted_decision: boolean | null;
  ffr_oct_impacted_decision: boolean | null;
  expected_oct_utilization_increase: string;
  
  // Status and Metadata
  status: 'DRAFT' | 'COMPLETED';
  schema_version: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;

  // JSONB Modules
  core_data: CoreData;
  acquisition_data: AcquisitionData;
  findings_data: FindingsData;
  calcium_module: CalciumModule | null;
  lipid_module: LipidModule | null;
  left_main_module: LeftMainModule | null;
  ffr_oct_module: FfrOctModule | null;
  global_assessment: GlobalAssessment;
}

export interface CoreData {
  operator_experience_oct: '<1_year' | '1_3_years' | '3_5_years' | '>5_years';
  operator_experience_ultreon: 'first_use' | 'occasional_user' | 'habitual_user';
  clinical_presentation: 'Stable Angina' | 'NSTEMI' | 'STEMI' | 'Silent Ischemia' | 'Other';
  lesion_type: string[];
  oct_indication: string;
  planned_strategy_angio: string;
  strategy_change_details?: string[];
}

export interface OCTPullback {
  id: string;
  type: 'PRE' | 'POST';
  vessel: string;
  speed: '75 Fast' | '75 Standard' | '54 High Resolution';
  co_registration: boolean | null;
  co_registration_impact?: number;
  fps: number;
  wash_quality?: string;
  // Fast Pullback specific
  fast_wash_medium?: string;
  fast_volume_ml?: number;
  fast_flow?: number;
  fast_ease_of_use?: number;
  fast_blood_clearance?: number;
  fast_clinically_acceptable?: boolean;
  fast_time_impact?: number;
}

export interface AcquisitionData {
  pullback_count: number;
  pullbacks: OCTPullback[];
}

export interface FindingsData {
  oct_findings: string[];
  new_info_from_oct?: boolean;
}

export interface CalciumModule {
  has_calcium_module: boolean;
  perception_accuracy?: number;
  ease_of_interpretation?: number;
  clinical_utility?: number;
  auto_detect_added_info?: boolean;
  influenced_decision?: boolean;
  improvement_ideas?: string;
  changed_prep_strategy?: boolean;
  calcium_treatment_chosen?: string;
  different_strategy_without_ultreon?: string;
}

export interface LipidModule {
  has_lipid_module: boolean;
  lipid_impacted_decision?: boolean;
  perception_accuracy?: number;
  ease_of_interpretation?: number;
  clinical_utility?: number;
  auto_detect_added_info?: boolean;
  influenced_decision?: boolean;
  improvement_ideas?: string;
}

export interface LeftMainModule {
  has_left_main_module: boolean;
  left_main_impacted_decision?: boolean;
  guide_catheter_size?: string;
  tci_location?: string;
  tci_feasibility?: number;
  clinically_acceptable?: boolean;
  blood_clearance?: number;
  clearance_acceptable?: boolean;
  routine_use_tci?: boolean;
  most_contributing_feature?: string;
  modified_strategy?: boolean;
  what_was_modified?: string[];
}

export interface FfrOctModule {
  has_ffr_oct_module: boolean;
  ffr_oct_used?: boolean;
  ffr_oct_changed_decision?: boolean;
  ffr_oct_decision_change?: string;
  ffr_oct_scenario?: string;
  ffr_oct_confidence?: number;
  ffr_oct_routine_use?: boolean;
}

export interface PostPciData {
  oct_performed: boolean;
  residual_findings?: string[];
  additional_treatment_required?: 'yes' | 'no';
  additional_treatment_type?: string;
  additional_treatment_other?: string;
}

export interface GlobalAssessment {
  main_benefit: string;
  highest_impact_feature: string;
  global_usability: number;
  comparison_with_previous: number;
  different_procedure_without_ultreon?: boolean;
  expected_oct_utilization_increase?: string;
  expected_oct_utilization_drivers?: string[];
  future_indications?: string[];
  highest_potential_feature?: string;
  post_pci_data?: PostPciData;
  final_comments?: string;
}
