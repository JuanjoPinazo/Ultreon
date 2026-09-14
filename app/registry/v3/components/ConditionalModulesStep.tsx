import { useFormContext } from 'react-hook-form';

function CalciumModule() {
  const { register } = useFormContext();
  return (
    <div className="p-4 border rounded bg-white mt-2">
      <h3 className="font-semibold mb-3">Módulo de Calcio</h3>
      <div className="space-y-3">
        <label className="flex items-center space-x-2">
          <input type="checkbox" {...register('calcium_impacted_decision')} />
          <span>Los hallazgos de calcio modificaron la decisión</span>
        </label>
        <div>
          <label className="block text-sm mb-1">Tratamiento Elegido</label>
          <select {...register('calcium_module.calcium_treatment_chosen')} className="w-full border p-2 rounded">
            <option value="">Seleccione...</option>
            <option value="Rotational">Aterectomía Rotacional</option>
            <option value="Orbital">Aterectomía Orbital</option>
            <option value="IVL">Litotricia Intravascular (IVL)</option>
            <option value="Cutting/Scoring Balloon">Balón de corte / scoring</option>
            <option value="Non-compliant balloon">Balón no compliante (NC)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function LipidModule() {
  const { register } = useFormContext();
  return (
    <div className="p-4 border rounded bg-white mt-2">
      <h3 className="font-semibold mb-3">Módulo de Lípido</h3>
      <div className="space-y-3">
        <label className="flex items-center space-x-2">
          <input type="checkbox" {...register('lipid_module.lipid_impacted_decision')} />
          <span>Los hallazgos lipídicos modificaron la decisión</span>
        </label>
      </div>
    </div>
  );
}

function LeftMainModule() {
  const { register } = useFormContext();
  return (
    <div className="p-4 border rounded bg-white mt-2">
      <h3 className="font-semibold mb-3">Módulo de Tronco Común (TCI)</h3>
      <div className="space-y-3">
        <label className="flex items-center space-x-2">
          <input type="checkbox" {...register('left_main_module.left_main_impacted_decision')} />
          <span>Los hallazgos en TCI modificaron la decisión</span>
        </label>
      </div>
    </div>
  );
}

function FfrOctModule() {
  const { register } = useFormContext();
  return (
    <div className="p-4 border rounded bg-white mt-2">
      <h3 className="font-semibold mb-3">Módulo FFR-OCT</h3>
      <div className="space-y-3">
        <label className="flex items-center space-x-2">
          <input type="checkbox" {...register('ffr_oct_module.ffr_oct_used')} />
          <span>¿Se utilizó FFR-OCT?</span>
        </label>
        <label className="flex items-center space-x-2">
          <input type="checkbox" {...register('ffr_oct_impacted_decision')} />
          <span>FFR-OCT modificó la decisión clínica</span>
        </label>
        <div>
          <label className="block text-sm mb-1">Escenario</label>
          <select {...register('ffr_oct_module.ffr_oct_scenario')} className="w-full border p-2 rounded">
            <option value="">Seleccione...</option>
            <option value="intermediate_lesion">Lesión intermedia</option>
            <option value="left_main">Tronco Común (TCI)</option>
            <option value="diffuse_disease">Enfermedad difusa</option>
            <option value="multivessel">Enfermedad multivaso</option>
            <option value="ISR">ISR (Reestenosis intra-stent)</option>
            <option value="other">Otro</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default function ConditionalModulesStep() {
  const { register, watch } = useFormContext();
  const hasCa = watch('calcium_module.has_calcium_module');
  const hasLipid = watch('lipid_module.has_lipid_module');
  const hasLM = watch('left_main_module.has_left_main_module');
  const hasFfr = watch('ffr_oct_module.has_ffr_oct_module');

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-2">Paso 5: Módulos Condicionales</h2>
      
      <div className="flex space-x-4 flex-wrap gap-y-2">
        <label className="flex items-center space-x-2 p-3 border rounded cursor-pointer bg-gray-50">
          <input type="checkbox" {...register('calcium_module.has_calcium_module')} />
          <span>Calcio</span>
        </label>
        <label className="flex items-center space-x-2 p-3 border rounded cursor-pointer bg-gray-50">
          <input type="checkbox" {...register('lipid_module.has_lipid_module')} />
          <span>Lípido</span>
        </label>
        <label className="flex items-center space-x-2 p-3 border rounded cursor-pointer bg-gray-50">
          <input type="checkbox" {...register('left_main_module.has_left_main_module')} />
          <span>Tronco Común (TCI)</span>
        </label>
        <label className="flex items-center space-x-2 p-3 border rounded cursor-pointer bg-gray-50">
          <input type="checkbox" {...register('ffr_oct_module.has_ffr_oct_module')} />
          <span>FFR-OCT</span>
        </label>
      </div>

      <div className="space-y-4">
        {hasCa && <CalciumModule />}
        {hasLipid && <LipidModule />}
        {hasLM && <LeftMainModule />}
        {hasFfr && <FfrOctModule />}
      </div>
    </div>
  );
}
