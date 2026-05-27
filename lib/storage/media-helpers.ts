// Helpers para Supabase Storage - Gestión de archivos de media

import { SupabaseClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'opstar-case-media';
const MAX_FILE_SIZE_MB = 25;
const SIGNED_URL_EXPIRY_SECONDS = 900; // 15 minutos
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];

/**
 * Sube un archivo a Supabase Storage
 * @param supabase Cliente Supabase
 * @param path Ruta en bucket (ej: "cases/{id}/pre-oct/image.jpg")
 * @param file Archivo a subir
 * @returns { success: boolean, error?: string, path?: string }
 */
export async function uploadMediaFile(
  supabase: SupabaseClient,
  path: string,
  file: File
): Promise<{ success: boolean; error?: string; path?: string }> {
  try {
    // Validaciones
    if (!file || file.size === 0) {
      return { success: false, error: 'Archivo vacío' };
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return {
        success: false,
        error: `Archivo demasiado grande. Máximo ${MAX_FILE_SIZE_MB} MB`,
      };
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        success: false,
        error: 'Tipo de archivo no permitido. Use JPG, PNG, WebP o PDF',
      };
    }

    // Subir a storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, path: data.path };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error desconocido al subir',
    };
  }
}

/**
 * Elimina un archivo de Supabase Storage
 */
export async function deleteMediaFile(
  supabase: SupabaseClient,
  path: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error al eliminar archivo',
    };
  }
}

/**
 * Obtiene URL firmada temporal para un archivo
 */
export async function getSignedUrl(
  supabase: SupabaseClient,
  path: string,
  expiresIn: number = SIGNED_URL_EXPIRY_SECONDS
): Promise<{ url?: string; error?: string }> {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, expiresIn);

    if (error) {
      return { error: error.message };
    }

    return { url: data.signedUrl };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Error al generar URL',
    };
  }
}

/**
 * Obtiene URLs firmadas en batch para múltiples archivos
 */
export async function getSignedUrls(
  supabase: SupabaseClient,
  paths: string[],
  expiresIn: number = SIGNED_URL_EXPIRY_SECONDS
): Promise<{ urls: Record<string, string>; errors: Record<string, string> }> {
  const urls: Record<string, string> = {};
  const errors: Record<string, string> = {};

  for (const path of paths) {
    const result = await getSignedUrl(supabase, path, expiresIn);
    if (result.url) {
      urls[path] = result.url;
    } else {
      errors[path] = result.error || 'Error desconocido';
    }
  }

  return { urls, errors };
}

/**
 * Detecta categoría de media según extensión y tipo
 */
export function detectMediaCategory(
  fileName: string,
  fileType?: string
): string {
  const ext = fileName.toLowerCase().split('.').pop();
  const lowerName = fileName.toLowerCase();

  // PDF → report
  if (ext === 'pdf' || fileType === 'application/pdf') {
    return 'report_pdf';
  }

  // Imágenes → detectar por nombre o tipo
  if (lowerName.includes('oct')) {
    return 'oct_frame';
  }
  if (
    lowerName.includes('angio') ||
    lowerName.includes('coro') ||
    lowerName.includes('angiography')
  ) {
    return 'angiography';
  }
  if (
    lowerName.includes('screenshot') ||
    lowerName.includes('screen') ||
    lowerName.includes('ultreon')
  ) {
    return 'ultreon_screenshot';
  }
  if (
    lowerName.includes('zero') ||
    lowerName.includes('zero_contrast') ||
    lowerName.includes('zc')
  ) {
    return 'zero_contrast_image';
  }

  // Default
  return 'other';
}

/**
 * Construye ruta de almacenamiento para un archivo de caso
 * @param caseId UUID del caso
 * @param category Categoría de media
 * @param fileName Nombre del archivo original
 * @returns Ruta en bucket: "cases/{caseId}/{category}/{fileName}"
 */
export function buildStoragePath(
  caseId: string,
  category: string,
  fileName: string
): string {
  // Limpiar nombre de archivo: remover caracteres especiales
  const cleanName = fileName
    .replace(/[^a-z0-9._-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();

  // Mapear categoría a carpeta
  const categoryFolder = mapCategoryToFolder(category);

  return `cases/${caseId}/${categoryFolder}/${cleanName}`;
}

/**
 * Mapea categoria de media a nombre de carpeta
 */
function mapCategoryToFolder(category: string): string {
  switch (category) {
    case 'oct_frame':
    case 'oct_pullback':
      return 'pre-oct';
    case 'angiography':
      return 'angiography';
    case 'report_pdf':
      return 'reports';
    case 'ultreon_screenshot':
    case 'zero_contrast_image':
      return 'other';
    default:
      return 'other';
  }
}

/**
 * Valida que un archivo sea anonimizado antes de subir
 * @param hasConfirmedAnonymous Confirmación del usuario
 * @returns { valid: boolean, error?: string }
 */
export function validateAnonymization(
  hasConfirmedAnonymous: boolean
): { valid: boolean; error?: string } {
  if (!hasConfirmedAnonymous) {
    return {
      valid: false,
      error:
        'Debe confirmar que la imagen ha sido anonimizada antes de subir',
    };
  }
  return { valid: true };
}

/**
 * Obtiene extensión de archivo
 */
export function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

/**
 * Obtiene nombre de archivo sin extensión
 */
export function getFileNameWithoutExt(fileName: string): string {
  return fileName.split('.').slice(0, -1).join('.');
}
