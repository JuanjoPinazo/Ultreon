'use client';

import React, { useState } from 'react';
import { getCenterProgress, getOperatorProgress } from '@/lib/metrics/progress';
import type { CenterTarget, OperatorTarget, RegistryCase } from '@/lib/metrics/progress';
import { saveCenterTarget } from './actions';
import { useRouter } from 'next/navigation';
import { useGlobalToast } from '@/components/providers/GlobalToastProvider';
import { useGlobalDialog } from '@/components/providers/GlobalDialogProvider';

export default function TargetsClient({
  hospitals,
  centerTargets,
  operatorTargets,
  operators,
  cases
}: {
  hospitals: { id: string; name: string }[];
  centerTargets: CenterTarget[];
  operatorTargets: OperatorTarget[];
  operators: { hospital_id: string; id: string; name: string }[];
  cases: RegistryCase[];
}) {
  const [selectedHospital, setSelectedHospital] = useState<{ id: string; name: string } | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<Partial<CenterTarget>>({});
  const [reason, setReason] = useState('');
  const [showOverrideDialog, setShowOverrideDialog] = useState<{status: 'DRAFT' | 'ACTIVE' | 'CLOSED', existingTarget: CenterTarget} | null>(null);
  const [errorDialog, setErrorDialog] = useState<{message: string, code?: string} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();
  const { showSuccess, showError } = useGlobalToast();
  const { showDialog } = useGlobalDialog();

  const handleOpenDetail = (hospital: { id: string; name: string }, target?: CenterTarget) => {
    setSelectedHospital(hospital);
    setEditMode(false);
    setReason('');
    if (target) {
      setFormData(target);
    } else {
      setFormData({
        hospital_id: hospital.id,
        target_total: 0,
        target_monthly: 0,
        start_date: new Date().toISOString().split('T')[0],
        status: 'DRAFT'
      });
    }
  };

  const handleSave = async (status: 'DRAFT' | 'ACTIVE' | 'CLOSED', override = false) => {
    // Basic validation
    if (status === 'ACTIVE' && !formData.start_date) {
      showError("La fecha de inicio es obligatoria para activar el objetivo.");
      return;
    }
    
    if (status === 'ACTIVE' && formData.id) {
      const existing = centerTargets.find(t => t.id === formData.id);
      if (existing && existing.status === 'ACTIVE' && !reason) {
        showError("Debe proporcionar un motivo para modificar un objetivo ACTIVO.");
        return;
      }
    }

    if (status === 'ACTIVE' && !override) {
      const existingActive = centerTargets.find(t => t.hospital_id === formData.hospital_id && t.status === 'ACTIVE' && t.id !== formData.id);
      if (existingActive) {
        setShowOverrideDialog({status, existingTarget: existingActive});
        return;
      }
    }

    if (override && !reason) {
      showError("Debe proporcionar un motivo para sustituir el objetivo activo.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await saveCenterTarget({...formData, status}, reason);
      if (!response.success) {
        setErrorDialog({
          message: response.error || 'Error desconocido al guardar el objetivo.',
          code: response.code
        });
        setIsSaving(false);
        return;
      }

      showSuccess(`Éxito: Objetivo guardado correctamente.`);
      setShowOverrideDialog(null);
      setSelectedHospital(null);
      router.refresh();
    } catch (e: any) {
      setErrorDialog({
        message: e.message || 'Error de red o servidor.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleMockManises = () => {
    setFormData({
      ...formData,
      target_total: 60,
      target_monthly: 15,
      start_date: '2026-09-01',
      end_date: '2026-12-31'
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-foreground tracking-tight">Gestión de Objetivos</h2>
          <p className="text-sm text-muted-foreground">Administración de objetivos por Centro y Operador</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-secondary border-b border-border text-xs uppercase tracking-wider text-muted-foreground font-bold">
            <tr>
              <th className="px-6 py-4">Centro</th>
              <th className="px-6 py-4">Inicio</th>
              <th className="px-6 py-4">Fin</th>
              <th className="px-6 py-4">Objetivo Total</th>
              <th className="px-6 py-4">Objetivo Mensual</th>
              <th className="px-6 py-4">Realizados</th>
              <th className="px-6 py-4">Cumplimiento %</th>
              <th className="px-6 py-4">Ritmo Semanal</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {hospitals.map(hospital => {
              const target = centerTargets.find(t => t.hospital_id === hospital.id);
              const progress = target ? getCenterProgress(target, cases) : null;

              return (
                <tr key={hospital.id} className="hover:bg-surface-secondary/50">
                  <td className="px-6 py-4 font-bold text-foreground">{hospital.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {target ? new Date(target.start_date).toLocaleDateString('es-ES') : '-'}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {target?.end_date ? new Date(target.end_date).toLocaleDateString('es-ES') : '-'}
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground">
                    {target ? target.target_total : <span className="text-muted-foreground">N/A</span>}
                  </td>
                  <td className="px-6 py-4 font-bold text-foreground">
                    {target ? (target.target_monthly || '-') : <span className="text-muted-foreground">N/A</span>}
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {progress ? progress.completed : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {progress ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{progress.completionRate}%</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-foreground text-xs font-mono">
                    {progress?.expectedWeeklyRate ? `${progress.expectedWeeklyRate}/sem` : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {target ? (
                      <span className={`px-2 py-1 border rounded-md text-[10px] font-black tracking-widest uppercase ${
                        target.status === 'ACTIVE' ? 'bg-emerald-950/20 text-emerald-500 border-emerald-900/30' :
                        target.status === 'DRAFT' ? 'bg-amber-950/20 text-amber-500 border-amber-900/30' :
                        'bg-surface-secondary text-muted-foreground border-border'
                      }`}>
                        {target.status}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-surface-secondary text-muted-foreground border border-border rounded-md text-[10px] font-black tracking-widest uppercase">
                        Sin objetivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleOpenDetail(hospital, target)}
                      className="text-indigo-600 font-bold hover:text-indigo-800 text-xs uppercase tracking-widest"
                    >
                      Ver detalle / Editar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-border">
            <div className="p-6 border-b border-border flex justify-between items-center bg-surface-secondary">
              <div>
                <h3 className="text-xl font-black text-foreground">Detalle: {selectedHospital.name}</h3>
                <p className="text-sm text-muted-foreground">Visualización de objetivos y métricas (Solo visualización en esta demo)</p>
              </div>
              <button 
                onClick={() => setSelectedHospital(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-8 flex-1">
              
              {/* Edit Mode Toggle */}
              <div className="flex justify-between items-center bg-surface border border-border p-4 rounded-xl">
                <div>
                  <h4 className="text-sm font-bold text-foreground">Configuración del Objetivo</h4>
                  <p className="text-xs text-muted-foreground">Establece los parámetros formales para este centro.</p>
                </div>
                <button
                  onClick={() => setEditMode(!editMode)}
                  className="px-4 py-2 border border-border rounded-lg text-xs font-bold text-foreground hover:bg-surface-secondary"
                >
                  {editMode ? 'Cancelar Edición' : 'Editar Valores'}
                </button>
              </div>

              {/* Form or Display */}
              {editMode ? (
                <div className="space-y-6">
                  {selectedHospital.name.includes('Manises') && (
                    <button onClick={handleMockManises} className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded text-xs font-bold border border-indigo-200">
                      Rellenar ejemplo
                    </button>
                  )}
                  {formData.target_total && formData.target_monthly && formData.start_date && formData.end_date ? (() => {
                    const months = (new Date(formData.end_date).getTime() - new Date(formData.start_date).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
                    const expectedTotal = formData.target_monthly * months;
                    if (Math.abs(expectedTotal - formData.target_total) > (formData.target_monthly * 0.5)) {
                      return (
                        <div className="p-3 bg-amber-50 text-amber-700 border border-amber-200 rounded text-xs">
                          <strong>Aviso:</strong> El objetivo mensual y la duración sugerida no se alinean exactamente con el objetivo total. Esto es permitido, pero revíselo.
                        </div>
                      );
                    }
                    return null;
                  })() : null}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Objetivo Total</label>
                      <input 
                        type="number" 
                        value={formData.target_total || ''} 
                        onChange={e => setFormData({...formData, target_total: parseInt(e.target.value) || 0})}
                        className="w-full p-2 border border-border rounded bg-background text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Objetivo Mensual</label>
                      <input 
                        type="number" 
                        value={formData.target_monthly || ''} 
                        onChange={e => setFormData({...formData, target_monthly: parseInt(e.target.value) || 0})}
                        className="w-full p-2 border border-border rounded bg-background text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Fecha de Inicio</label>
                      <input 
                        type="date" 
                        value={formData.start_date || ''} 
                        onChange={e => setFormData({...formData, start_date: e.target.value})}
                        className="w-full p-2 border border-border rounded bg-background text-foreground"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Fecha Fin (Opcional)</label>
                      <input 
                        type="date" 
                        value={formData.end_date || ''} 
                        onChange={e => setFormData({...formData, end_date: e.target.value})}
                        className="w-full p-2 border border-border rounded bg-background text-foreground"
                      />
                    </div>
                    <div className="col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Observaciones</label>
                      <textarea 
                        value={formData.notes || ''} 
                        onChange={e => setFormData({...formData, notes: e.target.value})}
                        className="w-full p-2 border border-border rounded bg-background text-foreground resize-none h-20"
                      />
                    </div>
                    {formData.status === 'ACTIVE' && (
                      <div className="col-span-2 space-y-1.5 bg-red-950/20 p-4 rounded border border-red-900/30">
                        <label className="text-xs font-bold text-red-500 uppercase tracking-widest">Motivo de Modificación (Obligatorio)</label>
                        <input 
                          type="text" 
                          value={reason} 
                          onChange={e => setReason(e.target.value)}
                          placeholder="Requerido por registry_target_history para modificar objetivos activos"
                          className="w-full p-2 border border-red-900/50 rounded bg-background text-foreground"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-4 bg-surface-secondary rounded-xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Objetivo Total</p>
                    <p className="text-2xl font-black text-foreground">{formData.target_total}</p>
                  </div>
                  <div className="p-4 bg-surface-secondary rounded-xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Ritmo Esperado</p>
                    <p className="text-2xl font-black text-foreground">{formData.target_monthly} / mes</p>
                  </div>
                  <div className="p-4 bg-surface-secondary rounded-xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Inicio</p>
                    <p className="text-lg font-bold text-foreground">{formData.start_date}</p>
                  </div>
                  <div className="p-4 bg-surface-secondary rounded-xl border border-border">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Estado Actual</p>
                    <p className="text-lg font-bold text-foreground">{formData.status}</p>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-border bg-surface-secondary flex justify-between items-center">
              <div>
                {editMode && (
                  <span className="text-xs text-muted-foreground">Asegúrese de validar los parámetros antes de activar.</span>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedHospital(null)}
                  className="px-4 py-2 bg-background border border-border text-foreground rounded-lg text-sm font-bold shadow-sm"
                >
                  Cerrar
                </button>
                {editMode && (
                  <>
                    <button 
                      onClick={() => handleSave('DRAFT')}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-bold shadow-sm"
                    >
                      Guardar Borrador
                    </button>
                    {formData.status !== 'CLOSED' && (
                      <button 
                        onClick={() => handleSave('CLOSED')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-bold shadow-sm"
                      >
                        Cerrar Objetivo
                      </button>
                    )}
                    <button 
                      onClick={() => handleSave('ACTIVE')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm"
                    >
                      Activar Objetivo
                    </button>
                  </>
                )}
              </div>
            </div>
            
            {showOverrideDialog && (
              <div className="absolute inset-0 bg-background/90 z-20 flex items-center justify-center p-6 backdrop-blur-sm">
                <div className="bg-card border border-border p-6 rounded-2xl shadow-2xl max-w-md w-full text-left">
                  <h3 className="text-lg font-black text-foreground mb-2">Ya existe un objetivo activo</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Ya existe un objetivo activo para este centro. No se permite tener múltiples objetivos activos de forma simultánea.
                  </p>
                  <div className="space-y-4">
                    <div className="bg-surface-secondary p-3 rounded-lg border border-border text-xs">
                      <strong>Objetivo Anterior:</strong><br/>
                      Total: {showOverrideDialog.existingTarget.target_total} | Inicio: {showOverrideDialog.existingTarget.start_date}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-red-500 uppercase tracking-widest">Motivo para sustituir (Obligatorio)</label>
                      <input 
                        type="text" 
                        value={reason} 
                        onChange={e => setReason(e.target.value)}
                        placeholder="Ej: Cambio de cuota anual acordada"
                        className="w-full p-2 border border-red-900/50 rounded bg-background text-foreground"
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button 
                        onClick={() => setShowOverrideDialog(null)}
                        className="px-4 py-2 border border-border text-foreground hover:bg-surface-secondary rounded-lg text-xs font-bold"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => handleSave(showOverrideDialog.status, true)}
                        disabled={!reason}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
                      >
                        Cerrar anterior y Activar este
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {errorDialog && (
              <div className="absolute inset-0 bg-background/90 z-30 flex items-center justify-center p-6 backdrop-blur-sm">
                <div className="bg-card border border-red-900/50 p-6 rounded-2xl shadow-2xl max-w-md w-full text-left">
                  <h3 className="text-lg font-black text-red-500 mb-2">Error de Activación / Guardado</h3>
                  <div className="bg-red-950/20 p-4 rounded-lg border border-red-900/30 text-sm font-mono text-red-400 break-words">
                    <strong>Root Cause:</strong><br/>
                    {errorDialog.code && <span>Código: {errorDialog.code}<br/></span>}
                    {errorDialog.message}
                  </div>
                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={() => setErrorDialog(null)}
                      className="px-4 py-2 bg-background border border-border text-foreground hover:bg-surface-secondary rounded-lg text-sm font-bold shadow-sm"
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
