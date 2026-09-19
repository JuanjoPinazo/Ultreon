import React from 'react';

export default function PrintableIncidents() {
  return (
    <div className="print-page bg-white text-black font-sans break-before">
      <div className="border-b-4 border-slate-900 pb-4 mb-8">
        <h2 className="text-3xl font-black uppercase text-slate-900">Hoja de Incidencias y Desviaciones</h2>
        <p className="text-sm font-medium text-slate-500 mt-2 uppercase tracking-widest">REGISTRO CLÍNICO ULTREON™ 3.0</p>
      </div>
      
      <p className="text-sm mb-6 text-red-700 font-bold uppercase tracking-widest">
        ¡NO INTRODUCIR NUNCA DATOS IDENTIFICATIVOS DEL PACIENTE (NHC/SIP) EN ESTA HOJA!
      </p>

      <table className="w-full text-left border-collapse border border-slate-300 text-sm">
        <thead>
          <tr className="bg-slate-100 uppercase text-[10px] tracking-wider leading-tight">
            <th className="border border-slate-300 p-2 w-16">Fecha</th>
            <th className="border border-slate-300 p-2 w-24">Código Caso</th>
            <th className="border border-slate-300 p-2 w-24">Tipo de Incidencia</th>
            <th className="border border-slate-300 p-2">Descripción y Acción Correctiva</th>
            <th className="border border-slate-300 p-2 w-20">Firma</th>
            <th className="border border-slate-300 p-2 w-16">F. Cierre</th>
          </tr>
        </thead>
        <tbody>
          {[...Array(6)].map((_, i) => (
            <tr key={i} className="h-32 align-top">
              <td className="border border-slate-300 p-2"></td>
              <td className="border border-slate-300 p-2"></td>
              <td className="border border-slate-300 p-2 text-[9px] text-slate-400">
                ( ) Datos Clínicos<br/>
                ( ) Fallo OCT<br/>
                ( ) eCRF<br/>
                ( ) Otra: _______
              </td>
              <td className="border border-slate-300 p-2 text-slate-300">
                [Describa el problema detalladamente]<br/><br/><br/><br/>
                [Acción correctiva tomada]
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
