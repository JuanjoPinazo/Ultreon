// app/registry/new/RegistryFormClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { calculateContrastReduction, calculateOpstarScore, getOpstarScoreCategory, getOpstarScoreCategoryLabel } from '@/lib/clinical';
import { saveRegistryCaseAction } from '@/lib/supabase/actions';

// Visual System Components
import ProceduralTimeline from './visuals/ProceduralTimeline';
import CoronaryVisual from './visuals/CoronaryVisual';
import { CalciumOverlayVisual, LipidArcVisual, FFROCTVisual } from './visuals/PrePciVisuals';
import { StentExpansionVisual, MalappositionVisual, EdgeDissectionVisual } from './visuals/PostPciVisuals';
import FinalResultVisual from './visuals/FinalResultVisual';

// Interfaces
interface eCRFFormData {
  centroMedico: string;
  idPaciente: string;
  vasoDiana: string; // TCI, LAD, LCx, RCA
  tecnicaPurgaOCT: string;
  ffrOct: number | '';
  calcioSeveroIA: boolean;
  placaLipidicaIA: boolean;
  arcoLipidicoEstimado: number | '';
  landingZone: string;
  diametroReferenciaVaso: number | '';
  expansionStent: number | ''; // Keep for backwards compatibility (maps to stent_expansion_percent)
  malaposicionStruts: boolean;  // Keep for backwards compatibility
  diseccionBordes: boolean;     // Keep for backwards compatibility
  contrasteTotal: number | '';  // Keep for backwards compatibility (maps to actual_contrast_ml)

  // Paso 3: Cambios de estrategia
  modificoEstrategiaUltreon: boolean;
  changeMagnitude: 'minor' | 'moderate' | 'major' | '';
  changeDescription: string;
  changedStentDiameter: boolean;
  changedStentLength: boolean;
  changedLandingZoneProximal: boolean;
  changedLandingZoneDistal: boolean;
  requiredPlaquePreparation: boolean;
  usedNcBalloon: boolean;
  usedScoringCuttingBalloon: boolean;
  usedIvl: boolean;
  usedAtherectomy: boolean;
  decidedNoStent: boolean;
  treatedEdge: boolean;
  additionalPostdilatation: boolean;
  globalStrategyChange: boolean;
  otherChange: boolean;

  // Paso 3: Triada de Optimización
  postStentMsaMm2: number | '';
  adequateExpansion: 'yes' | 'no' | 'na' | '';
  significantMalapposition: 'yes' | 'no' | 'na' | '';
  malappositionLengthMm: number | '';
  requiresMalappositionCorrection: boolean;
  proximalEdgeDissection: boolean;
  distalEdgeDissection: boolean;
  proximalDissectionLengthMm: number | '';
  distalDissectionLengthMm: number | '';
  significantFlapGt3mm: boolean;
  requiresEdgeTreatment: boolean;

  // Paso 4: Contraste
  expectedContrastMl: number | '';
  actualContrastMl: number | '';
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
  expansionStent: '',
  malaposicionStruts: false,
  diseccionBordes: false,
  contrasteTotal: '',

  // Paso 3: Cambios de estrategia
  modificoEstrategiaUltreon: false,
  changeMagnitude: '',
  changeDescription: '',
  changedStentDiameter: false,
  changedStentLength: false,
  changedLandingZoneProximal: false,
  changedLandingZoneDistal: false,
  requiredPlaquePreparation: false,
  usedNcBalloon: false,
  usedScoringCuttingBalloon: false,
  usedIvl: false,
  usedAtherectomy: false,
  decidedNoStent: false,
  treatedEdge: false,
  additionalPostdilatation: false,
  globalStrategyChange: false,
  otherChange: false,

  // Paso 3: Triada de Optimización
  postStentMsaMm2: '',
  adequateExpansion: '',
  significantMalapposition: '',
  malappositionLengthMm: '',
  requiresMalappositionCorrection: false,
  proximalEdgeDissection: false,
  distalEdgeDissection: false,
  proximalDissectionLengthMm: '',
  distalDissectionLengthMm: '',
  significantFlapGt3mm: false,
  requiresEdgeTreatment: false,

  // Paso 4: Contraste
  expectedContrastMl: '',
  actualContrastMl: '',
};

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
    <div className={`p-4 bg-slate-900 border rounded-2xl transition-all ${error ? 'border-red-500/50' : 'border-slate-800'}`}>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-48 h-48 bg-slate-950 rounded-xl border border-slate-850 p-2 flex items-center justify-center shadow-inner select-none animate-pulse-slow">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>
            <circle cx="100" cy="100" r="85" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 6" className="opacity-20" />
            <path d="M 90,30 Q 100,20 110,30 Q 105,45 90,30" fill="#334155" className="opacity-45" />

            {/* RCA */}
            <path d="M 92,34 Q 60,45 50,85 T 70,145 T 100,175" fill="none" stroke="transparent" strokeWidth="28" className="cursor-pointer" onClick={() => onChange('RCA')} />
            <path d="M 92,34 Q 60,45 50,85 T 70,145 T 100,175" fill="none" stroke={value === 'RCA' ? '#22d3ee' : '#475569'} strokeWidth={value === 'RCA' ? '7' : '4'} filter={value === 'RCA' ? 'url(#glow-cyan)' : ''} className="transition-all duration-300 pointer-events-none stroke-round" strokeLinecap="round" />

            {/* TCI */}
            <path d="M 108,34 Q 125,40 135,48" fill="none" stroke="transparent" strokeWidth="28" className="cursor-pointer" onClick={() => onChange('TCI')} />
            <path d="M 108,34 Q 125,40 135,48" fill="none" stroke={value === 'TCI' ? '#22d3ee' : '#475569'} strokeWidth={value === 'TCI' ? '9' : '6'} filter={value === 'TCI' ? 'url(#glow-cyan)' : ''} className="transition-all duration-300 pointer-events-none stroke-round" strokeLinecap="round" />

            {/* LAD */}
            <path d="M 135,48 Q 130,85 115,125 T 120,175" fill="none" stroke="transparent" strokeWidth="28" className="cursor-pointer" onClick={() => onChange('LAD')} />
            <path d="M 135,48 Q 130,85 115,125 T 120,175" fill="none" stroke={value === 'LAD' ? '#22d3ee' : '#475569'} strokeWidth={value === 'LAD' ? '6' : '3.5'} filter={value === 'LAD' ? 'url(#glow-cyan)' : ''} className="transition-all duration-300 pointer-events-none stroke-round" strokeLinecap="round" />

            {/* LCx */}
            <path d="M 135,48 Q 165,58 175,95 T 160,150" fill="none" stroke="transparent" strokeWidth="28" className="cursor-pointer" onClick={() => onChange('LCx')} />
            <path d="M 135,48 Q 165,58 175,95 T 160,150" fill="none" stroke={value === 'LCx' ? '#22d3ee' : '#475569'} strokeWidth={value === 'LCx' ? '6' : '3.5'} filter={value === 'LCx' ? 'url(#glow-cyan)' : ''} className="transition-all duration-300 pointer-events-none stroke-round" strokeLinecap="round" />

            <text x="35" y="32" fill={value === 'RCA' ? '#22d3ee' : '#64748b'} fontSize="9" fontWeight="bold" className="font-mono transition-colors">RCA</text>
            <text x="110" y="25" fill={value === 'TCI' ? '#22d3ee' : '#64748b'} fontSize="9" fontWeight="bold" className="font-mono transition-colors">TCI</text>
            <text x="92" y="135" fill={value === 'LAD' ? '#22d3ee' : '#64748b'} fontSize="9" fontWeight="bold" className="font-mono transition-colors">LAD</text>
            <text x="175" y="80" fill={value === 'LCx' ? '#22d3ee' : '#64748b'} fontSize="9" fontWeight="bold" className="font-mono transition-colors">LCx</text>
          </svg>
          <div className="absolute top-1 left-2 text-[8px] font-mono text-slate-500 tracking-wider">AHA segments</div>
        </div>

        <div className="flex-1 w-full space-y-2">
          <span className="text-xs font-bold text-slate-400 block mb-1">Segmento AHA Coronario</span>
          <div className="grid grid-cols-2 gap-2">
            {segments.map((seg) => (
              <button
                key={seg.id}
                type="button"
                onClick={() => onChange(seg.id)}
                className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-center cursor-pointer ${
                  value === seg.id
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
            <div className="text-[10px] text-cyan-400 font-mono mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
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

interface RegistryFormClientProps {
  user: any;
  profile: any;
  hospitals: any[];
}

export default function RegistryFormClient({ user, profile, hospitals }: RegistryFormClientProps) {
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<eCRFFormData>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Partial<Record<keyof eCRFFormData, string>>>({});
  
  // Local Patient Identifiers for GDPR Anonymization
  const [localNhc, setLocalNhc] = useState<string>('');
  const [localSip, setLocalSip] = useState<string>('');
  const [manualIdEdit, setManualIdEdit] = useState<boolean>(false);

  // States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dbLogs, setDbLogs] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [supabasePayload, setSupabasePayload] = useState<string>('');

  // Handle hospital locking on load for hospital_user
  useEffect(() => {
    if (profile.role === 'hospital_user' && profile.hospital_id) {
      const userHospital = hospitals.find(h => h.id === profile.hospital_id);
      if (userHospital) {
        setFormData(prev => ({ ...prev, centroMedico: userHospital.name }));
      }
    }
  }, [profile, hospitals]);

  // Autogenerate GDPR-compliant Anonymous ID
  useEffect(() => {
    if (manualIdEdit) return;

    // Build mapping prefix dynamically from hospitals list
    const prefixMap: Record<string, string> = {};
    hospitals.forEach(h => {
      prefixMap[h.name] = h.short_name || 'GEN';
    });

    const prefix = prefixMap[formData.centroMedico] || 'GEN';
    const inputStr = `${localNhc.trim()}-${localSip.trim()}`;

    if (localNhc.trim() || localSip.trim()) {
      let hash = 0;
      for (let i = 0; i < inputStr.length; i++) {
        hash = (inputStr.charCodeAt(i) + (hash << 5) - hash) | 0;
      }
      const cleanHash = Math.abs(hash).toString(16).toUpperCase().slice(0, 6);
      setFormData((prev) => ({ ...prev, idPaciente: `${prefix}-${cleanHash}` }));
    } else {
      setFormData((prev) => ({ ...prev, idPaciente: '' }));
    }
  }, [formData.centroMedico, localNhc, localSip, manualIdEdit, hospitals]);

  const handleInputChange = (key: keyof eCRFFormData, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };

      if (key === 'idPaciente' && typeof value === 'string') {
        next.idPaciente = value.toUpperCase();
      }

      if (key === 'placaLipidicaIA' && value === false) {
        next.arcoLipidicoEstimado = '';
      }

      // Sync contrasteTotal and actualContrastMl
      if (key === 'contrasteTotal') {
        next.actualContrastMl = value;
      }
      if (key === 'actualContrastMl') {
        next.contrasteTotal = value;
      }

      // Sync significantMalapposition -> malaposicionStruts
      if (key === 'significantMalapposition') {
        next.malaposicionStruts = value === 'yes';
      }

      // Sync edge dissection toggles -> diseccionBordes
      if (key === 'proximalEdgeDissection' || key === 'distalEdgeDissection') {
        next.diseccionBordes = next.proximalEdgeDissection || next.distalEdgeDissection;
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

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Partial<Record<keyof eCRFFormData, string>> = {};

    if (currentStep === 1) {
      if (!formData.centroMedico) newErrors.centroMedico = 'Seleccione un centro médico.';
      if (!formData.idPaciente.trim()) newErrors.idPaciente = 'Introduzca el identificador del paciente.';
      if (!formData.vasoDiana) newErrors.vasoDiana = 'Seleccione el vaso diana.';
      if (!formData.tecnicaPurgaOCT) newErrors.tecnicaPurgaOCT = 'Indique la técnica de purga OCT.';
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
      if (formData.expansionStent === '' || formData.expansionStent <= 0 || formData.expansionStent > 150) {
        newErrors.expansionStent = 'Indique un porcentaje de expansión válido (1 - 150%).';
      }
      if (formData.postStentMsaMm2 !== '' && (formData.postStentMsaMm2 <= 0 || formData.postStentMsaMm2 > 20)) {
        newErrors.postStentMsaMm2 = 'Indique un MSA válido (0.1 - 20.0 mm²).';
      }
      if (formData.modificoEstrategiaUltreon && !formData.changeMagnitude) {
        newErrors.changeMagnitude = 'Seleccione la magnitud del cambio de estrategia.';
      }
      if (!formData.adequateExpansion) {
        newErrors.adequateExpansion = 'Especifique si la expansión es adecuada.';
      }
      if (!formData.significantMalapposition) {
        newErrors.significantMalapposition = 'Especifique si hay malaposición significativa.';
      }
      if (formData.significantMalapposition === 'yes') {
        if (formData.malappositionLengthMm === '' || formData.malappositionLengthMm <= 0) {
          newErrors.malappositionLengthMm = 'Indique la longitud de la malaposición (mm).';
        }
      }
      if (formData.proximalEdgeDissection) {
        if (formData.proximalDissectionLengthMm === '' || formData.proximalDissectionLengthMm <= 0) {
          newErrors.proximalDissectionLengthMm = 'Indique la longitud de la disección proximal.';
        }
      }
      if (formData.distalEdgeDissection) {
        if (formData.distalDissectionLengthMm === '' || formData.distalDissectionLengthMm <= 0) {
          newErrors.distalDissectionLengthMm = 'Indique la longitud de la disección distal.';
        }
      }
    } else if (currentStep === 4) {
      if (formData.expectedContrastMl === '' || formData.expectedContrastMl < 0) {
        newErrors.expectedContrastMl = 'Introduzca el volumen esperado de contraste.';
      }
      if (formData.actualContrastMl === '' || formData.actualContrastMl < 0) {
        newErrors.actualContrastMl = 'Introduzca el volumen real de contraste utilizado.';
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

  const handleSubmitToSupabase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    setDbLogs([]);

    // Find hospital ID in our databases
    const selectedHospitalObj = hospitals.find(h => h.name === formData.centroMedico);
    const dbHospitalId = selectedHospitalObj?.id || null;

    const logMessages = [
      '⚡ Inicializando conexión de telemetría Supabase...',
      `🔍 Centro Médico: ${formData.centroMedico} (ID: ${dbHospitalId})`,
      '📋 Estructurando payloads de base, estrategia y optimización...',
      '➡️ Iniciando Server Action de grabación transaccional...',
    ];

    for (let i = 0; i < logMessages.length; i++) {
      setDbLogs((prev) => [...prev, logMessages[i]]);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    // 1. Base Case Payload
    const contrastReduction = calculateContrastReduction(formData.expectedContrastMl, formData.actualContrastMl);
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
      malaposicion_struts: formData.significantMalapposition === 'yes',
      diseccion_bordes: formData.proximalEdgeDissection || formData.distalEdgeDissection,
      contraste_ml: formData.actualContrastMl === '' ? null : formData.actualContrastMl,
      expected_contrast_ml: formData.expectedContrastMl === '' ? null : formData.expectedContrastMl,
      actual_contrast_ml: formData.actualContrastMl === '' ? null : formData.actualContrastMl,
      contrast_reduction_percent: contrastReduction,
      zero_contrast_completed: formData.actualContrastMl === 0,
      hospital_id: dbHospitalId,
      created_by: user.id
    };

    // 2. Strategy changes Payload
    const strategyPayload = {
      modified_strategy: formData.modificoEstrategiaUltreon,
      change_magnitude: formData.modificoEstrategiaUltreon ? (formData.changeMagnitude || null) : null,
      change_description: formData.modificoEstrategiaUltreon ? (formData.changeDescription || null) : null,
      changed_stent_diameter: formData.modificoEstrategiaUltreon && formData.changedStentDiameter,
      changed_stent_length: formData.modificoEstrategiaUltreon && formData.changedStentLength,
      changed_landing_zone_proximal: formData.modificoEstrategiaUltreon && formData.changedLandingZoneProximal,
      changed_landing_zone_distal: formData.modificoEstrategiaUltreon && formData.changedLandingZoneDistal,
      required_plaque_preparation: formData.modificoEstrategiaUltreon && formData.requiredPlaquePreparation,
      used_nc_balloon: formData.modificoEstrategiaUltreon && formData.usedNcBalloon,
      used_scoring_cutting_balloon: formData.modificoEstrategiaUltreon && formData.usedScoringCuttingBalloon,
      used_ivl: formData.modificoEstrategiaUltreon && formData.usedIvl,
      used_atherectomy: formData.modificoEstrategiaUltreon && formData.usedAtherectomy,
      decided_no_stent: formData.modificoEstrategiaUltreon && formData.decidedNoStent,
      treated_edge: formData.modificoEstrategiaUltreon && formData.treatedEdge,
      additional_postdilatation: formData.modificoEstrategiaUltreon && formData.additionalPostdilatation,
      global_strategy_change: formData.modificoEstrategiaUltreon && formData.globalStrategyChange,
      other_change: formData.modificoEstrategiaUltreon && formData.otherChange,
    };

    // 3. Optimization results Payload
    const calculatedScore = calculateOpstarScore({
      actualContrast: formData.actualContrastMl,
      ffrOct: formData.ffrOct,
      landingZone: formData.landingZone,
      diametroReferenciaVaso: formData.diametroReferenciaVaso,
      modificoEstrategiaUltreon: formData.modificoEstrategiaUltreon,
      adequateExpansion: formData.adequateExpansion || 'na',
      significantMalapposition: formData.significantMalapposition || 'na',
      proximalEdgeDissection: formData.proximalEdgeDissection,
      distalEdgeDissection: formData.distalEdgeDissection,
    });

    const optimizationPayload = {
      post_stent_msa_mm2: formData.postStentMsaMm2 === '' ? null : formData.postStentMsaMm2,
      stent_expansion_percent: formData.expansionStent === '' ? null : formData.expansionStent,
      adequate_expansion: formData.adequateExpansion || 'na',
      significant_malapposition: formData.significantMalapposition || 'na',
      malapposition_length_mm: formData.significantMalapposition === 'yes' && formData.malappositionLengthMm !== '' ? formData.malappositionLengthMm : null,
      requires_malapposition_correction: formData.significantMalapposition === 'yes' && formData.requiresMalappositionCorrection,
      proximal_edge_dissection: formData.proximalEdgeDissection,
      distal_edge_dissection: formData.distalEdgeDissection,
      proximal_dissection_length_mm: formData.proximalEdgeDissection && formData.proximalDissectionLengthMm !== '' ? formData.proximalDissectionLengthMm : null,
      distal_dissection_length_mm: formData.distalEdgeDissection && formData.distalDissectionLengthMm !== '' ? formData.distalDissectionLengthMm : null,
      significant_flap_gt_3mm: (formData.proximalEdgeDissection || formData.distalEdgeDissection) && formData.significantFlapGt3mm,
      requires_edge_treatment: (formData.proximalEdgeDissection || formData.distalEdgeDissection) && formData.requiresEdgeTreatment,
      opstar_score: calculatedScore,
      opstar_score_category: getOpstarScoreCategory(calculatedScore)
    };

    setDbLogs((prev) => [...prev, '➡️ Enviando registros a Supabase y validando integridad transaccional...']);

    try {
      const res = await saveRegistryCaseAction(dbPayload, strategyPayload, optimizationPayload);

      if (res.error) {
        setDbLogs((prev) => [
          ...prev,
          `❌ Error en base de datos Supabase: ${res.error}`,
          '💡 Compruebe que tiene permisos para operar en este centro o que todos los datos son válidos.'
        ]);
        setIsSubmitting(false);
        return;
      }

      setDbLogs((prev) => [
        ...prev,
        '🔄 Sincronizando telemetría de purga e implante...',
        `✅ Caso eCRF guardado con éxito. ID: ${res.id}`,
        `⭐ Score OPSTAR: ${calculatedScore} / 100 (${getOpstarScoreCategoryLabel(getOpstarScoreCategory(calculatedScore))})`
      ]);

      setSupabasePayload(
        JSON.stringify(
          {
            casoBase: dbPayload,
            cambiosEstrategia: strategyPayload,
            resultadosOptimizacion: optimizationPayload,
          },
          null,
          2
        )
      );

      await new Promise((resolve) => setTimeout(resolve, 400));
      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (err: any) {
      setDbLogs((prev) => [
        ...prev,
        `❌ Excepción al conectar: ${err?.message || 'Error desconocido'}`
      ]);
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      ...INITIAL_FORM_STATE,
      centroMedico: profile.role === 'hospital_user' ? formData.centroMedico : ''
    });
    setLocalNhc('');
    setLocalSip('');
    setManualIdEdit(false);
    setStep(1);
    setIsSuccess(false);
    setDbLogs([]);
    setErrors({});
  };

  const calculatedFinalScore = calculateOpstarScore({
    actualContrast: formData.actualContrastMl,
    ffrOct: formData.ffrOct,
    landingZone: formData.landingZone,
    diametroReferenciaVaso: formData.diametroReferenciaVaso,
    modificoEstrategiaUltreon: formData.modificoEstrategiaUltreon,
    adequateExpansion: formData.adequateExpansion || 'na',
    significantMalapposition: formData.significantMalapposition || 'na',
    proximalEdgeDissection: formData.proximalEdgeDissection,
    distalEdgeDissection: formData.distalEdgeDissection,
  });

  return (
    <div className="w-full max-w-6xl bg-slate-900 border border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col transition-all duration-500">
      {/* Top Header Monitor Bar */}
      <div className="bg-slate-950 p-6 border-b border-slate-850 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
        
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-sm tracking-tighter">
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

        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-mono text-slate-500">USER ROLE: {profile.role.toUpperCase()}</span>
            <span className="text-xs font-bold text-slate-355">{profile.full_name || user.email}</span>
          </div>
          <div className="h-10 w-[1px] bg-slate-800 hidden sm:block" />
          <Link
            href="/dashboard"
            className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-950 rounded-xl text-xs font-bold transition-all"
          >
            Volver al Panel
          </Link>
        </div>
      </div>

      {/* Stepper Progress Indicator */}
      {!isSuccess && !isSubmitting && (
        <ProceduralTimeline currentStep={step} />
      )}

      {/* Database Transmission Screen */}
      {isSubmitting ? (
        <div className="p-6 md:p-12 flex flex-col md:flex-row gap-6 min-h-[380px] bg-slate-950">
          <div className="flex-1 flex flex-col justify-center items-center p-4">
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full border border-dashed border-cyan-500/20 animate-spin absolute top-0 left-0" />
              <div className="w-24 h-24 rounded-full border-t-2 border-r-2 border-cyan-400 animate-spin shadow-[0_0_15px_rgba(34,211,238,0.2)]" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 tracking-wide">Grabando Ficha Relacional</h3>
            <p className="text-xs text-slate-400 mt-2 font-mono text-center">Inserción transaccional Supabase activa...</p>
          </div>

          <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 font-mono text-xs text-slate-300 flex flex-col justify-between max-h-[300px]">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-3 text-[10px] text-slate-500 uppercase tracking-widest">
                <span>Supabase SQL logs</span>
                <span className="text-cyan-400 animate-pulse">Transmitting</span>
              </div>
              <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                {dbLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log.startsWith('✅') ? (
                      <span className="text-emerald-400">{log}</span>
                    ) : log.startsWith('⚡') || log.startsWith('🔑') || log.startsWith('⭐') ? (
                      <span className="text-cyan-300">{log}</span>
                    ) : log.startsWith('❌') ? (
                      <span className="text-red-400 font-bold">{log}</span>
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
        /* SUCCESS VIEW */
        <div className="p-6 md:p-12 bg-slate-950 flex flex-col gap-8 animate-fade-slide">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 mb-4 shadow-[0_0_20px_rgba(34,211,238,0.2)] animate-pulse">
              <svg className="w-9 h-9" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-extrabold text-slate-50 tracking-tight">Registro Guardado en Supabase</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-md">
              La telemetría clínica y los datos de optimización se han insertado transaccionalmente de forma segura.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-stretch">
            {/* Visual Panel showing animated score ring and details */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-center items-center shadow-inner">
              <FinalResultVisual
                score={calculatedFinalScore}
                category={getOpstarScoreCategory(calculatedFinalScore).toUpperCase()}
                categoryLabel={getOpstarScoreCategoryLabel(getOpstarScoreCategory(calculatedFinalScore))}
                zeroContrast={formData.actualContrastMl === 0}
                hospitalName={formData.centroMedico}
                patientId={formData.idPaciente}
              />
            </div>

            {/* JSON Payload & Logs */}
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col justify-between">
              <div className="flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <h4 className="font-bold text-[10px] uppercase tracking-widest text-slate-500">Supabase Relational Payload (JSON)</h4>
                  <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">3 tables transaction</span>
                </div>
                <pre className="bg-slate-950 p-4 rounded-xl font-mono text-[9px] text-cyan-300 overflow-x-auto h-[280px] border border-slate-800">
                  {supabasePayload}
                </pre>
              </div>
              
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">TELEMETRY SYNC: SECURE TLS 1.3</span>
                <span className="text-emerald-400 text-xs font-bold font-mono">✓ SYNCHRONIZED</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3.5">
            <button
              type="button"
              onClick={handleReset}
              className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
            >
              Registrar Nuevo Paciente
            </button>
          </div>
        </div>
      ) : (
        /* WIZARD FORM */
        <form onSubmit={handleSubmitToSupabase} className="p-6 md:p-12 flex-1 flex flex-col justify-between">
          <div className="min-h-[300px]">
            {/* STEP 1 */}
            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-slide">
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold tracking-wide text-slate-50 uppercase flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                      Paso 1: Datos Basales y Protocolo Zero-Contrast
                    </h2>
                    <p className="text-xs text-slate-450 mt-0.5">Identifique al paciente e indique el segmento AHA del vaso diana.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Centro Médico */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="centroMedico">
                          Centro Médico
                        </label>
                        <div className="relative">
                          <select
                            id="centroMedico"
                            value={formData.centroMedico}
                            disabled={profile.role === 'hospital_user'}
                            onChange={(e) => handleInputChange('centroMedico', e.target.value)}
                            className={`w-full px-4 py-3 rounded-xl bg-slate-950 border transition-all appearance-none text-sm outline-none text-slate-200 ${
                              profile.role === 'hospital_user' ? 'cursor-not-allowed opacity-70 border-slate-800' : 'cursor-pointer border-slate-800 focus:border-cyan-500/50'
                            } ${errors.centroMedico ? 'border-red-500/50' : ''}`}
                          >
                            <option value="">Seleccione hospital...</option>
                            {hospitals.map((h) => (
                              <option key={h.id} value={h.name} className="bg-slate-950 text-slate-300">
                                {h.name}
                              </option>
                            ))}
                          </select>
                          {profile.role !== 'hospital_user' && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          )}
                        </div>
                        {errors.centroMedico && (
                          <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                            ⚠ {errors.centroMedico}
                          </span>
                        )}
                      </div>

                      {/* NHC (Local Only) */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="localNhc">
                          NHC (Local)
                        </label>
                        <input
                          type="text"
                          id="localNhc"
                          value={localNhc}
                          onChange={(e) => setLocalNhc(e.target.value)}
                          placeholder="Ej: 140599"
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 transition-all text-sm outline-none text-slate-200 placeholder-slate-700"
                        />
                      </div>

                      {/* SIP (Local Only) */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="localSip">
                          SIP (Local)
                        </label>
                        <input
                          type="text"
                          id="localSip"
                          value={localSip}
                          onChange={(e) => setLocalSip(e.target.value)}
                          placeholder="Ej: 987654321"
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 transition-all text-sm outline-none text-slate-200 placeholder-slate-700"
                        />
                      </div>
                    </div>

                    {/* ID Paciente */}
                    <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl space-y-3">
                      <div className="flex flex-col md:flex-row gap-4 items-end justify-between">
                        <div className="flex-1 w-full flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono flex items-center gap-1.5" htmlFor="idPaciente">
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
                            className={`w-full px-4 py-3 rounded-xl bg-slate-955 border transition-all text-sm outline-none font-mono font-bold ${
                              manualIdEdit ? 'border-cyan-500/40 text-cyan-300' : 'border-slate-800/80 text-slate-500 cursor-not-allowed bg-slate-950/70'
                            } ${errors.idPaciente ? 'border-red-500/50' : ''}`}
                          />
                        </div>

                        <div className="flex items-center gap-2 pb-1.5 text-xs select-none">
                          <input
                            type="checkbox"
                            id="manualIdEdit"
                            checked={manualIdEdit}
                            onChange={(e) => setManualIdEdit(e.target.checked)}
                            className="rounded border-slate-800 text-cyan-500 bg-slate-955 focus:ring-cyan-500/20 w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor="manualIdEdit" className="text-slate-400 cursor-pointer font-medium hover:text-slate-350 transition-colors">
                            Editar manualmente
                          </label>
                        </div>
                      </div>

                      {errors.idPaciente && (
                        <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                          ⚠ {errors.idPaciente}
                        </span>
                      )}

                      <div className="text-[10px] text-slate-550 leading-relaxed font-mono">
                        🔒 <span className="text-slate-450">Garantía de Privacidad (RGPD)</span>: El NHC y el SIP se procesan de forma 100% local en el navegador del iPad para generar este identificador determinista irreversible. Estos números personales jamás serán transmitidos a la base de datos de Supabase.
                      </div>
                    </div>

                    {/* Vaso Diana: SVG coronario */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono">
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
                      <label className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="tecnicaPurgaOCT">
                        Técnica de Purga OCT
                      </label>
                      <div className="relative">
                        <select
                          id="tecnicaPurgaOCT"
                          value={formData.tecnicaPurgaOCT}
                          onChange={(e) => handleInputChange('tecnicaPurgaOCT', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl bg-slate-950 border transition-all appearance-none cursor-pointer text-sm outline-none text-slate-200 ${
                            errors.tecnicaPurgaOCT ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
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

                {/* Right Visual Panel */}
                <div className="lg:col-span-5 flex flex-col gap-4 justify-start">
                  <div className="sticky top-6">
                    <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase block mb-3">MAPA CORONARIO PROCEDURAL</span>
                    <CoronaryVisual selectedVessel={formData.vasoDiana} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-slide">
                <div className="lg:col-span-7 space-y-6">
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
                        <label className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="ffrOct">
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
                          className={`w-full px-4 py-3 rounded-xl bg-slate-950 border transition-all text-sm outline-none text-slate-200 placeholder-slate-700 ${
                            errors.ffrOct ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                          }`}
                        />
                        {errors.ffrOct && (
                          <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                            ⚠ {errors.ffrOct}
                          </span>
                        )}
                      </div>

                      {/* Diámetro de referencia */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="diametroReferenciaVaso">
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
                          className={`w-full px-4 py-3 rounded-xl bg-slate-950 border transition-all text-sm outline-none text-slate-200 placeholder-slate-700 ${
                            errors.diametroReferenciaVaso ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                          }`}
                        />
                        {errors.diametroReferenciaVaso && (
                          <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                            ⚠ {errors.diametroReferenciaVaso}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Landing Zone */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="landingZone">
                        Selección de Landing Zone
                      </label>
                      <div className="relative">
                        <select
                          id="landingZone"
                          value={formData.landingZone}
                          onChange={(e) => handleInputChange('landingZone', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl bg-slate-950 border transition-all appearance-none cursor-pointer text-sm outline-none text-slate-200 ${
                            errors.landingZone ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                          }`}
                        >
                          <option value="">Seleccione Landing Zone...</option>
                          {LANDING_ZONES.map((lz) => (
                            <option key={lz.value} value={lz.value}>
                              {lz.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-550">
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

                    {/* Toggles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div
                        onClick={() => handleInputChange('calcioSeveroIA', !formData.calcioSeveroIA)}
                        className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex items-start justify-between gap-4 ${
                          formData.calcioSeveroIA ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Calcio Severo IA</h4>
                            <span className="text-[8px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1 rounded">Ángulo &gt; 180º</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">Detección automática de arco severo.</p>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${formData.calcioSeveroIA ? 'bg-cyan-400' : 'bg-slate-800'}`}>
                          <div className={`w-4 h-4 rounded-full bg-slate-900 absolute top-0.5 transition-transform shadow ${formData.calcioSeveroIA ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                        </div>
                      </div>

                      <div
                        onClick={() => handleInputChange('placaLipidicaIA', !formData.placaLipidicaIA)}
                        className={`p-4 rounded-xl border cursor-pointer select-none transition-all flex items-start justify-between gap-4 ${
                          formData.placaLipidicaIA ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">Placa Lipídica IA</h4>
                            <span className="text-[8px] bg-red-500/10 text-red-400 border border-red-500/20 px-1 rounded">Lipid Co-Reg</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">Identificación automática de lípido vulnerable.</p>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${formData.placaLipidicaIA ? 'bg-cyan-400' : 'bg-slate-800'}`}>
                          <div className={`w-4 h-4 rounded-full bg-slate-900 absolute top-0.5 transition-transform shadow ${formData.placaLipidicaIA ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
                        </div>
                      </div>
                    </div>

                    {formData.placaLipidicaIA && (
                      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="arcoLipidicoEstimado">
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
                            className={`w-full px-4 py-3 rounded-xl bg-slate-950 border transition-all text-sm outline-none text-slate-200 placeholder-slate-700 ${
                              errors.arcoLipidicoEstimado ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
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

                {/* Right Visual Panel */}
                <div className="lg:col-span-5 flex flex-col gap-4 justify-start">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase block mb-1">FISIOLOGÍA Y ANÁLISIS IA PRE-ICP</span>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {/* FFR-OCT Visual Card */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-44 relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-300">
                      <div className="absolute top-2 left-3 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Flujo Fisiológico (FFR-OCT)</div>
                      <div className="w-full h-full pt-4 flex items-center justify-center">
                        <FFROCTVisual ffrValue={formData.ffrOct} />
                      </div>
                    </div>

                    {/* Calcium Severity Card */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-44 relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-300">
                      <div className="absolute top-2 left-3 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Superposición de Calcio (IA)</div>
                      <div className="w-full h-full pt-4 flex items-center justify-center">
                        <CalciumOverlayVisual isActive={formData.calcioSeveroIA} />
                      </div>
                    </div>

                    {/* Lipid Plaque Card */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-44 relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-300">
                      <div className="absolute top-2 left-3 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Vulnerabilidad de Placa Lipídica (IA)</div>
                      <div className="w-full h-full pt-4 flex items-center justify-center">
                        <LipidArcVisual isActive={formData.placaLipidicaIA} arcValue={formData.arcoLipidicoEstimado} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-slide">
                <div className="lg:col-span-7 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold tracking-wide text-slate-50 uppercase flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                      Paso 3: Implante y Optimización (La Triada ULTREON™)
                    </h2>
                    <p className="text-xs text-slate-450 mt-0.5">Valore el impacto de la OCT/IA y los parámetros de aposición, expansión y bordes.</p>
                  </div>

                <div className="space-y-6">
                  {/* SECCIÓN: CAMBIO DE ESTRATEGIA INDUCIDO POR ULTREON */}
                  <div className="bg-slate-950/40 border border-slate-850 rounded-2xl p-5 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
                      <div>
                        <h3 className="text-xs font-bold text-cyan-400 tracking-wider uppercase font-mono">
                          I. Estrategia de ICP
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Impacto clínico de ULTREON™ comparado con estimación angiográfica inicial</p>
                      </div>
                    </div>

                    <div
                      onClick={() => handleInputChange('modificoEstrategiaUltreon', !formData.modificoEstrategiaUltreon)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-center justify-between gap-4 ${
                        formData.modificoEstrategiaUltreon ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-slate-900 border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex gap-3 items-start">
                        <div className={`p-2 rounded-lg border transition-colors ${formData.modificoEstrategiaUltreon ? 'bg-cyan-500 border-cyan-500 text-slate-950' : 'bg-slate-950 border-slate-800 text-slate-500'}`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200 uppercase font-mono">¿Modificó ULTREON la estrategia inicialmente estimada por angiografía?</h4>
                          <p className="text-[10px] text-slate-500 mt-0.5">Marque Sí si la OCT o IA derivaron en un cambio en stents, balones o preparación.</p>
                        </div>
                      </div>
                      <div className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${formData.modificoEstrategiaUltreon ? 'bg-cyan-400' : 'bg-slate-800'}`}>
                        <div className={`w-4 h-4 rounded-full bg-slate-900 absolute top-0.5 transition-transform shadow ${formData.modificoEstrategiaUltreon ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
                      </div>
                    </div>

                    {formData.modificoEstrategiaUltreon && (
                      <div className="space-y-4 pt-2 animate-fade-slide">
                        {/* Magnitude Selector */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                            Magnitud del Cambio
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { value: 'minor', label: 'Menor', desc: 'Ajuste de landing zone/longitud' },
                              { value: 'moderate', label: 'Moderado', desc: 'Diámetro, NC o placa prep' },
                              { value: 'major', label: 'Mayor', desc: 'IVL, no stent, cambio de vaso' }
                            ].map((m) => (
                              <button
                                key={m.value}
                                type="button"
                                onClick={() => handleInputChange('changeMagnitude', m.value)}
                                className={`p-2.5 text-left rounded-xl border transition-all cursor-pointer flex flex-col justify-center ${
                                  formData.changeMagnitude === m.value
                                    ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 ring-1 ring-cyan-500/20'
                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                <span className="text-[11px] font-bold font-mono">{m.label}</span>
                                <span className="text-[8px] text-slate-500 mt-0.5 leading-tight">{m.desc}</span>
                              </button>
                            ))}
                          </div>
                          {errors.changeMagnitude && (
                            <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                              ⚠ {errors.changeMagnitude}
                            </span>
                          )}
                        </div>

                        {/* Checklist */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                            Checklist de Modificaciones Realizadas
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              { key: 'changedStentDiameter', label: 'Cambio Diámetro Stent', desc: 'Ajustado según diámetro EEL' },
                              { key: 'changedStentLength', label: 'Cambio Longitud Stent', desc: 'Ajustado por Landing Zone' },
                              { key: 'changedLandingZoneProximal', label: 'Cambio Landing Zone Proximal', desc: 'Borde proximal libre de placa' },
                              { key: 'changedLandingZoneDistal', label: 'Cambio Landing Zone Distal', desc: 'Borde distal libre de placa' },
                              { key: 'requiredPlaquePreparation', label: 'Preparación de Placa', desc: 'Calcio o estenosis severa' },
                              { key: 'usedNcBalloon', label: 'Uso de Balón NC', desc: 'Postdilatación no planificada' },
                              { key: 'usedScoringCuttingBalloon', label: 'Scoring / Cutting Balloon', desc: 'Corte de placa fibrocalcificada' },
                              { key: 'usedIvl', label: 'Litotricia Intravascular (IVL)', desc: 'Fractura de calcio severo' },
                              { key: 'usedAtherectomy', label: 'Aterectomía (Rotacional/Orb)', desc: 'Desbaste de calcio severo' },
                              { key: 'decidedNoStent', label: 'Decisión de No Stent', desc: 'Solo DEB o angioplastia simple' },
                              { key: 'treatedEdge', label: 'Tratamiento de Borde', desc: 'Terapia por disección marginal' },
                              { key: 'additionalPostdilatation', label: 'Posdilatación Adicional', desc: 'Control final del stent' },
                              { key: 'globalStrategyChange', label: 'Cambio de Estrategia Global', desc: 'Rediseño completo de la ICP' },
                              { key: 'otherChange', label: 'Otros Cambios', desc: 'Otros ajustes no descritos' }
                            ].map((item) => {
                              const checked = formData[item.key as keyof eCRFFormData] === true;
                              return (
                                <div
                                  key={item.key}
                                  onClick={() => handleInputChange(item.key as keyof eCRFFormData, !checked)}
                                  className={`p-2 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between gap-3 text-left ${
                                    checked ? 'bg-cyan-950/20 border-cyan-555/30' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                                  }`}
                                >
                                  <div>
                                    <h5 className="text-[10px] font-bold text-slate-200 font-mono">{item.label}</h5>
                                    <p className="text-[8px] text-slate-500">{item.desc}</p>
                                  </div>
                                  <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                    checked ? 'bg-cyan-400 border-cyan-400 text-slate-950' : 'border-slate-700 bg-slate-950'
                                  }`}>
                                    {checked && (
                                      <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="changeDescription">
                            Descripción Clínica del Cambio
                          </label>
                          <textarea
                            id="changeDescription"
                            value={formData.changeDescription}
                            onChange={(e) => handleInputChange('changeDescription', e.target.value)}
                            placeholder="Ej: Se modificó la longitud del stent planeado de 28mm a 38mm para cubrir zona lipídica vulnerable proximal detectada por co-registro..."
                            rows={2}
                            className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-cyan-500/50 transition-all text-xs outline-none text-slate-200 placeholder-slate-700 resize-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* SECCIÓN: TRIADA DE OPTIMIZACIÓN POST-STENT */}
                  <div className="bg-slate-950/40 border border-slate-855 rounded-2xl p-5 space-y-6">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-2.5">
                      <div>
                        <h3 className="text-xs font-bold text-cyan-400 tracking-wider uppercase font-mono">
                          II. Triada de Optimización Post-Stent
                        </h3>
                        <p className="text-[10px] text-slate-500 mt-0.5">Parámetros clave de expansión, aposición y bordes según ULTREON™</p>
                      </div>
                    </div>

                    {/* PILLAR 1: EXPANSIÓN */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-200 font-bold text-xs uppercase font-mono">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                        Pilar A: Expansión del Stent
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Porcentaje de Expansión */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="expansionStent">
                            Expansión del Stent (%)
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
                            className={`w-full px-3.5 py-2 rounded-xl bg-slate-900 border transition-all text-xs outline-none text-slate-200 placeholder-slate-700 ${
                              errors.expansionStent ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                            }`}
                          />
                          {errors.expansionStent && (
                            <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                              ⚠ {errors.expansionStent}
                            </span>
                          )}
                        </div>

                        {/* Área Luminal Mínima (MSA) */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="postStentMsaMm2">
                            MSA Mínima del Stent (mm²)
                          </label>
                          <input
                            type="number"
                            id="postStentMsaMm2"
                            value={formData.postStentMsaMm2}
                            onChange={(e) => handleInputChange('postStentMsaMm2', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            min="0"
                            max="20"
                            step="0.01"
                            placeholder="Ej: 5.5"
                            className={`w-full px-3.5 py-2 rounded-xl bg-slate-900 border transition-all text-xs outline-none text-slate-200 placeholder-slate-700 ${
                              errors.postStentMsaMm2 ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                            }`}
                          />
                          {errors.postStentMsaMm2 && (
                            <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                              ⚠ {errors.postStentMsaMm2}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Expansión Adecuada Select */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                          ¿Expansión Adecuada (mín. 80%)?
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'yes', label: 'Sí (≥ 80%)' },
                            { value: 'no', label: 'No (< 80%)' },
                            { value: 'na', label: 'N/A' }
                          ].map((x) => (
                            <button
                              key={x.value}
                              type="button"
                              onClick={() => handleInputChange('adequateExpansion', x.value)}
                              className={`p-2.5 text-center rounded-xl border text-[11px] font-bold font-mono transition-all cursor-pointer ${
                                formData.adequateExpansion === x.value
                                  ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 ring-1 ring-cyan-500/20'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-750'
                              }`}
                            >
                              {x.label}
                            </button>
                          ))}
                        </div>
                        {errors.adequateExpansion && (
                          <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                            ⚠ {errors.adequateExpansion}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="h-[1px] bg-slate-900" />

                    {/* PILLAR 2: APOSICIÓN */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-200 font-bold text-xs uppercase font-mono">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                        Pilar B: Aposición de Struts
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">
                          ¿Existe Malaposición Significativa?
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'yes', label: 'Sí (Struts no adosados)' },
                            { value: 'no', label: 'No' },
                            { value: 'na', label: 'N/A' }
                          ].map((x) => (
                            <button
                              key={x.value}
                              type="button"
                              onClick={() => handleInputChange('significantMalapposition', x.value)}
                              className={`p-2.5 text-center rounded-xl border text-[11px] font-bold font-mono transition-all cursor-pointer ${
                                formData.significantMalapposition === x.value
                                  ? 'bg-cyan-950/40 border-cyan-400 text-cyan-300 ring-1 ring-cyan-500/20'
                                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-750'
                              }`}
                            >
                              {x.label}
                            </button>
                          ))}
                        </div>
                        {errors.significantMalapposition && (
                          <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                            ⚠ {errors.significantMalapposition}
                          </span>
                        )}
                      </div>

                      {formData.significantMalapposition === 'yes' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 animate-fade-slide">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="malappositionLengthMm">
                              Longitud de Malaposición (mm)
                            </label>
                            <input
                              type="number"
                              id="malappositionLengthMm"
                              value={formData.malappositionLengthMm}
                              onChange={(e) => handleInputChange('malappositionLengthMm', e.target.value === '' ? '' : parseFloat(e.target.value))}
                              min="0"
                              max="30"
                              step="0.1"
                              placeholder="Ej: 1.2"
                              className={`w-full px-3.5 py-2 rounded-xl bg-slate-900 border transition-all text-xs outline-none text-slate-200 placeholder-slate-700 ${
                                errors.malappositionLengthMm ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                              }`}
                            />
                            {errors.malappositionLengthMm && (
                              <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                                ⚠ {errors.malappositionLengthMm}
                              </span>
                            )}
                          </div>

                          <div
                            onClick={() => handleInputChange('requiresMalappositionCorrection', !formData.requiresMalappositionCorrection)}
                            className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between gap-3 text-left ${
                              formData.requiresMalappositionCorrection ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-755'
                            }`}
                          >
                            <div>
                              <h5 className="text-[10px] font-bold text-slate-200 font-mono">¿Requiere optimización adicional?</h5>
                              <p className="text-[8px] text-slate-500">Ej: postdilatación con balón de mayor calibre</p>
                            </div>
                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                              formData.requiresMalappositionCorrection ? 'bg-cyan-400 border-cyan-400 text-slate-950' : 'border-slate-750 bg-slate-955'
                            }`}>
                              {formData.requiresMalappositionCorrection && (
                                <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="h-[1px] bg-slate-900" />

                    {/* PILLAR 3: INTEGRIDAD DE BORDES */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-200 font-bold text-xs uppercase font-mono">
                        <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                        Pilar C: Integridad de Bordes (Edge Dissections)
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Proximal Edge Dissection */}
                        <div
                          onClick={() => handleInputChange('proximalEdgeDissection', !formData.proximalEdgeDissection)}
                          className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between gap-3 text-left ${
                            formData.proximalEdgeDissection ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-755'
                          }`}
                        >
                          <div>
                            <h5 className="text-[10px] font-bold text-slate-200 font-mono">Disección de Borde Proximal</h5>
                            <p className="text-[8px] text-slate-500">Complicación en el extremo de entrada</p>
                          </div>
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                            formData.proximalEdgeDissection ? 'bg-cyan-400 border-cyan-400 text-slate-950' : 'border-slate-750 bg-slate-955'
                          }`}>
                            {formData.proximalEdgeDissection && (
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Distal Edge Dissection */}
                        <div
                          onClick={() => handleInputChange('distalEdgeDissection', !formData.distalEdgeDissection)}
                          className={`p-3.5 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between gap-3 text-left ${
                            formData.distalEdgeDissection ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-slate-900 border-slate-800 hover:border-slate-755'
                          }`}
                        >
                          <div>
                            <h5 className="text-[10px] font-bold text-slate-200 font-mono">Disección de Borde Distal</h5>
                            <p className="text-[8px] text-slate-500">Complicación en el extremo de salida</p>
                          </div>
                          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                            formData.distalEdgeDissection ? 'bg-cyan-400 border-cyan-400 text-slate-950' : 'border-slate-750 bg-slate-955'
                          }`}>
                            {formData.distalEdgeDissection && (
                              <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Dissection Details */}
                      {(formData.proximalEdgeDissection || formData.distalEdgeDissection) && (
                        <div className="p-4 bg-slate-900/60 border border-slate-850 rounded-xl space-y-4 pt-3.5 animate-fade-slide">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {formData.proximalEdgeDissection && (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="proximalDissectionLengthMm">
                                  Longitud Disección Proximal (mm)
                                </label>
                                <input
                                  type="number"
                                  id="proximalDissectionLengthMm"
                                  value={formData.proximalDissectionLengthMm}
                                  onChange={(e) => handleInputChange('proximalDissectionLengthMm', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                  min="0"
                                  max="30"
                                  step="0.1"
                                  placeholder="Ej: 2.0"
                                  className={`w-full px-3 py-1.5 rounded-lg bg-slate-955 border transition-all text-xs outline-none text-slate-200 placeholder-slate-750 ${
                                    errors.proximalDissectionLengthMm ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                                  }`}
                                />
                                {errors.proximalDissectionLengthMm && (
                                  <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                                    ⚠ {errors.proximalDissectionLengthMm}
                                  </span>
                                )}
                              </div>
                            )}

                            {formData.distalEdgeDissection && (
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="distalDissectionLengthMm">
                                  Longitud Disección Distal (mm)
                                </label>
                                <input
                                  type="number"
                                  id="distalDissectionLengthMm"
                                  value={formData.distalDissectionLengthMm}
                                  onChange={(e) => handleInputChange('distalDissectionLengthMm', e.target.value === '' ? '' : parseFloat(e.target.value))}
                                  min="0"
                                  max="30"
                                  step="0.1"
                                  placeholder="Ej: 1.5"
                                  className={`w-full px-3 py-1.5 rounded-lg bg-slate-955 border transition-all text-xs outline-none text-slate-200 placeholder-slate-750 ${
                                    errors.distalDissectionLengthMm ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                                  }`}
                                />
                                {errors.distalDissectionLengthMm && (
                                  <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                                    ⚠ {errors.distalDissectionLengthMm}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Significant Flap */}
                            <div
                              onClick={() => handleInputChange('significantFlapGt3mm', !formData.significantFlapGt3mm)}
                              className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between gap-3 text-left ${
                                formData.significantFlapGt3mm ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                              }`}
                            >
                              <div>
                                <h5 className="text-[10px] font-bold text-slate-200 font-mono">¿Flap Significativo?</h5>
                                <p className="text-[8px] text-slate-500">Ángulo &gt; 60º en OCT o longitud &gt; 3mm</p>
                              </div>
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                formData.significantFlapGt3mm ? 'bg-cyan-400 border-cyan-400 text-slate-950' : 'border-slate-750 bg-slate-955'
                              }`}>
                                {formData.significantFlapGt3mm && (
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>

                            {/* Requires edge treatment */}
                            <div
                              onClick={() => handleInputChange('requiresEdgeTreatment', !formData.requiresEdgeTreatment)}
                              className={`p-3 rounded-xl border cursor-pointer select-none transition-all flex items-center justify-between gap-3 text-left ${
                                formData.requiresEdgeTreatment ? 'bg-cyan-950/20 border-cyan-500/30' : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                              }`}
                            >
                              <div>
                                <h5 className="text-[10px] font-bold text-slate-200 font-mono">¿Requiere Tratamiento?</h5>
                                <p className="text-[8px] text-slate-500">Ej: implante de stent adicional de recubrimiento</p>
                              </div>
                              <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                formData.requiresEdgeTreatment ? 'bg-cyan-400 border-cyan-400 text-slate-950' : 'border-slate-750 bg-slate-955'
                              }`}>
                                {formData.requiresEdgeTreatment && (
                                  <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

                {/* Right Visual Panel */}
                <div className="lg:col-span-5 flex flex-col gap-4 justify-start">
                  <span className="text-[10px] font-mono font-bold tracking-widest text-slate-500 uppercase block mb-1">TRÍADA DE OPTIMIZACIÓN POST-ICP ULTREON™</span>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {/* Stent Expansion Visual Card */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-44 relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-300">
                      <div className="absolute top-2 left-3 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Pilar A: Expansión del Stent</div>
                      <div className="w-full h-full pt-4 flex items-center justify-center">
                        <StentExpansionVisual expansionPercent={formData.expansionStent} isAdequate={formData.adequateExpansion} />
                      </div>
                    </div>

                    {/* Malapposition Visual Card */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-44 relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-300">
                      <div className="absolute top-2 left-3 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Pilar B: Aposición de Struts</div>
                      <div className="w-full h-full pt-4 flex items-center justify-center">
                        <MalappositionVisual hasMalapposition={formData.significantMalapposition} lengthMm={formData.malappositionLengthMm} />
                      </div>
                    </div>

                    {/* Edge Dissection Visual Card */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between h-44 relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-300">
                      <div className="absolute top-2 left-3 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider">Pilar C: Integridad de Bordes</div>
                      <div className="w-full h-full pt-4 flex items-center justify-center">
                        <EdgeDissectionVisual hasProximal={formData.proximalEdgeDissection} hasDistal={formData.distalEdgeDissection} hasFlap={formData.significantFlapGt3mm} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (() => {
              const contrastRed = calculateContrastReduction(formData.expectedContrastMl, formData.actualContrastMl);
              const calculatedScore = calculateOpstarScore({
                actualContrast: formData.actualContrastMl,
                ffrOct: formData.ffrOct,
                landingZone: formData.landingZone,
                diametroReferenciaVaso: formData.diametroReferenciaVaso,
                modificoEstrategiaUltreon: formData.modificoEstrategiaUltreon,
                adequateExpansion: formData.adequateExpansion || 'na',
                significantMalapposition: formData.significantMalapposition || 'na',
                proximalEdgeDissection: formData.proximalEdgeDissection,
                distalEdgeDissection: formData.distalEdgeDissection,
              });
              const scoreCategory = getOpstarScoreCategory(calculatedScore);
              const scoreLabel = getOpstarScoreCategoryLabel(scoreCategory);

              // Warnings logic
              const hasCriticalFfr = formData.ffrOct !== '' && formData.ffrOct < 0.50;
              const hasSuboptimalExpansion = formData.adequateExpansion === 'no';
              const hasUntreatedDissection = (formData.proximalEdgeDissection || formData.distalEdgeDissection) && !formData.requiresEdgeTreatment;
              const hasSignificantUncorrectedMalapposition = formData.significantMalapposition === 'yes' && !formData.requiresMalappositionCorrection;
              const isZeroContrast = formData.actualContrastMl !== '' && formData.actualContrastMl === 0;

              return (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold tracking-wide text-slate-50 uppercase flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-400" />
                      Paso 4: Auditoría de Contraste y Score OPSTAR-AI™
                    </h2>
                    <p className="text-xs text-slate-450 mt-0.5">Registre el volumen de contraste y evalúe la puntuación final de optimización.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Form Input Columns */}
                    <div className="lg:col-span-6 space-y-4">
                      <div className="bg-slate-955/40 border border-slate-850 rounded-2xl p-5 space-y-4">
                        <h3 className="text-xs font-bold text-cyan-400 tracking-wider uppercase font-mono border-b border-slate-900 pb-2">
                          Volumen de Contraste
                        </h3>

                        {/* Expected Contrast */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="expectedContrastMl">
                            Volumen Esperado de Contraste (ml)
                          </label>
                          <input
                            type="number"
                            id="expectedContrastMl"
                            value={formData.expectedContrastMl}
                            onChange={(e) => handleInputChange('expectedContrastMl', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            min="0"
                            max="800"
                            placeholder="Ej: 150"
                            className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border transition-all text-xs outline-none text-slate-200 placeholder-slate-700 ${
                              errors.expectedContrastMl ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                            }`}
                          />
                          {errors.expectedContrastMl && (
                            <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                              ⚠ {errors.expectedContrastMl}
                            </span>
                          )}
                          <p className="text-[9px] text-slate-555">Volumen de contraste estimado según angiografía estándar previa.</p>
                        </div>

                        {/* Actual Contrast */}
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="actualContrastMl">
                            Volumen Real de Contraste Utilizado (ml)
                          </label>
                          <input
                            type="number"
                            id="actualContrastMl"
                            value={formData.actualContrastMl}
                            onChange={(e) => handleInputChange('actualContrastMl', e.target.value === '' ? '' : parseFloat(e.target.value))}
                            min="0"
                            max="800"
                            placeholder="Ej: 45"
                            className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border transition-all text-xs outline-none text-slate-200 placeholder-slate-700 ${
                              errors.actualContrastMl ? 'border-red-500/50' : 'border-slate-800 focus:border-cyan-500/50'
                            }`}
                          />
                          {errors.actualContrastMl && (
                            <span className="text-[10px] font-mono text-red-400 flex items-center gap-1">
                              ⚠ {errors.actualContrastMl}
                            </span>
                          )}
                          <p className="text-[9px] text-slate-555">Volumen total dispensado en este procedimiento guiado por OCT.</p>
                        </div>

                        {/* Reduction Stats */}
                        {formData.expectedContrastMl !== '' && formData.actualContrastMl !== '' && (
                          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs font-mono">
                            <span className="text-slate-400">Reducción de Contraste:</span>
                            <span className={`font-bold ${contrastRed > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                              {contrastRed > 0 ? `-${contrastRed}%` : `${contrastRed}%`}
                            </span>
                          </div>
                        )}

                        {isZeroContrast && (
                          <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 text-emerald-400 rounded-xl text-[10px] leading-relaxed font-semibold flex items-start gap-2 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                            <span className="text-base leading-none">★</span>
                            <div>
                              <span>PROTOCOLO ZERO-CONTRAST COMPLETADO</span>
                              <p className="text-[9px] font-normal text-emerald-500/70 mt-0.5">Procedimiento completado con 0 ml de contraste. Se minimiza totalmente el riesgo de Nefropatía Inducida por Contraste (NIC).</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* OPSTAR score widget Column */}
                    <div className="lg:col-span-6 space-y-4">
                      <div className="bg-slate-955/40 border border-slate-850 rounded-2xl p-5 flex flex-col items-center text-center space-y-4 relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
                        
                        <div>
                          <h3 className="text-xs font-bold text-slate-350 tracking-wider uppercase font-mono">
                            OPSTAR Optimization Score
                          </h3>
                          <p className="text-[9px] text-slate-500 mt-0.5">Indicador de calidad registral del procedimiento</p>
                        </div>

                        {/* SVG Gauge */}
                        <div className="relative w-36 h-36 flex items-center justify-center">
                          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                            {/* Background Circle */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#1e293b"
                              strokeWidth="8"
                            />
                            {/* Progress Circle */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={
                                scoreCategory === 'optimal'
                                  ? '#22d3ee'
                                  : scoreCategory === 'suboptimal_mild'
                                  ? '#eab308'
                                  : scoreCategory === 'suboptimal_moderate'
                                  ? '#f97316'
                                  : '#ef4444'
                              }
                              strokeWidth="8"
                              strokeDasharray={`${2 * Math.PI * 40}`}
                              strokeDashoffset={`${2 * Math.PI * 40 * (1 - calculatedScore / 100)}`}
                              className="transition-all duration-1000 ease-out"
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center">
                            <span className="text-3xl font-black text-slate-50 tracking-tighter">{calculatedScore}</span>
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">puntos</span>
                          </div>
                        </div>

                        {/* Category Badge */}
                        <div className={`px-4 py-1.5 rounded-full border text-xs font-black font-mono tracking-wide ${
                          scoreCategory === 'optimal'
                            ? 'bg-cyan-950/80 border-cyan-800 text-cyan-400'
                            : scoreCategory === 'suboptimal_mild'
                            ? 'bg-yellow-950/80 border-yellow-800 text-yellow-400'
                            : scoreCategory === 'suboptimal_moderate'
                            ? 'bg-orange-950/80 border-orange-900 text-orange-400'
                            : 'bg-red-950/80 border-red-900 text-red-400'
                        }`}>
                          {scoreLabel.toUpperCase()}
                        </div>

                        {/* Checklist criteria summary */}
                        <div className="w-full text-left space-y-1.5 pt-2 border-t border-slate-900 text-[10px] font-mono text-slate-450">
                          <div className="flex justify-between">
                            <span>1. Zero-Contraste (+15 pts):</span>
                            <span className={isZeroContrast ? 'text-cyan-400 font-bold' : 'text-slate-655'}>{isZeroContrast ? 'Sí' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>2. FFR-OCT Utilizado (+10 pts):</span>
                            <span className={formData.ffrOct !== '' ? 'text-cyan-400 font-bold' : 'text-slate-655'}>{formData.ffrOct !== '' ? 'Sí' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>3. Landing Zone Identificada (+10 pts):</span>
                            <span className={formData.landingZone === 'GUIADO_IA_EEL' || (formData.landingZone !== '' && formData.diametroReferenciaVaso !== '' && formData.diametroReferenciaVaso > 0) ? 'text-cyan-400 font-bold' : 'text-slate-655'}>
                              {formData.landingZone === 'GUIADO_IA_EEL' || (formData.landingZone !== '' && formData.diametroReferenciaVaso !== '' && formData.diametroReferenciaVaso > 0) ? 'Sí' : 'No'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>4. Modificación de Estrategia (+15 pts):</span>
                            <span className={formData.modificoEstrategiaUltreon ? 'text-cyan-400 font-bold' : 'text-slate-655'}>{formData.modificoEstrategiaUltreon ? 'Sí' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>5. Expansión Adecuada (+20 pts):</span>
                            <span className={formData.adequateExpansion === 'yes' ? 'text-cyan-400 font-bold' : 'text-slate-655'}>{formData.adequateExpansion === 'yes' ? 'Sí' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>6. Sin Malaposición (+15 pts):</span>
                            <span className={formData.significantMalapposition === 'no' ? 'text-cyan-400 font-bold' : 'text-slate-655'}>{formData.significantMalapposition === 'no' ? 'Sí' : 'No'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>7. Sin Disección de Bordes (+15 pts):</span>
                            <span className={!formData.proximalEdgeDissection && !formData.distalEdgeDissection ? 'text-cyan-400 font-bold' : 'text-slate-655'}>
                              {!formData.proximalEdgeDissection && !formData.distalEdgeDissection ? 'Sí' : 'No'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CLINICAL WARNINGS PANEL */}
                  {(hasCriticalFfr || hasSuboptimalExpansion || hasUntreatedDissection || hasSignificantUncorrectedMalapposition) && (
                    <div className="bg-slate-950/60 border border-red-500/20 rounded-2xl p-5 space-y-3">
                      <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase font-mono">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Alertas y Validaciones Clínicas
                      </div>
                      
                      <div className="space-y-2 text-[10px] leading-relaxed font-mono">
                        {hasCriticalFfr && (
                          <div className="p-2.5 bg-red-955/20 border border-red-500/10 text-red-400 rounded-lg">
                            🚨 <strong>FFR-OCT &lt; 0.50 basal o derivado</strong>: Valor fisiológico críticamente bajo. Sugiere isquemia severa persistente o alteración hemodinámica mayor en el vaso diana.
                          </div>
                        )}
                        {hasSuboptimalExpansion && (
                          <div className="p-2.5 bg-red-955/20 border border-red-500/10 text-red-400 rounded-lg">
                            🚨 <strong>Expansión Subóptima (&lt; 80%)</strong>: La expansión inadecuada del stent aumenta de forma crítica el riesgo a largo plazo de reestenosis intrastent (ISR) y trombosis aguda/subaguda del stent.
                          </div>
                        )}
                        {hasUntreatedDissection && (
                          <div className="p-2.5 bg-red-955/20 border border-red-500/10 text-red-400 rounded-lg">
                            🚨 <strong>Disección de Borde no Tratada</strong>: Se ha documentado disección marginal proximal o distal sin indicarse tratamiento corrector. Riesgo elevado de oclusión coronaria aguda.
                          </div>
                        )}
                        {hasSignificantUncorrectedMalapposition && (
                          <div className="p-2.5 bg-red-955/20 border border-red-500/10 text-red-400 rounded-lg">
                            🚨 <strong>Malaposición Significativa sin Corregir</strong>: Struts no adosados al vaso sin corrección planificada. Aumenta la turbulencia local y eleva el riesgo de trombosis tardía del stent.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="text-[10px] text-slate-550 leading-relaxed font-mono p-3 bg-slate-950/25 border border-slate-850/50 rounded-xl">
                    ℹ️ <strong>Nota Legal / Descargo de Responsabilidad</strong>: Esta puntuación y sus alertas asociadas son con fines puramente de registro y auditoría clínica (investigacional). No representan asesoramiento médico automatizado ni deben suplantar el juicio clínico del facultativo responsable del implante en la sala de hemodinámica.
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-855 mt-8 bg-slate-900/10">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="px-5 py-3.5 rounded-xl border border-slate-800 hover:bg-slate-950 text-xs font-bold text-slate-400 hover:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Atrás
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-6 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-100 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                Continuar
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ) : (
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-cyan-500/25 cursor-pointer"
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
  );
}
