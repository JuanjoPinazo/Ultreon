'use client';

import React, { useState, useEffect } from 'react';

// Form Data Interface
interface eCRFFormData {
  centroMedico: string;
  idPaciente: string;
  vasoDiana: string;
  estrategiaInicial: string;
  diametroStent: number | '';
  longitudStent: number | '';
  deteccionEEL: boolean;
  calcioSeveroIA: boolean;
  estrategiaFinal: string;
  stentImplantado: string;
  modificoEstrategiaUltreon: boolean;
  expansionFinal: number;
}

const INITIAL_FORM_STATE: eCRFFormData = {
  centroMedico: '',
  idPaciente: '',
  vasoDiana: '',
  estrategiaInicial: '',
  diametroStent: '',
  longitudStent: '',
  deteccionEEL: false,
  calcioSeveroIA: false,
  estrategiaFinal: '',
  stentImplantado: '',
  modificoEstrategiaUltreon: false,
  expansionFinal: 90,
};

const CENTROS_MEDICOS = [
  'Hospital Universitari i Politècnic La Fe (Valencia)',
  'Hospital General Universitari d\'Alacant (Dr. Balmis)',
  'Hospital Clínico Universitario de Valencia',
  'Hospital General Universitario de Elche',
  'Hospital General Universitari de Castelló',
  'Hospital Universitario de la Ribera (Alzira)',
];

const VASOS_DIANA = [
  { value: 'TCI', label: 'TCI (Tronco Común Izquierdo)' },
  { value: 'DA', label: 'DA (Descendente Anterior)' },
  { value: 'CD', label: 'CD (Coronaria Derecha)' },
  { value: 'CX', label: 'CX (Circunfleja)' },
  { value: 'INJERTO', label: 'Injerto Aortocoronario' },
  { value: 'DIAG_BIS', label: 'Ramo Diagonal / Bisectriz' },
];

const ESTRATEGIAS_INICIALES = [
  { value: 'STENT_DIRECTO', label: 'Stent Directo' },
  { value: 'PREDILATACION_POBA', label: 'Predilatación Convencional (POBA)' },
  { value: 'PREPARACION_PLACA_BALON_ESPECIAL', label: 'Preparación de Placa (Cutting/Scoring)' },
  { value: 'ATERECTOMIA_ROT_ORB', label: 'Aterectomía Rotacional / Orbital (Rotablator)' },
  { value: 'LITOTRICIA_IVL', label: 'Litotricia Intracoronaria (Shockwave IVL)' },
];

const ESTRATEGIAS_FINALES = [
  { value: 'STENT_DIRECTO', label: 'Stent Directo' },
  { value: 'PREDILATACION_STENT', label: 'Predilatación Convencional + Stent' },
  { value: 'MOD_PLACA_STENT', label: 'Modificación de Placa (Aterectomía/IVL) + Stent' },
  { value: 'DEB_SIN_STENT', label: 'Balón Farmacoactivo (DEB) sin Stent' },
];

const STENTS_DISPONIBLES = [
  'Abbott XIENCE Skypoint™ (DES)',
  'Boston Scientific SYNERGY Megatron™ (DES)',
  'Medtronic Resolute Onyx™ (DES)',
  'Terumo Ultimaster Tansei™ (DES)',
  'Otro / Dispositivo alternativo',
];

export default function RegistroOpstarForm() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<eCRFFormData>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof eCRFFormData, string>>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingPhase, setLoadingPhase] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  // Form step navigation & validation
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof eCRFFormData, string>> = {};

    if (currentStep === 1) {
      if (!formData.centroMedico) newErrors.centroMedico = 'Seleccione un centro médico.';
      if (!formData.idPaciente.trim()) newErrors.idPaciente = 'Introduzca el ID del paciente.';
      if (!formData.vasoDiana) newErrors.vasoDiana = 'Seleccione el vaso diana del procedimiento.';
    } else if (currentStep === 2) {
      if (!formData.estrategiaInicial) newErrors.estrategiaInicial = 'Seleccione la estrategia angiográfica inicial.';
      if (!formData.diametroStent || formData.diametroStent <= 0) {
        newErrors.diametroStent = 'Indique un diámetro válido (mm).';
      }
      if (!formData.longitudStent || formData.longitudStent <= 0) {
        newErrors.longitudStent = 'Indique una longitud válida (mm).';
      }
    } else if (currentStep === 4) {
      if (!formData.estrategiaFinal) newErrors.estrategiaFinal = 'Seleccione la estrategia final.';
      if (formData.estrategiaFinal !== 'DEB_SIN_STENT' && !formData.stentImplantado) {
        newErrors.stentImplantado = 'Especifique el stent implantado.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleInputChange = (key: keyof eCRFFormData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      
      // Auto-uppercase Patient ID
      if (key === 'idPaciente' && typeof value === 'string') {
        updated.idPaciente = value.toUpperCase();
      }

      // Reset stent choice if strategy is drug-coated balloon only
      if (key === 'estrategiaFinal' && value === 'DEB_SIN_STENT') {
        updated.stentImplantado = 'N/A - Balón Farmacoactivo';
      } else if (key === 'estrategiaFinal' && prev.estrategiaFinal === 'DEB_SIN_STENT') {
        updated.stentImplantado = '';
      }

      return updated;
    });

    // Clear error for this field
    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Simulate Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsLoading(true);
    
    // Smooth clinical simulation phases
    const phases = [
      'Validando consistencia de datos clínicos...',
      'Procesando telemetría ULTREON™ Co-registration...',
      'Encriptando y transmitiendo a base de datos OPSTAR-AI...',
    ];

    for (let i = 0; i < phases.length; i++) {
      setLoadingPhase(phases[i]);
      await new Promise((resolve) => setTimeout(resolve, 850));
    }

    setIsLoading(false);
    setIsSuccess(true);
  };

  const handleReset = () => {
    setFormData(INITIAL_FORM_STATE);
    setStep(1);
    setIsSuccess(false);
    setErrors({});
  };

  // Helper to trigger JSON export
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `OPSTAR_LEV_ECRF_${formData.idPaciente || 'PATIENT'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Clinical helper for final expansion message
  const getExpansionWarning = (val: number) => {
    if (val < 80) {
      return { text: 'Expansión Subóptima (<80%) - Riesgo incrementado de reestenosis y trombosis del stent.', color: 'text-amber-600 bg-amber-50 border-amber-200' };
    }
    if (val >= 90) {
      return { text: 'Expansión Óptima (≥90%) - Criterio de éxito clínico cumplido según guías de optimización por OCT.', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
    }
    return { text: 'Expansión Aceptable (80% - 89%) - Criterio clínico estándar cubierto.', color: 'text-slate-600 bg-slate-50 border-slate-200' };
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 md:py-16 antialiased text-[#1D1D1F] font-sans">
      {/* Dynamic Keyframe Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes waveGlow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.03); }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-step-enter {
          animation: fadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-wave-glow {
          animation: waveGlow 3s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spinSlow 8s linear infinite;
        }
      `}</style>

      {/* Main Container Card */}
      <div className="bg-white border border-[#E2E2E7] rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.03)] overflow-hidden transition-all duration-300">
        
        {/* Header Section */}
        <div className="p-6 md:p-8 border-b border-[#F2F2F7] bg-[#FAF9F6] relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-br from-[#0071E3]/5 to-transparent rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 z-10 relative">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] tracking-[0.15em] font-bold text-[#8E8E93] uppercase">E-CRF REGISTRY</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#0071E3]" />
                <span className="text-[10px] tracking-[0.15em] font-semibold text-[#0071E3] uppercase">Co-Registration Active</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#1C1C1E]">
                OPSTAR-AI <span className="font-light text-[#8E8E93]">Levante</span>
              </h1>
              <p className="text-xs text-[#8E8E93] mt-1 font-medium">
                Optimización del Intervencionismo Coronario Complejo · Inteligencia Artificial ULTREON™ 3.0
              </p>
            </div>
            
            {/* Status indicator pill */}
            <div className="self-start md:self-center flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white border border-[#E2E2E7] shadow-[0_2px_8px_rgba(0,0,0,0.02)] text-xs font-semibold text-[#1C1C1E]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-teal-500"></span>
              </span>
              <span>Conexión ULTREON activa</span>
            </div>
          </div>
        </div>

        {/* Stepper Progress Bar */}
        {!isSuccess && !isLoading && (
          <div className="px-6 md:px-8 py-5 border-b border-[#F2F2F7] bg-white">
            <div className="flex items-center justify-between relative">
              
              {/* Progress Line */}
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-[#F2F2F7] z-0">
                <div 
                  className="h-full bg-[#0071E3] transition-all duration-500 ease-out"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                />
              </div>

              {/* Step Markers */}
              {[1, 2, 3, 4].map((num) => {
                const isActive = step === num;
                const isCompleted = step > num;
                
                return (
                  <button
                    key={num}
                    onClick={() => {
                      // Only allow navigation to previous steps or next steps if validated
                      if (num < step) {
                        setStep(num);
                      } else if (num > step && validateStep(step)) {
                        // Allow step jumping only up to next sequential step
                        if (num === step + 1) setStep(num);
                      }
                    }}
                    className="relative z-10 focus:outline-none group"
                  >
                    <div 
                      className={`h-8 w-8 rounded-full flex items-center justify-center border font-mono text-xs font-bold transition-all duration-300 ${
                        isActive 
                          ? 'bg-[#1C1C1E] border-[#1C1C1E] text-white shadow-md' 
                          : isCompleted 
                            ? 'bg-[#0071E3] border-[#0071E3] text-white' 
                            : 'bg-white border-[#E2E2E7] text-[#8E8E93] hover:border-[#8E8E93]'
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : num}
                    </div>
                    
                    {/* Floating Label */}
                    <span 
                      className={`absolute left-1/2 -translate-x-1/2 top-9 whitespace-nowrap text-[10px] tracking-wide font-bold transition-all duration-300 ${
                        isActive ? 'text-[#1C1C1E] scale-100 font-semibold' : 'text-[#8E8E93] opacity-60 scale-95'
                      }`}
                    >
                      {num === 1 && 'Procedimiento'}
                      {num === 2 && 'Angiografía'}
                      {num === 3 && 'ULTREON 3.0'}
                      {num === 4 && 'Definitiva'}
                    </span>
                  </button>
                );
              })}

            </div>
            <div className="h-6" /> {/* spacer to offset absolute labels */}
          </div>
        )}

        {/* Form Body */}
        {isLoading ? (
          /* Cinematic Loading Screen */
          <div className="p-8 md:p-16 flex flex-col items-center justify-center min-h-[380px] bg-white animate-step-enter">
            <div className="relative mb-6">
              {/* Rotating abstract circular tracks */}
              <div className="w-20 h-20 rounded-full border border-dashed border-[#0071E3]/20 animate-spin-slow absolute top-0 left-0" />
              <div className="w-20 h-20 rounded-full border-t-2 border-[#0071E3] animate-spin" />
            </div>
            
            <h3 className="text-lg font-bold text-[#1D1D1F] tracking-tight mb-2">
              Procesando Registro Clínico
            </h3>
            
            <p className="text-sm text-[#8E8E93] text-center max-w-sm font-medium animate-pulse">
              {loadingPhase}
            </p>
          </div>
        ) : isSuccess ? (
          /* Success Screen & summary */
          <div className="p-8 md:p-12 animate-step-enter bg-white">
            <div className="flex flex-col items-center text-center mb-8">
              {/* Success Badge */}
              <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mb-4 shadow-sm">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-extrabold text-[#1C1C1E] tracking-tight">
                Procedimiento Guardado
              </h2>
              <p className="text-sm text-[#8E8E93] mt-1">
                La telemetría ha sido registrada con éxito en el servidor central OPSTAR-AI Levante.
              </p>
            </div>

            {/* Clinical Summary Card */}
            <div className="bg-[#FAF9F6] border border-[#E2E2E7] rounded-2xl p-6 mb-8 text-sm text-[#1C1C1E]">
              <div className="flex items-center justify-between pb-4 border-b border-[#E2E2E7]/60 mb-4">
                <h4 className="font-bold text-xs uppercase tracking-widest text-[#8E8E93]">Resumen del Registro</h4>
                <span className="font-mono text-xs font-bold text-[#0071E3] bg-[#0071E3]/5 px-2.5 py-1 rounded">
                  {formData.idPaciente}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                <div>
                  <span className="text-[#8E8E93] text-xs block mb-0.5">Centro Médico</span>
                  <span className="font-semibold text-[#1C1C1E]">{formData.centroMedico}</span>
                </div>
                <div>
                  <span className="text-[#8E8E93] text-xs block mb-0.5">Vaso Diana</span>
                  <span className="font-semibold text-[#1C1C1E]">
                    {VASOS_DIANA.find(v => v.value === formData.vasoDiana)?.label || formData.vasoDiana}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E8E93] text-xs block mb-0.5">Estrategia Inicial Angiográfica</span>
                  <span className="font-semibold text-[#1C1C1E]">
                    {ESTRATEGIAS_INICIALES.find(e => e.value === formData.estrategiaInicial)?.label || formData.estrategiaInicial}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E8E93] text-xs block mb-0.5">Estrategia Definitiva Final</span>
                  <span className="font-semibold text-[#1C1C1E]">
                    {ESTRATEGIAS_FINALES.find(e => e.value === formData.estrategiaFinal)?.label || formData.estrategiaFinal}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E8E93] text-xs block mb-0.5">Stent Planificado vs Implantado</span>
                  <span className="font-semibold text-[#1C1C1E]">
                    Planificado: {formData.diametroStent} x {formData.longitudStent} mm <br/>
                    Implantado: {formData.stentImplantado}
                  </span>
                </div>
                <div>
                  <span className="text-[#8E8E93] text-xs block mb-0.5">Expansión Final Obtenida</span>
                  <span className="font-mono font-bold text-[#1C1C1E] text-base">{formData.expansionFinal}%</span>
                </div>
              </div>

              {/* Coregistration findings indicators */}
              <div className="mt-5 pt-4 border-t border-[#E2E2E7]/60 flex flex-wrap gap-2.5">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  formData.deteccionEEL ? 'bg-indigo-50 border-indigo-150 text-indigo-700' : 'bg-slate-50 border-slate-200 text-[#8E8E93] line-through'
                }`}>
                  Detección EEL {formData.deteccionEEL ? 'Activa' : 'Inactiva'}
                </span>
                
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  formData.calcioSeveroIA ? 'bg-amber-50 border-amber-150 text-amber-700' : 'bg-slate-50 border-slate-200 text-[#8E8E93]'
                }`}>
                  Calcio Severo IA: {formData.calcioSeveroIA ? 'Detectado' : 'No Detectado'}
                </span>

                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                  formData.modificoEstrategiaUltreon ? 'bg-teal-50 border-teal-150 text-teal-700' : 'bg-slate-50 border-slate-200 text-[#8E8E93]'
                }`}>
                  {formData.modificoEstrategiaUltreon ? '✓ ULTREON Modificó Estrategia' : 'ULTREON sin cambio de estrategia'}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <button
                onClick={handleExportJSON}
                className="px-5 py-3 rounded-2xl border border-[#E2E2E7] hover:bg-[#F5F5F7] transition-all text-xs font-semibold text-[#1C1C1E] flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4 text-[#8E8E93]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Exportar Ficha (JSON)
              </button>
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] text-white transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-[#0071E3]/15"
              >
                Registrar Nuevo Paciente
              </button>
            </div>
          </div>
        ) : (
          /* Actual Step Forms */
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            <div className="min-h-[290px]">
              
              {/* STEP 1: Datos del Procedimiento */}
              {step === 1 && (
                <div className="animate-step-enter space-y-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#1C1C1E] mb-1">Datos del Procedimiento</h2>
                    <p className="text-xs text-[#8E8E93]">Identifique la localización y el vaso diana intervenido.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Centro Medico Select */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#1D1D1F] tracking-wide" htmlFor="centroMedico">
                        Centro Médico de Referencia
                      </label>
                      <div className="relative">
                        <select
                          id="centroMedico"
                          value={formData.centroMedico}
                          onChange={(e) => handleInputChange('centroMedico', e.target.value)}
                          className={`w-full px-4 py-3 rounded-2xl bg-[#F5F5F7] border transition-all appearance-none cursor-pointer text-sm outline-none ${
                            errors.centroMedico ? 'border-red-500 ring-2 ring-red-150' : 'border-[#E2E2E7] focus:border-[#0071E3] focus:ring-[3px] focus:ring-[#0071E3]/10'
                          }`}
                        >
                          <option value="">Seleccione un hospital...</option>
                          {CENTROS_MEDICOS.map((centro, index) => (
                            <option key={index} value={centro}>
                              {centro}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8E8E93]">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {errors.centroMedico && (
                        <span className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                          ⚠ {errors.centroMedico}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* ID Paciente */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#1D1D1F] tracking-wide" htmlFor="idPaciente">
                          ID de Paciente
                        </label>
                        <input
                          type="text"
                          id="idPaciente"
                          value={formData.idPaciente}
                          onChange={(e) => handleInputChange('idPaciente', e.target.value)}
                          placeholder="Ej: OPS-LEV-2026-01"
                          className={`w-full px-4 py-3 rounded-2xl bg-[#F5F5F7] border transition-all text-sm outline-none uppercase font-mono ${
                            errors.idPaciente ? 'border-red-500 ring-2 ring-red-150' : 'border-[#E2E2E7] focus:border-[#0071E3] focus:ring-[3px] focus:ring-[#0071E3]/10'
                          }`}
                        />
                        {errors.idPaciente && (
                          <span className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                            ⚠ {errors.idPaciente}
                          </span>
                        )}
                      </div>

                      {/* Vaso Diana */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#1D1D1F] tracking-wide" htmlFor="vasoDiana">
                          Vaso Diana
                        </label>
                        <div className="relative">
                          <select
                            id="vasoDiana"
                            value={formData.vasoDiana}
                            onChange={(e) => handleInputChange('vasoDiana', e.target.value)}
                            className={`w-full px-4 py-3 rounded-2xl bg-[#F5F5F7] border transition-all appearance-none cursor-pointer text-sm outline-none ${
                              errors.vasoDiana ? 'border-red-500 ring-2 ring-red-150' : 'border-[#E2E2E7] focus:border-[#0071E3] focus:ring-[3px] focus:ring-[#0071E3]/10'
                            }`}
                          >
                            <option value="">Seleccione vaso...</option>
                            {VASOS_DIANA.map((vaso) => (
                              <option key={vaso.value} value={vaso.value}>
                                {vaso.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8E8E93]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        {errors.vasoDiana && (
                          <span className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                            ⚠ {errors.vasoDiana}
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* STEP 2: Planificación Angiográfica */}
              {step === 2 && (
                <div className="animate-step-enter space-y-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#1C1C1E] mb-1">Planificación Angiográfica</h2>
                    <p className="text-xs text-[#8E8E93]">Especifique la estrategia terapéutica y el sizing angiográfico estimado.</p>
                  </div>

                  <div className="space-y-4">
                    {/* Estrategia Inicial */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-[#1D1D1F] tracking-wide" htmlFor="estrategiaInicial">
                        Estrategia Inicial Angiográfica
                      </label>
                      <div className="relative">
                        <select
                          id="estrategiaInicial"
                          value={formData.estrategiaInicial}
                          onChange={(e) => handleInputChange('estrategiaInicial', e.target.value)}
                          className={`w-full px-4 py-3 rounded-2xl bg-[#F5F5F7] border transition-all appearance-none cursor-pointer text-sm outline-none ${
                            errors.estrategiaInicial ? 'border-red-500 ring-2 ring-red-150' : 'border-[#E2E2E7] focus:border-[#0071E3] focus:ring-[3px] focus:ring-[#0071E3]/10'
                          }`}
                        >
                          <option value="">Seleccione estrategia inicial...</option>
                          {ESTRATEGIAS_INICIALES.map((est) => (
                            <option key={est.value} value={est.value}>
                              {est.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8E8E93]">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {errors.estrategiaInicial && (
                        <span className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                          ⚠ {errors.estrategiaInicial}
                        </span>
                      )}
                    </div>

                    {/* Diámetro y Longitud */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      {/* Diámetro del stent */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#1D1D1F] tracking-wide flex items-center justify-between" htmlFor="diametroStent">
                          <span>Diámetro Estimado Stent (mm)</span>
                          <span className="text-[10px] text-[#8E8E93] font-normal">Paso: 0.25 mm</span>
                        </label>
                        <input
                          type="number"
                          id="diametroStent"
                          value={formData.diametroStent}
                          onChange={(e) => handleInputChange('diametroStent', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          step="0.25"
                          min="2.0"
                          max="5.5"
                          placeholder="Ej: 3.00"
                          className={`w-full px-4 py-3 rounded-2xl bg-[#F5F5F7] border transition-all text-sm outline-none ${
                            errors.diametroStent ? 'border-red-500 ring-2 ring-red-150' : 'border-[#E2E2E7] focus:border-[#0071E3] focus:ring-[3px] focus:ring-[#0071E3]/10'
                          }`}
                        />
                        {errors.diametroStent && (
                          <span className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                            ⚠ {errors.diametroStent}
                          </span>
                        )}
                      </div>

                      {/* Longitud del stent */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#1D1D1F] tracking-wide" htmlFor="longitudStent">
                          Longitud Estimada Stent (mm)
                        </label>
                        <input
                          type="number"
                          id="longitudStent"
                          value={formData.longitudStent}
                          onChange={(e) => handleInputChange('longitudStent', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          min="4"
                          max="60"
                          placeholder="Ej: 18"
                          className={`w-full px-4 py-3 rounded-2xl bg-[#F5F5F7] border transition-all text-sm outline-none ${
                            errors.longitudStent ? 'border-red-500 ring-2 ring-red-150' : 'border-[#E2E2E7] focus:border-[#0071E3] focus:ring-[3px] focus:ring-[#0071E3]/10'
                          }`}
                        />
                        {errors.longitudStent && (
                          <span className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                            ⚠ {errors.longitudStent}
                          </span>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Hallazgos ULTREON 3.0 */}
              {step === 3 && (
                <div className="animate-step-enter space-y-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#1C1C1E] mb-1">Hallazgos ULTREON™ 3.0 (IA)</h2>
                    <p className="text-xs text-[#8E8E93]">Registre los parámetros identificados automáticamente por Co-registro OCT.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    
                    {/* Toggles Container */}
                    <div className="lg:col-span-7 space-y-4">
                      
                      {/* EEL Switch */}
                      <div 
                        onClick={() => handleInputChange('deteccionEEL', !formData.deteccionEEL)}
                        className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none flex items-start justify-between gap-4 ${
                          formData.deteccionEEL 
                            ? 'bg-indigo-50/40 border-indigo-200 shadow-[0_2px_12px_rgba(99,102,241,0.03)]' 
                            : 'bg-white border-[#E2E2E7] hover:border-[#8E8E93]'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#1C1C1E]">Detección Automática EEL</h4>
                            <span className="text-[9px] font-bold tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded uppercase">OCT AI</span>
                          </div>
                          <p className="text-xs text-[#8E8E93] leading-relaxed">
                            Identifica la lámina elástica externa para una referencia exacta del tamaño real de la pared del vaso.
                          </p>
                        </div>
                        
                        {/* Apple style toggle switch */}
                        <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                          formData.deteccionEEL ? 'bg-indigo-600' : 'bg-[#E2E2E7]'
                        }`}>
                          <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow ${
                            formData.deteccionEEL ? 'translate-x-5.5' : 'translate-x-0.5'
                          }`} />
                        </div>
                      </div>

                      {/* Calcio Severo Switch */}
                      <div 
                        onClick={() => handleInputChange('calcioSeveroIA', !formData.calcioSeveroIA)}
                        className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none flex items-start justify-between gap-4 ${
                          formData.calcioSeveroIA 
                            ? 'bg-amber-50/40 border-amber-200 shadow-[0_2px_12px_rgba(245,158,11,0.03)]' 
                            : 'bg-white border-[#E2E2E7] hover:border-[#8E8E93]'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-[#1C1C1E]">Calcio Severo (IA)</h4>
                            <span className="text-[9px] font-bold tracking-wider text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">Mapeo IA</span>
                          </div>
                          <p className="text-xs text-[#8E8E93] leading-relaxed">
                            Algoritmo de IA activo. Identifica arcos de calcio que excedan los 180 grados o espesores críticos.
                          </p>
                        </div>
                        
                        {/* Apple style toggle switch */}
                        <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                          formData.calcioSeveroIA ? 'bg-amber-500' : 'bg-[#E2E2E7]'
                        }`}>
                          <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow ${
                            formData.calcioSeveroIA ? 'translate-x-5.5' : 'translate-x-0.5'
                          }`} />
                        </div>
                      </div>

                    </div>

                    {/* Interactive Cinematic OCT Preview Visualization */}
                    <div className="lg:col-span-5 bg-[#1C1C1E] border border-[#2C2C2E] rounded-2xl p-4 flex flex-col items-center justify-center h-[230px] relative overflow-hidden shadow-inner">
                      
                      {/* Grid background effect */}
                      <div className="absolute inset-0 bg-[radial-gradient(#2c2c2e_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />
                      
                      {/* OCT Scanner Circular Cross-section Mockup */}
                      <div className="relative w-36 h-36 rounded-full border border-dashed border-teal-500/20 flex items-center justify-center z-10">
                        
                        {/* Outer EEL circle */}
                        <div className={`absolute w-32 h-32 rounded-full border border-dashed transition-all duration-700 ${
                          formData.deteccionEEL 
                            ? 'border-indigo-400 scale-100 opacity-100 ring-2 ring-indigo-500/10' 
                            : 'border-slate-700 scale-90 opacity-40'
                        }`} />
                        
                        {/* Inner Lumen circle */}
                        <div className={`absolute w-24 h-24 rounded-full border border-[#2C2C2E] bg-[#121214] flex items-center justify-center transition-all ${
                          formData.deteccionEEL ? 'shadow-[0_0_15px_rgba(99,102,241,0.05)]' : ''
                        }`}>
                          <span className="text-[9px] font-mono text-[#8E8E93] tracking-wide select-none">
                            {formData.deteccionEEL ? 'EEL: 3.25mm' : 'LUMEN'}
                          </span>
                        </div>

                        {/* Severe Calcium arc overlay (rendered as a glowing crescent) */}
                        {formData.calcioSeveroIA && (
                          <div className="absolute w-28 h-28 rounded-full border-4 border-transparent border-t-amber-500 border-r-amber-500/60 rotate-45 animate-wave-glow pointer-events-none" />
                        )}

                        {/* Scanner center point dot and sweeps */}
                        <div className="w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_8px_rgba(20,184,166,0.8)] z-20" />
                        <div className="absolute h-16 w-[1px] bg-gradient-to-t from-teal-500 to-transparent bottom-1/2 origin-bottom rotate-12" />
                      </div>

                      {/* Visual UI indicators overlay */}
                      <div className="absolute bottom-2 left-3 right-3 flex justify-between items-center text-[9px] font-mono text-[#8E8E93] z-10">
                        <span>OCT RADIAL SCAN</span>
                        <span className="text-teal-400 flex items-center gap-1 font-bold">
                          <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                          CO-REG
                        </span>
                      </div>

                      {/* Detections legend */}
                      {formData.calcioSeveroIA && (
                        <div className="absolute top-2 left-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-2 py-0.5 rounded text-[8px] font-mono tracking-wider z-20">
                          CALCIO: ARCO 190°
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* STEP 4: Estrategia Definitiva */}
              {step === 4 && (
                <div className="animate-step-enter space-y-5">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-[#1C1C1E] mb-1">Estrategia Definitiva</h2>
                    <p className="text-xs text-[#8E8E93]">Registre el resultado final del procedimiento optimizado por ULTREON™.</p>
                  </div>

                  <div className="space-y-4">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Estrategia Final */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#1D1D1F] tracking-wide" htmlFor="estrategiaFinal">
                          Estrategia Final Implementada
                        </label>
                        <div className="relative">
                          <select
                            id="estrategiaFinal"
                            value={formData.estrategiaFinal}
                            onChange={(e) => handleInputChange('estrategiaFinal', e.target.value)}
                            className={`w-full px-4 py-3 rounded-2xl bg-[#F5F5F7] border transition-all appearance-none cursor-pointer text-sm outline-none ${
                              errors.estrategiaFinal ? 'border-red-500 ring-2 ring-red-150' : 'border-[#E2E2E7] focus:border-[#0071E3] focus:ring-[3px] focus:ring-[#0071E3]/10'
                            }`}
                          >
                            <option value="">Seleccione estrategia final...</option>
                            {ESTRATEGIAS_FINALES.map((est) => (
                              <option key={est.value} value={est.value}>
                                {est.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8E8E93]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                        {errors.estrategiaFinal && (
                          <span className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                            ⚠ {errors.estrategiaFinal}
                          </span>
                        )}
                      </div>

                      {/* Stent Implantado */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-[#1D1D1F] tracking-wide" htmlFor="stentImplantado">
                          Stent Implantado
                        </label>
                        <div className="relative">
                          <select
                            id="stentImplantado"
                            value={formData.stentImplantado}
                            disabled={formData.estrategiaFinal === 'DEB_SIN_STENT'}
                            onChange={(e) => handleInputChange('stentImplantado', e.target.value)}
                            className={`w-full px-4 py-3 rounded-2xl bg-[#F5F5F7] border transition-all appearance-none cursor-pointer text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                              errors.stentImplantado ? 'border-red-500 ring-2 ring-red-150' : 'border-[#E2E2E7] focus:border-[#0071E3] focus:ring-[3px] focus:ring-[#0071E3]/10'
                            }`}
                          >
                            {formData.estrategiaFinal === 'DEB_SIN_STENT' ? (
                              <option value="N/A - Balón Farmacoactivo">N/A - Balón Farmacoactivo</option>
                            ) : (
                              <>
                                <option value="">Seleccione dispositivo...</option>
                                {STENTS_DISPONIBLES.map((stent, index) => (
                                  <option key={index} value={stent}>
                                    {stent}
                                  </option>
                                ))}
                              </>
                            )}
                          </select>
                          {formData.estrategiaFinal !== 'DEB_SIN_STENT' && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#8E8E93]">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {errors.stentImplantado && (
                          <span className="text-[11px] font-semibold text-red-500 flex items-center gap-1">
                            ⚠ {errors.stentImplantado}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Modificó ULTREON la estrategia - HIGHLIGHTED SWITCH CARD */}
                    <div 
                      onClick={() => handleInputChange('modificoEstrategiaUltreon', !formData.modificoEstrategiaUltreon)}
                      className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer select-none flex items-center justify-between gap-4 ${
                        formData.modificoEstrategiaUltreon 
                          ? 'bg-[#0071E3]/5 border-[#0071E3] shadow-[0_4px_20px_rgba(0,113,227,0.06)]' 
                          : 'bg-white border-[#E2E2E7] hover:border-[#8E8E93]'
                      }`}
                    >
                      <div className="flex gap-3.5 items-start">
                        <div className={`mt-0.5 p-2 rounded-xl border transition-colors ${
                          formData.modificoEstrategiaUltreon 
                            ? 'bg-[#0071E3] border-[#0071E3] text-white' 
                            : 'bg-[#F5F5F7] border-[#E2E2E7] text-[#8E8E93]'
                        }`}>
                          <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                        </div>
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-[#1C1C1E]">¿Modificó ULTREON la estrategia definitiva?</h4>
                          <p className="text-xs text-[#8E8E93] leading-relaxed">
                            Marque si los hallazgos de co-registro óptico cambiaron la preparación del vaso, la zona de anclaje o la longitud del stent planeada.
                          </p>
                        </div>
                      </div>
                      
                      <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${
                        formData.modificoEstrategiaUltreon ? 'bg-[#0071E3]' : 'bg-[#E2E2E7]'
                      }`}>
                        <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform shadow ${
                          formData.modificoEstrategiaUltreon ? 'translate-x-5.5' : 'translate-x-0.5'
                        }`} />
                      </div>
                    </div>

                    {/* Expansión Final Slider & Warning */}
                    <div className="flex flex-col gap-2 p-5 rounded-2xl bg-[#FAF9F6] border border-[#E2E2E7] mt-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-[#1D1D1F] tracking-wide" htmlFor="expansionFinal">
                          Expansión Final del Stent (%)
                        </label>
                        <span className="font-mono text-base font-bold text-[#0071E3] bg-[#0071E3]/5 px-2.5 py-0.5 rounded border border-[#0071E3]/10">
                          {formData.expansionFinal}%
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 py-2">
                        <span className="text-[10px] font-bold text-[#8E8E93] font-mono">50%</span>
                        <input
                          type="range"
                          id="expansionFinal"
                          value={formData.expansionFinal}
                          onChange={(e) => handleInputChange('expansionFinal', parseInt(e.target.value, 10))}
                          min="50"
                          max="120"
                          step="1"
                          className="w-full h-1.5 bg-[#E2E2E7] rounded-lg appearance-none cursor-pointer accent-[#0071E3]"
                        />
                        <span className="text-[10px] font-bold text-[#8E8E93] font-mono">120%</span>
                      </div>

                      {/* Conditional clinical guidelines notification */}
                      <div className={`p-3 rounded-xl border text-xs leading-relaxed transition-all duration-300 font-medium ${
                        getExpansionWarning(formData.expansionFinal).color
                      }`}>
                        {getExpansionWarning(formData.expansionFinal).text}
                      </div>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* Form Actions Footer */}
            <div className="flex items-center justify-between pt-6 border-t border-[#F2F2F7] mt-8 bg-white">
              
              {/* Left action button (Atrás) */}
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-5 py-3 rounded-2xl border border-[#E2E2E7] hover:bg-[#F5F5F7] text-xs font-bold text-[#8E8E93] hover:text-[#1C1C1E] transition-all flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Atrás
                </button>
              ) : (
                <div /> // Spacer
              )}

              {/* Right action button (Siguiente / Guardar) */}
              {step < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-3 rounded-2xl bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  Continuar
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  className="px-6 py-3 rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-[#0071E3]/15"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Guardar en Registro
                </button>
              )}

            </div>
          </form>
        )}

      </div>
    </div>
  );
}
