'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useDemoData } from '@/lib/demo/DemoDataProvider';

export default function SimulatorPage() {
  const { data } = useDemoData();
  const defaults = data?.executive?.variables || {
    price_cv: 1200,
    cost_current: 700,
    annual_goal: 1788
  };

  const [hospitals, setHospitals] = useState(6);
  const [operators, setOperators] = useState(18);
  const [casesPerOp, setCasesPerOp] = useState(4);
  const [zeroContrast, setZeroContrast] = useState(75);
  const [price, setPrice] = useState(defaults.price_cv);
  const [cost, setCost] = useState(defaults.cost_current);

  // Calculations
  const casesPerMonth = operators * casesPerOp;
  const casesPerYear = casesPerMonth * 12;
  
  const revenuePerYear = casesPerYear * price;
  const costPerYear = casesPerYear * cost;
  const marginPerYear = revenuePerYear - costPerYear;
  const roi = cost > 0 ? ((price - cost) / cost) * 100 : 0;
  
  const savedContrastMl = (casesPerYear * (zeroContrast / 100)) * 50; // assuming avg 50ml saved per case

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat('es-ES').format(val);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground p-6 md:p-12 font-sans selection:bg-emerald-500/30">
      
      <header className="mb-10 flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin/demo-center" className="text-muted-foreground hover:text-white transition-colors border border-border px-3 py-1 rounded flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a Admin
            </Link>
            <span className="text-[10px] uppercase font-mono tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded ml-2">Simulador Comercial</span>
          </div>
          <h1 className="text-3xl font-light text-white tracking-tight mt-4">Proyección de Adopción</h1>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-7xl">
        
        {/* SLIDERS PANEL */}
        <div className="lg:col-span-4 bg-[#111] border border-white/10 rounded-3xl p-8 space-y-8">
          
          <div className="space-y-6">
            <h3 className="text-xs font-mono uppercase text-muted-foreground border-b border-white/10 pb-2">Variables de Red</h3>
            
            <SliderControl label="Hospitales Participantes" min={1} max={50} value={hospitals} setValue={setHospitals} />
            <SliderControl label="Operadores Activos" min={1} max={150} value={operators} setValue={setOperators} />
            <SliderControl label="Casos / Operador / Mes" min={1} max={20} value={casesPerOp} setValue={setCasesPerOp} />
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-mono uppercase text-muted-foreground border-b border-white/10 pb-2">Variables Clínicas</h3>
            <SliderControl label="% Protocolo Zero-Contrast" min={0} max={100} value={zeroContrast} setValue={setZeroContrast} unit="%" />
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-mono uppercase text-muted-foreground border-b border-white/10 pb-2">Económicas</h3>
            <SliderControl label="Precio de Venta (€)" min={500} max={3000} step={50} value={price} setValue={setPrice} />
            <SliderControl label="Coste Unitario (€)" min={200} max={2000} step={50} value={cost} setValue={setCost} />
          </div>
        </div>

        {/* RESULTS PANEL */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <ResultCard 
            title="Consumo Anual Estimado" 
            value={formatNumber(casesPerYear)} 
            subtitle="Catéteres / Año"
            icon="📈" 
            glow="emerald"
          />
          
          <ResultCard 
            title="Facturación Anual" 
            value={formatCurrency(revenuePerYear)} 
            subtitle={`Coste Anual: ${formatCurrency(costPerYear)}`}
            icon="💶" 
          />
          
          <ResultCard 
            title="Margen Bruto (Profit)" 
            value={formatCurrency(marginPerYear)} 
            subtitle={`${Math.round((marginPerYear/revenuePerYear)*100 || 0)}% Margen Neto`}
            icon="💎" 
            glow="cyan"
          />
          
          <ResultCard 
            title="Retorno de Inversión (ROI)" 
            value={`${Math.round(roi)}%`} 
            subtitle="Por cada € invertido"
            icon="🚀" 
          />

          {/* Clinical Impact Summary */}
          <div className="md:col-span-2 bg-gradient-to-r from-emerald-950/40 to-[#111] border border-emerald-900/30 rounded-3xl p-8 relative overflow-hidden flex items-center justify-between">
            <div className="absolute -left-10 top-0 bottom-0 w-32 bg-emerald-500/10 blur-3xl" />
            <div className="relative z-10">
              <div className="text-[10px] uppercase font-mono tracking-widest text-emerald-400 mb-2">Impacto Clínico Proyectado</div>
              <h3 className="text-2xl font-light text-white mb-2">Ahorro de {formatNumber(savedContrastMl)} ml de contraste</h3>
              <p className="text-sm text-muted-foreground">Protección renal masiva en pacientes vulnerables bajo el protocolo Zero-Contrast ({zeroContrast}% de adopción).</p>
            </div>
            <div className="hidden md:flex relative z-10 w-24 h-24 bg-emerald-950 rounded-full items-center justify-center border border-emerald-800 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <span className="text-3xl">🛡️</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// Subcomponents
function SliderControl({ label, min, max, step = 1, value, setValue, unit = '' }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs text-muted-foreground">{label}</label>
        <span className="font-mono text-white text-sm">{value}{unit}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-emerald-500"
      />
    </div>
  );
}

function ResultCard({ title, value, subtitle, icon, glow }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#111] border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col justify-center"
    >
      {glow && (
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-10 pointer-events-none ${
          glow === 'emerald' ? 'bg-emerald-500' : 'bg-cyan-500'
        }`} />
      )}
      <div className="text-3xl mb-4">{icon}</div>
      <div className="text-[10px] uppercase font-mono tracking-widest text-muted-foreground mb-1 z-10">{title}</div>
      <div className="text-4xl font-light text-white tracking-tight mb-2 z-10">{value}</div>
      <div className="text-xs text-muted-foreground font-mono z-10">{subtitle}</div>
    </motion.div>
  );
}
