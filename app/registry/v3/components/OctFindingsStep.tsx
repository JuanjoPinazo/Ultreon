import { useFormContext } from 'react-hook-form';

export default function OctFindingsStep() {
  const { register } = useFormContext();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-2">Paso 3: Hallazgos OCT</h2>
      
      <div>
        <label className="block text-sm font-medium mb-2">Seleccione los hallazgos</label>
        <div className="space-y-2">
          {[
            { value: 'Plaque rupture', label: 'Rotura de placa' },
            { value: 'Erosion', label: 'Erosión' },
            { value: 'Calcification', label: 'Calcificación' },
            { value: 'Thrombus', label: 'Trombo' },
            { value: 'TCFA', label: 'TCFA (Fibroateroma de cápsula fina)' }
          ].map(finding => (
            <label key={finding.value} className="flex items-center space-x-2">
              <input type="checkbox" value={finding.value} {...register('findings_data.oct_findings')} />
              <span>{finding.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 border rounded bg-blue-50">
        <label className="block font-medium text-blue-900 mb-2">¿Rendimiento diagnóstico incremental frente a angiografía?</label>
        <p className="text-sm text-blue-700 mb-3">¿Reveló la OCT información no observada en la angiografía?</p>
        <div className="flex space-x-4">
          <label className="flex items-center space-x-2">
            <input type="radio" value="true" {...register('incremental_diagnostic_yield', { setValueAs: v => v === 'true' })} className="h-5 w-5 rounded-full border-gray-300" />
            <span>Sí</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="radio" value="false" {...register('incremental_diagnostic_yield', { setValueAs: v => v === 'true' })} className="h-5 w-5 rounded-full border-gray-300" />
            <span>No</span>
          </label>
        </div>
      </div>
    </div>
  );
}
