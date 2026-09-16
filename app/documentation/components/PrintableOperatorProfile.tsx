import React from 'react';

interface HospitalData {
  id: string;
  name: string;
  prefix?: string;
  operators?: string[];
}

export default function PrintableOperatorProfile({ hospital }: { hospital: HospitalData | null }) {
  const currentDate = new Date().toLocaleDateString('es-ES');
  const Box = () => <span className="inline-block w-4 h-4 border border-black align-middle mr-2"></span>;

  // We print profiles for the registered operators or blank lines if none
  const operatorsList = (hospital?.operators && hospital.operators.length > 0) 
    ? hospital.operators 
    : ['________________________', '________________________', '________________________'];

  return (
    <div className="print-page w-full max-w-4xl mx-auto bg-white text-black font-sans text-sm pb-12">
      
      {/* Header */}
      <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">PERFIL CLÍNICO DEL OPERADOR</h1>
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

      <div className="bg-slate-100 border border-black p-3 mb-6 text-xs font-bold uppercase tracking-wider text-center">
        Cumplimente esta ficha UNA ÚNICA VEZ por cada operador al inicio de su participación en el registro.
      </div>

      <div className="space-y-8">
        {operatorsList.map((op, idx) => (
          <div key={idx} className="border-2 border-black p-4" style={{ pageBreakInside: 'avoid' }}>
            <div className="flex justify-between items-end border-b border-black pb-2 mb-4">
              <div className="font-bold text-lg uppercase">Operador: <span className="font-normal uppercase text-slate-700">{op}</span></div>
              <div className="text-xs font-bold">Fecha de alta: ___ / ___ / 202_</div>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div>
                <div className="font-bold mb-2">Experiencia global con OCT:</div>
                <div className="flex flex-col gap-1 text-sm">
                  <label><Box /> &lt; 1 año</label>
                  <label><Box /> 1 – 3 años</label>
                  <label><Box /> 3 – 5 años</label>
                  <label><Box /> &gt; 5 años</label>
                </div>
              </div>
              <div>
                <div className="font-bold mb-2">Nivel de experiencia autopercibido (OCT):</div>
                <div className="flex flex-col gap-1 text-sm">
                  <label><Box /> Experto</label>
                  <label><Box /> Usuario habitual</label>
                  <label><Box /> Usuario ocasional</label>
                </div>
              </div>
              <div>
                <div className="font-bold mb-2">De cada 10 PCI en su práctica, ¿cuántas guía con...?</div>
                <div className="flex flex-col gap-2 mt-1 text-sm">
                  <div>OCT: <span className="border-b border-black inline-block w-12 text-center text-transparent">X</span> / 10</div>
                  <div>IVUS: <span className="border-b border-black inline-block w-12 text-center text-transparent">X</span> / 10</div>
                  <div>Solo angiografía: <span className="border-b border-black inline-block w-12 text-center text-transparent">X</span> / 10</div>
                </div>
              </div>
              <div>
                <div className="font-bold mb-2">Experiencia con ULTREON™ 3.0:</div>
                <div className="flex flex-col gap-1 text-sm">
                  <label><Box /> Primeras utilizaciones (1-5 casos)</label>
                  <label><Box /> Usuario reciente</label>
                  <label><Box /> Usuario experimentado</label>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-16 pt-4 border-t border-slate-900 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
        <div>Generado: {currentDate}</div>
        <div>Auditoría Clínica Centro</div>
      </div>
    </div>
  );
}
