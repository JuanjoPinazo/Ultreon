'use client';
// app/study/StudyClient.tsx

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// ANIMATED COUNTER HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [start, target, duration]);
  return value;
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERSECTION OBSERVER HOOK
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const SECONDARY_ENDPOINTS = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: 'Calidad de Imagen',
    desc: 'Evaluación cualitativa de la aclaración del canal coronario con salino (Excelente, Buena, Regular, Mala).',
    color: 'teal',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    label: 'Conversión a Contraste',
    desc: 'Tasa de necesidad de inyección de contraste yodado de rescate durante la adquisición de OCT.',
    color: 'red',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
      </svg>
    ),
    label: 'Contraste Total en PCI',
    desc: 'Volumen total de medio de contraste yodado administrado a lo largo de todo el procedimiento clínico.',
    color: 'violet',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    label: 'Reducción de Contraste',
    desc: 'Reducción absoluta del uso de contraste yodado comparada con la estimación estándar del procedimiento.',
    color: 'cyan',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
      </svg>
    ),
    label: 'Hallazgos de ULTREON™',
    desc: 'Detección automatizada por inteligencia artificial de calcio severo, arco de calcio, longitud de lesión y diámetros de referencia.',
    color: 'orange',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    label: 'Modificación de Estrategia',
    desc: 'Impacto de las imágenes de OCT en la toma de decisiones clínicas y cambio de la estrategia inicialmente planificada.',
    color: 'emerald',
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    label: 'Reproducibilidad Inter-Centro',
    desc: 'Consistencia y reproducibilidad en la adquisición de pullbacks y tasas de éxito clínico entre los diferentes centros.',
    color: 'indigo',
  },
];

const WORKFLOW_STEPS = [
  { n: '01', title: 'Evaluación Coronaria', sub: 'Angiografía + datos clínicos basales', icon: '🫀' },
  { n: '02', title: 'OCT Pre-ICP', sub: 'Adquisición de pullback Dragonfly OPSTAR', icon: '🔬' },
  { n: '03', title: 'Cuantificación por IA', sub: 'ULTREON™ 3.0: calcio, lípidos, EEL y FFR-OCT', icon: '🧠' },
  { n: '04', title: 'Modificación de Estrategia', sub: 'Selección del stent, zona de anclaje y preparación', icon: '📐' },
  { n: '05', title: 'Implante de ICP', sub: 'Guiado por OCT sin contraste si es factible', icon: '🩺' },
  { n: '06', title: 'OCT Post-Stent', sub: 'Expansión, aposición, bordes - Tríada ULTREON™', icon: '✅' },
  { n: '07', title: 'Finalización de Registro', sub: 'Formulario eCRF OPSTAR-AI · Score · Supabase', icon: '📋' },
];

const RESOURCES = [
  { title: 'Protocolo PDF', sub: 'Protocolo de estudio completo v2.1', icon: '📄', tag: 'PDF', color: 'cyan', href: '#' },
  { title: 'Guía de Referencia Rápida', sub: 'Resumen procedimental en una página', icon: '⚡', tag: 'PDF', color: 'sky', href: '#' },
  { title: 'Póster Científico', sub: 'Formato abstract oficial ESC / AHA', icon: '🖼', tag: 'PPTX', color: 'violet', href: '#' },
  { title: 'Workflow Zero-Contraste', sub: 'Guía visual interactiva paso a paso', icon: '💧', tag: 'PDF', color: 'emerald', href: '/protocols/zero-contrast' },
  { title: 'Manual de eCRF', sub: 'Guía para introducción de datos en OPSTAR-AI', icon: '📋', tag: 'PDF', color: 'amber', href: '#' },
  { title: 'Folleto Informativo', sub: 'Documentación para pacientes y centros', icon: '📌', tag: 'PDF', color: 'rose', href: '#' },
];

const colorMap: Record<string, { text: string; border: string; bg: string; glow: string }> = {
  cyan: { text: 'text-cyan-400', border: 'border-cyan-500/30', bg: 'bg-cyan-950/20', glow: 'shadow-[0_0_20px_rgba(34,211,238,0.08)]' },
  sky: { text: 'text-sky-400', border: 'border-sky-500/30', bg: 'bg-sky-950/20', glow: '' },
  emerald: { text: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-950/20', glow: '' },
  violet: { text: 'text-violet-400', border: 'border-violet-500/30', bg: 'bg-violet-950/20', glow: '' },
  amber: { text: 'text-amber-400', border: 'border-amber-500/30', bg: 'bg-amber-950/20', glow: '' },
  orange: { text: 'text-orange-400', border: 'border-orange-500/30', bg: 'bg-orange-950/20', glow: '' },
  rose: { text: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-950/20', glow: '' },
  teal: { text: 'text-teal-400', border: 'border-teal-500/30', bg: 'bg-teal-950/20', glow: '' },
  indigo: { text: 'text-indigo-400', border: 'border-indigo-500/30', bg: 'bg-indigo-950/20', glow: '' },
};

// ─────────────────────────────────────────────────────────────────────────────
// METRIC CARD WITH COUNTER
// ─────────────────────────────────────────────────────────────────────────────
function MetricCard({
  label, value, suffix, sub, color, start,
}: {
  label: string; value: number; suffix: string; sub: string; color: string; start: boolean;
}) {
  const animated = useCountUp(value, 1600, start);
  const c = colorMap[color] ?? colorMap.cyan;
  return (
    <div className={`relative rounded-2xl border ${c.border} ${c.bg} p-5 flex flex-col justify-between min-h-[110px] overflow-hidden ${c.glow}`}>
      <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-10" style={{ background: 'currentColor' }} />
      <span className={`text-[9px] font-black font-mono uppercase tracking-[0.3em] ${c.text}`}>{label}</span>
      <div className="mt-3 flex items-baseline gap-1">
        <span className={`text-3xl font-black ${c.text} tracking-tight`}>{animated}</span>
        <span className={`text-sm font-bold ${c.text} opacity-70`}>{suffix}</span>
      </div>
      <p className="text-[9px] font-mono text-slate-650 mt-1">{sub}</p>
    </div>
  );
}

interface GovernanceItem {
  id: string;
  section: string;
  title: string;
  body: string;
  display_order: number;
  is_active: boolean;
}

interface StudyClientProps {
  initialHospitals: {
    id: string;
    name: string;
    short_name: string | null;
    city: string | null;
    province: string | null;
    code: string;
    cases: number;
    investigators: {
      id: string;
      full_name: string;
      role: string;
      specialty: string | null;
      is_principal_investigator: boolean;
    }[];
  }[];
  initialStats: {
    totalCases: number;
    zeroContrastPct: number;
    strategyModifiedPct: number;
    meanOpstarScore: number;
    activeHospitalsCount: number;
  };
  initialGovernance: GovernanceItem[];
}

export default function StudyClient({ initialHospitals, initialStats, initialGovernance }: StudyClientProps) {
  const [activeSection, setActiveSection] = useState('hero');

  const metricsRef = useInView(0.2);
  const rationale1Ref = useInView(0.1);
  const rationale2Ref = useInView(0.1);
  const triadaRef = useInView(0.15);

  const NAV_SECTIONS = [
    { id: 'hero', label: 'Resumen' },
    { id: 'rationale', label: 'Racional Clínico' },
    { id: 'endpoints', label: 'Endpoints' },
    { id: 'triada', label: 'La Tríada' },
    { id: 'workflow', label: 'Flujo de Trabajo' },
    { id: 'centers', label: 'Centros' },
    { id: 'governance', label: 'Gobernanza' },
    { id: 'metrics', label: 'Datos en Vivo' },
    { id: 'resources', label: 'Recursos' },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveSection(id);
  };

  // Track active section on scroll
  useEffect(() => {
    const ids = NAV_SECTIONS.map((s) => s.id);
    const observers: IntersectionObserver[] = [];
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(id); },
        { threshold: 0.3 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">

      {/* ── STICKY TOP NAV ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-slate-900/80 bg-slate-950/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/dashboard" className="text-slate-650 hover:text-slate-400 transition-colors text-xs font-mono">
              Panel de Control
            </Link>
            <span className="text-slate-800 text-xs">/</span>
            <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">Estudio</span>
          </div>

          {/* Section pills - hidden on mobile */}
          <div className="hidden md:flex items-center gap-0.5 overflow-x-auto">
            {NAV_SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  activeSection === s.id
                    ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/50'
                    : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/about"
              className="flex-shrink-0 px-3.5 py-2 bg-slate-950 border border-slate-800 hover:border-cyan-500/30 hover:bg-cyan-950/10 text-slate-300 font-bold rounded-xl text-xs transition-all"
            >
              Sobre el Registro
            </Link>

            <Link
              href="/analytics"
              className="flex-shrink-0 px-4 py-2 bg-slate-950 border border-violet-800/40 hover:border-violet-600/60 hover:bg-violet-950/20 text-violet-400 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analítica
            </Link>

            <Link
              href="/registry/new"
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Caso
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section id="hero" className="relative overflow-hidden min-h-[88vh] flex flex-col justify-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-cyan-500/4 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/3 rounded-full blur-3xl" />
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.025)_1px,transparent_1px)] bg-[size:80px_80px]" />
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 md:py-28">
          <div className="max-w-4xl">
            {/* Badges */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { text: 'Registro Multicéntrico', color: 'cyan' },
                { text: 'Prospectivo · Observacional', color: 'slate' },
                { text: `${initialStats.activeHospitalsCount} ${initialStats.activeHospitalsCount === 1 ? 'Hospital' : 'Hospitales'} · Levante`, color: 'slate' },
                { text: 'ULTREON™ 3.0 · Dragonfly OPSTAR', color: 'cyan' },
              ].map((b) => (
                <span
                  key={b.text}
                  className={`text-[9px] font-black font-mono tracking-[0.25em] px-3 py-1.5 rounded-full uppercase border ${
                    b.color === 'cyan'
                      ? 'text-cyan-400 bg-cyan-950/50 border-cyan-800/50'
                      : 'text-slate-500 bg-slate-900 border-slate-800'
                  }`}
                >
                  {b.text}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-5xl sm:text-6xl md:text-7xl xl:text-8xl font-black tracking-tight text-slate-50 leading-[0.9] mb-6">
              OPSTAR-AI
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400">
                Levante
              </span>
              <br />
              <span className="text-slate-400 text-4xl sm:text-5xl md:text-6xl font-light">Registro</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-400 font-light max-w-2xl leading-relaxed mb-3">
              Multicenter Registry for Zero-Contrast OCT Acquisition Using Dragonfly OPSTAR™ and ULTREON™ 3.0
            </p>
            <p className="text-sm text-slate-650 font-mono mb-10 max-w-xl">
              Investigación prospectiva sobre la viabilidad de adquirir imágenes diagnósticas mediante lavado exclusivo con suero salino al 100% y guiado de precisión ULTREON™ 3.0.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => scrollTo('workflow')}
                className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm transition-all shadow-[0_0_30px_rgba(34,211,238,0.25)] hover:shadow-[0_0_45px_rgba(34,211,238,0.4)] cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Abrir Protocolo
              </button>
              <Link
                href="/protocols/zero-contrast"
                className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-slate-900 border border-emerald-800/50 hover:border-emerald-600/70 text-emerald-400 font-bold text-sm transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Flujo Zero-Contraste
              </Link>
              <Link
                href="/registry/new"
                className="flex items-center gap-2 px-7 py-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-sm transition-all cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Registrar Nuevo Caso
              </Link>
            </div>

            {/* Study meta row */}
            <div className="mt-14 pt-8 border-t border-slate-900 grid grid-cols-2 sm:grid-cols-4 gap-6">
              {[
                { label: 'Diseño', value: 'Multicéntrico' },
                { label: 'Tipo', value: 'Prospectivo · Obs.' },
                { label: 'Centros', value: `${initialStats.activeHospitalsCount} ${initialStats.activeHospitalsCount === 1 ? 'Hospital' : 'Hospitales'}` },
                { label: 'Región', value: 'Levante · España' },
              ].map((m) => (
                <div key={m.label}>
                  <div className="text-[9px] font-black font-mono text-slate-600 uppercase tracking-widest mb-1">{m.label}</div>
                  <div className="text-sm font-bold text-slate-300">{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40">
          <div className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Desplazar</div>
          <div className="w-px h-8 bg-gradient-to-b from-slate-700 to-transparent" />
        </div>
      </section>

      {/* ── CLINICAL RATIONALE ────────────────────────────────────────────── */}
      <section id="rationale" className="py-20 md:py-28 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div
            ref={rationale1Ref.ref}
            className={`transition-all duration-700 ${rationale1Ref.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <div className="mb-3">
              <span className="text-[9px] font-black font-mono tracking-[0.35em] text-cyan-400 uppercase">Contexto Clínico</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-slate-50 tracking-tight mb-4">
              ¿Por qué OCT + IA en ICP?
            </h2>
            <p className="text-slate-400 text-base md:text-lg max-w-2xl leading-relaxed mb-12">
              La angiografía por sí sola proporciona un luminograma: no puede caracterizar la morfología de la placa, la pared del vaso ni la interacción stent-vaso. La OCT + IA cierra esta brecha.
            </p>
          </div>

          <div
            ref={rationale2Ref.ref}
            className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 transition-all duration-700 delay-150 ${rationale2Ref.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {[
              {
                icon: '📡',
                color: 'amber',
                title: 'Limitaciones de Angiografía',
                body: 'Únicamente luminograma. No puede detectar la distribución del calcio, la vulnerabilidad de la placa, el diámetro de la EEL o la aposición de struts. Pasa por alto el 30–40% de las decisiones relevantes.',
                tag: 'PROBLEMA',
              },
              {
                icon: '🔬',
                color: 'cyan',
                title: 'Valor de la OCT',
                body: 'Imágenes intravasculares de alta resolución. Visualización directa del arco de calcio, placa lipídica, zonas de anclaje sanas, expansión del stent y disección de bordes.',
                tag: 'SOLUCIÓN',
              },
              {
                icon: '🧠',
                color: 'violet',
                title: 'IA: ULTREON™ 3.0',
                body: 'Cuantificación en tiempo real de calcio, diámetro de EEL y expansión del stent. Elimina la variabilidad del operador y acelera la toma de decisiones en el laboratorio de hemodinámica.',
                tag: 'INNOVACIÓN',
              },
              {
                icon: '📐',
                color: 'emerald',
                title: 'Optimización de Estrategia',
                body: 'Modificación guiada por IA del diámetro/longitud del stent, landing zones y preparación de la placa. Reduce la enfermedad residual, la malaposición y el riesgo de MACE a largo plazo.',
                tag: 'IMPACTO',
              },
            ].map((card) => {
              const c = colorMap[card.color];
              return (
                <div
                  key={card.title}
                  className={`relative rounded-2xl border ${c.border} ${c.bg} p-6 flex flex-col gap-4 overflow-hidden group hover:scale-[1.01] transition-transform duration-200`}
                >
                  <div className={`text-[8px] font-black font-mono tracking-[0.3em] ${c.text} border ${c.border} px-2 py-1 rounded-md self-start`}>
                    {card.tag}
                  </div>
                  <span className="text-3xl leading-none">{card.icon}</span>
                  <div>
                    <h3 className={`text-sm font-bold ${c.text} mb-2`}>{card.title}</h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">{card.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PRIMARY ENDPOINT ──────────────────────────────────────────────── */}
      <section id="endpoints" className="py-16 md:py-20 border-t border-slate-900 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="mb-3">
            <span className="text-[9px] font-black font-mono tracking-[0.35em] text-cyan-400 uppercase">Endpoint Primario</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-50 tracking-tight mb-10">Endpoints del Estudio</h2>

          {/* Primary endpoint card */}
          <div className="relative rounded-3xl border border-cyan-500/30 bg-slate-950 overflow-hidden mb-10 shadow-[0_0_60px_rgba(34,211,238,0.08)]">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl" />
            <div className="relative p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-[9px] font-black font-mono text-cyan-500 tracking-[0.3em] uppercase mb-3">Endpoint Primario · PE-01</div>
                <blockquote className="text-xl md:text-2xl font-bold text-slate-100 leading-snug italic">
                  "Porcentaje de modificación de la estrategia de ICP tras la evaluación con ULTREON™ 3.0 + Dragonfly OPSTAR en comparación con la planificación basada en angiografía."
                </blockquote>
                <div className="mt-5 flex flex-wrap gap-3">
                  <span className="text-[9px] font-black font-mono px-3 py-1 rounded-full border border-cyan-800/50 text-cyan-400 bg-cyan-950/50 uppercase tracking-wider">Resultado dicotómico</span>
                  <span className="text-[9px] font-black font-mono px-3 py-1 rounded-full border border-slate-800 text-slate-500 uppercase tracking-wider">Por procedimiento</span>
                  <span className="text-[9px] font-black font-mono px-3 py-1 rounded-full border border-slate-800 text-slate-500 uppercase tracking-wider">Verificado por CRO</span>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary endpoints grid */}
          <div className="mb-4">
            <span className="text-[9px] font-black font-mono text-slate-500 uppercase tracking-widest">Endpoints Secundarios: SE-01 a SE-09</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SECONDARY_ENDPOINTS.map((ep, i) => {
              const c = colorMap[ep.color] ?? colorMap.cyan;
              return (
                <div
                  key={ep.label}
                  className={`flex gap-4 p-4 rounded-2xl border ${c.border} ${c.bg} group hover:scale-[1.01] transition-transform duration-200`}
                >
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl border flex items-center justify-center ${c.border} ${c.text}`}
                    style={{ background: `${ep.color === 'cyan' ? 'rgba(8,51,68,0.5)' : 'rgba(15,23,42,0.5)'}` }}>
                    {ep.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[9px] font-black font-mono ${c.text} opacity-60`}>SE-{String(i + 1).padStart(2, '0')}</span>
                      <span className="text-xs font-bold text-slate-200">{ep.label}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">{ep.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TRIADA ULTREON™ ───────────────────────────────────────────────── */}
      <section id="triada" className="py-20 md:py-28 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="mb-3">
            <span className="text-[9px] font-black font-mono tracking-[0.35em] text-cyan-400 uppercase">Evaluación Post-Stent</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-50 tracking-tight mb-3">
            La Tríada ULTREON™
          </h2>
          <p className="text-slate-500 text-sm md:text-base max-w-xl leading-relaxed mb-12">
            Tres pilares de la optimización por OCT post-stent: cada uno de ellos se monitoriza y puntúa de forma independiente en el registro OPSTAR-AI.
          </p>

          <div
            ref={triadaRef.ref}
            className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-700 ${triadaRef.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            {[
              {
                n: 'I',
                title: 'EXPANSIÓN',
                titleEs: 'Expansión del Stent',
                color: 'cyan',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                ),
                metrics: [
                  { label: 'MSA', sub: 'Área Mínima del Stent (mm²)' },
                  { label: '≥ 80%', sub: 'Expansión objetivo vs nominal' },
                  { label: 'EEL-basado', sub: 'Método de diámetro de referencia' },
                ],
                body: 'La expansión inadecuada del stent es el predictor independiente más potente de reestenosis intrastent y trombosis tardía del stent. ULTREON™ proporciona mediciones del diámetro basadas en EEL en tiempo real para optimizar la selección del balón NC y del stent.',
              },
              {
                n: 'II',
                title: 'APOSICIÓN',
                titleEs: 'Aposición de Struts',
                color: 'violet',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                ),
                metrics: [
                  { label: 'Malap. Sig.', sub: 'Separación strut-vaso > 0.4 mm' },
                  { label: 'Longitud', sub: 'Arco de malaposición en mm' },
                  { label: 'Corrección', sub: 'Postdilatación adicional' },
                ],
                body: 'La malaposición significativa crea perturbaciones de flujo y un sustrato para la neoaterosclerosis. La OCT proporciona una detección a nivel de strut imposible con la angiografía. La corrección se guía en tiempo real mediante la retroalimentación de ULTREON™.',
              },
              {
                n: 'III',
                title: 'BORDES',
                titleEs: 'Integridad de Bordes',
                color: 'emerald',
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                ),
                metrics: [
                  { label: 'Proximal', sub: 'Disección de borde proximal' },
                  { label: 'Distal', sub: 'Disección de borde distal' },
                  { label: 'Flap > 3mm', sub: 'Tratamiento de flaps grandes' },
                ],
                body: 'Las disecciones de los bordes, especialmente las que se extienden más allá del margen del stent, aumentan el riesgo de cierre agudo del vaso. La selección de la zona de anclaje por IA y la OCT post-stent reducen directamente su incidencia y guían las decisiones de tratamiento.',
              },
            ].map((pillar) => {
              const c = colorMap[pillar.color];
              return (
                <div
                  key={pillar.n}
                  className={`relative rounded-3xl border ${c.border} bg-slate-950 overflow-hidden flex flex-col`}
                >
                  {/* Top accent */}
                  <div className="h-px w-full" style={{ background: `linear-gradient(90deg, transparent, ${pillar.color === 'cyan' ? '#22d3ee' : pillar.color === 'violet' ? '#8b5cf6' : '#10b981'}, transparent)`, opacity: 0.5 }} />

                  <div className="p-7 flex-1 flex flex-col gap-5">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className={`text-[9px] font-black font-mono tracking-[0.4em] ${c.text} mb-1`}>PILAR {pillar.n}</div>
                        <h3 className="text-2xl font-black text-slate-50 tracking-tight">{pillar.title}</h3>
                        <p className={`text-xs font-mono mt-0.5 ${c.text} opacity-70`}>{pillar.titleEs}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${c.border} ${c.text}`}
                        style={{ background: `${pillar.color === 'cyan' ? 'rgba(8,51,68,0.4)' : pillar.color === 'violet' ? 'rgba(46,16,101,0.4)' : 'rgba(6,46,37,0.4)'}` }}>
                        {pillar.icon}
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-3 gap-2">
                      {pillar.metrics.map((m) => (
                        <div key={m.label} className={`p-2.5 rounded-xl border ${c.border} ${c.bg} text-center`}>
                          <div className={`text-sm font-black ${c.text} font-mono`}>{m.label}</div>
                          <div className="text-[8px] text-slate-600 mt-0.5 leading-tight">{m.sub}</div>
                        </div>
                      ))}
                    </div>

                    {/* Body */}
                    <p className="text-[11px] text-slate-400 leading-relaxed flex-1">{pillar.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PROCEDURAL WORKFLOW ───────────────────────────────────────────── */}
      <section id="workflow" className="py-20 md:py-28 border-t border-slate-900 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="mb-3">
            <span className="text-[9px] font-black font-mono tracking-[0.35em] text-cyan-400 uppercase">Flujo de Trabajo</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-50 tracking-tight mb-3">
            Protocolo Paso a Paso
          </h2>
          <p className="text-slate-500 text-sm max-w-lg leading-relaxed mb-14">
            Desde la angiografía hasta el registro eCRF: un flujo de trabajo estandarizado y reproducible para todos los centros participantes.
          </p>

          {/* Timeline */}
          <div className="relative">
            {/* Connector line desktop */}
            <div className="hidden lg:block absolute top-8 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent" />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-4">
              {WORKFLOW_STEPS.map((step, i) => (
                <div key={step.n} className="relative flex flex-col items-center text-center gap-3">
                  {/* Step circle */}
                  <div className="relative z-10 w-16 h-16 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-0.5 flex-shrink-0 group hover:border-cyan-800/60 hover:bg-slate-900 transition-all duration-200">
                    <span className="text-xl leading-none">{step.icon}</span>
                    <span className="text-[8px] font-black font-mono text-cyan-500 opacity-70">{step.n}</span>
                  </div>
                  {/* Arrow connector mobile */}
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <div className="lg:hidden text-slate-700 text-xs">↓</div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-200 leading-tight">{step.title}</div>
                    <div className="text-[9px] text-slate-650 mt-0.5 leading-tight">{step.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="mt-12 flex justify-center">
            <Link
              href="/protocols/zero-contrast"
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-800/50 hover:bg-emerald-950/60 text-emerald-400 font-bold text-sm transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
              Abrir Guía Interactiva Zero-Contraste →
            </Link>
          </div>
        </div>
      </section>

      {/* ── ZERO-CONTRAST HIGHLIGHT ───────────────────────────────────────── */}
      <section className="py-16 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="relative rounded-3xl border border-emerald-800/30 bg-slate-950 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/3 rounded-full blur-3xl" />
            <div className="relative p-8 md:p-12 flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-3xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-4xl">
                  💧
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[9px] font-black font-mono text-emerald-400 tracking-[0.3em] uppercase mb-2">Protocolo Zero-Contraste</div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-50 mb-3">
                  Adquisición de OCT Guiada por Suero Salino
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xl mb-5">
                  El protocolo de purga manual con suero salino mediante Dragonfly OPSTAR permite la adquisición completa de OCT con <span className="text-emerald-400 font-bold">0 mL de contraste yodado</span>, eliminando el riesgo de nefropatía inducida por contraste en pacientes de alto riesgo (ERC, diabetes, deshidratación).
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link
                    href="/protocols/zero-contrast"
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-500/15 border border-emerald-700/60 hover:bg-emerald-500/25 text-emerald-400 font-bold text-sm transition-all"
                  >
                    Ver Protocolo Interactivo
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                  <div className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-800 text-xs font-mono text-slate-550">
                    4 Pasos · Modo Hemodinámica · Lista de verificación
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PARTICIPATING CENTERS ─────────────────────────────────────────── */}
      <section id="centers" className="py-20 md:py-28 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="mb-3">
            <span className="text-[9px] font-black font-mono tracking-[0.35em] text-cyan-400 uppercase">Multicéntrico · Región de Levante</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-50 tracking-tight mb-3">
            Centros Participantes
          </h2>
          <p className="text-slate-500 text-sm max-w-lg leading-relaxed mb-10">
            {initialStats.activeHospitalsCount} {initialStats.activeHospitalsCount === 1 ? 'hospital' : 'hospitales'} de tercer nivel de la Comunitat Valenciana. Todos los centros utilizan el eCRF de OPSTAR-AI estandarizado y el sistema ULTREON™ 3.0.
          </p>

          {initialHospitals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {initialHospitals.map((center) => (
                <div
                  key={center.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-750 rounded-3xl p-6 flex flex-col justify-between transition-all duration-200 relative overflow-hidden group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-sm text-slate-200 tracking-tight leading-snug group-hover:text-cyan-400 transition-colors">
                        {center.name}
                      </h4>
                      <span className="text-[8px] font-bold bg-emerald-950/80 text-emerald-400 px-2 py-0.5 rounded border border-emerald-900/10">Activo</span>
                    </div>
                    <span className="text-[9px] font-mono text-cyan-400 font-bold bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/20 inline-block mt-2">
                      {center.code}
                    </span>

                    <div className="text-[10px] font-mono text-slate-500 mt-2 mb-4">
                      {center.city}{center.province ? `, ${center.province}` : ''} · España
                    </div>

                    {/* Investigators List inside Center Card */}
                    <div className="space-y-2 border-t border-slate-850/60 pt-4">
                      <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider block">Investigadores</span>
                      {center.investigators && center.investigators.length > 0 ? (
                        <ul className="space-y-2 text-xs text-slate-350">
                          {center.investigators.map((inv) => (
                            <li key={inv.id} className="flex items-start gap-2">
                              <span className="text-[10px] translate-y-0.5">🩺</span>
                              <div className="min-w-0">
                                <span className="font-medium text-slate-250">{inv.full_name}</span>
                                {inv.is_principal_investigator && (
                                  <span className="ml-1.5 inline-block text-[7px] font-black font-mono tracking-wider px-1.5 py-0.25 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/30 uppercase">
                                    IP
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[10px] text-slate-600 italic">Investigadores pendientes de asignación</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 pt-3 border-t border-slate-850/60 flex justify-between items-center text-[10px] font-mono">
                    <span className="text-slate-500 uppercase">Casos Registrados</span>
                    <span className="text-sm font-black text-cyan-400">
                      {center.cases > 0 ? center.cases : '—'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-3xl border border-slate-850 bg-slate-900/20 text-center space-y-3">
              <span className="text-4xl">🏥</span>
              <h4 className="text-sm font-bold text-slate-300">Sin hospitales activos</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">No se han registrado hospitales activos en el sistema en este momento.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── GOVERNANCE ──────────────────────────────────────────────────── */}
      <section id="governance" className="py-20 md:py-28 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="mb-3">
            <span className="text-[9px] font-black font-mono tracking-[0.35em] text-cyan-400 uppercase">Organización y Gobernanza</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-50 tracking-tight mb-3">
            Estructura de Gobernanza
          </h2>
          <p className="text-slate-500 text-sm max-w-lg leading-relaxed mb-10">
            Organización científica y administrativa del Registro OPSTAR-AI Levante.
          </p>

          {initialGovernance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {initialGovernance.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 hover:border-slate-750 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 group"
                >
                  <div>
                    <h4 className="text-sm font-black text-slate-50 tracking-tight group-hover:text-cyan-400 transition-colors">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-600 font-mono mt-1 mb-4">
                      {item.section.toUpperCase().replace(/_/g, ' ')}
                    </p>
                    <p className="text-xs leading-relaxed text-slate-300 whitespace-pre-wrap max-h-24 overflow-y-auto">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 rounded-3xl border border-slate-850 bg-slate-900/20 text-center space-y-3">
              <span className="text-4xl">📋</span>
              <h4 className="text-sm font-bold text-slate-300">Información pendiente de completar</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">La estructura de gobernanza será publicada próximamente.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── LIVE METRICS ──────────────────────────────────────────────────── */}
      <section id="metrics" className="py-20 md:py-28 border-t border-slate-900 bg-slate-900/20">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="mb-3">
            <span className="text-[9px] font-black font-mono tracking-[0.35em] text-cyan-400 uppercase">Estado del Registro · En vivo</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-50 tracking-tight mb-3">
            Métricas en Tiempo Real
          </h2>
          <p className="text-slate-550 text-sm max-w-lg leading-relaxed mb-10">
            Datos agregados en tiempo real de todos los centros participantes. Actualizados automáticamente con cada envío de eCRF.
          </p>

          <div
            ref={metricsRef.ref}
            className={`grid grid-cols-2 lg:grid-cols-5 gap-4 transition-all duration-700 ${metricsRef.inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
          >
            <MetricCard label="Casos Totales" value={initialStats.totalCases} suffix="" sub="Registrados en todos los centros" color="cyan" start={metricsRef.inView} />
            <MetricCard label="Zero-Contraste %" value={initialStats.zeroContrastPct} suffix="%" sub="OCT realizadas con 0 mL de contraste" color="emerald" start={metricsRef.inView} />
            <MetricCard label="Estrategia Modificada" value={initialStats.strategyModifiedPct} suffix="%" sub="Cambio procedimental guiado por IA" color="violet" start={metricsRef.inView} />
            <MetricCard label="Score OPSTAR Medio" value={initialStats.meanOpstarScore} suffix="/100" sub="Puntuación promedio de optimización" color="sky" start={metricsRef.inView} />
            <MetricCard label="Centros Activos" value={initialStats.activeHospitalsCount} suffix="" sub="Centros aportando datos clínicos" color="amber" start={metricsRef.inView} />
          </div>

          {/* Recruitment banner */}
          <div className="mt-6 p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-200">Registro Abierto para Reclutamiento</p>
                <p className="text-[10px] text-slate-550 mt-0.5">Todos los centros autorizados están inscribiendo casos activamente. Ingrese los datos en el eCRF OPSTAR-AI.</p>
              </div>
            </div>
            <Link
              href="/registry/new"
              className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Registrar Nuevo Caso
            </Link>
          </div>
        </div>
      </section>

      {/* ── INVESTIGATOR RESOURCES ────────────────────────────────────────── */}
      <section id="resources" className="py-20 md:py-28 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="mb-3">
            <span className="text-[9px] font-black font-mono tracking-[0.35em] text-cyan-400 uppercase">Recursos del Investigador</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-slate-50 tracking-tight mb-3">
            Descargas y Referencias
          </h2>
          <p className="text-slate-500 text-sm max-w-lg leading-relaxed mb-10">
            Materiales de estudio y plantillas oficiales para investigadores, hemodinamistas y coordinadores.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {RESOURCES.map((res) => {
              const c = colorMap[res.color] ?? colorMap.cyan;
              const isLink = res.href !== '#';
              const Wrapper = isLink ? Link : 'div';
              return (
                <Wrapper
                  key={res.title}
                  href={res.href}
                  className={`group relative flex items-start gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isLink
                      ? `${c.border} ${c.bg} hover:scale-[1.01]`
                      : 'border-slate-800 bg-slate-900/40 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className={`text-3xl flex-shrink-0 leading-none w-10 text-center`}>{res.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-slate-50 transition-colors">{res.title}</span>
                      <span className={`text-[7px] font-black font-mono px-1.5 py-0.5 rounded border ${c.border} ${c.text} uppercase tracking-wider flex-shrink-0`}>{res.tag}</span>
                      {!isLink && <span className="text-[7px] font-mono text-slate-700 uppercase">Próximamente</span>}
                    </div>
                    <p className="text-[10px] text-slate-550 leading-relaxed">{res.sub}</p>
                  </div>
                  {isLink && (
                    <svg className={`w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity ${c.text}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </Wrapper>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-slate-900 py-10">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs">A</div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">ULTREON™ 3.0</span>
              </div>
              <p className="text-[10px] text-slate-600 mt-0.5">OPSTAR-AI Levante Registry · Estudio Multicéntrico</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-xs text-slate-650 hover:text-slate-400 transition-colors font-mono">Panel de Control</Link>
            <Link href="/registry/new" className="text-xs text-slate-650 hover:text-slate-400 transition-colors font-mono">Nuevo Caso</Link>
            <Link href="/protocols/zero-contrast" className="text-xs text-slate-650 hover:text-slate-400 transition-colors font-mono">Zero-Contraste</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
