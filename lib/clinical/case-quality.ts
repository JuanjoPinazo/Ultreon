/**
 * Case Quality & Data Completeness Calculations
 * Validates clinical data and calculates quality scores
 */

export interface DataQualityWarning {
  code: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  field?: string;
}

export interface CaseCompletenessResult {
  score: number; // 0-100
  warnings: DataQualityWarning[];
  isReadyToComplete: boolean;
  isReadyForCoreLab: boolean;
  isReadyForValidation: boolean;
}

/**
 * Calculate case completeness score and generate warnings
 */
export function calculateCaseCompleteness(caseData: any): CaseCompletenessResult {
  const warnings: DataQualityWarning[] = [];
  let scorePoints = 100;

  // ============ A) MINIMUM CASE DATA ============
  if (!caseData.hospital_id) {
    warnings.push({
      code: 'MISSING_HOSPITAL',
      message: 'Hospital requerido',
      severity: 'error',
      field: 'hospital_id',
    });
    scorePoints -= 10;
  }

  if (!caseData.procedure_date) {
    warnings.push({
      code: 'MISSING_PROCEDURE_DATE',
      message: 'Fecha del procedimiento requerida',
      severity: 'error',
      field: 'procedure_date',
    });
    scorePoints -= 10;
  }

  if (!caseData.vaso_diana) {
    warnings.push({
      code: 'MISSING_VESSEL',
      message: 'Vaso diana requerido',
      severity: 'error',
      field: 'vaso_diana',
    });
    scorePoints -= 5;
  }

  if (!caseData.created_by) {
    warnings.push({
      code: 'MISSING_CREATOR',
      message: 'Creador del caso no registrado',
      severity: 'warning',
      field: 'created_by',
    });
    scorePoints -= 3;
  }

  // ============ B) PRE-PCI ASSESSMENT ============
  const hasPrePciData =
    caseData.ffr_oct !== null ||
    caseData.calcio_ia !== null ||
    caseData.placa_lipida_ia !== null;

  if (!hasPrePciData) {
    warnings.push({
      code: 'MISSING_PREPCI_DATA',
      message: 'Datos pre-PCI incompletos (FFR-OCT, calcio, placa lipídica)',
      severity: 'warning',
    });
    scorePoints -= 5;
  }

  // ============ C) STRATEGY CHANGE ============
  if (caseData.opstar_strategy_changes && caseData.opstar_strategy_changes.length > 0) {
    const strategyChange = caseData.opstar_strategy_changes[0];

    if (strategyChange.cambio_estrategia && !strategyChange.cambio_descripcion) {
      warnings.push({
        code: 'MISSING_STRATEGY_DESCRIPTION',
        message: 'Cambio de estrategia sin descripción',
        severity: 'error',
        field: 'cambio_descripcion',
      });
      scorePoints -= 10;
    }

    if (strategyChange.cambio_estrategia && !strategyChange.change_magnitude) {
      warnings.push({
        code: 'MISSING_STRATEGY_MAGNITUDE',
        message: 'Cambio de estrategia sin magnitud especificada',
        severity: 'warning',
        field: 'change_magnitude',
      });
      scorePoints -= 5;
    }

    // Strategy change without OCT evidence
    if (strategyChange.cambio_estrategia) {
      // This will be checked in the full function with oct_evidence
      warnings.push({
        code: 'STRATEGY_CHANGE_NEEDS_EVIDENCE',
        message: 'Cambio de estrategia requiere evidencia OCT (verificar después)',
        severity: 'info',
      });
    }
  }

  // ============ D) POST-PCI RESULTS ============
  if (caseData.opstar_optimization_results && caseData.opstar_optimization_results.length > 0) {
    const optimization = caseData.opstar_optimization_results[0];

    if (!optimization.msa) {
      warnings.push({
        code: 'MISSING_MSA',
        message: 'Área de stent mínima (MSA) no registrada',
        severity: 'warning',
        field: 'msa',
      });
      scorePoints -= 5;
    }

    if (!optimization.stent_expansion_percent) {
      warnings.push({
        code: 'MISSING_EXPANSION',
        message: 'Expansión del stent no calculada',
        severity: 'warning',
        field: 'stent_expansion_percent',
      });
      scorePoints -= 3;
    }

    if (optimization.edge_dissection === null) {
      warnings.push({
        code: 'MISSING_DISSECTION_CHECK',
        message: 'Disección de bordes no evaluada',
        severity: 'info',
        field: 'edge_dissection',
      });
      scorePoints -= 2;
    }
  } else {
    warnings.push({
      code: 'MISSING_POSTPCI_DATA',
      message: 'Resultados post-PCI no completados',
      severity: 'error',
    });
    scorePoints -= 15;
  }

  // ============ E) ZERO-CONTRAST ============
  if (caseData.zero_contrast_completed) {
    if (!caseData.expected_contrast_ml) {
      warnings.push({
        code: 'MISSING_EXPECTED_CONTRAST',
        message: 'Contraste esperado no especificado',
        severity: 'warning',
        field: 'expected_contrast_ml',
      });
      scorePoints -= 3;
    }

    if (!caseData.actual_contrast_ml) {
      warnings.push({
        code: 'MISSING_ACTUAL_CONTRAST',
        message: 'Contraste real no especificado',
        severity: 'warning',
        field: 'actual_contrast_ml',
      });
      scorePoints -= 3;
    }
  }

  // ============ F) OCT EVIDENCE ============
  // This would require oct_evidence data in caseData
  if (caseData.octEvidenceStats) {
    const stats = caseData.octEvidenceStats;

    // Pre-PCI key evidence
    if (!stats.pre_pci_key || stats.pre_pci_key === 0) {
      warnings.push({
        code: 'MISSING_PREPCI_EVIDENCE',
        message: 'Falta evidencia OCT clave pre-PCI',
        severity: 'error',
      });
      scorePoints -= 10;
    }

    // Post-PCI key evidence
    if (!stats.post_pci_key || stats.post_pci_key === 0) {
      warnings.push({
        code: 'MISSING_POSTPCI_EVIDENCE',
        message: 'Falta evidencia OCT clave post-PCI',
        severity: 'error',
      });
      scorePoints -= 10;
    }

    // Strategy change evidence
    if (caseData.opstar_strategy_changes?.[0]?.cambio_estrategia && stats.strategy_change_evidence === 0) {
      warnings.push({
        code: 'STRATEGY_CHANGE_WITHOUT_EVIDENCE',
        message: 'Cambio de estrategia sin evidencia OCT asociada',
        severity: 'error',
      });
      scorePoints -= 10;
    }

    // Core lab validation
    if (stats.pending_corelab > 0) {
      warnings.push({
        code: 'PENDING_CORELAB_VALIDATION',
        message: `${stats.pending_corelab} evidencia(s) pendiente(s) de validación core lab`,
        severity: 'warning',
      });
      scorePoints -= 5;
    }
  }

  // ============ G) FOLLOW-UP DATA ============
  // Warnings for missing follow-ups but not critical for completeness
  const hasFollow30 = caseData.opstar_followup?.some((f: any) => f.followup_type === '30days');
  if (!hasFollow30) {
    warnings.push({
      code: 'MISSING_FOLLOWUP_30',
      message: 'Follow-up a 30 días no completado',
      severity: 'info',
    });
    scorePoints -= 2;
  }

  // Ensure score is 0-100
  const finalScore = Math.max(0, Math.min(100, scorePoints));

  // ============ DETERMINATION LOGIC ============
  const criticalErrors = warnings.filter((w) => w.severity === 'error').length;

  return {
    score: finalScore,
    warnings,
    isReadyToComplete: criticalErrors === 0 && finalScore >= 60,
    isReadyForCoreLab: criticalErrors === 0 && finalScore >= 70,
    isReadyForValidation: finalScore >= 80,
  };
}

/**
 * Get human-readable status color
 */
export function getQualityStatusColor(
  score: number
): 'emerald' | 'yellow' | 'red' | 'slate' {
  if (score >= 90) return 'emerald';
  if (score >= 70) return 'yellow';
  if (score >= 50) return 'red';
  return 'slate';
}

/**
 * Get human-readable status label
 */
export function getQualityStatusLabel(score: number): string {
  if (score >= 90) return 'Excelente';
  if (score >= 70) return 'Bueno';
  if (score >= 50) return 'Aceptable';
  return 'Incompleto';
}

/**
 * Group warnings by severity
 */
export function groupWarningsBySeverity(warnings: DataQualityWarning[]) {
  return {
    errors: warnings.filter((w) => w.severity === 'error'),
    warnings: warnings.filter((w) => w.severity === 'warning'),
    info: warnings.filter((w) => w.severity === 'info'),
  };
}

/**
 * Check if case can be locked
 */
export function canLockCase(caseData: any): boolean {
  const completeness = calculateCaseCompleteness(caseData);
  // Can lock if score >= 80 and no critical errors
  return completeness.score >= 80 && completeness.warnings.filter((w) => w.severity === 'error').length === 0;
}
