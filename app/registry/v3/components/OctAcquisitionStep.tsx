import { useFieldArray, useFormContext } from 'react-hook-form';

export default function OctAcquisitionStep() {
  const { control, register, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'acquisition_data.pullbacks'
  });

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold border-b pb-2">Paso 2: Adquisición de OCT</h2>
      
      {fields.map((field, index) => {
        const speed = watch(`acquisition_data.pullbacks.${index}.speed`);
        return (
          <div key={field.id} className="p-4 border rounded-lg bg-gray-50 relative">
            <button type="button" onClick={() => remove(index)} className="absolute top-2 right-2 text-red-500 text-sm">Eliminar</button>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select {...register(`acquisition_data.pullbacks.${index}.type`)} className="w-full border rounded p-2">
                  <option value="PRE">PRE</option>
                  <option value="POST">POST</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Velocidad</label>
                <select {...register(`acquisition_data.pullbacks.${index}.speed`)} className="w-full border rounded p-2">
                  <option value="75 Standard">75 Estándar</option>
                  <option value="75 Fast">75 Fast Pullback</option>
                  <option value="54 High Resolution">54 Alta Resolución</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vaso</label>
                <select {...register(`acquisition_data.pullbacks.${index}.vessel`)} className="w-full border rounded p-2">
                  <option value="LAD">LAD</option>
                  <option value="LCX">LCX</option>
                  <option value="RCA">RCA</option>
                  <option value="LM">TCI</option>
                  <option value="Ramus">Ramo intermedio</option>
                  <option value="Bypass">Injerto</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">FPS</label>
                <input type="number" {...register(`acquisition_data.pullbacks.${index}.fps`, { valueAsNumber: true })} className="w-full border rounded p-2" />
              </div>
              <div className="col-span-2">
                <label className="flex items-center space-x-2 mt-2">
                  <input type="checkbox" {...register(`acquisition_data.pullbacks.${index}.co_registration`)} className="rounded border-gray-300" />
                  <span className="text-sm font-medium">Co-registro angiográfico activado</span>
                </label>
              </div>
              {speed === '75 Fast' && (
                <div className="col-span-2 mt-2">
                  <label className="block text-sm font-medium mb-1">Calidad del lavado (Obligatorio en Fast Pullback)</label>
                  <select {...register(`acquisition_data.pullbacks.${index}.wash_quality`)} className="w-full border rounded p-2">
                    <option value="">Seleccione...</option>
                    <option value="Excellent">Excelente</option>
                    <option value="Good">Bueno</option>
                    <option value="Poor">Pobre</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => append({ id: crypto.randomUUID(), type: 'PRE', vessel: 'LAD', speed: '75 Standard', co_registration: false, fps: 180 })}
        className="px-4 py-2 border rounded-md text-sm hover:bg-gray-100"
      >
        + Añadir Pullback
      </button>
    </div>
  );
}
