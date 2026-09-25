// lib/supabase/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import type { ZeroContrastInsertPayload } from '@/types/zero-contrast';
import { createClient as createServerClient } from './server';
import { createAdminClient } from './admin';

// Helper to check if current user is an admin
async function checkAdmin() {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return false;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || (profile.role !== 'admin' && profile.role !== 'clinical_admin') || !profile.is_active) {
    return false;
  }
  return true;
}

async function getAdminRole() {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, is_active')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !profile.is_active) {
    return null;
  }
  if (profile.role === 'admin' || profile.role === 'clinical_admin') {
    return profile.role;
  }
  return null;
}

// 1. LOGIN ACTION
export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Por favor, introduce tu email y contraseña.' };
  }

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: error.message };
    }

    if (data?.user) {
      // Check if user is active
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_active, role')
        .eq('id', data.user.id)
        .single();

      if (profileError || !profile) {
        // Sign out if profile doesn't exist
        await supabase.auth.signOut();
        return { error: 'No se pudo cargar el perfil del usuario.' };
      }

      if (!profile.is_active) {
        await supabase.auth.signOut();
        return { error: 'Tu cuenta está inactiva o pendiente de validación.' };
      }

      return { success: true, role: profile.role };
    }

    return { error: 'Error desconocido durante el inicio de sesión.' };
  } catch (err: any) {
    return { error: err?.message || 'Error del servidor. Inténtalo de nuevo.' };
  }
}

// 2. LOGOUT ACTION
export async function logoutAction() {
  try {
    const supabase = await createServerClient();
    await supabase.auth.signOut();
    return { success: true };
  } catch (err) {
    return { error: 'Error al cerrar sesión.' };
  }
}

// 3. CREATE HOSPITAL ACTION
export async function createHospitalAction(data: {
  name: string;
  shortName: string;
  city: string;
  province: string;
  code: string;
  isActive: boolean;
}) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado. Se requieren permisos de administrador.' };
  }

  try {
    const supabase = await createServerClient();
    const { error } = await supabase.from('hospitals').insert([
      {
        name: data.name,
        short_name: data.shortName,
        city: data.city,
        province: data.province,
        code: data.code.toUpperCase(),
        is_active: data.isActive,
      },
    ]);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/hospitals');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error de servidor al guardar el hospital.' };
  }
}

// 4. UPDATE HOSPITAL ACTION
export async function updateHospitalAction(
  id: string,
  data: {
    name: string;
    shortName: string;
    city: string;
    province: string;
    code: string;
    isActive: boolean;
  }
) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado. Se requieren permisos de administrador.' };
  }

  try {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('hospitals')
      .update({
        name: data.name,
        short_name: data.shortName,
        city: data.city,
        province: data.province,
        code: data.code.toUpperCase(),
        is_active: data.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/hospitals');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error de servidor al actualizar el hospital.' };
  }
}

// 5. CREATE USER ACTION (Uses Admin SDK)
export async function createUserAction(data: {
  email: string;
  fullName: string;
  role: string;
  hospitalId: string | null;
  isActive: boolean;
}) {
  const adminRole = await getAdminRole();
  if (!adminRole) {
    return { error: 'No autorizado. Se requieren permisos de administrador.' };
  }
  if (adminRole === 'clinical_admin' && data.role === 'admin') {
    return { error: 'No autorizado. Un Administrador Clínico no puede crear usuarios con rol Administrador.' };
  }

  try {
    const adminClient = createAdminClient();
    
    // Create the user in Auth
    const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
      email: data.email,
      password: 'OpstarPassword2026!', // Default password
      email_confirm: true,
      user_metadata: {
        role: data.role,
        full_name: data.fullName,
        hospital_id: data.hospitalId || null,
      },
    });

    if (authError) {
      console.error('Supabase auth.admin.createUser error:', authError);
      let errorMessage = authError.message;
      if (errorMessage.includes('Database error creating new user')) {
        errorMessage = 'Error en base de datos al crear usuario (Posible causa: el rol seleccionado no existe en el CHECK constraint remoto profiles_role_check, o falló el trigger on_auth_user_created).';
      } else if (errorMessage.toLowerCase().includes('already registered')) {
        errorMessage = 'El usuario ya existe.';
      }
      return { error: errorMessage };
    }

    // Double check/upsert in profiles to make sure it exists
    if (authUser?.user) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .upsert({
          id: authUser.user.id,
          email: data.email,
          full_name: data.fullName,
          role: data.role,
          hospital_id: data.hospitalId || null,
          is_active: data.isActive,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        return { error: `Usuario creado, pero error al guardar perfil: ${profileError.message}` };
      }
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error de servidor al crear el usuario.' };
  }
}

// 6. UPDATE USER ACTION (Uses Admin SDK)
export async function updateUserAction(
  id: string,
  data: {
    fullName: string;
    role: string;
    hospitalId: string | null;
    isActive: boolean;
    password?: string;
  }
) {
  const adminRole = await getAdminRole();
  if (!adminRole) {
    return { error: 'No autorizado. Se requieren permisos de administrador.' };
  }
  
  if (adminRole === 'clinical_admin') {
    // Determine the target user's current role
    const supabase = await createServerClient();
    const { data: targetProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', id)
      .single();
      
    if (targetProfile?.role === 'admin' || targetProfile?.role === 'super_admin') {
      return { error: 'No autorizado. No puede modificar a un Administrador.' };
    }
    
    if (data.role === 'admin') {
      return { error: 'No autorizado. Un Administrador Clínico no puede otorgar el rol Administrador.' };
    }
  }

  try {
    const adminClient = createAdminClient();

    // Update metadata on the Auth user
    const authUpdatePayload: any = {
      user_metadata: {
        role: data.role,
        full_name: data.fullName,
        hospital_id: data.hospitalId || null,
      },
    };
    if (data.password) {
      authUpdatePayload.password = data.password;
    }

    const { error: authError } = await adminClient.auth.admin.updateUserById(id, authUpdatePayload);

    if (authError) {
      console.warn('Could not sync update to auth metadata:', authError.message);
    }

    // Update profiles database table
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({
        full_name: data.fullName,
        role: data.role,
        hospital_id: data.hospitalId || null,
        is_active: data.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (profileError) {
      return { error: profileError.message };
    }

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error de servidor al actualizar el usuario.' };
  }
}

// 6b. DELETE USER ACTION (Uses Admin SDK)
export async function deleteUserAction(id: string) {
  // Verify requester is admin
  const supabase = await createServerClient();
  const { data: { user: currentUser } } = await supabase.auth.getUser();
  if (!currentUser) return { error: 'No autenticado.' };

  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado. Se requieren permisos de administrador.' };
  }

  // Prevent self-deletion
  if (currentUser.id === id) {
    return { error: 'No puedes eliminar tu propia cuenta.' };
  }

  try {
    const adminClient = createAdminClient();

    // Delete from Supabase Auth (cascades to profiles via trigger, but we also delete manually)
    const { error: authError } = await adminClient.auth.admin.deleteUser(id);
    if (authError) {
      return { error: `Error al eliminar el usuario de Auth: ${authError.message}` };
    }

    // Also delete profile row in case no cascade trigger exists
    await adminClient.from('profiles').delete().eq('id', id);

    revalidatePath('/admin/users');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error de servidor al eliminar el usuario.' };
  }
}

// 7. TOGGLE CASE LOCK STATUS (Admin / Monitor permission)
export async function toggleCaseLockAction(id: string, locked: boolean) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado.' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'clinical_admin' && profile.role !== 'monitor')) {
      return { error: 'No autorizado.' };
    }

    const { error } = await supabase
      .from('ecrf_opstar_records')
      .update({ locked })
      .eq('id', id);

    if (error) return { error: error.message };
    
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error de servidor.' };
  }
}

// 8. TOGGLE CASE VALIDATE STATUS (Admin / Monitor permission)
export async function toggleCaseValidationAction(id: string, validated: boolean) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'No autenticado.' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'clinical_admin' && profile.role !== 'monitor')) {
      return { error: 'No autorizado.' };
    }

    const { error } = await supabase
      .from('ecrf_opstar_records')
      .update({ monitor_validated: validated })
      .eq('id', id);

    if (error) return { error: error.message };
    
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error de servidor.' };
  }
}

// 9. SAVE REGISTRY CASE (ULTREON V3)
export async function saveRegistryCaseAction(payload: any) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'No autenticado.' };

    // Validation (as requested in step 6)
    if (!payload.hospital_id) return { error: 'El campo "hospital_id" es obligatorio.' };
    if (!payload.operator_id) return { error: 'El campo "operator_id" es obligatorio.' };
    if (!payload.procedure_date) return { error: 'El campo "procedure_date" es obligatorio.' };
    
    // Server-side Hospital Access Validation
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('role, hospital_id')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return { error: 'No se pudo verificar el perfil del usuario.' };
    }

    if (userProfile.role === 'hospital_user') {
      // Future-proofing: If we ever have an array of authorized hospitals, check it here.
      // For now, check the single hospital_id field.
      if (userProfile.hospital_id !== payload.hospital_id) {
        return { error: 'No autorizado: 403 Forbidden. El centro no corresponde con tus permisos.' };
      }
    }
    
    // Server-side Operator Validation
    const { data: operatorCheck, error: opError } = await supabase
      .from('operators')
      .select('id, is_active')
      .eq('id', payload.operator_id)
      .single();
      
    if (opError || !operatorCheck) {
      return { error: 'El operador seleccionado no existe o es inválido.' };
    }
    if (!operatorCheck.is_active) {
      return { error: 'El operador seleccionado está inactivo.' };
    }
    
    // Check if operator is authorized for the selected hospital
    const { data: hospOpCheck, error: hospOpError } = await supabase
      .from('hospital_operators')
      .select('is_active')
      .eq('operator_id', payload.operator_id)
      .eq('hospital_id', payload.hospital_id)
      .single();
      
    if (hospOpError || !hospOpCheck || !hospOpCheck.is_active) {
      return { error: 'El operador no está autorizado para el centro seleccionado.' };
    }

    // Auto-generate anonymous_code if missing or dummy
    let generatedCode = payload.anonymous_code;
    let finalId = payload.id;
    let shouldGenerateCode = false;
    
    if (!generatedCode || generatedCode.trim() === '' || generatedCode.includes('(Se generará')) {
      shouldGenerateCode = true;
    }

    if (shouldGenerateCode && !finalId) {
      // Create draft via RPC to safely generate code
      const { data: draftData, error: rpcError } = await supabase.rpc('create_ultreon_v3_draft_secure', {
        p_hospital_id: payload.hospital_id,
        p_operator_id: payload.operator_id,
        p_is_demo: payload.is_demo,
        p_procedure_date: payload.procedure_date
      });
      if (rpcError || !draftData) {
        return { error: `Error generando código de caso: ${rpcError?.message}` };
      }
      finalId = draftData.case_id;
      generatedCode = draftData.anonymous_code;
    }

    // --- SERVER SIDE CANONICALIZATION ---
    let finalPayload = { ...payload };
    
    // Safety check pullbacks
    const pullbacks = finalPayload.acquisition_data?.pullbacks || [];
    const allPostPci = pullbacks.length > 0 && pullbacks.every((pb: any) => pb.type === 'POST-PCI');

    if (finalPayload.calcium_module) {
      if (allPostPci) {
        finalPayload.calcium_module.calcium_not_applicable = true;
        finalPayload.calcium_module.calcium_not_applicable_reason = 'ALL_PULLBACKS_POST_PCI';
        finalPayload.calcium_module.perception_accuracy = undefined;
        finalPayload.calcium_module.ease_of_interpretation = undefined;
        finalPayload.calcium_module.clinical_utility = undefined;
        finalPayload.calcium_module.auto_detect_added_info = undefined;
        finalPayload.calcium_module.influenced_decision = undefined;
        finalPayload.calcium_module.improvement_ideas = undefined;
        finalPayload.calcium_module.changed_prep_strategy = undefined;
        finalPayload.calcium_module.calcium_treatment_chosen = undefined;
        finalPayload.calcium_module.different_strategy_without_ultreon = undefined;
      } else {
        if (finalPayload.calcium_module.calcium_not_applicable) {
          finalPayload.calcium_module.calcium_not_applicable = false;
          finalPayload.calcium_module.calcium_not_applicable_reason = undefined;
        }
      }
    }

    if (finalPayload.lipid_module) {
      if (allPostPci) {
        finalPayload.lipid_module.lipid_not_applicable = true;
        finalPayload.lipid_module.lipid_not_applicable_reason = 'ALL_PULLBACKS_POST_PCI';
        finalPayload.lipid_module.perception_accuracy = undefined;
        finalPayload.lipid_module.ease_of_interpretation = undefined;
        finalPayload.lipid_module.clinical_utility = undefined;
        finalPayload.lipid_module.auto_detect_added_info = undefined;
        finalPayload.lipid_module.influenced_decision = undefined;
        finalPayload.lipid_module.improvement_ideas = undefined;
      } else {
        if (finalPayload.lipid_module.lipid_not_applicable) {
          finalPayload.lipid_module.lipid_not_applicable = false;
          finalPayload.lipid_module.lipid_not_applicable_reason = undefined;
        }
      }
    }

    const upsertData = {
      ...finalPayload,
      id: finalId,
      anonymous_code: generatedCode,
      schema_version: '3.1',
      updated_at: new Date().toISOString(),
    };
    
    if (!payload.id) {
      upsertData.created_by = user.id;
    }

    const { data: savedCase, error: caseError } = await supabase
      .from('ultreon_registry_cases')
      .upsert(upsertData, { onConflict: 'id' })
      .select('id')
      .single();

    if (caseError) {
      return { error: `Error al guardar en Supabase: ${caseError.message}` };
    }

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    return { success: true, id: savedCase?.id };
  } catch (err: any) {
    return { error: err?.message || 'Error de servidor al guardar la ficha clínica.' };
  }
}

// 10. SAVE FOLLOW-UP ACTION
export async function saveFollowUpAction(payload: any) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'No autenticado.' };

    const cleanPayload = {
      ...payload,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    };

    // If it's a new record, set created_by
    if (!payload.id) {
      cleanPayload.created_by = user.id;
    }

    const { data, error } = await supabase
      .from('opstar_followup')
      .upsert(cleanPayload, { onConflict: 'case_id,followup_type' })
      .select()
      .single();

    if (error) {
      return { error: `Error al guardar seguimiento: ${error.message}` };
    }

    revalidatePath(`/cases/${payload.case_id}/follow-up`);
    revalidatePath('/follow-up');
    return { success: true, data };
  } catch (err: any) {
    return { error: err?.message || 'Error de servidor al guardar el seguimiento.' };
  }
}

// 11. TOGGLE FOLLOW-UP VALIDATION ACTION
export async function toggleFollowUpValidationAction(id: string, validated: boolean, caseId: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'No autenticado.' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || (profile.role !== 'admin' && profile.role !== 'clinical_admin' && profile.role !== 'monitor')) {
      return { error: 'No autorizado. Se requieren permisos de monitor o administrador.' };
    }

    const { error } = await supabase
      .from('opstar_followup')
      .update({ 
        monitor_validated: validated,
        updated_by: user.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath(`/cases/${caseId}/follow-up`);
    revalidatePath('/follow-up');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error de servidor.' };
  }
}

// 12. GET ACTIVE HOSPITALS WITH INVESTIGATORS (ordered by Principal Investigator first, then display_order)
export async function getActiveHospitalsWithInvestigators() {
  try {
    const supabase = await createServerClient();
    
    // Fetch active hospitals
    const { data: hospitals, error: hospError } = await supabase
      .from('hospitals')
      .select('*')
      .eq('is_active', true)
      .order('name');
      
    if (hospError) throw hospError;
    if (!hospitals) return [];
    
    // Fetch active investigators (PIs) (RLS-aware)
    const { data: investigators, error: invError } = await supabase
      .from('opstar_investigators')
      .select('*')
      .eq('is_active', true)
      .order('is_principal_investigator', { ascending: false })
      .order('display_order', { ascending: true });
      
    if (invError) {
      console.error('Error fetching investigators:', invError);
    }
      
    const cleanInvestigators = investigators || [];
    
    // Fetch active operators from hospital_operators (RLS-aware)
    const { data: hopOps, error: hopError } = await supabase
      .from('hospital_operators')
      .select(`
        hospital_id,
        operator:operators (
          id,
          full_name,
          is_active,
          operator_user_links (
            user_id
          )
        )
      `)
      .eq('is_active', true);
      
    if (hopError) {
      console.error('Error fetching hospital_operators:', JSON.stringify(hopError, null, 2));
      console.error('Error details:', hopError);
    }
      
    // Transform into flat operator objects mapped to hospital_id
    const operators = (hopOps || [])
      .filter((ho: any) => ho.operator && ho.operator.is_active)
      .map((ho: any) => ({
        id: ho.operator.id, // the true operator_id
        full_name: ho.operator.full_name,
        hospital_id: ho.hospital_id,
        is_active: true,
        user_id: ho.operator.operator_user_links && ho.operator.operator_user_links.length > 0
          ? ho.operator.operator_user_links[0].user_id
          : null
      }));
    // Fetch case counts per hospital (RLS-aware)
    const { data: casesData } = await supabase
      .from('ecrf_opstar_records')
      .select('hospital_id');
      
    const caseCounts: Record<string, number> = {};
    if (casesData) {
      casesData.forEach((c) => {
        if (c.hospital_id) {
          caseCounts[c.hospital_id] = (caseCounts[c.hospital_id] || 0) + 1;
        }
      });
    }
    
    // Map investigators, operators, and cases to hospitals
    return hospitals.map((h) => ({
      id: h.id,
      name: h.name,
      short_name: h.short_name,
      city: h.city,
      province: h.province,
      code: h.code,
      cases: caseCounts[h.id] || 0,
      investigators: cleanInvestigators.filter((i) => i.hospital_id === h.id),
      operators: operators.filter((o) => o.hospital_id === h.id),
    }));
  } catch (err) {
    console.error('Error in getActiveHospitalsWithInvestigators:', err);
    return [];
  }
}

// 13. GET STUDY OVERVIEW STATS (calculates real metrics from DB)
export async function getStudyOverviewStats() {
  try {
    const supabase = await createServerClient();
    
    // Fetch active hospitals count
    const { count: activeHospitalsCount } = await supabase
      .from('hospitals')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
      
    // Fetch cases (RLS-aware)
    const { data: cases } = await supabase
      .from('ecrf_opstar_records')
      .select('id, modifico_estrategia, expected_contrast_ml, actual_contrast_ml, zero_contrast_completed');
      
    // Fetch optimization results to calculate mean OPSTAR score
    const { data: optResults } = await supabase
      .from('opstar_optimization_results')
      .select('opstar_score');
      
    const totalCases = cases?.length || 0;
    
    const zeroContrastCount = cases?.filter(
      (c) => c.zero_contrast_completed === true || Number(c.actual_contrast_ml) === 0
    ).length || 0;
    const zeroContrastPct = totalCases > 0 ? Math.round((zeroContrastCount / totalCases) * 100) : 0;
    
    const strategyModifiedCount = cases?.filter((c) => c.modifico_estrategia === true).length || 0;
    const strategyModifiedPct = totalCases > 0 ? Math.round((strategyModifiedCount / totalCases) * 100) : 0;
    
    const totalScores = optResults?.filter((r) => r.opstar_score !== null && r.opstar_score !== undefined) || [];
    const sumScore = totalScores.reduce((sum, r) => sum + (r.opstar_score || 0), 0);
    const meanOpstarScore = totalScores.length > 0 ? Math.round(sumScore / totalScores.length) : 0;
    
    return {
      totalCases,
      zeroContrastPct,
      strategyModifiedPct,
      meanOpstarScore,
      activeHospitalsCount: activeHospitalsCount || 0
    };
  } catch (err) {
    console.error('Error in getStudyOverviewStats:', err);
    return {
      totalCases: 0,
      zeroContrastPct: 0,
      strategyModifiedPct: 0,
      meanOpstarScore: 0,
      activeHospitalsCount: 0
    };
  }
}

// 14. CREATE INVESTIGATOR ACTION
export async function createInvestigatorAction(data: {
  hospitalId: string;
  fullName: string;
  role: string;
  email: string | null;
  phone: string | null;
  specialty: string | null;
  isPrincipalInvestigator: boolean;
  isActive: boolean;
  displayOrder: number;
}) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado. Se requieren permisos de administrador.' };
  }

  try {
    const supabase = await createServerClient();
    const { error } = await supabase.from('opstar_investigators').insert([
      {
        hospital_id: data.hospitalId,
        full_name: data.fullName,
        role: data.role,
        email: data.email || null,
        phone: data.phone || null,
        specialty: data.specialty || null,
        is_principal_investigator: data.isPrincipalInvestigator,
        is_active: data.isActive,
        display_order: data.displayOrder,
      },
    ]);

    if (error) return { error: error.message };

    revalidatePath('/admin/investigators');
    revalidatePath('/study');
    revalidatePath('/about');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error del servidor al crear el investigador.' };
  }
}

// 15. UPDATE INVESTIGATOR ACTION
export async function updateInvestigatorAction(
  id: string,
  data: {
    hospitalId: string;
    fullName: string;
    role: string;
    email: string | null;
    phone: string | null;
    specialty: string | null;
    isPrincipalInvestigator: boolean;
    isActive: boolean;
    displayOrder: number;
  }
) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado. Se requieren permisos de administrador.' };
  }

  try {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('opstar_investigators')
      .update({
        hospital_id: data.hospitalId,
        full_name: data.fullName,
        role: data.role,
        email: data.email || null,
        phone: data.phone || null,
        specialty: data.specialty || null,
        is_principal_investigator: data.isPrincipalInvestigator,
        is_active: data.isActive,
        display_order: data.displayOrder,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/admin/investigators');
    revalidatePath('/study');
    revalidatePath('/about');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error del servidor al actualizar el investigador.' };
  }
}

// 16. TOGGLE INVESTIGATOR ACTIVE STATE ACTION
export async function toggleInvestigatorActiveAction(id: string, isActive: boolean) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado. Se requieren permisos de administrador.' };
  }

  try {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('opstar_investigators')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/admin/investigators');
    revalidatePath('/study');
    revalidatePath('/about');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error del servidor al alternar estado.' };
  }
}

// 17. GET ALL INVESTIGATORS (admin only)
export async function getInvestigatorsAction() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado.' };
  }

  try {
    const supabase = await createServerClient();
    const { data: investigators, error } = await supabase
      .from('opstar_investigators')
      .select(`
        id,
        hospital_id,
        full_name,
        role,
        email,
        specialty,
        is_principal_investigator,
        is_active,
        display_order,
        created_at
      `)
      .order('is_principal_investigator', { ascending: false })
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { success: true, data: investigators || [] };
  } catch (err: any) {
    return { error: err?.message || 'Error al obtener investigadores.' };
  }
}

// 18. GET STUDY GOVERNANCE
export async function getStudyGovernanceAction() {
  try {
    const supabase = await createServerClient();
    const { data: governance, error } = await supabase
      .from('opstar_study_governance')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) throw error;
    return { success: true, data: governance || [] };
  } catch (err: any) {
    console.error('Error fetching study governance:', err);
    return { error: err?.message || 'Error al obtener información de gobernanza.' };
  }
}

// 19. UPDATE STUDY GOVERNANCE SECTION
export async function updateStudyGovernanceAction(
  section: string,
  title: string,
  body: string
) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado.' };
  }

  try {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('opstar_study_governance')
      .update({
        title,
        body,
        updated_at: new Date().toISOString(),
      })
      .eq('section', section);

    if (error) throw error;

    revalidatePath('/admin/study-governance');
    revalidatePath('/study');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error al actualizar gobernanza.' };
  }
}

// 20. GET BUSINESS INTELLIGENCE DATA (admin only)
export async function getBusinessIntelligenceDataAction() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado. Acceso solo para administradores.' };
  }

  try {
    const supabase = await createServerClient();

    // Fetch all active hospitals
    const { data: hospitals } = await supabase
      .from('hospitals')
      .select('*')
      .eq('is_active', true)
      .order('name');

    // Fetch business metrics
    const { data: metrics } = await supabase
      .from('opstar_center_business_metrics')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    // Fetch center objectives
    const { data: objectives } = await supabase
      .from('opstar_center_objectives')
      .select('*')
      .order('year', { ascending: false });

    // Fetch case counts per hospital
    const { data: casesData } = await supabase
      .from('ecrf_opstar_records')
      .select('hospital_id, created_at');

    // Calculate case counts by hospital and year
    const caseCounts: Array<{
      hospital_id: string;
      year: number;
      case_count: number;
      zero_contrast_cases: number;
      strategy_modified_cases: number;
    }> = [];

    const caseCountMap = new Map<string, { year: number; case_count: number; zero_contrast_cases: number; strategy_modified_cases: number }>();

    if (casesData) {
      casesData.forEach((c) => {
        if (c.hospital_id && c.created_at) {
          const year = new Date(c.created_at).getFullYear();
          const key = `${c.hospital_id}-${year}`;
          const existing = caseCountMap.get(key) || { year, case_count: 0, zero_contrast_cases: 0, strategy_modified_cases: 0 };
          existing.case_count += 1;
          caseCountMap.set(key, existing);
        }
      });

      caseCountMap.forEach((value, key) => {
        const [hospitalId] = key.split('-');
        caseCounts.push({
          hospital_id: hospitalId,
          ...value,
        });
      });
    }

    return {
      success: true,
      data: {
        hospitals: hospitals || [],
        metrics: metrics || [],
        objectives: objectives || [],
        caseCounts,
      },
    };
  } catch (err: any) {
    return { error: err?.message || 'Error al obtener datos de BI.' };
  }
}

// 21. CREATE/UPDATE BUSINESS METRICS ACTION
export async function saveBusinessMetricsAction(data: {
  id?: string;
  hospitalId: string;
  year: number;
  month?: number;
  productLine?: string;
  purchaseVolumeUnits: number;
  purchaseRevenueEur: number;
  registryInvestmentEur: number;
  investigatorPaymentsEur: number;
  trainingCostsEur: number;
  congressSupportEur: number;
  otherInvestmentEur: number;
  targetUnits?: number;
  targetRevenueEur?: number;
  notes?: string;
}) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado. Acceso solo para administradores.' };
  }

  try {
    const supabase = await createServerClient();

    const payload = {
      hospital_id: data.hospitalId,
      year: data.year,
      month: data.month || null,
      product_line: data.productLine || null,
      purchase_volume_units: data.purchaseVolumeUnits,
      purchase_revenue_eur: data.purchaseRevenueEur,
      registry_investment_eur: data.registryInvestmentEur,
      investigator_payments_eur: data.investigatorPaymentsEur,
      training_costs_eur: data.trainingCostsEur,
      congress_support_eur: data.congressSupportEur,
      other_investment_eur: data.otherInvestmentEur,
      target_units: data.targetUnits || null,
      target_revenue_eur: data.targetRevenueEur || null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (data.id) {
      // Update
      ({ error } = await supabase
        .from('opstar_center_business_metrics')
        .update(payload)
        .eq('id', data.id));
    } else {
      // Insert
      ({ error } = await supabase
        .from('opstar_center_business_metrics')
        .insert([payload]));
    }

    if (error) throw error;

    revalidatePath('/admin/business-intelligence');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error al guardar métricas.' };
  }
}

// 22. CREATE/UPDATE CENTER OBJECTIVES ACTION
export async function saveCenterObjectivesAction(data: {
  id?: string;
  hospitalId: string;
  year: number;
  targetCases?: number;
  targetZeroContrastRate?: number;
  targetStrategyModificationRate?: number;
  targetPurchaseUnits?: number;
  targetRevenueEur?: number;
  targetOpstarScore?: number;
  notes?: string;
}) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado. Acceso solo para administradores.' };
  }

  try {
    const supabase = await createServerClient();

    const payload = {
      hospital_id: data.hospitalId,
      year: data.year,
      target_cases: data.targetCases || null,
      target_zero_contrast_rate: data.targetZeroContrastRate || null,
      target_strategy_modification_rate: data.targetStrategyModificationRate || null,
      target_purchase_units: data.targetPurchaseUnits || null,
      target_revenue_eur: data.targetRevenueEur || null,
      target_opstar_score: data.targetOpstarScore || null,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (data.id) {
      // Update
      ({ error } = await supabase
        .from('opstar_center_objectives')
        .update(payload)
        .eq('id', data.id));
    } else {
      // Insert
      ({ error } = await supabase
        .from('opstar_center_objectives')
        .insert([payload]));
    }

    if (error) throw error;

    revalidatePath('/admin/business-intelligence');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error al guardar objetivos.' };
  }
}

// 23. OCT EVIDENCE - UPLOAD FILE AND METADATA
export async function uploadOctEvidenceFileAction(formData: FormData) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  try {
    const file = formData.get('file') as File;
    const caseId = formData.get('caseId') as string;
    const phase = formData.get('phase') as string;
    const isAnonymized = formData.get('isAnonymized') === 'true';

    if (!isAnonymized) {
      return { error: 'Debe confirmar anonimización' };
    }

    // Validate file
    if (!file || file.size > 25 * 1024 * 1024) {
      return { error: 'Archivo inválido o muy grande' };
    }

    // Get case
    const { data: caseRecord } = await supabase
      .from('ecrf_opstar_records')
      .select('hospital_id')
      .eq('id', caseId)
      .single();

    if (!caseRecord) {
      return { error: 'Caso no encontrado' };
    }

    // Build path
    const timestamp = Date.now();
    const sanitized = file.name.replace(/[^a-z0-9.-]/gi, '_');
    const storagePath = `cases/${caseId}/${phase}/${timestamp}-${sanitized}`;

    // Upload
    const { error: uploadError } = await supabase.storage
      .from('opstar-oct-evidence')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      return { error: uploadError.message };
    }

    return { success: true, path: storagePath };
  } catch (err: any) {
    return { error: err?.message || 'Error al subir archivo' };
  }
}

// 24. OCT EVIDENCE - SAVE METADATA
export async function uploadOctEvidenceAction(data: {
  caseId: string;
  phase: 'pre_pci' | 'strategy_change' | 'post_pci' | 'zero_contrast' | 'follow_up' | 'report';
  evidenceType: string;
  linkedVariable?: string;
  linkedStrategyChange?: string;
  title?: string;
  description?: string;
  isKeyEvidence?: boolean;
  isAnonymized: boolean;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath: string;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  // Check anonimization
  if (!data.isAnonymized) {
    return { error: 'Debe confirmar que la imagen no contiene datos personales.' };
  }

  try {
    // Get case with hospital_id
    const { data: caseRecord } = await supabase
      .from('ecrf_opstar_records')
      .select('hospital_id')
      .eq('id', data.caseId)
      .single();

    if (!caseRecord) {
      return { error: 'Caso no encontrado' };
    }

    // Check access
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, hospital_id')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return { error: 'Perfil no encontrado' };
    }

    if (
      profile.role === 'hospital_user' &&
      profile.hospital_id !== caseRecord.hospital_id
    ) {
      return { error: 'No tienes acceso a este caso' };
    }

    if (profile.role === 'viewer') {
      return { error: 'Los visualizadores no pueden subir evidencia' };
    }

    // Insert evidence record
    const { error } = await supabase.from('opstar_oct_evidence').insert([
      {
        case_id: data.caseId,
        hospital_id: caseRecord.hospital_id,
        uploaded_by: user.id,
        storage_path: data.storagePath,
        file_name: data.fileName,
        file_type: data.fileType,
        file_size_bytes: data.fileSize,
        evidence_phase: data.phase,
        evidence_type: data.evidenceType,
        linked_variable: data.linkedVariable || null,
        linked_strategy_change: data.linkedStrategyChange || null,
        title: data.title || null,
        description: data.description || null,
        is_key_evidence: data.isKeyEvidence || false,
        is_anonymized: data.isAnonymized,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    revalidatePath(`/cases/${data.caseId}/evidence`);
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error al guardar evidencia' };
  }
}

// 25. OCT EVIDENCE - GET CASE EVIDENCE
export async function getOctEvidenceAction(caseId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado', data: null };
  }

  try {
    const { data: evidence } = await supabase
      .from('opstar_oct_evidence')
      .select('*')
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    return { success: true, data: evidence || [] };
  } catch (err: any) {
    return { error: err?.message || 'Error al obtener evidencia' };
  }
}

// 26. OCT EVIDENCE - UPDATE CORELAB REVIEW
export async function updateOctCoreLabReviewAction(data: {
  evidenceId: string;
  quality: 'excellent' | 'diagnostic' | 'suboptimal' | 'not_usable';
  notes?: string;
  isKeyEvidence?: boolean;
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'clinical_admin', 'monitor'].includes(profile.role)) {
    return { error: 'Solo admin y monitor pueden validar' };
  }

  try {
    const { error } = await supabase
      .from('opstar_oct_evidence')
      .update({
        corelab_quality: data.quality,
        corelab_notes: data.notes || null,
        is_key_evidence: data.isKeyEvidence || false,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.evidenceId);

    if (error) throw error;

    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error al actualizar evidencia' };
  }
}

// 27. OCT EVIDENCE - DELETE EVIDENCE
export async function deleteOctEvidenceAction(evidenceId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  try {
    // Get evidence to check access
    const { data: evidence } = await supabase
      .from('opstar_oct_evidence')
      .select('uploaded_by, storage_path, case_id')
      .eq('id', evidenceId)
      .single();

    if (!evidence) {
      return { error: 'Evidencia no encontrada' };
    }

    // Check if user uploaded it or is admin/monitor
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (
      evidence.uploaded_by !== user.id &&
      !['admin', 'clinical_admin', 'monitor'].includes(profile?.role || '')
    ) {
      return { error: 'No tienes permisos para eliminar' };
    }

    // Delete from storage
    if (evidence.storage_path) {
      await supabase.storage
        .from('opstar-oct-evidence')
        .remove([evidence.storage_path]);
    }

    // Delete record
    const { error } = await supabase
      .from('opstar_oct_evidence')
      .delete()
      .eq('id', evidenceId);

    if (error) throw error;

    revalidatePath(`/cases/${evidence.case_id}/evidence`);
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error al eliminar evidencia' };
  }
}

// 29. CASE QUALITY - UPDATE CASE STATUS
export async function updateCaseStatusAction(data: {
  caseId: string;
  newStatus: 'draft' | 'incomplete' | 'complete' | 'pending_corelab' | 'validated' | 'locked';
  completenessScore?: number;
  warnings?: any[];
}) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  // Check permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, hospital_id')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return { error: 'Perfil no encontrado' };
  }

  try {
    // Get case
    const { data: caseRecord } = await supabase
      .from('ecrf_opstar_records')
      .select('case_status, hospital_id, locked_by')
      .eq('id', data.caseId)
      .single();

    if (!caseRecord) {
      return { error: 'Caso no encontrado' };
    }

    // Check access
    if (
      profile.role === 'hospital_user' &&
      caseRecord.hospital_id !== profile.hospital_id
    ) {
      return { error: 'No tienes acceso a este caso' };
    }

    // Permission checks for status transitions
    if (data.newStatus === 'locked' && !['admin', 'clinical_admin', 'monitor'].includes(profile.role)) {
      return { error: 'Solo admin/monitor pueden bloquear' };
    }

    if (data.newStatus === 'validated' && !['admin', 'clinical_admin', 'monitor'].includes(profile.role)) {
      return { error: 'Solo admin/monitor pueden validar' };
    }

    // Cannot edit locked case (except admin to unlock)
    if (caseRecord.locked_by && profile.role === 'hospital_user') {
      return { error: 'Caso bloqueado. Solo admin puede desbloquear.' };
    }

    // Build update payload
    const updatePayload: any = {
      case_status: data.newStatus,
      case_completeness_score: data.completenessScore || 0,
      data_quality_warnings: data.warnings || [],
      updated_at: new Date().toISOString(),
    };

    // Add timestamps based on status
    if (data.newStatus === 'complete') {
      updatePayload.completed_at = new Date().toISOString();
    }

    if (data.newStatus === 'validated') {
      updatePayload.validated_at = new Date().toISOString();
      updatePayload.validated_by = user.id;
    }

    if (data.newStatus === 'locked') {
      updatePayload.locked_at = new Date().toISOString();
      updatePayload.locked_by = user.id;
    }

    // Perform update
    const { error } = await supabase
      .from('ecrf_opstar_records')
      .update(updatePayload)
      .eq('id', data.caseId);

    if (error) throw error;

    revalidatePath(`/cases/${data.caseId}`);
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error al actualizar estado del caso' };
  }
}

// 30. CASE QUALITY - GET CASE WITH QUALITY DATA
export async function getCaseQualityDataAction(caseId: string) {
  const supabase = await createServerClient();

  try {
    const { data: caseData } = await supabase
      .from('ecrf_opstar_records')
      .select(`
        *,
        hospitals(name),
        opstar_strategy_changes(*),
        opstar_optimization_results(*),
        opstar_followup(*)
      `)
      .eq('id', caseId)
      .single();

    if (!caseData) {
      return { error: 'Caso no encontrado' };
    }

    // Get OCT evidence stats
    const { data: evidenceData } = await supabase
      .from('opstar_oct_evidence')
      .select('evidence_phase, is_key_evidence, corelab_quality')
      .eq('case_id', caseId);

    const octEvidenceStats = {
      total_evidence: evidenceData?.length || 0,
      key_evidence_count: evidenceData?.filter((e: any) => e.is_key_evidence).length || 0,
      pending_corelab: evidenceData?.filter((e: any) => !e.corelab_quality).length || 0,
      pre_pci_key: evidenceData?.filter((e: any) => e.evidence_phase === 'pre_pci' && e.is_key_evidence).length || 0,
      post_pci_key: evidenceData?.filter((e: any) => e.evidence_phase === 'post_pci' && e.is_key_evidence).length || 0,
      strategy_change_evidence: evidenceData?.filter((e: any) => e.evidence_phase === 'strategy_change').length || 0,
    };

    return {
      success: true,
      data: {
        ...caseData,
        octEvidenceStats,
      },
    };
  } catch (err: any) {
    return { error: err?.message || 'Error al obtener datos de calidad' };
  }
}

// 31. CASE QUALITY - MARK CASE AS COMPLETE
export async function markCaseCompleteAction(caseId: string) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autorizado' };
  }

  try {
    // Get full case data for quality check
    const caseQuality = await getCaseQualityDataAction(caseId);
    if (!caseQuality.success || !caseQuality.data) {
      return { error: 'Caso no encontrado' };
    }

    // Calculate completeness
    const { calculateCaseCompleteness } = await import('@/lib/clinical/case-quality');
    const completeness = calculateCaseCompleteness(caseQuality.data);

    if (!completeness.isReadyToComplete) {
      return {
        error: 'Caso no completado. Revisa los errores.',
        details: completeness.warnings,
      };
    }

    // Update case
    const { error } = await supabase
      .from('ecrf_opstar_records')
      .update({
        case_status: 'complete',
        case_completeness_score: completeness.score,
        data_quality_warnings: completeness.warnings,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', caseId);

    if (error) throw error;

    revalidatePath(`/cases/${caseId}`);
    return { success: true, score: completeness.score };
  } catch (err: any) {
    return { error: err?.message || 'Error al completar caso' };
  }
}

// 32. SITE MONITORING - GET HOSPITAL METRICS
export async function getSiteMonitoringDataAction() {
  const supabase = await createServerClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: 'No autorizado' };
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const isAdminOrMonitor = profile?.role === 'admin' || profile?.role === 'monitor';
  if (!isAdminOrMonitor) {
    return { error: 'Acceso solo para admin y monitor' };
  }

  try {
    // Fetch active hospitals
    const { data: hospitals } = await supabase
      .from('hospitals')
      .select('*')
      .eq('is_active', true)
      .order('name');

    // Fetch all cases
    const { data: cases } = await supabase
      .from('ecrf_opstar_records')
      .select('id, hospital_id, created_at, monitor_validated, locked');

    // Fetch follow-ups
    const { data: followups } = await supabase
      .from('opstar_followup')
      .select('case_id, followup_type, completed, mace');

    // Fetch case media
    const { data: media } = await supabase
      .from('opstar_case_media')
      .select('case_id, is_key_image');

    // Fetch core lab reviews
    const { data: coreLabReviews } = await supabase
      .from('opstar_core_lab_reviews')
      .select('case_id, quality_rating');

    // Fetch objectives
    const { data: objectives } = await supabase
      .from('opstar_center_objectives')
      .select('*')
      .eq('year', new Date().getFullYear());

    return {
      success: true,
      data: {
        hospitals: hospitals || [],
        cases: cases || [],
        followups: followups || [],
        media: media || [],
        coreLabReviews: coreLabReviews || [],
        objectives: objectives || [],
      },
    };
  } catch (err: any) {
    return { error: err?.message || 'Error al obtener datos de monitoreo.' };
  }
}

// 31. DELETE HOSPITAL ACTION
export async function deleteHospitalAction(id: string) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'No autenticado.' };

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin' && profile.role !== 'clinical_admin') {
      return { error: 'No autorizado. Se requieren permisos de administrador.' };
    }

    // Check if cases are associated
    const { count, error: countError } = await supabase
      .from('ecrf_opstar_records')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', id);

    if (countError) return { error: countError.message };
    if (count && count > 0) {
      return { error: 'No se puede eliminar el hospital porque tiene casos clínicos asociados.' };
    }

    // Check if users are associated
    const { count: userCount, error: userCountError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('hospital_id', id);

    if (userCountError) return { error: userCountError.message };
    if (userCount && userCount > 0) {
      return { error: 'No se puede eliminar el hospital porque tiene usuarios asociados.' };
    }

    const { error } = await supabase
      .from('hospitals')
      .delete()
      .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/admin/hospitals');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error de servidor al eliminar el hospital.' };
  }
}



// 21. CREATE OPERATOR ACTION
export async function createOperatorAction(data: {
  fullName: string;
  email: string | null;
  isActive: boolean;
  hospitalIds: string[];
}) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado. Se requieren permisos de administrador.' };
  }

  try {
    const supabase = await createServerClient();
    
    // 1. Insert Operator
    const { data: opData, error: opError } = await supabase
      .from('operators')
      .insert([{
        full_name: data.fullName,
        email: data.email,
        is_active: data.isActive
      }])
      .select('id')
      .single();

    if (opError) return { error: opError.message };

    // 2. Link to Hospitals
    if (data.hospitalIds.length > 0) {
      const hospitalLinks = data.hospitalIds.map(hId => ({
        operator_id: opData.id,
        hospital_id: hId,
        is_active: true
      }));

      const { error: linkError } = await supabase
        .from('hospital_operators')
        .insert(hospitalLinks);

      if (linkError) return { error: linkError.message };
    }

    revalidatePath('/admin/operators');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error del servidor al crear el operador.' };
  }
}

// 22. GET OPERATORS FOR HOSPITAL
export async function getOperatorsForHospitalAction(hospitalId: string) {
  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('hospital_operators')
      .select('operator_id, operators(id, full_name, email, is_active)')
      .eq('hospital_id', hospitalId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching operators:', error);
      throw error;
    }
    
    // Extract actual operator records
    const ops = data ? data.map(d => d.operators).filter(Boolean) : [];
    return { success: true, data: ops };
  } catch (err: any) {
    return { error: err?.message || 'Error al obtener operadores del centro.' };
  }
}

// 24. UPDATE OPERATOR ACTION
export async function updateOperatorAction(
  id: string,
  data: {
    fullName: string;
    email: string | null;
    isActive: boolean;
    hospitalIds: string[];
  }
) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado. Se requieren permisos de administrador.' };
  }

  try {
    const supabase = await createServerClient();

    // 1. Verify operator exists and log diagnostics
    const { data: existingOperator, error: checkError } = await supabase
      .from('operators')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingOperator) {
      console.error('[DIAGNOSTICS] updateOperatorAction FAILED');
      console.error(`- operatorId enviado: ${id}`);
      console.error(`- hospitalIds enviados: ${data.hospitalIds.join(', ')}`);
      console.error(`- operator existente: NO`);
      return { error: 'El operador seleccionado no existe o ya no está disponible.' };
    }

    console.log('[DIAGNOSTICS] updateOperatorAction PRE-UPDATE');
    console.log(`- operatorId enviado: ${id}`);
    console.log(`- hospitalIds enviados: ${data.hospitalIds.join(', ')}`);
    console.log(`- operator existente: SÍ`);

    // 2. Update operator core data
    const { error: opError } = await supabase
      .from('operators')
      .update({
        full_name: data.fullName,
        email: data.email || null,
        is_active: data.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (opError) return { error: opError.message };

    // 3. Remove all existing hospital links
    const { error: deleteError } = await supabase
      .from('hospital_operators')
      .delete()
      .eq('operator_id', id);

    if (deleteError) return { error: deleteError.message };

    // 4. Re-insert new hospital links
    if (data.hospitalIds.length > 0) {
      const hospitalLinks = data.hospitalIds.map(hId => ({
        operator_id: id,
        hospital_id: hId,
        is_active: true,
      }));

      const { error: linkError } = await supabase
        .from('hospital_operators')
        .insert(hospitalLinks);

      if (linkError) return { error: linkError.message };
    }

    revalidatePath('/admin/operators');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error del servidor al actualizar el operador.' };
  }
}

// 25. DELETE OPERATOR ACTION
export async function deleteOperatorAction(id: string) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado. Se requieren permisos de administrador.' };
  }

  try {
    const supabase = await createServerClient();

    // Check if operator has associated cases
    const { count, error: countError } = await supabase
      .from('ecrf_opstar_records')
      .select('*', { count: 'exact', head: true })
      .eq('operator_id', id);

    if (countError) return { error: countError.message };
    if (count && count > 0) {
      return { error: 'No se puede eliminar el operador porque tiene casos clínicos asociados.' };
    }

    // Delete hospital links first
    await supabase.from('hospital_operators').delete().eq('operator_id', id);

    // Delete operator
    const { error } = await supabase.from('operators').delete().eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/admin/operators');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error del servidor al eliminar el operador.' };
  }
}

// 23. GET ALL OPERATORS WITH HOSPITALS (admin)
export async function getAllOperatorsAction() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return { error: 'No autorizado.' };

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('operators')
      .select(`
        id, full_name, email, is_active, created_at,
        hospital_operators(
          hospital_id,
          hospitals(name)
        ),
        operator_user_links(
          user_id,
          profiles(email)
        )
      `)
      .order('full_name');

    if (error) {
      console.error('Error fetching all operators:', error);
      throw error;
    }
    return { success: true, data: data || [] };
  } catch (err: any) {
    return { error: err?.message || 'Error al obtener operadores.' };
  }
}

// 26. GET EXECUTIVE DASHBOARD STATS
export async function getExecutiveDashboardStats() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return { error: 'No autorizado.' };

  try {
    const supabase = await createServerClient();
    
    // 1. Get all cases
    const { data: cases, error: casesError } = await supabase
      .from('ecrf_opstar_records')
      .select('*, hospitals(name, id), opstar_strategy_changes(*), opstar_optimization_results(*)');
      
    if (casesError) throw casesError;

    // 2. Get active hospitals for adoption table
    const { data: hospitals, error: hospError } = await supabase
      .from('hospitals')
      .select('*')
      .eq('is_active', true)
      .order('name');
      
    if (hospError) throw hospError;

    // 3. Get investigators/operators for rankings
    const { data: investigators, error: invError } = await supabase
      .from('opstar_investigators')
      .select('id, full_name, hospital_id, role');

    return { 
      success: true, 
      cases: cases || [],
      hospitals: hospitals || [],
      investigators: investigators || []
    };
  } catch (err: any) {
    return { error: err?.message || 'Error al obtener datos del dashboard ejecutivo.' };
  }
}

// 26. LINK OPERATOR TO USER
export async function linkOperatorToUserAction(operatorId: string, userId: string) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return { error: 'No autorizado.' };

  try {
    const supabase = await createServerClient();
    
    // Check if the link exists
    const { data: existing } = await supabase
      .from('operator_user_links')
      .select('id')
      .eq('operator_id', operatorId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('operator_user_links')
        .update({ user_id: userId, active: true, updated_at: new Date().toISOString() })
        .eq('operator_id', operatorId);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase
        .from('operator_user_links')
        .insert({ operator_id: operatorId, user_id: userId, active: true });
      if (error) return { error: error.message };
    }
    
    revalidatePath('/admin/operators');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error al vincular el operador.' };
  }
}

// 27. UNLINK OPERATOR
export async function unlinkOperatorAction(operatorId: string) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return { error: 'No autorizado.' };

  try {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('operator_user_links')
      .delete()
      .eq('operator_id', operatorId);

    if (error) return { error: error.message };
    
    revalidatePath('/admin/operators');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error al desvincular el operador.' };
  }
}

// 28. GET CURRENT USER OPERATOR LINK
export async function getCurrentUserOperatorLinkAction() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { data, error } = await supabase
      .from('operator_user_links')
      .select('operator_id')
      .eq('user_id', user.id)
      .eq('active', true)
      .maybeSingle();

    if (error || !data) return { success: true, operatorId: null };
    
    return { success: true, operatorId: data.operator_id };
  } catch (err) {
    return { success: true, operatorId: null };
  }
}

// ============================================================================
// ECONOMICS (ADMIN ONLY)
// ============================================================================

export async function createCaseEconomicsAction(payload: {
  case_id: string;
  revenue_snapshot: number;
  product_cost: number;
  gross_compensation: number;
  withholding_rate: number;
  other_variable_costs: number;
}) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return { error: 'No autorizado' };

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.rpc('create_case_economics', {
      p_case_id: payload.case_id,
      p_revenue_snapshot: payload.revenue_snapshot,
      p_product_cost: payload.product_cost,
      p_gross_compensation: payload.gross_compensation,
      p_withholding_rate: payload.withholding_rate,
      p_other_variable_costs: payload.other_variable_costs
    });

    if (error) {
      return { error: error.message };
    }
    revalidatePath('/admin/economics');
    return { success: true, id: data };
  } catch (err: any) {
    return { error: err?.message || 'Error creating economics' };
  }
}

export async function generateMonthlySettlementAction(beneficiaryId: string, year: number, month: number) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return { error: 'No autorizado' };

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.rpc('generate_monthly_settlement', {
      p_beneficiary_id: beneficiaryId,
      p_year: year,
      p_month: month
    });

    if (error) {
      return { error: error.message };
    }
    revalidatePath('/admin/economics');
    return { success: true, id: data };
  } catch (err: any) {
    return { error: err?.message || 'Error generating settlement' };
  }
}

export async function approveSettlementAction(settlementId: string) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return { error: 'No autorizado' };

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.rpc('approve_monthly_settlement', {
      p_settlement_id: settlementId
    });

    if (error) {
      return { error: error.message };
    }
    revalidatePath('/admin/economics');
    return { success: true };
  } catch (err: any) {
    return { error: err?.message || 'Error approving settlement' };
  }
}

export async function getCaseEconomicsAction() {
  const isAdmin = await checkAdmin();
  if (!isAdmin) return { error: 'No autorizado' };

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('registry_case_economics')
      .select(`
        *,
        hospital:hospitals(name),
        operator:operators(first_name, last_name),
        beneficiary:payment_beneficiaries(display_name)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return { error: error.message };
    }
    return { success: true, data };
  } catch (err: any) {
    return { error: err?.message || 'Error fetching economics' };
  }
}
