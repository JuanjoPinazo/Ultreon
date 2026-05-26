// app/admin/hospitals/HospitalsFormClient.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { createHospitalAction, updateHospitalAction } from '@/lib/supabase/actions';

interface Hospital {
  id: string;
  name: string;
  short_name: string;
  city: string;
  province: string;
  code: string;
  is_active: boolean;
}

interface HospitalsFormClientProps {
  hospitals: Hospital[];
  userCounts: Record<string, number>;
  caseCounts: Record<string, number>;
}

export default function HospitalsFormClient({ hospitals, userCounts, caseCounts }: HospitalsFormClientProps) {
  const [isPending, startTransition] = useTransition();
  
  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Fields states
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [code, setCode] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setShortName('');
    setCity('');
    setProvince('');
    setCode('');
    setIsActive(true);
    setEditingId(null);
    setFormError(null);
    setShowForm(false);
  };

  const handleEditClick = (h: Hospital) => {
    setName(h.name);
    setShortName(h.short_name || '');
    setCity(h.city || '');
    setProvince(h.province || '');
    setCode(h.code);
    setIsActive(h.is_active);
    setEditingId(h.id);
    setFormError(null);
    setShowForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !code) {
      setFormError('El nombre y el código son obligatorios.');
      return;
    }

    startTransition(async () => {
      let res;
      if (editingId) {
        res = await updateHospitalAction(editingId, {
          name,
          shortName,
          city,
          province,
          code,
          isActive,
        });
      } else {
        res = await createHospitalAction({
          name,
          shortName,
          city,
          province,
          code,
          isActive,
        });
      }

      if (res?.error) {
        setFormError(res.error);
      } else {
        resetForm();
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-50 font-sans">Gestión de Hospitales</h2>
          <p className="text-xs text-slate-500">Añada, modifique y configure los centros de hemodinámica del registro.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Hospital
          </button>
        )}
      </div>

      {/* Editor / Form Card */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden animate-fade-slide">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          
          <h3 className="text-sm font-bold text-slate-350 tracking-wider uppercase font-mono mb-4">
            {editingId ? 'Editar Hospital' : 'Registrar Nuevo Hospital'}
          </h3>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Nombre del Centro</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Hospital de San Juan"
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200"
                  required
                />
              </div>

              {/* Short name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Nombre Corto / Siglas</label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="Ej: HSJ"
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200"
                />
              </div>

              {/* City */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Ciudad</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej: San Juan de Alicante"
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200"
                />
              </div>

              {/* Province */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Provincia</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Ej: Alicante"
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200"
                />
              </div>

              {/* Code */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Código Interno Único</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej: HOSP-SANJUAN"
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200 font-mono"
                  disabled={editingId !== null} // Lock code once created to maintain relations
                  required
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-4 py-3">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Estado Activo</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${isActive ? 'bg-cyan-500' : 'bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-slate-900 absolute top-0.5 transition-transform shadow ${isActive ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                </button>
              </div>

            </div>

            {formError && (
              <p className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 rounded-xl text-[10px] font-mono leading-relaxed">
                ⚠ {formError}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-950 rounded-xl text-xs font-bold text-slate-450 hover:text-slate-200 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Registrar Centro'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of Hospital Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {hospitals.map((h) => {
          const userCount = userCounts[h.id] || 0;
          const caseCount = caseCounts[h.id] || 0;
          return (
            <div
              key={h.id}
              className={`bg-slate-900 border ${h.is_active ? 'border-slate-800' : 'border-slate-850 opacity-60'} rounded-2xl p-5 flex flex-col justify-between hover:border-slate-750 transition-all`}
            >
              <div>
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-sm text-slate-200 tracking-tight leading-snug">{h.name}</h4>
                  {h.is_active ? (
                    <span className="text-[8px] font-bold bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/10">Activo</span>
                  ) : (
                    <span className="text-[8px] font-bold bg-slate-950 text-slate-500 px-2 py-0.5 rounded border border-slate-800">Inactivo</span>
                  )}
                </div>
                <span className="text-[9px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/20 inline-block mt-2">{h.code}</span>

                <div className="grid grid-cols-2 gap-4 mt-6 text-xs border-t border-b border-slate-850 py-3 font-mono">
                  <div>
                    <span className="text-[9px] text-slate-500 block mb-0.5 uppercase tracking-wider">Usuarios</span>
                    <span className="font-bold text-slate-350">{userCount}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 block mb-0.5 uppercase tracking-wider">Casos</span>
                    <span className="font-bold text-slate-350">{caseCount}</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                  <span>{h.city || 'Ciudad N/A'}{h.province && `, ${h.province}`}</span>
                </div>
              </div>

              <div className="mt-5 flex justify-end gap-2 border-t border-slate-850/60 pt-4">
                <button
                  onClick={() => handleEditClick(h)}
                  className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-350 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                >
                  Editar
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
