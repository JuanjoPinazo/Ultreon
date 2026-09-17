'use server';

import { createClient } from '@/lib/supabase/server';

export async function setInitialStock(payload: {
  hospital_id: string;
  product_id: string;
  quantity: number;
  movement_date: string;
  notes: string;
}) {
  const supabase = await createClient();

  try {
    // 1. Get user profile
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autorizado' };

    // 2. Check for existing INITIAL movement for this hospital and product
    const { data: existingInitial, error: checkErr } = await supabase
      .from('stock_movements')
      .select('id')
      .eq('hospital_id', payload.hospital_id)
      .eq('product_id', payload.product_id)
      .eq('movement_type', 'INITIAL')
      .eq('is_prelaunch', false) // Official
      .limit(1);

    if (checkErr) throw checkErr;
    if (existingInitial && existingInitial.length > 0) {
      return { success: false, error: 'Ya existe un stock inicial OFICIAL registrado para este producto y hospital. Utilice ADJUSTMENT para corregirlo.' };
    }

    // 3. Insert INITIAL movement
    const { data, error } = await supabase
      .from('stock_movements')
      .insert({
        hospital_id: payload.hospital_id,
        product_id: payload.product_id,
        quantity: payload.quantity,
        movement_type: 'INITIAL',
        movement_date: payload.movement_date,
        notes: payload.notes || 'Registro Inicial Oficial',
        is_prelaunch: false, // Explicitly official
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error del servidor al registrar stock inicial' };
  }
}
