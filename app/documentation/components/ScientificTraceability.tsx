import React from 'react';

export default function ScientificTraceability() {
  const currentDate = new Date().toLocaleDateString('es-ES');

  const mappings = [
    { kpi: 'Diagnostic Incremental Yield', question: '¿OCT aportó info no evidente angiográficamente?', section: 'SECCIÓN 4', v3_key: 'global_assessment.incremental_diagnostic_yield' },
    { kpi: 'Decision Change Rate', question: '¿La OCT influyó en cambio de estrategia?', section: 'SECCIÓN 4', v3_key: 'global_assessment.changed_strategy' },
    { kpi: 'Calcium Treatment Impact', question: '¿Influyó en la decisión de preparar la placa?', section: 'MÓDULO DE CALCIO', v3_key: 'calcium_module.influenced_decision' },
    { kpi: 'Lipid Plaque Utility', question: '¿Modificó el plan de stenting?', section: 'MÓDULO DE LÍPIDOS', v3_key: 'lipid_module.modified_stent_plan' },
    { kpi: 'TCI Utility', question: 'Cambio de estrategia en TCI', section: 'MÓDULO TCI', v3_key: 'left_main_module.changed_strategy' },
    { kpi: 'FFR-OCT Impact', question: '¿Cambió la decisión de tratar la lesión?', section: 'MÓDULO FFR-OCT', v3_key: 'ffr_oct_module.changed_decision' },
    { kpi: 'Post-PCI Correction Rate', question: '¿Fue necesario tratamiento adicional?', section: 'SECCIÓN 5', v3_key: 'global_assessment.post_pci_correction_needed' },
    { kpi: 'Global Usability', question: 'Usabilidad global de ULTREON™ 3.0', section: 'SECCIÓN 6', v3_key: 'global_assessment.global_usability' },
    { kpi: 'Future Adoption', question: '¿Prevé aumentar la utilización de OCT?', section: 'SECCIÓN 6', v3_key: 'global_assessment.expected_oct_utilization_increase' }
  ];

  return (
    <div className="print-page w-full max-w-4xl mx-auto bg-white text-black font-sans text-sm pb-12">
      
      {/* Header */}
      <div className="border-b-4 border-slate-900 pb-6 mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black uppercase text-slate-900 tracking-tighter">TRAZABILIDAD CIENTÍFICA</h1>
          <h2 className="text-lg font-bold text-slate-600 uppercase tracking-widest mt-1">Diccionario V3.0 (KPI ↔ eCRF)</h2>
        </div>
        <div className="text-right">
          <div className="bg-slate-900 text-white p-2 text-xs uppercase font-bold tracking-widest">
            Uso Interno - Monitores
          </div>
        </div>
      </div>

      <div className="bg-slate-100 p-4 border border-slate-300 mb-8 text-xs font-bold text-slate-600 leading-relaxed">
        Este documento correlaciona los KPIs del estudio científico con las preguntas exactas presentadas en el eCRF papel y sus respectivas claves en la base de datos (esquema JSONB V3). 
        <br/><br/>
        <strong>No entregar esta hoja al Investigador Principal.</strong>
      </div>

      {/* Mapping Table */}
      <table className="w-full border-collapse border border-slate-400 mb-8 shadow-sm">
        <thead>
          <tr className="bg-slate-800 text-white uppercase tracking-widest text-xs">
            <th className="border border-slate-700 p-3 text-left">Conclusión / KPI</th>
            <th className="border border-slate-700 p-3 text-left">Pregunta eCRF Papel</th>
            <th className="border border-slate-700 p-3 text-left">Sección eCRF</th>
            <th className="border border-slate-700 p-3 text-left font-mono">Key V3 (Supabase)</th>
          </tr>
        </thead>
        <tbody>
          {mappings.map((item, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
              <td className="border border-slate-300 p-3 font-bold text-slate-900">{item.kpi}</td>
              <td className="border border-slate-300 p-3 text-slate-700">{item.question}</td>
              <td className="border border-slate-300 p-3 text-xs font-bold text-slate-500 uppercase">{item.section}</td>
              <td className="border border-slate-300 p-3 font-mono text-xs text-blue-800">{item.v3_key}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Verification Box */}
      <div className="border-2 border-dashed border-emerald-600 p-6 bg-emerald-50 rounded-xl">
        <h3 className="font-bold text-emerald-900 uppercase tracking-widest mb-2 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Trazabilidad Verificada
        </h3>
        <p className="text-emerald-800 text-xs font-medium">
          Todos los KPIs requeridos por el protocolo están cubiertos por variables directas u obligatorias en el eCRF Maestro V3.0. Las variables compuestas o booleanas han sido normalizadas.
        </p>
      </div>

      {/* Footer Info */}
      <div className="mt-16 pt-4 border-t border-slate-900 flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest">
        <div>Generado: {currentDate}</div>
        <div>Control de Monitoreo Central</div>
      </div>
    </div>
  );
}
