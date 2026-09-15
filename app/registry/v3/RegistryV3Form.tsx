'use client';

import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ultreonRegistryV3Schema, UltreonRegistryV3Form } from '@/schemas/ultreon-registry-v3';

import ProgressIndicator from './components/ProgressIndicator';
import CaseContextStep from './components/CaseContextStep';
import OctAcquisitionStep from './components/OctAcquisitionStep';
import OctFindingsStep from './components/OctFindingsStep';
import ClinicalDecisionStep from './components/ClinicalDecisionStep';
import ConditionalModulesStep from './components/ConditionalModulesStep';
import PostPciStep from './components/PostPciStep';
import GlobalValueStep from './components/GlobalValueStep';

export default function RegistryV3Form() {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  const methods = useForm<UltreonRegistryV3Form>({
    resolver: zodResolver(ultreonRegistryV3Schema) as any,
    mode: 'onChange',
    defaultValues: {
      status: 'DRAFT',
      core_data: {
        operator_experience_oct: '<1 año',
        operator_experience_ultreon: 'Primeras utilizaciones',
        clinical_presentation: 'Stable Angina',
        lesion_type: ['De novo'],
        oct_indication: 'Pre-PCI Assessment',
        planned_strategy_angio: 'Direct Stenting',
      },
      acquisition_data: { pullbacks: [] },
      findings_data: { oct_findings: [] },
      global_assessment: {
        global_usability: 5
      }
    }
  });

  const onSubmit = (data: UltreonRegistryV3Form) => {
    console.log('✅ Form Validated! Payload ready for Supabase:', data);
    alert('Payload logged to console');
  };

  const nextStep = async () => {
    if (currentStep < totalSteps) setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(prev => prev - 1);
  };

  return (
    <FormProvider {...methods}>
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-xl shadow-sm border">
        <ProgressIndicator currentStep={currentStep} totalSteps={totalSteps} />
        
        <form onSubmit={methods.handleSubmit(onSubmit as any)} className="mt-8">
          {currentStep === 1 && <CaseContextStep />}
          {currentStep === 2 && <OctAcquisitionStep />}
          {currentStep === 3 && <OctFindingsStep />}
          {currentStep === 4 && <ClinicalDecisionStep />}
          {currentStep === 5 && <ConditionalModulesStep />}
          {currentStep === 6 && <PostPciStep />}
          {currentStep === 7 && <GlobalValueStep />}

          <div className="mt-10 flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="px-4 py-2 border rounded-md disabled:opacity-50"
            >
              Anterior
            </button>
            
            {currentStep < totalSteps ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Siguiente
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Finalizar registro
              </button>
            )}
          </div>
        </form>

        {Object.keys(methods.formState.errors).length > 0 && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded">
            Revise los campos pendientes o con errores antes de finalizar el registro.
          </div>
        )}
      </div>
    </FormProvider>
  );
}
