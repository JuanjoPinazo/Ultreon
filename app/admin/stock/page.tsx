import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import StockClient from './StockClient';

export default async function AdminStockPage() {
  const supabase = await createClient();

  // Fetch hospitals
  const { data: hospitals, error: hospitalsError } = await supabase
    .from('hospitals')
    .select('id, name')
    .eq('is_active', true)
    .order('name');
    
  if (hospitalsError) {
    console.error('Error fetching hospitals:', hospitalsError);
  }

  // Fetch all stock movements
  const { data: stockMovements } = await supabase
    .from('stock_movements')
    .select('*')
    .order('movement_date', { ascending: false });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Stock / Configuración Centro</h1>
          <p className="text-muted-foreground font-medium">Gestión del stock inicial oficial y aislamientos QA.</p>
        </div>
      </div>
      
      <StockClient 
        hospitals={hospitals || []}
        stockMovements={stockMovements || []}
      />
    </div>
  );
}
