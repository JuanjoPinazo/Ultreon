import React from 'react';
import { ECRFFormData } from '../types';
import { ClinicalSelect, ClinicalRadioChips, ClinicalScale, PullbackCard, ConditionalSection, ClinicalNumberStepper } from './ClinicalUX';

interface Props {
  formData: ECRFFormData;
  setFormData: React.Dispatch<React.SetStateAction<ECRFFormData>>;
}

export const Step2Acquisition = ({ formData, setFormData }: Props) => {
  const updatePullback = (idx: number, key: string, value: any) => {
    const newPbs = [...formData.pullbacks];
    newPbs[idx] = { ...newPbs[idx], [key]: value };
    setFormData(prev => ({ ...prev, pullbacks: newPbs }));
  };

  const updateField = (key: keyof ECRFFormData, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Adquisición OCT</h2>
        <p className="text-sm text-muted-foreground">Detalles técnicos de cada adquisición</p>
      </div>

      {formData.pullbacks.slice(0, formData.pullback_count).map((pb, idx) => {
        const title = `Pullback ${idx + 1} · ${pb.vessel || 'Vaso no especificado'} · ${pb.type || ''}`;
        const isFast = pb.speed === '75 Rápido';
        const isLeftMain = pb.vessel === 'LM' || pb.vessel === 'Left Main';

        return (
          <PullbackCard 
            key={pb.id || idx} 
            title={`Pullback ${idx + 1}`}
            subtitle={`${pb.vessel || '?'} · ${pb.type || '?'}`}
            isFast={isFast}
            isLeftMain={isLeftMain}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ClinicalRadioChips
                label="Tipo de adquisición"
                value={pb.speed}
                onChange={(v: string) => updatePullback(idx, 'speed', v)}
                options={['75 Rápido', '75 Estándar', '54 Alta Resolución']}
              />
              <ClinicalSelect
                label="¿Utilizó el co-registro automático?"
                value={pb.coregistration_used === 'yes' ? 'Si' : pb.coregistration_used === 'no' ? 'No' : pb.coregistration_used === 'not_available' ? 'No disponible' : ''}
                onChange={(v: string) => {
                  const val = v === 'Si' ? 'yes' : v === 'No' ? 'no' : 'not_available';
                  updatePullback(idx, 'coregistration_used', val);
                }}
                options={['Si', 'No', 'No disponible']}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ClinicalNumberStepper
                label="FPS utilizado"
                value={pb.fps || ''}
                onChange={(v: string) => updatePullback(idx, 'fps', Number(v))}
                step={1}
                min={1}
                max={200}
              />
              <ClinicalScale
                label="Impacto del co-registro sobre tiempo/esfuerzo"
                value={pb.co_registration_impact}
                onChange={(v: number) => updatePullback(idx, 'co_registration_impact', v)}
                minLabel="Mínimo impacto" maxLabel="Máximo impacto"
              />
            </div>

            <ConditionalSection title="Pullback Rápido" show={isFast} colorClass="amber">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ClinicalRadioChips
                  label="Medio de lavado"
                  value={pb.fast_wash_medium}
                  onChange={(v: string) => updatePullback(idx, 'fast_wash_medium', v)}
                  options={['Contraste', 'Suero salino']}
                />
                
                <ClinicalNumberStepper
                  label="Volumen utilizado"
                  value={pb.fast_volume_ml || ''}
                  onChange={(v: string) => updatePullback(idx, 'fast_volume_ml', v)}
                  unit="mL"
                  step={1}
                  min={0}
                  max={50}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ClinicalNumberStepper
                  label="Flujo utilizado"
                  value={pb.fast_flow || ''}
                  onChange={(v: string) => updatePullback(idx, 'fast_flow', v)}
                  unit="mL/s"
                  step={1}
                  min={0}
                  max={20}
                />
                
              </div>

              <ClinicalScale
                label="Facilidad de uso"
                value={pb.fast_ease_of_use}
                onChange={(v: number) => updatePullback(idx, 'fast_ease_of_use', v)}
                minLabel="Muy difícil" maxLabel="Muy fácil"
              />

              <ClinicalScale
                label="Aclaramiento de sangre"
                value={pb.fast_blood_clearance}
                onChange={(v: number) => updatePullback(idx, 'fast_blood_clearance', v)}
                minLabel="Muy deficiente" maxLabel="Excelente"
              />

              <ClinicalScale
                label="Impacto del pullback rápido sobre tiempo/esfuerzo"
                value={pb.fast_time_impact}
                onChange={(v: number) => updatePullback(idx, 'fast_time_impact', v)}
                minLabel="Mínimo impacto" maxLabel="Máximo impacto"
              />
            </ConditionalSection>

            {/* A. TCI — ADQUISICIÓN */}
            <ConditionalSection title="TCI - Adquisición Técnica" show={isLeftMain} colorClass="purple">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ClinicalSelect 
                  label="Tamaño del catéter guía" 
                  value={formData.guide_catheter_size} 
                  onChange={(v: string) => updateField('guide_catheter_size', v)} 
                  options={['5F', '6F', '7F', '8F']} 
                />
                <ClinicalSelect 
                  label="Localización TCI" 
                  value={formData.tci_location} 
                  onChange={(v: string) => updateField('tci_location', v)} 
                  options={['Ostial', 'Medio', 'Distal']} 
                />
              </div>

              <ClinicalScale 
                label="Factibilidad para realizar OCT en TCI" 
                value={formData.tci_feasibility} 
                onChange={(v: number) => updateField('tci_feasibility', v)} 
                minLabel="Mínima factibilidad" maxLabel="Máxima factibilidad"
              />
              
              

              <ClinicalScale 
                label="Aclaramiento de sangre" 
                value={formData.blood_clearance_tci} 
                onChange={(v: number) => updateField('blood_clearance_tci', v)} 
                minLabel="Muy deficiente" maxLabel="Excelente"
              />
              
              <ClinicalRadioChips 
                label="Aclaramiento aceptable" 
                value={formData.clearance_acceptable_tci === true ? 'Si' : formData.clearance_acceptable_tci === false ? 'No' : ''} 
                onChange={(v: string) => updateField('clearance_acceptable_tci', v === 'Si')} 
                options={['Si', 'No']} 
              />
            </ConditionalSection>

          </PullbackCard>
        );
      })}
    </div>
  );
};
