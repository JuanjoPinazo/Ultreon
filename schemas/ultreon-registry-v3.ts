import { z } from 'zod';

export const octPullbackSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['PRE-PCI', 'POST-PCI', 'SEGUIMIENTO']),
  vessel: z.string(),
  speed: z.enum(['75 Fast', '75 Standard', '54 High Resolution']),
  coregistration_used: z.enum(['yes', 'no', 'not_available']).optional(),
  co_registration_impact: z.number().optional(),
  fps: z.number().positive().optional(),
  wash_quality: z.string().optional(),
  
  fast_wash_medium: z.string().optional(),
  fast_volume_ml: z.number().optional(),
  fast_flow: z.number().optional(),
  fast_ease_of_use: z.number().optional(),
  fast_blood_clearance: z.number().optional(),
  fast_clinically_acceptable: z.boolean().optional(),
  fast_time_impact: z.number().optional()
});

export const coreDataSchema = z.object({
  operator_experience_oct: z.enum(['<1 año', '1-3 años', '3-5 años', '>5 años']),
  operator_experience_level_oct: z.enum(['Usuario experto', 'Usuario habitual', 'Usuario ocasional']),
  image_usage_oct: z.number().min(1).max(10).optional(),
  image_usage_ivus: z.number().min(1).max(10).optional(),
  image_usage_angio: z.number().min(1).max(10).optional(),
  operator_experience_ultreon: z.enum(['Primeras utilizaciones', 'Usuario reciente', 'Usuario experimentado']),
  clinical_presentation: z.string(),
  lesion_type: z.array(z.string()),
  oct_indication: z.string(),
  planned_strategy_angio: z.string(),
  strategy_change_details: z.array(z.string()).optional(),
});

export const ultreonRegistryV3Schema = z.object({
  hospital_id: z.string().uuid().min(1, 'Este campo es obligatorio.'),
  operator_id: z.string().uuid().min(1, 'Este campo es obligatorio.'),
  procedure_date: z.string().min(1, 'Este campo es obligatorio.'),
  anonymous_code: z.string().min(1, 'Este campo es obligatorio.'),
  
  ultreon_changed_strategy: z.boolean(),
  incremental_diagnostic_yield: z.boolean(),
  post_pci_correction_needed: z.boolean().nullable(),
  calcium_impacted_decision: z.boolean().nullable(),
  ffr_oct_impacted_decision: z.boolean().nullable(),
  expected_oct_utilization_increase: z.string(),
  
  status: z.enum(['DRAFT', 'COMPLETED']),
  is_demo: z.boolean().default(false),
  
  core_data: coreDataSchema,
  acquisition_data: z.object({ 
    pullback_count: z.number(),
    pullbacks: z.array(octPullbackSchema) 
  }),
  findings_data: z.object({ 
    oct_findings: z.array(z.string()),
    oct_provided_new_info: z.boolean().optional(),
    oct_influenced_strategy_change: z.boolean().optional()
  }),
  
  calcium_module: z.object({ 
    has_calcium_module: z.boolean(),
    perception_accuracy: z.number().optional(),
    ease_of_interpretation: z.number().optional(),
    clinical_utility: z.number().optional(),
    auto_detect_added_info: z.boolean().optional(),
    influenced_decision: z.boolean().optional(),
    improvement_ideas: z.string().optional(),
    changed_prep_strategy: z.boolean().optional(),
    calcium_treatment_chosen: z.string().optional(),
    different_strategy_without_ultreon: z.string().optional()
  }).nullable(),
  
  lipid_module: z.object({ 
    has_lipid_module: z.boolean(), 
    lipid_impacted_decision: z.boolean().optional(),
    perception_accuracy: z.number().optional(),
    ease_of_interpretation: z.number().optional(),
    clinical_utility: z.number().optional(),
    auto_detect_added_info: z.boolean().optional(),
    influenced_decision: z.boolean().optional(),
    improvement_ideas: z.string().optional()
  }).nullable(),
  
  left_main_module: z.object({ 
    has_left_main_module: z.boolean(), 
    left_main_impacted_decision: z.boolean().optional(),
    guide_catheter_size: z.string().optional(),
    tci_location: z.string().optional(),
    tci_feasibility: z.number().optional(),
    blood_clearance: z.number().optional(),
    clearance_acceptable: z.boolean().optional(),
    routine_use_tci: z.boolean().optional(),
    most_contributing_feature: z.string().optional(),
    modified_strategy: z.boolean().optional(),
    what_was_modified: z.array(z.string()).optional()
  }).nullable(),
  
  ffr_oct_module: z.object({ 
    has_ffr_oct_module: z.boolean(),
    ffr_oct_used: z.boolean().optional(),
    ffr_oct_changed_decision: z.boolean().optional(),
    ffr_oct_decision_change: z.string().optional(),
    ffr_oct_scenario: z.string().optional(),
    blood_clearance: z.number().optional(),
    pullback_corrections_made: z.boolean().optional(),
    ffr_oct_confidence: z.number().optional()
  }).nullable(),
  
  global_assessment: z.object({
    main_benefit: z.string(),
    highest_impact_feature: z.string(),
    global_usability: z.number().optional(),
    expected_oct_utilization_increase: z.string().optional(),
    expected_oct_utilization_drivers: z.array(z.string()).optional(),
    future_indications: z.array(z.string()).optional(),
    highest_potential_feature: z.string().optional(),
    post_pci_data: z.object({
      oct_performed: z.boolean(),
      residual_findings: z.array(z.string()).optional(),
      additional_treatment_required: z.enum(['yes', 'no']).optional(),
      additional_treatment_type: z.string().optional(),
      additional_treatment_other: z.string().optional(),
    }).optional(),
    final_comments: z.string().optional()
  })
});

export type UltreonRegistryV3Form = z.infer<typeof ultreonRegistryV3Schema>;
