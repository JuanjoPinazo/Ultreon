'use client';

import React, { useState } from 'react';
import { updateCaseStatusAction, markCaseCompleteAction } from '@/lib/supabase/actions';
import {
  getQualityStatusColor,
  getQualityStatusLabel,
  groupWarningsBySeverity,
  type DataQualityWarning,
} from '@/lib/clinical/case-quality';

interface DataQualityPanelProps {
  caseId: string;
  caseStatus: string;
  completenessScore: number;
  warnings: DataQualityWarning[];
  isLocked: boolean;
  canEdit: boolean;
  isAdmin: boolean;
}

export default function DataQualityPanel({
  caseId,
  caseStatus,
  completenessScore,
  warnings,
  isLocked,
  canEdit,
  isAdmin,
}: DataQualityPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandWarnings, setExpandWarnings] = useState(false);

  const statusColor = getQualityStatusColor(completenessScore);
  const statusLabel = getQualityStatusLabel(completenessScore);
  const groupedWarnings = groupWarningsBySeverity(warnings);

  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40',
    yellow: 'text-yellow-400 bg-yellow-950/40 border-yellow-800/40',
    red: 'text-red-400 bg-red-950/40 border-red-800/40',
    slate: 'text-slate-400 bg-slate-950/40 border-slate-800/40',
  };

  const handleMarkComplete = async () => {
    if (!canEdit) {
      alert('No tienes permisos para completar este caso');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await markCaseCompleteAction(caseId);
      if (result.success) {
        alert('Caso marcado como completo');
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleValidate = async () => {
    if (!isAdmin) {
      alert('Solo admin/monitor pueden validar');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateCaseStatusAction({
        caseId,
        newStatus: 'validated',
        completenessScore,
        warnings,
      });
      if (result.success) {
        alert('Caso validado');
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLock = async () => {
    if (!isAdmin) {
      alert('Solo admin/monitor pueden bloquear');
      return;
    }

    if (!confirm('¿Bloquear este caso? No se podrá editar.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateCaseStatusAction({
        caseId,
        newStatus: 'locked',
        completenessScore,
        warnings,
      });
      if (result.success) {
        alert('Caso bloqueado');
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (err: any) {
      alert(`Error: ${err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`border rounded-3xl p-6 space-y-6 ${colorMap[statusColor]}`}>
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-current/20">
        <div>
          <h3 className="text-xs font-bold tracking-wider uppercase font-mono opacity-70">
            Data Quality
          </h3>
          <div className="mt-2 flex items-baseline gap-3">
            <span className={`text-4xl font-black ${statusColor === 'emerald' ? 'text-emerald-400' : statusColor === 'yellow' ? 'text-yellow-400' : statusColor === 'red' ? 'text-red-400' : 'text-slate-400'}`}>
              {completenessScore}
            </span>
            <span className="text-lg font-bold opacity-70">/100</span>
            <span className="text-sm font-bold opacity-70 ml-2">{statusLabel}</span>
          </div>
        </div>

        {/* Status Badge */}
        <div className="text-right">
          <div className="text-[10px] font-mono font-bold uppercase opacity-70 mb-2">
            Estado
          </div>
          <div className={`text-sm font-bold px-3 py-1.5 rounded-lg border ${
            caseStatus === 'draft' ? 'bg-slate-950/60 border-slate-700 text-slate-300' :
            caseStatus === 'incomplete' ? 'bg-yellow-950/60 border-yellow-700 text-yellow-300' :
            caseStatus === 'complete' ? 'bg-blue-950/60 border-blue-700 text-blue-300' :
            caseStatus === 'pending_corelab' ? 'bg-purple-950/60 border-purple-700 text-purple-300' :
            caseStatus === 'validated' ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300' :
            'bg-red-950/60 border-red-700 text-red-300'
          }`}>
            {caseStatus.toUpperCase().replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setExpandWarnings(!expandWarnings)}
            className="w-full flex items-center justify-between p-3 bg-black/20 hover:bg-black/40 rounded-lg transition-all"
          >
            <span className="text-sm font-bold flex items-center gap-2">
              {groupedWarnings.errors.length > 0 && (
                <span className="text-red-400">✗ {groupedWarnings.errors.length}</span>
              )}
              {groupedWarnings.warnings.length > 0 && (
                <span className="text-yellow-400">⚠ {groupedWarnings.warnings.length}</span>
              )}
              {groupedWarnings.info.length > 0 && (
                <span className="text-blue-400">ℹ {groupedWarnings.info.length}</span>
              )}
            </span>
            <span className="text-lg opacity-50">{expandWarnings ? '▼' : '▶'}</span>
          </button>

          {expandWarnings && (
            <div className="space-y-2 pl-1">
              {/* Errors */}
              {groupedWarnings.errors.map((w, idx) => (
                <div key={idx} className="text-sm border-l-2 border-red-500 pl-3 text-red-300">
                  <span className="font-bold">✗</span> {w.message}
                  {w.field && <span className="text-[10px] opacity-60 block mt-0.5">({w.field})</span>}
                </div>
              ))}

              {/* Warnings */}
              {groupedWarnings.warnings.map((w, idx) => (
                <div key={idx} className="text-sm border-l-2 border-yellow-500 pl-3 text-yellow-300">
                  <span className="font-bold">⚠</span> {w.message}
                  {w.field && <span className="text-[10px] opacity-60 block mt-0.5">({w.field})</span>}
                </div>
              ))}

              {/* Info */}
              {groupedWarnings.info.map((w, idx) => (
                <div key={idx} className="text-sm border-l-2 border-blue-500 pl-3 text-blue-300">
                  <span className="font-bold">ℹ</span> {w.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {canEdit && !isLocked && (
        <div className="flex flex-wrap gap-2 pt-2">
          {caseStatus === 'draft' && (
            <button
              onClick={handleMarkComplete}
              disabled={isSubmitting || groupedWarnings.errors.length > 0}
              className="flex-1 bg-blue-950 hover:bg-blue-900 disabled:opacity-50 disabled:cursor-not-allowed text-blue-400 border border-blue-700 px-4 py-2 rounded-lg text-sm font-bold transition-all"
            >
              {isSubmitting ? 'Procesando...' : 'Mark as Complete'}
            </button>
          )}

          {(caseStatus === 'complete' || caseStatus === 'incomplete') && isAdmin && (
            <button
              onClick={handleValidate}
              disabled={isSubmitting || groupedWarnings.errors.length > 0}
              className="flex-1 bg-emerald-950 hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed text-emerald-400 border border-emerald-700 px-4 py-2 rounded-lg text-sm font-bold transition-all"
            >
              {isSubmitting ? 'Validando...' : 'Validate'}
            </button>
          )}

          {(caseStatus === 'validated' || caseStatus === 'complete') && isAdmin && (
            <button
              onClick={handleLock}
              disabled={isSubmitting}
              className="flex-1 bg-red-950 hover:bg-red-900 disabled:opacity-50 disabled:cursor-not-allowed text-red-400 border border-red-700 px-4 py-2 rounded-lg text-sm font-bold transition-all"
            >
              {isSubmitting ? 'Bloqueando...' : '🔒 Lock'}
            </button>
          )}
        </div>
      )}

      {isLocked && (
        <div className="bg-black/30 border border-current/40 rounded-lg p-3 text-center">
          <span className="text-sm font-bold">🔒 Caso bloqueado - No se puede editar</span>
        </div>
      )}

      {!canEdit && (
        <div className="bg-black/30 border border-slate-700 rounded-lg p-3 text-center">
          <span className="text-sm font-bold text-slate-400">
            No tienes permisos para editar este caso
          </span>
        </div>
      )}
    </div>
  );
}
