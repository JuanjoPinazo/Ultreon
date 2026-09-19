import React from 'react';

export default function PrintableLocalSheet() {
  const currentDate = new Date().toLocaleDateString('es-ES');

  // Generate 15 rows for manual entry
  const rows = Array.from({ length: 15 }, (_, i) => i + 1);

  return (
    <div className="print-page bg-white text-black font-sans text-sm pb-12 break-before">
      
      {/* Header with strong warnings */}
      <div className="border-4 border-red-700 bg-red-50 p-6 mb-8 text-center print-border">
        <h1 className="text-3xl font-black uppercase text-red-900 tracking-tighter mb-2">
          DOCUMENTO LOCAL DEL CENTRO
        </h1>
        <div className="text-xl font-bold uppercase text-red-700 tracking-widest flex items-center justify-center gap-4">
          <span>NO REMITIR</span>
          <span className="text-red-900 text-3xl mb-1">•</span>
          <span>NO INTRODUCIR EN LA PLATAFORMA</span>
        </div>
        <p className="mt-4 text-red-800 font-bold border-t border-red-200 pt-4">
          Este documento permanece exclusivamente bajo custodia del centro. Es la única hoja que vincula el Código de Registro pseudoanónimo con la identidad real del paciente (NHC/SIP).
        </p>
      </div>

      <div className="flex justify-between items-end mb-4 border-b-2 border-black pb-2">
        <div className="font-bold text-lg uppercase tracking-wider">
          Tabla de Correspondencias de Pacientes
        </div>
        <div className="flex gap-8">
          <div className="font-bold">Centro: <span className="text-gray-300">________________________</span></div>
          <div className="font-bold">Año: <span className="text-gray-300">__________</span></div>
        </div>
      </div>

      {/* Grid Table */}
      <table className="w-full border-collapse border border-black mb-8">
        <thead>
          <tr className="bg-gray-100 uppercase tracking-widest text-xs">
            <th className="border border-black p-3 text-center whitespace-normal break-normal" style={{ width: '5%' }}>#</th>
            <th className="border border-black p-3 text-left whitespace-normal break-normal" style={{ width: '25%' }}>Código del Registro</th>
            <th className="border border-black p-3 text-left whitespace-normal break-normal" style={{ width: '25%' }}>NHC / SIP local</th>
            <th className="border border-black p-3 text-center whitespace-normal break-normal" style={{ width: '15%' }}>Fecha</th>
            <th className="border border-black p-3 text-left whitespace-normal break-normal" style={{ width: '30%' }}>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <td className="border border-black p-3 text-center font-bold text-gray-500">{row}</td>
              <td className="border border-black p-3 text-gray-300">____ - ________</td>
              <td className="border border-black p-3"></td>
              <td className="border border-black p-3 text-gray-300 text-center">__ / __ / ____</td>
              <td className="border border-black p-3"></td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer Info */}
      <div className="mt-16 pt-4 border-t border-black flex justify-between items-center text-xs font-bold text-gray-500 uppercase">
        <div>Impreso: {currentDate}</div>
        <div>Registro Clínico ULTREON™ 3.0</div>
        <div>Uso estrictamente interno</div>
      </div>
    </div>
  );
}
