import React from 'react';

interface HospitalData {
  id: string;
  name: string;
  principalInvestigator?: string | null;
}

export default function PrintableSignatures({ hospital }: { hospital?: HospitalData | null }) {
  return (
    <div className="print-page bg-white text-black font-sans break-before">
      <div className="border-b-4 border-slate-900 pb-4 mb-8">
        <h2 className="text-3xl font-black uppercase text-slate-900">Registro de Firmas y Funciones</h2>
        <p className="text-sm font-medium text-slate-500 mt-2 uppercase tracking-widest">REGISTRO CLÍNICO ULTREON™ 3.0</p>
      </div>
      
      <p className="text-sm mb-6">
        Este documento delega las funciones y autoriza a los miembros del equipo investigador a participar en el registro.
      </p>

      <table className="w-full text-left border-collapse border border-slate-300 text-sm">
        <thead>
          <tr className="bg-slate-100 uppercase text-xs tracking-wider">
            <th className="border border-slate-300 p-2">Nombre y Apellidos</th>
            <th className="border border-slate-300 p-2">Rol / Función</th>
            <th className="border border-slate-300 p-2">Iniciales</th>
            <th className="border border-slate-300 p-2">Firma</th>
            <th className="border border-slate-300 p-2">Fecha Inicio</th>
            <th className="border border-slate-300 p-2">Fecha Fin</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(10)].map((_, i) => (
            <tr key={i} className="h-16">
              <td className="border border-slate-300 p-2"></td>
              <td className="border border-slate-300 p-2 text-xs text-slate-400">
                ( ) Investigador Principal<br/>
                ( ) Operador<br/>
                ( ) Coordinador / Data Entry
              </td>
              <td className="border border-slate-300 p-2"></td>
              <td className="border border-slate-300 p-2"></td>
              <td className="border border-slate-300 p-2"></td>
              <td className="border border-slate-300 p-2"></td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="mt-12">
        <p className="text-xs text-slate-500 mb-8">Firma del Investigador Principal ratificando la delegación de funciones:</p>
        <div className="flex justify-between">
          <div className="w-64 border-b border-slate-400 text-center font-bold text-sm mb-1">{hospital?.principalInvestigator || ''}</div>
          <div className="w-32 border-b border-slate-400"></div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-slate-400">
          <span>Firma Investigador Principal</span>
          <span>Fecha</span>
        </div>
      </div>
    </div>
  );
}
