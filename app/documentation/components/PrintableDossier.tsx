import React from 'react';
import { registrySupportConfig } from '@/lib/registry/supportConfig';
import PrintableECRF from './PrintableECRF';
import PrintableInclusionsControl from './PrintableInclusionsControl';
import PrintableOperatorProfile from './PrintableOperatorProfile';
import PrintableSignatures from './PrintableSignatures';
import PrintableTraining from './PrintableTraining';
import PrintableChecklist from './PrintableChecklist';
import PrintableIncidents from './PrintableIncidents';

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

export default function PrintableDossier({ hospital }: { hospital: HospitalData | null }) {
  if (!hospital) {
    return <div className="p-8 text-center text-slate-500">Seleccione un centro para generar su dossier.</div>;
  }

  const currentDate = new Date().toLocaleDateString('es-ES');

  return (
    <div className="w-full bg-white text-black font-sans">
      
      {/* ---------------- A. PORTADA ---------------- */}
      <div className="print-page w-full max-w-4xl mx-auto flex flex-col justify-between min-h-[950px]">
        <div className="border-b-4 border-slate-900 pb-6 mb-12 mt-12">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase text-slate-900">ULTREON™ 3.0 SOFTWARE</h1>
              <h2 className="text-xl font-bold text-slate-600 uppercase tracking-widest mt-1">REGISTRO CLÍNICO</h2>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold bg-slate-900 text-white px-3 py-1 inline-block rounded uppercase tracking-widest">
                Dossier del Centro
              </div>
            </div>
          </div>
          <p className="text-lg font-medium text-slate-500 mt-4">Post-Market Evaluation & Clinical Utility Registry</p>
        </div>

        {/* Global phase seal simulation based on passed hospital or QA. */}
        <div className="flex justify-center mb-12">
          {hospital.phase === 'CENTER_LIVE' ? (
            <div className="border-4 border-emerald-600 text-emerald-600 font-bold px-8 py-4 text-2xl uppercase tracking-widest rotate-[-5deg] opacity-80 inline-block">
              DOCUMENTACIÓN DEL REGISTRO ACTIVO
            </div>
          ) : (
            <div className="border-4 border-red-600 text-red-600 font-bold px-8 py-4 text-2xl uppercase tracking-widest rotate-[-5deg] opacity-80 inline-block">
              DOCUMENTACIÓN DE PRELANZAMIENTO
            </div>
          )}
        </div>

        {/* Hospital details */}
        <div className="space-y-8 flex-1">
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
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Objetivo Asignado</span>
              <div className="text-xl border-b-2 border-slate-200 pb-2 text-slate-900 font-bold">
                {hospital.target && hospital.target.status === 'ACTIVE' ? (
                  <div className="flex gap-4">
                    <span>{hospital.target.target_total} casos</span>
                    {hospital.target.target_monthly && <span className="text-slate-500 text-sm mt-1">({hospital.target.target_monthly} / mes)</span>}
                  </div>
                ) : (
                  <span className="text-slate-400 italic font-normal">Objetivo pendiente de definir</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Fechas de Recogida</span>
              <div className="text-xl border-b-2 border-slate-200 pb-2 text-slate-900 font-bold flex flex-col gap-1">
                {hospital.target ? (
                  <>
                    <span>Inicio: {new Date(hospital.target.start_date).toLocaleDateString('es-ES')}</span>
                    {hospital.target.end_date && <span className="text-sm text-slate-500 font-medium">Fin: {new Date(hospital.target.end_date).toLocaleDateString('es-ES')}</span>}
                  </>
                ) : (
                  <span className="text-slate-300">____ / ____ / ________</span>
                )}
              </div>
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
                  <span className="text-slate-400 italic font-normal">Sin operadores asignados</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex justify-between text-xs text-slate-500 uppercase tracking-widest">
          <span>Generado: {currentDate}</span>
          <span>Versión 1.0 (Sprint 5A)</span>
        </div>
      </div>

      {/* ---------------- B. RESUMEN DEL REGISTRO ---------------- */}
      <div className="print-page w-full max-w-4xl mx-auto">
        <h2 className="text-3xl font-black uppercase text-slate-900 mb-8 border-b-2 border-slate-900 pb-2">Resumen del Registro</h2>
        <div className="space-y-6 text-sm leading-relaxed text-justify">
          <p>
            El registro observacional multicéntrico tiene como propósito fundamental evaluar la utilidad clínica del software <strong>ULTREON™ 3.0</strong> en la práctica intervencionista real. Este proyecto no altera la práctica clínica habitual, limitándose a recoger el flujo de decisión del operador intra-sala.
          </p>
          <p>
            A medida que la complejidad de la Intervención Coronaria Percutánea (PCI) aumenta, el uso de la Tomografía de Coherencia Óptica (OCT) se vuelve crítico para la evaluación de la morfología de la placa, la detección de calcio severo y la optimización del implante de stents. El software ULTREON™ 3.0 integra inteligencia artificial para asistir en estas determinaciones de forma automática.
          </p>
          <p>
            El registro medirá de manera sistemática el impacto diagnóstico de la tecnología, analizando la tasa de cambios en la estrategia terapéutica respecto a la angiografía aislada, y centrándose específicamente en escenarios complejos como lesiones calcificadas, lesiones ricas en lípidos, enfermedad del Tronco Coronario Izquierdo (TCI) y la utilización combinada de FFR-OCT. Adicionalmente, medirá la tasa de correcciones post-PCI necesarias para una adecuada aposición y expansión, así como parámetros de adopción y usabilidad de la herramienta.
          </p>
        </div>
      </div>

      {/* ---------------- C. OBJETIVOS CIENTÍFICOS ---------------- */}
      <div className="print-page w-full max-w-4xl mx-auto">
        <h2 className="text-3xl font-black uppercase text-slate-900 mb-8 border-b-2 border-slate-900 pb-2">Objetivos Científicos</h2>
        <ul className="space-y-6 text-sm">
          <li>
            <strong>Diagnostic Incremental Yield:</strong> Cuantificar la información clínica relevante aportada por la OCT que no resultaba evidente a través de la angiografía cuantitativa tradicional.
          </li>
          <li>
            <strong>Decision Change Rate:</strong> Evaluar la proporción de intervenciones en las que la información obtenida mediante OCT motivó un cambio directo en la estrategia terapéutica previamente planificada.
          </li>
          <li>
            <strong>Impacto de la detección de calcio:</strong> Determinar la capacidad del software para detectar calcio severo y cómo esto condiciona el uso de herramientas de modificación de placa (Rotablator, IVL, etc.).
          </li>
          <li>
            <strong>Valor en análisis lipídico:</strong> Registrar la incidencia y el valor diagnóstico de la detección automatizada de placa lipídica vulnerable en el contexto de la PCI moderna.
          </li>
          <li>
            <strong>Utilidad en el Tronco Coronario Izquierdo (TCI):</strong> Analizar los cambios estratégicos motivados por los hallazgos anatómicos en lesiones de alto riesgo que involucran el ostium o bifurcación del TCI.
          </li>
          <li>
            <strong>Impacto FFR-OCT:</strong> Estudiar la concordancia y complementariedad entre los datos fisiológicos y las mediciones anatómicas de OCT.
          </li>
          <li>
            <strong>Post-PCI Correction Rate:</strong> Medir la frecuencia con la que los hallazgos de la OCT post-implante obligan a realizar maniobras de optimización adicionales (post-dilatación) para corregir infraexpansión o malaposición.
          </li>
          <li>
            <strong>Usabilidad y Adopción:</strong> Analizar la curva de aprendizaje, usabilidad del software y la intención de los operadores de incorporar ULTREON™ 3.0 de manera rutinaria.
          </li>
        </ul>
      </div>

      {/* ---------------- G. GUÍA RÁPIDA DEL INVESTIGADOR ---------------- */}
      <div className="print-page w-full max-w-4xl mx-auto">
        <h2 className="text-3xl font-black uppercase text-slate-900 mb-8 border-b-2 border-slate-900 pb-2">Guía Rápida del Investigador</h2>
        <div className="space-y-6 text-sm">
          <p className="font-bold text-red-700 bg-red-50 p-4 border border-red-200">
            PROHIBICIÓN ESTRICTA DE PII CENTRAL: No introduzca nunca el Número de Historia Clínica (NHC), SIP, nombre o iniciales del paciente en la plataforma central. La correspondencia debe realizarse EXCLUSIVAMENTE en la Hoja Local del Centro que debe custodiar físicamente el Investigador Principal.
          </p>
          
          <h3 className="text-lg font-bold mt-4">1. ¿Qué casos registrar?</h3>
          <p>Se incluirán de forma prospectiva todos los pacientes sometidos a una PCI en los que se utilice la tecnología OCT con ULTREON™ 3.0 para la planificación o optimización del procedimiento, siempre que el paciente otorgue su consentimiento verbal según las políticas locales.</p>
          
          <h3 className="text-lg font-bold mt-4">2. ¿Cuándo cumplimentar el eCRF?</h3>
          <p>El eCRF debe ser cumplimentado de manera inmediata o intra-sala. Recomendamos utilizar el eCRF Maestro impreso adjunto en este dossier durante la intervención y volcar los datos a la plataforma web antes del alta hospitalaria.</p>

          <h3 className="text-lg font-bold mt-4">3. Fases del Registro (DEMO vs PRELAUNCH vs LIVE)</h3>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>DEMO:</strong> Casos de prueba sin validez científica generados automáticamente. No influyen en los KPIs.</li>
            <li><strong>PRELAUNCH:</strong> Fase actual de pilotaje. Los casos generados sirven para calibrar la plataforma. No se generará economía oficial con estos registros.</li>
            <li><strong>LIVE:</strong> Fase de registro oficial. Únicamente estos casos contabilizan para el objetivo del centro y devengan liquidación económica.</li>
          </ul>

          <h3 className="text-lg font-bold mt-4">4. Módulos Condicionales</h3>
          <p>Solo deberá completar los módulos de Calcio, Lípidos, TCI o FFR-OCT si se dan las condiciones anatómicas y el operador decidió activarlos en la consola de la plataforma durante el caso.</p>

          <h3 className="text-lg font-bold mt-4">5. Corrección de Datos</h3>
          <p>Un caso en estado DRAFT puede editarse libremente. Una vez marcado como COMPLETED, el caso se bloquea y requiere de una justificación auditada para cualquier modificación. Contacte con el soporte técnico o el coordinador (CRA) para solicitar correcciones.</p>
        </div>
      </div>

      {/* ---------------- SUB-COMPONENTS ---------------- */}
      <PrintableOperatorProfile hospital={hospital} />
      <PrintableChecklist hospital={hospital} />
      <PrintableSignatures />
      <PrintableTraining />
      <PrintableInclusionsControl hospital={hospital} />
      <PrintableIncidents />
      <PrintableECRF />
      
      {/* ---------------- O. SOPORTE Y N. CORRECCIÓN ---------------- */}
      <div className="print-page w-full max-w-4xl mx-auto">
        <h2 className="text-3xl font-black uppercase text-slate-900 mb-8 border-b-2 border-slate-900 pb-2">Soporte y Corrección de Datos</h2>
        
        <div className="mb-12">
          <h3 className="text-xl font-bold mb-4">Información de Soporte</h3>
          <table className="w-full text-left border-collapse border border-slate-300 text-sm">
            <tbody>
              <tr><td className="border border-slate-300 p-2 font-bold bg-slate-50 w-1/3">Responsable Registro</td><td className="border border-slate-300 p-2">{registrySupportConfig.registryOwner}</td></tr>
              <tr><td className="border border-slate-300 p-2 font-bold bg-slate-50">Soporte Técnico Web</td><td className="border border-slate-300 p-2">{registrySupportConfig.technicalSupportEmail}</td></tr>
              <tr><td className="border border-slate-300 p-2 font-bold bg-slate-50">Horario de Atención</td><td className="border border-slate-300 p-2">Lunes - Viernes (09:00 - 18:00 CET)</td></tr>
              <tr><td className="border border-slate-300 p-2 font-bold bg-slate-50">Proceso de Escalado</td><td className="border border-slate-300 p-2">1. Email a Soporte Web. 2. Contactar Monitor.</td></tr>
            </tbody>
          </table>
        </div>

        <div>
          <h3 className="text-xl font-bold mb-4">Procedimiento de Corrección de Datos</h3>
          <p className="text-sm mb-4">
            Los casos en estado <span className="font-mono bg-slate-100 px-1">DRAFT</span> pueden ser modificados libremente por los operadores con acceso de edición en el centro. Sin embargo, una vez que el caso se marca como <span className="font-mono bg-slate-100 px-1">COMPLETED</span>, no es posible realizar ediciones silenciosas.
          </p>
          <p className="text-sm mb-4">
            <strong>Política Vigente:</strong> Para corregir un dato clínico en un caso completado, es obligatorio generar una solicitud auditada. Debe figurar el usuario que lo solicita, la fecha, el valor anterior, el nuevo valor y el motivo clínico de la discrepancia. Si el caso ya ha sido integrado en la base de datos central para su análisis estadístico, el comité evaluará si se acepta el Data Clarification Form (DCF).
          </p>
        </div>
      </div>

      {/* ---------------- P. CONTROL DE VERSIONES ---------------- */}
      <div className="print-page w-full max-w-4xl mx-auto">
        <h2 className="text-3xl font-black uppercase text-slate-900 mb-8 border-b-2 border-slate-900 pb-2">Control de Versiones del Documento</h2>
        
        <table className="w-full text-left border-collapse border border-slate-300 text-sm">
          <thead>
            <tr className="bg-slate-100 uppercase text-xs tracking-wider">
              <th className="border border-slate-300 p-2">Documento</th>
              <th className="border border-slate-300 p-2">Versión</th>
              <th className="border border-slate-300 p-2">Fecha Emisión</th>
              <th className="border border-slate-300 p-2">Sustituye A</th>
              <th className="border border-slate-300 p-2">Observaciones</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-slate-300 p-2">Dossier del Centro - {hospital.prefix || hospital.name}</td>
              <td className="border border-slate-300 p-2">1.0</td>
              <td className="border border-slate-300 p-2">{currentDate}</td>
              <td className="border border-slate-300 p-2">N/A</td>
              <td className="border border-slate-300 p-2">Versión inicial Sprint 5A (Prelaunch)</td>
            </tr>
          </tbody>
        </table>
      </div>
      
    </div>
  );
}
