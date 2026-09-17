'use client';

import React, { useState } from 'react';
import PrintableMonthlySettlement from './components/PrintableMonthlySettlement';

interface SettlementsClientProps {
  isPrelaunch: boolean;
  userId: string;
}

export default function SettlementsClient({ isPrelaunch, userId }: SettlementsClientProps) {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedSettlement, setSelectedSettlement] = useState<any | null>(null);

  // Mock QA data for multi-beneficiary month and operator pivot
  const mockSettlements = [
    {
      id: 's1',
      operator: 'Daniel Dubois',
      beneficiary: 'Beneficiario A',
      cases: 5,
      units: 5,
      basis: 'PER_CASE',
      taxBase: 117.65,
      vatRate: 21,
      vatAmount: 24.71,
      withholdingRate: 15,
      withholdingAmount: 17.65,
      invoiceTotal: 142.36,
      paymentAmount: 124.71,
      profNet: 100.00,
      status: 'DRAFT',
      eligibility: 'ELIGIBLE'
    },
    {
      id: 's2',
      operator: 'Daniel Dubois',
      beneficiary: 'Beneficiario C',
      cases: 3,
      units: 4,
      basis: 'PER_UNIT',
      taxBase: 470.60,
      vatRate: 0,
      vatAmount: 0,
      withholdingRate: 15,
      withholdingAmount: 70.60,
      invoiceTotal: 470.60,
      paymentAmount: 400.00,
      profNet: 400.00,
      status: 'DRAFT',
      eligibility: 'BLOCKED',
      blockReason: 'Contrato pendiente'
    },
    {
      id: 's3',
      operator: 'Alba García',
      beneficiary: 'Beneficiario B',
      cases: 5,
      units: 5,
      basis: 'PER_CASE',
      taxBase: 588.25,
      vatRate: 21,
      vatAmount: 123.53,
      withholdingRate: 15,
      withholdingAmount: 88.25,
      invoiceTotal: 711.78,
      paymentAmount: 623.53,
      profNet: 500.00,
      status: 'DRAFT',
      eligibility: 'ELIGIBLE'
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Liquidaciones Mensuales</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestión administrativa agrupada por Operador</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => { setActiveTab('list'); setSelectedSettlement(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${activeTab === 'list' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:bg-muted'}`}
          >
            Historial
          </button>
          <button 
            onClick={() => { setActiveTab('new'); setSelectedSettlement(null); }}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${activeTab === 'new' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border hover:bg-muted'}`}
          >
            Nuevas Liquidaciones
          </button>
        </div>
      </div>

      {isPrelaunch && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex gap-3">
          <div className="text-amber-600 dark:text-amber-400 mt-0.5">⚠️</div>
          <div>
            <h3 className="font-bold text-amber-800 dark:text-amber-300">Registro en PRELANZAMIENTO</h3>
            <p className="text-sm text-amber-700 dark:text-amber-400/80">No pueden generarse liquidaciones económicas oficiales. Solo se permite QA sintético en esta fase.</p>
          </div>
        </div>
      )}

      {activeTab === 'list' && !selectedSettlement && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="font-bold mb-4">Liquidaciones Activas</h2>
          <div className="text-sm text-muted-foreground text-center py-8">
            No hay liquidaciones generadas todavía.
          </div>
        </div>
      )}

      {activeTab === 'new' && !selectedSettlement && (
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="font-bold mb-4">Propuestas de Liquidación (Simulación QA)</h2>
            <p className="text-sm text-muted-foreground mb-6">
              El sistema ha detectado que "Daniel Dubois" operó con dos entidades beneficiarias distintas este mes.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="py-3 px-4">Operador</th>
                    <th className="py-3 px-4">Beneficiario Vigente</th>
                    <th className="py-3 px-4 text-center">Base</th>
                    <th className="py-3 px-4 text-center">Casos</th>
                    <th className="py-3 px-4 text-center">Unidades</th>
                    <th className="py-3 px-4 text-right">Neto Total</th>
                    <th className="py-3 px-4 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {mockSettlements.map((s) => (
                    <tr key={s.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 px-4 font-bold">
                        {s.operator}
                        {s.eligibility === 'BLOCKED' && (
                          <div className="text-[10px] text-red-500 font-mono mt-0.5">BLOQUEADO: {s.blockReason}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{s.beneficiary}</td>
                      <td className="py-3 px-4 text-center text-xs font-mono bg-muted/50 rounded">{s.basis}</td>
                      <td className="py-3 px-4 text-center">{s.cases}</td>
                      <td className="py-3 px-4 text-center">{s.units}</td>
                      <td className="py-3 px-4 text-right font-bold text-primary">{s.paymentAmount.toFixed(2)} €</td>
                      <td className="py-3 px-4 text-center">
                        <button 
                          onClick={() => setSelectedSettlement(s)}
                          disabled={s.eligibility === 'BLOCKED'}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                            s.eligibility === 'BLOCKED' 
                              ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' 
                              : 'bg-primary text-primary-foreground hover:bg-primary/90'
                          }`}
                        >
                          {s.eligibility === 'BLOCKED' ? 'Retenido' : 'Previsualizar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {selectedSettlement && (
        <div className="bg-white text-black p-8 rounded-xl overflow-x-auto shadow-sm">
          <button 
            onClick={() => setSelectedSettlement(null)}
            className="mb-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm rounded-lg font-medium no-print transition-colors"
          >
            ← Volver a propuestas
          </button>
          <PrintableMonthlySettlement settlementData={selectedSettlement} />
        </div>
      )}
    </div>
  );
}
