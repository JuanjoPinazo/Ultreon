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
  expected_oct_utilization_increase: boolean;
  
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
  lesion_type: 'De novo' | 'In-stent restenosis' | 'Bypass graft' | 'Other';
  oct_indication: 'Pre-PCI Assessment' | 'Stent Optimization' | 'Both';
  planned_strategy_angio: 'Direct Stenting' | 'Predilatation' | 'Plaque Modification' | 'Medical Therapy' | 'CABG';
  strategy_change_details?: string;
}

export interface OCTPullback {
  id: string;
  type: 'PRE' | 'POST';
  vessel: 'LAD' | 'LCX' | 'RCA' | 'LM' | 'Ramus' | 'Bypass';
  speed: '75 Fast' | '75 Standard' | '54 High Resolution';
  co_registration: boolean;
  fps: number;
  wash_quality?: 'Excellent' | 'Good' | 'Poor';
}

export interface AcquisitionData {
  pullbacks: OCTPullback[];
}

export interface FindingsData {
  oct_findings: string[];
}

export interface CalciumModule {
  has_calcium_module: boolean;
  calcium_treatment_chosen: string;
}

export interface LipidModule {
  has_lipid_module: boolean;
  lipid_impacted_decision: boolean;
}

export interface LeftMainModule {
  has_left_main_module: boolean;
  left_main_impacted_decision: boolean;
}

export interface FfrOctModule {
  has_ffr_oct_module: boolean;
  ffr_oct_used?: boolean;
  ffr_oct_changed_decision?: boolean;
  ffr_oct_decision_change?: string;
  ffr_oct_scenario?: 'intermediate_lesion' | 'left_main' | 'diffuse_disease' | 'multivessel' | 'ISR' | 'other';
  ffr_oct_confidence?: number;
  ffr_oct_routine_use?: boolean;
}

export interface PostPciData {
  additional_treatment_required: 'yes' | 'no';
  additional_treatment_type?: 'postdilatation' | 'additional_stent' | 'both' | 'other';
  additional_treatment_other?: string;
  residual_findings: string[];
}

export interface GlobalAssessment {
  main_benefit: string;
  highest_impact_feature: string;
  global_usability: number;
  comparison_with_previous: string;
  future_indications?: string;
  highest_potential_feature?: string;
  post_pci_data?: PostPciData;
}
