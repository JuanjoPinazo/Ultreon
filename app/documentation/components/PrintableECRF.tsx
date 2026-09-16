import React from 'react';

export default function PrintableECRF() {
  const currentDate = new Date().toLocaleDateString('es-ES');

  // Helpers to draw checkboxes
  const Box = () => <span className="inline-block w-4 h-4 border border-black align-middle mr-2"></span>;
  const Scale7 = () => (
    <div className="flex gap-4 items-center">
      <span>Nada</span>
      {[1, 2, 3, 4, 5, 6, 7].map(num => (
        <div key={num} className="flex flex-col items-center">
          <span className="text-xs">{num}</span>
          <span className="inline-block w-5 h-5 border border-black"></span>
        </div>
      ))}
      <span>Mucho</span>
    </div>
  );

  return (
    <div className="print-page w-full max-w-4xl mx-auto bg-white text-black font-sans text-[13px] leading-tight pb-12">
      
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black uppercase">ULTREON™ 3.0 — CUADERNO DE RECOGIDA DE DATOS</h1>
          <h2 className="text-sm font-bold text-gray-600">Registro Clínico V3.0 (eCRF Papel)</h2>
        </div>
        <div className="text-right">
          <div className="border border-black p-2 w-48 text-left">
            <span className="text-[10px] uppercase font-bold block mb-1">Código de Caso</span>
            <div className="text-lg font-mono tracking-widest text-gray-300 border-b border-gray-300">____ - _____</div>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-center mb-6 font-bold uppercase tracking-wider bg-gray-100 p-1 border border-black">
        Cumplimente este formulario con letra mayúscula clara y transfiera los datos a la plataforma electrónica tras la intervención. No incluya datos identificativos del paciente.
      </div>

      {/* SECCIÓN 1 */}
      <div className="mb-8" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="bg-black text-white px-2 py-1 font-bold mb-4">SECCIÓN 1 — DATOS DEL CASO</h3>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-4">
          <div className="border-b border-gray-400 pb-1 flex items-end">
            <span className="font-bold mr-2 w-24">Fecha:</span> <span className="text-gray-300">___ / ___ / 202__</span>
          </div>
          <div className="border-b border-gray-400 pb-1 flex items-end">
            <span className="font-bold mr-2 w-24">Operador:</span> <span className="text-gray-300 w-full text-center">_________________________________</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mt-6">
          <div className="border-b border-gray-400 pb-1 flex flex-col">
            <span className="font-bold mb-1">Presentación clínica:</span>
            <span className="text-gray-300 mt-2">_______________________________________________</span>
          </div>
          <div className="border-b border-gray-400 pb-1 flex flex-col">
            <span className="font-bold mb-1">Tipo de lesión:</span>
            <span className="text-gray-300 mt-2">_______________________________________________</span>
          </div>
          <div className="border-b border-gray-400 pb-1 flex flex-col col-span-2 mt-4">
            <span className="font-bold mb-1">Indicación principal para OCT:</span>
            <span className="text-gray-300 mt-2">_____________________________________________________________________________________________</span>
          </div>
        </div>
      </div>

      {/* SECCIÓN 2 */}
      <div className="mb-8 print-page" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="bg-black text-white px-2 py-1 font-bold mb-4">SECCIÓN 2 — ADQUISICIONES OCT</h3>
        
        {[1, 2, 3].map((num) => (
          <div key={num} className="border border-black p-4 mb-4" style={{ pageBreakInside: 'avoid' }}>
            <div className="font-bold border-b border-black pb-1 mb-3">Adquisición nº {num}</div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <span className="font-bold block mb-1">Momento:</span>
                <div className="flex flex-col gap-1">
                  <label><Box /> Pre-PCI</label>
                  <label><Box /> Post-PCI</label>
                  <label><Box /> Seguimiento</label>
                </div>
              </div>
              <div>
                <span className="font-bold block mb-1">Vaso:</span>
                <div className="grid grid-cols-2 gap-1">
                  <label><Box /> LAD</label>
                  <label><Box /> RCA</label>
                  <label><Box /> LCX</label>
                  <label><Box /> TCI</label>
                </div>
                <div className="mt-1 flex items-end">
                  <label><Box /> Otro:</label> <span className="border-b border-gray-400 w-full ml-1 inline-block"></span>
                </div>
              </div>
              <div>
                <span className="font-bold block mb-1">Modo:</span>
                <div className="flex flex-col gap-1">
                  <label><Box /> 75 mm Rápido</label>
                  <label><Box /> 75 mm Estándar</label>
                  <label><Box /> 54 mm Alta Res.</label>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <span className="font-bold block mb-1">Co-registro automático:</span>
                <div className="flex gap-4">
                  <label><Box /> Sí</label>
                  <label><Box /> No</label>
                  <label><Box /> No disponible</label>
                </div>
              </div>
              <div className="flex items-center">
                <span className="font-bold mr-2">FPS (imágenes/seg):</span>
                <span className="border-b border-gray-400 w-16 inline-block"></span>
              </div>
            </div>

            <div className="mb-4">
              <span className="font-bold block mb-2">Impacto del co-registro en la intervención:</span>
              <Scale7 />
            </div>

            <div className="bg-gray-100 p-3 border border-dashed border-gray-400">
              <div className="font-bold mb-2">FAST PULLBACK — Solo si procede (Alta velocidad / Low contrast):</div>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div>
                  <span className="block mb-1">Medio de purga:</span>
                  <div className="flex gap-4">
                    <label><Box /> Contraste</label>
                    <label><Box /> Salino</label>
                  </div>
                </div>
                <div className="flex flex-col justify-end">
                  <span>Volumen: <span className="border-b border-gray-400 w-12 inline-block"></span> mL</span>
                </div>
                <div className="flex flex-col justify-end">
                  <span>Flujo: <span className="border-b border-gray-400 w-12 inline-block"></span> mL/s</span>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="block mb-1">Facilidad de adquisición técnica:</span>
                  <Scale7 />
                </div>
                <div>
                  <span className="block mb-1">Calidad del lavado (Clearance):</span>
                  <Scale7 />
                </div>
                <div>
                  <span className="block mb-1">Impacto clínico/operativo del Fast Pullback:</span>
                  <Scale7 />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SECCIÓN 3 y 4 */}
      <div className="mb-8 print-page" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="bg-black text-white px-2 py-1 font-bold mb-4">SECCIÓN 3 — ESTRATEGIA INICIAL PLANIFICADA (SOLO ANGIOGRAFÍA)</h3>
        <div className="border border-gray-300 p-2 min-h-[80px] mb-8">
          <div className="border-b border-dotted border-gray-300 h-6"></div>
          <div className="border-b border-dotted border-gray-300 h-6"></div>
          <div className="border-b border-dotted border-gray-300 h-6"></div>
        </div>

        <h3 className="bg-black text-white px-2 py-1 font-bold mb-4">SECCIÓN 4 — HALLAZGOS OCT PRE-PCI</h3>
        
        <div className="mb-6">
          <div className="font-bold mb-2">Hallazgos principales en OCT (marque todos los aplicables):</div>
          <div className="grid grid-cols-3 gap-2">
            <label><Box /> Lesión larga</label>
            <label><Box /> Calcio</label>
            <label><Box /> Placa lipídica</label>
            <label><Box /> Zona de aterrizaje subóptima</label>
            <label><Box /> Tronco Coronario Izquierdo (TCI)</label>
            <div className="flex items-end">
              <label><Box /> Otro:</label> <span className="border-b border-gray-400 w-full ml-1 inline-block"></span>
            </div>
          </div>
        </div>

        <div className="border-2 border-black p-4 bg-gray-50 mb-6">
          <div className="mb-4">
            <div className="font-bold mb-2">1. ¿La OCT aportó información relevante no evidente angiográficamente?</div>
            <div className="flex gap-6"><label><Box /> Sí</label><label><Box /> No</label></div>
          </div>
          <div>
            <div className="font-bold mb-2">2. ¿La información OCT influyó en un CAMBIO DE ESTRATEGIA respecto a angiografía?</div>
            <div className="flex gap-6"><label><Box /> Sí</label><label><Box /> No</label></div>
          </div>
        </div>

        {/* MÓDULO CALCIO */}
        <div className="border border-black p-4 mb-4">
          <div className="font-bold bg-black text-white inline-block px-2 py-1 mb-4 text-xs">MÓDULO DE CALCIO (Luz &gt; 180º, grosor &gt; 0.5mm, longitud)</div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="w-1/2">Precisión percibida en la detección:</span> <Scale7 />
            </div>
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="w-1/2">Facilidad de interpretación:</span> <Scale7 />
            </div>
            <div className="flex justify-between items-center border-b border-gray-200 pb-2">
              <span className="w-1/2">Utilidad clínica general:</span> <Scale7 />
            </div>
            
            <div className="mt-4 font-bold">¿La detección automática aportó información que había pasado desapercibida?</div>
            <div className="flex gap-4"><label><Box /> Sí</label><label><Box /> No</label></div>

            <div className="mt-4 font-bold">¿La detección influyó en la decisión de preparar la placa?</div>
            <div className="flex gap-4"><label><Box /> Sí</label><label><Box /> No</label></div>

            <div className="mt-4 font-bold">Tratamiento del calcio seleccionado:</div>
            <div className="grid grid-cols-2 gap-2">
              <label><Box /> Balón NC</label>
              <label><Box /> Aterectomía Rotacional / Orbital</label>
              <label><Box /> Lithotripsy (IVL)</label>
              <label><Box /> Scoring / Cutting Balloon</label>
            </div>

            <div className="mt-4 font-bold bg-gray-200 p-2">¿Habría elegido una estrategia diferente sin ULTREON™ 3.0?</div>
            <div className="flex gap-4 p-2"><label><Box /> Sí</label><label><Box /> No</label></div>
          </div>
        </div>

        {/* MÓDULO TCI & LÍPIDOS & FFR */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-black p-3">
             <div className="font-bold bg-black text-white inline-block px-2 py-1 mb-3 text-xs">MÓDULO DE LÍPIDOS</div>
             <div className="space-y-3">
               <div><span className="block mb-1">Precisión de detección:</span><Scale7 /></div>
               <div><span className="block mb-1">Facilidad de interpretación:</span><Scale7 /></div>
               <div><span className="block mb-1">Impacto en zona de aterrizaje:</span><Scale7 /></div>
               <div className="mt-2 font-bold text-xs">¿Modificó el plan de stenting?</div>
               <div className="flex gap-4"><label><Box /> Sí</label><label><Box /> No</label></div>
             </div>
          </div>
          
          <div className="border border-black p-3">
             <div className="font-bold bg-black text-white inline-block px-2 py-1 mb-3 text-xs">MÓDULO FFR-OCT</div>
             <div className="space-y-2">
               <div><span className="block text-xs font-bold">¿Se realizaron correcciones en el pullback?</span><div className="flex gap-4"><label><Box /> Sí</label><label><Box /> No</label></div></div>
               <div className="mt-2"><span className="block text-xs font-bold">¿Cambió la decisión de tratar la lesión?</span><div className="flex gap-4"><label><Box /> Sí</label><label><Box /> No</label></div></div>
               <div className="mt-2 font-bold text-xs">¿Cómo cambió?</div>
               <div className="flex flex-col gap-1 text-xs">
                  <label><Box /> De Conservador a PCI</label>
                  <label><Box /> De PCI a Conservador</label>
               </div>
               <div className="mt-2"><span className="block text-xs font-bold">Confianza en el valor:</span><Scale7 /></div>
             </div>
          </div>
        </div>
      </div>

      {/* SECCIÓN 5 y 6 */}
      <div className="mb-8 print-page" style={{ pageBreakInside: 'avoid' }}>
        <h3 className="bg-black text-white px-2 py-1 font-bold mb-4">SECCIÓN 5 — IMPACTO Y POST-PCI</h3>
        
        <div className="mb-6">
          <div className="font-bold mb-1">Si la estrategia inicial cambió, ¿qué se modificó? (Stents, preparación, etc.)</div>
          <div className="border-b border-dotted border-gray-300 h-6"></div>
          <div className="border-b border-dotted border-gray-300 h-6"></div>
        </div>

        <div className="border-t border-b border-gray-300 py-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="font-bold mb-2">OCT de optimización post-stent:</div>
              <div className="flex gap-4"><label><Box /> Sí</label><label><Box /> No</label></div>
            </div>
            <div>
              <div className="font-bold mb-2">Hallazgos subóptimos Post-PCI:</div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                <label><Box /> Infraexpansión</label>
                <label><Box /> Disección de borde</label>
                <label><Box /> Mala aposición</label>
                <label><Box /> Placa residual</label>
                <label><Box /> Ninguno</label>
                <div className="flex items-end"><label><Box /> Otro:</label> <span className="border-b border-gray-400 w-12 ml-1 inline-block"></span></div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <div className="font-bold mb-2 text-red-700 uppercase">¿Fue necesario tratamiento adicional tras la OCT post-stent?</div>
              <div className="flex gap-4 font-bold text-lg"><label><Box /> SÍ</label><label><Box /> NO</label></div>
            </div>
            <div>
              <div className="font-bold mb-2">Tratamiento de optimización aplicado:</div>
              <div className="grid grid-cols-1 gap-1 text-xs">
                <label><Box /> Postdilatación con balón</label>
                <label><Box /> Stent adicional</label>
                <label><Box /> Ambos</label>
              </div>
            </div>
          </div>
        </div>

        <h3 className="bg-black text-white px-2 py-1 font-bold mb-4">SECCIÓN 6 — VALOR CLÍNICO Y ADOPCIÓN</h3>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="font-bold mb-2">Usabilidad global de ULTREON™ 3.0:</div>
              <Scale7 />
            </div>
            <div>
              <div className="font-bold mb-2">¿Prevé aumentar la utilización de OCT en su práctica tras usar esta versión?</div>
              <div className="flex flex-col gap-2">
                <label><Box /> Sí, en la mayoría de los casos</label>
                <label><Box /> Sí, en casos seleccionados</label>
                <label><Box /> No</label>
              </div>
            </div>
          </div>

          <div>
            <div className="font-bold mb-1">Principal beneficio clínico aportado por ULTREON™ 3.0 en este caso:</div>
            <div className="border-b border-dotted border-gray-400 h-6"></div>
          </div>
          <div>
            <div className="font-bold mb-1">Funcionalidad específica con mayor impacto:</div>
            <div className="border-b border-dotted border-gray-400 h-6"></div>
          </div>
          <div>
            <div className="font-bold mb-1">Comentarios y observaciones del operador:</div>
            <div className="border-b border-dotted border-gray-400 h-6"></div>
            <div className="border-b border-dotted border-gray-400 h-6"></div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 pt-4 border-t border-black flex justify-between items-center text-[10px] font-bold text-gray-500 uppercase">
          <div>Generado: {currentDate}</div>
          <div>Registro Clínico ULTREON™ 3.0 — CONFIDENCIAL</div>
          <div>Página de finalización</div>
        </div>
      </div>
    </div>
  );
}
