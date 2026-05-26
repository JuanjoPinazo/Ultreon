// app/admin/investigators/InvestigatorsFormClient.tsx
'use client';

import React, { useState, useTransition } from 'react';
import {
  createInvestigatorAction,
  updateInvestigatorAction,
  toggleInvestigatorActiveAction,
} from '@/lib/supabase/actions';

interface Hospital {
  id: string;
  name: string;
  short_name: string;
}

interface Investigator {
  id: string;
  hospital_id: string;
  full_name: string;
  role: 'principal_investigator' | 'sub_investigator' | 'coordinator' | 'data_manager' | 'monitor' | 'other';
  email: string | null;
  phone: string | null;
  specialty: string | null;
  is_principal_investigator: boolean;
  is_active: boolean;
  display_order: number;
  hospitals?: Hospital;
}

interface InvestigatorsFormClientProps {
  investigators: Investigator[];
  hospitals: Hospital[];
}

const ROLE_LABELS: Record<string, string> = {
  principal_investigator: 'Investigador Principal (IP)',
  sub_investigator: 'Sub-Investigador',
  coordinator: 'Coordinador',
  data_manager: 'Data Manager',
  monitor: 'Monitor Clínico',
  other: 'Otro',
};

const ROLE_COLORS: Record<string, string> = {
  principal_investigator: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40',
  sub_investigator: 'text-sky-400 bg-sky-950/30 border-sky-800/40',
  coordinator: 'text-violet-400 bg-violet-950/30 border-violet-800/40',
  data_manager: 'text-amber-400 bg-amber-950/30 border-amber-800/40',
  monitor: 'text-pink-400 bg-pink-950/30 border-pink-800/40',
  other: 'text-slate-400 bg-slate-900 border-slate-800',
};

export default function InvestigatorsFormClient({
  investigators,
  hospitals,
}: InvestigatorsFormClientProps) {
  const [isPending, startTransition] = useTransition();

  // Form toggles
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [hospitalId, setHospitalId] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<string>('sub_investigator');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [isPrincipalInvestigator, setIsPrincipalInvestigator] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHospitalFilter, setSelectedHospitalFilter] = useState('all');

  const resetForm = () => {
    setHospitalId('');
    setFullName('');
    setRole('sub_investigator');
    setEmail('');
    setPhone('');
    setSpecialty('');
    setIsPrincipalInvestigator(false);
    setIsActive(true);
    setDisplayOrder(0);
    setEditingId(null);
    setFormError(null);
    setShowForm(false);
  };

  const handleEditClick = (inv: Investigator) => {
    setHospitalId(inv.hospital_id);
    setFullName(inv.full_name);
    setRole(inv.role);
    setEmail(inv.email || '');
    setPhone(inv.phone || '');
    setSpecialty(inv.specialty || '');
    setIsPrincipalInvestigator(inv.is_principal_investigator);
    setIsActive(inv.is_active);
    setDisplayOrder(inv.display_order);
    setEditingId(inv.id);
    setFormError(null);
    setShowForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName || !hospitalId || !role) {
      setFormError('El nombre completo, hospital y rol son obligatorios.');
      return;
    }

    startTransition(async () => {
      let res;
      const payload = {
        hospitalId,
        fullName,
        role: role as any,
        email: email || null,
        phone: phone || null,
        specialty: specialty || null,
        isPrincipalInvestigator,
        isActive,
        displayOrder: Number(displayOrder) || 0,
      };

      if (editingId) {
        res = await updateInvestigatorAction(editingId, payload);
      } else {
        res = await createInvestigatorAction(payload);
      }

      if (res?.error) {
        setFormError(res.error);
      } else {
        resetForm();
      }
    });
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await toggleInvestigatorActiveAction(id, !currentStatus);
      if (res?.error) {
        alert(`Error al cambiar el estado: ${res.error}`);
      }
    });
  };

  // Group and filter investigators
  const filteredInvestigators = investigators.filter((inv) => {
    const matchesSearch =
      inv.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.specialty && inv.specialty.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (inv.email && inv.email.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesHospital =
      selectedHospitalFilter === 'all' || inv.hospital_id === selectedHospitalFilter;

    return matchesSearch && matchesHospital;
  });

  // Group investigators by hospital for visual sorting
  const groupedByHospital = hospitals.reduce<Record<string, { hospital: Hospital; items: Investigator[] }>>(
    (acc, hosp) => {
      const items = filteredInvestigators.filter((inv) => inv.hospital_id === hosp.id);
      // Sort items: principal_investigator first, then display_order asc
      const sortedItems = [...items].sort((a, b) => {
        if (a.is_principal_investigator && !b.is_principal_investigator) return -1;
        if (!a.is_principal_investigator && b.is_principal_investigator) return 1;
        return a.display_order - b.display_order;
      });

      acc[hosp.id] = { hospital: hosp, items: sortedItems };
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-50 font-sans">Gestión de Investigadores</h2>
          <p className="text-xs text-slate-500">Administre el directorio científico de médicos e investigadores clínicos.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="self-start px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Investigador
          </button>
        )}
      </div>

      {/* Form Card */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden animate-fade-slide">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <h3 className="text-sm font-bold text-slate-350 tracking-wider uppercase font-mono mb-4">
            {editingId ? 'Editar Investigador' : 'Registrar Nuevo Investigador'}
          </h3>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Nombre Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Dr. Salvador Almenar"
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200"
                  required
                />
              </div>

              {/* Hospital */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Hospital de Afiliación</label>
                <select
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200"
                  required
                >
                  <option value="">Seleccione un hospital...</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Role */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Rol Científico</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200"
                  required
                >
                  {Object.entries(ROLE_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Specialty */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Especialidad médica</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ej: Cardiología Intervencionista"
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200"
                />
              </div>

              {/* Display Order */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Orden de Visualización</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  placeholder="Ej: 0"
                  min="0"
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200 font-mono"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Email (Opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: doctor@hospital.com"
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200"
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Teléfono (Opcional)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: +34 600 000 000"
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200"
                />
              </div>

              {/* Checkboxes Row */}
              <div className="flex flex-wrap items-center gap-6 pt-5">
                {/* Principal Investigator */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPrincipalInvestigator}
                    onChange={(e) => setIsPrincipalInvestigator(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">¿Investigador Principal (IP)?</span>
                </label>

                {/* Active status */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Estado Activo</span>
                </label>
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
                {isPending ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Registrar Investigador'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <svg
            className="w-4 h-4 text-slate-500 absolute left-3.5 top-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, especialidad o email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/40 text-xs outline-none text-slate-300 placeholder-slate-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider whitespace-nowrap">Filtrar por hospital:</label>
          <select
            value={selectedHospitalFilter}
            onChange={(e) => setSelectedHospitalFilter(e.target.value)}
            className="w-full md:w-64 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/40 text-xs outline-none text-slate-350"
          >
            <option value="all">Todos los Hospitales</option>
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Investigators List (Grouped by Hospital) */}
      <div className="space-y-6">
        {hospitals.map((hosp) => {
          const group = groupedByHospital[hosp.id];
          if (!group || group.items.length === 0) return null;

          return (
            <div key={hosp.id} className="bg-slate-900/60 border border-slate-850 rounded-3xl p-5 space-y-4">
              {/* Hospital Title Banner */}
              <div className="flex justify-between items-center pb-3 border-b border-slate-850">
                <div>
                  <h4 className="font-bold text-sm text-slate-200 tracking-tight">{hosp.name}</h4>
                  <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Investigadores adscritos</span>
                </div>
                <span className="px-2.5 py-0.5 bg-slate-950 border border-slate-800 text-[9px] font-mono font-bold rounded-lg text-slate-400">
                  {group.items.length} {group.items.length === 1 ? 'médico' : 'médicos'}
                </span>
              </div>

              {/* Table / Grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850/40 text-[9px] font-mono text-slate-500 uppercase tracking-widest">
                      <th className="py-2.5 font-bold">Investigador</th>
                      <th className="py-2.5 font-bold">Rol en Registro</th>
                      <th className="py-2.5 font-bold">Especialidad</th>
                      <th className="py-2.5 font-bold">Contacto</th>
                      <th className="py-2.5 font-bold text-center">Orden</th>
                      <th className="py-2.5 font-bold text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/20 text-xs">
                    {group.items.map((inv) => (
                      <tr key={inv.id} className={`group hover:bg-slate-950/20 ${!inv.is_active ? 'opacity-50' : ''}`}>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm">🩺</span>
                            <div>
                              <span className="font-bold text-slate-200 block">{inv.full_name}</span>
                              {inv.is_principal_investigator && (
                                <span className="inline-block mt-0.5 text-[8px] font-black font-mono tracking-wider px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40 uppercase">
                                  Investigador Principal (IP)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${ROLE_COLORS[inv.role] || ROLE_COLORS.other}`}>
                            {ROLE_LABELS[inv.role] || inv.role}
                          </span>
                        </td>
                        <td className="py-3 text-slate-400 italic">
                          {inv.specialty || 'No especificada'}
                        </td>
                        <td className="py-3 font-mono text-[10px] text-slate-400 space-y-0.5">
                          {inv.email && <div className="block">{inv.email}</div>}
                          {inv.phone && <div className="block text-slate-550">{inv.phone}</div>}
                          {!inv.email && !inv.phone && <span className="text-slate-700">—</span>}
                        </td>
                        <td className="py-3 text-center font-mono text-slate-400">
                          {inv.display_order}
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleActive(inv.id, inv.is_active)}
                              className={`px-2 py-1 rounded text-[9px] font-bold font-mono transition-all cursor-pointer ${
                                inv.is_active
                                  ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/30 hover:bg-emerald-950/80'
                                  : 'bg-red-950/40 text-red-400 border border-red-800/30 hover:bg-red-950/80'
                              }`}
                            >
                              {inv.is_active ? 'Activo' : 'Inactivo'}
                            </button>
                            <button
                              onClick={() => handleEditClick(inv)}
                              className="px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[9.5px] text-slate-350 font-bold rounded transition-all cursor-pointer"
                            >
                              Editar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}

        {filteredInvestigators.length === 0 && (
          <div className="p-8 rounded-3xl border border-slate-850 bg-slate-900/20 text-center space-y-2">
            <span className="text-3xl">🔎</span>
            <h4 className="text-sm font-bold text-slate-300">No se encontraron investigadores</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">Pruebe a cambiar los términos de búsqueda o verifique que el hospital seleccionado contenga investigadores activos.</p>
          </div>
        )}
      </div>
    </div>
  );
}
