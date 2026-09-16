import React, { useState, useEffect } from 'react';
import { ECRFFormData } from '../types';
import { ClinicalSelect, ClinicalMultiSelect, ClinicalRadioChips } from './ClinicalUX';
import OperatorProfileModal from './OperatorProfileModal';
import { getOperatorProfile, OperatorClinicalProfile } from '../../../../lib/registry/operator-profile';

interface Props {
  formData: ECRFFormData;
  setFormData: React.Dispatch<React.SetStateAction<ECRFFormData>>;
  hospitals: any[];
  profile?: any;
}

const LESION_TYPES = [
  'Bifurcación',
  'Lesión calcificada',
  'ISR',
  'Enfermedad difusa',
  'SCA',
  'Otra'
];

const OCT_INDICATIONS = [
  'Caracterización de la lesión',
  'Selección de stent',
  'Optimización post-PCI',
  'Evaluación de ISR',
  'Evaluación de TCI',
  'SCA',
  'Duda angiográfica',
  'Otra'
];

export const Step1Case = ({ formData, setFormData, hospitals, profile }: Props) => {
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [operatorProfileLoaded, setOperatorProfileLoaded] = useState(false);

  const updateField = (key: keyof ECRFFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handlePullbackCountChange = (count: number) => {
    // When changing pullback count, we just update the count. The actual array slice is handled in submission/stale data.
    // However, for UX, we pre-fill empty pullbacks so the UI can render them.
    const currentPullbacks = [...formData.pullbacks];
    while (currentPullbacks.length < count) {
      currentPullbacks.push({
        id: crypto.randomUUID(),
        vessel: '',
        type: 'PRE-PCI',
        speed: '75 Estándar',
        co_registration: null,
        fps: 75
      });
    }
    setFormData(prev => ({ 
      ...prev, 
      pullback_count: count,
      pullbacks: currentPullbacks
    }));
  };

  // Enforce hospital_user logic automatically
  React.useEffect(() => {
    if (profile?.role === 'hospital_user') {
      let changed = false;
      const newFormData = { ...formData };
      
      if (profile.hospital_id && formData.centroMedico !== profile.hospital_id) {
        newFormData.centroMedico = profile.hospital_id;
        changed = true;
      }
      
      // Determine if the user is explicitly linked to an operator
      const userHospital = hospitals.find(h => h.id === profile.hospital_id);
      const linkedOperator = userHospital?.operators?.find((o: any) => o.user_id === profile.id);
      
      if (linkedOperator && formData.operador !== linkedOperator.id) {
        newFormData.operador = linkedOperator.id;
        changed = true;
      }
      
      if (changed) {
        setFormData(newFormData);
      }
    }
  }, [profile, formData.centroMedico, formData.operador, setFormData, hospitals]);

  // Fetch operator profile when operator is selected
  useEffect(() => {
    if (formData.operador && !operatorProfileLoaded) {
      getOperatorProfile(formData.operador).then(data => {
        if (data) {
          // If we found a profile, copy it into formData (Snapshot creation)
          setFormData(prev => ({
            ...prev,
            image_usage_oct: data.image_usage_oct,
            image_usage_ivus: data.image_usage_ivus,
            image_usage_angio: data.image_usage_angio,
            operator_experience_oct: data.experience_oct,
            operator_experience_level_oct: data.experience_level_oct,
            operator_experience_ultreon: data.experience_ultreon
          }));
        } else {
          // No profile found. Show modal automatically for first-time.
          setIsProfileModalOpen(true);
        }
        setOperatorProfileLoaded(true);
      });
    } else if (!formData.operador) {
      setOperatorProfileLoaded(false);
    }
  }, [formData.operador, operatorProfileLoaded, setFormData]);

  const handleProfileUpdated = (data: OperatorClinicalProfile) => {
    setFormData(prev => ({
      ...prev,
      image_usage_oct: data.image_usage_oct,
      image_usage_ivus: data.image_usage_ivus,
      image_usage_angio: data.image_usage_angio,
      operator_experience_oct: data.experience_oct,
      operator_experience_level_oct: data.experience_level_oct,
      operator_experience_ultreon: data.experience_ultreon
    }));
  };

  const userHospital = profile?.hospital_id ? hospitals.find(h => h.id === profile.hospital_id) : null;
  const isLinkedOperator = profile?.role === 'hospital_user' && userHospital?.operators?.find((o: any) => o.user_id === profile.id);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Información General</h2>
        <p className="text-sm text-muted-foreground">Datos básicos del procedimiento</p>
      </div>

      {(profile?.role === 'admin' || profile?.role === 'super_admin') && (
        <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-xl mb-4">
          <ClinicalRadioChips
            label="Tipo de Registro (Solo Admin)"
            value={formData.is_demo ? 'true' : 'false'}
            onChange={(v: string) => updateField('is_demo', v === 'true')}
            options={[
              { value: 'false', label: 'Caso Real' },
              { value: 'true', label: 'Caso DEMO' }
            ]}
          />
          {formData.is_demo && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2 font-medium">
              ⚠️ Este caso no contabilizará en las métricas clínicas ni en la facturación.
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {hospitals.length === 1 ? (
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Centro Médico <span className="text-primary">*</span></label>
            <input
              type="text"
              readOnly
              className="bg-card/50 border border-border text-muted-foreground rounded-lg p-2.5 outline-none text-sm cursor-not-allowed"
              value={hospitals[0].name}
            />
          </div>
        ) : (
          <ClinicalSelect
            label="Centro Médico"
            required
            value={formData.centroMedico}
            onChange={(v: string) => {
              updateField('centroMedico', v);
              updateField('operador', ''); // Reset investigator when hospital changes
            }}
            options={hospitals.map(h => ({ value: h.id || h.name, label: h.name }))}
          />
        )}
        
        {isLinkedOperator ? (
          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operador <span className="text-primary">*</span></label>
            <input
              type="text"
              readOnly
              className="bg-card/50 border border-border text-muted-foreground rounded-lg p-2.5 outline-none text-sm cursor-not-allowed font-semibold"
              value={isLinkedOperator.full_name}
            />
          </div>
        ) : (
          <ClinicalSelect
            label="Operador"
            required
            value={formData.operador}
            onChange={(v: string) => updateField('operador', v)}
            options={
              formData.centroMedico
                ? (hospitals.find(h => (h.id || h.name) === formData.centroMedico)?.operators || []).map((inv: any) => ({
                    value: inv.id,
                    label: inv.full_name || inv.name
                  }))
                : []
            }
          />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Código del Caso</label>
          <input
            type="text"
            readOnly
            className="bg-card/50 border border-border text-muted-foreground rounded-lg p-2.5 outline-none font-mono text-sm"
            value={formData.idPaciente || '(Se generará al guardar)'}
          />
        </div>

        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha del Procedimiento <span className="text-primary">*</span></label>
          <input
            type="date"
            className="bg-card border border-input-border dark:border-slate-700 text-slate-800 dark:text-foreground rounded-lg p-2.5 focus:border-primary outline-none transition-all"
            value={formData.fechaProcedimiento}
            onChange={e => updateField('fechaProcedimiento', e.target.value)}
          />
        </div>
      </div>

      {/* Perfil Clínico del Operador (Read-only Snapshot) */}
      {formData.operador && (
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-5 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Perfil Clínico Basal del Operador</h3>
              <p className="text-xs text-muted-foreground mt-1">Snapshot de las variables de práctica clínica para este caso.</p>
            </div>
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 transition-colors flex items-center gap-1 bg-cyan-50 dark:bg-cyan-950/30 px-3 py-1.5 rounded-md border border-cyan-100 dark:border-cyan-900"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Actualizar Perfil
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                <span className="text-muted-foreground">OCT de cada 10 PCI:</span>
                <span className="font-semibold">{formData.image_usage_oct || 0}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                <span className="text-muted-foreground">IVUS de cada 10 PCI:</span>
                <span className="font-semibold">{formData.image_usage_ivus || 0}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                <span className="text-muted-foreground">Solo Angio de cada 10 PCI:</span>
                <span className="font-semibold">{formData.image_usage_angio || 0}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                <span className="text-muted-foreground">Experiencia OCT:</span>
                <span className="font-semibold">{formData.operator_experience_oct || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                <span className="text-muted-foreground">Nivel Experiencia OCT:</span>
                <span className="font-semibold">{formData.operator_experience_level_oct || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
                <span className="text-muted-foreground">Experiencia ULTREON™ 3.0:</span>
                <span className="font-semibold">{formData.operator_experience_ultreon || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Operator Profile Modal */}
      {formData.operador && (
        <OperatorProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          operatorId={formData.operador}
          operatorName={
            hospitals.find(h => (h.id || h.name) === formData.centroMedico)?.operators?.find((o: any) => o.id === formData.operador)?.full_name || 
            'Operador Seleccionado'
          }
          onProfileUpdated={handleProfileUpdated}
        />
      )}

      <div className="pt-4 border-t border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Características del Procedimiento</h2>
        
        <ClinicalRadioChips
          label="Tipo de enfermedad coronaria"
          value={formData.clinical_presentation}
          onChange={(v: string) => updateField('clinical_presentation', v)}
          options={['SCC', 'SCA', 'Otro']}
        />

        <ClinicalMultiSelect
          label="Tipo de lesión (Multiselección)"
          selected={formData.lesion_type}
          onChange={(v: string[]) => updateField('lesion_type', v)}
          options={LESION_TYPES}
        />

        <ClinicalSelect
          label="Indicación principal para utilizar OCT"
          value={formData.oct_indication}
          onChange={(v: string) => updateField('oct_indication', v)}
          options={OCT_INDICATIONS}
        />
      </div>

      <div className="pt-4 border-t border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Pullbacks</h2>
        
        <ClinicalRadioChips
          label="Número de pullbacks realizados"
          value={formData.pullback_count}
          onChange={handlePullbackCountChange}
          options={[
            { value: 1, label: '1' },
            { value: 2, label: '2' },
            { value: 3, label: '3' },
          ]}
        />

        {formData.pullback_count > 0 && (
          <div className="mt-4 space-y-4">
            {formData.pullbacks.slice(0, formData.pullback_count).map((pb, idx) => (
              <div key={pb.id || idx} className="bg-card/50 p-4 rounded-xl border border-input-border dark:border-slate-700/50">
                <h3 className="font-bold mb-3 text-cyan-400">Pullback {idx + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ClinicalSelect
                    label="Vaso"
                    value={pb.vessel}
                    onChange={(v: string) => {
                      const newPbs = [...formData.pullbacks];
                      newPbs[idx].vessel = v;
                      updateField('pullbacks', newPbs);
                    }}
                    options={[
                      { value: 'LAD', label: 'LAD' },
                      { value: 'LCX', label: 'LCX' },
                      { value: 'Left Main', label: 'TCI' },
                      { value: 'RCA', label: 'RCA' },
                      { value: 'Otro', label: 'Otra' }
                    ]}
                  />
                  <ClinicalSelect
                    label="Momento"
                    value={pb.type}
                    onChange={(v: string) => {
                      const newPbs = [...formData.pullbacks];
                      newPbs[idx].type = v;
                      updateField('pullbacks', newPbs);
                    }}
                    options={[
                      { value: 'PRE-PCI', label: 'PRE-PCI' },
                      { value: 'POST-PCI', label: 'POST-PCI' },
                      { value: 'SEGUIMIENTO', label: 'SEGUIMIENTO' },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
