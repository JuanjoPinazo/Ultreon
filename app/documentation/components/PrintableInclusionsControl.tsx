import React from 'react';

interface HospitalData {
  id: string;
  name: string;
  prefix?: string;
  operators?: string[];
}

export default function PrintableInclusionsControl({ hospital }: { hospital: HospitalData | null }) {
  const currentDate = new Date().toLocaleDateString('es-ES');

  // Generate 25 rows for manual entry
  const rows = Array.from({ length: 25 }, (_, i) => i + 1);

  return (
    <div className="print-page w-full max-w-4xl mx-auto bg-white text-black font-sans text-sm pb-12">
      
      {/* Header */}
      <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">CONTROL DE INCLUSIONES</h1>
          <h2 className="text-lg font-bold text-slate-600 uppercase tracking-widest mt-1">Registro Clínico ULTREON™ 3.0</h2>
        </div>
        <div className="text-right">
          <div className="border-2 border-slate-900 p-2 text-left w-64 bg-slate-50">
            <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">Centro</span>
            <div className="font-bold text-sm line-clamp-1">{hospital ? hospital.name : '________________________'}</div>
            <div className="font-mono text-xs text-slate-400 mt-1">Prefijo: {hospital?.prefix || '____'}</div>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-slate-100 border border-black p-3 text-center mb-6 text-xs font-bold uppercase tracking-wider">
        Solo códigos del registro. No incluir NHC, SIP, ni iniciales del paciente.
      </div>

      {/* Grid Table */}
      <table className="w-full border-collapse border border-black mb-8">
        <thead>
          <tr className="bg-slate-200 uppercase tracking-widest text-xs">
            <th className="border border-black p-3 text-center w-12">#</th>
            <th className="border border-black p-3 text-left w-48">Código de Caso</th>
            <th className="border border-black p-3 text-center w-32">Fecha</th>
            <th className="border border-black p-3 text-left">Operador</th>
            <th className="border border-black p-3 text-center w-40">Estado eCRF (V3)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row}>
              <td className="border border-black p-3 text-center font-bold text-slate-400">{row}</td>
              <td className="border border-black p-3 text-slate-300 font-mono tracking-widest">
                {hospital?.prefix || '____'} - ________
              </td>
              <td className="border border-black p-3 text-slate-300 text-center">__ / __ / 202_</td>
              <td className="border border-black p-3"></td>
              <td className="border border-black p-3 text-center">
                <div className="flex justify-center gap-4 text-xs font-bold text-slate-400">
                  <label className="flex items-center gap-1"><span className="inline-block w-3 h-3 border border-black"></span> DRAFT</label>
                  <label className="flex items-center gap-1"><span className="inline-block w-3 h-3 border border-black"></span> COMPLETED</label>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer Info */}
      <div className="mt-16 pt-4 border-t border-slate-900 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
        <div>Generado: {currentDate}</div>
        <div>Auditoría Clínica Centro</div>
      </div>
    </div>
  );
}
