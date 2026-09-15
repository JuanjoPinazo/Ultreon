'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ECRFFormData, createEmptyUltreonFormData } from './types';
import { cleanFormData, preparePayloadForSubmit, mapPersistedCaseToFormData } from './helpers';
import { saveRegistryCaseAction } from '@/lib/supabase/actions';
import { useGlobalDialog } from '@/components/providers/GlobalDialogProvider';

import { Step1Case } from './components/Step1Case';
import { Step2Acquisition } from './components/Step2Acquisition';
import { Step3Strategy } from './components/Step3Strategy';
import { Step4Findings } from './components/Step4Findings';
import { Step5Impact } from './components/Step5Impact';
import { Step6Closure } from './components/Step6Closure';

const MILESTONES = [
  { id: 1, label: 'Caso' },
  { id: 2, label: 'Adquisición' },
  { id: 3, label: 'Estrategia' },
  { id: 4, label: 'Hallazgos' },
  { id: 5, label: 'Impacto' },
  { id: 6, label: 'Cierre' }
];

interface Props {
  user: any;
  profile: any;
  hospitals: any[];
  existingCase?: any; // For edit mode
}

export default function RegistryFormClient({ user, profile, hospitals, existingCase }: Props) {
  // Access control: hospital_user can only see their assigned hospital(s)
  const authorizedHospitals = React.useMemo(() => {
    return profile.role === 'hospital_user' 
      ? hospitals.filter(h => h.id === profile.hospital_id)
      : hospitals;
  }, [profile.role, profile.hospital_id, hospitals]);

  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<ECRFFormData>(createEmptyUltreonFormData());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const { showDialog } = useGlobalDialog();

  const [isMounted, setIsMounted] = useState(false);

  // Draft recovery & Edit Mode
  useEffect(() => {
    if (isMounted) return;
    setIsMounted(true);
    if (existingCase) {
      // Priority: DB Record
      setFormData(mapPersistedCaseToFormData(existingCase));
    } else {
      // Priority: LocalStorage
      const savedDraft = localStorage.getItem('ultreon_v3_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed.formData && typeof parsed.formData === 'object') {
            setFormData({ ...createEmptyUltreonFormData(), ...parsed.formData });
            if (parsed.step) setStep(parsed.step);
          }
        } catch (e) {
          console.error("Error al leer borrador local. Se usará un formulario vacío.");
          localStorage.removeItem('ultreon_v3_draft');
        }
      } else {
        // Pre-fill hospital and investigator if there is exactly 1 authorized hospital
        if (authorizedHospitals.length === 1) {
          const h = authorizedHospitals[0];
          const isOperator = h.operators?.some((op: any) => op.id === user.id);
          setFormData(prev => ({ 
            ...prev, 
            centroMedico: h.id,
            operador: isOperator ? user.id : ''
          }));
        }
      }
    }
  }, [existingCase, profile, authorizedHospitals, user.id]);

  // Autosave Draft
  useEffect(() => {
    // Basic check for empty state
    const isEmpty = JSON.stringify(formData) === JSON.stringify(createEmptyUltreonFormData());
    if (!existingCase && !isEmpty) {
      localStorage.setItem('ultreon_v3_draft', JSON.stringify({ formData, step }));
    }
  }, [formData, step, existingCase]);

  const handleResetForm = () => {
    const emptyState = createEmptyUltreonFormData();
    const isDirty = JSON.stringify(formData) !== JSON.stringify(emptyState) && (!existingCase || JSON.stringify(formData) !== JSON.stringify(mapPersistedCaseToFormData(existingCase)));
    
    if (isDirty) {
      showDialog({
        title: 'Descartar cambios',
        message: 'Hay cambios sin guardar. ¿Quieres descartarlos y comenzar un formulario nuevo?',
        type: 'unsaved_changes',
        confirmLabel: 'Sí, descartar',
        onConfirm: () => executeReset()
      });
      return;
    }
    
    executeReset();
  };

  const executeReset = () => {
    localStorage.removeItem('ultreon_v3_draft');
    
    const newState = createEmptyUltreonFormData();
    
    // Preserve context for hospital_user if needed
    if (profile.role === 'hospital_user' && authorizedHospitals.length === 1) {
      const h = authorizedHospitals[0];
      const isOperator = h.operators?.some((op: any) => op.id === user.id);
      newState.centroMedico = h.id;
      newState.operador = isOperator && h.operators.length === 1 ? user.id : '';
    }

    setFormData(newState);
    setStep(1);
    setError(null);
    
    if (existingCase) {
      router.replace('/registry/new');
    }
  };

  // Validation logic
  const validateStep = (currentStep: number): boolean => {
    setError(null);
    const validationErrors: { field: string; message: string }[] = [];

    if (currentStep === 1) {
      if (!formData.centroMedico) validationErrors.push({ field: "Centro Médico", message: "Es obligatorio" });
      if (!formData.operador) validationErrors.push({ field: "Investigador", message: "Es obligatorio" });
      if (!formData.fechaProcedimiento) validationErrors.push({ field: "Fecha", message: "Es obligatoria" });
      if (formData.pullback_count < 1 || formData.pullback_count > 3) validationErrors.push({ field: "Pullbacks", message: "Debe indicar entre 1 y 3 pullbacks" });
    }
    if (currentStep === 2) {
      let hasLeftMain = false;
      for (let i = 0; i < formData.pullback_count; i++) {
        const pb = formData.pullbacks[i];
        if (!pb.vessel) validationErrors.push({ field: `Vaso del Pullback ${i+1}`, message: "Es obligatorio seleccionarlo en el Paso 1" });
        if (!pb.speed) validationErrors.push({ field: `Tipo de adquisición Pullback ${i+1}`, message: "Es obligatorio" });
        if (pb.vessel === 'LM' || pb.vessel === 'Left Main') hasLeftMain = true;
      }
      
      if (hasLeftMain) {
        if (!formData.guide_catheter_size) validationErrors.push({ field: "Tamaño Catéter", message: "Es obligatorio para TCI" });
        if (!formData.tci_location) validationErrors.push({ field: "Localización TCI", message: "Es obligatoria" });
      }
    }
    
    if (validationErrors.length > 0) {
      showDialog({
        title: 'Error de Validación',
        message: 'Faltan campos obligatorios en esta sección:',
        type: 'validation',
        errors: validationErrors,
        confirmLabel: 'Entendido'
      });
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(s => Math.min(6, s + 1));
      window.scrollTo(0,0);
    }
  };

  const handlePrev = () => {
    setStep(s => Math.max(1, s - 1));
    setError(null);
    window.scrollTo(0,0);
  };

  const handleSubmit = async () => {
    if (!validateStep(6)) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. Clean Stale Data
      const cleanedData = cleanFormData(formData);
      
      // 2. Prepare Payload
      const payload = preparePayloadForSubmit(cleanedData);
      
      // If editing, preserve ID
      if (existingCase && existingCase.id) {
        (payload as any).id = existingCase.id;
      }

      // 3. Save
      const result = await saveRegistryCaseAction(payload as any);
      
      if (result.error) {
        setError(`Error al guardar: ${result.error}`);
        setIsSubmitting(false);
        return;
      }

      // 4. Cleanup and Success
      localStorage.removeItem('ultreon_v3_draft');
      setSuccess(true);
      
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err: any) {
      setError(`Error crítico: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 border dark:border-emerald-800/50 p-8 rounded-2xl text-center space-y-4">
          <div className="text-4xl">✅</div>
          <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">¡Caso guardado con éxito!</h2>
          <p className="text-slate-600 dark:text-muted-foreground text-sm">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col pb-24 font-sans">
      <header className="bg-background/80 backdrop-blur border-b border-border dark:border-slate-900 sticky top-0 z-40 p-4">
        <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="border border-border p-1.5 rounded hover:bg-card text-muted-foreground">←</Link>
            <div>
              <h1 className="text-cyan-400 font-bold text-sm tracking-widest uppercase">ULTREON™ 3.0</h1>
              <p className="text-xs text-muted-foreground">{existingCase ? `Editando caso: ${existingCase.anonymous_code}` : 'Nuevo Registro Clínico'}</p>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
            {MILESTONES.map(m => (
              <div 
                key={m.id} 
                className={`flex flex-col items-center flex-shrink-0 cursor-pointer ${step === m.id ? 'opacity-100' : 'opacity-50 hover:opacity-75'}`}
                onClick={() => { if (m.id < step || validateStep(step)) setStep(m.id); }}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all ${
                  step === m.id ? 'bg-cyan-900/50 border-cyan-400 text-cyan-400' : 
                  step > m.id ? 'bg-emerald-900/30 border-emerald-500 text-emerald-500' : 
                  'bg-card border-border text-muted-foreground'
                }`}>
                  {m.id}
                </div>
                <span className="text-[9px] mt-1 uppercase tracking-wider">{m.label}</span>
              </div>
            ))}
            {profile.role === 'admin' && (
              <label className="flex items-center gap-2 px-3 py-1.5 border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded text-xs font-bold cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.is_demo}
                  onChange={(e) => setFormData({...formData, is_demo: e.target.checked})}
                  className="rounded border-amber-500/50 text-amber-600 focus:ring-amber-500 bg-transparent"
                />
                DEMO MODE
              </label>
            )}
          </div>
          <button 
            type="button" 
            onClick={handleResetForm}
            className="flex-shrink-0 px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground hover:bg-muted dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 rounded text-xs font-medium transition-colors"
          >
            Nuevo formulario
          </button>
        </div>
      </header>

      <div className="flex-1 max-w-[1000px] w-full mx-auto mt-6 md:mt-8 px-4">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-red-200 text-red-800 dark:bg-red-950/50 dark:border-red-800/50 rounded-xl dark:text-red-400 text-sm flex items-center gap-3">
            <span>⚠️</span> {error}
          </div>
        )}

        <div className="bg-background/50 border border-border rounded-2xl overflow-hidden shadow-2xl">
          {step === 1 && <Step1Case formData={formData} setFormData={setFormData} hospitals={authorizedHospitals} profile={profile} />}
          {step === 2 && <Step2Acquisition formData={formData} setFormData={setFormData} />}
          {step === 3 && <Step3Strategy formData={formData} setFormData={setFormData} />}
          {step === 4 && <Step4Findings formData={formData} setFormData={setFormData} />}
          {step === 5 && <Step5Impact formData={formData} setFormData={setFormData} />}
          {step === 6 && <Step6Closure formData={formData} setFormData={setFormData} />}
        </div>

        <div className="flex justify-between items-center mt-6 py-4">
          <button 
            onClick={handlePrev} 
            disabled={step === 1}
            className="px-6 py-2.5 bg-card disabled:opacity-30 border border-border hover:border-slate-400 dark:hover:border-slate-600 rounded-lg text-sm font-medium transition-all"
          >
            ← Anterior
          </button>
          {step < 6 ? (
            <button 
              onClick={handleNext}
              className="px-8 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
            >
              Continuar →
            </button>
          ) : (
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
            >
              {isSubmitting ? 'Procesando...' : 'Finalizar y Guardar Caso'}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
