import React from 'react';

export default function PrintableTraining() {
  return (
    <div className="print-page w-full max-w-4xl mx-auto bg-white text-black font-sans">
      <div className="border-b-4 border-slate-900 pb-4 mb-8">
        <h2 className="text-3xl font-black uppercase text-slate-900">Registro de Formación</h2>
        <p className="text-sm font-medium text-slate-500 mt-2 uppercase tracking-widest">REGISTRO CLÍNICO ULTREON™ 3.0</p>
      </div>

      <div className="mb-6 bg-slate-100 p-4 border border-slate-300">
        <h3 className="font-bold text-sm mb-2 uppercase">Temario Mínimo Requerido:</h3>
        <ul className="text-xs list-disc pl-4 space-y-1">
          <li>Protocolo del Registro y Objetivos Científicos</li>
          <li>Uso y manejo de la plataforma ULTREON™ 3.0</li>
          <li>Cumplimentación del eCRF y variables requeridas</li>
          <li>Privacidad y Pseudoanonimización (No incluir PII)</li>
          <li>Reporte de incidencias y corrección de datos</li>
        </ul>
      </div>

      <table className="w-full text-left border-collapse border border-slate-300 text-sm">
        <thead>
          <tr className="bg-slate-100 uppercase text-xs tracking-wider">
            <th className="border border-slate-300 p-2">Nombre del Asistente</th>
            <th className="border border-slate-300 p-2">Rol</th>
            <th className="border border-slate-300 p-2">Formador</th>
            <th className="border border-slate-300 p-2">Temas (Checklist)</th>
            <th className="border border-slate-300 p-2">Firma Asistente</th>
            <th className="border border-slate-300 p-2">Fecha</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(8)].map((_, i) => (
            <tr key={i} className="h-16">
              <td className="border border-slate-300 p-2"></td>
              <td className="border border-slate-300 p-2"></td>
              <td className="border border-slate-300 p-2"></td>
              <td className="border border-slate-300 p-2 text-[10px] leading-tight">
                □ Protocolo<br/>
                □ Plataforma<br/>
                □ eCRF<br/>
                □ Privacidad
              </td>
              <td className="border border-slate-300 p-2"></td>
              <td className="border border-slate-300 p-2"></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
