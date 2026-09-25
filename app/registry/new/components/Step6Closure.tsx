import React from 'react';
import { ECRFFormData } from '../types';
import { ClinicalSelect, ClinicalMultiSelect, ClinicalRadioChips, ClinicalScale } from './ClinicalUX';

interface Props {
  formData: ECRFFormData;
  setFormData: React.Dispatch<React.SetStateAction<ECRFFormData>>;
}

export const Step6Closure = ({ formData, setFormData }: Props) => {
  const updateField = (key: keyof ECRFFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Valor y Cierre</h2>
        <p className="text-sm text-muted-foreground">Evaluación cualitativa final del procedimiento</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ClinicalSelect
          label="Principal beneficio aportado por Ultreon 3.0"
          value={formData.main_benefit}
          onChange={(v: string) => updateField('main_benefit', v)}
          options={[
            'Mejor caracterización de la lesión',
            'Mejor selección de stent',
            'Optimización del resultado PCI',
            'Mayor confianza diagnóstica',
            'Menor utilización de contraste',
            'Procedimiento más eficiente',
            'Evitó tratamiento innecesario',
            'Otro'
          ]}
        />

        <ClinicalSelect
          label="¿Qué funcionalidad tuvo mayor impacto en la toma de decisiones?"
          value={formData.highest_impact_feature}
          onChange={(v: string) => updateField('highest_impact_feature', v)}
          options={[
            { value: 'Fast Pullback', label: 'Pullback rápido' },
            { value: 'Automatic Co-registration', label: 'Co-registro automático' },
            { value: 'AI Lipid Morphology', label: 'Análisis de morfología de placa por IA' },
            { value: 'FFR-OCT', label: 'FFR-OCT' },
            { value: 'Left Main Imaging', label: 'Imagen de TCI' },
            { value: 'Otro', label: 'Otra' }
          ]}
        />
      </div>

      <div className="pt-4 border-t border-border">
        <h2 className="text-lg font-bold text-foreground mb-4">Valoración Global</h2>
        <ClinicalScale
          label="Usabilidad global"
          value={formData.global_usability}
          onChange={(v: number) => updateField('global_usability', v)}
          minLabel="Muy baja" maxLabel="Muy alta"
        />
      </div>

      <div className="pt-4 border-t border-border">
        <h2 className="text-lg font-bold text-foreground mb-4">Adopción Futura</h2>

        <ClinicalSelect
          label="¿Aumentaría su utilización de OCT gracias a las nuevas funcionalidades?"
          value={formData.expected_oct_utilization_increase}
          onChange={(v: string) => updateField('expected_oct_utilization_increase', v)}
          options={[
            'Sí, en todos los casos',
            'Sí, en la mayoría de los casos (>50%)',
            'Sí, en casos seleccionados (<50%)',
            'No'
          ]}
        />

        <ClinicalMultiSelect
          label="Funcionalidades que contribuirían al incremento de uso"
          selected={formData.expected_oct_utilization_drivers}
          onChange={(v: string[]) => updateField('expected_oct_utilization_drivers', v)}
          options={[
            { value: 'Pullback Rápido', label: 'Pullback rápido' },
            { value: 'Análisis de Morfología de la placa por IA', label: 'Análisis de morfología de placa por IA' },
            { value: 'Co-registro Automático', label: 'Co-registro automático' },
            { value: 'FFR-OCT', label: 'FFR-OCT' },
            { value: 'Otro', label: 'Otra' }
          ]}
        />

        <ClinicalMultiSelect
          label="Indicaciones en las que aumentaría el uso"
          selected={formData.future_indications}
          onChange={(v: string[]) => updateField('future_indications', v)}
          options={[
            'SCA',
            'Pacientes con insuficiencia renal',
            'TCI',
            'Lesiones difusas',
            'Lesiones calcificadas',
            'ISR',
            'Otras'
          ]}
        />

        <ClinicalSelect
          label="¿Qué funcionalidad considera con mayor potencial para cambiar su práctica?"
          value={formData.highest_potential_feature}
          onChange={(v: string) => updateField('highest_potential_feature', v)}
          options={[
            'Pullback Rápido',
            'Co-registro Automático',
            'Detección de Ca por IA',
            'Detección de Lípido por IA',
            'FFR-OCT',
            'Imagen del TCI',
            'Combinación de varias'
          ]}
        />

        <div className="flex flex-col gap-1.5 mt-4">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comentarios finales</label>
          <textarea
            className="bg-card border border-input-border dark:border-slate-700 text-slate-800 dark:text-foreground rounded-lg p-2.5 outline-none min-h-[100px] focus:border-primary focus:ring-1 focus:ring-cyan-500 transition-all"
            value={formData.final_comments}
            onChange={e => updateField('final_comments', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
