import React from 'react';

interface HospitalData {
  id: string;
  name: string;
  prefix?: string;
  operators?: string[];
}

export default function PrintableDossier({ hospital }: { hospital: HospitalData | null }) {
  if (!hospital) {
    return <div className="p-8">Seleccione un centro para generar su dossier.</div>;
  }

  const currentDate = new Date().toLocaleDateString('es-ES');

  return (
    <div className="print-page w-full max-w-4xl mx-auto bg-white text-black font-sans">
      
      {/* Header section */}
      <div className="border-b-4 border-slate-900 pb-6 mb-12">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900">ULTREON™ 3.0</h1>
            <h2 className="text-xl font-bold text-slate-600 uppercase tracking-widest mt-1">SOFTWARE</h2>
          </div>
          <div className="text-right">
            <div className="text-sm font-bold bg-slate-900 text-white px-3 py-1 inline-block rounded uppercase tracking-widest">
              Dossier del Centro
            </div>
          </div>
        </div>
        <p className="text-lg font-medium text-slate-500 mt-4">Post-Market Evaluation & Clinical Utility Registry</p>
      </div>

      {/* Hospital details */}
      <div className="space-y-8 mb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Hospital / Centro</span>
            <div className="text-2xl font-bold border-b-2 border-slate-200 pb-2">{hospital.name}</div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Código del Centro (Prefijo)</span>
            <div className="text-2xl font-bold border-b-2 border-slate-200 pb-2 font-mono">{hospital.prefix || 'N/A'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Investigador Principal</span>
            <div className="text-xl border-b-2 border-slate-200 pb-2 text-slate-300">______________________________________</div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Objetivo Mensual / Total</span>
            <div className="text-xl border-b-2 border-slate-200 pb-2 text-slate-300">______ / ______</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Fecha de Inicio de Recogida</span>
            <div className="text-xl border-b-2 border-slate-200 pb-2 text-slate-300">____ / ____ / ________</div>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Operadores Autorizados</span>
            <div className="border-b-2 border-slate-200 pb-2 min-h-[40px]">
              {hospital.operators && hospital.operators.length > 0 ? (
                <ul className="list-disc list-inside text-lg font-medium">
                  {hospital.operators.map((op, idx) => (
                    <li key={idx}>{op}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-slate-400 italic">No hay operadores registrados o ________________________</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice Box */}
      <div className="border-2 border-slate-900 bg-slate-50 p-8 rounded-xl mb-16 print-border">
        <div className="flex items-center gap-4 mb-4">
          <svg className="w-8 h-8 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-xl font-black uppercase tracking-widest text-slate-900">Aviso Crítico de Privacidad</h3>
        </div>
        <div className="space-y-4 text-slate-800 font-medium leading-relaxed">
          <p>
            El Registro central utiliza exclusivamente códigos pseudoanónimos (ej: <strong>{hospital.prefix || 'XXX'}-00001</strong>).
            <strong> No deben introducirse ni remitirse NHC, SIP, nombre, iniciales ni ningún identificador directo del paciente</strong> en la plataforma electrónica.
          </p>
          <p>
            La correspondencia entre el Código del Registro y el NHC/SIP permanece <strong>exclusivamente bajo custodia local del centro</strong> y no se almacena en la plataforma central.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-24 pt-6 border-t border-slate-200 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
        <div>Generado: {currentDate}</div>
        <div>V3.0.0 (Protocolo 2026)</div>
        <div>Uso Interno del Centro</div>
      </div>

    </div>
  );
}
