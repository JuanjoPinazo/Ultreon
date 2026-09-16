import { createClient } from '../supabase/client';

export interface OperatorClinicalProfile {
  operator_id: string;
  image_usage_oct: number;
  image_usage_ivus: number;
  image_usage_angio: number;
  experience_oct: string;
  experience_level_oct: string;
  experience_ultreon: string;
  updated_at?: string;
}

/**
 * Fetches the clinical profile for an operator.
 * Wraps in a try/catch so if the migration is not applied yet, it won't crash the app.
 */
export async function getOperatorProfile(operatorId: string): Promise<OperatorClinicalProfile | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('operator_clinical_profiles')
      .select('*')
      .eq('operator_id', operatorId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching operator profile:', error);
      return null;
    }
    
    return data as OperatorClinicalProfile;
  } catch (error) {
    console.error('Exception fetching operator profile:', error);
    return null;
  }
}

/**
 * Upserts the clinical profile for an operator.
 */
export async function upsertOperatorProfile(profile: OperatorClinicalProfile): Promise<{ success: boolean; error?: any }> {
  const supabase = createClient();
  
  // Validate that image usages sum to 10
  const sum = (profile.image_usage_oct || 0) + (profile.image_usage_ivus || 0) + (profile.image_usage_angio || 0);
  if (sum !== 10) {
    return { success: false, error: new Error('La suma de usos de OCT, IVUS y Angio debe ser exactamente 10.') };
  }

  try {
    const { error } = await supabase
      .from('operator_clinical_profiles')
      .upsert({
        ...profile,
        updated_at: new Date().toISOString()
      }, { onConflict: 'operator_id' });

    if (error) {
      console.error('Error upserting operator profile:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('Exception upserting operator profile:', error);
    return { success: false, error };
  }
}
