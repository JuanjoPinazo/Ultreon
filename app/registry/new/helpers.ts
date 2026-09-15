import { ECRFFormData, createEmptyUltreonFormData } from './types';
import { UltreonRegistryV3Form } from '@/schemas/ultreon-registry-v3';
import { UltreonRegistryCase } from '@/types/ultreon-registry-v3';

/**
 * Priority 8: Stale Data Cleanup
 * Cleans the formData based on conditions before submitting to Supabase.
 * Ensures hidden modules/fields don't send orphaned data.
 */
export function cleanFormData(data: ECRFFormData): ECRFFormData {
  const cleaned = { ...data };

  // 1. Pullbacks cleanup based on count
  cleaned.pullbacks = cleaned.pullbacks.slice(0, cleaned.pullback_count);

  // 2. Acquisition specific fields (Fast Pullback)
  cleaned.pullbacks = cleaned.pullbacks.map(pb => {
    if (pb.speed !== '75 Fast') {
      return {
        ...pb,
        fast_wash_medium: undefined,
        fast_volume_ml: undefined,
        fast_flow: undefined,
        fast_ease_of_use: undefined,
        fast_blood_clearance: undefined,
        fast_clinically_acceptable: undefined,
        fast_time_impact: undefined,
        wash_quality: undefined,
      };
    }
    return pb;
  });

  // 3. Modules conditions
  const hasCalcium = cleaned.lesion_type.includes('Lesión calcificada') || 
                     cleaned.oct_findings.some(f => f.includes('Calcio') || f.includes('calcio'));
  
  if (!hasCalcium) {
    cleaned.perception_accuracy_calcium = undefined;
    cleaned.ease_of_interpretation_calcium = undefined;
    cleaned.clinical_utility_calcium = undefined;
    cleaned.auto_detect_added_info_calcium = undefined;
    cleaned.influenced_decision_calcium = undefined;
    cleaned.improvement_ideas_calcium = undefined;
    cleaned.changed_prep_strategy_calcium = undefined;
    cleaned.calcium_treatment_chosen = undefined;
    cleaned.different_strategy_without_ultreon_calcium = undefined;
  }

  // Lipid is purely functional usage based, assuming logic relies on checking a box or findings
  const hasLipid = cleaned.oct_findings.some(f => f.includes('lípido') || f.includes('Lípido') || f.includes('lipídica') || f.includes('Lipídica'));
  if (!hasLipid) {
    cleaned.perception_accuracy_lipid = undefined;
    cleaned.ease_of_interpretation_lipid = undefined;
    cleaned.clinical_utility_lipid = undefined;
    cleaned.auto_detect_added_info_lipid = undefined;
    cleaned.influenced_decision_lipid = undefined;
    cleaned.improvement_ideas_lipid = undefined;
  }

  const hasTci = cleaned.pullbacks.some(pb => pb.vessel === 'LM' || pb.vessel === 'Left Main');
  if (!hasTci) {
    cleaned.guide_catheter_size = undefined;
    cleaned.tci_location = undefined;
    cleaned.tci_feasibility = undefined;
    cleaned.blood_clearance_tci = undefined;
    cleaned.clearance_acceptable_tci = undefined;
    cleaned.routine_use_tci = undefined;
    cleaned.most_contributing_feature_tci = undefined;
    cleaned.modified_strategy_tci = undefined;
    cleaned.what_was_modified_tci = [];
  }

  if (!cleaned.ffr_oct_used) {
    cleaned.ffr_oct_changed_decision = undefined;
    cleaned.ffr_oct_decision_change = undefined;
    cleaned.ffr_oct_scenario = undefined;
    cleaned.blood_clearance_ffr_oct = undefined;
    cleaned.pullback_corrections_made = undefined;
    cleaned.ffr_oct_confidence = undefined;
  }

  // 4. Strategy changes cleanup
  if (cleaned.oct_influenced_strategy_change === false) {
    cleaned.strategy_change_details = [];
  }

  // 5. Post PCI cleanup
  if (cleaned.oct_performed_post === false) {
    cleaned.residual_findings = [];
    cleaned.additional_treatment_required = '';
    cleaned.additional_treatment_type = '';
    cleaned.additional_treatment_other = '';
  }

  return cleaned;
}

/**
 * Priority 1: Data Contract
 * Maps the cleaned ECRFFormData to the ultreonRegistryV3Schema expected by Supabase.
 */
export function preparePayloadForSubmit(data: ECRFFormData): UltreonRegistryV3Form {
  const hasCalcium = data.lesion_type.includes('Lesión calcificada') || 
                     data.oct_findings.some(f => f.includes('Calcio') || f.includes('calcio'));
                     
  const hasLipid = data.oct_findings.some(f => f.includes('lípido') || f.includes('Lípido') || f.includes('lipídica') || f.includes('Lipídica'));
  const hasTci = data.pullbacks.some(pb => pb.vessel === 'LM' || pb.vessel === 'Left Main');

  return {
    hospital_id: data.centroMedico, // Assuming this gets mapped to a UUID externally or handled by action
    operator_id: data.operador,
    procedure_date: data.fechaProcedimiento,
    anonymous_code: data.idPaciente,
    status: 'COMPLETED', // Or DRAFT if saving partial
    is_demo: !!data.is_demo,
    
    ultreon_changed_strategy: !!data.oct_influenced_strategy_change,
    incremental_diagnostic_yield: !!data.oct_provided_new_info,
    post_pci_correction_needed: data.additional_treatment_required === 'yes',
    calcium_impacted_decision: hasCalcium ? !!data.influenced_decision_calcium : null,
    ffr_oct_impacted_decision: data.ffr_oct_used ? !!data.ffr_oct_changed_decision : null,
    expected_oct_utilization_increase: data.expected_oct_utilization_increase,

    core_data: {
      operator_experience_oct: data.operator_experience_oct as any,
      operator_experience_level_oct: data.operator_experience_level_oct as any,
      image_usage_oct: data.image_usage_oct,
      image_usage_ivus: data.image_usage_ivus,
      image_usage_angio: data.image_usage_angio,
      operator_experience_ultreon: data.operator_experience_ultreon as any,
      clinical_presentation: data.clinical_presentation,
      lesion_type: data.lesion_type,
      oct_indication: data.oct_indication,
      planned_strategy_angio: data.planned_strategy_angio,
      strategy_change_details: data.strategy_change_details,
    },
    
    acquisition_data: {
      pullback_count: data.pullback_count,
      pullbacks: data.pullbacks.map(pb => ({
        id: pb.id || crypto.randomUUID(),
        type: pb.type,
        vessel: pb.vessel,
        speed: pb.speed,
        coregistration_used: pb.coregistration_used,
        co_registration_impact: pb.co_registration_impact,
        fps: pb.fps,
        wash_quality: pb.wash_quality,
        fast_wash_medium: pb.fast_wash_medium,
        fast_volume_ml: pb.fast_volume_ml ? Number(pb.fast_volume_ml) : undefined,
        fast_flow: pb.fast_flow ? Number(pb.fast_flow) : undefined,
        fast_ease_of_use: pb.fast_ease_of_use,
        fast_blood_clearance: pb.fast_blood_clearance,
        fast_time_impact: pb.fast_time_impact,
      }))
    },
    
    findings_data: {
      oct_findings: data.oct_findings,
      oct_provided_new_info: !!data.oct_provided_new_info,
      oct_influenced_strategy_change: !!data.oct_influenced_strategy_change
    },

    calcium_module: hasCalcium ? {
      has_calcium_module: true,
      perception_accuracy: data.perception_accuracy_calcium,
      ease_of_interpretation: data.ease_of_interpretation_calcium,
      clinical_utility: data.clinical_utility_calcium,
      auto_detect_added_info: data.auto_detect_added_info_calcium,
      influenced_decision: data.influenced_decision_calcium,
      improvement_ideas: data.improvement_ideas_calcium,
      changed_prep_strategy: data.changed_prep_strategy_calcium,
      calcium_treatment_chosen: data.calcium_treatment_chosen,
      different_strategy_without_ultreon: data.different_strategy_without_ultreon_calcium,
    } : null,

    lipid_module: hasLipid ? {
      has_lipid_module: true,
      perception_accuracy: data.perception_accuracy_lipid,
      ease_of_interpretation: data.ease_of_interpretation_lipid,
      clinical_utility: data.clinical_utility_lipid,
      auto_detect_added_info: data.auto_detect_added_info_lipid,
      influenced_decision: data.influenced_decision_lipid,
      improvement_ideas: data.improvement_ideas_lipid,
    } : null,

    left_main_module: hasTci ? {
      has_left_main_module: true,
      guide_catheter_size: data.guide_catheter_size,
      tci_location: data.tci_location,
      tci_feasibility: data.tci_feasibility,
      blood_clearance: data.blood_clearance_tci,
      clearance_acceptable: data.clearance_acceptable_tci,
      routine_use_tci: data.routine_use_tci,
      most_contributing_feature: data.most_contributing_feature_tci,
      modified_strategy: data.modified_strategy_tci,
      what_was_modified: data.what_was_modified_tci,
    } : null,

    ffr_oct_module: data.ffr_oct_used ? {
      has_ffr_oct_module: true,
      ffr_oct_used: data.ffr_oct_used,
      ffr_oct_changed_decision: data.ffr_oct_changed_decision,
      ffr_oct_decision_change: data.ffr_oct_decision_change,
      ffr_oct_scenario: data.ffr_oct_scenario,
      blood_clearance: data.blood_clearance_ffr_oct,
      pullback_corrections_made: data.pullback_corrections_made,
      ffr_oct_confidence: data.ffr_oct_confidence,
    } : null,

    global_assessment: {
      main_benefit: data.main_benefit,
      highest_impact_feature: data.highest_impact_feature,
      global_usability: data.global_usability,
      expected_oct_utilization_increase: data.expected_oct_utilization_increase,
      future_indications: data.future_indications,
      highest_potential_feature: data.highest_potential_feature,
      final_comments: data.final_comments,
      post_pci_data: data.oct_performed_post ? {
        oct_performed: true,
        residual_findings: data.residual_findings,
        additional_treatment_required: (data.additional_treatment_required === 'yes' || data.additional_treatment_required === 'no') ? data.additional_treatment_required : undefined,
        additional_treatment_type: data.additional_treatment_type,
        additional_treatment_other: data.additional_treatment_other,
      } : { oct_performed: false }
    }
  };
}

/**
 * Priority 4: Edit Mode Mapping
 * Maps an existing Supabase record back to the ECRFFormData structure for the UI.
 * Provides safe defaults for missing fields to prevent crashes on older records.
 */
export function mapPersistedCaseToFormData(dbRecord: any): ECRFFormData {
  if (!dbRecord) return createEmptyUltreonFormData();

  const core = dbRecord.core_data || {};
  const acq = dbRecord.acquisition_data || { pullbacks: [] };
  const findings = dbRecord.findings_data || {};
  const calc = dbRecord.calcium_module || {};
  const lipid = dbRecord.lipid_module || {};
  const tci = dbRecord.left_main_module || {};
  const ffr = dbRecord.ffr_oct_module || {};
  const global = dbRecord.global_assessment || {};

  return {
    ...createEmptyUltreonFormData(), // fallback for missing fields

    is_demo: !!dbRecord.is_demo,
    centroMedico: dbRecord.hospital_id || '',
    operador: dbRecord.operator_id || '',
    fechaProcedimiento: dbRecord.procedure_date || '',
    idPaciente: dbRecord.anonymous_code || '',

    operator_experience_oct: core.operator_experience_oct || '',
    operator_experience_level_oct: core.operator_experience_level_oct || '',
    image_usage_oct: core.image_usage_oct,
    image_usage_ivus: core.image_usage_ivus,
    image_usage_angio: core.image_usage_angio,
    operator_experience_ultreon: core.operator_experience_ultreon || '',
    clinical_presentation: core.clinical_presentation || '',
    lesion_type: Array.isArray(core.lesion_type) ? core.lesion_type : (core.lesion_type ? [core.lesion_type] : []),
    oct_indication: core.oct_indication || '',
    pullback_count: acq.pullback_count || acq.pullbacks?.length || 0,
    
    pullbacks: (acq.pullbacks || []).map((pb: any) => ({
      ...pb,
      fast_volume_ml: pb.fast_volume_ml !== undefined ? String(pb.fast_volume_ml) : '',
      fast_flow: pb.fast_flow !== undefined ? String(pb.fast_flow) : '',
    })),

    planned_strategy_angio: core.planned_strategy_angio || '',
    
    oct_findings: Array.isArray(findings.oct_findings) ? findings.oct_findings : [],
    oct_provided_new_info: findings.oct_provided_new_info ?? null,
    oct_influenced_strategy_change: findings.oct_influenced_strategy_change ?? null,

    // Calcium
    perception_accuracy_calcium: calc.perception_accuracy,
    ease_of_interpretation_calcium: calc.ease_of_interpretation,
    clinical_utility_calcium: calc.clinical_utility,
    auto_detect_added_info_calcium: calc.auto_detect_added_info,
    influenced_decision_calcium: calc.influenced_decision,
    improvement_ideas_calcium: calc.improvement_ideas || '',
    changed_prep_strategy_calcium: calc.changed_prep_strategy,
    calcium_treatment_chosen: calc.calcium_treatment_chosen || '',
    different_strategy_without_ultreon_calcium: calc.different_strategy_without_ultreon || '',

    // Lipid
    perception_accuracy_lipid: lipid.perception_accuracy,
    ease_of_interpretation_lipid: lipid.ease_of_interpretation,
    clinical_utility_lipid: lipid.clinical_utility,
    auto_detect_added_info_lipid: lipid.auto_detect_added_info,
    influenced_decision_lipid: lipid.influenced_decision,
    improvement_ideas_lipid: lipid.improvement_ideas || '',

    // TCI
    guide_catheter_size: tci.guide_catheter_size || '',
    tci_location: tci.tci_location || '',
    tci_feasibility: tci.tci_feasibility,
    blood_clearance_tci: tci.blood_clearance,
    clearance_acceptable_tci: tci.clearance_acceptable,
    routine_use_tci: tci.routine_use_tci,
    most_contributing_feature_tci: tci.most_contributing_feature || '',
    modified_strategy_tci: tci.modified_strategy,
    what_was_modified_tci: Array.isArray(tci.what_was_modified) ? tci.what_was_modified : [],

    // FFR-OCT
    ffr_oct_used: ffr.ffr_oct_used,
    ffr_oct_changed_decision: ffr.ffr_oct_changed_decision,
    ffr_oct_decision_change: ffr.ffr_oct_decision_change || '',
    ffr_oct_scenario: ffr.ffr_oct_scenario || '',
    blood_clearance_ffr_oct: ffr.blood_clearance,
    pullback_corrections_made: ffr.pullback_corrections_made,
    ffr_oct_confidence: ffr.ffr_oct_confidence,

    // Impact
    strategy_change_details: Array.isArray(core.strategy_change_details) ? core.strategy_change_details : (core.strategy_change_details ? [core.strategy_change_details] : []),
    oct_performed_post: global.post_pci_data?.oct_performed ?? null,
    residual_findings: Array.isArray(global.post_pci_data?.residual_findings) ? global.post_pci_data.residual_findings : [],
    additional_treatment_required: global.post_pci_data?.additional_treatment_required || '',
    additional_treatment_type: global.post_pci_data?.additional_treatment_type || '',
    additional_treatment_other: global.post_pci_data?.additional_treatment_other || '',

    // Closure
    main_benefit: global.main_benefit || '',
    highest_impact_feature: global.highest_impact_feature || '',
    global_usability: global.global_usability || 4,
    expected_oct_utilization_increase: global.expected_oct_utilization_increase || '',
    expected_oct_utilization_drivers: Array.isArray(global.expected_oct_utilization_drivers) ? global.expected_oct_utilization_drivers : [],
    future_indications: Array.isArray(global.future_indications) ? global.future_indications : [],
    highest_potential_feature: global.highest_potential_feature || '',
    final_comments: global.final_comments || ''
  };
}
