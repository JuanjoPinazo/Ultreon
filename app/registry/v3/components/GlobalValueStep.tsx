import { useFormContext } from 'react-hook-form';

export default function GlobalValueStep() {
  const { register } = useFormContext();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-2">Paso 7: Valor global y adopción</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Principal beneficio clínico</label>
          <select {...register('global_assessment.main_benefit')} className="w-full border rounded p-2">
            <option value="">Seleccione...</option>
            <option value="lesion_characterization">Caracterización de la lesión</option>
            <option value="stent_selection">Selección del stent</option>
            <option value="pci_optimization">Optimización de PCI</option>
            <option value="confidence">Confianza clínica</option>
            <option value="less_contrast">Menor uso de contraste</option>
            <option value="efficiency">Eficiencia procedimental</option>
            <option value="avoided_unnecessary_treatment">Evitó tratamiento innecesario</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Funcionalidad de mayor impacto</label>
          <select {...register('global_assessment.highest_impact_feature')} className="w-full border rounded p-2">
            <option value="">Seleccione...</option>
            <option value="fast_pullback">Fast Pullback</option>
            <option value="auto_coregistration">Co-registro automático</option>
            <option value="ai_lipid_morphology">IA de Morfología Lipídica</option>
            <option value="ffr_oct">FFR-OCT</option>
            <option value="left_main_imaging">Imagen de Tronco Común (TCI)</option>
            <option value="other">Otro</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Usabilidad global (1-7)</label>
          <input type="number" min="1" max="7" {...register('global_assessment.global_usability', { valueAsNumber: true })} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Comparación con la versión anterior (1-7)</label>
          <input type="number" min="1" max="7" {...register('global_assessment.comparison_with_previous', { valueAsNumber: true })} className="w-full border rounded p-2" />
        </div>
      </div>

      <div className="p-4 border rounded bg-green-50 border-green-200 mt-6 space-y-2">
        <label className="block text-sm font-medium font-bold text-green-900 mb-2">¿Espera aumentar el uso de OCT?</label>
        <div className="flex flex-col space-y-2">
          <label className="flex items-center space-x-2">
            <input type="radio" value="all_cases" {...register('expected_oct_utilization_increase')} className="rounded-full border-gray-300 text-green-600" />
            <span>En todos los casos</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="radio" value="majority_gt_50" {...register('expected_oct_utilization_increase')} className="rounded-full border-gray-300 text-green-600" />
            <span>En la mayoría ({'>'}50%)</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="radio" value="selected_lt_50" {...register('expected_oct_utilization_increase')} className="rounded-full border-gray-300 text-green-600" />
            <span>En casos seleccionados ({'<'}50%)</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="radio" value="no_increase" {...register('expected_oct_utilization_increase')} className="rounded-full border-gray-300 text-green-600" />
            <span>No espero aumento</span>
          </label>
        </div>
      </div>
    </div>
  );
}
