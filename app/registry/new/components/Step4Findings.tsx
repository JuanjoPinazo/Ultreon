import React from 'react';
import { ECRFFormData } from '../types';
import { ClinicalSelect, ClinicalMultiSelect, ClinicalRadioChips, ClinicalScale7, ConditionalSection } from './ClinicalUX';

interface Props {
  formData: ECRFFormData;
  setFormData: React.Dispatch<React.SetStateAction<ECRFFormData>>;
}

const FINDINGS_OPTIONS = [
  'Calcio severo',
  'Calcio circunferencial',
  'Calcio profundo',
  'Placa lipídica',
  'Lesión larga',
  'Landing zone subóptima',
  'Infraexpansión',
  'Malaposición',
  'Disección',
  'Otro'
];

export const Step4Findings = ({ formData, setFormData }: Props) => {
  const updateField = (key: keyof ECRFFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  // Conditions
  const hasCalcium = formData.lesion_type.includes('Lesión calcificada') || 
                     formData.oct_findings.some(f => f.toLowerCase().includes('calcio'));
                     
  const hasLipid = formData.oct_findings.some(f => f.toLowerCase().includes('lípido') || f.toLowerCase().includes('lipídica'));
  
  const hasTci = formData.pullbacks.slice(0, formData.pullback_count).some(pb => pb.vessel === 'LM' || pb.vessel === 'Left Main');

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Hallazgos OCT</h2>
        <p className="text-sm text-muted-foreground">Información extraída de las adquisiciones</p>
      </div>

      <ClinicalMultiSelect
        label="¿Qué hallazgos fueron identificados mediante OCT con Ultreon 3.0?"
        selected={formData.oct_findings}
        onChange={(v: string[]) => updateField('oct_findings', v)}
        options={FINDINGS_OPTIONS}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ClinicalRadioChips
          label="¿La OCT aportó información relevante no evidente angiográficamente?"
          value={formData.oct_provided_new_info === true ? 'Si' : formData.oct_provided_new_info === false ? 'No' : ''}
          onChange={(v: string) => updateField('oct_provided_new_info', v === 'Si')}
          options={['Si', 'No']}
        />
        <ClinicalRadioChips
          label="¿La información obtenida mediante OCT influyó en un cambio de estrategia respecto a la angiografía?"
          value={formData.oct_influenced_strategy_change === true ? 'Si' : formData.oct_influenced_strategy_change === false ? 'No' : ''}
          onChange={(v: string) => updateField('oct_influenced_strategy_change', v === 'Si')}
          options={['Si', 'No']}
        />
      </div>

      {/* A. DETECCIÓN AUTOMÁTICA */}
      <ConditionalSection title="Detección de calcio por IA" show={hasCalcium} colorClass="amber">
        <ClinicalScale7 label="Percepción de precisión" value={formData.perception_accuracy_calcium} onChange={(v: number) => updateField('perception_accuracy_calcium', v)} />
        <ClinicalScale7 label="Facilidad en la interpretación" value={formData.ease_of_interpretation_calcium} onChange={(v: number) => updateField('ease_of_interpretation_calcium', v)} />
        <ClinicalScale7 label="Utilidad clínica" value={formData.clinical_utility_calcium} onChange={(v: number) => updateField('clinical_utility_calcium', v)} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <ClinicalRadioChips label="¿La detección automática aportó info relevante?" value={formData.auto_detect_added_info_calcium === true ? 'Si' : formData.auto_detect_added_info_calcium === false ? 'No' : ''} onChange={(v: string) => updateField('auto_detect_added_info_calcium', v === 'Si')} options={['Si', 'No']} />
          <ClinicalRadioChips label="¿Influyó en decisiones?" value={formData.influenced_decision_calcium === true ? 'Si' : formData.influenced_decision_calcium === false ? 'No' : ''} onChange={(v: string) => updateField('influenced_decision_calcium', v === 'Si')} options={['Si', 'No']} />
        </div>
        
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">¿Cómo podría mejorarse?</label>
          <input type="text" className="bg-card border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-foreground rounded-lg p-2.5 text-sm outline-none" value={formData.improvement_ideas_calcium || ''} onChange={e => updateField('improvement_ideas_calcium', e.target.value)} />
        </div>

        <ClinicalRadioChips label="¿La evaluación modificó la estrategia de preparación?" value={formData.changed_prep_strategy_calcium === true ? 'Si' : formData.changed_prep_strategy_calcium === false ? 'No' : ''} onChange={(v: string) => updateField('changed_prep_strategy_calcium', v === 'Si')} options={['Si', 'No']} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ClinicalSelect label="Estrategia final utilizada" value={formData.calcium_treatment_chosen} onChange={(v: string) => updateField('calcium_treatment_chosen', v)} options={[
            { value: 'NC Balloon', label: 'NC Balloon' },
            { value: 'Scoring Balloon', label: 'Scoring Balloon' },
            { value: 'Cutting Balloon', label: 'Cutting Balloon' },
            { value: 'IVL', label: 'IVL' },
            { value: 'Rotablación', label: 'Rotablación' },
            { value: 'Combinación', label: 'Combinación de varias' },
            { value: 'Otra', label: 'Otra' }
          ]} />
          <ClinicalRadioChips label="Sin Ultreon, ¿habría elegido otra estrategia?" value={formData.different_strategy_without_ultreon_calcium} onChange={(v: string) => updateField('different_strategy_without_ultreon_calcium', v)} options={['Si', 'No', 'No sabe']} />
        </div>
      </ConditionalSection>

      <ConditionalSection title="Detección de lípidos por IA" show={hasLipid} colorClass="emerald">
        <ClinicalScale7 label="Percepción de precisión" value={formData.perception_accuracy_lipid} onChange={(v: number) => updateField('perception_accuracy_lipid', v)} />
        <ClinicalScale7 label="Facilidad en la interpretación" value={formData.ease_of_interpretation_lipid} onChange={(v: number) => updateField('ease_of_interpretation_lipid', v)} />
        <ClinicalScale7 label="Utilidad clínica" value={formData.clinical_utility_lipid} onChange={(v: number) => updateField('clinical_utility_lipid', v)} />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
          <ClinicalRadioChips label="¿Detección automática aportó info adicional?" value={formData.auto_detect_added_info_lipid === true ? 'Si' : formData.auto_detect_added_info_lipid === false ? 'No' : ''} onChange={(v: string) => updateField('auto_detect_added_info_lipid', v === 'Si')} options={['Si', 'No']} />
          <ClinicalRadioChips label="¿Influyó en la toma de decisiones?" value={formData.influenced_decision_lipid === true ? 'Si' : formData.influenced_decision_lipid === false ? 'No' : ''} onChange={(v: string) => updateField('influenced_decision_lipid', v === 'Si')} options={['Si', 'No']} />
        </div>
        
        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">¿Cómo podría mejorarse?</label>
          <input type="text" className="bg-card border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-foreground rounded-lg p-2.5 text-sm outline-none" value={formData.improvement_ideas_lipid || ''} onChange={e => updateField('improvement_ideas_lipid', e.target.value)} />
        </div>
      </ConditionalSection>

      {/* B. TCI — IMPACTO CLÍNICO */}
      <ConditionalSection title="TCI - Impacto Clínico" show={hasTci} colorClass="purple">
        <ClinicalRadioChips 
          label="¿Utilizaría OCT rutinariamente en TCI con Ultreon 3.0?" 
          value={formData.routine_use_tci === true ? 'Si' : formData.routine_use_tci === false ? 'No' : ''} 
          onChange={(v: string) => updateField('routine_use_tci', v === 'Si')} 
          options={['Si', 'No']} 
        />
        
        {formData.routine_use_tci && (
          <ClinicalMultiSelect 
            label="Funcionalidad que más contribuyó" 
            selected={formData.most_contributing_feature_tci ? [formData.most_contributing_feature_tci] : []} 
            onChange={(v: string[]) => updateField('most_contributing_feature_tci', v[0] || '')} 
            options={['Pullback Rápido', 'Análisis IA Morfología', 'Co-registro Automático', '3D', 'Otro']} 
          />
        )}
        
        <ClinicalRadioChips 
          label="¿La información modificó la estrategia terapéutica en TCI?" 
          value={formData.modified_strategy_tci === true ? 'Si' : formData.modified_strategy_tci === false ? 'No' : ''} 
          onChange={(v: string) => updateField('modified_strategy_tci', v === 'Si')} 
          options={['Si', 'No']} 
        />
        
        {formData.modified_strategy_tci && (
          <div className="mt-2 p-4 bg-purple-950/30 border border-purple-800/30 rounded-xl">
            <ClinicalMultiSelect 
              label="¿Qué modificó?" 
              selected={formData.what_was_modified_tci} 
              onChange={(v: string[]) => updateField('what_was_modified_tci', v)} 
              options={['Necesidad de PCI', 'Diámetro de stent', 'Longitud de stent', 'Estrategia de bifurcación', 'Optimización final', 'Otro']} 
            />
          </div>
        )}
      </ConditionalSection>

      <ConditionalSection title="Módulo FFR-OCT" show={true} colorClass="blue">
        <ClinicalRadioChips label="¿Utilizó la información proporcionada por FFR-OCT?" value={formData.ffr_oct_used === true ? 'Si' : formData.ffr_oct_used === false ? 'No' : ''} onChange={(v: string) => updateField('ffr_oct_used', v === 'Si')} options={['Si', 'No']} />
        
        {formData.ffr_oct_used && (
          <div className="mt-4 space-y-4 border-t border-blue-900/30 pt-4">
            <ClinicalRadioChips label="¿Modificó la toma de decisiones?" value={formData.ffr_oct_changed_decision === true ? 'Si' : formData.ffr_oct_changed_decision === false ? 'No' : ''} onChange={(v: string) => updateField('ffr_oct_changed_decision', v === 'Si')} options={['Si', 'No']} />
            
            <div className="flex flex-col gap-1.5 mb-4">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">¿Cómo modificó la decisión?</label>
              <input type="text" className="bg-card border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-foreground rounded-lg p-2.5 text-sm outline-none" value={formData.ffr_oct_decision_change || ''} onChange={e => updateField('ffr_oct_decision_change', e.target.value)} />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ClinicalSelect label="Escenario clínico" value={formData.ffr_oct_scenario} onChange={(v: string) => updateField('ffr_oct_scenario', v)} options={['Lesión intermedia', 'TCI', 'Enfermedad difusa', 'Multivaso', 'ISR', 'Otro']} />
              <div className="flex items-end mb-4 h-full pb-1">
                <ClinicalRadioChips label="¿Realizó correcciones en el pullback?" value={formData.pullback_corrections_made === true ? 'Si' : formData.pullback_corrections_made === false ? 'No' : ''} onChange={(v: string) => updateField('pullback_corrections_made', v === 'Si')} options={['Si', 'No']} />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ClinicalScale7 label="Lavado de sangre" value={formData.blood_clearance_ffr_oct} onChange={(v: number) => updateField('blood_clearance_ffr_oct', v)} />
              <ClinicalScale7 label="Confianza en la información proporcionada por FFR-OCT" value={formData.ffr_oct_confidence} onChange={(v: number) => updateField('ffr_oct_confidence', v)} />
            </div>
          </div>
        )}
      </ConditionalSection>
    </div>
  );
};
