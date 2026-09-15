'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemoData } from '@/lib/demo/DemoDataProvider';

export default function ClinicalDemoPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const { data } = useDemoData();

  if (!data) return null;
  const caseData = data.clinical;

  const steps = [
    {
      title: 'Información Inicial',
      description: 'Carga automática de la ficha clínica desde el sistema HIS del hospital.',
      content: (
        <div className="space-y-4">
          <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-muted-foreground">Paciente</span><span className="font-mono text-white">{caseData.patient.code}</span></div>
          <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-muted-foreground">Hospital</span><span className="font-mono text-white">{caseData.patient.hospital}</span></div>
          <div className="flex justify-between border-b border-white/10 pb-2"><span className="text-muted-foreground">Vaso Diana</span><span className="font-mono text-emerald-400 font-bold">{caseData.procedure.segment}</span></div>
          <div className="mt-4 p-4 bg-card/50 rounded-lg flex items-center justify-center border border-white/5">
            {/* Image Placeholder */}
            <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded flex flex-col items-center justify-center text-muted-foreground font-mono text-xs">
              <span className="mb-2">📷 {caseData.oct_images.pre_oct}</span>
              <span>(Sube la imagen a esta ruta estática)</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Adquisición OCT',
      description: `Sistema de adquisición activado. Aplicando protocolo salino ${caseData.procedure.saline_protocol} con jeringa ${caseData.procedure.syringe}...`,
      content: (
        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-32 h-32 rounded-full border-4 border-dashed border-cyan-500/30 flex items-center justify-center animate-[spin_4s_linear_infinite]">
            <div className="w-24 h-24 rounded-full bg-cyan-900/40 flex items-center justify-center">
              <span className="text-cyan-400 text-2xl animate-pulse">OCT</span>
            </div>
          </div>
          <p className="mt-6 text-sm font-mono text-cyan-400 uppercase tracking-widest animate-pulse">{caseData.procedure.pullback}</p>
          <div className="mt-4 flex gap-4 text-xs font-mono">
            <span className="bg-emerald-950 text-emerald-400 px-3 py-1 rounded">Contraste: {caseData.procedure.contrast_ml} mL</span>
            <span className="bg-emerald-950 text-emerald-400 px-3 py-1 rounded">Lavado: {caseData.procedure.wash_quality}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Análisis ULTREON™ AI',
      description: 'La Inteligencia Artificial ha detectado características clave de la lesión.',
      content: (
        <div className="space-y-4">
          <div className="mt-4 p-4 bg-card/50 rounded-lg flex items-center justify-center border border-white/5">
            <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded flex flex-col items-center justify-center text-muted-foreground font-mono text-xs">
              <span className="mb-2">📷 {caseData.oct_images.ultreon}</span>
            </div>
          </div>
          <div className="p-4 bg-white/5 border border-amber-500/30 rounded-xl flex items-center justify-between">
            <span className="text-amber-400">Calcio Detectado</span>
            <span className="font-mono">{caseData.ultreon_findings.calcium}</span>
          </div>
          <div className="p-4 bg-white/5 border border-cyan-500/30 rounded-xl flex items-center justify-between">
            <span className="text-cyan-400">EEL (Lámina Elástica Externa)</span>
            <span className="font-mono">{caseData.ultreon_findings.eel}</span>
          </div>
          <div className="p-4 bg-white/5 border border-cyan-500/30 rounded-xl flex items-center justify-between">
            <span className="text-cyan-400">MLA</span>
            <span className="font-mono">{caseData.ultreon_findings.mla}</span>
          </div>
        </div>
      )
    },
    {
      title: 'Modificación de Estrategia',
      description: 'Basado en los hallazgos de ULTREON™, el operador ha decidido modificar el plan quirúrgico.',
      content: (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 p-4 bg-card/50 rounded-lg flex items-center justify-center border border-white/5">
            <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded flex flex-col items-center justify-center text-muted-foreground font-mono text-xs">
              <span className="mb-2">📷 {caseData.oct_images.strategy_change}</span>
            </div>
          </div>
          <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
            <div className="text-[10px] text-red-400 uppercase font-mono mb-2">Plan Inicial (Angio)</div>
            <div className="text-sm text-muted-foreground">Stent {caseData.strategy_change.initial_plan.diameter} x {caseData.strategy_change.initial_plan.length}</div>
            <div className="text-sm text-muted-foreground">{caseData.strategy_change.initial_plan.prep}</div>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4">
            <div className="text-[10px] text-emerald-400 uppercase font-mono mb-2">Plan ULTREON (OCT)</div>
            <div className="text-sm text-white font-bold">Stent {caseData.strategy_change.modified_plan.diameter} x {caseData.strategy_change.modified_plan.length}</div>
            <div className="text-sm text-white font-bold">{caseData.strategy_change.modified_plan.prep}</div>
          </div>
        </div>
      )
    },
    {
      title: 'Resultado Final & Dashboard',
      description: caseData.final_result.message,
      content: (
        <div className="text-center space-y-6">
          <div className="p-4 bg-card/50 rounded-lg flex items-center justify-center border border-white/5 mb-6">
            <div className="w-full h-48 bg-slate-100 dark:bg-slate-800 rounded flex flex-col items-center justify-center text-muted-foreground font-mono text-xs">
              <span className="mb-2">📷 {caseData.oct_images.post_oct}</span>
            </div>
          </div>
          <div className="inline-block p-4 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-2">
            <span className="text-4xl">🏆</span>
          </div>
          <h3 className="text-xl text-white font-light">OPSTAR Score: <span className="text-emerald-400 font-bold">{caseData.final_result.score}/100</span></h3>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) setCurrentStep(currentStep + 1);
  };

  const isCompleted = currentStep === steps.length - 1;

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col font-sans">
      
      <header className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/admin/demo-center" className="text-muted-foreground hover:text-white">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <span className="text-[10px] uppercase font-mono tracking-widest text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">Demo Clínica</span>
        </div>
        <div className="text-xs font-mono text-muted-foreground flex items-center gap-4">
          <span>Paso {currentStep + 1} de {steps.length}</span>
          <Link href="/admin/demo-center" className="text-muted-foreground hover:text-white border border-border dark:border-slate-700 px-3 py-1 rounded">Volver a Admin</Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          
          <div className="mb-8">
            <div className="flex gap-2 mb-6">
              {steps.map((_, i) => (
                <div key={i} className={`h-1 flex-1 rounded-full ${i <= currentStep ? 'bg-cyan-500' : 'bg-white/10'}`} />
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
            >
              {/* Subtle background glow */}
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

              <h2 className="text-2xl font-light text-white mb-2">{steps[currentStep].title}</h2>
              <p className="text-muted-foreground text-sm mb-8">{steps[currentStep].description}</p>
              
              <div className="min-h-[200px]">
                {steps[currentStep].content}
              </div>

            </motion.div>
          </AnimatePresence>

          <div className="mt-8 flex justify-end">
            {!isCompleted ? (
              <button 
                onClick={nextStep}
                className="px-8 py-4 bg-white text-black font-bold rounded-full hover:bg-slate-200 transition-transform active:scale-95 flex items-center gap-2"
              >
                Siguiente Paso
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            ) : (
              <Link 
                href="/admin/demo-center"
                className="px-8 py-4 bg-emerald-500 text-black font-bold rounded-full hover:bg-emerald-400 transition-transform active:scale-95"
              >
                Finalizar Demo
              </Link>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
