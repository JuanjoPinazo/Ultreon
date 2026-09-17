'use client';

import React, { useState, useMemo } from 'react';
import {
  createOperatorAction,
  updateOperatorAction,
  deleteOperatorAction,
} from '@/lib/supabase/actions';
import Card from '@/components/design-system/Card';
import { useGlobalToast } from '@/components/providers/GlobalToastProvider';
import { useGlobalDialog } from '@/components/providers/GlobalDialogProvider';

interface HospitalOperatorLink {
  hospital_id: string;
  hospitals: { name: string };
}

interface OperatorUserLink {
  user_id: string;
  profiles: { email: string };
}

interface Operator {
  id: string;
  full_name: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
  hospital_operators: HospitalOperatorLink[];
  operator_user_links?: OperatorUserLink[];
}

const emptyForm = {
  fullName: '',
  email: '',
  isActive: true,
  hospitalIds: [] as string[],
};

export default function AdminOperatorsClient({
  initialOperators,
  allHospitals,
  allProfiles,
}: {
  initialOperators: Operator[];
  allHospitals: { id: string; name: string }[];
  allProfiles: { id: string; full_name: string; email: string; role: string }[];
}) {
  const [operators, setOperators] = useState<Operator[]>(initialOperators);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { showSuccess, showError } = useGlobalToast();
  const { showDialog } = useGlobalDialog();
  
  // Linking state
  const [linkingOperatorId, setLinkingOperatorId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHospitalFilter, setSelectedHospitalFilter] = useState('all');
  const [sortField, setSortField] = useState<'name' | 'hospital' | 'link' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'name' | 'hospital' | 'link') => {
    if (sortField === field) {
      if (sortOrder === 'asc') setSortOrder('desc');
      else { setSortField(null); setSortOrder('asc'); }
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedHospitalFilter('all');
    setSortField(null);
    setSortOrder('asc');
  };

  const toggleHospital = (id: string) => {
    setFormData(prev => ({
      ...prev,
      hospitalIds: prev.hospitalIds.includes(id)
        ? prev.hospitalIds.filter(hId => hId !== id)
        : [...prev.hospitalIds, id],
    }));
  };

  const openEdit = (op: Operator) => {
    setEditingId(op.id);
    setShowAdd(false);
    setError('');
    setFormData({
      fullName: op.full_name,
      email: op.email || '',
      isActive: op.is_active,
      hospitalIds: op.hospital_operators.map(ho => ho.hospital_id),
    });
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const openAdd = () => {
    setShowAdd(true);
    setEditingId(null);
    setError('');
    setFormData(emptyForm);
  };

  const cancel = () => {
    setShowAdd(false);
    setEditingId(null);
    setError('');
    setFormData(emptyForm);
  };

  const handleCreate = async () => {
    if (!formData.fullName.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    setIsSubmitting(true);
    setError('');
    const res = await createOperatorAction({
      fullName: formData.fullName.trim(),
      email: formData.email || null,
      isActive: formData.isActive,
      hospitalIds: formData.hospitalIds,
    });
    if (res.error) {
      setError(res.error);
    } else {
      cancel();
      setTimeout(() => window.location.reload(), 500);
    }
    setIsSubmitting(false);
  };

  const handleUpdate = async () => {
    if (!formData.fullName.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!editingId) return;
    setIsSubmitting(true);
    setError('');
    const res = await updateOperatorAction(editingId, {
      fullName: formData.fullName.trim(),
      email: formData.email || null,
      isActive: formData.isActive,
      hospitalIds: formData.hospitalIds,
    });
    if (res.error) {
      setError(res.error);
    } else {
      cancel();
      setTimeout(() => window.location.reload(), 500);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    setError('');
    const res = await deleteOperatorAction(id);
    if (res.error) {
      setError(res.error);
      setDeleteConfirmId(null);
    } else {
      setOperators(prev => prev.filter(op => op.id !== id));
      setDeleteConfirmId(null);
    }
    setIsSubmitting(false);
  };

  const handleLinkUser = async () => {
    if (!linkingOperatorId || !selectedUserId) return;
    setIsSubmitting(true);
    // import dynamically or add to imports
    const { linkOperatorToUserAction } = await import('@/lib/supabase/actions');
    const res = await linkOperatorToUserAction(linkingOperatorId, selectedUserId);
    if (res.error) {
      showDialog({
        type: 'error',
        title: 'Error de vinculación',
        message: res.error
      });
    } else {
      setLinkingOperatorId(null);
      showSuccess('Usuario vinculado correctamente');
      setTimeout(() => window.location.reload(), 500);
    }
    setIsSubmitting(false);
  };

  const handleUnlinkUser = async (opId: string) => {
    showDialog({
      type: 'warning',
      title: 'Desvincular usuario',
      message: '¿Estás seguro de desvincular este usuario?',
      confirmLabel: 'Sí, desvincular',
      onConfirm: async () => {
        setIsSubmitting(true);
        const { unlinkOperatorAction } = await import('@/lib/supabase/actions');
        const res = await unlinkOperatorAction(opId);
        if (res.error) {
          showDialog({
            type: 'error',
            title: 'Error de desvinculación',
            message: res.error
          });
        } else {
          showSuccess('Usuario desvinculado correctamente');
          setTimeout(() => window.location.reload(), 500);
        }
        setIsSubmitting(false);
      }
    });
  };

  // Build the view model. If an operator belongs to multiple hospitals,
  // we can show them uniquely but sort them by their primary (first) hospital,
  // or we can show a row per hospital connection if filtering.
  // The requirement says: "Ordenar por centro. Dentro de cada centro, ordenar alfabéticamente. Mantener si pertenece a varios."
  // We will display one row per operator. Sorting by their first associated hospital's name.
  
  const filteredOperators = useMemo(() => {
    return operators.filter(op => {
      const matchesSearch = op.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (op.email && op.email.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesHospital = selectedHospitalFilter === 'all' || 
                              op.hospital_operators.some(ho => ho.hospital_id === selectedHospitalFilter);
      return matchesSearch && matchesHospital;
    });
  }, [operators, searchQuery, selectedHospitalFilter]);

  const sortedOperators = useMemo(() => {
    return [...filteredOperators].sort((a, b) => {
      if (sortField) {
        let valA = '';
        let valB = '';
        if (sortField === 'name') { valA = a.full_name || ''; valB = b.full_name || ''; }
        if (sortField === 'hospital') {
          valA = a.hospital_operators.length > 0 ? a.hospital_operators.map(ho => ho.hospitals.name).sort()[0] : 'ZZZ';
          valB = b.hospital_operators.length > 0 ? b.hospital_operators.map(ho => ho.hospitals.name).sort()[0] : 'ZZZ';
        }
        if (sortField === 'link') {
          valA = a.operator_user_links && a.operator_user_links.length > 0 ? 'VINCULADO' : 'SIN USUARIO';
          valB = b.operator_user_links && b.operator_user_links.length > 0 ? 'VINCULADO' : 'SIN USUARIO';
        }
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        // Default sort (original behavior)
        const aPrimary = a.hospital_operators.length > 0 ? a.hospital_operators.map(ho => ho.hospitals.name).sort()[0] : 'ZZZ';
        const bPrimary = b.hospital_operators.length > 0 ? b.hospital_operators.map(ho => ho.hospitals.name).sort()[0] : 'ZZZ';
        if (aPrimary !== bPrimary) return aPrimary.localeCompare(bPrimary);
        return a.full_name.localeCompare(b.full_name);
      }
    });
  }, [filteredOperators, sortField, sortOrder]);



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">Gestión de Operadores Clínicos</h2>
          <p className="text-xs text-muted-foreground">Maneje los operadores de sala y técnicos asociados a cada centro.</p>
        </div>
        {!showAdd && !editingId && (
          <button
            onClick={openAdd}
            className="self-start px-4 py-2.5 bg-primary hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Operador
          </button>
        )}
      </div>

      {(showAdd || editingId) && (
        <Card className="p-6 border-primary/30 bg-card animate-fade-slide">
          <h3 className="text-sm font-bold text-muted-foreground tracking-wider uppercase font-mono mb-4">
            {editingId ? 'Editar Operador' : 'Añadir Operador'}
          </h3>
          <div className="space-y-4 max-w-2xl">
            {error && (
              <div className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 rounded-xl text-[10px] font-mono leading-relaxed">
                ⚠ {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground focus:border-primary/50 outline-none"
                  placeholder="Ej: Dra. Elena García"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono block mb-1">Email (Opcional)</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-xs text-foreground focus:border-primary/50 outline-none"
                  placeholder="Ej: elena@hospital.com"
                />
              </div>
            </div>

            <div className="flex items-center gap-4 py-2">
              <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Estado Cuenta</span>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${formData.isActive ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800'}`}
              >
                <div className={`w-5 h-5 rounded-full bg-card absolute top-0.5 transition-transform shadow ${formData.isActive ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
              </button>
              <span className="text-[10px] text-muted-foreground">{formData.isActive ? 'Activo' : 'Inactivo'}</span>
            </div>

            <div>
              <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono block mb-2">
                Hospitales Asociados (Puede seleccionar múltiples)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-3 bg-background border border-border rounded-xl">
                {allHospitals.map(h => (
                  <label key={h.id} className="flex items-start gap-2 cursor-pointer p-1.5 hover:bg-card rounded transition-colors group">
                    <input
                      type="checkbox"
                      checked={formData.hospitalIds.includes(h.id)}
                      onChange={() => toggleHospital(h.id)}
                      className="mt-0.5 w-4 h-4 rounded bg-card border-border dark:border-slate-700 text-primary focus:ring-cyan-500/20 cursor-pointer"
                    />
                    <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-tight">{h.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-border/60">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Pago y Compliance</h4>
                <div className="px-2 py-0.5 rounded border border-emerald-900/20 bg-emerald-950/80 text-emerald-400 text-[9px] font-bold">
                  APTO PARA LIQUIDACIÓN
                </div>
              </div>
              <div className="p-4 bg-muted/50 rounded-xl border border-border">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-[10px] uppercase font-mono text-muted-foreground">Contrato</div>
                    <div className="text-xs font-bold text-foreground">VIGENTE</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-mono text-muted-foreground">FMV</div>
                    <div className="text-xs font-bold text-foreground">APROBADO</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-mono text-muted-foreground">Compatibilidad</div>
                    <div className="text-xs font-bold text-foreground">NOT_REQUIRED</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-mono text-muted-foreground">Autorización</div>
                    <div className="text-xs font-bold text-foreground">OK</div>
                  </div>
                </div>
                
                <div className="border-t border-border/60 pt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <div className="text-[10px] uppercase font-mono text-muted-foreground">Beneficiario Vigente</div>
                    <div className="text-xs font-bold text-foreground">QA Beneficiary</div>
                    <div className="text-[10px] text-muted-foreground">Inicio: 01/09/2026</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-mono text-muted-foreground">Modalidad Factura</div>
                    <div className="text-xs font-bold text-foreground">PROFESSIONAL</div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase font-mono text-muted-foreground">Impuestos</div>
                    <div className="text-xs font-bold text-foreground">IVA: 21% | IRPF: 15%</div>
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button type="button" className="px-3 py-1.5 bg-background border border-border text-xs font-medium rounded-lg hover:bg-card transition-colors">
                    Configurar Compliance
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-border/60 mt-6">
              <button
                onClick={cancel}
                disabled={isSubmitting}
                className="px-4 py-2 border border-border hover:bg-background rounded-xl text-xs font-bold text-muted-foreground dark:text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={editingId ? handleUpdate : handleCreate}
                disabled={isSubmitting}
                className="px-5 py-2 bg-primary hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Añadir Operador'}
              </button>
            </div>
          </div>
        </Card>
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
            placeholder="Buscar operador por nombre o email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border focus:border-primary/40 text-xs outline-none text-muted-foreground placeholder-slate-600"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-[10px] font-bold text-muted-foreground uppercase font-mono tracking-wider whitespace-nowrap">Filtrar por hospital:</label>
          <select
            value={selectedHospitalFilter}
            onChange={(e) => setSelectedHospitalFilter(e.target.value)}
            className="w-full md:w-64 px-3 py-2 rounded-xl bg-background border border-border focus:border-primary/40 text-xs outline-none text-muted-foreground"
          >
            <option value="all">Todos los Hospitales</option>
            {allHospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name}
              </option>
            ))}
          </select>
          {(searchQuery || selectedHospitalFilter !== 'all' || sortField) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-foreground border border-border rounded-lg bg-card hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Limpiar Filtros
            </button>
          )}
        </div>
      </div>

      {/* List / Table View of Operators */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background/50 border-b border-border text-[10px] uppercase font-mono text-muted-foreground">
              <th className="px-4 py-3 font-bold tracking-wider cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>
                Operador {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 font-bold tracking-wider cursor-pointer hover:text-foreground" onClick={() => handleSort('hospital')}>
                Hospitales Asociados {sortField === 'hospital' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 font-bold tracking-wider text-center">Estado</th>
              <th className="px-4 py-3 font-bold tracking-wider text-center cursor-pointer hover:text-foreground" onClick={() => handleSort('link')}>
                Acceso al sistema {sortField === 'link' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 font-bold tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedOperators.map((op) => {
              const isConfirmingDelete = deleteConfirmId === op.id;
              
              return (
                <React.Fragment key={op.id}>
                  <tr className={`hover:bg-slate-200 dark:hover:bg-slate-800/30 transition-colors ${!op.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-primary font-bold text-xs uppercase border border-border dark:border-slate-700">
                          {op.full_name.substring(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-sm text-foreground">{op.full_name}</div>
                          {op.email && <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{op.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {op.hospital_operators.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {op.hospital_operators.map(ho => (
                            <span key={ho.hospital_id} className="text-[9px] font-medium bg-background text-muted-foreground px-2 py-0.5 rounded border border-border flex items-center gap-1">
                              <span className="text-[8px]">🏥</span> {ho.hospitals.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">No asignado a ningún hospital</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      {op.is_active ? (
                        <span className="text-[9px] font-bold bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/20">ACTIVO</span>
                      ) : (
                        <span className="text-[9px] font-bold bg-card text-muted-foreground px-2 py-0.5 rounded border border-border dark:border-slate-700">INACTIVO</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      {op.operator_user_links && op.operator_user_links.length > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="text-[9px] font-bold bg-cyan-950/80 text-cyan-400 px-2 py-0.5 rounded border border-cyan-900/20">USUARIO VINCULADO</span>
                          <span className="text-[10px] font-mono text-muted-foreground mt-1">{op.operator_user_links[0].profiles.email}</span>
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold bg-slate-200 dark:bg-slate-800 text-muted-foreground px-2 py-0.5 rounded border border-border">SIN USUARIO</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(op)}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-muted-foreground text-[10px] font-bold rounded transition-colors"
                        >
                          Editar
                        </button>
                        {op.operator_user_links && op.operator_user_links.length > 0 ? (
                          <button
                            onClick={() => handleUnlinkUser(op.id)}
                            className="px-2.5 py-1.5 bg-orange-950/40 hover:bg-orange-900/60 border border-orange-900/40 text-orange-400 text-[10px] font-bold rounded transition-colors"
                          >
                            Desvincular
                          </button>
                        ) : (
                          <button
                            onClick={() => setLinkingOperatorId(op.id)}
                            className="px-2.5 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-900/40 text-cyan-400 text-[10px] font-bold rounded transition-colors"
                          >
                            Vincular
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteConfirmId(op.id)}
                          className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 text-[10px] font-bold rounded transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {isConfirmingDelete && (
                    <tr>
                      <td colSpan={4} className="px-4 py-3 bg-red-950/10 border-b border-border/60">
                        <div className="flex items-center justify-between p-3 bg-red-950/30 border border-red-900/50 rounded-xl">
                          <p className="text-[10px] text-red-300">
                            ¿Eliminar permanentemente a <strong>{op.full_name}</strong>? Esta acción no se puede deshacer.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1.5 border border-border dark:border-slate-700 rounded-lg text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleDelete(op.id)}
                              disabled={isSubmitting}
                              className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-[10px] font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                              {isSubmitting ? 'Eliminando...' : 'Sí, eliminar'}
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}

            {sortedOperators.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs">
                  No se encontraron operadores.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {linkingOperatorId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <Card className="max-w-md w-full p-6 animate-fade-slide">
            <h3 className="text-lg font-bold mb-2">Vincular Usuario a Operador</h3>
            <p className="text-sm text-muted-foreground mb-4">Seleccione un usuario existente para vincularlo a este operador clínico.</p>
            
            <div className="mb-6">
              <label className="block text-xs font-bold text-muted-foreground uppercase mb-2">Usuario disponible</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm"
              >
                <option value="">Seleccionar usuario...</option>
                {allProfiles.map(p => (
                  <option key={p.id} value={p.id}>{p.email} ({p.full_name || 'Sin nombre'})</option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setLinkingOperatorId(null)}
                className="px-4 py-2 border border-border hover:bg-background rounded-xl text-xs font-bold text-muted-foreground"
              >
                Cancelar
              </button>
              <button
                onClick={handleLinkUser}
                disabled={isSubmitting || !selectedUserId}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold disabled:opacity-50"
              >
                Vincular
              </button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
}
