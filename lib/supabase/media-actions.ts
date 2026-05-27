'use server';

import { createClient as createServerClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  uploadMediaFile,
  deleteMediaFile,
  getSignedUrl,
  detectMediaCategory,
  buildStoragePath,
  validateAnonymization,
} from '@/lib/storage/media-helpers';

// ============================================
// UPLOAD: Subir imagen/archivo a caso
// ============================================
export async function uploadCaseMediaAction(
  formData: FormData
): Promise<{ success?: boolean; mediaId?: string; error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  // Obtener datos del formulario
  const file = formData.get('file') as File;
  const caseId = formData.get('caseId') as string;
  const hospitalId = formData.get('hospitalId') as string;
  const category = (formData.get('category') as string) || detectMediaCategory(file.name);
  const phase = formData.get('acquisitionPhase') as string;
  const description = formData.get('description') as string;
  const hasConfirmedAnonymous = formData.get('hasConfirmedAnonymous') === 'true';

  // Validaciones
  if (!file) {
    return { error: 'Archivo no proporcionado' };
  }

  if (!caseId || !hospitalId) {
    return { error: 'Caso u hospital no válido' };
  }

  // Validar anonimización
  const anonCheck = validateAnonymization(hasConfirmedAnonymous);
  if (!anonCheck.valid) {
    return { error: anonCheck.error };
  }

  try {
    // Verificar que el usuario pertenece al hospital
    const { data: profile } = await supabase
      .from('profiles')
      .select('hospital_id, role')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return { error: 'Perfil no encontrado' };
    }

    // Hospital user solo puede subir a su hospital
    if (profile.role === 'hospital_user' && profile.hospital_id !== hospitalId) {
      return { error: 'No tiene permiso para subir a este hospital' };
    }

    // Verificar que el caso existe y pertenece al hospital
    const { data: caseRecord } = await supabase
      .from('ecrf_opstar_records')
      .select('id, hospital_id')
      .eq('id', caseId)
      .single();

    if (!caseRecord || caseRecord.hospital_id !== hospitalId) {
      return { error: 'Caso no encontrado o no pertenece a este hospital' };
    }

    // Construir ruta de storage
    const storagePath = buildStoragePath(caseId, category, file.name);

    // Subir a storage
    const uploadResult = await uploadMediaFile(supabase, storagePath, file);

    if (!uploadResult.success) {
      return { error: uploadResult.error };
    }

    // Registrar en BD
    const { data: mediaRecord, error: insertError } = await supabase
      .from('opstar_case_media')
      .insert([
        {
          case_id: caseId,
          hospital_id: hospitalId,
          uploaded_by: user.id,
          storage_path: storagePath,
          file_name: file.name,
          file_type: file.type,
          file_size_bytes: file.size,
          media_category: category,
          acquisition_phase: phase || 'unknown',
          description: description || null,
          is_anonymized: hasConfirmedAnonymous,
        },
      ])
      .select('id')
      .single();

    if (insertError) {
      // Rollback: eliminar archivo de storage
      await deleteMediaFile(supabase, storagePath);
      return { error: `Error registrando archivo: ${insertError.message}` };
    }

    return { success: true, mediaId: mediaRecord.id };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Error desconocido al subir',
    };
  }
}

// ============================================
// DELETE: Eliminar imagen del caso
// ============================================
export async function deleteCaseMediaAction(
  mediaId: string,
  caseId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  try {
    // Obtener registro de media
    const { data: media, error: fetchError } = await supabase
      .from('opstar_case_media')
      .select('id, storage_path, uploaded_by, case_id')
      .eq('id', mediaId)
      .single();

    if (fetchError || !media) {
      return { error: 'Archivo no encontrado' };
    }

    if (media.case_id !== caseId) {
      return { error: 'Archivo no pertenece a este caso' };
    }

    // Validar permisos: solo el que lo subió o admin/monitor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'monitor';
    const isOwner = media.uploaded_by === user.id;

    if (!isAdmin && !isOwner) {
      return { error: 'No tiene permiso para eliminar este archivo' };
    }

    // Eliminar de storage
    const deleteResult = await deleteMediaFile(supabase, media.storage_path);

    if (!deleteResult.success) {
      return { error: deleteResult.error };
    }

    // Eliminar de BD
    const { error: deleteError } = await supabase
      .from('opstar_case_media')
      .delete()
      .eq('id', mediaId);

    if (deleteError) {
      return { error: deleteError.message };
    }

    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Error al eliminar',
    };
  }
}

// ============================================
// GET SIGNED URL: Obtener URL para ver imagen
// ============================================
export async function getSignedUrlAction(
  mediaId: string,
  caseId: string
): Promise<{ url?: string; error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  try {
    // Obtener registro de media
    const { data: media, error: fetchError } = await supabase
      .from('opstar_case_media')
      .select('storage_path, case_id')
      .eq('id', mediaId)
      .single();

    if (fetchError || !media) {
      return { error: 'Archivo no encontrado' };
    }

    if (media.case_id !== caseId) {
      return { error: 'Archivo no pertenece a este caso' };
    }

    // Generar URL firmada
    const result = await getSignedUrl(supabase, media.storage_path, 900);

    if (result.error) {
      return { error: result.error };
    }

    return { url: result.url };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Error generando URL',
    };
  }
}

// ============================================
// UPDATE: Actualizar metadatos de media
// ============================================
export async function updateCaseMediaAction(
  mediaId: string,
  updates: {
    category?: string;
    description?: string;
    acquisitionPhase?: string;
  }
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  try {
    // Verificar que el usuario es propietario o admin
    const { data: media } = await supabase
      .from('opstar_case_media')
      .select('uploaded_by, hospital_id')
      .eq('id', mediaId)
      .single();

    if (!media) {
      return { error: 'Archivo no encontrado' };
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'monitor';
    const isOwner = media.uploaded_by === user.id;

    if (!isAdmin && !isOwner) {
      return { error: 'No tiene permiso para actualizar' };
    }

    // Actualizar
    const { error: updateError } = await supabase
      .from('opstar_case_media')
      .update({
        media_category: updates.category,
        description: updates.description,
        acquisition_phase: updates.acquisitionPhase,
      })
      .eq('id', mediaId);

    if (updateError) {
      return { error: updateError.message };
    }

    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Error actualizando',
    };
  }
}

// ============================================
// CORE LAB: Marcar como key image
// ============================================
export async function markAsKeyImageAction(
  mediaId: string,
  isKeyImage: boolean
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  try {
    // Solo admin y monitor pueden marcar key images
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'monitor') {
      return { error: 'No tiene permiso para marcar key images' };
    }

    const { error } = await supabase
      .from('opstar_case_media')
      .update({ is_key_image: isKeyImage })
      .eq('id', mediaId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Error actualizando',
    };
  }
}

// ============================================
// CORE LAB: Registrar revisión
// ============================================
export async function submitCoreLabReviewAction(
  mediaId: string,
  quality: 'excellent' | 'diagnostic' | 'suboptimal' | 'not_usable',
  notes: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  try {
    // Solo admin y monitor pueden hacer core lab review
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'monitor') {
      return { error: 'No tiene permiso para hacer revisión Core Lab' };
    }

    const { error } = await supabase
      .from('opstar_case_media')
      .update({
        corelab_quality: quality,
        corelab_notes: notes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', mediaId);

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Error en revisión',
    };
  }
}

// ============================================
// GET: Obtener imágenes de un caso
// ============================================
export async function getCaseMediaAction(
  caseId: string
): Promise<{
  media?: any[];
  error?: string;
}> {
  const supabase = await createServerClient();

  try {
    const { data, error } = await supabase
      .from('opstar_case_media')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    return { media: data || [] };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Error obteniendo imágenes',
    };
  }
}

// ============================================
// GET: Obtener casos pendientes Core Lab
// ============================================
export async function getCoreLabPendingCasesAction(): Promise<{
  cases?: any[];
  error?: string;
}> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  try {
    // Solo admin y monitor acceden
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin' && profile?.role !== 'monitor') {
      return { error: 'No tiene permiso' };
    }

    // Obtener casos con media no revisada
    const { data, error } = await supabase
      .from('ecrf_opstar_records')
      .select(`
        id,
        id_paciente,
        centro,
        created_at,
        hospitals(name),
        opstar_case_media(
          id,
          reviewed_at,
          corelab_quality
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }

    // Filtrar casos con media pendiente de revisión
    const pendingCases = data?.filter((c: any) => {
      const media = c.opstar_case_media || [];
      return media.length > 0 && media.some((m: any) => !m.reviewed_at);
    }) || [];

    return { cases: pendingCases };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : 'Error obteniendo casos',
    };
  }
}
