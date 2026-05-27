'use client';

import React, { useState, useMemo } from 'react';

interface Hospital {
  id: string;
  name: string;
}

interface Metric {
  id: string;
  hospital_id: string;
  year: number;
  month?: number;
  product_line?: string;
  purchase_volume_units?: number;
  purchase_revenue_eur?: number;
  registry_investment_eur?: number;
  investigator_payments_eur?: number;
  training_costs_eur?: number;
  congress_support_eur?: number;
  other_investment_eur?: number;
  target_units?: number;
  target_revenue_eur?: number;
}

interface Objective {
  id: string;
  hospital_id: string;
  year: number;
  target_cases?: number;
  target_zero_contrast_rate?: number;
  target_strategy_modification_rate?: number;
  target_purchase_units?: number;
  target_revenue_eur?: number;
  target_opstar_score?: number;
}

interface CaseCount {
  hospital_id: string;
  year: number;
  case_count: number;
  zero_contrast_cases: number;
  strategy_modified_cases: number;
}

interface BusinessIntelligenceClientProps {
  hospitals: Hospital[];
  metrics: Metric[];
  objectives: Objective[];
  caseCounts: CaseCount[];
}

export default function BusinessIntelligenceClient({
  hospitals,
  metrics,
  objectives,
  caseCounts,
}: BusinessIntelligenceClientProps) {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedHospital, setSelectedHospital] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  // Filtered data
  const filteredMetrics = useMemo(() => {
    return metrics.filter(m => {
      if (m.year !== selectedYear) return false;
      if (selectedMonth !== 'all' && m.month !== selectedMonth) return false;
      if (selectedHospital !== 'all' && m.hospital_id !== selectedHospital) return false;
      return true;
    });
  }, [metrics, selectedYear, selectedMonth, selectedHospital]);

  const filteredObjectives = useMemo(() => {
    return objectives.filter(o => {
      if (o.year !== selectedYear) return false;
      if (selectedHospital !== 'all' && o.hospital_id !== selectedHospital) return false;
      return true;
    });
  }, [objectives, selectedYear, selectedHospital]);

  // Calculate aggregated metrics by hospital
  const hospitalKPIs = useMemo(() => {
    const kpiMap = new Map<string, any>();

    hospitals.forEach(h => {
      const hospitalMetrics = filteredMetrics.filter(m => m.hospital_id === h.id);
      const hospitalObjective = filteredObjectives.find(o => o.hospital_id === h.id);
      const caseCount = caseCounts.find(c => c.hospital_id === h.id && c.year === selectedYear);

      const totalRevenue = hospitalMetrics.reduce((sum, m) => sum + (m.purchase_revenue_eur || 0), 0);
      const totalInvestment = hospitalMetrics.reduce((sum, m) => {
        return sum + (m.registry_investment_eur || 0) +
          (m.investigator_payments_eur || 0) +
          (m.training_costs_eur || 0) +
          (m.congress_support_eur || 0) +
          (m.other_investment_eur || 0);
      }, 0);
      const totalPurchaseUnits = hospitalMetrics.reduce((sum, m) => sum + (m.purchase_volume_units || 0), 0);
      const caseCountValue = caseCount?.case_count || 0;
      const costPerCase = caseCountValue > 0 ? totalInvestment / caseCountValue : 0;
      const roiEstimated = totalInvestment > 0 ? ((totalRevenue - totalInvestment) / totalInvestment) * 100 : 0;

      // Completion rates
      const targetUnits = hospitalObjective?.target_purchase_units || 0;
      const targetRevenue = hospitalObjective?.target_revenue_eur || 0;
      const targetCases = hospitalObjective?.target_cases || 0;

      const purchaseCompletion = targetUnits > 0 ? (totalPurchaseUnits / targetUnits) * 100 : 0;
      const revenueCompletion = targetRevenue > 0 ? (totalRevenue / targetRevenue) * 100 : 0;
      const caseCompletion = targetCases > 0 ? (caseCountValue / targetCases) * 100 : 0;

      kpiMap.set(h.id, {
        hospitalId: h.id,
        hospitalName: h.name,
        totalRevenue: totalRevenue || 0,
        totalInvestment: totalInvestment || 0,
        totalPurchaseUnits: totalPurchaseUnits || 0,
        caseCount: caseCountValue || 0,
        costPerCase,
        roiEstimated,
        purchaseCompletion,
        revenueCompletion,
        caseCompletion,
        objective: hospitalObjective,
      });
    });

    return Array.from(kpiMap.values());
  }, [hospitals, filteredMetrics, filteredObjectives, caseCounts, selectedYear]);


  // Helper function to get alert color based on completion
  const getCompletionColor = (completion: number) => {
    if (completion >= 100) return 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40';
    if (completion >= 80) return 'text-yellow-400 bg-yellow-950/40 border-yellow-800/40';
    return 'text-red-400 bg-red-950/40 border-red-800/40';
  };

  const getCompletionLabel = (completion: number) => {
    if (completion >= 100) return '✓ Cumplido';
    if (completion >= 80) return '⚠ En Riesgo';
    return '✗ Por debajo';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">Año</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            {[currentYear, currentYear - 1, currentYear - 2].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">Mes</label>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Todos</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
              <option key={month} value={month}>
                {new Date(2024, month - 1).toLocaleDateString('es-ES', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-400 block mb-2 uppercase tracking-wider">Centro</label>
          <select
            value={selectedHospital}
            onChange={(e) => setSelectedHospital(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Todos los centros</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setSelectedYear(currentYear);
              setSelectedMonth('all');
              setSelectedHospital('all');
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-sm font-medium transition-all"
          >
            Resetear filtros
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      {hospitalKPIs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Ingresos Totales</span>
            <span className="text-2xl font-bold text-cyan-400">
              €{hospitalKPIs.reduce((sum, h) => sum + h.totalRevenue, 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </span>
            <p className="text-xs text-slate-500">{hospitalKPIs.length} centros</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Inversión Total</span>
            <span className="text-2xl font-bold text-blue-400">
              €{hospitalKPIs.reduce((sum, h) => sum + h.totalInvestment, 0).toLocaleString('es-ES', { maximumFractionDigits: 0 })}
            </span>
            <p className="text-xs text-slate-500">Operación del registro</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">Casos Registrados</span>
            <span className="text-2xl font-bold text-emerald-400">
              {hospitalKPIs.reduce((sum, h) => sum + h.caseCount, 0)}
            </span>
            <p className="text-xs text-slate-500">Total de fichas clínicas</p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">ROI Promedio</span>
            <span className={`text-2xl font-bold ${
              hospitalKPIs.some(h => h.roiEstimated >= 0) ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {(hospitalKPIs.reduce((sum, h) => sum + h.roiEstimated, 0) / hospitalKPIs.length).toFixed(1)}%
            </span>
            <p className="text-xs text-slate-500">Retorno de inversión</p>
          </div>
        </div>
      )}

      {/* Hospital Details Table */}
      {hospitalKPIs.length > 0 ? (
        <div className="space-y-4">
          {hospitalKPIs.map(kpi => (
            <div key={kpi.hospitalId} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">

              {/* Hospital Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-50">{kpi.hospitalName}</h3>
                  <p className="text-xs text-slate-500 mt-1">{selectedYear}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-cyan-400">€{kpi.totalRevenue.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</div>
                  <p className="text-[10px] text-slate-500 mt-1">Facturación acumulada</p>
                </div>
              </div>

              {/* KPI Grid for this hospital */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase">Casos Registrados</span>
                  <span className="text-xl font-bold text-emerald-400">{kpi.caseCount}</span>
                  {kpi.objective?.target_cases && (
                    <p className="text-[10px] text-slate-500 mt-1">{Math.round(kpi.caseCompletion)}% de {kpi.objective.target_cases}</p>
                  )}
                </div>

                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase">Coste/Caso</span>
                  <span className="text-xl font-bold text-blue-400">€{kpi.costPerCase.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                  <p className="text-[10px] text-slate-500 mt-1">Inversión unitaria</p>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase">ROI</span>
                  <span className={`text-xl font-bold ${kpi.roiEstimated >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {kpi.roiEstimated.toFixed(1)}%
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">Retorno estimado</p>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase">Compras</span>
                  <span className="text-xl font-bold text-cyan-400">{kpi.totalPurchaseUnits}</span>
                  {kpi.objective?.target_purchase_units && (
                    <p className="text-[10px] text-slate-500 mt-1">{Math.round(kpi.purchaseCompletion)}% de {kpi.objective.target_purchase_units}</p>
                  )}
                </div>

                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase">Inversión</span>
                  <span className="text-xl font-bold text-purple-400">€{(kpi.totalInvestment / 1000).toFixed(1)}k</span>
                  <p className="text-[10px] text-slate-500 mt-1">Capital invertido</p>
                </div>

                <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-[10px] font-mono text-slate-400 block mb-2 uppercase">Status Ingresos</span>
                  <span className={`text-[10px] font-bold inline-block px-2 py-1 rounded border ${getCompletionColor(kpi.revenueCompletion)}`}>
                    {getCompletionLabel(kpi.revenueCompletion)}
                  </span>
                  <p className="text-[10px] text-slate-500 mt-2">{Math.round(kpi.revenueCompletion)}%</p>
                </div>
              </div>

              {/* Objectives Section */}
              {kpi.objective && (
                <div className="bg-slate-950/40 border border-slate-800/50 rounded-xl p-4">
                  <h4 className="text-sm font-bold text-slate-100 mb-3">Objetivos de Año</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-sm">
                    {kpi.objective.target_cases && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Casos objetivo:</span>
                        <span className="font-mono text-slate-100">{kpi.objective.target_cases}</span>
                      </div>
                    )}
                    {kpi.objective.target_purchase_units && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Compras objetivo:</span>
                        <span className="font-mono text-slate-100">{kpi.objective.target_purchase_units}</span>
                      </div>
                    )}
                    {kpi.objective.target_revenue_eur && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Ingresos objetivo:</span>
                        <span className="font-mono text-slate-100">€{kpi.objective.target_revenue_eur.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
                      </div>
                    )}
                    {kpi.objective.target_zero_contrast_rate && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">% Zero-Contrast:</span>
                        <span className="font-mono text-slate-100">{(kpi.objective.target_zero_contrast_rate * 100).toFixed(0)}%</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <svg className="w-12 h-12 mx-auto text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 12a3 3 0 100-6 3 3 0 000 6zM7 6h.01M17 12a3 3 0 100-6 3 3 0 000 6zM17 6h.01M7 18a3 3 0 100-6 3 3 0 000 6zM7 12h.01M17 18a3 3 0 100-6 3 3 0 000 6zM17 12h.01" />
          </svg>
          <p className="text-slate-400 text-sm">No hay datos disponibles para los filtros seleccionados.</p>
        </div>
      )}

      {/* Data Import Placeholder */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Importar Métricas</h3>
            <p className="text-xs text-slate-500 mt-1">Carga datos financieros desde CSV o entrada manual</p>
          </div>
          <button
            className="bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 px-4 py-2 rounded-xl text-sm font-bold transition-all"
          >
            Importar CSV
          </button>
        </div>
      </div>
    </div>
  );
}
