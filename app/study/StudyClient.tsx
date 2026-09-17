'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const PILLARS = [
  {
    icon: '🔬',
    title: 'Impacto diagnóstico',
    desc: 'Información no evidente angiográficamente, mejorando la caracterización de lesión y la definición precisa de las landing zones.'
  },
  {
    icon: '📐',
    title: 'Impacto en la estrategia terapéutica',
    desc: 'Medición del Decision Change Rate, preparación de lesión adecuada, selección del diámetro/longitud del stent y estrategias en bifurcaciones.'
  },
  {
    icon: '🦴',
    title: 'Detección automática de calcio',
    desc: 'Evaluación de la precisión percibida, utilidad clínica en tiempo real y su influencia directa en la preparación de la lesión calcificada.'
  },
  {
    icon: '💧',
    title: 'Detección automática de lípidos',
    desc: 'Análisis del valor clínico, obtención de información adicional de la placa vulnerable y su posible impacto terapéutico en pacientes con SCA.'
  },
  {
    icon: '🫀',
    title: 'Utilidad en TCI',
    desc: 'Análisis de factibilidad técnica, calidad de adquisición en el tronco coronario izquierdo y su impacto en la terapéutica adoptada.'
  },
  {
    icon: '📈',
    title: 'Valor de FFR-OCT',
    desc: 'Exploración de escenarios de uso clínico óptimos, confianza del operador en los resultados y modificación efectiva de la conducta clínica.'
  },
  {
    icon: '✅',
    title: 'Optimización post-PCI',
    desc: 'Detección precisa de infraexpansión, malaposición del stent o disección de borde, justificando así el tratamiento adicional de optimización.'
  },
  {
    icon: '⚡',
    title: 'Eficiencia operativa',
    desc: 'Evaluación del impacto del Fast Pullback y el co-registro en la reducción del tiempo, esfuerzo y barreras operativas procedimentales.'
  },
  {
    icon: '🚀',
    title: 'Adopción futura',
    desc: 'Medición del aumento esperado del uso de OCT impulsado por las nuevas funcionalidades tractoras y la identificación de nuevos escenarios clínicos.'
  }
];

function PillarCard({ pillar, index }: { pillar: any; index: number }) {
  const { ref, inView } = useInView(0.1);
  return (
    <div
      ref={ref}
      className={`bg-card border border-border rounded-2xl p-6 transition-all duration-700 transform ${
        inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
      }`}
      style={{ transitionDelay: `${index * 50}ms` }}
    >
      <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl mb-4">
        {pillar.icon}
      </div>
      <h3 className="text-lg font-bold text-foreground mb-2 leading-tight">{pillar.title}</h3>
      <p className="text-sm text-foreground-secondary leading-relaxed">
        {pillar.desc}
      </p>
    </div>
  );
}

export default function StudyClient({ initialHospitals, initialStats, initialGovernance }: any = {}) {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  return (
    <main className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border transition-colors">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md shadow-cyan-500/20">
              U3
            </div>
            <div className="font-bold text-sm tracking-tight text-foreground">
              ULTREON™ <span className="text-foreground-secondary font-normal">Registro Clínico</span>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="text-xs font-semibold px-4 py-2 bg-secondary text-secondary-foreground hover:bg-slate-200 dark:hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors border border-border"
          >
            Volver al Panel
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-background to-background" />
        <div className="max-w-4xl mx-auto px-6 relative text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-950/50 text-cyan-800 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 text-xs font-bold uppercase tracking-wider mb-2">
            Documento de Proyecto
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight leading-tight">
            REGISTRO CLÍNICO <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
              ULTREON™ 3.0
            </span>
          </h1>
          <h2 className="text-lg md:text-xl font-bold md:font-semibold text-foreground-secondary">
            Post-Market Evaluation & Clinical Utility Registry
          </h2>
          <p className="text-base md:text-lg text-foreground-secondary font-medium leading-[1.7] max-w-3xl mx-auto">
            Registro observacional multicéntrico orientado a evaluar la utilidad clínica de las nuevas funcionalidades de ULTREON 3.0 en la práctica intervencionista real.
          </p>
        </div>
      </section>

      {/* PILLARS GRID */}
      <section className="py-16 bg-surface-secondary border-y border-border">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-foreground">Pilares de Evaluación</h2>
            <p className="text-sm text-foreground-secondary font-medium mt-3 max-w-2xl mx-auto">
              El registro captura evidencia del impacto real de la plataforma en nueve dimensiones críticas del procedimiento intervencionista.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PILLARS.map((pillar, idx) => (
              <PillarCard key={idx} pillar={pillar} index={idx} />
            ))}
          </div>
        </div>
      </section>

      {/* SCIENTIFIC HYPOTHESIS SECTION */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 mb-4">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">Qué esperamos obtener del Registro</h2>
          
          <div className="text-left space-y-6 text-foreground-secondary bg-card border border-border rounded-3xl p-8 md:p-10 shadow-sm">
            <p className="text-base leading-relaxed">
              El objetivo fundamental de este registro no es simplemente acumular casos, sino responder a las <strong className="text-foreground">preguntas clave</strong> que definen el valor añadido del software de inteligencia artificial en el mundo real:
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>¿En qué porcentaje de casos la información proporcionada por ULTREON 3.0 altera significativamente la estrategia previamente planificada mediante angiografía? (Decision Change Rate)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>¿En qué medida las nuevas herramientas automáticas (detección de calcio, lípidos y FFR-OCT) aumentan la confianza del operador y reducen la carga cognitiva durante procedimientos complejos?</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary font-bold mt-0.5">•</span>
                <span>¿Es la adopción de protocolos como el Fast Pullback o el co-registro un factor determinante para democratizar el uso de imagen intracoronaria, haciéndolo más eficiente en tiempo y recursos?</span>
              </li>
            </ul>
            <p className="text-sm pt-4 border-t border-border text-muted-foreground">
              Los datos extraídos de esta plataforma eCRF nutrirán el análisis de estas hipótesis, estableciendo la base para futuras publicaciones y presentaciones en congresos (ESC / PCR).
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-border bg-card/50 text-center text-xs text-muted-foreground">
        <p>© 2026 ULTREON™ 3.0 Clinical Registry. Abbott Vascular.</p>
      </footer>
    </main>
  );
}
