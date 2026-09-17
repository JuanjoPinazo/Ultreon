import React from 'react';

export default function PrintableChecklist() {
  return (
    <div className="print-page w-full max-w-4xl mx-auto bg-white text-black font-sans">
      <div className="border-b-4 border-slate-900 pb-4 mb-8">
        <h2 className="text-3xl font-black uppercase text-slate-900">Site Initiation Checklist</h2>
        <p className="text-sm font-medium text-slate-500 mt-2 uppercase tracking-widest">REGISTRO CLÍNICO ULTREON™ 3.0</p>
      </div>

      <p className="text-sm mb-8 font-medium">
        Requisitos obligatorios para declarar el centro como ACTIVO e iniciar el reclutamiento.
      </p>

      <div className="space-y-6">
        {[
          'Investigador Principal confirmado y con acceso.',
          'Operadores clínicos confirmados y con perfil basal completado.',
          'Usuarios de plataforma creados con los roles correctos.',
          'Objetivo del centro configurado en el sistema.',
          'Documentación del centro (Dossier) impresa y entregada.',
          'Formación completada (Protocolo y uso de la plataforma).',
          'Acceso al eCRF digital validado por el equipo.',
          'Privacidad explicada (Prohibición estricta de introducir PII centralmente).',
          'Hoja local de correspondencia (Código ↔ NHC/SIP) impresa y bajo custodia exclusiva del centro.',
          'Contacto de soporte técnico entregado al equipo.'
        ].map((item, idx) => (
          <div key={idx} className="flex items-start gap-4">
            <div className="w-6 h-6 flex-shrink-0 border-2 border-slate-900 mt-0.5 print-border"></div>
            <p className="text-lg leading-tight font-medium text-slate-800">{item}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 bg-slate-100 p-6 border border-slate-300">
        <h3 className="font-bold uppercase tracking-widest mb-6">Aprobación Final de Activación</h3>
        <div className="grid grid-cols-2 gap-12">
          <div>
            <div className="border-b border-slate-400 h-8 mb-2"></div>
            <p className="text-xs text-slate-500">Firma del Monitor / Coordinador del Registro</p>
          </div>
          <div>
            <div className="border-b border-slate-400 h-8 mb-2"></div>
            <p className="text-xs text-slate-500">Firma del Investigador Principal</p>
          </div>
        </div>
        <div className="mt-6 flex items-center gap-4">
          <p className="font-bold text-sm">Centro Listo para Inicio:</p>
          <div className="flex gap-2 text-sm">
            <span>[ ] SÍ</span>
            <span className="ml-4">[ ] NO</span>
          </div>
          <div className="ml-auto flex items-end gap-2">
            <p className="font-bold text-sm">Fecha:</p>
            <div className="border-b border-slate-400 w-32"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
