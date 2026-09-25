export interface ECRFFormData {
  // Step 1: Caso
  centroMedico: string;
  operador: string;
  fechaProcedimiento: string;
  idPaciente: string;
  
  operator_experience_oct: string;
  operator_experience_level_oct: string;
  image_usage_oct?: number;
  image_usage_ivus?: number;
  image_usage_angio?: number;
  operator_experience_ultreon: string;
  clinical_presentation: string;
  lesion_type: string[];
  oct_indication: string;
  pullback_count: number;
  
  // Step 2: Adquisicion
  pullbacks: any[]; // will hold OCTPullback data

  // Status and Meta
  status: 'DRAFT' | 'COMPLETED';
  is_demo: boolean;
  
  // Step 3: Estrategia Inicial
  planned_strategy_angio: string;

  // Step 4: Hallazgos OCT
  oct_findings: string[];
  oct_provided_new_info?: boolean | null;
  oct_influenced_strategy_change?: boolean | null;
  
  // Calcium
  calcium_not_applicable?: boolean;
  calcium_not_applicable_reason?: string;
  perception_accuracy_calcium?: number;
  ease_of_interpretation_calcium?: number;
  clinical_utility_calcium?: number;
  auto_detect_added_info_calcium?: boolean;
  influenced_decision_calcium?: boolean;
  improvement_ideas_calcium?: string;
  changed_prep_strategy_calcium?: boolean;
  calcium_treatment_chosen?: string;
  different_strategy_without_ultreon_calcium?: string;

  // Lipid
  lipid_not_applicable?: boolean;
  lipid_not_applicable_reason?: string;
  perception_accuracy_lipid?: number;
  ease_of_interpretation_lipid?: number;
  clinical_utility_lipid?: number;
  auto_detect_added_info_lipid?: boolean;
  influenced_decision_lipid?: boolean;
  improvement_ideas_lipid?: string;

  // TCI
  guide_catheter_size?: string;
  tci_location?: string;
  tci_feasibility?: number;
  blood_clearance_tci?: number;
  clearance_acceptable_tci?: boolean;
  routine_use_tci?: boolean;
  most_contributing_feature_tci?: string;
  modified_strategy_tci?: boolean;
  what_was_modified_tci?: string[];

  // FFR-OCT
  ffr_oct_used?: boolean;
  ffr_oct_changed_decision?: boolean;
  ffr_oct_decision_change?: string;
  ffr_oct_scenario?: string;
  blood_clearance_ffr_oct?: number;
  pullback_corrections_made?: boolean;
  ffr_oct_confidence?: number;

  // Step 5: Impacto y Optimizacion
  strategy_change_details: string[];
  oct_performed_post: boolean | null;
  residual_findings: string[];
  additional_treatment_required: 'yes' | 'no' | '';
  additional_treatment_type: string;
  additional_treatment_other: string;

  // Step 6: Valor y Cierre
  main_benefit: string;
  main_benefit_other?: string;
  highest_impact_feature: string;
  highest_impact_feature_other?: string;
  global_usability?: number;
  expected_oct_utilization_increase: string;
  expected_oct_utilization_drivers: string[];
  future_indications: string[];
  highest_potential_feature: string;
  final_comments: string;
}

export const createEmptyUltreonFormData = (): ECRFFormData => ({
  centroMedico: '',
  operador: '',
  fechaProcedimiento: '', // Required to be selected
  idPaciente: '',
  
  operator_experience_oct: '',
  operator_experience_level_oct: '',
  operator_experience_ultreon: '',
  clinical_presentation: '',
  lesion_type: [],
  oct_indication: '',
  pullback_count: 1,
  pullbacks: [{
    id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(7),
    type: '',
    vessel: '',
    speed: '',
    coregistration_used: null
  }],
  status: 'DRAFT',
  is_demo: false,
  
  planned_strategy_angio: '',
  
  oct_findings: [],
  oct_provided_new_info: null,
  oct_influenced_strategy_change: null,
  
  calcium_not_applicable: false,
  calcium_not_applicable_reason: '',
  lipid_not_applicable: false,
  lipid_not_applicable_reason: '',
  
  strategy_change_details: [],
  oct_performed_post: null,
  residual_findings: [],
  additional_treatment_required: '',
  additional_treatment_type: '',
  additional_treatment_other: '',
  
  main_benefit: '',
  highest_impact_feature: '',
  global_usability: undefined,
  expected_oct_utilization_increase: '',
  expected_oct_utilization_drivers: [],
  future_indications: [],
  highest_potential_feature: '',
  final_comments: ''
});
