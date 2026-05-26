// app/admin/users/UsersFormClient.tsx
'use client';

import React, { useState, useTransition } from 'react';
import { createUserAction, updateUserAction } from '@/lib/supabase/actions';

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  hospital_id: string | null;
  is_active: boolean;
  hospitals: {
    name: string;
  } | null;
}

interface Hospital {
  id: string;
  name: string;
}

interface UsersFormClientProps {
  users: Profile[];
  hospitals: Hospital[];
}

export default function UsersFormClient({ users, hospitals }: UsersFormClientProps) {
  const [isPending, startTransition] = useTransition();

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Field states
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('hospital_user');
  const [hospitalId, setHospitalId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState('OpstarPassword2026!');
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setFullName('');
    setRole('hospital_user');
    setHospitalId('');
    setIsActive(true);
    setPassword('OpstarPassword2026!');
    setEditingId(null);
    setFormError(null);
    setShowForm(false);
  };

  const handleEditClick = (u: Profile) => {
    setEmail(u.email);
    setFullName(u.full_name || '');
    setRole(u.role);
    setHospitalId(u.hospital_id || '');
    setIsActive(u.is_active);
    setEditingId(u.id);
    setFormError(null);
    setShowForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!fullName) {
      setFormError('El nombre completo es obligatorio.');
      return;
    }
    if (!editingId && (!email || !password)) {
      setFormError('El email y la contraseña son obligatorios.');
      return;
    }

    startTransition(async () => {
      let res;
      if (editingId) {
        res = await updateUserAction(editingId, {
          fullName,
          role,
          hospitalId: hospitalId || null,
          isActive,
        });
      } else {
        res = await createUserAction({
          email,
          fullName,
          role,
          hospitalId: hospitalId || null,
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

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 bg-red-950/80 text-red-400 border border-red-900/30 rounded text-[9px] font-mono font-bold">ADMIN</span>;
      case 'monitor':
        return <span className="px-2 py-0.5 bg-amber-950/80 text-amber-400 border border-amber-900/30 rounded text-[9px] font-mono font-bold">MONITOR</span>;
      case 'hospital_user':
        return <span className="px-2 py-0.5 bg-cyan-950/80 text-cyan-400 border border-cyan-900/30 rounded text-[9px] font-mono font-bold">MÉDICO</span>;
      case 'viewer':
        return <span className="px-2 py-0.5 bg-slate-900 text-slate-450 border border-slate-800 rounded text-[9px] font-mono font-bold">VISOR</span>;
      default:
        return <span className="px-2 py-0.5 bg-slate-900 text-slate-500 border border-slate-800 rounded text-[9px] font-mono font-bold">{role}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-50 font-sans">Gestión de Usuarios</h2>
          <p className="text-xs text-slate-500">De alta y controle las cuentas y permisos para el registro.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Usuario
          </button>
        )}
      </div>

      {/* Editor / Form */}
      {showForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden animate-fade-slide">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <h3 className="text-sm font-bold text-slate-350 tracking-wider uppercase font-mono mb-4">
            {editingId ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
          </h3>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Email (Acceso)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: juan@sanjuan.com"
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={editingId !== null}
                />
              </div>

              {/* Full name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Nombre Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Dr. Juan Pérez"
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200"
                  required
                />
              </div>

              {/* Password (only if creating) */}
              {!editingId && (
                <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Contraseña Inicial</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="OpstarPassword2026!"
                    className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200 font-mono"
                    required
                  />
                  <span className="text-[9px] text-slate-550 mt-1 font-mono">
                    💡 El usuario podrá cambiar esta contraseña al acceder por primera vez.
                  </span>
                </div>
              )}

              {/* Role */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Rol de Usuario</label>
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (e.target.value !== 'hospital_user') {
                      setHospitalId(''); // Reset hospital assignment for non-hospital_users
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200 cursor-pointer"
                >
                  <option value="hospital_user">Médico (hospital_user)</option>
                  <option value="monitor">Monitor (monitor)</option>
                  <option value="admin">Administrador (admin)</option>
                  <option value="viewer">Visor Lectura (viewer)</option>
                </select>
              </div>

              {/* Hospital assignment (only active if role = hospital_user) */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                  Hospital Asignado {role !== 'hospital_user' && ' (No aplicable)'}
                </label>
                <select
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  disabled={role !== 'hospital_user'}
                  className="px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 text-xs outline-none text-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Seleccione hospital...</option>
                  {hospitals.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-4 py-3">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Estado Cuenta Activa</span>
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
                {isPending ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of User cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((u) => (
          <div
            key={u.id}
            className={`bg-slate-900 border ${u.is_active ? 'border-slate-800' : 'border-slate-850 opacity-60'} rounded-2xl p-5 flex flex-col justify-between hover:border-slate-750 transition-all`}
          >
            <div>
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h4 className="font-bold text-sm text-slate-200 tracking-tight leading-snug">{u.full_name || 'Sin nombre asignado'}</h4>
                  <span className="text-[10px] font-mono text-slate-500 leading-none">{u.email}</span>
                </div>
                {u.is_active ? (
                  <span className="text-[8px] font-bold bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/10">Activo</span>
                ) : (
                  <span className="text-[8px] font-bold bg-slate-950 text-slate-550 px-2 py-0.5 rounded border border-slate-800">Inactivo</span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2 items-center">
                {getRoleBadge(u.role)}
                {u.role === 'hospital_user' && (
                  <span className="text-[9px] font-mono text-slate-400 truncate max-w-[150px]" title={u.hospitals?.name || 'Ninguno'}>
                    🏢 {u.hospitals?.name || 'Hospital no asignado'}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-850/60 pt-4">
              <button
                onClick={() => handleEditClick(u)}
                className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-350 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
              >
                Editar
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
