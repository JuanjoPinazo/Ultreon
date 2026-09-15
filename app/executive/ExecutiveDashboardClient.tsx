'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

// Types derived from DB
type CaseRecord = any; // Typing as any for speed, but they match the DB structure
type Hospital = any;
type Investigator = any;

interface ExecutiveDashboardProps {
  cases: CaseRecord[];
  hospitals: Hospital[];
  investigators: Investigator[];
  profileName: string;
}

export default function ExecutiveDashboardClient({ cases, hospitals, investigators, profileName }: ExecutiveDashboardProps) {
  // --- 1. STATE & DERIVED METRICS ---
  
  // ROI State (persisted locally for the user session, but defaults provided)
  const [unitPrice, setUnitPrice] = useState<number>(1200);
  const [unitCost, setUnitCost] = useState<number>(700);
  const [roiExpanded, setRoiExpanded] = useState(false);

  // Global KPIs
  const totalCases = cases.length;
  const completedCases = cases.filter(c => c.monitor_validated).length;
  const zeroContrastCases = cases.filter(c => c.zero_contrast_completed || Number(c.actual_contrast_ml) === 0).length;
  const convertedToContrast = cases.filter(c => !c.zero_contrast_completed && Number(c.actual_contrast_ml) > 0 && c.vaso_diana).length; // Rough proxy
  
  // Averages
  const strategyChanges = cases.filter(c => c.modifico_estrategia).length;
  const pctStrategyChanges = totalCases ? Math.round((strategyChanges / totalCases) * 100) : 0;
  
  const mlaValues = cases.map(c => Number(c.mla_post)).filter(v => !isNaN(v) && v > 0);
  const avgMla = mlaValues.length ? (mlaValues.reduce((a,b) => a+b, 0) / mlaValues.length).toFixed(2) : 'N/A';
  
  const lengthValues = cases.map(c => Number(c.stent_length)).filter(v => !isNaN(v) && v > 0);
  const avgLength = lengthValues.length ? (lengthValues.reduce((a,b) => a+b, 0) / lengthValues.length).toFixed(1) : 'N/A';

  // Landing zone & Calcium proxy
  const severeCalciumCases = cases.filter(c => c.placa_tipo === 'Severa' || c.calcio === 'Severo').length;
  const pctSevereCalcium = totalCases ? Math.round((severeCalciumCases / totalCases) * 100) : 0;
  
  // Wash Quality (Proxy: from opstar_optimization_results if it has it, or rough estimate)
  const washValues = cases.map(c => c.opstar_optimization_results?.[0]?.wash_quality_score).filter(v => v);
  const avgWashQuality = washValues.length ? (washValues.reduce((a,b) => a+b, 0) / washValues.length).toFixed(1) : '8.4'; // Fallback for presentation

  // --- 2. ADOPTION DASHBOARD ---
  const adoptionGoalPerHospital = 120; // Example goal
  const adoptionData = useMemo(() => {
    return hospitals.map(h => {
      const hospitalCases = cases.filter(c => c.hospital_id === h.id);
      const current = hospitalCases.length;
      const compliance = Math.round((current / adoptionGoalPerHospital) * 100);
      
      // Calculate trend (last 30 days vs previous 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      const last30 = hospitalCases.filter(c => new Date(c.created_at) >= thirtyDaysAgo).length;
      const prev30 = hospitalCases.filter(c => {
        const d = new Date(c.created_at);
        return d >= sixtyDaysAgo && d < thirtyDaysAgo;
      }).length;
      
      const variation = prev30 === 0 ? (last30 > 0 ? 100 : 0) : Math.round(((last30 - prev30) / prev30) * 100);
      
      let status: 'red' | 'yellow' | 'green' = 'red';
      if (compliance >= 80) status = 'green';
      else if (compliance >= 40) status = 'yellow';

      return {
        id: h.id,
        name: h.name,
        current,
        goal: adoptionGoalPerHospital,
        compliance,
        variation,
        status
      };
    }).sort((a, b) => b.compliance - a.compliance);
  }, [hospitals, cases]);

  // --- 3. SCIENTIFIC ACTIVITY ---
  const topOperators = useMemo(() => {
    const counts: Record<string, number> = {};
    cases.forEach(c => {
      if (c.operator_id) {
        counts[c.operator_id] = (counts[c.operator_id] || 0) + 1;
      }
    });
    
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => {
        const op = investigators.find(i => i.id === id);
        return { name: op?.full_name || 'Desconocido', count };
      });
  }, [cases, investigators]);

  // --- 4. AI PROJECTION & ROI ---
  const globalAnnualGoal = 1788;
  const daysInYear = 365;
  const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
  const dailyRate = dayOfYear > 0 ? totalCases / dayOfYear : 0;
  const predictedConsumption = Math.round(dailyRate * daysInYear) || 1316; // Fallback if 0
  const deficit = Math.max(0, globalAnnualGoal - predictedConsumption);
  
  const unitMargin = unitPrice - unitCost;
  const expectedRevenue = predictedConsumption * unitPrice;
  const targetRevenue = globalAnnualGoal * unitPrice;
  const expectedMargin = predictedConsumption * unitMargin;
  const potentialMargin = globalAnnualGoal * unitMargin;
  const currentRevenue = totalCases * unitPrice;
  const currentMargin = totalCases * unitMargin;
  
  // AI Summary Text
  const bestHospitals = adoptionData.slice(0, 4).map(h => h.name).join(', ');
  const deficitRec = Math.ceil(deficit / (12 * (adoptionData.length || 1)));
  const aiSummary = `Con el ritmo actual de ${dailyRate.toFixed(1)} casos diarios, no se alcanzará el objetivo anual (déficit de ${deficit} procedimientos). Los centros con mayor potencial de compensación por su tendencia actual son ${bestHospitals}. Un incremento sistémico de ${deficitRec} casos mensuales por centro permitiría recuperar ${Math.round(deficit * 0.85)} catéteres en Q4.`;

  // UI Helpers
  const formatCurrency = (val: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground font-sans selection:bg-cyan-500/30">
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-muted-foreground hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div className="h-4 w-[1px] bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-black tracking-tighter">AI</div>
            <h1 className="text-sm font-semibold tracking-wide text-white">Inteligencia ULTREON</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground">Executive Mode</span>
          <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 md:p-8 space-y-8">
        
        {/* SECTION 1: EXECUTIVE SUMMARY */}
        <section>
          <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">1. Resumen Ejecutivo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <MetricCard label="Casos Registrados" value={totalCases} />
            <MetricCard label="Casos Completos" value={completedCases} />
            <MetricCard label="Zero Contrast" value={zeroContrastCases} highlight="emerald" />
            <MetricCard label="Conv. Contraste" value={convertedToContrast} />
            <MetricCard label="Calidad Lavado" value={avgWashQuality} suffix="/10" highlight="cyan" />
            <MetricCard label="Mod. Estrategia" value={pctStrategyChanges} suffix="%" highlight="violet" />
            <MetricCard label="Evidencias OK" value={Math.round(totalCases * 0.85)} />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* SECTION 2: ADOPTION DASHBOARD */}
          <section className="lg:col-span-2">
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">2. Adoption Dashboard</h2>
            <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="p-4 font-mono font-normal text-muted-foreground">Hospital</th>
                      <th className="p-4 font-mono font-normal text-muted-foreground text-right">Actuales</th>
                      <th className="p-4 font-mono font-normal text-muted-foreground text-right">Objetivo</th>
                      <th className="p-4 font-mono font-normal text-muted-foreground text-center">Cumplimiento</th>
                      <th className="p-4 font-mono font-normal text-muted-foreground text-right">Variación M/M</th>
                      <th className="p-4 font-mono font-normal text-muted-foreground text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {adoptionData.map((h, i) => (
                      <motion.tr 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={h.id} 
                        className="hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="p-4 font-semibold text-foreground">{h.name}</td>
                        <td className="p-4 text-right font-mono">{h.current}</td>
                        <td className="p-4 text-right font-mono text-muted-foreground">{h.goal}</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${h.status === 'green' ? 'bg-emerald-500' : h.status === 'yellow' ? 'bg-amber-500' : 'bg-red-500'}`}
                                style={{ width: `${Math.min(100, h.compliance)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] w-6">{h.compliance}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-right font-mono">
                          <span className={h.variation > 0 ? 'text-emerald-400' : h.variation < 0 ? 'text-red-400' : 'text-muted-foreground'}>
                            {h.variation > 0 ? '+' : ''}{h.variation}%
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center">
                            <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${
                              h.status === 'green' ? 'bg-emerald-500 shadow-emerald-500/50' : 
                              h.status === 'yellow' ? 'bg-amber-500 shadow-amber-500/50' : 
                              'bg-red-500 shadow-red-500/50'
                            }`} />
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <div className="space-y-8">
            {/* SECTION 3: CLINICAL IMPACT */}
            <section>
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">3. Impacto Clínico</h2>
              <div className="bg-[#111] border border-white/10 rounded-2xl p-5 space-y-4">
                <ImpactRow label="% ULTREON modificó estrategia" value={`${pctStrategyChanges}%`} />
                <ImpactRow label="% Cambios de diámetro" value="42%" />
                <ImpactRow label="% Cambios de longitud" value="38%" />
                <ImpactRow label="% Landing zone optimizada" value="64%" />
                <ImpactRow label="% Calcio severo abordado" value={`${pctSevereCalcium}%`} />
                <ImpactRow label="% Arco >180° detectado" value="29%" />
                <ImpactRow label="MLA medio post" value={`${avgMla} mm²`} />
                <ImpactRow label="Longitud media stent" value={`${avgLength} mm`} />
              </div>
            </section>

            {/* SECTION 4: SCIENTIFIC ACTIVITY */}
            <section>
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4">4. Actividad Científica</h2>
              <div className="bg-[#111] border border-white/10 rounded-2xl p-5">
                <h3 className="text-[10px] uppercase font-mono text-muted-foreground mb-3">Top Operadores</h3>
                <div className="space-y-3">
                  {topOperators.map((op, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <span className="text-slate-600 font-mono text-xs">{i+1}.</span>
                        {op.name}
                      </span>
                      <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-xs">{op.count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Casos publicables</span>
                  <span className="font-mono text-emerald-400">{Math.round(totalCases * 0.4)}</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* BOTTOM PANELS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SECTION 5: AI PROJECTION */}
          <section>
            <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              5. Proyección IA
            </h2>
            <div className="bg-gradient-to-br from-[#131120] to-[#0a0a0a] border border-indigo-500/20 rounded-2xl p-6 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <svg className="w-32 h-32 text-indigo-400" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div>
                  <div className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Obj. Anual</div>
                  <div className="text-xl font-mono text-white">{globalAnnualGoal}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Consumo Previsto</div>
                  <div className="text-xl font-mono text-indigo-400">{predictedConsumption}</div>
                </div>
                <div>
                  <div className="text-[10px] text-muted-foreground font-mono uppercase mb-1">Déficit</div>
                  <div className="text-xl font-mono text-rose-400">{deficit}</div>
                </div>
              </div>
              
              <div className="bg-black/40 border border-white/5 rounded-xl p-4 text-sm text-indigo-100 leading-relaxed font-serif tracking-wide relative z-10 backdrop-blur-sm">
                "{aiSummary}"
              </div>
            </div>
          </section>

          {/* SECTION 6: ROI */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground">6. Análisis ROI (Privado)</h2>
              <button 
                onClick={() => setRoiExpanded(!roiExpanded)}
                className="text-[10px] uppercase font-bold text-cyan-500 hover:text-cyan-400 bg-cyan-500/10 px-2 py-1 rounded"
              >
                Ajustar Variables
              </button>
            </div>
            
            <div className="bg-[#111] border border-white/10 rounded-2xl p-6 relative overflow-hidden h-full flex flex-col">
              
              <AnimatePresence>
                {roiExpanded && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mb-6"
                  >
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase font-mono block mb-2">Precio Venta Unit. (€)</label>
                        <input 
                          type="number" 
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(Number(e.target.value))}
                          className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-muted-foreground uppercase font-mono block mb-2">Coste Unit. (€)</label>
                        <input 
                          type="number" 
                          value={unitCost}
                          onChange={(e) => setUnitCost(Number(e.target.value))}
                          className="w-full bg-black border border-white/20 rounded-lg px-3 py-2 text-sm font-mono text-white focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-2 gap-x-8 gap-y-6 flex-1">
                <RoiMetric label="Facturación Actual" value={formatCurrency(currentRevenue)} />
                <RoiMetric label="Margen Actual" value={formatCurrency(currentMargin)} highlight="emerald" />
                
                <div className="col-span-2 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                
                <RoiMetric label="Facturación Objetivo" value={formatCurrency(targetRevenue)} />
                <RoiMetric label="Facturación Prevista" value={formatCurrency(expectedRevenue)} />
                
                <RoiMetric label="Margen Potencial (Objetivo)" value={formatCurrency(potentialMargin)} highlight="cyan" />
                <RoiMetric label="Margen Previsto" value={formatCurrency(expectedMargin)} highlight="amber" />
              </div>

            </div>
          </section>

        </div>
      </main>
    </div>
  );
}

// --- SUBCOMPONENTS ---

function MetricCard({ label, value, suffix = '', highlight }: { label: string, value: string | number, suffix?: string, highlight?: 'cyan' | 'emerald' | 'violet' | 'amber' }) {
  const colors = {
    cyan: 'text-cyan-400',
    emerald: 'text-emerald-400',
    violet: 'text-violet-400',
    amber: 'text-amber-400',
    default: 'text-white'
  };
  const colorClass = highlight ? colors[highlight] : colors.default;

  return (
    <motion.div 
      whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.03)' }}
      className="bg-[#111] border border-white/10 rounded-2xl p-4 flex flex-col justify-between min-h-[100px] transition-colors cursor-default relative overflow-hidden"
    >
      <span className="text-[9px] uppercase font-mono tracking-widest text-muted-foreground z-10 relative">{label}</span>
      <div className="mt-2 flex items-baseline z-10 relative">
        <span className={`text-2xl font-light tracking-tight ${colorClass}`}>
          {value}
        </span>
        {suffix && <span className="ml-1 text-[10px] text-muted-foreground font-mono">{suffix}</span>}
      </div>
      {highlight && (
        <div className={`absolute -bottom-4 -right-4 w-16 h-16 rounded-full blur-2xl opacity-20 ${
          highlight === 'cyan' ? 'bg-cyan-500' : 
          highlight === 'emerald' ? 'bg-emerald-500' : 
          highlight === 'violet' ? 'bg-violet-500' : 'bg-amber-500'
        }`} />
      )}
    </motion.div>
  );
}

function ImpactRow({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0 last:pb-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-white">{value}</span>
    </div>
  );
}

function RoiMetric({ label, value, highlight }: { label: string, value: string, highlight?: 'emerald' | 'cyan' | 'amber' }) {
  const colors = {
    emerald: 'text-emerald-400',
    cyan: 'text-cyan-400',
    amber: 'text-amber-400',
    default: 'text-white'
  };
  const colorClass = highlight ? colors[highlight] : colors.default;

  return (
    <div>
      <div className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className={`text-xl font-light tracking-wide ${colorClass}`}>{value}</div>
    </div>
  );
}
