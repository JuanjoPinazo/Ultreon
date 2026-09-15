'use client';

import React from 'react';
import Link from 'next/link';

interface Investigator {
  id: string;
  full_name: string;
  role: string;
  is_principal_investigator: boolean;
  specialty?: string;
  is_active: boolean;
}

interface Hospital {
  id: string;
  name: string;
  short_name: string;
  city: string;
  province: string;
  code: string;
  cases: number;
  investigators: Investigator[];
}

interface AboutClientProps {
  profile: {
    fullName: string;
    role: string;
    hospitalName: string;
  };
  hospitals: Hospital[];
}

export default function AboutClient({ profile, hospitals }: AboutClientProps) {
  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col antialiased font-sans transition-colors">
      
      {/* Header Bar */}
      <header className="bg-card border-b border-border p-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs">
            A
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">ULTREON™ 3.0</span>
              <span className="text-[8px] font-mono font-bold text-muted-foreground uppercase">IDENTIDAD CIENTÍFICA</span>
            </div>
            <h1 className="text-base font-bold text-foreground">Sobre el Registro</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-foreground">{profile.fullName}</p>
            <p className="text-[10px] text-muted-foreground uppercase font-mono tracking-wider">
              {profile.role === 'admin' ? 'Administrador' : profile.role === 'monitor' ? 'Monitor' : 'Investigador'} {profile.role === 'hospital_user' && `· ${profile.hospitalName}`}
            </p>
          </div>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800" />
          <Link
            href="/dashboard"
            className="px-3 py-1.5 bg-background hover:bg-slate-100 dark:hover:bg-muted border border-border rounded-xl text-xs font-medium transition-all"
          >
            Volver al Panel
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto space-y-8">
        
        {/* ── HERO BRANDING SECTION ── */}
        <div className="relative bg-card border border-border rounded-3xl p-8 md:p-12 overflow-hidden shadow-sm dark:shadow-2xl transition-colors">
          <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent" />
          
          <div className="relative z-10 grid grid-cols-1 gap-8 items-center">
            <div className="space-y-4">
              <span className="text-[10px] font-black font-mono tracking-[0.3em] text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-800/40 uppercase inline-block">
                Post-Market Evaluation & Clinical Utility Registry
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tight leading-none">
                Registro Clínico ULTREON™ 3.0
              </h2>
              <p className="text-sm md:text-base text-muted-foreground font-light leading-relaxed max-w-4xl">
                El Registro Clínico ULTREON 3.0 es una plataforma estructurada diseñada para evaluar el impacto clínico, diagnóstico y terapéutico del software ULTREON 3.0 en la práctica diaria de los laboratorios de hemodinámica.
              </p>
            </div>
          </div>
        </div>

        {/* ── OBJECTIVES SECTION ── */}
        <div className="space-y-4">
          <div className="flex flex-col justify-between items-start gap-2">
            <h3 className="text-xl font-black text-foreground tracking-tight">Hipótesis y Objetivos Evaluados</h3>
            <p className="text-xs text-muted-foreground">El registro documenta de forma sistemática los siguientes aspectos clínicos operativos.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <div className="bg-card border border-border rounded-3xl p-6 transition-colors shadow-sm dark:shadow-none">
              <h4 className="text-sm font-bold text-foreground mb-2">1. IMPACTO DIAGNÓSTICO</h4>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>Información OCT no evidente angiográficamente.</li>
                <li>Caracterización de lesión.</li>
                <li>Identificación de landing zones y sizing del stent.</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 transition-colors shadow-sm dark:shadow-none">
              <h4 className="text-sm font-bold text-foreground mb-2">2. CAMBIO EN ESTRATEGIA TERAPÉUTICA</h4>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>Decision Change Rate (modificación de la decisión inicial).</li>
                <li>Técnicas de preparación de lesión.</li>
                <li>Ajuste en diámetro o longitud de stent.</li>
                <li>Estrategia en bifurcación o indicación de tratamiento.</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 transition-colors shadow-sm dark:shadow-none">
              <h4 className="text-sm font-bold text-foreground mb-2">3. DETECCIÓN AUTOMÁTICA DE CALCIO</h4>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>Precisión percibida por el operador.</li>
                <li>Interpretación y utilidad.</li>
                <li>Cambio en la preparación de la lesión secundaria al diagnóstico.</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 transition-colors shadow-sm dark:shadow-none">
              <h4 className="text-sm font-bold text-foreground mb-2">4. DETECCIÓN AUTOMÁTICA DE LÍPIDOS</h4>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>Información adicional descubierta.</li>
                <li>Utilidad clínica de la identificación automática.</li>
                <li>Impacto directo en la decisión clínica.</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 transition-colors shadow-sm dark:shadow-none">
              <h4 className="text-sm font-bold text-foreground mb-2">5. OCT EN TCI (TRONCO COMÚN)</h4>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>Factibilidad de evaluación.</li>
                <li>Calidad de la adquisición con OCT.</li>
                <li>Impacto terapéutico de los hallazgos en TCI.</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 transition-colors shadow-sm dark:shadow-none">
              <h4 className="text-sm font-bold text-foreground mb-2">6. FFR-OCT</h4>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>Escenarios de utilización clínica.</li>
                <li>Confianza en la herramienta.</li>
                <li>Impacto directo sobre la decisión clínica.</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 transition-colors shadow-sm dark:shadow-none">
              <h4 className="text-sm font-bold text-foreground mb-2">7. OPTIMIZACIÓN POST-PCI</h4>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>Detección de infraexpansión y malaposición.</li>
                <li>Detección de disección de bordes.</li>
                <li>Toma de decisiones de tratamiento adicional (Post-PCI Correction Rate).</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 transition-colors shadow-sm dark:shadow-none">
              <h4 className="text-sm font-bold text-foreground mb-2">8. EFICIENCIA OPERATIVA</h4>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>Utilización de Fast Pullback.</li>
                <li>Empleo de Co-registro.</li>
                <li>Ahorro en tiempo, esfuerzo y volumen de contraste empleado.</li>
              </ul>
            </div>

            <div className="bg-card border border-border rounded-3xl p-6 transition-colors shadow-sm dark:shadow-none">
              <h4 className="text-sm font-bold text-foreground mb-2">9. ADOPCIÓN FUTURA</h4>
              <ul className="text-xs text-muted-foreground space-y-2 list-disc pl-4">
                <li>Intención del operador de incrementar el uso de OCT.</li>
                <li>Funcionalidades percibidas como mayores impulsoras.</li>
                <li>Identificación de escenarios clínicos de mayor utilidad.</li>
              </ul>
            </div>

          </div>
        </div>

        {/* ── CONCLUSIONS SECTION (FUTURE PROOF) ── */}
        <div className="bg-card border border-border rounded-3xl p-6 md:p-8 space-y-6 transition-colors">
          <h3 className="text-xl font-black text-foreground tracking-tight">Conclusiones del Registro</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Las conclusiones definitivas se formularán una vez se alcance la meta de reclutamiento establecida y se haya cerrado la base de datos para su análisis estadístico independiente. 
            Actualmente, las métricas representan una <span className="font-bold">hipótesis y cuestiones que evaluará el Registro</span> en curso. Cuando los datos estén validados de forma completa, esta sección recogerá el impacto clínico demostrado.
          </p>
        </div>

      </div>
    </main>
  );
}
