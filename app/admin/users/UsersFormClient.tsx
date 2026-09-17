// app/admin/users/UsersFormClient.tsx
'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { createUserAction, updateUserAction, deleteUserAction } from '@/lib/supabase/actions';

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
  currentUserId?: string;
}

export default function UsersFormClient({ users, hospitals, currentUserId }: UsersFormClientProps) {
  const [isPending, startTransition] = useTransition();
  const [localUsers, setLocalUsers] = useState<Profile[]>(users);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Field states
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('hospital_user');
  const [hospitalId, setHospitalId] = useState<string>('');
  const [isActive, setIsActive] = useState(true);
  const [password, setPassword] = useState('OpstarPassword2026!');
  const [formError, setFormError] = useState<string | null>(null);
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'name' | 'email' | 'role' | 'hospital' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: 'name' | 'email' | 'role' | 'hospital') => {
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
    setSortField(null);
    setSortOrder('asc');
  };

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
    setDeleteConfirmId(null);
    setEmail(u.email);
    setFullName(u.full_name || '');
    setRole(u.role);
    setHospitalId(u.hospital_id || '');
    setIsActive(u.is_active);
    setEditingId(u.id);
    setFormError(null);
    setShowForm(true);
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
  };

  const handleDeleteConfirm = (userId: string) => {
    setDeleteError(null);
    startTransition(async () => {
      const res = await deleteUserAction(userId);
      if (res?.error) {
        setDeleteError(res.error);
        setDeleteConfirmId(null);
      } else {
        setLocalUsers(prev => prev.filter(u => u.id !== userId));
        setDeleteConfirmId(null);
      }
    });
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
        setTimeout(() => window.location.reload(), 400);
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
        return <span className="px-2 py-0.5 bg-card text-muted-foreground dark:text-muted-foreground border border-border rounded text-[9px] font-mono font-bold">VISOR</span>;
      default:
        return <span className="px-2 py-0.5 bg-card text-muted-foreground border border-border rounded text-[9px] font-mono font-bold">{role}</span>;
    }
  };

  const filteredUsers = useMemo(() => {
    let result = localUsers.filter(u => {
      const q = searchQuery.toLowerCase();
      return (
        (u.full_name?.toLowerCase().includes(q)) ||
        (u.email?.toLowerCase().includes(q))
      );
    });

    if (sortField) {
      result.sort((a, b) => {
        let valA = '';
        let valB = '';
        if (sortField === 'name') { valA = a.full_name || ''; valB = b.full_name || ''; }
        if (sortField === 'email') { valA = a.email || ''; valB = b.email || ''; }
        if (sortField === 'role') { valA = a.role || ''; valB = b.role || ''; }
        if (sortField === 'hospital') { valA = a.hospitals?.name || ''; valB = b.hospitals?.name || ''; }
        
        return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });
    }
    return result;
  }, [localUsers, searchQuery, sortField, sortOrder]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground font-sans">Gestión de Usuarios</h2>
          <p className="text-xs text-muted-foreground">De alta y controle las cuentas y permisos para el registro.</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2.5 bg-primary hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Usuario
          </button>
        )}
      </div>

      {/* Global delete error */}
      {deleteError && (
        <p className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 rounded-xl text-[10px] font-mono">
          ⚠ {deleteError}
        </p>
      )}

      {/* Editor / Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-3xl p-6 relative overflow-hidden animate-fade-slide">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

          <h3 className="text-sm font-bold text-muted-foreground tracking-wider uppercase font-mono mb-4">
            {editingId ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
          </h3>

          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Email */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Email (Acceso)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Ej: juan@sanjuan.com"
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary/50 text-xs outline-none text-foreground font-mono disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                  disabled={editingId !== null}
                />
              </div>

              {/* Full name */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Nombre Completo</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ej: Dr. Juan Pérez"
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary/50 text-xs outline-none text-foreground"
                  required
                />
              </div>

              {/* Password (only if creating) */}
              {!editingId && (
                <div className="flex flex-col gap-1 col-span-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Contraseña Inicial</label>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="OpstarPassword2026!"
                    className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary/50 text-xs outline-none text-foreground font-mono"
                    required
                  />
                  <span className="text-[9px] text-slate-550 mt-1 font-mono">
                    💡 El usuario podrá cambiar esta contraseña al acceder por primera vez.
                  </span>
                </div>
              )}

              {/* Role */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Rol de Usuario</label>
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (e.target.value !== 'hospital_user') {
                      setHospitalId('');
                    }
                  }}
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary/50 text-xs outline-none text-foreground cursor-pointer"
                >
                  <option value="hospital_user">Médico (hospital_user)</option>
                  <option value="monitor">Monitor (monitor)</option>
                  <option value="admin">Administrador (admin)</option>
                  <option value="viewer">Visor Lectura (viewer)</option>
                </select>
              </div>

              {/* Hospital assignment */}
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">
                  Hospital Asignado {role !== 'hospital_user' && ' (No aplicable)'}
                </label>
                <select
                  value={hospitalId}
                  onChange={(e) => setHospitalId(e.target.value)}
                  disabled={role !== 'hospital_user'}
                  className="px-4 py-2.5 rounded-xl bg-background border border-border focus:border-primary/50 text-xs outline-none text-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                <span className="text-[10px] font-bold text-muted-foreground tracking-wider uppercase font-mono">Estado Cuenta Activa</span>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 cursor-pointer ${isActive ? 'bg-primary' : 'bg-slate-100 dark:bg-slate-800'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-card absolute top-0.5 transition-transform shadow ${isActive ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
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
                className="px-4 py-2 border border-border hover:bg-background rounded-xl text-xs font-bold text-muted-foreground dark:text-muted-foreground hover:text-foreground transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="px-5 py-2 bg-primary hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {isPending ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Crear Usuario'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters and Search */}
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
            placeholder="Buscar por nombre o email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-background border border-border focus:border-primary/40 text-xs outline-none text-muted-foreground placeholder-slate-600"
          />
        </div>
        <div className="flex items-center gap-4">
          {(searchQuery || sortField) && (
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground hover:text-foreground border border-border rounded-lg bg-card hover:bg-slate-800 transition-colors"
            >
              Limpiar Filtros
            </button>
          )}
          <div className="text-xs text-muted-foreground font-mono">
            {filteredUsers.length} usuario(s) encontrado(s)
          </div>
        </div>
      </div>

      {/* List / Table of Users */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-background/50 border-b border-border text-[10px] uppercase font-mono text-muted-foreground">
              <th className="px-4 py-3 font-bold tracking-wider cursor-pointer hover:text-foreground" onClick={() => handleSort('name')}>
                Usuario {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 font-bold tracking-wider cursor-pointer hover:text-foreground" onClick={() => handleSort('role')}>
                Rol {sortField === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 font-bold tracking-wider cursor-pointer hover:text-foreground" onClick={() => handleSort('hospital')}>
                Centro / Hospital {sortField === 'hospital' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 font-bold tracking-wider text-center">Estado</th>
              <th className="px-4 py-3 font-bold tracking-wider text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredUsers.map((u) => {
              const isSelf = currentUserId === u.id;
              const isConfirmingDelete = deleteConfirmId === u.id;

              return (
                <React.Fragment key={u.id}>
                  <tr className={`hover:bg-slate-200 dark:hover:bg-slate-800/30 transition-colors ${!u.is_active ? 'opacity-60' : ''}`}>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-bold text-sm text-foreground">
                            {u.full_name || 'Sin nombre'}
                            {isSelf && <span className="ml-2 text-[9px] font-mono text-primary bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/30">(Tú)</span>}
                          </div>
                          <div className="text-[10px] font-mono text-muted-foreground mt-0.5">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {getRoleBadge(u.role)}
                    </td>
                    <td className="px-4 py-3 align-middle text-xs text-muted-foreground">
                      {u.role === 'hospital_user' ? (
                        <span className="flex items-center gap-1.5">
                          <span className="text-[10px]">🏥</span> {u.hospitals?.name || 'No asignado'}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">No aplicable</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-center">
                      {u.is_active ? (
                        <span className="text-[9px] font-bold bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/20">ACTIVO</span>
                      ) : (
                        <span className="text-[9px] font-bold bg-card text-muted-foreground px-2 py-0.5 rounded border border-border dark:border-slate-700">INACTIVO</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(u)}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-700 text-muted-foreground text-[10px] font-bold rounded transition-colors"
                        >
                          Editar
                        </button>
                        {!isSelf && (
                          <button
                            onClick={() => {
                              setDeleteConfirmId(u.id);
                              setShowForm(false);
                              setEditingId(null);
                            }}
                            className="px-2.5 py-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-900/40 text-red-400 text-[10px] font-bold rounded transition-colors"
                          >
                            Eliminar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isConfirmingDelete && (
                    <tr>
                      <td colSpan={5} className="px-4 py-3 bg-red-950/10 border-b border-border/60">
                        <div className="flex items-center justify-between p-3 bg-red-950/30 border border-red-900/50 rounded-xl">
                          <p className="text-[10px] text-red-300">
                            ¿Eliminar a <strong>{u.full_name || u.email}</strong>? Esta acción es irreversible y eliminará su acceso.
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-3 py-1.5 border border-border dark:border-slate-700 rounded-lg text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => handleDeleteConfirm(u.id)}
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
            
            {filteredUsers.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground text-xs">
                  No se encontraron usuarios que coincidan con la búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
