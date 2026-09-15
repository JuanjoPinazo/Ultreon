import React from 'react';
import { ECRFFormData } from '../types';
import { ClinicalMultiSelect, ClinicalRadioChips } from './ClinicalUX';

interface Props {
  formData: ECRFFormData;
  setFormData: React.Dispatch<React.SetStateAction<ECRFFormData>>;
}

const IMPACT_OPTIONS = [
  'Indicación de tratamiento',
  'Estrategia de preparación de lesión',
  'Diámetro de stent',
  'Longitud de stent',
  'Estrategia de bifurcación',
  'Número de stents',
  'Necesidad de postdilatación',
  'Otro'
];

export const Step5Impact = ({ formData, setFormData }: Props) => {
  const updateField = (key: keyof ECRFFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Impacto y Optimización</h2>
        <p className="text-sm text-muted-foreground">Decisiones finales y validación post-PCI</p>
      </div>

      <div className="pt-4 border-t border-border">
        {formData.oct_influenced_strategy_change && (
          <div className="mt-4 p-4 bg-cyan-950/20 border border-cyan-800/50 rounded-xl">
            <ClinicalMultiSelect
              label="¿Qué modificó?"
              selected={formData.strategy_change_details}
              onChange={(v: string[]) => updateField('strategy_change_details', v)}
              options={IMPACT_OPTIONS}
            />
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-border">
        <h2 className="text-lg font-bold text-foreground mb-4">Optimización POST-PCI</h2>
        
        <ClinicalRadioChips
          label="¿Se realizó OCT post-stent?"
          value={formData.oct_performed_post === true ? 'Si' : formData.oct_performed_post === false ? 'No' : ''}
          onChange={(v: string) => updateField('oct_performed_post', v === 'Si')}
          options={['Si', 'No']}
        />

        {formData.oct_performed_post && (
          <div className="mt-4 p-4 bg-emerald-950/20 border border-emerald-800/50 rounded-xl space-y-4">
            <ClinicalMultiSelect
              label="Hallazgos"
              selected={formData.residual_findings}
              onChange={(v: string[]) => updateField('residual_findings', v)}
              options={[
                'Infraexpansión',
                'Malaposición',
                'Disección de borde',
                'Placa residual significativa',
                'Ninguno',
                'Otro'
              ]}
            />

            <ClinicalRadioChips
              label="¿Los hallazgos condujeron a tratamiento adicional?"
              value={formData.additional_treatment_required === 'yes' ? 'Si' : formData.additional_treatment_required === 'no' ? 'No' : ''}
              onChange={(v: string) => updateField('additional_treatment_required', v === 'Si' ? 'yes' : 'no')}
              options={['Si', 'No']}
            />

            {formData.additional_treatment_required === 'yes' && (
              <ClinicalRadioChips
                label="Tratamiento realizado"
                value={formData.additional_treatment_type}
                onChange={(v: string) => updateField('additional_treatment_type', v)}
                options={['Postdilatación', 'Stent adicional', 'Ambos', 'Otro']}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};
