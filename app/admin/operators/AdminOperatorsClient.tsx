'use client';

import React, { useState } from 'react';
import {
  createOperatorAction,
  updateOperatorAction,
  deleteOperatorAction,
} from '@/lib/supabase/actions';
import Card from '@/components/design-system/Card';

interface HospitalOperatorLink {
  hospital_id: string;
  hospitals: { name: string };
}

interface Operator {
  id: string;
  full_name: string;
  email: string | null;
  is_active: boolean;
  created_at: string;
  hospital_operators: HospitalOperatorLink[];
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
}: {
  initialOperators: Operator[];
  allHospitals: { id: string; name: string }[];
}) {
  const [operators, setOperators] = useState<Operator[]>(initialOperators);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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

  const OperatorForm = ({ isEdit }: { isEdit: boolean }) => (
    <Card className="p-6 border-cyan-500/30">
      <h3 className="text-lg font-bold text-slate-200 mb-4">
        {isEdit ? 'Editar Operador' : 'Añadir Operador'}
      </h3>
      <div className="space-y-4 max-w-xl">
        {error && (
          <div className="p-3 bg-red-950/50 border border-red-800 text-red-400 text-xs rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Nombre Completo</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:border-cyan-500/50 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase">Email (Opcional)</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:border-cyan-500/50 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase">Estado</label>
          <button
            type="button"
            onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              formData.isActive ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                formData.isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-xs text-slate-400">{formData.isActive ? 'Activo' : 'Inactivo'}</span>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
            Hospitales Asociados
          </label>
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
            onClick={cancel}
            className="px-4 py-2 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={isEdit ? handleUpdate : handleCreate}
            disabled={isSubmitting}
            className="px-4 py-2 bg-cyan-500 text-slate-950 font-bold rounded-lg hover:bg-cyan-400 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar Operador' : 'Guardar Operador'}
          </button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-50 tracking-tight">Operadores Clínicos</h1>
          <p className="text-slate-400 mt-1">Gestión de médicos operadores y asignación a centros</p>
        </div>
        {!showAdd && !editingId && (
          <button
            onClick={openAdd}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black rounded-lg transition-all"
          >
            + Nuevo Operador
          </button>
        )}
      </div>

      {/* Global error (e.g. from delete) */}
      {error && !showAdd && !editingId && (
        <div className="p-3 bg-red-950/50 border border-red-800 text-red-400 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAdd && <OperatorForm isEdit={false} />}

      {/* Operators Table */}
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
            {operators.map(op => (
              <React.Fragment key={op.id}>
                <tr className="hover:bg-slate-900/30 transition-colors">
                  <td className="p-4 font-medium text-slate-200">{op.full_name}</td>
                  <td className="p-4">{op.email || '—'}</td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {op.hospital_operators?.map(ho => (
                        <span
                          key={ho.hospital_id}
                          className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300"
                        >
                          {ho.hospitals.name}
                        </span>
                      ))}
                      {(!op.hospital_operators || op.hospital_operators.length === 0) && (
                        <span className="text-slate-600 text-xs">Sin hospital</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold ${
                        op.is_active
                          ? 'bg-emerald-950/40 text-emerald-400'
                          : 'bg-red-950/40 text-red-400'
                      }`}
                    >
                      {op.is_active ? 'ACTIVO' : 'INACTIVO'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => openEdit(op)}
                        className="text-cyan-500 hover:text-cyan-400 text-xs font-bold transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(op.id)}
                        className="text-red-500 hover:text-red-400 text-xs font-bold transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Inline edit row */}
                {editingId === op.id && (
                  <tr>
                    <td colSpan={5} className="p-4 bg-slate-900/60">
                      <OperatorForm isEdit={true} />
                    </td>
                  </tr>
                )}

                {/* Delete confirmation row */}
                {deleteConfirmId === op.id && (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 bg-red-950/20 border-y border-red-900/40">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-red-300">
                          ¿Confirmar eliminación de <strong>{op.full_name}</strong>? Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1.5 border border-slate-700 rounded text-xs text-slate-400 hover:text-slate-200 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => handleDelete(op.id)}
                            disabled={isSubmitting}
                            className="px-3 py-1.5 bg-red-700 hover:bg-red-600 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
                          >
                            {isSubmitting ? 'Eliminando...' : 'Sí, eliminar'}
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}

            {operators.length === 0 && (
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
