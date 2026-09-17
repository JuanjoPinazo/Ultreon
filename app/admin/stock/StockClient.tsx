'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setInitialStock } from './actions';
import { useGlobalToast } from '@/components/providers/GlobalToastProvider';
import { useGlobalDialog } from '@/components/providers/GlobalDialogProvider';

export default function StockClient({ hospitals, stockMovements }: { hospitals: any[], stockMovements: any[] }) {
  const [selectedHospital, setSelectedHospital] = useState('');
  const [product, setProduct] = useState('Ultreon Software License');
  const [quantity, setQuantity] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { showSuccess, showError } = useGlobalToast();
  const { showDialog } = useGlobalDialog();

  const qaMovements = stockMovements.filter(m => m.is_prelaunch === true);
  const officialMovements = stockMovements.filter(m => m.is_prelaunch === false);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await setInitialStock({
      hospital_id: selectedHospital,
      product_id: product,
      quantity: parseInt(quantity, 10),
      movement_date: date,
      notes: notes
    });

    setIsSaving(false);
    if (!res.success) {
      showDialog({
        type: 'error',
        title: 'Error',
        message: res.error
      });
    } else {
      showSuccess('Stock guardado correctamente');
      setQuantity('');
      setNotes('');
      router.refresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-bold text-foreground mb-4">Stock QA / Prelaunch</h2>
          <div className="text-sm text-muted-foreground mb-4">Este histórico no se arrastrará al inicio oficial.</div>
          {qaMovements.length === 0 ? (
            <p className="text-muted-foreground italic">No hay movimientos QA registrados.</p>
          ) : (
            <ul className="space-y-2 text-foreground">
              {qaMovements.map(m => (
                <li key={m.id} className="text-sm border-b border-border pb-2">
                  <span className="font-bold">{m.movement_type}</span>: {m.quantity} u.
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
          <h2 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">Stock Oficial</h2>
          <div className="text-sm text-muted-foreground mb-4">Baseline del Registro Clínico en Vivo.</div>
          {officialMovements.length === 0 ? (
            <p className="text-muted-foreground italic">No hay stock oficial inicializado.</p>
          ) : (
            <ul className="space-y-2 text-foreground">
              {officialMovements.map(m => (
                <li key={m.id} className="text-sm border-b border-border pb-2">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{m.movement_type}</span>: {m.quantity} u. <span className="text-muted-foreground">({m.movement_date})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold text-foreground mb-4">Inicialización Manual de Stock Oficial</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-foreground mb-1">Centro</label>
            {hospitals.length === 0 ? (
              <div className="w-full bg-muted border border-border rounded p-2 text-sm text-muted-foreground">
                No hay centros disponibles para configurar stock.
              </div>
            ) : (
              <select className="w-full bg-background text-foreground border border-border rounded p-2 outline-none focus:border-primary" value={selectedHospital} onChange={e => setSelectedHospital(e.target.value)}>
                <option value="">Seleccione un hospital...</option>
                {hospitals.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-1">Producto</label>
            <input type="text" className="w-full bg-background text-foreground border border-border rounded p-2 outline-none focus:border-primary" value={product} onChange={e => setProduct(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-1">Cantidad Física Real</label>
            <input type="number" className="w-full bg-background text-foreground border border-border rounded p-2 outline-none focus:border-primary" value={quantity} onChange={e => setQuantity(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-bold text-foreground mb-1">Fecha de Inventario</label>
            <input type="date" className="w-full bg-background text-foreground border border-border rounded p-2 outline-none focus:border-primary" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-bold text-foreground mb-1">Observaciones</label>
            <input type="text" className="w-full bg-background text-foreground border border-border rounded p-2 outline-none focus:border-primary" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        </div>

        <button 
          className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold"
          onClick={() => {
            if(!selectedHospital || !quantity || !date) {
              showError('Rellene todos los campos requeridos');
              return;
            }
            const hospitalName = hospitals.find(h => h.id === selectedHospital)?.name;
            showDialog({
              type: 'warning',
              title: 'Establecer stock inicial oficial',
              message: `Esta cantidad será la referencia oficial de inventario para el inicio del Registro.\n\nCentro: ${hospitalName}\nProducto: ${product}\nCantidad: ${quantity}\nFecha: ${date}`,
              confirmLabel: 'Confirmar INITIAL',
              onConfirm: handleSave
            });
          }}
        >
          Guardar Stock Oficial
        </button>
      </div>
    </div>
  );
}
