// lib/registry/display-labels.ts

/**
 * Diccionario centralizado para traducir las claves JSONB a etiquetas clínicas en español.
 */
export const FIELD_LABELS: Record<string, string> = {
  // Step 1: Case
  clinical_scenario: 'Escenario clínico',
  lesion_type: 'Tipo de lesión',
  oct_indication: 'Indicación para OCT',
  operator_experience_ultreon: 'Experiencia con ULTREON™ 3.0',
  operator_experience_level_oct: 'Nivel de experiencia con OCT',
  operator_experience_oct: 'Experiencia del operador con OCT',
  landing_zone: 'Zona de aterrizaje',
  clinical_presentation: 'Presentación clínica',
  
  // Step 2: Acquisition
  image_usage_angio: 'De cada 10 PCI, ¿en cuántas utiliza solo angiografía?',
  image_usage_ivus: 'De cada 10 PCI, ¿en cuántas utiliza IVUS?',
  image_usage_oct: 'De cada 10 PCI, ¿en cuántas utiliza OCT?',
  
  // Pullback fields
  type: 'Momento de adquisición',
  moment: 'Momento',
  vessel: 'Vaso',
  mode: 'Modo',
  speed: 'Modo de adquisición',
  auto_coregistration: 'Co-registro automático',
  coregistration_used: 'Co-registro automático',
  coregistration_impact: 'Impacto del co-registro',
  fps: 'FPS',
  contrast_type: 'Contraste / Salino',
  volume_ml: 'Volumen',
  flow: 'Flujo',
  ease_of_use: 'Facilidad de uso',
  blood_clearance_quality: 'Calidad de lavado',
  impact_on_decision: 'Impacto',
  
  // Step 3: Strategy
  planned_strategy_angio: 'Estrategia inicialmente planificada mediante angiografía',
  
  // Step 4: Findings
  oct_findings: 'Hallazgos OCT',
  oct_provided_new_info: '¿La OCT aportó información relevante no evidente angiográficamente?',
  oct_influenced_strategy_change: '¿La información OCT influyó en un cambio de estrategia respecto a angiografía?',
  
  // Step 5: Impact / Post-PCI
  post_stent_oct_performed: 'OCT post-stent',
  post_stent_findings: 'Hallazgos',
  additional_treatment_performed: 'Tratamiento adicional',
  additional_treatment_type: 'Tratamiento realizado',
  
  // Step 6: Global / Closure
  main_benefit: 'Principal beneficio clínico observado',
  global_usability: 'Usabilidad global de ULTREON™ 3.0',
  highest_impact_feature: 'Funcionalidad con mayor impacto',
  highest_potential_feature: 'Funcionalidad con mayor potencial',
  expected_oct_utilization_increase: '¿Prevé aumentar la utilización de OCT?',
  final_comments: 'Comentarios finales',
  
  // Modules
  calcium_impacted_decision: '¿Impactó en la decisión?',
  ultreon_changed_strategy: '¿Modificó estrategia?',
  incremental_diagnostic_yield: 'Rendimiento diagnóstico incremental',
  post_pci_correction_needed: '¿Corrección necesaria?',
  ffr_oct_impacted_decision: '¿Impactó en la decisión (FFR)?',
  
  // Extra specific mappings requested
  clinical_utility: 'Utilidad clínica',
  has_calcium_module: 'Módulo de calcio disponible',
  influenced_decision: 'Influyó en la decisión',
  perception_accuracy: 'Precisión percibida',
  auto_detect_added_info: 'La detección automática aportó información adicional',
  ease_of_interpretation: 'Facilidad de interpretación',
  calcium_treatment_chosen: 'Tratamiento del calcio seleccionado',
  different_strategy_without_ultreon: '¿Habría elegido una estrategia diferente sin ULTREON™ 3.0?',
  co_registration_impact: 'Impacto del co-registro'
};

/**
 * Diccionario centralizado para traducir los valores técnicos internos al español clínico.
 */
export const VALUE_TRANSLATIONS: Record<string, string> = {
  // Common
  'true': 'Sí',
  'false': 'No',
  'Yes': 'Sí',
  'No': 'No',
  'yes': 'Sí',
  'no': 'No',
  'not_available': 'No disponible',
  'Not available': 'No disponible',
  
  // Lesion Types / Indications
  'Diffuse disease': 'Enfermedad difusa',
  'Bifurcation': 'Bifurcación',
  'Calcified lesion': 'Lesión calcificada',
  'Left main': 'Tronco común izquierdo',
  'In-stent restenosis': 'Reestenosis intrastent',
  'Stent thrombosis': 'Trombosis del stent',
  'ACS': 'SCA (Síndrome Coronario Agudo)',
  'CCS': 'SCC (Síndrome Coronario Crónico)',
  
  // Operator experience
  'Recent user': 'Usuario reciente',
  'Experienced': 'Experimentado',
  'Expert': 'Experto',
  'Novice': 'Principiante',
  
  // Vessels
  'LAD': 'LAD',
  'LCX': 'LCX',
  'TCI': 'TCI',
  'RCA': 'RCA',
  'Other': 'Otro',
  
  // Modes
  '75 mm Standard': '75 mm Estándar',
  '75 mm Fast': '75 mm Rápido',
  '54 mm High Resolution': '54 mm Alta Resolución',
  
  // Timings
  'Pre-PCI': 'Pre-PCI',
  'Post-PCI': 'Post-PCI',
  'Follow-up': 'Seguimiento',
  'PRE-PCI': 'Pre-PCI',
  'POST-PCI': 'Post-PCI',
  'FOLLOW-UP': 'Seguimiento',
  
  // Findings / Treatments
  'Underexpansion': 'Infraexpansión',
  'Malapposition': 'Mala aposición',
  'Edge dissection': 'Disección de borde',
  'Suboptimal landing zone': 'Zona de aterrizaje subóptima',
  'Post-dilation': 'Postdilatación',
  'Additional stent': 'Stent adicional',
  
  // Global / Usability
  'Automatic Co-registration': 'Co-registro automático',
  'Fast Pullback': 'Pullback rápido',
  'AI Lipid Morphology': 'Análisis de morfología lipídica por IA',
  'FFR-OCT': 'FFR-OCT',
  'Left Main Imaging': 'Imagen de tronco común izquierdo',
  'Excellent': 'Excelente',
  'Good': 'Buena',
  'Average': 'Regular',
  'Poor': 'Deficiente'
};

/**
 * Nombres amigables para los módulos dinámicos.
 */
export const MODULE_NAMES: Record<string, string> = {
  calcium_module: 'Módulo de Calcio',
  lipid_module: 'Módulo de Lípidos',
  left_main_module: 'Imagen de TCI',
  ffr_oct_module: 'FFR-OCT',
  global_assessment: 'Valoración Global'
};

/**
 * Normaliza una key o valor convirtiéndola a minúsculas, reemplazando espacios y guiones medios por guiones bajos.
 */
export function normalizeKey(key: string): string {
  if (!key || typeof key !== 'string') return '';
  return key.trim().toLowerCase().replace(/[\s-]/g, '_');
}

/**
 * Traduce una clave y/o valor. Si es un array, traduce cada elemento y lo une.
 */
export function formatClinicalValue(value: any): string {
  if (value === null || value === undefined || value === '') return '';
  
  if (Array.isArray(value)) {
    return value.map(v => {
      const strVal = String(v);
      const translated = VALUE_TRANSLATIONS[strVal] || VALUE_TRANSLATIONS[normalizeKey(strVal)];
      if (!translated && process.env.NODE_ENV === 'development') {
        console.warn(`[ULTREON DISPLAY WARNING] Unknown display value in array: ${strVal}`);
      }
      return translated || strVal;
    }).join(', ');
  }
  
  if (typeof value === 'boolean') {
    return value ? 'Sí' : 'No';
  }
  
  const strVal = String(value);
  // Intentar búsqueda exacta primero, luego normalizada
  const translated = VALUE_TRANSLATIONS[strVal] || VALUE_TRANSLATIONS[normalizeKey(strVal)];
  
  if (!translated && process.env.NODE_ENV === 'development') {
    // Si no lo encuentra, log
    // Evitamos mostrar warning por campos de texto libre o IDs, pero como no sabemos...
    // console.warn(`[ULTREON DISPLAY WARNING] Unknown display value: ${strVal}`);
    // Opcional: descomentar lo de arriba si queremos que chille por todo.
    // El usuario pidió: "si una key o enum no tiene mapping conocido, emitir:"
    // Así que emitimos:
    if (strVal.length < 50 && !strVal.match(/^[0-9a-f]{8}-[0-9a-f]{4}-/)) {
      console.warn(`[ULTREON DISPLAY WARNING] Unknown display value: ${strVal}`);
    }
  }
  
  return translated || strVal;
}

export function formatClinicalLabel(key: string): string {
  if (!key) return '';
  const exact = FIELD_LABELS[key];
  if (exact) return exact;

  const normalized = normalizeKey(key);
  const normalizedMatch = FIELD_LABELS[normalized];
  
  if (normalizedMatch) return normalizedMatch;

  if (process.env.NODE_ENV === 'development') {
    console.warn(`[ULTREON DISPLAY WARNING] Unknown field label: ${key} (normalized: ${normalized})`);
  }
  
  return key.replace(/_/g, ' ');
}

/**
 * Determina si un objeto/módulo está verdaderamente vacío.
 */
export function isModuleEmpty(data: any): boolean {
  if (!data) return true;
  if (typeof data !== 'object') return false;
  if (Array.isArray(data)) return data.length === 0;
  
  return Object.values(data).every(val => 
    val === null || val === undefined || val === '' || 
    (Array.isArray(val) && val.length === 0) ||
    (typeof val === 'object' && Object.keys(val).length === 0)
  );
}
