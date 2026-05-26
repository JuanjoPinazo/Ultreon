'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { saveFollowUpAction, toggleFollowUpValidationAction } from '@/lib/supabase/actions';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
export interface FollowUpRecord {
  id?: string;
  case_id: string;
  followup_type: 'procedural' | '30days' | '6months' | '12months';
  followup_date: string;
  mace: boolean;
  death_type: 'cardiovascular' | 'non-cardiovascular' | 'unknown' | null;
  myocardial_infarction: boolean;
  tlr: boolean;
  tvr: boolean;
  stent_thrombosis_type: 'acute' | 'subacute' | 'late' | 'very_late' | null;
  rehospitalization: boolean;
  repeat_pci: boolean;
  cabg: boolean;
  followup_angio: boolean;
  followup_oct: boolean;
  clinical_status: 'asymptomatic' | 'stable_angina' | 'unstable_angina' | 'heart_failure' | 'other';
  investigator_notes: string | null;
  completed: boolean;
  monitor_validated: boolean;
  created_at?: string;
  updated_at?: string;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface AuditRecord {
  id: string;
  followup_id: string;
  case_id: string;
  action: 'insert' | 'update' | 'delete';
  changed_by: string | null;
  changed_by_email: string | null;
  old_values: any | null;
  new_values: any | null;
  created_at: string;
}

interface CaseFollowUpClientProps {
  caseRecord: {
    id: string;
    id_paciente: string;
    centro: string;
    vaso_diana: string;
    tecnica_purga_oct: string;
    ffr_oct: number | null;
    calcio_ia: boolean;
    hospital_id: string | null;
    hospitalName: string;
    locked: boolean;
    opstar_optimization_results?: Array<{
      opstar_score: number | null;
      opstar_score_category: string | null;
    }> | null;
  };
  initialFollowups: FollowUpRecord[];
  auditTrail: AuditRecord[];
  profile: {
    userId: string;
    fullName: string;
    role: string;
    hospitalId: string;
  };
}

export default function CaseFollowUpClient({
  caseRecord,
  initialFollowups,
  auditTrail,
  profile,
}: CaseFollowUpClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Active timepoint tab
  const [activeType, setActiveType] = useState<'procedural' | '30days' | '6months' | '12months'>('30days');

  // Find record for active timepoint, or create template
  const currentRecord = initialFollowups.find((f) => f.followup_type === activeType);

  // Form State
  const [formData, setFormData] = useState<FollowUpRecord>(() => {
    return (
      currentRecord || {
        case_id: caseRecord.id,
        followup_type: activeType,
        followup_date: new Date().toISOString().split('T')[0],
        mace: false,
        death_type: null,
        myocardial_infarction: false,
        tlr: false,
        tvr: false,
        stent_thrombosis_type: null,
        rehospitalization: false,
        repeat_pci: false,
        cabg: false,
        followup_angio: false,
        followup_oct: false,
        clinical_status: 'asymptomatic',
        investigator_notes: '',
        completed: false,
        monitor_validated: false,
      }
    );
  });

  // Track if changes are made to prompt saving
  const [isDirty, setIsDirty] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state when active tab changes
  React.useEffect(() => {
    const record = initialFollowups.find((f) => f.followup_type === activeType);
    setFormData(
      record || {
        case_id: caseRecord.id,
        followup_type: activeType,
        followup_date: new Date().toISOString().split('T')[0],
        mace: false,
        death_type: null,
        myocardial_infarction: false,
        tlr: false,
        tvr: false,
        stent_thrombosis_type: null,
        rehospitalization: false,
        repeat_pci: false,
        cabg: false,
        followup_angio: false,
        followup_oct: false,
        clinical_status: 'asymptomatic',
        investigator_notes: '',
        completed: false,
        monitor_validated: false,
      }
    );
    setIsDirty(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [activeType, initialFollowups, caseRecord.id]);

  // Is editing disabled?
  // Researchers (hospital_user) cannot edit if the case is locked, or if this specific followup is monitor validated
  const isEditingDisabled =
    caseRecord.locked ||
    (profile.role === 'hospital_user' && (formData.monitor_validated || currentRecord?.monitor_validated));

  // Change handlers
  const handleCheckboxChange = (field: keyof FollowUpRecord) => {
    if (isEditingDisabled) return;
    setFormData((prev) => {
      const nextVal = !prev[field];
      const updated = { ...prev, [field]: nextVal };

      // Recalculate MACE
      // MACE is true if death_type is set, myocardial_infarction, tlr, tvr, or stent_thrombosis_type is set
      const hasMaceEvents =
        updated.death_type !== null ||
        updated.myocardial_infarction ||
        updated.tlr ||
        updated.tvr ||
        updated.stent_thrombosis_type !== null;

      updated.mace = hasMaceEvents;

      return updated;
    });
    setIsDirty(true);
  };

  const handleInputChange = (field: keyof FollowUpRecord, value: any) => {
    if (isEditingDisabled) return;
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      // If death type is cleared or set, recalculate MACE
      if (field === 'death_type' || field === 'stent_thrombosis_type') {
        const hasMaceEvents =
          updated.death_type !== null ||
          updated.myocardial_infarction ||
          updated.tlr ||
          updated.tvr ||
          updated.stent_thrombosis_type !== null;
        updated.mace = hasMaceEvents;
      }

      return updated;
    });
    setIsDirty(true);
  };

  // Submit Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditingDisabled) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await saveFollowUpAction(formData);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('Seguimiento guardado correctamente en la base de datos científica.');
        setIsDirty(false);
        router.refresh();
      }
    });
  };

  // Validation Handler (Monitors/Admins only)
  const handleToggleValidation = async () => {
    if (profile.role !== 'admin' && profile.role !== 'monitor') return;
    if (!formData.id) {
      setErrorMsg('Primero debe guardar el seguimiento antes de poder validarlo.');
      return;
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const newStatus = !formData.monitor_validated;
      const res = await toggleFollowUpValidationAction(formData.id!, newStatus, caseRecord.id);
      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(
          newStatus
            ? 'Seguimiento firmado y validado científicamente por monitoría.'
            : 'Firma de validación retirada correctamente.'
        );
        router.refresh();
      }
    });
  };

  // Helper to check completion & MACE for timeline styling
  const getTimepointStatus = (type: 'procedural' | '30days' | '6months' | '12months') => {
    const f = initialFollowups.find((x) => x.followup_type === type);
    if (!f) return 'not_started';
    if (!f.completed) return 'pending';
    if (f.mace) return 'mace';
    return 'clean';
  };

  // Helper to color timeline nodes
  const getTimelineNodeStyles = (type: 'procedural' | '30days' | '6months' | '12months') => {
    const status = getTimepointStatus(type);
    const isActive = activeType === type;

    let base = 'transition-all duration-300 relative flex flex-col items-center justify-center p-4 rounded-2xl border text-center cursor-pointer ';
    if (isActive) {
      base += 'ring-2 ring-cyan-500/80 shadow-[0_0_20px_rgba(34,211,238,0.15)] ';
    }

    switch (status) {
      case 'mace':
        return base + 'bg-red-950/40 border-red-900/60 hover:bg-red-950/60 text-red-300';
      case 'clean':
        return base + 'bg-emerald-950/30 border-emerald-900/50 hover:bg-emerald-950/50 text-emerald-300';
      case 'pending':
        return base + 'bg-yellow-950/20 border-yellow-900/40 hover:bg-yellow-950/40 text-yellow-300';
      default:
        return base + 'bg-slate-900/60 border-slate-800 hover:bg-slate-850 text-slate-400';
    }
  };

  const getScoreColorClass = (score: number) => {
    if (score >= 85) return 'text-cyan-400 border-cyan-800/40 bg-cyan-950/60';
    if (score >= 65) return 'text-yellow-400 border-yellow-800/40 bg-yellow-950/60';
    if (score >= 40) return 'text-orange-400 border-orange-850/40 bg-orange-950/60';
    return 'text-red-400 border-red-900/40 bg-red-950/60';
  };

  // Helper to audit trail changes formatting
  const formatAuditChanges = (audit: AuditRecord) => {
    if (audit.action === 'insert') {
      return <span className="text-emerald-400">Seguimiento inicial registrado.</span>;
    }
    if (audit.action === 'delete') {
      return <span className="text-red-400">Registro eliminado.</span>;
    }

    const oldV = audit.old_values || {};
    const newV = audit.new_values || {};

    const changes: string[] = [];

    // Fields list to inspect
    const fieldsToInspect: { key: keyof FollowUpRecord; label: string }[] = [
      { key: 'completed', label: 'Estado Completado' },
      { key: 'monitor_validated', label: 'Validado por Monitor' },
      { key: 'clinical_status', label: 'Estado Clínico' },
      { key: 'followup_date', label: 'Fecha Seguimiento' },
      { key: 'mace', label: 'MACE' },
      { key: 'death_type', label: 'Tipo Muerte' },
      { key: 'myocardial_infarction', label: 'Infarto' },
      { key: 'tlr', label: 'TLR' },
      { key: 'tvr', label: 'TVR' },
      { key: 'stent_thrombosis_type', label: 'Trombosis Stent' },
      { key: 'rehospitalization', label: 'Rehospitalización' },
      { key: 'repeat_pci', label: 'PCI Repetida' },
      { key: 'cabg', label: 'CABG' },
      { key: 'followup_angio', label: 'Angiografía' },
      { key: 'followup_oct', label: 'OCT' },
    ];

    fieldsToInspect.forEach((f) => {
      const ov = oldV[f.key];
      const nv = newV[f.key];
      if (ov !== nv) {
        const formatVal = (val: any) => {
          if (val === null || val === undefined) return 'Ninguno';
          if (val === true) return 'Sí';
          if (val === false) return 'No';
          return String(val);
        };
        changes.push(`${f.label}: ${formatVal(ov)} → ${formatVal(nv)}`);
      }
    });

    if (changes.length === 0) {
      return <span className="text-slate-500">Actualización de notas o metadatos internos.</span>;
    }

    return (
      <ul className="list-disc list-inside space-y-0.5 text-slate-300">
        {changes.map((c, i) => (
          <li key={i}>{c}</li>
        ))}
      </ul>
    );
  };

  const getLabelForType = (type: string) => {
    switch (type) {
      case 'procedural': return 'Procedimiento (Alta)';
      case '30days': return '30 Días';
      case '6months': return '6 Meses';
      case '12months': return '12 Meses';
      default: return type;
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased font-sans">
      
      {/* Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/follow-up" className="h-8 w-8 rounded-lg bg-slate-950 hover:bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-300 font-bold transition-all">
            ←
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">ULTREON™ 3.0</span>
              <span className="text-[8px] font-mono font-bold text-slate-500 uppercase">EXPEDIENTE INDIVIDUAL</span>
            </div>
            <h1 className="text-base font-bold text-slate-50">Seguimiento Clínico de Caso</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              {profile.role === 'admin' ? 'Administrador' : profile.role === 'monitor' ? 'Monitor' : 'Investigador'}
            </span>
          </div>
          <div className="h-8 w-[1px] bg-slate-800" />
          <Link
            href="/follow-up"
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-medium transition-all"
          >
            Volver al Listado
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto space-y-6">

        {/* ── CASE CLINICAL INFO HEADER CARD ── */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">ID Paciente</span>
              <p className="text-base font-bold font-mono text-cyan-400">{caseRecord.id_paciente}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Centro Participante</span>
              <p className="text-sm font-semibold text-slate-200 truncate">{caseRecord.hospitalName}</p>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Vaso Diana (AHA)</span>
              <p className="text-sm">
                <span className="px-2 py-0.5 bg-cyan-950 text-cyan-450 border border-cyan-800/35 rounded font-mono font-bold text-xs">
                  {caseRecord.vaso_diana}
                </span>
              </p>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Optimización OPSTAR</span>
              <div>
                {caseRecord.opstar_optimization_results?.[0]?.opstar_score !== undefined &&
                caseRecord.opstar_optimization_results?.[0]?.opstar_score !== null ? (
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-bold border font-mono text-xs ${getScoreColorClass(caseRecord.opstar_optimization_results[0].opstar_score)}`}>
                      {caseRecord.opstar_optimization_results[0].opstar_score}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      ({caseRecord.opstar_optimization_results[0].opstar_score_category})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-slate-500 font-mono">No evaluado</span>
                )}
              </div>
            </div>

            <div className="space-y-1 col-span-2 md:col-span-1">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider block">Estado de Ficha Base</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                {caseRecord.locked ? (
                  <span className="px-2 py-0.5 bg-red-950 text-red-400 border border-red-900/40 rounded font-mono font-bold text-[10px]">
                    🔒 BLOQUEADO
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-emerald-950/40 text-emerald-450 border border-emerald-900/30 rounded font-mono font-bold text-[10px]">
                    🔓 ABIERTO
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── LONGITUDINAL VISUAL TIMELINE ── */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {(['procedural', '30days', '6months', '12months'] as const).map((type) => {
            const status = getTimepointStatus(type);
            return (
              <div
                key={type}
                onClick={() => {
                  if (isDirty) {
                    if (!confirm('Tiene cambios sin guardar en este seguimiento. ¿Desea cambiar de periodo igualmente? Se perderán los cambios.')) {
                      return;
                    }
                  }
                  setActiveType(type);
                }}
                className={getTimelineNodeStyles(type)}
              >
                <span className="text-[10px] font-bold font-mono text-slate-500 uppercase block tracking-wider">
                  {getLabelForType(type)}
                </span>
                
                <div className="mt-2 flex items-center justify-center gap-2">
                  {status === 'mace' && (
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1">
                      ⚠️ MACE / Evento
                    </span>
                  )}
                  {status === 'clean' && (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      ✓ Completado
                    </span>
                  )}
                  {status === 'pending' && (
                    <span className="text-xs font-bold text-yellow-500 flex items-center gap-1">
                      ✏ Pendiente
                    </span>
                  )}
                  {status === 'not_started' && (
                    <span className="text-xs text-slate-500">
                      Sin iniciar
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Status Warnings */}
        {isEditingDisabled && (
          <div className="bg-red-950/30 border border-red-900/40 text-red-200 p-4 rounded-2xl text-xs leading-relaxed flex items-start gap-3">
            <span className="text-lg">🔒</span>
            <div>
              <p className="font-bold">Modo de Solo Lectura Activo</p>
              <p className="mt-0.5 text-red-300/80">
                {caseRecord.locked
                  ? 'La ficha clínica base de este paciente se encuentra bloqueada administrativamente.'
                  : 'Este periodo de seguimiento ya ha sido validado científicamente por el monitor y no se permiten modificaciones adicionales por investigadores del centro.'}
              </p>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="bg-red-950/30 border border-red-900/50 text-red-400 px-4 py-3 rounded-2xl text-xs font-mono">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/30 border border-emerald-900/50 text-emerald-400 px-4 py-3 rounded-2xl text-xs font-mono">
            {successMsg}
          </div>
        )}

        {/* ── FOLLOW-UP OUTCOMES CAPTURE FORM ── */}
        <form onSubmit={handleSave} className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-50">
              Formulario Científico — {getLabelForType(activeType)}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Complete los endpoints primarios y secundarios de acuerdo con los protocolos de la iniciativa de optimización.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* LEFT COLUMN: Clinical status & dates */}
            <div className="space-y-6">
              
              {/* Date of follow-up */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Fecha del Seguimiento Clínico *
                </label>
                <input
                  type="date"
                  required
                  disabled={isEditingDisabled}
                  value={formData.followup_date}
                  onChange={(e) => handleInputChange('followup_date', e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500/50 text-xs font-mono outline-none w-full disabled:opacity-50"
                />
              </div>

              {/* Clinical Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Estado Clínico del Paciente
                </label>
                <select
                  disabled={isEditingDisabled}
                  value={formData.clinical_status}
                  onChange={(e) => handleInputChange('clinical_status', e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500/50 text-xs outline-none w-full cursor-pointer disabled:opacity-50"
                >
                  <option value="asymptomatic">Asintomático</option>
                  <option value="stable_angina">Angina Estable (Angor)</option>
                  <option value="unstable_angina">Angina Inestable / SCA</option>
                  <option value="heart_failure">Insuficiencia Cardíaca Congestiva</option>
                  <option value="other">Otro estado sintomático</option>
                </select>
              </div>

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Notas de la Investigación y Observaciones Clínicas
                </label>
                <textarea
                  disabled={isEditingDisabled}
                  rows={4}
                  placeholder="Detalles adicionales sobre la evolución del paciente, hospitalizaciones externas, dosis de fármacos, o hallazgos clínicos relevantes..."
                  value={formData.investigator_notes || ''}
                  onChange={(e) => handleInputChange('investigator_notes', e.target.value)}
                  className="px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500/50 text-xs outline-none w-full resize-none disabled:opacity-50 font-sans"
                />
              </div>

              {/* Marks as Completed */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-200 font-mono">Completado y Listo para Monitoría</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">Marcar como finalizado para habilitar la firma del monitor.</p>
                </div>
                <input
                  type="checkbox"
                  disabled={isEditingDisabled}
                  checked={formData.completed}
                  onChange={() => handleCheckboxChange('completed')}
                  className="h-5 w-5 rounded bg-slate-900 border border-slate-800 accent-cyan-500 cursor-pointer disabled:opacity-55"
                />
              </div>

            </div>

            {/* RIGHT COLUMN: Outcomes Checklists */}
            <div className="space-y-6 bg-slate-950/30 p-6 border border-slate-850 rounded-2xl">
              <h4 className="text-xs font-bold font-mono uppercase text-cyan-400 tracking-wider mb-2">
                Eventos Cardíacos Adversos Mayores (MACE)
              </h4>

              {/* MACE summary badge */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-900">
                <span className="text-[11px] font-bold text-slate-300 font-mono">ESTADO GENERAL MACE</span>
                {formData.mace ? (
                  <span className="px-2.5 py-0.5 bg-red-950 text-red-400 border border-red-900/50 rounded-full font-bold text-[10px]">
                    ⚠️ Evento Registrado
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-emerald-950 text-emerald-450 border border-emerald-900/40 rounded-full font-bold text-[10px]">
                    ✓ Libre de Eventos
                  </span>
                )}
              </div>

              <div className="space-y-4 pt-2">
                
                {/* 1. Death */}
                <div className="space-y-2 border-b border-slate-850 pb-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-350 select-none cursor-pointer" onClick={() => handleInputChange('death_type', formData.death_type ? null : 'cardiovascular')}>
                      Muerte
                    </label>
                    <input
                      type="checkbox"
                      disabled={isEditingDisabled}
                      checked={formData.death_type !== null}
                      onChange={() => handleInputChange('death_type', formData.death_type ? null : 'cardiovascular')}
                      className="h-4.5 w-4.5 rounded bg-slate-900 border border-slate-800 accent-red-500 cursor-pointer disabled:opacity-50"
                    />
                  </div>
                  {formData.death_type !== null && (
                    <div className="pl-4 flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">Clasificación de Muerte (ARC)</span>
                      <select
                        disabled={isEditingDisabled}
                        value={formData.death_type}
                        onChange={(e) => handleInputChange('death_type', e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200 outline-none cursor-pointer"
                      >
                        <option value="cardiovascular">Cardiovascular</option>
                        <option value="non-cardiovascular">No Cardiovascular</option>
                        <option value="unknown">Desconocida</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 2. Myocardial Infarction */}
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <label htmlFor="mi-chk" className="text-xs font-bold text-slate-350 cursor-pointer select-none">
                    Infarto Agudo de Miocardio (IAM)
                  </label>
                  <input
                    id="mi-chk"
                    type="checkbox"
                    disabled={isEditingDisabled}
                    checked={formData.myocardial_infarction}
                    onChange={() => handleCheckboxChange('myocardial_infarction')}
                    className="h-4.5 w-4.5 rounded bg-slate-900 border border-slate-800 accent-red-500 cursor-pointer disabled:opacity-50"
                  />
                </div>

                {/* 3. TLR */}
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <div>
                    <label htmlFor="tlr-chk" className="text-xs font-bold text-slate-350 cursor-pointer select-none">
                      Revascularización de la Lesión Diana (TLR)
                    </label>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">Repetición de angioplastia o CABG de la lesión tratada.</p>
                  </div>
                  <input
                    id="tlr-chk"
                    type="checkbox"
                    disabled={isEditingDisabled}
                    checked={formData.tlr}
                    onChange={() => handleCheckboxChange('tlr')}
                    className="h-4.5 w-4.5 rounded bg-slate-900 border border-slate-800 accent-red-500 cursor-pointer disabled:opacity-50"
                  />
                </div>

                {/* 4. TVR */}
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <div>
                    <label htmlFor="tvr-chk" className="text-xs font-bold text-slate-350 cursor-pointer select-none">
                      Revascularización del Vaso Diana (TVR)
                    </label>
                    <p className="text-[9px] text-slate-500 font-mono mt-0.5">Revascularización de cualquier segmento del vaso tratado.</p>
                  </div>
                  <input
                    id="tvr-chk"
                    type="checkbox"
                    disabled={isEditingDisabled}
                    checked={formData.tvr}
                    onChange={() => handleCheckboxChange('tvr')}
                    className="h-4.5 w-4.5 rounded bg-slate-900 border border-slate-800 accent-red-500 cursor-pointer disabled:opacity-50"
                  />
                </div>

                {/* 5. Stent Thrombosis */}
                <div className="space-y-2 border-b border-slate-850 pb-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-350 select-none cursor-pointer" onClick={() => handleInputChange('stent_thrombosis_type', formData.stent_thrombosis_type ? null : 'acute')}>
                      Trombosis del Stent
                    </label>
                    <input
                      type="checkbox"
                      disabled={isEditingDisabled}
                      checked={formData.stent_thrombosis_type !== null}
                      onChange={() => handleInputChange('stent_thrombosis_type', formData.stent_thrombosis_type ? null : 'acute')}
                      className="h-4.5 w-4.5 rounded bg-slate-900 border border-slate-800 accent-red-500 cursor-pointer disabled:opacity-50"
                    />
                  </div>
                  {formData.stent_thrombosis_type !== null && (
                    <div className="pl-4 flex flex-col gap-1">
                      <span className="text-[10px] font-mono text-slate-500 font-bold">Temporalidad de Trombosis (ARC)</span>
                      <select
                        disabled={isEditingDisabled}
                        value={formData.stent_thrombosis_type}
                        onChange={(e) => handleInputChange('stent_thrombosis_type', e.target.value)}
                        className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-200 outline-none cursor-pointer"
                      >
                        <option value="acute">Aguda (0 a 24 horas post-ICP)</option>
                        <option value="subacute">Subaguda (24 horas a 30 días)</option>
                        <option value="late">Tardía (30 días a 1 año)</option>
                        <option value="very_late">Muy Tardía (más de 1 año)</option>
                      </select>
                    </div>
                  )}
                </div>

                {/* 6. Rehospitalization */}
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <label htmlFor="reh-chk" className="text-xs font-bold text-slate-350 cursor-pointer select-none">
                    Rehospitalización por Causa Cardíaca
                  </label>
                  <input
                    id="reh-chk"
                    type="checkbox"
                    disabled={isEditingDisabled}
                    checked={formData.rehospitalization}
                    onChange={() => handleCheckboxChange('rehospitalization')}
                    className="h-4.5 w-4.5 rounded bg-slate-900 border border-slate-800 accent-cyan-500 cursor-pointer disabled:opacity-50"
                  />
                </div>

                {/* 7. Repeat PCI */}
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <label htmlFor="pci-chk" className="text-xs font-bold text-slate-350 cursor-pointer select-none">
                    Angioplastia Adicional (PCI repetida)
                  </label>
                  <input
                    id="pci-chk"
                    type="checkbox"
                    disabled={isEditingDisabled}
                    checked={formData.repeat_pci}
                    onChange={() => handleCheckboxChange('repeat_pci')}
                    className="h-4.5 w-4.5 rounded bg-slate-900 border border-slate-800 accent-cyan-500 cursor-pointer disabled:opacity-50"
                  />
                </div>

                {/* 8. CABG */}
                <div className="flex items-center justify-between border-b border-slate-850 pb-3">
                  <label htmlFor="cabg-chk" className="text-xs font-bold text-slate-350 cursor-pointer select-none">
                    Bypass Aortocoronario (CABG) de urgencia/electiva
                  </label>
                  <input
                    id="cabg-chk"
                    type="checkbox"
                    disabled={isEditingDisabled}
                    checked={formData.cabg}
                    onChange={() => handleCheckboxChange('cabg')}
                    className="h-4.5 w-4.5 rounded bg-slate-900 border border-slate-800 accent-cyan-500 cursor-pointer disabled:opacity-50"
                  />
                </div>

                {/* 9. Follow-up Angio & OCT */}
                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-850">
                    <label htmlFor="angio-chk" className="text-[10px] font-bold text-slate-400 cursor-pointer select-none">Angio de control</label>
                    <input
                      id="angio-chk"
                      type="checkbox"
                      disabled={isEditingDisabled}
                      checked={formData.followup_angio}
                      onChange={() => handleCheckboxChange('followup_angio')}
                      className="h-4 w-4 rounded bg-slate-950 border border-slate-800 accent-cyan-500 cursor-pointer disabled:opacity-50"
                    />
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-850">
                    <label htmlFor="oct-chk" className="text-[10px] font-bold text-slate-400 cursor-pointer select-none">OCT de control</label>
                    <input
                      id="oct-chk"
                      type="checkbox"
                      disabled={isEditingDisabled}
                      checked={formData.followup_oct}
                      onChange={() => handleCheckboxChange('followup_oct')}
                      className="h-4 w-4 rounded bg-slate-950 border border-slate-800 accent-cyan-500 cursor-pointer disabled:opacity-50"
                    />
                  </div>
                </div>

              </div>
            </div>

          </div>

          {/* Form Actions */}
          <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            
            {/* Monitor validation button */}
            <div>
              {(profile.role === 'admin' || profile.role === 'monitor') && formData.id && (
                <button
                  type="button"
                  onClick={handleToggleValidation}
                  disabled={isPending}
                  className={`px-5 py-2.5 rounded-xl font-bold font-mono text-xs transition-all cursor-pointer flex items-center gap-2 ${
                    formData.monitor_validated
                      ? 'bg-red-950/40 border border-red-800/40 text-red-400 hover:bg-red-950/60'
                      : 'bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 hover:bg-emerald-950/60'
                  }`}
                >
                  {formData.monitor_validated ? '🔓 Retirar Validación Científica' : '✓ Firmar y Validar por Monitor'}
                </button>
              )}
            </div>

            {/* Save / Reset */}
            <div className="flex items-center gap-3">
              {isDirty && (
                <span className="text-[10px] text-yellow-500 font-mono animate-pulse">
                  ⚠ Cambios sin guardar
                </span>
              )}
              <button
                type="submit"
                disabled={isEditingDisabled || isPending || !isDirty}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-2xl text-xs transition-all shadow-[0_4px_15px_rgba(6,182,212,0.15)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {isPending ? 'Guardando...' : 'Guardar Seguimiento'}
              </button>
            </div>

          </div>
        </form>

        {/* ── AUDIT LOGS TRAIL SECTION (Append-only) ── */}
        <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                Historial de Trazabilidad y Auditoría
              </h3>
              <p className="text-[10px] text-slate-500 mt-0.5">
                Registro inmutable (append-only) de todas las acciones de creación y actualización para cumplimiento científico.
              </p>
            </div>
            <span className="px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-850 rounded font-mono text-[9px]">
              FDA-compliant log
            </span>
          </div>

          {auditTrail.filter((a) => a.new_values?.followup_type === activeType || a.old_values?.followup_type === activeType).length === 0 ? (
            <p className="text-xs text-slate-650 font-mono py-4 text-center">No hay registros de auditoría para este periodo de seguimiento.</p>
          ) : (
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {auditTrail
                .filter((a) => a.new_values?.followup_type === activeType || a.old_values?.followup_type === activeType)
                .map((audit) => {
                  const auditDate = new Date(audit.created_at).toLocaleString('es-ES', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <div key={audit.id} className="p-4 bg-slate-950 border border-slate-850 rounded-2xl space-y-2 text-xs font-mono">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-850 pb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            audit.action === 'insert' ? 'bg-emerald-950 text-emerald-450 border border-emerald-900/50' : 'bg-blue-950 text-blue-450 border border-blue-900/50'
                          }`}>
                            {audit.action.toUpperCase()}
                          </span>
                          <span className="font-bold text-slate-300">
                            {audit.changed_by_email || 'Sistema (Automatizado)'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500">{auditDate}</span>
                      </div>
                      
                      <div className="pl-2 border-l border-slate-800">
                        {formatAuditChanges(audit)}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
