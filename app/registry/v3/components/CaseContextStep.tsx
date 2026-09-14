import { useFormContext } from 'react-hook-form';

export default function CaseContextStep() {
  const { register } = useFormContext();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-2">Paso 1: Contexto del Caso</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">ID Hospital</label>
          <input {...register('hospital_id')} className="w-full border rounded p-2" placeholder="UUID" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ID Operador</label>
          <input {...register('operator_id')} className="w-full border rounded p-2" placeholder="UUID" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha del Procedimiento</label>
          <input type="date" {...register('procedure_date')} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Código Anónimo</label>
          <input {...register('anonymous_code')} className="w-full border rounded p-2" />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Experiencia con OCT</label>
          <select {...register('core_data.operator_experience_oct')} className="w-full border rounded p-2">
            <option value="<1_year">&lt; 1 año</option>
            <option value="1_3_years">1-3 años</option>
            <option value="3_5_years">3-5 años</option>
            <option value=">5_years">&gt; 5 años</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Experiencia con ULTREON</label>
          <select {...register('core_data.operator_experience_ultreon')} className="w-full border rounded p-2">
            <option value="first_use">Primera utilización</option>
            <option value="occasional_user">Usuario ocasional</option>
            <option value="habitual_user">Usuario habitual</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Presentación Clínica</label>
            <select {...register('core_data.clinical_presentation')} className="w-full border rounded p-2">
              <option value="Stable Angina">Síndrome coronario crónico (SCC)</option>
              <option value="NSTEMI">SCASEST</option>
              <option value="STEMI">SCACEST</option>
              <option value="Silent Ischemia">Isquemia Silente</option>
              <option value="Other">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Lesión</label>
            <select {...register('core_data.lesion_type')} className="w-full border rounded p-2">
              <option value="De novo">De novo</option>
              <option value="In-stent restenosis">ISR (Reestenosis intra-stent)</option>
              <option value="Bypass graft">Injerto</option>
              <option value="Other">Otro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Indicación de OCT</label>
          <select {...register('core_data.oct_indication')} className="w-full border rounded p-2">
            <option value="Pre-PCI Assessment">Evaluación pre-PCI</option>
            <option value="Stent Optimization">Optimización del stent</option>
            <option value="Both">Ambas</option>
          </select>
        </div>
      </div>
    </div>
  );
}
