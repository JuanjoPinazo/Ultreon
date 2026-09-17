'use client';

import React, { useState } from 'react';
import { getCenterProgress, getOperatorProgress } from '@/lib/metrics/progress';
import type { CenterTarget, OperatorTarget, RegistryCase } from '@/lib/metrics/progress';

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
              <th className="px-6 py-4">Objetivo</th>
              <th className="px-6 py-4">Realizados</th>
              <th className="px-6 py-4">Cumplimiento</th>
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
                  <td className="px-6 py-4 font-bold text-foreground">
                    {target ? target.target_total : <span className="text-muted-foreground">N/A</span>}
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {progress ? progress.completed : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {progress ? (
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-surface-secondary rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-indigo-500 h-full" 
                            style={{ width: `${Math.min(100, progress.completionRate)}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground">{progress.completionRate}%</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {target ? (
                      <span className="px-2 py-1 bg-emerald-950/20 text-emerald-500 border border-emerald-900/30 rounded-md text-[10px] font-black tracking-widest uppercase">
                        En curso
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-surface-secondary text-muted-foreground border border-border rounded-md text-[10px] font-black tracking-widest uppercase">
                        Sin objetivo
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => setSelectedHospital(hospital)}
                      className="text-indigo-600 font-bold hover:text-indigo-800 text-xs uppercase tracking-widest"
                    >
                      Ver detalle
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
              
              {/* Center Target Info */}
              {(() => {
                const target = centerTargets.find(t => t.hospital_id === selectedHospital.id);
                if (!target) return (
                  <div className="text-center p-8 bg-surface-secondary rounded-xl border border-border border-dashed">
                    <p className="text-muted-foreground font-medium">Centro sin objetivo activo asignado.</p>
                  </div>
                );

                const progress = getCenterProgress(target, cases);

                return (
                  <div className="space-y-6">
                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-4 bg-surface-secondary rounded-xl border border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Objetivo Total</p>
                        <p className="text-2xl font-black text-foreground">{target.target_total}</p>
                      </div>
                      <div className="p-4 bg-surface-secondary rounded-xl border border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Realizados</p>
                        <p className="text-2xl font-black text-foreground">{progress.completed}</p>
                      </div>
                      <div className="p-4 bg-surface-secondary rounded-xl border border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Restantes</p>
                        <p className="text-2xl font-black text-foreground">{progress.remaining}</p>
                      </div>
                      <div className="p-4 bg-indigo-950/20 rounded-xl border border-indigo-900/30">
                        <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1">Cumplimiento</p>
                        <p className="text-2xl font-black text-indigo-500">{progress.completionRate}%</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 border-l-2 border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Ritmo Esperado</p>
                        <p className="text-lg font-bold text-foreground">{target.target_monthly || '-'} / mes</p>
                      </div>
                      <div className="p-4 border-l-2 border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Ritmo Real</p>
                        <p className="text-lg font-bold text-foreground">{progress.actualRate} / mes</p>
                      </div>
                      <div className="p-4 border-l-2 border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Desviación</p>
                        <p className={`text-lg font-bold ${progress.variance >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {progress.variance > 0 ? '+' : ''}{progress.variance} casos
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Operators Targets */}
              <div>
                <h4 className="text-sm font-black text-foreground uppercase tracking-widest mb-4">Objetivos de Operadores</h4>
                <div className="space-y-2">
                  {operators.filter(o => o.hospital_id === selectedHospital.id).map(op => {
                    const opTarget = operatorTargets.find(t => t.operator_id === op.id);
                    if (!opTarget) return null;
                    const opProgress = getOperatorProgress(opTarget, cases);

                    return (
                      <div key={op.id} className="flex justify-between items-center p-3 bg-card border border-border rounded-lg">
                        <span className="font-bold text-foreground">{op.name}</span>
                        <div className="flex gap-6 items-center text-sm">
                          <span className="text-muted-foreground">Obj: <b className="text-foreground">{opTarget.target_total}</b></span>
                          <span className="text-muted-foreground">Real: <b className="text-foreground">{opProgress.completed}</b></span>
                          <span className="text-indigo-500 font-bold">{opProgress.completionRate}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {operators.filter(o => o.hospital_id === selectedHospital.id && !operatorTargets.find(t => t.operator_id === o.id)).length > 0 && (
                    <p className="text-xs text-muted-foreground italic">Hay operadores sin sub-objetivos asignados en este centro.</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-border bg-surface-secondary text-right">
              <button 
                onClick={() => setSelectedHospital(null)}
                className="px-4 py-2 bg-foreground text-background rounded-lg text-sm font-bold shadow-sm"
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
