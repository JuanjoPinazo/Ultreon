'use server';

import { createClient } from '@/lib/supabase/server';
import { CenterTarget } from '@/lib/metrics/progress';

export async function saveCenterTarget(payload: Partial<CenterTarget>, reason: string) {
  const supabase = await createClient();

  if (!payload.hospital_id) {
    return { success: false, error: 'Hospital ID es requerido' };
  }

  try {
    if (payload.id) {
      // Update existing
      const { data, error } = await supabase
        .from('registry_center_targets')
        .update({
          target_total: payload.target_total,
          target_monthly: payload.target_monthly,
          start_date: payload.start_date,
          end_date: payload.end_date,
          status: payload.status,
          notes: payload.notes
        })
        .eq('id', payload.id)
        .select()
        .single();
      
      if (error) {
        return { success: false, error: error.message, code: error.code };
      }
      return { success: true, data };
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('registry_center_targets')
        .insert({
          hospital_id: payload.hospital_id,
          target_total: payload.target_total,
          target_monthly: payload.target_monthly,
          start_date: payload.start_date,
          end_date: payload.end_date,
          status: payload.status,
          notes: payload.notes
        })
        .select()
        .single();
      
      if (error) {
        return { success: false, error: error.message, code: error.code };
      }
      return { success: true, data };
    }
  } catch (err: any) {
    return { success: false, error: err.message || 'Unknown error' };
  }
}
