'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export interface CaseWithRelations {
  id: string;
  is_demo?: boolean;
  hospital_id: string | null;
  created_by: string;
  created_at: string;
}

interface AnalyticsClientProps {
  initialCases: CaseWithRelations[];
  profile: {
    fullName: string;
    role: string;
    hospitalId: string;
    hospitalName: string;
  };
  hospitals: { id: string; name: string }[];
}

export default function AnalyticsClient({
  initialCases,
  profile,
  hospitals,
}: AnalyticsClientProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('global');
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const tabs = [
    { id: 'global', label: 'Visión Global' },
    { id: 'diagnostico', label: 'Impacto Diagnóstico' },
    { id: 'decision', label: 'Cambio de Decisión' },
    { id: 'calcio', label: 'Calcio' },
    { id: 'lipido', label: 'Lípido' },
    { id: 'tci', label: 'TCI' },
    { id: 'ffroct', label: 'FFR-OCT' },
    { id: 'optimizacion', label: 'Optimización Post-PCI' },
    { id: 'eficiencia', label: 'Adquisición / Eficiencia' },
    { id: 'adopcion', label: 'Adopción Futura' }
  ];

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col antialiased font-sans transition-colors">
      
      {/* Header Bar */}
      <header className="bg-card border-b border-border p-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white font-black text-xs hover:opacity-90 transition-opacity">
            A
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 px-1.5 py-0.5 rounded border border-violet-200 dark:border-violet-800/40 uppercase">
                Análisis Científico
              </span>
            </div>
            <h1 className="text-base font-bold text-foreground">Resultados y Análisis</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-foreground">{profile.fullName}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
              {profile.role} {profile.role === 'hospital_user' && `· ${profile.hospitalName}`}
            </p>
          </div>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block" />
          <Link
            href="/dashboard"
            className="px-3 py-1.5 bg-background hover:bg-slate-100 dark:hover:bg-muted border border-border rounded-xl text-xs font-medium transition-all"
          >
            Volver al Panel
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-8 max-w-[1600px] w-full mx-auto space-y-6">
        
        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            Análisis Descriptivo del Registro
          </h2>
          <p className="text-sm text-muted-foreground font-light max-w-3xl leading-relaxed">
            Explora las métricas y los resultados clínicos del uso de ULTREON 3.0. Los análisis detallados se habilitarán conforme se alcance el volumen de muestra (N) estadísticamente significativo.
          </p>
        </div>

        {/* Horizontal Navigation Tabs */}
        <div className="border-b border-border">
          <div className="flex overflow-x-auto hide-scrollbar gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 text-xs md:text-sm font-semibold whitespace-nowrap transition-all border-b-2 ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                    : 'border-transparent text-muted-foreground hover:text-slate-700 dark:hover:text-muted-foreground hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="bg-card border border-border rounded-3xl p-8 md:p-12 shadow-sm dark:shadow-none min-h-[400px] flex flex-col items-center justify-center text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-background border border-border flex items-center justify-center text-2xl mb-2">
            🔬
          </div>
          <h3 className="text-lg font-bold text-foreground">
            {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md">
            Módulo en fase de recolección de datos. Los análisis y gráficas correspondientes a esta dimensión se desbloquearán automáticamente cuando el tamaño muestral permita extraer conclusiones estadísticamente significativas.
          </p>
          <div className="mt-4 px-4 py-2 bg-violet-50 dark:bg-violet-950/30 text-violet-700 dark:text-violet-400 rounded-full text-xs font-mono font-bold border border-violet-200 dark:border-violet-900/50">
            N insuficientes para análisis poblacional
          </div>
        </div>

      </div>
    </main>
  );
}
