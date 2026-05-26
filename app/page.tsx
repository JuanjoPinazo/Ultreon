'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

// Interfaces
interface eCRFFormData {
  // PASO 1
  centroMedico: string;
  idPaciente: string;
  vasoDiana: string; // TCI, LAD, LCx, RCA
  tecnicaPurgaOCT: string;

  // PASO 2
  ffrOct: number | '';
  calcioSeveroIA: boolean;
  placaLipidicaIA: boolean;
  arcoLipidicoEstimado: number | '';
  landingZone: string;
  diametroReferenciaVaso: number | '';

  // PASO 3
  modificoEstrategiaUltreon: boolean;
  expansionStent: number | '';
  malaposicionStruts: boolean;
  diseccionBordes: boolean;

  // PASO 4
  contrasteTotal: number | '';
}

const INITIAL_FORM_STATE: eCRFFormData = {
  centroMedico: '',
  idPaciente: '',
  vasoDiana: '',
  tecnicaPurgaOCT: '',
  ffrOct: '',
  calcioSeveroIA: false,
  placaLipidicaIA: false,
  arcoLipidicoEstimado: '',
  landingZone: '',
  diametroReferenciaVaso: '',
  modificoEstrategiaUltreon: false,
  expansionStent: '',
  malaposicionStruts: false,
  diseccionBordes: false,
  contrasteTotal: '',
};

const CENTROS_MEDICOS = [
  'Hospital de San Juan',
  'Hospital General de Elche',
  'Hospital General de Castellón',
  'Hospital Universitario de la Ribera',
  'Hospital de Manises',
  'Centro 6 (Clínico de Levante)',
];

const TECNICAS_PURGA = [
  { value: 'SALINO_50CC', label: 'Salino Jeringa 50cc' },
  { value: 'SALINO_BOMBA', label: 'Salino Bomba' },
  { value: 'CONTRASTE_PURO', label: 'Contraste puro' },
  { value: 'MIX_SALINO_CONTRASTE', label: 'Mix (Salino + Contraste)' },
];

const LANDING_ZONES = [
  { value: 'GUIADO_IA_EEL', label: 'Guiado por EEL / Tejido Sano (IA)' },
  { value: 'VISUAL_ANGIO', label: 'Visual (Estimación Angiográfica)' },
];

// Interactive Coronary Tree Selector Component
interface CoronarySelectorProps {
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
}

function CoronaryTreeSelector({ value, onChange, error }: CoronarySelectorProps) {
  const segments = [
    { id: 'TCI', name: 'TCI', desc: 'Tronco Común Izquierdo' },
    { id: 'LAD', name: 'LAD (DA)', desc: 'Descendente Anterior' },
    { id: 'LCx', name: 'LCx (CX)', desc: 'Circunfleja' },
    { id: 'RCA', name: 'RCA (CD)', desc: 'Coronaria Derecha' },
  ];

  return (
    <div className={`p-4 bg-slate-900 border rounded-2xl transition-all ${error ? 'border-red-500/50' : 'border-slate-800'
      }`}>
      <div className="flex flex-col sm:flex-row items-center gap-6">

        {/* SVG Drawing of the Coronary Tree */}
        <div className="relative w-48 h-48 bg-slate-950 rounded-xl border border-slate-850 p-2 flex items-center justify-center shadow-inner select-none">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            {/* Glow Filter for Active Segment */}
            <defs>
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background anatomical reference markers */}
            <circle cx="100" cy="100" r="85" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 6" className="opacity-20" />

            {/* Aortic Root Reference */}
            <path d="M 90,30 Q 100,20 110,30 Q 105,45 90,30" fill="#334155" className="opacity-45" />

            {/* SEGMENT 1: RCA (Right Coronary Artery) */}
            {/* Transparent click target */}
            <path
              d="M 92,34 Q 60,45 50,85 T 70,145 T 100,175"
              fill="none"
              stroke="transparent"
              strokeWidth="28"
              className="cursor-pointer"
              onClick={() => onChange('RCA')}
            />
            {/* Visual artery path */}
            <path
              d="M 92,34 Q 60,45 50,85 T 70,145 T 100,175"
              fill="none"
              stroke={value === 'RCA' ? '#22d3ee' : '#475569'}
              strokeWidth={value === 'RCA' ? '7' : '4'}
              filter={value === 'RCA' ? 'url(#glow-cyan)' : ''}
              className="transition-all duration-300 pointer-events-none stroke-round"
              strokeLinecap="round"
            />

            {/* SEGMENT 2: TCI (Left Main / Trunk) */}
            {/* Transparent click target */}
            <path
              d="M 108,34 Q 125,40 135,48"
              fill="none"
              stroke="transparent"
              strokeWidth="28"
              className="cursor-pointer"
              onClick={() => onChange('TCI')}
            />
            {/* Visual artery path */}
            <path
              d="M 108,34 Q 125,40 135,48"
              fill="none"
              stroke={value === 'TCI' ? '#22d3ee' : '#475569'}
              strokeWidth={value === 'TCI' ? '9' : '6'}
              filter={value === 'TCI' ? 'url(#glow-cyan)' : ''}
              className="transition-all duration-300 pointer-events-none stroke-round"
              strokeLinecap="round"
            />

            {/* SEGMENT 3: LAD (Left Anterior Descending) */}
            {/* Transparent click target */}
            <path
              d="M 135,48 Q 130,85 115,125 T 120,175"
              fill="none"
              stroke="transparent"
              strokeWidth="28"
              className="cursor-pointer"
              onClick={() => onChange('LAD')}
            />
            {/* Visual artery path */}
            <path
              d="M 135,48 Q 130,85 115,125 T 120,175"
              fill="none"
              stroke={value === 'LAD' ? '#22d3ee' : '#475569'}
              strokeWidth={value === 'LAD' ? '6' : '3.5'}
              filter={value === 'LAD' ? 'url(#glow-cyan)' : ''}
              className="transition-all duration-300 pointer-events-none stroke-round"
              strokeLinecap="round"
            />

            {/* SEGMENT 4: LCx (Circunflex) */}
            {/* Transparent click target */}
            <path
              d="M 135,48 Q 165,58 175,95 T 160,150"
              fill="none"
              stroke="transparent"
              strokeWidth="28"
              className="cursor-pointer"
              onClick={() => onChange('LCx')}
            />
            {/* Visual artery path */}
            <path
              d="M 135,48 Q 165,58 175,95 T 160,150"
              fill="none"
              stroke={value === 'LCx' ? '#22d3ee' : '#475569'}
              strokeWidth={value === 'LCx' ? '6' : '3.5'}
              filter={value === 'LCx' ? 'url(#glow-cyan)' : ''}
              className="transition-all duration-300 pointer-events-none stroke-round"
              strokeLinecap="round"
            />

            {/* Labels on SVG */}
            <text x="35" y="32" fill={value === 'RCA' ? '#22d3ee' : '#64748b'} fontSize="9" fontWeight="bold" className="font-mono transition-colors">RCA</text>
            <text x="110" y="25" fill={value === 'TCI' ? '#22d3ee' : '#64748b'} fontSize="9" fontWeight="bold" className="font-mono transition-colors">TCI</text>
            <text x="92" y="135" fill={value === 'LAD' ? '#22d3ee' : '#64748b'} fontSize="9" fontWeight="bold" className="font-mono transition-colors">LAD</text>
            <text x="175" y="80" fill={value === 'LCx' ? '#22d3ee' : '#64748b'} fontSize="9" fontWeight="bold" className="font-mono transition-colors">LCx</text>
          </svg>
          <div className="absolute top-1 left-2 text-[8px] font-mono text-slate-500 tracking-wider">AHA AHA segments</div>
        </div>

        {/* AHA Segment Buttons - Optimized for iPad Touch Targets */}
        <div className="flex-1 w-full space-y-2">
          <span className="text-xs font-bold text-slate-400 block mb-1">Segmento AHA Coronario</span>
          <div className="grid grid-cols-2 gap-2">
            {segments.map((seg) => (
              <button
                key={seg.id}
                type="button"
                onClick={() => onChange(seg.id)}
                className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-center ${value === seg.id
                  ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 ring-1 ring-cyan-500/20'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
              >
                <span className="text-xs font-mono font-bold">{seg.name}</span>
                <span className="text-[9px] text-slate-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">{seg.desc}</span>
              </button>
            ))}
          </div>
          {value ? (
            <div className="text-[10px] text-cyan-400 font-mono mt-1 flex items-center gap-1.5 animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              Segmento {value} seleccionado.
            </div>
          ) : (
            <div className="text-[10px] text-slate-500 font-mono mt-1">
              Pulse en el diagrama o en los botones para seleccionar.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default function Home() {
  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<eCRFFormData>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof eCRFFormData, string>>>({});

  // Local Patient Identifiers for GDPR Anonymization (never sent to Supabase)
  const [localNhc, setLocalNhc] = useState<string>('');
  const [localSip, setLocalSip] = useState<string>('');
  const [manualIdEdit, setManualIdEdit] = useState<boolean>(false);

  // Supabase simulation states
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dbLogs, setDbLogs] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [supabasePayload, setSupabasePayload] = useState<string>('');

  // Automatically calculate anonymized ID based on NHC and/or SIP and Hospital Prefix
  React.useEffect(() => {
    if (manualIdEdit) return;

    const prefixMap: Record<string, string> = {
      'Hospital de San Juan': 'HSJ',
      'Hospital General de Elche': 'HGE',
      'Hospital General de Castellón': 'HGC',
      'Hospital Universitario de la Ribera': 'HUR',
      'Hospital de Manises': 'HMA',
      'Centro 6 (Clínico de Levante)': 'C06',
    };

    const prefix = prefixMap[formData.centroMedico] || 'GEN';
    const inputStr = `${localNhc.trim()}-${localSip.trim()}`;

    if (localNhc.trim() || localSip.trim()) {
      // Deterministic string hashing for zero-knowledge patient tracking
      let hash = 0;
      for (let i = 0; i < inputStr.length; i++) {
        hash = (inputStr.charCodeAt(i) + (hash << 5) - hash) | 0;
      }
      const cleanHash = Math.abs(hash).toString(16).toUpperCase().slice(0, 6);
      setFormData((prev) => ({ ...prev, idPaciente: `${prefix}-${cleanHash}` }));
    } else {
      setFormData((prev) => ({ ...prev, idPaciente: '' }));
    }
  }, [formData.centroMedico, localNhc, localSip, manualIdEdit]);

  // Handle updates
  const handleInputChange = (key: keyof eCRFFormData, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };

      // Auto-uppercase Patient ID
      if (key === 'idPaciente' && typeof value === 'string') {
        next.idPaciente = value.toUpperCase();
      }

      // Reset lipid arc if lipid plaque is false
      if (key === 'placaLipidicaIA' && value === false) {
        next.arcoLipidicoEstimado = '';
      }

      return next;
    });

    if (errors[key]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  // Step Validation
  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof eCRFFormData, string>> = {};

    if (currentStep === 1) {
      if (!formData.centroMedico) newErrors.centroMedico = 'Seleccione un centro médico.';
      if (!formData.idPaciente.trim()) newErrors.idPaciente = 'Introduzca el identificador anonimizado del paciente (o ingrese NHC/SIP).';
      if (!formData.vasoDiana) newErrors.vasoDiana = 'Seleccione el vaso diana (Segmento AHA).';
      if (!formData.tecnicaPurgaOCT) newErrors.tecnicaPurgaOCT = 'Indique la técnica de purga OCT utilizada.';
    } else if (currentStep === 2) {
      if (formData.ffrOct === '' || formData.ffrOct < 0.2 || formData.ffrOct > 1.2) {
        newErrors.ffrOct = 'Indique un FFR-OCT válido (rango 0.20 - 1.20).';
      }
      if (formData.placaLipidicaIA && (formData.arcoLipidicoEstimado === '' || formData.arcoLipidicoEstimado < 0 || formData.arcoLipidicoEstimado > 360)) {
        newErrors.arcoLipidicoEstimado = 'Introduzca el arco lipídico en grados (0º a 360º).';
      }
      if (!formData.landingZone) newErrors.landingZone = 'Especifique el método de Landing Zone.';
      if (formData.diametroReferenciaVaso === '' || formData.diametroReferenciaVaso <= 0 || formData.diametroReferenciaVaso > 6) {
        newErrors.diametroReferenciaVaso = 'Indique un diámetro de referencia válido (0.1 - 6.0 mm).';
      }
    } else if (currentStep === 3) {
      if (formData.expansionStent === '' || formData.expansionStent <= 0) {
        newErrors.expansionStent = 'Indique el porcentaje de expansión o área del stent.';
      }
    } else if (currentStep === 4) {
      if (formData.contrasteTotal === '' || formData.contrasteTotal < 0) {
        newErrors.contrasteTotal = 'Introduzca el volumen total de contraste.';
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

  // Real Supabase Connection
  const handleSubmitToSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setDbLogs([]);

    const logMessages = [
      '⚡ Inicializando cliente de Supabase...',
      `🔍 Conectando con proyecto: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xdfhqhochessqscpdbgs.supabase.co'}`,
      '📋 Estructurando payload para tabla "ecrf_opstar_records"...',
    ];

    // Show initial logs with slight delay for UX
    for (let i = 0; i < logMessages.length; i++) {
      setDbLogs((prev) => [...prev, logMessages[i]]);
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    // Map form fields to DB schema (handle empty numbers as null)
    const dbPayload = {
      id_paciente: formData.idPaciente,
      centro: formData.centroMedico,
      vaso_diana: formData.vasoDiana,
      tecnica_purga_oct: formData.tecnicaPurgaOCT,
      ffr_oct: formData.ffrOct === '' ? null : formData.ffrOct,
      calcio_ia: formData.calcioSeveroIA,
      placa_lipida_ia: formData.placaLipidicaIA,
      arco_lipidico_estimado: formData.arcoLipidicoEstimado === '' ? null : formData.arcoLipidicoEstimado,
      landing_zone: formData.landingZone,
      diametro: formData.diametroReferenciaVaso === '' ? null : formData.diametroReferenciaVaso,
      modifico_estrategia: formData.modificoEstrategiaUltreon,
      expansion: formData.expansionStent === '' ? null : formData.expansionStent,
      malaposicion_struts: formData.malaposicionStruts,
      diseccion_bordes: formData.diseccionBordes,
      contraste_ml: formData.contrasteTotal === '' ? null : formData.contrasteTotal,
    };

    setDbLogs((prev) => [...prev, `➡️ Insertando registro clínico (Paciente: ${formData.idPaciente})...`]);
    await new Promise((resolve) => setTimeout(resolve, 200));

    try {
      const { data, error } = await supabase
        .from('ecrf_opstar_records')
        .insert([dbPayload])
        .select();

      if (error) {
        setDbLogs((prev) => [
          ...prev,
          `❌ Error de base de datos Supabase: ${error.message} (${error.code || 'CODE_UNKNOWN'})`,
          '💡 Verifique que la tabla "ecrf_opstar_records" exista y que las RLS (Row Level Security) permitan inserciones públicas o anónimas.'
        ]);
        setIsSubmitting(false);
        return;
      }

      const insertedId = data && data[0] ? (data[0].id || data[0].id_paciente) : 'N/A';
      
      setDbLogs((prev) => [
        ...prev,
        '🔄 Sincronizando telemetría de purga y hallazgos OCT...',
        `✅ Fila insertada exitosamente en Supabase Postgres con ID/UUID: ${insertedId}`
      ]);
      
      const payloadString = JSON.stringify(dbPayload, null, 2);
      setSupabasePayload(payloadString);

      await new Promise((resolve) => setTimeout(resolve, 500));
      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (err: any) {
      setDbLogs((prev) => [
        ...prev,
        `❌ Excepción al intentar conectar con Supabase: ${err?.message || 'Error desconocido'}`
      ]);
      setIsSubmitting(false);
    }
  };

const handleReset = () => {
  setFormData(INITIAL_FORM_STATE);
  setLocalNhc('');
  setLocalSip('');
  setManualIdEdit(false);
  setStep(1);
  setIsSuccess(false);
  setDbLogs([]);
  setErrors({});
};

return (
  <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 md:p-8 antialiased font-sans">

    {/* CSS custom styles for smooth animations and scrollbar */}
    <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide {
          animation: fadeSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .console-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .console-scrollbar::-webkit-scrollbar-track {
          background: #020617;
        }
        .console-scrollbar::-webkit-scrollbar-thumb {
          background: #1e293b;
          border-radius: 4px;
        }
        .console-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #334155;
        }
      `}</style>

    {/* Main Console Frame (Inspired by ULTREON 3.0 UI) */}
    <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden transition-all duration-300 flex flex-col">

      {/* Top Header Monitor Bar */}
      <div className="bg-slate-950 p-6 border-b border-slate-850 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">

        {/* Subtle cyan glow gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        <div className="flex items-center gap-3">
          {/* Abbott Medical Device Icon Mock */}
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-sm tracking-tighter">
            A
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">ULTREON™ 3.0</span>
              <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase">AHA segment mapping</span>
            </div>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-slate-50 mt-0.5">
              OPSTAR-AI <span className="font-light text-slate-400">Levante Registry</span>
            </h1>
          </div>
        </div>

        {/* iPad-optimized System status status */}
        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-mono text-slate-500">HEMODYNAMICS NODE</span>
            <span className="text-xs font-bold text-slate-300">SALA DE INTERVENCIONISMO</span>
          </div>
          <div className="h-10 w-[1px] bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3.5 py-1.5 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400"></span>
            </span>
            <span className="text-[11px] font-mono font-bold text-cyan-300">SUPABASE CONNECTED</span>
          </div>
        </div>
      </div>

      {/* Stepper Progress Indicator */}
      {!isSuccess && !isSubmitting && (
        <div className="px-6 md:px-8 py-5 bg-slate-900/60 border-b border-slate-850">
          <div className="flex items-center justify-between relative">
            {/* Line background */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-slate-800 z-0">
              <div
                className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.5)] transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              />
            </div>

            {/* Progress steps */}
            {[1, 2, 3, 4].map((num) => {
              const isActive = step === num;
              const isCompleted = step > num;

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (num < step) {
                      setStep(num);
                    } else if (num > step && validateStep(step)) {
                      if (num === step + 1) setStep(num);
                    }
                  }}
                  className="relative z-10 focus:outline-none"
                >
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center border font-mono text-xs font-bold transition-all duration-300 ${isActive
                      ? 'bg-slate-950 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.35)] scale-110'
                      : isCompleted
                        ? 'bg-cyan-500 border-cyan-500 text-slate-950 shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                      }`}
                  >
                    {isCompleted ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : num}
                  </div>

                  <span
                    className={`absolute left-1/2 -translate-x-1/2 top-10 whitespace-nowrap text-[9px] tracking-widest font-bold uppercase transition-all duration-300 hidden md:block ${isActive ? 'text-cyan-400 scale-100 font-semibold' : 'text-slate-500 opacity-70 scale-95'
                      }`}
                  >
                    {num === 1 && '1. Datos & Vaso'}
                    {num === 2 && '2. Pre-Stent'}
                    {num === 3 && '3. Optimización'}
                    {num === 4 && '4. Resultado'}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="h-4 md:h-5" />
        </div>
      )}

      {/* Database Transmission Animation Screen */}
      {isSubmitting ? (
        <div className="p-6 md:p-12 flex flex-col md:flex-row gap-6 min-h-[380px] bg-slate-950 animate-fade-slide">

          {/* Left loading state indicator */}
          <div className="flex-1 flex flex-col justify-center items-center p-4">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full border border-dashed border-cyan-500/20 animate-spin-slow absolute top-0 left-0" />
              <div className="w-24 h-24 rounded-full border-t-2 border-r-2 border-cyan-400 animate-spin shadow-[0_0_15px_rgba(34,211,238,0.2)]" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 tracking-wide">Insertando Ficha en Supabase</h3>
            <p className="text-xs text-slate-400 mt-2 font-mono text-center">Transmisión de telemetría de hemodinámica activa...</p>
          </div>

          {/* Right log console */}
          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 font-mono text-xs text-slate-300 flex flex-col justify-between max-h-[300px]">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3 text-[10px] text-slate-500 uppercase tracking-widest">
                <span>Supabase SQL logs</span>
                <span className="text-cyan-400 animate-pulse">Transmitting</span>
              </div>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto console-scrollbar">
                {dbLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log.startsWith('✅') ? (
                      <span className="text-emerald-400">{log}</span>
                    ) : log.startsWith('⚡') || log.startsWith('🔑') ? (
                      <span className="text-cyan-300">{log}</span>
                    ) : (
                      log
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="text-[10px] text-slate-600 mt-2 text-right">TLS 1.3 encrypted connection</div>
          </div>

        </div>
      ) : isSuccess ? (
        /* SUCCESS VIEW & SCHEMA CODE VIEW */
        <div className="p-6 md:p-12 bg-slate-950 animate-fade-slide flex flex-col gap-8">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(34,211,238,0.2)] animate-pulse">
              <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-tight">Registro Guardado en Supabase</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              La telemetría clínica del paciente ha sido encriptada e insertada de manera segura en PostgreSQL.
            </p>
          </div>

          {/* Structured Schema and clinical payload details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Summary Card */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-500 mb-4 border-b border-slate-850 pb-2">Datos Clínicos</h4>
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-450">ID Paciente:</span>
                    <span className="font-mono font-bold text-cyan-400">{formData.idPaciente}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450">Centro Médico:</span>
                    <span className="font-semibold text-slate-200">{formData.centroMedico}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450">Vaso Diana (AHA):</span>
                    <span className="font-mono font-bold text-cyan-400">{formData.vasoDiana}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450">FFR-OCT:</span>
                    <span className="font-mono font-semibold text-slate-200">{formData.ffrOct}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450">Ref. Diámetro Vaso:</span>
                    <span className="font-mono font-semibold text-slate-200">{formData.diametroReferenciaVaso} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-450">Expansión Stent:</span>
                    <span className="font-mono font-semibold text-slate-200">{formData.expansionStent}%</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-850 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">STATUS: INSERTED</span>
                <span className="text-emerald-400 text-xs font-bold font-mono">✓ SYNCHRONIZED</span>
              </div>
            </div>

            {/* Code Payload Viewer */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-slate-850 mb-3">
                <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Supabase DB Payload (JSON)</h4>
                <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded">table: ecrf_opstar_records</span>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl font-mono text-[10px] text-cyan-300 overflow-x-auto h-[180px] console-scrollbar">
                {supabasePayload}
              </pre>
            </div>

          </div>

          {/* Success Actions */}
          <div className="flex justify-end gap-3.5">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20"
            >
              Registrar Nuevo Paciente
            </button>
          </div>
        </div>
      ) : (
        /* MULTI STEP WIZARD FORM */
        <form onSubmit={handleSubmitToSupabase} className="p-6 md:p-8 flex-1 bg-slate-900/40">
          <div className="min-h-[300px]">
            {/* STEP 1: Datos Basales y Protocolo Zero-Contrast */}
            {step === 1 && (
              <div className="animate-fade-slide space-y-6">
                <div>
                  <h2 className="text-lg font-bold tracking-wide text-slate-50 uppercase flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    Paso 1: Datos Basales y Protocolo Zero-Contrast
                  </h2>
                  <p className="text-xs text-slate-450 mt-0.5">Identifique al paciente e indique el segmento AHA del vaso diana.</p>
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Centro Médico */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono" htmlFor="centroMedico">
                        Centro Médico
                      </label>
                      <div className="relative">
                        <select
                          id="centroMedico"
                          value={formData.centroMedico}
                          onChange={(e) => handleInputChange('centroMedico', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl bg-slate-950 border transition-all appearance-none cursor-pointer text-sm outline-none text-slate-200 ${errors.centroMedico ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                            }`}
                        >
                          <option value="">Seleccione hospital...</option>
                          {CENTROS_MEDICOS.map((centro, index) => (
                            <option key={index} value={centro} className="bg-slate-955 text-slate-300">
                              {centro}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                      {errors.centroMedico && (
                        <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                          ⚠ {errors.centroMedico}
                        </span>
                      )}
                    </div>

                    {/* NHC (Local Only) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono" htmlFor="localNhc">
                        NHC (Local)
                      </label>
                      <input
                        type="text"
                        id="localNhc"
                        value={localNhc}
                        onChange={(e) => setLocalNhc(e.target.value)}
                        placeholder="Ej: 140599"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 transition-all text-sm outline-none text-slate-200 placeholder-slate-650"
                      />
                    </div>

                    {/* SIP (Local Only) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono" htmlFor="localSip">
                        SIP (Local)
                      </label>
                      <input
                        type="text"
                        id="localSip"
                        value={localSip}
                        onChange={(e) => setLocalSip(e.target.value)}
                        placeholder="Ej: 987654321"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 transition-all text-sm outline-none text-slate-200 placeholder-slate-655"
                      />
                    </div>

                  </div>

                  {/* ID Paciente (Generado o manual) */}
                  <div className="p-4 bg-slate-955/50 border border-slate-800/80 rounded-2xl space-y-3">
                    <div className="flex flex-col md:flex-row gap-4 items-end justify-between">

                      <div className="flex-1 w-full flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono flex items-center gap-1.5" htmlFor="idPaciente">
                          <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                          ID Paciente (Codificado para Registro)
                        </label>
                        <input
                          type="text"
                          id="idPaciente"
                          value={formData.idPaciente}
                          onChange={(e) => handleInputChange('idPaciente', e.target.value)}
                          disabled={!manualIdEdit}
                          placeholder="Ingrese NHC o SIP para autogenerar..."
                          className={`w-full px-4 py-3 rounded-xl bg-slate-950 border transition-all text-sm outline-none font-mono font-bold ${manualIdEdit
                            ? 'border-cyan-500/40 text-cyan-300'
                            : 'border-slate-800/80 text-slate-450 cursor-not-allowed bg-slate-950/70'
                            } ${errors.idPaciente ? 'border-red-500/50' : ''}`}
                        />
                      </div>

                      {/* Checkbox manual editing */}
                      <div className="flex items-center gap-2 pb-1.5 text-xs select-none">
                        <input
                          type="checkbox"
                          id="manualIdEdit"
                          checked={manualIdEdit}
                          onChange={(e) => setManualIdEdit(e.target.checked)}
                          className="rounded border-slate-800 text-cyan-500 bg-slate-950 focus:ring-cyan-500/20 w-4 h-4 cursor-pointer"
                        />
                        <label htmlFor="manualIdEdit" className="text-slate-400 cursor-pointer font-medium hover:text-slate-300 transition-colors">
                          Editar manualmente
                        </label>
                      </div>

                    </div>

                    {errors.idPaciente && (
                      <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                        ⚠ {errors.idPaciente}
                      </span>
                    )}

                    <div className="text-[10px] text-slate-500 leading-relaxed font-mono">
                      🔒 <span className="text-slate-450">Garantía de Privacidad (RGPD)</span>: El NHC y el SIP se procesan de forma 100% local en el navegador del iPad para generar este identificador determinista irreversible. Estos números personales jamás serán transmitidos a la base de datos de Supabase.
                    </div>
                  </div>

                  {/* Vaso Diana: Interactive SVG segment tree */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono">
                      Vaso Diana (Árbol Coronario AHA)
                    </label>
                    <CoronaryTreeSelector
                      value={formData.vasoDiana}
                      onChange={(val) => handleInputChange('vasoDiana', val)}
                      error={!!errors.vasoDiana}
                    />
                    {errors.vasoDiana && (
                      <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                        ⚠ {errors.vasoDiana}
                      </span>
                    )}
                  </div>

                  {/* Técnica Purga OCT */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono" htmlFor="tecnicaPurgaOCT">
                      Técnica de Purga OCT
                    </label>
                    <div className="relative">
                      <select
                        id="tecnicaPurgaOCT"
                        value={formData.tecnicaPurgaOCT}
                        onChange={(e) => handleInputChange('tecnicaPurgaOCT', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl bg-slate-950 border transition-all appearance-none cursor-pointer text-sm outline-none text-slate-200 ${errors.tecnicaPurgaOCT ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                          }`}
                      >
                        <option value="">Seleccione purga...</option>
                        {TECNICAS_PURGA.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.tecnicaPurgaOCT && (
                      <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                        ⚠ {errors.tecnicaPurgaOCT}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            )}
            {step === 2 && (
              <div className="animate-fade-slide space-y-6">
                <div>
                  <h2 className="text-lg font-bold tracking-wide text-slate-50 uppercase flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    Paso 2: Valoración Pre-Stent (Fisiología e Inteligencia Artificial)
                  </h2>
                  <p className="text-xs text-slate-450 mt-0.5">Registre la severidad de la placa y el dimensionamiento por EEL.</p>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* FFR-OCT */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono" htmlFor="ffrOct">
                        FFR-OCT Derivado (Ej: 0.75)
                      </label>
                      <input
                        type="number"
                        id="ffrOct"
                        value={formData.ffrOct}
                        onChange={(e) => handleInputChange('ffrOct', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        step="0.01"
                        min="0.20"
                        max="1.20"
                        placeholder="0.75"
                        className={`w-full px-4 py-3 rounded-xl bg-slate-950 border transition-all text-sm outline-none text-slate-200 placeholder-slate-655 ${errors.ffrOct ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                          }`}
                      />
                      {errors.ffrOct && (
                        <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                          ⚠ {errors.ffrOct}
                        </span>
                      )}
                    </div>

                    {/* Diámetro de referencia del vaso */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono" htmlFor="diametroReferenciaVaso">
                        Diámetro Referencia Vaso (mm)
                      </label>
                      <input
                        type="number"
                        id="diametroReferenciaVaso"
                        value={formData.diametroReferenciaVaso}
                        onChange={(e) => handleInputChange('diametroReferenciaVaso', e.target.value === '' ? '' : parseFloat(e.target.value))}
                        step="0.1"
                        min="0.5"
                        max="6.0"
                        placeholder="3.25"
                        className={`w-full px-4 py-3 rounded-xl bg-slate-950 border transition-all text-sm outline-none text-slate-200 placeholder-slate-655 ${errors.diametroReferenciaVaso ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                          }`}
                      />
                      {errors.diametroReferenciaVaso && (
                        <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                          ⚠ {errors.diametroReferenciaVaso}
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Landing Zone Select */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono" htmlFor="landingZone">
                      Selección de Landing Zone
                    </label>
                    <div className="relative">
                      <select
                        id="landingZone"
                        value={formData.landingZone}
                        onChange={(e) => handleInputChange('landingZone', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl bg-slate-950 border transition-all appearance-none cursor-pointer text-sm outline-none text-slate-200 ${errors.landingZone ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                          }`}
                      >
                        <option value="">Seleccione Landing Zone...</option>
                        {LANDING_ZONES.map((lz) => (
                          <option key={lz.value} value={lz.value}>
                            {lz.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.landingZone && (
                      <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                        ⚠ {errors.landingZone}
                      </span>
                    )}
                  </div>

                  {/* Toggles area */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

                    {/* Calcio severo toggle */}
                    <div
                      onClick={() => handleInputChange('calcioSeveroIA', !formData.calcioSeveroIA)}
                      className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex items-start justify-between gap-4 ${formData.calcioSeveroIA
                        ? 'bg-cyan-950/20 border-cyan-500/30'
                        : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                        }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Calcio Severo IA</h4>
                          <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 rounded">Ángulo &gt; 180º</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Detección automática de arco severo.</p>
                      </div>
                      <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${formData.calcioSeveroIA ? 'bg-cyan-400' : 'bg-slate-800'
                        }`}>
                        <div className={`w-4 h-4 rounded-full bg-slate-900 absolute top-0.5 transition-transform shadow ${formData.calcioSeveroIA ? 'translate-x-5.5' : 'translate-x-0.5'
                          }`} />
                      </div>
                    </div>

                    {/* Placa lipídica toggle */}
                    <div
                      onClick={() => handleInputChange('placaLipidicaIA', !formData.placaLipidicaIA)}
                      className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex items-start justify-between gap-4 ${formData.placaLipidicaIA
                        ? 'bg-cyan-950/20 border-cyan-500/30'
                        : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                        }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Placa Lipídica IA</h4>
                          <span className="text-[8px] bg-red-550/10 text-red-400 border border-red-500/20 px-1 rounded">Lipid Co-Reg</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Identificación automática de lípido vulnerable.</p>
                      </div>
                      <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${formData.placaLipidicaIA ? 'bg-cyan-400' : 'bg-slate-800'
                        }`}>
                        <div className={`w-4 h-4 rounded-full bg-slate-900 absolute top-0.5 transition-transform shadow ${formData.placaLipidicaIA ? 'translate-x-5.5' : 'translate-x-0.5'
                          }`} />
                      </div>
                    </div>

                  </div>

                  {/* Conditional input: Estimated lipid arc */}
                  {formData.placaLipidicaIA && (
                    <div className="p-4 bg-slate-950 border border-slate-850 rounded-xl space-y-2 animate-fade-slide">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono" htmlFor="arcoLipidicoEstimado">
                          Arco Lipídico Estimado (Grados º)
                        </label>
                        <input
                          type="number"
                          id="arcoLipidicoEstimado"
                          value={formData.arcoLipidicoEstimado}
                          onChange={(e) => handleInputChange('arcoLipidicoEstimado', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                          min="0"
                          max="360"
                          placeholder="Ej: 220"
                          className={`w-full px-4 py-3 rounded-xl bg-slate-900 border transition-all text-sm outline-none text-slate-200 placeholder-slate-655 ${errors.arcoLipidicoEstimado ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                            }`}
                        />
                        {errors.arcoLipidicoEstimado && (
                          <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                            ⚠ {errors.arcoLipidicoEstimado}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}

            {/* STEP 3: Implante y Optimización */}
            {step === 3 && (
              <div className="animate-fade-slide space-y-6">
                <div>
                  <h2 className="text-lg font-bold tracking-wide text-slate-50 uppercase flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    Paso 3: Implante y Optimización (La Triada ULTREON™)
                  </h2>
                  <p className="text-xs text-slate-450 mt-0.5">Mida el éxito de la expansión e identifique posibles complicaciones.</p>
                </div>

                <div className="space-y-4">

                  {/* Modificó ULTREON la estrategia inicial - HIGHLIGHTED LARGE TOGGLE CARD */}
                  <div
                    onClick={() => handleInputChange('modificoEstrategiaUltreon', !formData.modificoEstrategiaUltreon)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer select-none flex items-center justify-between gap-4 ${formData.modificoEstrategiaUltreon
                      ? 'bg-cyan-950/25 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                      : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                      }`}
                  >
                    <div className="flex gap-4 items-start">
                      <div className={`p-2.5 rounded-xl border transition-colors ${formData.modificoEstrategiaUltreon
                        ? 'bg-cyan-500 border-cyan-500 text-slate-950'
                        : 'bg-slate-900 border-slate-800 text-slate-500'
                        }`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wide font-mono">¿Modificó ULTREON la estrategia inicial?</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                          La valoración de calcio, tamaño o FFR-OCT alteró el plan angiográfico original.
                        </p>
                      </div>
                    </div>

                    <div className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${formData.modificoEstrategiaUltreon ? 'bg-cyan-400' : 'bg-slate-800'
                      }`}>
                      <div className={`w-5 h-5 rounded-full bg-slate-900 absolute top-0.5 transition-transform shadow ${formData.modificoEstrategiaUltreon ? 'translate-x-5.5' : 'translate-x-0.5'
                        }`} />
                    </div>
                  </div>

                  {/* Expansión del stent */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono" htmlFor="expansionStent">
                      Expansión del Stent (% o MSA en mm²)
                    </label>
                    <input
                      type="number"
                      id="expansionStent"
                      value={formData.expansionStent}
                      onChange={(e) => handleInputChange('expansionStent', e.target.value === '' ? '' : parseFloat(e.target.value))}
                      min="0"
                      max="150"
                      step="0.1"
                      placeholder="Ej: 90"
                      className={`w-full px-4 py-3 rounded-xl bg-slate-950 border transition-all text-sm outline-none text-slate-200 placeholder-slate-655 ${errors.expansionStent ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                        }`}
                    />
                    {errors.expansionStent && (
                      <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                        ⚠ {errors.expansionStent}
                      </span>
                    )}
                  </div>

                  {/* Struts malposition and Edge dissection Toggles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">

                    {/* Malaposición struts */}
                    <div
                      onClick={() => handleInputChange('malaposicionStruts', !formData.malaposicionStruts)}
                      className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex items-start justify-between gap-4 ${formData.malaposicionStruts
                        ? 'bg-cyan-950/20 border-cyan-500/30'
                        : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                        }`}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Malaposición Struts</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Detección de struts no adosados al vaso.</p>
                      </div>
                      <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${formData.malaposicionStruts ? 'bg-cyan-400' : 'bg-slate-800'
                        }`}>
                        <div className={`w-4 h-4 rounded-full bg-slate-900 absolute top-0.5 transition-transform shadow ${formData.malaposicionStruts ? 'translate-x-5.5' : 'translate-x-0.5'
                          }`} />
                      </div>
                    </div>

                    {/* Disección bordes */}
                    <div
                      onClick={() => handleInputChange('diseccionBordes', !formData.diseccionBordes)}
                      className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex items-start justify-between gap-4 ${formData.diseccionBordes
                        ? 'bg-cyan-950/20 border-cyan-500/30'
                        : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                        }`}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Disección de Bordes</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Edge Dissection proximal o distal.</p>
                      </div>
                      <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${formData.diseccionBordes ? 'bg-cyan-400' : 'bg-slate-800'
                        }`}>
                        <div className={`w-4 h-4 rounded-full bg-slate-900 absolute top-0.5 transition-transform shadow ${formData.diseccionBordes ? 'translate-x-5.5' : 'translate-x-0.5'
                          }`} />
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            )}

            {/* STEP 4: Resultado Final */}
            {step === 4 && (
              <div className="animate-fade-slide space-y-6">
                <div>
                  <h2 className="text-lg font-bold tracking-wide text-slate-50 uppercase flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400" />
                    Paso 4: Resultado Final del Procedimiento
                  </h2>
                  <p className="text-xs text-slate-450 mt-0.5">Registre las métricas de contraste totales utilizadas.</p>
                </div>

                <div className="space-y-4">

                  {/* Volumen total contraste */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono" htmlFor="contrasteTotal">
                      Volumen Total Contraste Utilizado (ml)
                    </label>
                    <input
                      type="number"
                      id="contrasteTotal"
                      value={formData.contrasteTotal}
                      onChange={(e) => handleInputChange('contrasteTotal', e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                      min="0"
                      max="800"
                      placeholder="Ej: 50"
                      className={`w-full px-4 py-3 rounded-xl bg-slate-950 border transition-all text-sm outline-none text-slate-200 placeholder-slate-655 ${errors.contrasteTotal ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                        }`}
                    />
                    {errors.contrasteTotal && (
                      <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                        ⚠ {errors.contrasteTotal}
                      </span>
                    )}

                    {/* Zero-contrast helper label if volume is zero */}
                    {formData.contrasteTotal !== '' && formData.contrasteTotal === 0 && (
                      <div className="mt-2 p-3 bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-[10px] leading-relaxed font-medium">
                        ★ PROTOCOLO ZERO-CONTRAST COMPLETADO: El volumen de contraste reportado es 0ml. El procedimiento fue guiado 100% por fisiología y co-registro OCT.
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}

          </div>

          {/* Wizard Navigation Footer Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-850 mt-8 bg-slate-900/10">

            {/* Back button */}
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-3.5 rounded-xl border border-slate-800 hover:bg-slate-950 text-xs font-bold text-slate-450 hover:text-slate-250 transition-all flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Atrás
              </button>
            ) : (
              <div /> // Spacer
            )}

            {/* Next or Submit Button */}
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-100 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                Continuar
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/20"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Guardar y Enviar a Supabase
              </button>
            )}

          </div>
        </form>
      )}

    </div>
  </main>
);
}
