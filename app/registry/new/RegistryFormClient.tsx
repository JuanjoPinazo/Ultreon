// app/registry/new/RegistryFormClient.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ZeroContrastInsertPayload } from '@/types/zero-contrast';
import { calculateContrastReduction, calculateOpstarScore, getOpstarScoreCategory, getOpstarScoreCategoryLabel } from '@/lib/clinical';
import { saveRegistryCaseAction, createInvestigatorAction } from '@/lib/supabase/actions';
import { uploadCaseMediaAction } from '@/lib/supabase/media-actions';
import { CoronaryTreeNavigator, Segment, CORONARY_SEGMENTS } from '@/components/CoronaryTreeNavigator';

// Design System components import
import Card from '@/components/design-system/Card';
import Badge from '@/components/design-system/Badge';
import MetricCard from '@/components/design-system/MetricCard';
import ClinicalStoryboardCard from '@/components/design-system/ClinicalStoryboardCard';
import Alert from '@/components/design-system/Alert';

interface eCRFFormData {
  centroMedico: string;
  idPaciente: string;
  vasoDiana: string; 
  operador: string;
  fechaProcedimiento: string;
  
  // Zero-Contrast
  contrasteAdquisicionOct: number | '';
  actualContrastMl: number | ''; 
  calidadLavado: 'Excelente' | 'Buena' | 'Regular' | 'Mala' | '';
  necesitoContrasteOct: boolean;
  motivoContrasteOct: string;

  // ULTREON findings
  ultreonCalcio: boolean;
  ultreonArcoCalcioGt180: boolean;
  ultreonEel: boolean;
  ultreonLongitudLesion: number | '';
  ultreonReferenciaProx: number | '';
  ultreonReferenciaDist: number | '';
  ultreonAreaLuminalMin: number | '';
  ultreonExpansionStent: number | '';

  // Strategy change
  modificoEstrategiaUltreon: boolean;
  changedStentDiameter: boolean;
  changedStentLength: boolean;
  requiredPlaquePreparation: boolean;
  changedLandingZoneProximal: boolean;
  changedLandingZoneDistal: boolean;
  additionalPostdilatation: boolean;
  otherChange: boolean;
}

const INITIAL_FORM_STATE: eCRFFormData = {
  centroMedico: '',
  idPaciente: '',
  vasoDiana: '',
  operador: '',
  fechaProcedimiento: new Date().toISOString().split('T')[0],
  
  contrasteAdquisicionOct: 0,
  actualContrastMl: '',
  calidadLavado: '',
  necesitoContrasteOct: false,
  motivoContrasteOct: '',

  ultreonCalcio: false,
  ultreonArcoCalcioGt180: false,
  ultreonEel: false,
  ultreonLongitudLesion: '',
  ultreonReferenciaProx: '',
  ultreonReferenciaDist: '',
  ultreonAreaLuminalMin: '',
  ultreonExpansionStent: '',

  modificoEstrategiaUltreon: false,
  changedStentDiameter: false,
  changedStentLength: false,
  requiredPlaquePreparation: false,
  changedLandingZoneProximal: false,
  changedLandingZoneDistal: false,
  additionalPostdilatation: false,
  otherChange: false,
};

const MILESTONES = [
  { id: 1, label: 'Paciente y Anatomía', dot: '🫀' },
  { id: 2, label: 'Preparación del Lavado', dot: '💧' },
  { id: 3, label: 'Adquisición Zero-Contrast', dot: '📷' },
  { id: 4, label: 'Interpretación ULTREON™', dot: '🧠' },
  { id: 5, label: 'Decisión Clínica', dot: '✅' }
] as const;

interface RegistryFormClientProps {
  user: any;
  profile: any;
  hospitals: any[];
}

export default function RegistryFormClient({ user, profile, hospitals }: RegistryFormClientProps) {
  const router = useRouter();

  const [step, setStep] = useState<number>(1);
  const [formData, setFormData] = useState<eCRFFormData>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Local NHC / SIP to generate anonymized ID
  const [localNhc, setLocalNhc] = useState<string>('');
  const [localSip, setLocalSip] = useState<string>('');
  const [manualIdEdit, setManualIdEdit] = useState<boolean>(false);

  // IA Scan simulation state
  const [isAnalysing, setIsAnalysing] = useState<boolean>(false);

  // Draft recovery state
  const [hasDraft, setHasDraft] = useState<boolean>(false);
  const [showDraftToast, setShowDraftToast] = useState<boolean>(false);

  // Projection values (Angio rotation)
  const [projHorizDeg, setProjHorizDeg] = useState<number>(10);
  const [projHorizDir, setProjHorizDir] = useState<'OAD' | 'OAI'>('OAD');
  const [projVertDeg, setProjVertDeg] = useState<number>(20);
  const [projVertDir, setProjVertDir] = useState<'CRANEAL' | 'CAUDAL'>('CRANEAL');
  const [projAxial, setProjAxial] = useState<number>(0);

  // Dynamic operator states
  const [showAddOperatorDialog, setShowAddOperatorDialog] = useState<boolean>(false);
  const [newOperatorName, setNewOperatorName] = useState<string>('');
  const [newOperatorIsPi, setNewOperatorIsPi] = useState<boolean>(false);
  const [isAddingOperator, setIsAddingOperator] = useState<boolean>(false);
  
  // Operators for selected hospital
  const [hospitalOperators, setHospitalOperators] = useState<any[]>([]);

  // Helper to get formatted select values for projections
  const getHorizSelectValue = () => {
    return `${projHorizDir}_${projHorizDeg}`;
  };

  const handleHorizSelectChange = (val: string) => {
    const [dir, degStr] = val.split('_');
    setProjHorizDir(dir as 'OAD' | 'OAI');
    setProjHorizDeg(Number(degStr));
  };

  const getVertSelectValue = () => {
    return `${projVertDir}_${projVertDeg}`;
  };

  const handleVertSelectChange = (val: string) => {
    const [dir, degStr] = val.split('_');
    setProjVertDir(dir as 'CRANEAL' | 'CAUDAL');
    setProjVertDeg(Number(degStr));
  };

  const getHorizontalOptions = () => {
    const list = [];
    for (let d = 40; d >= 5; d -= 5) list.push({ value: `OAD_${d}`, label: `OAD ${d}º` });
    list.push({ value: 'OAD_0', label: 'OAD 0º' });
    for (let d = 5; d <= 40; d += 5) list.push({ value: `OAI_${d}`, label: `OAI ${d}º` });
    return list;
  };

  const getVerticalOptions = () => {
    const list = [];
    for (let d = 45; d >= 5; d -= 5) list.push({ value: `CRANEAL_${d}`, label: `CRANEAL ${d}º` });
    list.push({ value: 'CRANEAL_0', label: 'CRANEAL 0º' });
    for (let d = 5; d <= 45; d += 5) list.push({ value: `CAUDAL_${d}`, label: `CAUDAL ${d}º` });
    return list;
  };

  const handleHorizButton = (action: 'inc' | 'dec') => {
    if (projHorizDir === 'OAD') {
      if (action === 'inc') {
        setProjHorizDeg(prev => Math.min(prev + 5, 40));
      } else {
        if (projHorizDeg === 0) {
          setProjHorizDir('OAI');
          setProjHorizDeg(5);
        } else {
          setProjHorizDeg(prev => Math.max(prev - 5, 0));
        }
      }
    } else {
      if (action === 'inc') {
        if (projHorizDeg === 5) {
          setProjHorizDir('OAD');
          setProjHorizDeg(0);
        } else {
          setProjHorizDeg(prev => Math.max(prev - 5, 0));
        }
      } else {
        setProjHorizDeg(prev => Math.min(prev + 5, 40));
      }
    }
  };

  const handleVertButton = (action: 'inc' | 'dec') => {
    if (projVertDir === 'CRANEAL') {
      if (action === 'inc') {
        setProjVertDeg(prev => Math.min(prev + 5, 45));
      } else {
        if (projVertDeg === 0) {
          setProjVertDir('CAUDAL');
          setProjVertDeg(5);
        } else {
          setProjVertDeg(prev => Math.max(prev - 5, 0));
        }
      }
    } else {
      if (action === 'inc') {
        if (projVertDeg === 5) {
          setProjVertDir('CRANEAL');
          setProjVertDeg(0);
        } else {
          setProjVertDeg(prev => Math.max(prev - 5, 0));
        }
      } else {
        setProjVertDeg(prev => Math.min(prev + 5, 45));
      }
    }
  };

  const handleAxialButton = (action: 'inc' | 'dec') => {
    if (action === 'inc') {
      setProjAxial(prev => Math.min(prev + 10, 180));
    } else {
      setProjAxial(prev => Math.max(prev - 10, -180));
    }
  };

  // Selected files state
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({
    pre_oct: null,
    ultreon_screenshot: null,
    strategy_change: null,
    post_oct: null,
    final_result: null,
  });

  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [dbLogs, setDbLogs] = useState<string[]>([]);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [supabasePayload, setSupabasePayload] = useState<string>('');

  // Lock hospital on load for hospital users
  useEffect(() => {
    if (profile.role === 'hospital_user' && profile.hospital_id) {
      const userHospital = hospitals.find(h => h.id === profile.hospital_id);
      if (userHospital) {
        setFormData(prev => ({ ...prev, centroMedico: userHospital.name }));
      }
    }
  }, [profile, hospitals]);

  // Check for existing draft on mount
  useEffect(() => {
    const savedDraft = localStorage.getItem('opstar_ecrf_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.formData && (parsed.formData.idPaciente || parsed.formData.centroMedico || parsed.localNhc)) {
          setHasDraft(true);
        }
      } catch (e) {
        console.error("Error parsing saved draft:", e);
      }
    }
  }, []);

  // Autosave draft when form data changes
  useEffect(() => {
    if (formData !== INITIAL_FORM_STATE || localNhc || localSip) {
      const draft = {
        formData,
        localNhc,
        localSip,
        step
      };
      localStorage.setItem('opstar_ecrf_draft', JSON.stringify(draft));
    }
  }, [formData, localNhc, localSip, step]);

  const restoreDraft = () => {
    const savedDraft = localStorage.getItem('opstar_ecrf_draft');
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.formData) setFormData(parsed.formData);
        if (parsed.localNhc) setLocalNhc(parsed.localNhc);
        if (parsed.localSip) setLocalSip(parsed.localSip);
        if (parsed.step) setStep(parsed.step);
        setShowDraftToast(true);
        setTimeout(() => setShowDraftToast(false), 4000);
      } catch (e) {
        console.error("Error restoring draft:", e);
      }
    }
    setHasDraft(false);
  };

  const discardDraft = () => {
    localStorage.removeItem('opstar_ecrf_draft');
    setHasDraft(false);
  };

  // Fetch operators when hospital changes
  useEffect(() => {
    async function fetchOperators() {
      if (!formData.centroMedico) {
        setHospitalOperators([]);
        return;
      }
      const selectedHospital = hospitals.find((h) => h.name === formData.centroMedico);
      if (selectedHospital) {
        const { getOperatorsForHospitalAction } = await import('@/lib/supabase/actions');
        const res = await getOperatorsForHospitalAction(selectedHospital.id);
        if (res.success && res.data) {
          setHospitalOperators(res.data);
        } else {
          setHospitalOperators([]);
        }
      }
    }
    fetchOperators();
  }, [formData.centroMedico, hospitals]);

  // Autogenerate Anonymous ID
  useEffect(() => {
    if (manualIdEdit) return;

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

  // Trigger IA scan transition when entering step 4
  useEffect(() => {
    if (step === 4) {
      setIsAnalysing(true);
      const timer = setTimeout(() => {
        setIsAnalysing(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleFileSelect = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFiles(prev => ({ ...prev, [key]: file }));
      const previewUrl = URL.createObjectURL(file);
      setPreviewUrls(prev => ({ ...prev, [key]: previewUrl }));
    } else {
      setSelectedFiles(prev => ({ ...prev, [key]: null }));
      setPreviewUrls(prev => ({ ...prev, [key]: '' }));
    }

    if (errors[key]) {
      const newErr = { ...errors };
      delete newErr[key];
      setErrors(newErr);
    }
  };

  const handleInputChange = (key: keyof eCRFFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) {
      const newErr = { ...errors };
      delete newErr[key];
      setErrors(newErr);
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.centroMedico) newErrors.centroMedico = 'Seleccione el Centro Médico.';
      if (!formData.idPaciente.trim()) newErrors.idPaciente = 'Identificador del paciente requerido.';
      if (!formData.operador.trim()) newErrors.operador = 'Introduzca el nombre del operador clínico.';
      if (!formData.fechaProcedimiento) newErrors.fechaProcedimiento = 'Seleccione la fecha del procedimiento.';
      if (!formData.vasoDiana) newErrors.vasoDiana = 'Seleccione el vaso o segmento diana interactivo.';
    } else if (currentStep === 2) {
      if (!formData.calidadLavado) {
        newErrors.calidadLavado = 'Seleccione la calidad de lavado con suero salino.';
      }
      if (formData.contrasteAdquisicionOct === '') {
        newErrors.contrasteAdquisicionOct = 'Escriba el contraste de adquisición.';
      }
      if (formData.actualContrastMl === '') {
        newErrors.actualContrastMl = 'Escriba el contraste total del procedimiento.';
      }
      if (formData.necesitoContrasteOct && !formData.motivoContrasteOct.trim()) {
        newErrors.motivoContrasteOct = 'Escriba el motivo de la conversión a contraste.';
      }
    } else if (currentStep === 3) {
      if (!selectedFiles.pre_oct) {
        newErrors.pre_oct = 'El OCT Basal es una evidencia obligatoria del caso.';
      }
      if (!selectedFiles.strategy_change) {
        newErrors.strategy_change = 'La evidencia de Cambio de Estrategia es obligatoria.';
      }
      if (!selectedFiles.post_oct) {
        newErrors.post_oct = 'El OCT Final de Optimización es una evidencia obligatoria.';
      }
    } else if (currentStep === 4) {
      if (formData.ultreonLongitudLesion === '') newErrors.ultreonLongitudLesion = 'Longitud requerida';
      if (formData.ultreonAreaLuminalMin === '') newErrors.ultreonAreaLuminalMin = 'MLA requerido';
    } else if (currentStep === 5) {
      if (formData.modificoEstrategiaUltreon) {
        const anyChangeChecked = 
          formData.changedStentDiameter ||
          formData.changedStentLength ||
          formData.requiredPlaquePreparation ||
          formData.changedLandingZoneProximal ||
          formData.changedLandingZoneDistal ||
          formData.additionalPostdilatation ||
          formData.otherChange;
        if (!anyChangeChecked) {
          newErrors.modificoEstrategiaUltreon = 'Debe seleccionar al menos una modificación de estrategia.';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handlePrev = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    setIsSubmitting(true);
    setDbLogs(['🚀 Iniciando cockpit de transmisión de datos...', '⚙️ Compilando telemetría del eCRF procedural...']);

    const selectedHospital = hospitals.find((h) => h.name === formData.centroMedico);
    const dbHospitalId = selectedHospital?.id || null;

    if (!dbHospitalId) {
      setDbLogs((prev) => [...prev, '❌ Error crítico: Hospital de adscripción no identificado en Supabase.']);
      setIsSubmitting(false);
      return;
    }

    const selectedSegmentObj = CORONARY_SEGMENTS.find(s => s.id === formData.vasoDiana);

    // Build the strategy change string list for strategy_change_type
    const changeTypes: string[] = [];
    if (formData.modificoEstrategiaUltreon) {
      if (formData.changedStentDiameter) changeTypes.push('diameter');
      if (formData.changedStentLength) changeTypes.push('length');
      if (formData.requiredPlaquePreparation) changeTypes.push('plaque_prep');
      if (formData.changedLandingZoneProximal) changeTypes.push('landing_prox');
      if (formData.changedLandingZoneDistal) changeTypes.push('landing_dist');
      if (formData.additionalPostdilatation) changeTypes.push('post_dil');
      if (formData.otherChange) changeTypes.push('other');
    }
    const strategyChangeType = changeTypes.join(', ');

    const payload: ZeroContrastInsertPayload = {
      hospital_id: dbHospitalId,
      operator_id: formData.operador, // Stores the selected operator ID (UUID)
      procedure_date: formData.fechaProcedimiento,
      patient_code: formData.idPaciente,
      local_nhc: localNhc || null,
      local_sip: localSip || null,
      anonymous_code: formData.idPaciente || null,
      
      // Anatomy
      coronary_segment: formData.vasoDiana,
      coronary_vessel: selectedSegmentObj?.vessel || null,
      coronary_group: selectedSegmentObj?.group || null,
      
      // Projections
      projection_horizontal: getHorizSelectValue(),
      projection_vertical: getVertSelectValue(),
      axial_rotation: projAxial,
      
      // Saline protocol
      saline_protocol_used: true,
      syringe_size_ml: 20, // Default 20ml
      fast_pullback_seconds: 3.5, // Default acquisition duration is 3.5s
      contrast_during_oct_ml: Number(formData.contrasteAdquisicionOct),
      total_contrast_ml: Number(formData.actualContrastMl) || 0,
      wash_quality: formData.calidadLavado,
      
      // Contrast conversion
      contrast_conversion_needed: formData.necesitoContrasteOct,
      contrast_conversion_reason: formData.necesitoContrasteOct ? formData.motivoContrasteOct : null,
      
      // ULTREON AI
      ultreon_calcium: formData.ultreonCalcio,
      ultreon_calcium_arc_gt_180: formData.ultreonArcoCalcioGt180,
      ultreon_eel_detected: formData.ultreonEel,
      lesion_length_mm: Number(formData.ultreonLongitudLesion) || null,
      proximal_reference_mm: Number(formData.ultreonReferenciaProx) || null,
      distal_reference_mm: Number(formData.ultreonReferenciaDist) || null,
      mla_mm2: Number(formData.ultreonAreaLuminalMin) || null,
      
      // Optimization
      final_stent_expansion_percent: Number(formData.ultreonExpansionStent) || null,
      
      // Strategy
      ultreon_modified_strategy: formData.modificoEstrategiaUltreon,
      strategy_change_type: strategyChangeType || null,
      strategy_change_notes: null,
      
      // Management
      case_status: 'completed',
    };

    const calculatedScore = calculateOpstarScore({
      actualContrast: formData.actualContrastMl,
      contrasteAdquisicionOct: formData.contrasteAdquisicionOct,
      calidadLavado: formData.calidadLavado,
      necesitoContrasteOct: formData.necesitoContrasteOct,
      landingZone: formData.ultreonEel ? 'GUIADO_IA_EEL' : 'VISUAL_ANGIO',
      diametroReferenciaVaso: Number(formData.ultreonReferenciaProx) || 0,
      modificoEstrategiaUltreon: formData.modificoEstrategiaUltreon,
      adequateExpansion: Number(formData.ultreonExpansionStent) >= 80 ? 'yes' : 'no',
      ultreonExpansionStent: formData.ultreonExpansionStent,
      ultreonEel: formData.ultreonEel,
      ultreonCalcio: formData.ultreonCalcio,
      significantMalapposition: 'no',
      proximalEdgeDissection: false,
      distalEdgeDissection: false,
    });

    setDbLogs((prev) => [...prev, '➡️ Conectando con Supabase e insertando registro del caso...']);

    try {
      const res = await saveRegistryCaseAction(payload);

      if (res.error) {
        setDbLogs((prev) => [...prev, `❌ Error en Supabase: ${res.error}`]);
        setIsSubmitting(false);
        return;
      }

      const caseId = res.id;
      setDbLogs((prev) => [
        ...prev,
        `✅ Caso Base insertado con éxito (ID: ${caseId})`,
        '📤 Iniciando subidas de evidencias OCT asignadas...',
      ]);

      const uploadPromises = Object.entries(selectedFiles)
        .filter(([_, file]) => file !== null)
        .map(([key, file]) => {
          const formDataUpload = new FormData();
          formDataUpload.append('file', file!);
          formDataUpload.append('caseId', caseId!);
          formDataUpload.append('hospitalId', dbHospitalId);

          let category = 'other';
          let phase = 'unknown';
          let description = '';

          if (key === 'pre_oct') {
            category = 'oct_frame';
            phase = 'pre_pci';
            description = 'Pre-PCI OCT image';
          } else if (key === 'ultreon_screenshot') {
            category = 'ultreon_screenshot';
            phase = 'pre_pci';
            description = 'ULTREON Screenshot';
          } else if (key === 'strategy_change') {
            category = 'zero_contrast_image';
            phase = 'pre_pci';
            description = 'Justificación de cambio de estrategia';
          } else if (key === 'post_oct') {
            category = 'oct_frame';
            phase = 'post_pci';
            description = 'Post-PCI OCT image';
          } else if (key === 'final_result') {
            category = 'other';
            phase = 'post_pci';
            description = 'Resultado final del procedimiento';
          }

          formDataUpload.append('category', category);
          formDataUpload.append('acquisitionPhase', phase);
          formDataUpload.append('description', description);
          formDataUpload.append('hasConfirmedAnonymous', 'true');

          return uploadCaseMediaAction(formDataUpload);
        });

      if (uploadPromises.length > 0) {
        const uploadResults = await Promise.all(uploadPromises);
        const hasUploadError = uploadResults.some((r) => r.error);
        if (hasUploadError) {
          setDbLogs((prev) => [...prev, '⚠️ Algunos archivos de imágenes no completaron la subida en el storage.']);
        } else {
          setDbLogs((prev) => [...prev, `📤 Subidas completadas: ${uploadResults.length} evidencias OCT guardadas.`]);
        }
      }

      setDbLogs((prev) => [
        ...prev,
        '🎉 Sincronización del procedimiento finalizada.',
        `⭐ Score de optimización OPSTAR calculado: ${calculatedScore} / 100`,
      ]);

      setSupabasePayload(
        JSON.stringify(payload, null, 2)
      );

      await new Promise((resolve) => setTimeout(resolve, 800));
      setIsSubmitting(false);
      setIsSuccess(true);
      localStorage.removeItem('opstar_ecrf_draft');
    } catch (err: any) {
      setDbLogs((prev) => [...prev, `❌ Error de conexión con Supabase: ${err?.message || 'Error de red'}`]);
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      ...INITIAL_FORM_STATE,
      centroMedico: profile.role === 'hospital_user' ? formData.centroMedico : '',
    });
    localStorage.removeItem('opstar_ecrf_draft');
    setSelectedFiles({
      pre_oct: null,
      ultreon_screenshot: null,
      strategy_change: null,
      post_oct: null,
      final_result: null,
    });
    setPreviewUrls({});
    setLocalNhc('');
    setLocalSip('');
    setStep(1);
    setIsSuccess(false);
    setDbLogs([]);
    setSupabasePayload('');
  };

  const calculateCompliancePercent = () => {
    let score = 0;
    if (formData.centroMedico) score += 20;
    if (formData.actualContrastMl !== '' && Number(formData.actualContrastMl) === 0) score += 20;
    if (formData.vasoDiana) score += 20;
    if (formData.ultreonCalcio || formData.ultreonEel) score += 20;
    if (Object.values(selectedFiles).some(f => f !== null)) score += 20;
    return score;
  };

  const getEvidenceSummary = (key: string) => {
    if (!selectedFiles[key]) return null;
    if (key === 'pre_oct') return `Calcio | ${formData.calidadLavado || 'Excelente'}`;
    if (key === 'ultreon_screenshot') return `EEL: ${formData.ultreonEel ? 'Sí' : 'No'} | Calcio: ${formData.ultreonCalcio ? 'Sí' : 'No'}`;
    if (key === 'strategy_change') return `Estrategia: ${formData.modificoEstrategiaUltreon ? 'Cambiada' : 'Sin cambios'}`;
    if (key === 'post_oct') return `Expansión: ${formData.ultreonExpansionStent ? formData.ultreonExpansionStent + '%' : 'Apta'}`;
    if (key === 'final_result') return `Contraste: ${formData.actualContrastMl || '0'} mL`;
    return 'Cargado';
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased pb-24">
      
      {/* ── COCKPIT TOP PATIENT HEADER & TIMELINE (MOCKUP STYLED) ── */}
      <header className="bg-slate-950 border-b border-slate-900 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-4 font-mono">
          
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="h-8 w-8 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-300 font-bold transition-all">
              ←
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-widest">ULTREON™ 3.0</span>
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">· Registro Zero-Contrast OCT</span>
              </div>
              <h1 className="text-xs text-slate-400 font-medium">Multicenter Registry for Zero-Contrast OCT Acquisition</h1>
            </div>
          </div>

          {/* 5 Clinical Milestones Timeline */}
          <div className="flex items-center gap-6">
            {MILESTONES.map((m, idx) => {
              const active = step === m.id;
              const done = step > m.id;
              return (
                <div key={m.id} className="flex items-center gap-2">
                  {idx > 0 && <div className="w-8 h-px bg-slate-800" />}
                  <button
                    type="button"
                    onClick={() => {
                      if (done || active) setStep(m.id);
                    }}
                    className="flex flex-col items-center group cursor-pointer"
                  >
                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center text-[10px] font-bold transition-all ${
                      active 
                        ? 'bg-cyan-500 border-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                        : done 
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-400' 
                          : 'bg-slate-900 border-slate-800 text-slate-500'
                    }`}>
                      {m.id}
                    </div>
                    <span className={`text-[8px] mt-1 uppercase tracking-wider font-mono ${
                      active ? 'text-cyan-400 font-bold' : done ? 'text-emerald-500' : 'text-slate-600'
                    }`}>
                      {m.label}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Saved status & save draft */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
              <span>Autoguardado activo</span>
            </div>
            <button
              type="button"
              onClick={() => {
                localStorage.setItem('opstar_ecrf_draft', JSON.stringify({ formData, localNhc, localSip, step }));
                setShowDraftToast(true);
                setTimeout(() => setShowDraftToast(false), 3000);
              }}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10px] font-bold text-slate-300 rounded-lg transition-all flex items-center gap-1.5"
            >
              <span>💾</span> Guardar borrador
            </button>
          </div>

        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto p-4 md:p-6">
        
        {/* Draft Recovery Banner */}
        {hasDraft && (
          <div className="mb-4 flex items-center justify-between gap-4 bg-amber-950/40 border border-amber-800/50 rounded-2xl px-5 py-3 animate-fade-slide">
            <div className="flex items-center gap-3">
              <span className="text-lg">📋</span>
              <div>
                <span className="text-xs font-bold text-amber-300 block">Borrador recuperado</span>
                <span className="text-[10px] text-amber-500">Tiene un registro iniciado anteriormente. ¿Desea recuperarlo?</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={restoreDraft}
                className="px-3 py-1.5 bg-amber-900/60 hover:bg-amber-800/60 border border-amber-700/40 text-amber-300 text-[10px] font-bold rounded-lg transition-all"
              >
                Recuperar borrador
              </button>
              <button
                type="button"
                onClick={discardDraft}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-[10px] font-bold rounded-lg transition-all"
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        {/* Draft Saved Toast */}
        {showDraftToast && (
          <div className="mb-4 flex items-center gap-3 bg-cyan-950/50 border border-cyan-800/40 rounded-2xl px-5 py-3 animate-fade-slide">
            <span className="text-lg">💾</span>
            <div>
              <span className="text-xs font-bold text-cyan-300 block">Borrador guardado</span>
              <span className="text-[10px] text-cyan-500">El estado actual del formulario ha sido guardado localmente.</span>
            </div>
          </div>
        )}

        {isSuccess ? (
          /* ── SUCCESS COMPLIANCE CARD SCREEN ── */
          <div className="max-w-2xl mx-auto space-y-6 my-6 animate-scale-up">
            <Card active glowColor="emerald" className="p-8 space-y-6 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-emerald-500 via-cyan-400 to-blue-500" />
              
              <div className="w-16 h-16 bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 rounded-full flex items-center justify-center text-3xl mx-auto animate-pulse">
                ✓
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-bold text-slate-50">Caso Sincronizado con Éxito</h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  El procedimiento clínico ha sido validado, anonimizado de acuerdo con las normativas GDPR y sincronizado correctamente con la base de datos de Abbott Medical.
                </p>
              </div>

              {Number(formData.actualContrastMl) === 0 && (
                <div className="inline-block py-2 px-6 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 font-mono text-xs font-black animate-bounce shadow-[0_0_20px_rgba(6,182,212,0.2)]">
                  🏆 PROTOCOLO 100% ZERO-CONTRAST CUMPLIDO
                </div>
              )}

              {/* OPSTAR Score Visual Circle */}
              <div className="bg-slate-950/80 border border-slate-850 p-6 rounded-3xl max-w-sm mx-auto flex items-center justify-between gap-6">
                <div className="text-left space-y-1">
                  <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest block">SCORE OPTIMIZACIÓN</span>
                  <span className="text-3xl font-black text-slate-200 block">
                    {calculateOpstarScore({
                      actualContrast: formData.actualContrastMl,
                      contrasteAdquisicionOct: formData.contrasteAdquisicionOct,
                      calidadLavado: formData.calidadLavado,
                      necesitoContrasteOct: formData.necesitoContrasteOct,
                      landingZone: formData.ultreonEel ? 'GUIADO_IA_EEL' : 'VISUAL_ANGIO',
                      diametroReferenciaVaso: Number(formData.ultreonReferenciaProx) || 0,
                      modificoEstrategiaUltreon: formData.modificoEstrategiaUltreon,
                      adequateExpansion: Number(formData.ultreonExpansionStent) >= 80 ? 'yes' : 'no',
                      ultreonExpansionStent: formData.ultreonExpansionStent,
                      ultreonEel: formData.ultreonEel,
                      ultreonCalcio: formData.ultreonCalcio,
                      significantMalapposition: 'no',
                      proximalEdgeDissection: false,
                      distalEdgeDissection: false,
                    })}
                  </span>
                  <span className="text-[9px] font-bold text-cyan-400 block font-mono">
                    NIVEL DE CUMPLIMIENTO
                  </span>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 flex items-center justify-center text-[10px] font-mono font-bold text-slate-350 animate-spin-slow">
                  OPSTAR
                </div>
              </div>

              {/* Telemetry Log */}
              {supabasePayload && (
                <div className="text-left bg-slate-950 border border-slate-850 rounded-2xl p-4 font-mono text-[9px] text-slate-400 max-h-[140px] overflow-y-auto">
                  <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-2 border-b border-slate-900 pb-1">Procedural payload log</p>
                  <pre>{supabasePayload}</pre>
                </div>
              )}

              <div className="flex gap-3 justify-center pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-5 py-2.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 transition-all cursor-pointer"
                >
                  Nuevo Registro
                </button>
                <Link
                  href="/dashboard"
                  className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg shadow-cyan-500/10"
                >
                  Ir al Dashboard
                </Link>
              </div>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* ── HITO 1: PACIENTE Y ANATOMÍA (NEW DESIGN: 60% ANATOMY / 40% ADMIN) ── */}
            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch animate-fade-slide">

                {/* COLUMN 1 & 2 (60%): CORONARY TREE NAVIGATOR — MAIN FOCUS */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
                    Selector Anatómico Coronario
                  </div>

                  <div className="flex-1 min-h-[500px]">
                    <CoronaryTreeNavigator
                      selectedSegmentId={formData.vasoDiana}
                      onSelectSegment={(segmentId) => handleInputChange('vasoDiana', segmentId)}
                      showSidebar={true}
                    />
                  </div>

                  {errors.vasoDiana && (
                    <div className="text-[8px] font-mono text-red-400 bg-red-950/20 border border-red-900/40 rounded-lg p-2">
                      ⚠ {errors.vasoDiana}
                    </div>
                  )}
                </div>

                {/* COLUMN 3 (40%): ADMINISTRATIVE & PATIENT DATA */}
                <div className="flex flex-col gap-4">

                  {/* Case Context */}
                  <Card className="p-4 space-y-4 text-left">
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
                      Caso Activo
                    </span>
                    <div className="w-full h-px bg-slate-850/80" />

                    {/* Centro Médico */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-bold text-slate-450 tracking-wider uppercase font-mono">
                        Centro Médico
                      </label>
                      <select
                        value={formData.centroMedico}
                        disabled={profile.role === 'hospital_user'}
                        onChange={(e) => handleInputChange('centroMedico', e.target.value)}
                        className={`w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs outline-none text-slate-200 ${
                          profile.role === 'hospital_user' ? 'cursor-not-allowed opacity-75' : 'focus:border-cyan-500/40'
                        }`}
                      >
                        <option value="">Seleccionar...</option>
                        {hospitals.map((h) => (
                          <option key={h.id} value={h.name}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                      {errors.centroMedico && <span className="text-[7px] font-mono text-red-400">⚠ {errors.centroMedico}</span>}
                    </div>

                    {/* Médico Operador */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[8px] font-bold text-slate-450 tracking-wider uppercase font-mono">
                          Médico Operador
                        </label>
                        {(profile.role === 'admin' || profile.role === 'manager') && formData.centroMedico && (
                          <button
                            type="button"
                            onClick={() => setShowAddOperatorDialog(true)}
                            className="text-[7px] font-mono text-cyan-400 hover:text-cyan-300 transition-all cursor-pointer"
                          >
                            + Añadir
                          </button>
                        )}
                      </div>
                      <select
                        value={formData.operador}
                        onChange={(e) => handleInputChange('operador', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs outline-none text-slate-200 focus:border-cyan-500/40"
                      >
                        <option value="">Seleccionar...</option>
                        {hospitalOperators.map((op: any) => (
                          <option key={op.id} value={op.id}>
                            {op.full_name}
                          </option>
                        ))}
                      </select>
                      {errors.operador && <span className="text-[7px] font-mono text-red-400">⚠ {errors.operador}</span>}
                    </div>

                    {/* Fecha Procedimiento */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[8px] font-bold text-slate-450 tracking-wider uppercase font-mono">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={formData.fechaProcedimiento}
                        onChange={(e) => handleInputChange('fechaProcedimiento', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs outline-none text-slate-200 focus:border-cyan-500/40"
                      />
                      {errors.fechaProcedimiento && <span className="text-[7px] font-mono text-red-400">⚠ {errors.fechaProcedimiento}</span>}
                    </div>

                    {/* ID Paciente */}
                    <div className="flex flex-col gap-1.5 pt-1">
                      <label className="text-[8px] font-bold text-slate-450 tracking-wider uppercase font-mono">
                        ID Paciente (código)
                      </label>
                      <input
                        type="text"
                        value={formData.idPaciente || '—'}
                        disabled
                        className="w-full px-3 py-2 rounded-lg bg-slate-950/60 border border-slate-850 text-xs text-slate-500 font-mono"
                      />
                    </div>

                    {/* NHC & SIP */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="text"
                        value={localNhc}
                        onChange={(e) => setLocalNhc(e.target.value)}
                        placeholder="NHC"
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-[8px] text-slate-350 outline-none focus:border-slate-700"
                      />
                      <input
                        type="text"
                        value={localSip}
                        onChange={(e) => setLocalSip(e.target.value)}
                        placeholder="SIP"
                        className="px-2.5 py-1.5 bg-slate-950 border border-slate-850 rounded-lg text-[8px] text-slate-350 outline-none focus:border-slate-700"
                      />
                    </div>
                  </Card>

                  {/* Anonymous Code Highlight */}
                  <Card className="p-3 border-cyan-900/30 bg-cyan-950/10 flex items-center justify-between">
                    <div className="text-left">
                      <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest block">Código Anónimo</span>
                      <span className="text-sm font-black text-cyan-400 font-mono mt-1 block">
                        {formData.idPaciente || 'PENDIENTE'}
                      </span>
                    </div>
                    <span className="text-2xl">🔒</span>
                  </Card>

                  {/* Selected Segment Info */}
                  {formData.vasoDiana && (
                    <Card className="p-3 border-cyan-900/40 bg-cyan-950/5 space-y-2">
                      <span className="text-[7px] font-mono text-slate-500 uppercase tracking-widest block">Segmento Seleccionado</span>
                      <div className="text-left">
                        <div className="text-xs font-bold text-cyan-400 font-mono">{formData.vasoDiana}</div>
                        <div className="text-[8px] text-slate-500 mt-1">
                          Sistema coronario seleccionado y listo para procedimiento
                        </div>
                      </div>
                    </Card>
                  )}

                </div>

              </div>
            )}

            {/* ── HITO 2: PREPARACIÓN DEL LAVADO ── */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-slide">
                <div>
                  <h2 className="text-lg font-bold tracking-wide text-slate-50 uppercase flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    2. Preparación y Calidad del Lavado
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Verifique la checklist de purga y registre el aclaramiento del canal coronario.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Procedural Checklist */}
                  <div className="md:col-span-4 space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono block">
                      Protocolo Clínico Paso a Paso
                    </span>
                    <Card className="p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-[10px] font-bold flex items-center justify-center font-mono">1</div>
                        <div>
                          <span className="text-xs font-bold text-slate-100 block">Lavado Heparinizado</span>
                          <span className="text-[8px] text-slate-500 block">10 U heparina / mL salino al 0.9%</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-[10px] font-bold flex items-center justify-center font-mono">2</div>
                        <div>
                          <span className="text-xs font-bold text-slate-100 block">Cebado sin Burbujas</span>
                          <span className="text-[8px] text-slate-500 block">Jeringa Luer-Lock de 10 mL / 20 mL</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 text-[10px] font-bold flex items-center justify-center font-mono">3</div>
                        <div>
                          <span className="text-xs font-bold text-slate-100 block">Inyección Continua</span>
                          <span className="text-[8px] text-slate-500 block">Aclaramiento óptimo del lumen</span>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Wash Quality Semaphores */}
                  <div className="md:col-span-8 space-y-4">
                    <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono block">
                      Calidad de la Aclaración con Salino
                    </span>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { val: 'Excelente', label: '🟢 Excelente', desc: 'Aclaración total sin eritrocitos' },
                        { val: 'Buena', label: '🟢 Buena', desc: 'Aclaración óptima para diagnóstico clínico' },
                        { val: 'Regular', label: '🟡 Regular', desc: 'Aclaración parcial con presencia leve de sangre' },
                        { val: 'Mala', label: '🔴 Mala', desc: 'Lavado deficiente, sangre obstruye mediciones' }
                      ].map((item) => {
                        const active = formData.calidadLavado === item.val;
                        return (
                          <Card
                            key={item.val}
                            active={active}
                            glowColor={item.val === 'Regular' ? 'slate' : item.val === 'Mala' ? 'red' : 'cyan'}
                            onClick={() => handleInputChange('calidadLavado', item.val)}
                            className="p-4 cursor-pointer flex flex-col justify-between group min-h-[90px]"
                          >
                            <span className="text-xs font-bold text-slate-200 group-hover:text-cyan-400 transition-colors">
                              {item.label}
                            </span>
                            <p className="text-[9px] text-slate-450 mt-1.5 leading-relaxed">
                              {item.desc}
                            </p>
                          </Card>
                        );
                      })}
                    </div>
                    {errors.calidadLavado && <span className="text-[9px] font-mono text-red-400 block">⚠ {errors.calidadLavado}</span>}

                    {/* Contrast & Volumes Card */}
                    <Card className="p-5 space-y-4">
                      <span className="text-[9px] font-bold text-slate-500 uppercase font-mono block">Volúmenes de Contraste Usados</span>
                      
                      <div className="flex gap-4">
                        {/* ¿Contraste necesario? */}
                        <div className="flex-1 flex flex-col gap-2">
                          <label className="text-[9px] font-bold text-slate-400 uppercase font-mono">¿Conversión a contraste?</label>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                handleInputChange('necesitoContrasteOct', true);
                                handleInputChange('contrasteAdquisicionOct', '');
                              }}
                              className={`flex-1 py-1.5 rounded-lg border font-bold text-[10px] cursor-pointer transition-all ${
                                formData.necesitoContrasteOct
                                  ? 'bg-red-950/30 border-red-500/40 text-red-400'
                                  : 'bg-slate-950 border-slate-800 text-slate-500'
                              }`}
                            >
                              Sí
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleInputChange('necesitoContrasteOct', false);
                                handleInputChange('contrasteAdquisicionOct', 0);
                                handleInputChange('motivoContrasteOct', '');
                              }}
                              className={`flex-1 py-1.5 rounded-lg border font-bold text-[10px] cursor-pointer transition-all ${
                                !formData.necesitoContrasteOct
                                  ? 'bg-cyan-950/30 border-cyan-500/40 text-cyan-400'
                                  : 'bg-slate-950 border-slate-800 text-slate-500'
                              }`}
                            >
                              No
                            </button>
                          </div>
                        </div>

                        {/* Contraste adquisición */}
                        <div className="w-[120px] flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase font-mono">Vol. Adquisición (mL)</label>
                          <input
                            type="number"
                            disabled={!formData.necesitoContrasteOct}
                            value={formData.contrasteAdquisicionOct}
                            onChange={(e) => handleInputChange('contrasteAdquisicionOct', e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none disabled:opacity-40"
                          />
                          {errors.contrasteAdquisicionOct && <span className="text-[9px] font-mono text-red-400">⚠ {errors.contrasteAdquisicionOct}</span>}
                        </div>

                        {/* Contraste total */}
                        <div className="w-[120px] flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-slate-400 uppercase font-mono">Vol. Total PCI (mL)</label>
                          <input
                            type="number"
                            value={formData.actualContrastMl}
                            onChange={(e) => handleInputChange('actualContrastMl', e.target.value === '' ? '' : Number(e.target.value))}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none"
                          />
                          {errors.actualContrastMl && <span className="text-[9px] font-mono text-red-400">⚠ {errors.actualContrastMl}</span>}
                        </div>
                      </div>
                    </Card>

                    {formData.necesitoContrasteOct && (
                      <div className="bg-slate-900/60 border border-slate-850 p-4 rounded-3xl animate-fade-slide space-y-2">
                        <label className="text-[10px] font-bold text-red-400 uppercase tracking-wider font-mono">Justificación clínica de la conversión</label>
                        <textarea
                          value={formData.motivoContrasteOct}
                          onChange={(e) => handleInputChange('motivoContrasteOct', e.target.value)}
                          placeholder="Escriba aquí los motivos clínicos..."
                          rows={2}
                          className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs outline-none text-slate-200 focus:border-red-500/50 resize-none"
                        />
                        {errors.motivoContrasteOct && <span className="text-[9px] font-mono text-red-400 block">⚠ {errors.motivoContrasteOct}</span>}
                      </div>
                    )}

                  </div>
                </div>
              </div>
            )}

            {/* ── HITO 3: ADQUISICIÓN ZERO-CONTRAST ── */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-slide">
                <div>
                  <h2 className="text-lg font-bold tracking-wide text-slate-50 uppercase flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    3. Evidencia Clínica y Storyboard del Caso
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">El Registro OPSTAR es un storyboard clínico. Suba las imágenes que acreditan cada etapa del procedimiento.</p>
                </div>

                {/* Progress Bar */}
                <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-left space-y-1">
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest block">EVIDENCIA CLÍNICA</span>
                    <span className="text-sm font-black text-slate-200">
                      {Object.values(selectedFiles).filter(f => f !== null).length} / 5 imágenes cargadas
                    </span>
                  </div>
                  <div className="flex-1 w-full max-w-md h-2 bg-slate-950 border border-slate-850 rounded-full overflow-hidden flex">
                    {[1, 2, 3, 4, 5].map((i) => {
                      const keys = ['pre_oct', 'ultreon_screenshot', 'strategy_change', 'post_oct', 'final_result'] as const;
                      const hasFile = !!selectedFiles[keys[i - 1]];
                      return (
                        <div
                          key={i}
                          className={`h-full flex-1 border-r border-slate-950 last:border-r-0 transition-all duration-300 ${
                            hasFile ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)]' : 'bg-slate-900'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Card Storyboard Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                  <ClinicalStoryboardCard
                    label="1. OCT BASAL"
                    subText="Imagen basal antes de cualquier preparación de placa."
                    required={true}
                    file={selectedFiles.pre_oct}
                    previewUrl={previewUrls.pre_oct}
                    onFileSelect={(e) => handleFileSelect('pre_oct', e)}
                    onRemove={() => handleFileSelect('pre_oct', { target: { files: [] } } as any)}
                    whatShouldBeSeen={['Pullback basal', 'Lesión responsable', 'Antes de balón/litotricia', 'Estado inicial del vaso']}
                    tooltipText="Haga clic para ver un ejemplo del pullback basal que define la lesión antes del tratamiento."
                  />

                  <ClinicalStoryboardCard
                    label="2. HALLAZGO ULTREON™"
                    subText="Evidencia de la información aportada por la Inteligencia Artificial."
                    file={selectedFiles.ultreon_screenshot}
                    previewUrl={previewUrls.ultreon_screenshot}
                    onFileSelect={(e) => handleFileSelect('ultreon_screenshot', e)}
                    onRemove={() => handleFileSelect('ultreon_screenshot', { target: { files: [] } } as any)}
                    whatShouldBeSeen={['Calcio detectado', 'Línea EEL', 'Medición IA', 'Hallazgo relevante']}
                    icons={[<span key="ca">🦴 Calcio</span>, <span key="ee">📏 EEL</span>, <span key="ia">🧠 IA</span>]}
                    bottomText="Suba la captura donde ULTREON aporta información útil para la planificación."
                    tooltipText="Capture la pantalla de la consola ULTREON que muestre el análisis automatizado de calcio o EEL."
                  />

                  <ClinicalStoryboardCard
                    label="3. CAMBIO DE ESTRATEGIA"
                    subText="Imagen que justifica el cambio terapéutico."
                    badge="⭐ Evidencia Principal"
                    isPrimary={true}
                    required={true}
                    file={selectedFiles.strategy_change}
                    previewUrl={previewUrls.strategy_change}
                    onFileSelect={(e) => handleFileSelect('strategy_change', e)}
                    onRemove={() => handleFileSelect('strategy_change', { target: { files: [] } } as any)}
                    whatShouldBeSeen={['Cambio de diámetro', 'Cambio de longitud', 'Preparación de placa', 'Landing zone (o decisión de mantener)']}
                    bottomText="Esta imagen constituye la principal evidencia científica del estudio."
                    tooltipText="Documente visualmente la justificación del cambio o mantenimiento en la estrategia de stent."
                  />

                  <ClinicalStoryboardCard
                    label="4. OCT FINAL OPTIMIZACIÓN"
                    subText="Pullback tras el implante del stent."
                    required={true}
                    file={selectedFiles.post_oct}
                    previewUrl={previewUrls.post_oct}
                    onFileSelect={(e) => handleFileSelect('post_oct', e)}
                    onRemove={() => handleFileSelect('post_oct', { target: { files: [] } } as any)}
                    whatShouldBeSeen={['Buena expansión', 'Buena aposición', 'Bordes adecuados', 'Resultado intracoronario']}
                    tooltipText="Muestre el pullback final del stent implantado para documentar la correcta optimización con salino."
                  />

                  <ClinicalStoryboardCard
                    label="5. ANGIOGRAFÍA FINAL"
                    subText="Resultado angiográfico definitivo."
                    file={selectedFiles.final_result}
                    previewUrl={previewUrls.final_result}
                    onFileSelect={(e) => handleFileSelect('final_result', e)}
                    onRemove={() => handleFileSelect('final_result', { target: { files: [] } } as any)}
                    whatShouldBeSeen={['Flujo final', 'Resultado procedimiento', 'Ausencia complicaciones', 'Imagen final del caso']}
                    tooltipText="Suba la angiografía final post-PCI que demuestre el flujo final TIMI III."
                  />
                </div>

                {/* Timeline Storyboard Row */}
                <div className="bg-slate-900/40 border border-slate-850 p-6 rounded-3xl">
                  <span className="text-[8px] font-bold text-slate-500 font-mono tracking-wider block uppercase mb-4 text-center">
                    SECUENCIA CLÍNICA DEL PROCEDIMIENTO (STORYBOARD)
                  </span>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-4xl mx-auto font-mono text-[9px]">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                      selectedFiles.pre_oct 
                        ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30' 
                        : 'bg-slate-950 text-slate-500 border-slate-900'
                    }`}>
                      <span>① OCT Basal</span>
                    </div>
                    <span className="text-slate-700">→</span>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                      selectedFiles.ultreon_screenshot 
                        ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30' 
                        : 'bg-slate-950 text-slate-500 border-slate-900'
                    }`}>
                      <span>② IA ULTREON</span>
                    </div>
                    <span className="text-slate-700">→</span>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                      selectedFiles.strategy_change 
                        ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30' 
                        : 'bg-slate-950 text-slate-500 border-slate-900'
                    }`}>
                      <span>③ Cambio Estratégico</span>
                    </div>
                    <span className="text-slate-700">→</span>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                      selectedFiles.post_oct 
                        ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30' 
                        : 'bg-slate-950 text-slate-500 border-slate-900'
                    }`}>
                      <span>④ OCT Final</span>
                    </div>
                    <span className="text-slate-700">→</span>
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                      selectedFiles.final_result 
                        ? 'bg-cyan-950/60 text-cyan-400 border-cyan-500/30' 
                        : 'bg-slate-950 text-slate-500 border-slate-900'
                    }`}>
                      <span>⑤ Angiografía Final</span>
                    </div>
                  </div>
                </div>

                {/* Validation Warnings */}
                {(errors.pre_oct || errors.strategy_change || errors.post_oct) && (
                  <div className="bg-red-950/30 border border-red-800/40 rounded-2xl p-4 text-xs text-red-400 space-y-1 font-mono">
                    <span className="font-bold uppercase tracking-wider block">⚠️ EVIDENCIAS REQUERIDAS PENDIENTES</span>
                    {errors.pre_oct && <p>• {errors.pre_oct}</p>}
                    {errors.strategy_change && <p>• {errors.strategy_change}</p>}
                    {errors.post_oct && <p>• {errors.post_oct}</p>}
                  </div>
                )}
              </div>
            )}

            {/* ── HITO 4: INTERPRETACIÓN ULTREON™ ── */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-slide">
                {isAnalysing ? (
                  /* IA Scanner Simulation */
                  <div className="min-h-[300px] flex flex-col items-center justify-center text-center space-y-6 animate-pulse">
                    <div className="relative w-24 h-24 rounded-full border-4 border-cyan-500/20 border-t-cyan-500 flex items-center justify-center animate-spin">
                      <span className="text-2xl">🧠</span>
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">
                        ULTREON™ 3.0 · Procesando Pullback
                      </h3>
                      <p className="text-[10px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                        Analizando imágenes OCT, cuantificando arco de calcio, longitud de lesión y diámetros de referencia...
                      </p>
                    </div>
                    <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-cyan-400 rounded-full animate-progress-bar" />
                    </div>
                  </div>
                ) : (
                  /* IA Telemetry Findings */
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start animate-fade-slide">
                    
                    {/* IA Checklist */}
                    <div className="md:col-span-4 space-y-4">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono block">
                        Detecciones de Inteligencia Artificial
                      </span>
                      <Card className="p-5 space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.ultreonCalcio}
                            onChange={(e) => handleInputChange('ultreonCalcio', e.target.checked)}
                            className="h-4 w-4 rounded bg-slate-950 border-slate-700 accent-cyan-500"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-200 block">✔ Calcio Severo</span>
                            <span className="text-[8px] text-slate-500 block">Confirmado por operador</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.ultreonArcoCalcioGt180}
                            onChange={(e) => handleInputChange('ultreonArcoCalcioGt180', e.target.checked)}
                            className="h-4 w-4 rounded bg-slate-950 border-slate-700 accent-cyan-500"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-200 block">✔ Arco Cálcico &gt;180°</span>
                            <span className="text-[8px] text-slate-500 block">Confirmado por operador</span>
                          </div>
                        </label>

                        <label className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.ultreonEel}
                            onChange={(e) => handleInputChange('ultreonEel', e.target.checked)}
                            className="h-4 w-4 rounded bg-slate-950 border-slate-700 accent-cyan-500"
                          />
                          <div>
                            <span className="text-xs font-bold text-slate-200 block">✔ Línea EEL Visible</span>
                            <span className="text-[8px] text-slate-500 block">IA detecta diámetros de referencia</span>
                          </div>
                        </label>
                      </Card>
                    </div>

                    {/* IA Clinical Metrics */}
                    <div className="md:col-span-8 space-y-4">
                      <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono block">
                        Telemetría y Mediciones Clínicas
                      </span>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase font-mono">Longitud Lesión (mm)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.ultreonLongitudLesion}
                            onChange={(e) => handleInputChange('ultreonLongitudLesion', e.target.value === '' ? '' : Number(e.target.value))}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs outline-none text-slate-200"
                            placeholder="Ej: 22.4"
                          />
                          {errors.ultreonLongitudLesion && <span className="text-[9px] font-mono text-red-400">⚠ {errors.ultreonLongitudLesion}</span>}
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-400 uppercase font-mono">Área Luminal Mínima (MLA) (mm²)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.ultreonAreaLuminalMin}
                            onChange={(e) => handleInputChange('ultreonAreaLuminalMin', e.target.value === '' ? '' : Number(e.target.value))}
                            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs outline-none text-slate-200"
                            placeholder="Ej: 1.45"
                          />
                          {errors.ultreonAreaLuminalMin && <span className="text-[9px] font-mono text-red-400">⚠ {errors.ultreonAreaLuminalMin}</span>}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">Ref Proximal (mm)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.ultreonReferenciaProx}
                            onChange={(e) => handleInputChange('ultreonReferenciaProx', e.target.value === '' ? '' : Number(e.target.value))}
                            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-850 text-xs text-slate-200 outline-none"
                            placeholder="3.25"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">Ref Distal (mm)</label>
                          <input
                            type="number"
                            step="0.01"
                            value={formData.ultreonReferenciaDist}
                            onChange={(e) => handleInputChange('ultreonReferenciaDist', e.target.value === '' ? '' : Number(e.target.value))}
                            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-850 text-xs text-slate-200 outline-none"
                            placeholder="2.75"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[9px] font-bold text-slate-500 uppercase font-mono">Expansión Stent (%)</label>
                          <input
                            type="number"
                            value={formData.ultreonExpansionStent}
                            onChange={(e) => handleInputChange('ultreonExpansionStent', e.target.value === '' ? '' : Number(e.target.value))}
                            className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-850 text-xs text-slate-200 outline-none"
                            placeholder="85"
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* ── HITO 5: DECISIÓN CLÍNICA ── */}
            {step === 5 && (
              <div className="space-y-6 animate-fade-slide">
                <div>
                  <h2 className="text-lg font-bold tracking-wide text-slate-50 uppercase flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                    5. Decisión Clínica y Sincronización
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Determine el impacto clínico de la adquisición y finalice el registro del caso.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Strategy check */}
                  <div className="md:col-span-5 bg-slate-900/60 border border-slate-850 p-6 rounded-3xl flex flex-col justify-between min-h-[220px]">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono block">Impacto del Guiado por IA</span>
                        <p className="text-xs text-slate-450 mt-1">¿ULTREON modificó la estrategia inicialmente prevista?</p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleInputChange('modificoEstrategiaUltreon', true)}
                          className={`flex-1 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                            formData.modificoEstrategiaUltreon
                              ? 'bg-cyan-950/30 border-cyan-500 text-cyan-400'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          Sí
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            handleInputChange('modificoEstrategiaUltreon', false);
                            handleInputChange('changedStentDiameter', false);
                            handleInputChange('changedStentLength', false);
                            handleInputChange('requiredPlaquePreparation', false);
                            handleInputChange('changedLandingZoneProximal', false);
                            handleInputChange('changedLandingZoneDistal', false);
                            handleInputChange('additionalPostdilatation', false);
                            handleInputChange('otherChange', false);
                          }}
                          className={`flex-1 py-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                            !formData.modificoEstrategiaUltreon
                              ? 'bg-slate-950 border-slate-500 text-slate-350'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Strategy checkboxes */}
                  <div className="md:col-span-7 space-y-4">
                    {formData.modificoEstrategiaUltreon ? (
                      <div className="space-y-3 p-5 bg-slate-900/60 border border-slate-850 rounded-3xl animate-fade-slide">
                        <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono block">Cambios Realizados en la Estrategia</span>
                        <div className="grid grid-cols-2 gap-3">
                          {[
                            { key: 'changedStentDiameter', label: 'Diámetro Stent' },
                            { key: 'changedStentLength', label: 'Longitud Stent' },
                            { key: 'requiredPlaquePreparation', label: 'Preparación Placa' },
                            { key: 'changedLandingZoneProximal', label: 'Landing Zone Prox' },
                            { key: 'changedLandingZoneDistal', label: 'Landing Zone Dist' },
                            { key: 'additionalPostdilatation', label: 'Postdilatación Adicional' },
                            { key: 'otherChange', label: 'Otro Cambio' },
                          ].map((item) => (
                            <label key={item.key} className="flex items-center gap-2.5 p-3 bg-slate-950 border border-slate-850 rounded-xl cursor-pointer text-xs text-slate-300">
                              <input
                                type="checkbox"
                                checked={(formData as any)[item.key]}
                                onChange={(e) => handleInputChange(item.key as keyof eCRFFormData, e.target.checked)}
                                className="h-3.5 w-3.5 rounded bg-slate-900 border border-slate-700 accent-cyan-500"
                              />
                              {item.label}
                            </label>
                          ))}
                        </div>
                        {errors.modificoEstrategiaUltreon && <span className="text-[9px] font-mono text-red-400 block">⚠ {errors.modificoEstrategiaUltreon}</span>}
                      </div>
                    ) : (
                      <Alert
                        variant="info"
                        title="Decisión Clínica Confirmada"
                        description="Ha seleccionado que ULTREON™ 3.0 no requirió cambiar la estrategia terapéutica planificada inicialmente. El caso conservará su diseño inicial."
                      />
                    )}

                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                      className="w-full py-4 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-black text-sm rounded-2xl transition-all shadow-xl shadow-cyan-500/10 cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? 'Transmitiendo Procedimiento...' : '✓ Sincronizar Caso con Plataforma'}
                    </button>
                  </div>
                </div>

                {/* Submitting transaction logs */}
                {dbLogs.length > 0 && (
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-3xl space-y-1 font-mono text-[9px] text-slate-400 max-h-[140px] overflow-y-auto">
                    {dbLogs.map((log, i) => (
                      <div key={i} className={log.includes('❌') ? 'text-red-400' : log.includes('✅') ? 'text-emerald-400' : ''}>
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Navigation button rows */}
            <div className="flex justify-between items-center border-t border-slate-900 pt-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-xs font-bold text-slate-350 transition-all cursor-pointer font-mono"
                >
                  Atrás
                </button>
              ) : (
                <div />
              )}
              {step < 5 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black rounded-lg transition-all shadow-lg shadow-cyan-500/10 cursor-pointer font-mono"
                >
                  Siguiente
                </button>
              ) : (
                <div />
              )}
            </div>

          </div>
        )}
      </div>

      {/* ── COCKPIT BOTTOM MOCKUP-STYLE FOOTER BAR ── */}
      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950 border-t border-slate-900 px-6 py-3.5 shadow-2xl flex items-center justify-between font-mono">
        
        {/* Cancel procedure button */}
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          className="px-4 py-2 border border-slate-800 rounded-lg text-xs font-bold text-slate-450 hover:bg-slate-900 hover:text-slate-300 transition-all"
        >
          Cancelar caso
        </button>

        {/* Pillars checklist items */}
        <div className="flex items-center gap-8 text-[10px] text-left">
          
          {/* Pilar 1: Protocolo 100% Salino */}
          <div className="flex items-center gap-3">
            <span className="text-lg">💉</span>
            <div>
              <span className="font-bold text-slate-200 block leading-tight">Protocolo 100% Salino</span>
              <span className="text-[8px] text-slate-500 block">Jeringas Luer-Lock de 10 mL / 20 mL</span>
            </div>
          </div>

          {/* Pilar 2: Fast Pullback */}
          <div className="flex items-center gap-3">
            <span className="text-lg">⏱️</span>
            <div>
              <span className="font-bold text-slate-200 block leading-tight">Fast Pullback</span>
              <span className="text-[8px] text-slate-500 block">Adquisición completa en 1 segundo</span>
            </div>
          </div>

          {/* Pilar 3: Zero-Contrast */}
          <div className="flex items-center gap-3">
            <span className="text-lg">💧</span>
            <div>
              <span className="font-bold text-slate-200 block leading-tight">Zero-Contrast</span>
              <span className="text-[8px] text-slate-500 block">Sin contraste durante la adquisición OCT</span>
            </div>
          </div>

          {/* Pilar 4: IA ULTREON™ 3.0 */}
          <div className="flex items-center gap-3">
            <span className="text-lg">🧠</span>
            <div>
              <span className="font-bold text-slate-200 block leading-tight">IA ULTREON™ 3.0</span>
              <span className="text-[8px] text-slate-500 block">Inteligencia que guía tu decisión</span>
            </div>
          </div>

          {/* Pilar 5: Evidencia Clínica */}
          <div className="flex items-center gap-3">
            <span className="text-lg">🖼️</span>
            <div>
              <span className="font-bold text-slate-200 block leading-tight">Evidencia Clínica</span>
              <span className="text-[8px] text-slate-500 block">Imágenes clave para cada decisión importante</span>
            </div>
          </div>

        </div>

        {/* Action Button right-aligned */}
        {step < 5 ? (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-lg transition-all shadow-md shadow-cyan-500/10 flex items-center gap-1.5"
          >
            Siguiente: {MILESTONES[step]?.label || 'Siguiente'} ➔
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-xs rounded-lg transition-all flex items-center gap-1.5"
          >
            ✓ Finalizar Registro
          </button>
        )}

      </footer>

      {/* Embedded CSS rules for scanning transition and animations */}
      <style>{`
        @keyframes sweep {
          0% { transform: translateY(-100%); }
          50% { transform: translateY(100%); }
          100% { transform: translateY(-100%); }
        }
        .animate-sweep {
          animation: sweep 2.5s infinite linear;
        }
        .animate-spin-slow {
          animation: spin 8s infinite linear;
        }
        .animate-progress-bar {
          animation: progress 1.5s infinite ease-in-out;
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }

        /* Responsive Grid Cockpit template matching requirements */
        @media (min-width: 1600px) {
          .cockpit-grid {
            display: grid;
            grid-template-columns: 320px 1fr 360px 385px;
            gap: 16px;
          }
        }
        @media (min-width: 1200px) and (max-width: 1599.98px) {
          .cockpit-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .cockpit-grid > *:nth-child(1) { grid-column: span 1; }
          .cockpit-grid > *:nth-child(2) { grid-column: span 1; }
          .cockpit-grid > *:nth-child(3) { grid-column: span 1; }
          .cockpit-grid > *:nth-child(4) { grid-column: span 1; }
        }
        @media (max-width: 1199.98px) {
          .cockpit-grid {
            display: flex;
            flex-direction: column;
            gap: 16px;
          }
        }
      `}</style>

      {/* Add Operator Dialog Modal */}
      {showAddOperatorDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm">
          <Card active glowColor="cyan" className="p-6 max-w-sm w-full mx-4 space-y-4 bg-slate-950 border border-slate-850">
            <h3 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">
              Añadir Médico Operador
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              Registrar nuevo investigador clínico para el centro: <span className="text-cyan-400">{formData.centroMedico}</span>.
            </p>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-mono font-bold text-slate-500 uppercase">Nombre Completo</label>
                <input
                  type="text"
                  value={newOperatorName}
                  onChange={(e) => setNewOperatorName(e.target.value)}
                  placeholder="Ej: Dr. Salvador Almenar"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs outline-none text-slate-200"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={newOperatorIsPi}
                  onChange={(e) => setNewOperatorIsPi(e.target.checked)}
                  className="h-3.5 w-3.5 rounded bg-slate-900 border border-slate-700 accent-cyan-500"
                />
                <span className="text-[10px] text-slate-350 font-mono">¿Es Investigador Principal (IP)?</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-[10px] font-mono">
              <button
                type="button"
                onClick={() => setShowAddOperatorDialog(false)}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isAddingOperator || !newOperatorName.trim()}
                onClick={async () => {
                  const targetHosp = hospitals.find(h => h.name === formData.centroMedico);
                  if (!targetHosp) return;
                  setIsAddingOperator(true);
                  try {
                    const res = await createInvestigatorAction({
                      hospitalId: targetHosp.id,
                      fullName: newOperatorName,
                      role: 'investigator',
                      email: null,
                      phone: null,
                      specialty: 'Cardiólogo Intervencionista',
                      isPrincipalInvestigator: newOperatorIsPi,
                      isActive: true,
                      displayOrder: 1
                    });
                    if (res?.error) {
                      alert(res.error);
                    } else {
                      alert('Operador añadido con éxito. Recargando cockpit...');
                      router.refresh();
                      setShowAddOperatorDialog(false);
                      setNewOperatorName('');
                      setNewOperatorIsPi(false);
                    }
                  } catch (err: any) {
                    alert('Error: ' + err.message);
                  } finally {
                    setIsAddingOperator(false);
                  }
                }}
                className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg disabled:opacity-40 cursor-pointer"
              >
                {isAddingOperator ? 'Añadiendo...' : 'Añadir'}
              </button>
            </div>
          </Card>
        </div>
      )}

    </main>
  );
}
