'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SettingsClient({
  settings,
  hospitals,
  products
}: {
  settings: any;
  hospitals: any[];
  products: any[];
}) {
  const supabase = createClient();
  const router = useRouter();
  
  const [isGoLiveOpen, setIsGoLiveOpen] = useState(false);
  const [officialDate, setOfficialDate] = useState('');
  const [goLiveLoading, setGoLiveLoading] = useState(false);
  
  const [stockHospital, setStockHospital] = useState('');
  const [stockProduct, setStockProduct] = useState(products[0]?.id || '');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [stockLoading, setStockLoading] = useState(false);

  const handleGoLive = async () => {
    if (!officialDate) return;
    setGoLiveLoading(true);
    try {
      const { error } = await supabase.rpc('activate_registry_go_live', {
        p_official_start_date: officialDate
      });
      if (error) throw error;
      alert('Registro activado exitosamente.');
      setIsGoLiveOpen(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error al activar el registro');
    } finally {
      setGoLiveLoading(false);
    }
  };

  const handleSetStock = async () => {
    if (!stockHospital || !stockProduct || !stockQuantity) return;
    setStockLoading(true);
    try {
      const { error } = await supabase.rpc('set_initial_official_stock', {
        p_hospital_id: stockHospital,
        p_product_id: stockProduct,
        p_quantity: parseInt(stockQuantity, 10)
      });
      if (error) throw error;
      alert('Stock inicial establecido exitosamente.');
      setStockQuantity('0');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error al establecer el stock');
    } finally {
      setStockLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Estado Actual */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold text-foreground mb-4">Estado del Registro</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-surface-secondary rounded p-4 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Fase Actual</p>
            <p className={`text-lg font-black ${settings?.phase === 'LIVE' ? 'text-emerald-500' : 'text-orange-500'}`}>
              {settings?.phase}
            </p>
          </div>
          <div className="bg-surface-secondary rounded p-4 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Fecha de Inicio Oficial</p>
            <p className="text-lg font-bold text-foreground">{settings?.official_start_date || 'No definida'}</p>
          </div>
          <div className="bg-surface-secondary rounded p-4 border border-border">
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Activado En</p>
            <p className="text-sm font-bold text-foreground">
              {settings?.activated_at ? new Date(settings.activated_at).toLocaleString() : '-'}
            </p>
          </div>
        </div>

        {settings?.phase === 'PRELAUNCH' && (
          <div className="mt-6">
            <button
              onClick={() => setIsGoLiveOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-6 rounded-lg shadow transition-colors"
            >
              Poner Registro en marcha (GO LIVE)
            </button>
          </div>
        )}
      </div>

      {/* Establecer Stock Inicial */}
      {settings?.phase === 'LIVE' && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-bold text-foreground mb-4">Establecer Stock Inicial de Puesta en Marcha</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Establece el inventario físico inicial para los hospitales. Esta acción creará un movimiento de tipo INITIAL que audita el origen del stock.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Centro</label>
              <select
                className="w-full bg-surface-secondary border border-border text-foreground text-sm rounded-lg p-2"
                value={stockHospital}
                onChange={e => setStockHospital(e.target.value)}
              >
                <option value="">Selecciona centro...</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Producto</label>
              <select
                className="w-full bg-surface-secondary border border-border text-foreground text-sm rounded-lg p-2"
                value={stockProduct}
                onChange={e => setStockProduct(e.target.value)}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.product_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-1">Cantidad Oficial</label>
              <input
                type="number"
                min="0"
                className="w-full bg-surface-secondary border border-border text-foreground text-sm rounded-lg p-2"
                value={stockQuantity}
                onChange={e => setStockQuantity(e.target.value)}
              />
            </div>
            <div>
              <button
                onClick={handleSetStock}
                disabled={stockLoading || !stockHospital}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg shadow transition-colors disabled:opacity-50"
              >
                {stockLoading ? 'Guardando...' : 'Fijar Stock Inicial'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Go Live */}
      {isGoLiveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full p-6">
            <h3 className="text-xl font-black text-foreground mb-2">Activar Registro (GO LIVE)</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Estás a punto de pasar el registro a fase oficial (LIVE). 
              Los datos creados durante el prelanzamiento se conservarán para auditoría, pero no computarán en la actividad oficial.
            </p>
            
            <div className="bg-orange-950/30 border border-orange-900/50 rounded p-4 mb-6">
              <p className="text-sm text-orange-400 font-bold mb-1">¡Atención!</p>
              <p className="text-xs text-orange-400/80">
                Esta acción no se puede deshacer desde la interfaz. Todos los nuevos casos a partir de este momento se considerarán oficiales.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-bold text-foreground mb-2">Fecha Oficial de Inicio</label>
              <input
                type="date"
                className="w-full bg-surface-secondary border border-border text-foreground rounded-lg p-3"
                value={officialDate}
                onChange={e => setOfficialDate(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setIsGoLiveOpen(false)}
                className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleGoLive}
                disabled={!officialDate || goLiveLoading}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow transition-colors disabled:opacity-50"
              >
                {goLiveLoading ? 'Activando...' : 'Confirmar Puesta en Marcha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
