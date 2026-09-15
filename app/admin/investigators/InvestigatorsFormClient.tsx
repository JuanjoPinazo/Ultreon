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
  other: 'text-muted-foreground bg-card border-border',
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
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
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
  // Requirement: Order by Center -> Investigator Name
  const groupedByHospital = hospitals.reduce<Record<string, { hospital: Hospital; items: Investigator[] }>>(
    (acc, hosp) => {
      const items = filteredInvestigators.filter((inv) => inv.hospital_id === hosp.id);
      // Sort items: principal_investigator first, then alphabetically by name
      const sortedItems = [...items].sort((a, b) => {
        if (a.is_principal_investigator && !b.is_principal_investigator) return -1;
        if (!a.is_principal_investigator && b.is_principal_investigator) return 1;
        return a.full_name.localeCompare(b.full_name);
      });

      if (sortedItems.length > 0 || selectedHospitalFilter === hosp.id) {
        acc[hosp.id] = { hospital: hosp, items: sortedItems };
      }
      return acc;
    },
    {}
  );
  
  // Create a flat list ordered by hospital name, then investigator name
  const flatOrderedInvestigators: (Investigator & { hospitalObj: Hospital })[] = [];
  hospitals
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name))
    .forEach(hosp => {
      if (groupedByHospital[hosp.id] && groupedByHospital[hosp.id].items.length > 0) {
        groupedByHospital[hosp.id].items.forEach(item => {
          flatOrderedInvestigators.push({ ...item, hospitalObj: hosp });
        });
      }
    });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">Gestión de Investigadores</h2>
          <p className="text-xs text-muted-foreground">Administre el directorio científico de médicos e investigadores clínicos.</p>
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
        <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden animate-fade-slide">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <h3 className="text-sm font-bold text-muted-foreground tracking-wider uppercase font-mono mb-4">
            {editingId ? 'Editar Investigador' : 'Registrar Nuevo Investigador'}
          </h3>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Full Name */}
              <div className="flex flex-col gap-1 md:col-span-2">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Nombre Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Dr. Salvador Almenar"
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-cyan-500/50 text-xs outline-none text-foreground"
                  required
                />
              </div>

              {/* Hospital */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Hospital de Afiliación</label>
                <select
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-cyan-500/50 text-xs outline-none text-foreground"
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
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Rol Científico</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-cyan-500/50 text-xs outline-none text-foreground"
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
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Especialidad médica</label>
                <input
                  type="text"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  placeholder="Ej: Cardiología Intervencionista"
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-cyan-500/50 text-xs outline-none text-foreground"
                />
              </div>

              {/* Display Order */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Orden de Visualización</label>
                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  placeholder="Ej: 0"
                  min="0"
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-cyan-500/50 text-xs outline-none text-foreground font-mono"
                />
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Email (Opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: doctor@hospital.com"
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-cyan-500/50 text-xs outline-none text-foreground"
                />
              </div>

              {/* Phone */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Teléfono (Opcional)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej: +34 600 000 000"
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-cyan-500/50 text-xs outline-none text-foreground"
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
                    className="w-4 h-4 rounded bg-background border-border text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">¿Investigador Principal (IP)?</span>
                </label>

                {/* Active status */}
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded bg-background border-border text-cyan-500 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Estado Activo</span>
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
                className="px-4 py-2 border border-border hover:bg-background rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-foreground transition-all cursor-pointer"
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
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <svg
            className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3"
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
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border focus:border-cyan-500/40 text-xs outline-none text-muted-foreground placeholder-slate-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono tracking-wider whitespace-nowrap">Filtrar por hospital:</label>
          <select
            value={selectedHospitalFilter}
            onChange={(e) => setSelectedHospitalFilter(e.target.value)}
            className="w-full md:w-64 px-3 py-2 rounded-xl bg-background border border-border focus:border-cyan-500/40 text-xs outline-none text-muted-foreground"
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

      {/* List / Table View of Investigators */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background/50 border-b border-border text-[10px] uppercase font-mono text-muted-foreground">
              <th className="px-4 py-3 font-bold tracking-wider">Investigador</th>
              <th className="px-4 py-3 font-bold tracking-wider">Centro</th>
              <th className="px-4 py-3 font-bold tracking-wider">Rol / Posición</th>
              <th className="px-4 py-3 font-bold tracking-wider text-center">Estado</th>
              <th className="px-4 py-3 font-bold tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {flatOrderedInvestigators.map((inv) => {
              const roleBadgeColor = ROLE_COLORS[inv.role] || ROLE_COLORS.other;
              return (
                <tr key={inv.id} className={`hover:bg-slate-200 dark:hover:bg-slate-800/30 transition-colors ${!inv.is_active ? 'opacity-60' : ''}`}>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-bold text-sm text-foreground">
                          {inv.is_principal_investigator && <span className="mr-1.5 text-cyan-400">★</span>}
                          {inv.full_name}
                        </div>
                        {inv.email && <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{inv.email}</div>}
                        {inv.specialty && <div className="text-[10px] text-muted-foreground mt-0.5">{inv.specialty}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[12px]">🏥</span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {inv.hospitalObj.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <span className={`inline-block px-2 py-0.5 rounded border text-[9px] font-bold font-mono tracking-wide ${roleBadgeColor}`}>
                      {ROLE_LABELS[inv.role] || 'Otro'}
                    </span>
                  </td>
                  <td className="px-4 py-3 align-middle text-center">
                    {inv.is_active ? (
                      <span className="text-[9px] font-bold bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/20">ACTIVO</span>
                    ) : (
                      <span className="text-[9px] font-bold bg-card text-muted-foreground px-2 py-0.5 rounded border border-border dark:border-slate-700">INACTIVO</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-middle text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(inv)}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-muted-foreground text-[10px] font-bold rounded transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleToggleActive(inv.id, inv.is_active)}
                        className={`px-2.5 py-1.5 border text-[10px] font-bold rounded transition-colors ${
                          inv.is_active
                            ? 'bg-red-950/20 hover:bg-red-900/40 border-red-900/30 text-red-400'
                            : 'bg-emerald-950/20 hover:bg-emerald-900/40 border-emerald-900/30 text-emerald-400'
                        }`}
                      >
                        {inv.is_active ? 'Desactivar' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            
            {flatOrderedInvestigators.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs">
                  No se encontraron investigadores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
