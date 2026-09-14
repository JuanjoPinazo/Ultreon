import { z } from 'zod';

export const octPullbackSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['PRE', 'POST']),
  vessel: z.enum(['LAD', 'LCX', 'RCA', 'LM', 'Ramus', 'Bypass']),
  speed: z.enum(['75 Fast', '75 Standard', '54 High Resolution']),
  co_registration: z.boolean(),
  fps: z.number().positive(),
  wash_quality: z.enum(['Excellent', 'Good', 'Poor']).optional(),
}).refine(data => {
  if (data.speed === '75 Fast' && !data.wash_quality) return false;
  return true;
}, { message: "Seleccione la calidad de lavado para Fast Pullback.", path: ["wash_quality"] });

export const coreDataSchema = z.object({
  operator_experience_oct: z.enum(['<1_year', '1_3_years', '3_5_years', '>5_years']),
  operator_experience_ultreon: z.enum(['first_use', 'occasional_user', 'habitual_user']),
  clinical_presentation: z.enum(['Stable Angina', 'NSTEMI', 'STEMI', 'Silent Ischemia', 'Other']),
  lesion_type: z.enum(['De novo', 'In-stent restenosis', 'Bypass graft', 'Other']),
  oct_indication: z.enum(['Pre-PCI Assessment', 'Stent Optimization', 'Both']),
  planned_strategy_angio: z.enum(['Direct Stenting', 'Predilatation', 'Plaque Modification', 'Medical Therapy', 'CABG']),
  strategy_change_details: z.string().optional(),
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
  expected_oct_utilization_increase: z.enum(['all_cases', 'majority_gt_50', 'selected_lt_50', 'no_increase']),
  expected_oct_utilization_drivers: z.array(z.string()).optional(),
  
  status: z.enum(['DRAFT', 'COMPLETED']),
  
  core_data: coreDataSchema,
  acquisition_data: z.object({ pullbacks: z.array(octPullbackSchema) }),
  findings_data: z.object({ oct_findings: z.array(z.string()) }),
  
  calcium_module: z.object({ 
    has_calcium_module: z.boolean(), 
    calcium_treatment_chosen: z.string().optional() 
  }).nullable(),
  
  lipid_module: z.object({ 
    has_lipid_module: z.boolean(), 
    lipid_impacted_decision: z.boolean().optional() 
  }).nullable(),
  
  left_main_module: z.object({ 
    has_left_main_module: z.boolean(), 
    left_main_impacted_decision: z.boolean().optional() 
  }).nullable(),
  
  ffr_oct_module: z.object({ 
    has_ffr_oct_module: z.boolean(),
    ffr_oct_used: z.boolean().optional(),
    ffr_oct_changed_decision: z.boolean().optional(),
    ffr_oct_decision_change: z.string().optional(),
    ffr_oct_scenario: z.enum(['intermediate_lesion', 'left_main', 'diffuse_disease', 'multivessel', 'ISR', 'other']).optional(),
    ffr_oct_confidence: z.number().min(1).max(7).optional(),
    ffr_oct_routine_use: z.boolean().optional()
  }).nullable(),
  
  global_assessment: z.object({
    main_benefit: z.enum(['lesion_characterization', 'stent_selection', 'pci_optimization', 'confidence', 'less_contrast', 'efficiency', 'avoided_unnecessary_treatment', 'other']),
    main_benefit_other: z.string().optional(),
    highest_impact_feature: z.enum(['fast_pullback', 'auto_coregistration', 'ai_lipid_morphology', 'ffr_oct', 'left_main_imaging', 'other']),
    highest_impact_feature_other: z.string().optional(),
    global_usability: z.number().min(1).max(7),
    comparison_with_previous: z.number().min(1).max(7),
    future_indications: z.string().optional(),
    highest_potential_feature: z.string().optional(),
    post_pci_data: z.object({
      additional_treatment_required: z.enum(['yes', 'no']),
      additional_treatment_type: z.enum(['postdilatation', 'additional_stent', 'both', 'other']).optional(),
      additional_treatment_other: z.string().optional(),
      residual_findings: z.array(z.string()),
    }).optional(),
  })
});

export type UltreonRegistryV3Form = z.infer<typeof ultreonRegistryV3Schema>;
