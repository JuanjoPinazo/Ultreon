import React from 'react';
import { ECRFFormData } from '../types';
import { ClinicalSelect, ClinicalMultiSelect, ClinicalRadioChips } from './ClinicalUX';

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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Centro Médico <span className="text-cyan-500">*</span></label>
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
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Operador <span className="text-cyan-500">*</span></label>
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
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fecha del Procedimiento <span className="text-cyan-500">*</span></label>
          <input
            type="date"
            className="bg-card border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-foreground rounded-lg p-2.5 focus:border-cyan-500 outline-none transition-all"
            value={formData.fechaProcedimiento}
            onChange={e => updateField('fechaProcedimiento', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <ClinicalSelect
          label="Experiencia del operador con OCT"
          value={formData.operator_experience_oct}
          onChange={(v: string) => updateField('operator_experience_oct', v)}
          options={[
            { value: '<1 año', label: '< 1 año' },
            { value: '1-3 años', label: '1-3 años' },
            { value: '3-5 años', label: '3-5 años' },
            { value: '>5 años', label: '> 5 años' },
          ]}
        />
        <ClinicalSelect
          label="Nivel de experiencia OCT"
          value={formData.operator_experience_level_oct}
          onChange={(v: string) => updateField('operator_experience_level_oct', v)}
          options={[
            { value: 'Usuario experto', label: 'Usuario experto' },
            { value: 'Usuario habitual', label: 'Usuario habitual' },
            { value: 'Usuario ocasional', label: 'Usuario ocasional' },
          ]}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">OCT de cada 10 PCI</label>
          <input
            type="number"
            min="1"
            max="10"
            className="bg-card border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-foreground rounded-lg p-2.5 outline-none transition-all"
            value={formData.image_usage_oct || ''}
            onChange={e => updateField('image_usage_oct', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">IVUS de cada 10 PCI</label>
          <input
            type="number"
            min="1"
            max="10"
            className="bg-card border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-foreground rounded-lg p-2.5 outline-none transition-all"
            value={formData.image_usage_ivus || ''}
            onChange={e => updateField('image_usage_ivus', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Solo Angio de cada 10 PCI</label>
          <input
            type="number"
            min="1"
            max="10"
            className="bg-card border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-foreground rounded-lg p-2.5 outline-none transition-all"
            value={formData.image_usage_angio || ''}
            onChange={e => updateField('image_usage_angio', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ClinicalSelect
          label="Experiencia previa con Ultreon 3.0"
          value={formData.operator_experience_ultreon}
          onChange={(v: string) => updateField('operator_experience_ultreon', v)}
          options={[
            { value: 'Primeras utilizaciones', label: 'Primeras utilizaciones' },
            { value: 'Usuario reciente', label: 'Usuario reciente' },
            { value: 'Usuario experimentado', label: 'Usuario experimentado' },
          ]}
        />
      </div>

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
              <div key={pb.id || idx} className="bg-card/50 p-4 rounded-xl border border-slate-300 dark:border-slate-700/50">
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
