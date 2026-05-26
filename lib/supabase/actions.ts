// lib/supabase/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
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

  if (profileError || !profile || profile.role !== 'admin' || !profile.is_active) {
    return false;
  }
  return true;
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
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado. Se requieren permisos de administrador.' };
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
      return { error: authError.message };
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
  }
) {
  const isAdmin = await checkAdmin();
  if (!isAdmin) {
    return { error: 'No autorizado. Se requieren permisos de administrador.' };
  }

  try {
    const adminClient = createAdminClient();

    // Update metadata on the Auth user
    const { error: authError } = await adminClient.auth.admin.updateUserById(id, {
      user_metadata: {
        role: data.role,
        full_name: data.fullName,
        hospital_id: data.hospitalId || null,
      },
    });

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

    if (!profile || (profile.role !== 'admin' && profile.role !== 'monitor')) {
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

    if (!profile || (profile.role !== 'admin' && profile.role !== 'monitor')) {
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

// 9. SAVE REGISTRY CASE TRANSACTION (WITH RELATED TABLES)
export async function saveRegistryCaseAction(
  casePayload: any,
  strategyPayload: any,
  optimizationPayload: any
) {
  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { error: 'No autenticado.' };

    // 1. Insert Case Record into ecrf_opstar_records
    const { data: insertedCase, error: caseError } = await supabase
      .from('ecrf_opstar_records')
      .insert([casePayload])
      .select('id')
      .single();

    if (caseError || !insertedCase) {
      return { error: `Error al guardar ficha base: ${caseError.message}` };
    }

    const caseId = insertedCase.id;

    // 2. Insert related records in parallel
    const [strategyRes, optimizationRes] = await Promise.all([
      supabase.from('opstar_strategy_changes').insert([{ ...strategyPayload, case_id: caseId }]),
      supabase.from('opstar_optimization_results').insert([{ ...optimizationPayload, case_id: caseId }])
    ]);

    if (strategyRes.error) {
      // Clean up case record if secondary insert fails
      await supabase.from('ecrf_opstar_records').delete().eq('id', caseId);
      return { error: `Error al guardar cambios de estrategia: ${strategyRes.error.message}` };
    }

    if (optimizationRes.error) {
      // Clean up case record and strategy record if third insert fails
      await supabase.from('ecrf_opstar_records').delete().eq('id', caseId);
      return { error: `Error al guardar resultados de optimización: ${optimizationRes.error.message}` };
    }

    revalidatePath('/dashboard');
    revalidatePath('/admin');
    return { success: true, id: caseId };
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

    if (!profile || (profile.role !== 'admin' && profile.role !== 'monitor')) {
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

