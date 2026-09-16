import { useFormContext } from 'react-hook-form';

export default function PostPciStep() {
  const { register, watch } = useFormContext();
  const requiresTreatment = watch('global_assessment.post_pci_data.additional_treatment_required');
  const treatmentType = watch('global_assessment.post_pci_data.additional_treatment_type');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-2">Paso 6: Evaluación Post-PCI</h2>
      
      <div>
        <label className="block text-sm font-medium mb-2">¿Tratamiento adicional requerido?</label>
        <select {...register('global_assessment.post_pci_data.additional_treatment_required')} className="w-full border rounded p-2">
          <option value="no">No</option>
          <option value="yes">Sí</option>
        </select>
      </div>

      {requiresTreatment === 'yes' && (
        <div className="p-4 border rounded bg-surface-secondary space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Tratamiento</label>
            <select {...register('global_assessment.post_pci_data.additional_treatment_type')} className="w-full border rounded p-2">
              <option value="">Seleccione...</option>
              <option value="postdilatation">Postdilatación</option>
              <option value="additional_stent">Stent adicional</option>
              <option value="both">Ambos</option>
              <option value="other">Otro</option>
            </select>
          </div>

          {treatmentType === 'other' && (
            <div>
              <label className="block text-sm font-medium mb-1">Especifique otro tratamiento</label>
              <input {...register('global_assessment.post_pci_data.additional_treatment_other')} className="w-full border rounded p-2" />
            </div>
          )}

          <div>
            <label className="flex items-center space-x-2">
              <input type="checkbox" {...register('post_pci_correction_needed')} />
              <span>Registrar KPI: Tasa de corrección post-PCI</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
