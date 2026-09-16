import { useFormContext } from 'react-hook-form';

export default function ClinicalDecisionStep() {
  const { register, watch } = useFormContext();
  const changed = watch('ultreon_changed_strategy');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-2">Paso 4: Decisión Clínica</h2>
      
      <div>
        <label className="block text-sm font-medium mb-1">Estrategia Prevista (Solo por Angiografía)</label>
          <select {...register('core_data.planned_strategy_angio')} className="w-full border rounded p-2">
          <option value="Direct Stenting">Stent directo</option>
          <option value="Predilatation">Predilatación</option>
          <option value="Plaque Modification">Preparación de la lesión</option>
          <option value="Medical Therapy">Tratamiento médico</option>
          <option value="CABG">Cirugía (CABG)</option>
        </select>
      </div>

      <div className="mt-6 p-4 border rounded bg-yellow-50 border-yellow-200">
        <label className="block font-bold text-yellow-900 mb-2">¿ULTREON modificó la estrategia?</label>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input type="radio" value="true" {...register('ultreon_changed_strategy', { setValueAs: v => v === 'true' })} className="h-5 w-5 rounded-full border-gray-300 text-yellow-600" />
            <span>Sí</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="radio" value="false" {...register('ultreon_changed_strategy', { setValueAs: v => v === 'true' })} className="h-5 w-5 rounded-full border-gray-300 text-yellow-600" />
            <span>No</span>
          </label>
        </div>
      </div>

      {changed && (
        <div className="mt-4 p-4 border-l-4 border-yellow-400 bg-surface shadow-sm">
          <label className="block text-sm font-medium mb-1">Detalles del cambio de estrategia</label>
          <textarea {...register('core_data.strategy_change_details')} className="w-full border rounded p-2 h-24" placeholder="Describa qué se modificó..."></textarea>
        </div>
      )}
    </div>
  );
}
