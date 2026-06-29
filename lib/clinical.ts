// lib/clinical.ts

/**
 * Calculates the percentage reduction in contrast media volume.
 * Avoids division by zero and rounds to 1 decimal place.
 */
export function calculateContrastReduction(expected: number | '', actual: number | ''): number {
  const exp = expected === '' ? 0 : expected;
  const act = actual === '' ? 0 : actual;

  if (exp <= 0 || act < 0) {
    return 0;
  }

  const reduction = ((exp - act) / exp) * 100;
  return Math.round(reduction * 10) / 10;
}

/**
 * Computes the simplified OPSTAR Optimization Score (0-100).
 * Based on Zero-Contrast protocol and ULTREON findings.
 */
export function calculateOpstarScore(data: {
  actualContrast: number | '';
  contrasteAdquisicionOct: number | '';
  calidadLavado: string;
  necesitoContrasteOct: boolean;
  landingZone: string;
  diametroReferenciaVaso: number | '';
  modificoEstrategiaUltreon: boolean;
  adequateExpansion: 'yes' | 'no' | 'na';
  ultreonExpansionStent: number | '';
  ultreonEel: boolean;
  ultreonCalcio: boolean;
  significantMalapposition: 'yes' | 'no' | 'na';
  proximalEdgeDissection: boolean;
  distalEdgeDissection: boolean;
}): number {
  let score = 0;

  // 1. Zero contrast during OCT acquisition (Primary Endpoint) (+35)
  if (data.contrasteAdquisicionOct === 0 || data.necesitoContrasteOct === false) {
    score += 35;
  }

  // 2. High-quality saline flush (+20)
  if (data.calidadLavado === 'Excelente' || data.calidadLavado === 'Buena') {
    score += 20;
  }

  // 3. EEL / landing zone and calcium indicators registered (+20)
  if (
    data.landingZone === 'GUIADO_IA_EEL' ||
    data.ultreonEel ||
    (data.landingZone !== '' && data.diametroReferenciaVaso !== '' && data.diametroReferenciaVaso > 0)
  ) {
    score += 20;
  }

  // 4. ULTREON modified strategy (+15)
  if (data.modificoEstrategiaUltreon) {
    score += 15;
  }

  // 5. Expansion adequate (+10)
  if (
    data.adequateExpansion === 'yes' ||
    (data.ultreonExpansionStent !== '' && data.ultreonExpansionStent >= 80)
  ) {
    score += 10;
  }

  return score;
}

/**
 * Returns the classification category for a given score.
 */
export function getOpstarScoreCategory(score: number): 'optimal' | 'suboptimal_mild' | 'suboptimal_moderate' | 'high_risk' {
  if (score >= 85) return 'optimal';
  if (score >= 65) return 'suboptimal_mild';
  if (score >= 40) return 'suboptimal_moderate';
  return 'high_risk';
}

/**
 * Returns a user-friendly label in Spanish for the score category.
 */
export function getOpstarScoreCategoryLabel(category: string): string {
  switch (category) {
    case 'optimal':
      return 'Óptimo';
    case 'suboptimal_mild':
      return 'Subóptimo Leve';
    case 'suboptimal_moderate':
      return 'Subóptimo Moderado';
    case 'high_risk':
      return 'Alto Riesgo / Revisar';
    default:
      return 'Desconocido';
  }
}
