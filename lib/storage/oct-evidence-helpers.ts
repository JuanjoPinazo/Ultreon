// NOTE: This file is used in both client and server contexts
// Client-side validation and helpers only - use server actions for storage operations

const BUCKET_NAME = 'opstar-oct-evidence';
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const SIGNED_URL_EXPIRY = 15 * 60; // 15 minutes

export interface OctEvidenceUploadOptions {
  caseId: string;
  hospitalId: string;
  phase: 'pre_pci' | 'strategy_change' | 'post_pci' | 'zero_contrast' | 'follow_up' | 'report';
  file: File;
}

export interface OctEvidenceMetadata {
  evidenceType:
    | 'oct_frame'
    | 'oct_pullback'
    | 'ultreon_screenshot'
    | 'angiography'
    | 'ffr_oct'
    | 'calcium'
    | 'lipid_plaque'
    | 'eel_reference'
    | 'stent_expansion'
    | 'malapposition'
    | 'edge_dissection'
    | 'zero_contrast_quality'
    | 'report_pdf'
    | 'other';
  linkedVariable?: string;
  linkedStrategyChange?: string;
  title?: string;
  description?: string;
  isKeyEvidence?: boolean;
}

/**
 * Validate file for OCT evidence upload
 */
export function validateOctEvidenceFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: 'Archivo requerido' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `Archivo muy grande (máximo 25 MB, tu archivo: ${(file.size / 1024 / 1024).toFixed(1)} MB)`,
    };
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: 'Tipo de archivo no permitido. Usa JPG, PNG, WebP o PDF.',
    };
  }

  return { valid: true };
}

/**
 * Build storage path for OCT evidence
 */
export function buildOctEvidencePath(
  caseId: string,
  phase: string,
  fileName: string
): string {
  const timestamp = Date.now();
  const sanitizedFileName = fileName.replace(/[^a-z0-9.-]/gi, '_');
  return `cases/${caseId}/${phase}/${timestamp}-${sanitizedFileName}`;
}

// Storage operations (upload, signed URLs, etc.) are handled via server actions
// See lib/supabase/actions.ts for uploadOctEvidenceAction, etc.
