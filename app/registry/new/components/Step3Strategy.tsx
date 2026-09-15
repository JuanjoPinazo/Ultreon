import React from 'react';
import { ECRFFormData } from '../types';
import { ClinicalSelect } from './ClinicalUX';

interface Props {
  formData: ECRFFormData;
  setFormData: React.Dispatch<React.SetStateAction<ECRFFormData>>;
}

export const Step3Strategy = ({ formData, setFormData }: Props) => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Estrategia Inicial</h2>
        <p className="text-sm text-muted-foreground">Decisión previa al uso de imagen OCT</p>
      </div>

      <div className="bg-card/50 p-6 rounded-xl border border-slate-300 dark:border-slate-700/50 max-w-lg mx-auto mt-10">
        <ClinicalSelect
          label="Basado únicamente en la angiografía, ¿cuál era la estrategia inicialmente prevista?"
          value={formData.planned_strategy_angio}
          onChange={(v: string) => setFormData(prev => ({ ...prev, planned_strategy_angio: v }))}
          options={[
            'Tratamiento médico',
            'PCI estándar',
            'PCI con preparación de lesión',
            'PCI compleja',
            'Otra'
          ]}
        />
      </div>
    </div>
  );
};
