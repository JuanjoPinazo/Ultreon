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
    
    // Fetch active investigators (RLS-aware)
    const { data: investigators, error: invError } = await supabase
      .from('opstar_investigators')
      .select('*')
      .eq('is_active', true)
      .order('is_principal_investigator', { ascending: false })
      .order('display_order', { ascending: true });
      
    const cleanInvestigators = investigators || [];
    
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
    
    // Map investigators and cases to hospitals
    return hospitals.map((h) => ({
      id: h.id,
      name: h.name,
      short_name: h.short_name,
      city: h.city,
      province: h.province,
      code: h.code,
      cases: caseCounts[h.id] || 0,
      investigators: cleanInvestigators.filter((i) => i.hospital_id === h.id),
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

  if (!profile || !['admin', 'monitor'].includes(profile.role)) {
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
      !['admin', 'monitor'].includes(profile?.role || '')
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
    if (data.newStatus === 'locked' && !['admin', 'monitor'].includes(profile.role)) {
      return { error: 'Solo admin/monitor pueden bloquear' };
    }

    if (data.newStatus === 'validated' && !['admin', 'monitor'].includes(profile.role)) {
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

