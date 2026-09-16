// app/admin/hospitals/HospitalsFormClient.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { createHospitalAction, updateHospitalAction, deleteHospitalAction } from '@/lib/supabase/actions';

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
  invCounts?: Record<string, number>;
  opCounts?: Record<string, number>;
}

export default function HospitalsFormClient({ hospitals, userCounts, caseCounts, invCounts = {}, opCounts = {} }: HospitalsFormClientProps) {
  const [isPending, startTransition] = useTransition();
  const [localHospitals, setLocalHospitals] = useState<Hospital[]>(hospitals);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Field states
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
    setDeleteConfirmId(null);
    setName(h.name);
    setShortName(h.short_name || '');
    setCity(h.city || '');
    setProvince(h.province || '');
    setCode(h.code);
    setIsActive(h.is_active);
    setEditingId(h.id);
    setFormError(null);
    setShowForm(true);
    // Scroll to form
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const handleDeleteConfirm = (id: string) => {
    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteHospitalAction(id);
      if (res?.error) {
        setDeleteError(res.error);
        setDeleteConfirmId(null);
      } else {
        setLocalHospitals(prev => prev.filter(h => h.id !== id));
        setDeleteConfirmId(null);
      }
    });
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
        setTimeout(() => window.location.reload(), 400);
      }
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">Gestión de Hospitales</h2>
          <p className="text-xs text-muted-foreground">Añada, modifique y configure los centros de hemodinámica del registro.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 bg-primary hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Hospital
          </button>
        )}
      </div>

      {/* Global delete error */}
      {deleteError && (
        <p className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 rounded-xl text-[10px] font-mono">
          ⚠ {deleteError}
        </p>
      )}

      {/* Editor / Form Card */}
      {showForm && (
        <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden animate-fade-slide">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
          
          <h3 className="text-sm font-bold text-muted-foreground tracking-wider uppercase font-mono mb-4">
            {editingId ? 'Editar Hospital' : 'Registrar Nuevo Hospital'}
          </h3>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Nombre del Centro</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Hospital de San Juan"
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary/50 text-xs outline-none text-foreground"
                  required
                />
              </div>

              {/* Short name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Nombre Corto / Siglas</label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  placeholder="Ej: HSJ"
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary/50 text-xs outline-none text-foreground"
                />
              </div>

              {/* City */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Ciudad</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej: San Juan de Alicante"
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary/50 text-xs outline-none text-foreground"
                />
              </div>

              {/* Province */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Provincia</label>
                <input
                  type="text"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Ej: Alicante"
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary/50 text-xs outline-none text-foreground"
                />
              </div>

              {/* Code */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Código Interno Único</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ej: HOSP-SANJUAN"
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary/50 text-xs outline-none text-foreground font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={editingId !== null}
                  required
                />
                {editingId && (
                  <span className="text-[9px] text-muted-foreground font-mono">El código no puede modificarse una vez creado.</span>
                )}
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-4 py-3">
                <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Estado Activo</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${isActive ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-card absolute top-0.5 transition-transform shadow ${isActive ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-[10px] text-muted-foreground">{isActive ? 'Activo' : 'Inactivo'}</span>
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
                className="px-4 py-2 border border-border hover:bg-background rounded-xl text-xs font-bold text-muted-foreground dark:text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 bg-primary hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Registrar Centro'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* List / Table of Hospitals */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background/50 border-b border-border text-[10px] uppercase font-mono text-muted-foreground">
              <th className="px-4 py-3 font-bold tracking-wider">Centro</th>
              <th className="px-4 py-3 font-bold tracking-wider">Acrónimo/Código</th>
              <th className="px-4 py-3 font-bold tracking-wider text-center">Estado</th>
              <th className="px-4 py-3 font-bold tracking-wider">Asociados</th>
              <th className="px-4 py-3 font-bold tracking-wider">Ubicación</th>
              <th className="px-4 py-3 font-bold tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {localHospitals.map((h) => {
              const userCount = userCounts[h.id] || 0;
              const caseCount = caseCounts[h.id] || 0;
              const invCount = invCounts[h.id] || 0;
              const opCount = opCounts[h.id] || 0;
              
              const isConfirmingDelete = deleteConfirmId === h.id;
              const canDelete = caseCount === 0;

              return (
                <React.Fragment key={h.id}>
                  <tr className={`hover:bg-slate-200 dark:hover:bg-slate-800/30 transition-colors ${!h.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 align-middle">
                      <div className="font-bold text-sm text-foreground">{h.name}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">Casos: {caseCount}</div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-col gap-1 items-start">
                        {h.short_name && <span className="text-xs text-muted-foreground">{h.short_name}</span>}
                        <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/20">{h.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      {h.is_active ? (
                        <span className="text-[9px] font-bold bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/20">ACTIVO</span>
                      ) : (
                        <span className="text-[9px] font-bold bg-card text-muted-foreground px-2 py-0.5 rounded border border-border dark:border-slate-700">INACTIVO</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
                        <span><strong className="text-muted-foreground">{userCount}</strong> usuarios</span>
                        <span><strong className="text-muted-foreground">{invCount}</strong> investigadores</span>
                        <span><strong className="text-muted-foreground">{opCount}</strong> operadores</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground">
                      <div>{h.city || 'N/A'}</div>
                      <div className="text-[10px] text-muted-foreground">{h.province || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(h)}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-muted-foreground text-[10px] font-bold rounded transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            setDeleteConfirmId(h.id);
                            setShowForm(false);
                            setEditingId(null);
                          }}
                          disabled={!canDelete}
                          title={!canDelete ? 'No se puede eliminar un centro con casos.' : 'Eliminar centro'}
                          className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 text-[10px] font-bold rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {isConfirmingDelete && (
                    <tr>
                      <td colSpan={6} className="px-4 py-3 bg-red-950/10 border-b border-border/60">
                        <div className="flex items-center justify-between p-3 bg-red-950/30 border border-red-900/50 rounded-xl">
                          <p className="text-[10px] text-red-300">
                            ¿Eliminar <strong>{h.name}</strong>?
                            {userCount > 0 && <span className="ml-1 text-amber-400">⚠ Tiene {userCount} usuario(s) asignado(s).</span>}
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1.5 border border-border dark:border-slate-700 rounded-lg text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleDeleteConfirm(h.id)}
                              disabled={isPending}
                              className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isPending ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            
            {localHospitals.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground text-xs">
                  No se encontraron hospitales.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
