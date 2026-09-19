import React from 'react';

interface PrintableMonthlySettlementProps {
  settlementData?: any;
}

export default function PrintableMonthlySettlement({ settlementData }: PrintableMonthlySettlementProps) {
  const currentDate = new Date().toLocaleDateString('es-ES');
  
  // Use passed data or default to QA fixture
  const opName = settlementData?.operator || 'Operador QA';
  const benName = settlementData?.beneficiary || 'Beneficiario QA';
  const cCount = settlementData?.cases || 5;
  const uCount = settlementData?.units || 5;
  const basis = settlementData?.basis || 'PER_CASE';
  const taxBase = settlementData?.taxBase || 117.65;
  const vatRate = settlementData?.vatRate ?? 21;
  const vatAmount = settlementData?.vatAmount || 24.71;
  const withholdingRate = settlementData?.withholdingRate ?? 15;
  const withholdingAmount = settlementData?.withholdingAmount || 17.65;
  const paymentAmount = settlementData?.paymentAmount || 124.71;

  // QA Synthetic Fixture matching the prompt exactly for cases
  const mockQaCases = Array.from({ length: cCount }).map((_, i) => ({ 
    code: `QA-00${i+1}`, 
    date: currentDate, 
    hospital: 'Hospital QA', 
    operator: opName, 
    beneficiary: benName,
    taxBase: taxBase / cCount,
  }));

  return (
    <div className="print-page bg-white text-black font-sans pb-12 break-before">
      
      {/* Header */}
      <div className="border-b-4 border-slate-900 pb-4 mb-8">
        <h1 className="text-3xl font-black uppercase text-slate-900">REGISTRO CLÍNICO ULTREON™ 3.0</h1>
        <h2 className="text-xl font-bold text-slate-600 uppercase tracking-widest mt-1">Liquidación Mensual del Operador</h2>
      </div>

      {/* Meta Info */}
      <div className="grid grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 border border-slate-200">
        <div className="space-y-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Operador Clínico</div>
            <div className="text-xl font-black text-slate-900">{opName}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Beneficiario Vigente</div>
            <div className="text-sm font-bold">{benName}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Centros Relacionados</div>
            <div className="text-sm font-medium">Hospital QA</div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Periodo de Liquidación</div>
            <div className="text-lg font-bold">Septiembre 2026</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Base de Compensación</div>
            <div className="inline-block px-3 py-1 bg-slate-200 text-slate-800 font-bold uppercase tracking-widest rounded-full text-xs">
              {basis === 'PER_CASE' ? 'POR CASO (PER_CASE)' : 'POR UNIDAD (PER_UNIT)'}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Fecha de Emisión</div>
            <div className="text-sm">{currentDate}</div>
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Estado</div>
            <div className="inline-block px-3 py-1 bg-amber-200 text-amber-900 font-bold uppercase tracking-widest rounded-full text-xs">
              DRAFT (PRE-REVISIÓN)
            </div>
          </div>
        </div>
      </div>

      {/* Summary Box */}
      <div className="flex gap-4 mb-12">
        <div className="flex-1 p-4 border-2 border-slate-900 bg-slate-900 text-white text-center flex flex-col justify-center">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">Casos</div>
          <div className="text-2xl font-black">{cCount}</div>
        </div>
        <div className="flex-1 p-4 border-2 border-slate-900 bg-slate-800 text-white text-center flex flex-col justify-center">
          <div className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">Unidades</div>
          <div className="text-2xl font-black">{uCount}</div>
        </div>
        <div className="flex-1 p-4 border-2 border-slate-200 text-center flex flex-col justify-center">
          <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Base / Honorarios</div>
          <div className="text-xl font-bold">{taxBase.toFixed(2)} €</div>
        </div>
        {vatAmount > 0 && (
          <div className="flex-1 p-4 border-2 border-slate-200 text-center flex flex-col justify-center">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">IVA ({vatRate}%)</div>
            <div className="text-xl font-bold">{vatAmount.toFixed(2)} €</div>
          </div>
        )}
        {withholdingAmount > 0 && (
          <div className="flex-1 p-4 border-2 border-slate-200 text-center flex flex-col justify-center">
            <div className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Retención IRPF ({withholdingRate}%)</div>
            <div className="text-xl font-bold text-slate-500">-{withholdingAmount.toFixed(2)} €</div>
          </div>
        )}
        <div className="flex-1 p-4 border-2 border-green-600 bg-green-50 text-green-800 text-center flex flex-col justify-center">
          <div className="text-xs font-bold uppercase tracking-widest mb-1">Importe a Pagar</div>
          <div className="text-2xl font-black">{paymentAmount.toFixed(2)} €</div>
        </div>
      </div>

      {/* Detail Table */}
      <div className="mb-12">
        <h3 className="text-lg font-bold uppercase tracking-widest border-b-2 border-slate-900 pb-2 mb-4">Detalle de Casos Clínicos (Anónimos)</h3>
        <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
          <thead>
            <tr className="bg-slate-100 uppercase text-[9px] tracking-wider text-slate-600">
              <th className="border border-slate-300 p-2 text-center w-8">#</th>
              <th className="border border-slate-300 p-2">Caso</th>
              <th className="border border-slate-300 p-2">Fecha</th>
              <th className="border border-slate-300 p-2">Centro</th>
              <th className="border border-slate-300 p-2">Operador</th>
              <th className="border border-slate-300 p-2">Beneficiario</th>
              <th className="border border-slate-300 p-2 text-right">Base (€)</th>
            </tr>
          </thead>
          <tbody>
            {mockQaCases.map((c, i) => (
              <tr key={i} className="h-8 hover:bg-slate-50">
                <td className="border border-slate-300 p-1 text-center text-slate-400 text-xs">{i+1}</td>
                <td className="border border-slate-300 p-1 font-mono font-medium">{c.code}</td>
                <td className="border border-slate-300 p-1 text-slate-600">{c.date}</td>
                <td className="border border-slate-300 p-1 text-slate-600 truncate max-w-[100px]">{c.hospital}</td>
                <td className="border border-slate-300 p-1 text-slate-800 font-medium truncate max-w-[100px]">{c.operator}</td>
                <td className="border border-slate-300 p-1 text-slate-600 truncate max-w-[100px]">{c.beneficiary}</td>
                <td className="border border-slate-300 p-1 text-right">{c.taxBase.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[10px] text-slate-400 mt-2 text-right font-mono">
          Nota: Los registros listados en este anexo no contienen NHC ni datos identificativos de pacientes.
        </p>
      </div>

      {/* Signatures */}
      <div className="mt-16 bg-slate-50 p-6 border border-slate-300">
        <h3 className="font-bold uppercase tracking-widest mb-8 text-sm">Revisión y Conformidad Administrativa</h3>
        <div className="grid grid-cols-2 gap-12">
          <div>
            <div className="border-b border-slate-400 h-8 mb-2"></div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Revisado por (Administración)</p>
          </div>
          <div>
            <div className="border-b border-slate-400 h-8 mb-2"></div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Aprobado por (Dirección)</p>
          </div>
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="mt-8 pt-4 border-t border-slate-300 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        Documento Administrativo Interno · No válido como factura fiscal
      </div>
    </div>
  );
}
