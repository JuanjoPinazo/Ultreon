'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createOperatorAction } from '@/lib/supabase/actions';
import Card from '@/components/design-system/Card';

export default function AdminOperatorsClient({ initialOperators, allHospitals }: { initialOperators: any[], allHospitals: any[] }) {
  const [showAdd, setShowAdd] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    isActive: true,
    hospitalIds: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const toggleHospital = (id: string) => {
    setFormData(prev => ({
      ...prev,
      hospitalIds: prev.hospitalIds.includes(id) 
        ? prev.hospitalIds.filter(hId => hId !== id)
        : [...prev.hospitalIds, id]
    }));
  };

  const handleCreate = async () => {
    if (!formData.fullName) {
      setError('El nombre es obligatorio');
      return;
    }
    setIsSubmitting(true);
    setError('');

    const res = await createOperatorAction({
      fullName: formData.fullName,
      email: formData.email || null,
      isActive: formData.isActive,
      hospitalIds: formData.hospitalIds
    });

    if (res.error) {
      setError(res.error);
    } else {
      setShowAdd(false);
      // Wait for revalidation
      setTimeout(() => window.location.reload(), 500);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-50 tracking-tight">Operadores Clínicos</h1>
          <p className="text-slate-400 mt-1">Gestión de médicos operadores y asignación a centros</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-lg transition-all"
        >
          + Nuevo Operador
        </button>
      </div>

      {showAdd && (
        <Card className="p-6 border-cyan-500/30">
          <h3 className="text-lg font-bold text-slate-200 mb-4">Añadir Operador</h3>
          <div className="space-y-4 max-w-xl">
            {error && <div className="p-3 bg-red-950/50 border border-red-800 text-red-400 text-xs rounded-lg">{error}</div>}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData({...formData, fullName: e.target.value})}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:border-cyan-500/50 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase">Email (Opcional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:border-cyan-500/50 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Hospitales Asociados</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-900 border border-slate-800 rounded-lg">
                {allHospitals.map(h => (
                  <label key={h.id} className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={formData.hospitalIds.includes(h.id)}
                      onChange={() => toggleHospital(h.id)}
                      className="rounded border-slate-700 bg-slate-800 text-cyan-500"
                    />
                    {h.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setShowAdd(false)}
                className="px-4 py-2 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreate}
                disabled={isSubmitting}
                className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Operador'}
              </button>
            </div>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm text-slate-400">
          <thead className="bg-slate-900/50 border-b border-slate-800 text-xs font-mono uppercase tracking-wider">
            <tr>
              <th className="p-4">Operador</th>
              <th className="p-4">Email</th>
              <th className="p-4">Hospitales</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {initialOperators.map(op => (
              <tr key={op.id} className="hover:bg-slate-900/30 transition-colors">
                <td className="p-4 font-medium text-slate-200">{op.full_name}</td>
                <td className="p-4">{op.email || '—'}</td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1">
                    {op.hospital_operators?.map((ho: any) => (
                      <span key={ho.hospital_id} className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                        {ho.hospitals.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${op.is_active ? 'bg-emerald-950/40 text-emerald-400' : 'bg-red-950/40 text-red-400'}`}>
                    {op.is_active ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </td>
                <td className="p-4">
                  <button className="text-cyan-500 hover:text-cyan-400 text-xs font-bold">
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {initialOperators.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">
                  No hay operadores registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
