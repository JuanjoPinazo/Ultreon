import React from 'react';

interface HospitalData {
  id: string;
  name: string;
  phase?: string;
  prefix?: string;
  operators?: string[];
  target?: {
    target_total: number;
    target_monthly: number | null;
    target_weekly?: number | null;
    start_date: string;
    end_date: string | null;
    status?: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  } | null;
}

export default function PrintableInclusionsControl({ hospital }: { hospital: HospitalData | null }) {
  const currentDate = new Date().toLocaleDateString('es-ES');
  
  const targetTotal = hospital?.target?.target_total || 20;
  const rowsPerPage = 12;
  
  const totalPages = Math.ceil(targetTotal / rowsPerPage);
  const pages = Array.from({ length: totalPages }, (_, i) => i);

  return (
    <>
      {pages.map((pageIndex) => {
        const startRow = pageIndex * rowsPerPage + 1;
        const endRow = Math.min((pageIndex + 1) * rowsPerPage, targetTotal);
        const rows = Array.from({ length: endRow - startRow + 1 }, (_, i) => startRow + i);

        return (
          <div key={pageIndex} className="print-page bg-white text-black font-sans text-sm pb-12 break-before break-after">
            
            {/* Header */}
            <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">CONTROL DE INCLUSIONES</h1>
                <h2 className="text-lg font-bold text-slate-600 uppercase tracking-widest mt-1">Registro Clínico ULTREON™ 3.0</h2>
                {(!hospital?.target || hospital.target.status !== 'ACTIVE') && (
                  <div className="text-sm font-bold text-orange-600 mt-2 uppercase tracking-widest bg-orange-50 inline-block px-2 py-1 rounded">
                    Objetivo pendiente de definir
                  </div>
                )}
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
                  <th className="border border-black p-3 text-center whitespace-normal break-normal" style={{ width: '7%' }}>Nº</th>
                  <th className="border border-black p-3 text-left whitespace-normal break-normal" style={{ width: '24%' }}>Código de Caso</th>
                  <th className="border border-black p-3 text-center whitespace-normal break-normal" style={{ width: '15%' }}>Fecha</th>
                  <th className="border border-black p-3 text-left whitespace-normal break-normal" style={{ width: '18%' }}>Operador</th>
                  <th className="border border-black p-3 text-center whitespace-normal break-normal" style={{ width: '18%' }}>Estado eCRF</th>
                  <th className="border border-black p-3 text-left whitespace-normal break-normal" style={{ width: '18%' }}>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row}>
                    <td className="border border-black p-3 text-center font-bold text-slate-400">{row}</td>
                    <td className="border border-black p-3 text-slate-300 font-mono tracking-widest text-xs">
                      {hospital?.prefix || '____'}-________
                    </td>
                    <td className="border border-black p-3 text-slate-300 text-center text-xs">__/__/202_</td>
                    <td className="border border-black p-3"></td>
                    <td className="border border-black p-3 text-center">
                      <div className="flex flex-col gap-2 text-[10px] font-bold text-slate-400 text-left">
                        <label className="flex items-center gap-1"><span className="inline-block w-3 h-3 border border-black"></span> DRAFT</label>
                        <label className="flex items-center gap-1"><span className="inline-block w-3 h-3 border border-black"></span> COMPLETED</label>
                      </div>
                    </td>
                    <td className="border border-black p-3"></td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Footer Info */}
            <div className="mt-8 pt-4 border-t border-slate-900 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
              <div>Objetivo vigente en fecha de generación: {currentDate}</div>
              <div>Página {pageIndex + 1} de {totalPages}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}
