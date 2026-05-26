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
 * Computes the exploratory OPSTAR Optimization Score (0-100).
 * Based on 7 clinical criteria.
 */
export function calculateOpstarScore(data: {
  actualContrast: number | '';
  ffrOct: number | '';
  landingZone: string;
  diametroReferenciaVaso: number | '';
  modificoEstrategiaUltreon: boolean;
  adequateExpansion: 'yes' | 'no' | 'na';
  significantMalapposition: 'yes' | 'no' | 'na';
  proximalEdgeDissection: boolean;
  distalEdgeDissection: boolean;
}): number {
  let score = 0;

  // 1. Zero contrast completed (+15)
  if (data.actualContrast !== '' && data.actualContrast === 0) {
    score += 15;
  }

  // 2. FFR-OCT used (+10)
  if (data.ffrOct !== '' && data.ffrOct !== null) {
    score += 10;
  }

  // 3. EEL reference / landing zone registered (+10)
  // Deemed complete if EEL is guided by IA or a valid diameter is registered
  if (
    data.landingZone === 'GUIADO_IA_EEL' ||
    (data.landingZone !== '' && data.diametroReferenciaVaso !== '' && data.diametroReferenciaVaso > 0)
  ) {
    score += 10;
  }

  // 4. ULTREON modified strategy (+15)
  if (data.modificoEstrategiaUltreon) {
    score += 15;
  }

  // 5. Expansion adequate (+20)
  if (data.adequateExpansion === 'yes') {
    score += 20;
  }

  // 6. No significant malapposition (+15)
  if (data.significantMalapposition === 'no') {
    score += 15;
  }

  // 7. No significant edge dissection (+15)
  if (!data.proximalEdgeDissection && !data.distalEdgeDissection) {
    score += 15;
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
