'use client';

// app/protocols/zero-contrast/ZeroContrastClient.tsx

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4;
type QualityRating = 'excellent' | 'adequate' | 'suboptimal' | null;
type WashQuality = 'excellent' | 'adequate' | 'suboptimal' | null;

interface QualityAssessment {
  washQuality: WashQuality;
  residualBlood: QualityRating;
  additionalContrast: boolean | null;
  octImageQuality: QualityRating;
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const PROTOCOL_STEPS = [
  {
    id: 1 as Step,
    code: 'PREP',
    title: 'Preparación',
    titleEn: 'Setup & Preparation',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    color: 'cyan',
    duration: '2–3 min',
    checklist: [
      { id: 'ntg', label: 'NTG intracoronaria', sub: '100–200 µg IC antes de adquisición', critical: true },
      { id: 'heparin', label: 'Suero heparinizado 37°C', sub: '10 U heparina / mL salino al 0,9%', critical: true },
      { id: 'syringe', label: 'Jeringa Luer-Lock 10 mL / 20 mL', sub: 'Cebada sin burbujas de aire (nunca usar jeringas de 50 mL)', critical: true },
      { id: 'system', label: 'Sistema OPSTAR™ preparado', sub: 'Dragonfly posicionado distal a lesión', critical: true },
    ],
    notes: 'Verifica que la guía esté estable y que el catéter guía esté bien alojado antes de comenzar la purga.',
  },
  {
    id: 2 as Step,
    code: 'INJECT',
    title: 'Inyección',
    titleEn: 'Saline Injection',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
      </svg>
    ),
    color: 'sky',
    duration: '3–5 s',
    checklist: [
      { id: 'vigorous', label: 'Inyección vigorosa y continua', sub: 'Ritmo sostenido, sin pauses', critical: true },
      { id: 'pullback-coord', label: 'Coordinación con pullback automático', sub: 'Iniciar pullback simultáneamente', critical: true },
      { id: 'wire-stability', label: 'Estabilidad de la guía', sub: 'Guía en posición durante toda la inyección', critical: false },
      { id: 'clearing', label: 'Objetivo: clearing sanguíneo total', sub: 'Lumen libre de eritrocitos visible en monitor', critical: true },
    ],
    notes: 'Comunicar al team 3 segundos antes de inyección. La presión de inyección debe ser uniforme — evitar pulsaciones.',
  },
  {
    id: 3 as Step,
    code: 'ACQUIRE',
    title: 'Adquisición',
    titleEn: 'OCT Acquisition',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    color: 'violet',
    duration: '3–4 s',
    checklist: [
      { id: 'pullback-speed', label: 'Pullback 36–75 mm/s confirmado', sub: 'Velocidad según longitud del stent a evaluar', critical: true },
      { id: 'blood-free', label: 'Ausencia de sangre en lumen', sub: 'Imagen OCT clara sin artefactos hemáticos', critical: true },
      { id: 'diagnostic', label: 'Imagen diagnóstica confirmada', sub: 'EEL visible en ≥70% de los frames', critical: true },
      { id: 'artifacts', label: 'Sin artefactos de movimiento', sub: 'No motion artifacts, stent bien definido', critical: false },
    ],
    notes: 'Si la sangre no se elimina completamente, repetir la secuencia. No aceptar imágenes subóptimas para decisiones clínicas.',
  },
  {
    id: 4 as Step,
    code: 'RESULT',
    title: 'Resultado',
    titleEn: 'Assessment & Result',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'emerald',
    duration: 'Post-proc',
    checklist: [
      { id: 'zero-confirmed', label: 'Zero-Contrast completado', sub: 'Contraste total: 0 mL durante adquisición', critical: true },
      { id: 'wash-quality', label: 'Calidad del lavado evaluada', sub: 'Excellent / Adequate / Suboptimal', critical: true },
      { id: 'contrast-needed', label: 'Necesidad de contraste adicional', sub: 'Documentar si se requirió contraste de rescate', critical: false },
      { id: 'oct-registered', label: 'Co-registro OCT guardado en ULTREON™', sub: 'Imágenes archivadas y disponibles para análisis IA', critical: false },
    ],
    notes: 'Documentar resultado en eCRF OPSTAR-AI. El score final incluirá la penalización si se requirió contraste adicional.',
  },
];

const TROUBLESHOOTING = [
  {
    id: 'residual-blood',
    title: 'Residual Blood',
    titleEs: 'Sangre Residual',
    severity: 'high' as const,
    problem: 'Eritrocitos visibles en imagen OCT tras pullback',
    cause: 'Inyección insuficiente o pullback iniciado muy tarde',
    solution: 'Repetir secuencia. Aumentar velocidad y volumen de inyección. Verificar posición del catéter guía.',
    icon: '🩸',
  },
  {
    id: 'vasospasm',
    title: 'Vasospasm',
    titleEs: 'Vasoespasmo',
    severity: 'high' as const,
    problem: 'Contracción coronaria visible durante o tras inyección',
    cause: 'Ausencia de NTG previa, temperatura del suero baja, estimulación mecánica',
    solution: 'NTG 200 µg IC. Retirar Dragonfly. Esperar resolución. Repetir con suero más tibio.',
    icon: '⚡',
  },
  {
    id: 'incomplete-clearing',
    title: 'Incomplete Clearing',
    titleEs: 'Lavado Incompleto',
    severity: 'medium' as const,
    problem: 'Clearing parcial — sangre visible en región proximal o distal',
    cause: 'Volumen insuficiente, colateral prominente, catéter guía mal alojado',
    solution: 'Repetir la purga de salino de forma más vigorosa usando jeringas de 20 mL. Asegurar engagement del catéter guía. Ocluir colateral si necesario.',
    icon: '🌊',
  },
  {
    id: 'pullback-desync',
    title: 'Pullback Desync',
    titleEs: 'Desincronización del Pullback',
    severity: 'medium' as const,
    problem: 'Pullback iniciado antes o después de la inyección',
    cause: 'Falta de coordinación del equipo, delay del sistema',
    solution: 'Establecer señal verbal clara ("3-2-1-Inyecta"). Verificar que pullback se active simultáneamente.',
    icon: '🔄',
  },
  {
    id: 'poor-oct',
    title: 'Poor OCT Quality',
    titleEs: 'Baja Calidad de Imagen',
    severity: 'low' as const,
    problem: 'EEL no visible, alta atenuación, artefactos de guía',
    cause: 'Calcio severo, ángulo de imagen, posición del Dragonfly',
    solution: 'Ajustar posición del Dragonfly. Evaluar con mapa IMAP. Considerar segmento alternativo.',
    icon: '📡',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function CheckItem({
  label,
  sub,
  critical,
  checked,
  onToggle,
}: {
  label: string;
  sub: string;
  critical: boolean;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer select-none group ${
        checked
          ? 'bg-cyan-950/30 border-cyan-500/40 shadow-[0_0_12px_rgba(34,211,238,0.08)]'
          : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      <div
        className={`mt-0.5 w-5 h-5 rounded-md border flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
          checked
            ? 'bg-cyan-400 border-cyan-400 text-slate-950'
            : 'border-slate-700 bg-slate-950/80 group-hover:border-slate-600'
        }`}
      >
        {checked && (
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold font-mono ${checked ? 'text-cyan-300' : 'text-slate-200'}`}>
            {label}
          </span>
          {critical && (
            <span className="text-[8px] font-black font-mono px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/40 uppercase tracking-wider">
              CRITICAL
            </span>
          )}
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{sub}</p>
      </div>
    </button>
  );
}

function TroubleshootingCard({
  item,
}: {
  item: (typeof TROUBLESHOOTING)[0];
}) {
  const [expanded, setExpanded] = useState(false);
  const severityMap = {
    high: { label: 'HIGH', cls: 'text-red-400 bg-red-950/60 border-red-800/40' },
    medium: { cls: 'text-amber-400 bg-amber-950/60 border-amber-800/40', label: 'MED' },
    low: { cls: 'text-slate-400 bg-slate-900 border-slate-800', label: 'LOW' },
  };
  const sev = severityMap[item.severity];

  return (
    <button
      type="button"
      onClick={() => setExpanded((p) => !p)}
      className="w-full text-left bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-center gap-4 p-4">
        <span className="text-2xl flex-shrink-0 leading-none">{item.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-slate-100 font-mono uppercase tracking-wide">
              {item.titleEs}
            </span>
            <span className={`text-[8px] font-black font-mono px-1.5 py-0.5 rounded border ${sev.cls}`}>
              {sev.label}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">{item.problem}</p>
        </div>
        <svg
          className={`w-4 h-4 text-slate-500 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {expanded && (
        <div className="border-t border-slate-800 px-4 pb-4 pt-3 space-y-2">
          <div className="flex gap-3">
            <span className="text-[9px] font-black font-mono text-amber-400 uppercase tracking-widest w-12 flex-shrink-0 pt-0.5">Causa</span>
            <p className="text-[11px] text-slate-300 leading-relaxed">{item.cause}</p>
          </div>
          <div className="flex gap-3">
            <span className="text-[9px] font-black font-mono text-cyan-400 uppercase tracking-widest w-12 flex-shrink-0 pt-0.5">Acción</span>
            <p className="text-[11px] text-slate-200 leading-relaxed font-medium">{item.solution}</p>
          </div>
        </div>
      )}
    </button>
  );
}

function QualityBadge({
  value,
  selected,
  onSelect,
}: {
  value: 'excellent' | 'adequate' | 'suboptimal';
  selected: boolean;
  onSelect: () => void;
}) {
  const map = {
    excellent: { label: 'Excelente', cls: 'border-emerald-500 bg-emerald-950/40 text-emerald-400', dot: 'bg-emerald-400' },
    adequate: { label: 'Aceptable', cls: 'border-yellow-500/50 bg-yellow-950/30 text-yellow-400', dot: 'bg-yellow-400' },
    suboptimal: { label: 'Subóptimo', cls: 'border-red-500/50 bg-red-950/30 text-red-400', dot: 'bg-red-400' },
  };
  const m = map[value];
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold font-mono cursor-pointer transition-all duration-200 ${
        selected ? m.cls : 'border-slate-800 bg-slate-950/60 text-slate-500 hover:border-slate-700'
      }`}
    >
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${selected ? m.dot : 'bg-slate-700'}`} />
      {m.label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// HEMO MODE overlay
// ─────────────────────────────────────────────────────────────────────────────
function HemoMode({
  step,
  onStepChange,
  checkedItems,
  onToggleCheck,
  onClose,
}: {
  step: Step;
  onStepChange: (s: Step) => void;
  checkedItems: Record<string, boolean>;
  onToggleCheck: (id: string) => void;
  onClose: () => void;
}) {
  const current = PROTOCOL_STEPS.find((s) => s.id === step)!;
  const total = current.checklist.length;
  const done = current.checklist.filter((c) => checkedItems[`${step}-${c.id}`]).length;
  const pct = Math.round((done / total) * 100);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const colorMap: Record<Step, string> = {
    1: '#22d3ee',
    2: '#38bdf8',
    3: '#8b5cf6',
    4: '#10b981',
  };
  const accent = colorMap[step];

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col"
      style={{ WebkitFontSmoothing: 'antialiased' }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-900 flex-shrink-0">
        <div className="flex items-center gap-4">
          <span
            className="text-[10px] font-black font-mono tracking-[0.3em] uppercase"
            style={{ color: accent }}
          >
            MODO QUIRÓFANO ACTIVO
          </span>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: accent }} />
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 transition-colors p-2 rounded-xl hover:bg-slate-900 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Step nav */}
        <div className="flex lg:flex-col gap-2 p-4 lg:p-6 border-b lg:border-b-0 lg:border-r border-slate-900 overflow-x-auto lg:overflow-x-visible lg:w-44 lg:flex-shrink-0">
          {PROTOCOL_STEPS.map((s) => {
            const isActive = s.id === step;
            const colors: Record<Step, string> = { 1: '#22d3ee', 2: '#38bdf8', 3: '#8b5cf6', 4: '#10b981' };
            const c = colors[s.id];
            return (
              <button
                key={s.id}
                onClick={() => onStepChange(s.id)}
                className="flex lg:flex-row items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer flex-shrink-0"
                style={
                  isActive
                    ? { background: `${c}18`, border: `1px solid ${c}60`, color: c }
                    : { background: '#0f172a', border: '1px solid #1e293b', color: '#64748b' }
                }
              >
                <span className="text-lg font-black font-mono">{s.id}</span>
                <div className="hidden lg:block">
                  <div className="text-[10px] font-black font-mono uppercase tracking-widest">{s.code}</div>
                  <div className="text-[9px] opacity-70">{s.title}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Center: Checklist BIG */}
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {/* Step header */}
          <div className="mb-8">
            <div
              className="text-[10px] font-black font-mono tracking-[0.4em] uppercase mb-2"
              style={{ color: accent }}
            >
              PASO {current.id} / 4 — {current.code}
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-50 tracking-tight">
              {current.title}
            </h2>
            <p className="text-slate-400 text-lg mt-1">{current.titleEn}</p>
          </div>

          {/* Progress bar */}
          <div className="mb-6">
            <div className="flex justify-between text-xs font-mono font-bold mb-2">
              <span className="text-slate-400">Progreso</span>
              <span style={{ color: accent }}>{done}/{total} completados</span>
            </div>
            <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: accent }}
              />
            </div>
          </div>

          {/* Checklist BIG */}
          <div className="space-y-3">
            {current.checklist.map((item) => {
              const key = `${step}-${item.id}`;
              const checked = !!checkedItems[key];
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onToggleCheck(key)}
                  className="w-full text-left flex items-center gap-4 p-5 rounded-2xl border transition-all duration-200 cursor-pointer"
                  style={
                    checked
                      ? { background: `${accent}12`, borderColor: `${accent}50` }
                      : { background: '#0f172a', borderColor: '#1e293b' }
                  }
                >
                  <div
                    className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center border-2 transition-all duration-200"
                    style={
                      checked
                        ? { background: accent, borderColor: accent, color: '#0a0e1a' }
                        : { background: 'transparent', borderColor: '#334155' }
                    }
                  >
                    {checked && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-xl lg:text-2xl font-black font-mono"
                        style={{ color: checked ? accent : '#94a3b8' }}
                      >
                        {item.label}
                      </span>
                      {item.critical && !checked && (
                        <span className="text-[9px] font-black font-mono px-2 py-0.5 rounded-md bg-red-950 text-red-400 border border-red-800/50 uppercase">
                          CRITICAL
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-sm mt-0.5">{item.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Clinical note */}
          <div className="mt-6 p-4 bg-slate-900/80 border border-slate-800 rounded-xl">
            <p className="text-xs font-mono text-slate-400 leading-relaxed">
              <span className="text-slate-500 font-bold">NOTA CLÍNICA: </span>
              {current.notes}
            </p>
          </div>
        </div>

        {/* Right: nav arrows */}
        <div className="hidden lg:flex flex-col items-center justify-center gap-4 p-6 border-l border-slate-900 w-24">
          <button
            onClick={() => onStepChange(Math.max(1, step - 1) as Step)}
            disabled={step === 1}
            className="p-3 rounded-xl border border-slate-800 text-slate-500 hover:text-slate-200 hover:border-slate-700 transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <span className="text-xs font-mono text-slate-600 font-bold">{step}/4</span>
          <button
            onClick={() => onStepChange(Math.min(4, step + 1) as Step)}
            disabled={step === 4}
            className="p-3 rounded-xl border border-slate-800 text-slate-500 hover:text-slate-200 hover:border-slate-700 transition-all disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom mobile nav */}
      <div className="lg:hidden flex border-t border-slate-900 flex-shrink-0">
        <button
          onClick={() => onStepChange(Math.max(1, step - 1) as Step)}
          disabled={step === 1}
          className="flex-1 py-4 text-slate-500 text-sm font-bold font-mono disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
        >
          ← ANTERIOR
        </button>
        <div className="flex items-center px-4 border-x border-slate-900">
          <span className="text-xs font-mono text-slate-600">{step}/4</span>
        </div>
        <button
          onClick={() => onStepChange(Math.min(4, step + 1) as Step)}
          disabled={step === 4}
          className="flex-1 py-4 text-sm font-bold font-mono disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
          style={{ color: accent }}
        >
          SIGUIENTE →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN CLIENT
// ─────────────────────────────────────────────────────────────────────────────
export default function ZeroContrastClient() {
  const [activeStep, setActiveStep] = useState<Step>(1);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [hemoMode, setHemoMode] = useState(false);
  const [showQuickView, setShowQuickView] = useState(false);
  const [quality, setQuality] = useState<QualityAssessment>({
    washQuality: null,
    residualBlood: null,
    additionalContrast: null,
    octImageQuality: null,
  });

  const toggleCheck = useCallback((key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const getStepProgress = (step: Step) => {
    const s = PROTOCOL_STEPS.find((x) => x.id === step)!;
    const done = s.checklist.filter((c) => checkedItems[`${step}-${c.id}`]).length;
    return { done, total: s.checklist.length, pct: Math.round((done / s.checklist.length) * 100) };
  };

  const totalDone = PROTOCOL_STEPS.reduce((acc, s) => {
    return acc + s.checklist.filter((c) => checkedItems[`${s.id}-${c.id}`]).length;
  }, 0);
  const totalItems = PROTOCOL_STEPS.reduce((acc, s) => acc + s.checklist.length, 0);

  const currentStepData = PROTOCOL_STEPS.find((s) => s.id === activeStep)!;
  const colorAccentMap: Record<Step, { text: string; border: string; bg: string; glow: string }> = {
    1: { text: 'text-cyan-400', border: 'border-cyan-500/40', bg: 'bg-cyan-950/25', glow: 'shadow-[0_0_30px_rgba(34,211,238,0.12)]' },
    2: { text: 'text-sky-400', border: 'border-sky-500/40', bg: 'bg-sky-950/25', glow: 'shadow-[0_0_30px_rgba(56,189,248,0.12)]' },
    3: { text: 'text-violet-400', border: 'border-violet-500/40', bg: 'bg-violet-950/25', glow: 'shadow-[0_0_30px_rgba(139,92,246,0.12)]' },
    4: { text: 'text-emerald-400', border: 'border-emerald-500/40', bg: 'bg-emerald-950/25', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.12)]' },
  };
  const accent = colorAccentMap[activeStep];

  const stepColors: Record<Step, string> = { 1: '#22d3ee', 2: '#38bdf8', 3: '#8b5cf6', 4: '#10b981' };

  return (
    <>
      {hemoMode && (
        <HemoMode
          step={activeStep}
          onStepChange={setActiveStep}
          checkedItems={checkedItems}
          onToggleCheck={toggleCheck}
          onClose={() => setHemoMode(false)}
        />
      )}

      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        {/* ── TOP NAV ───────────────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-50 border-b border-slate-900/80 bg-slate-950/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-slate-500 hover:text-slate-300 transition-colors text-xs font-mono"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Panel Principal
              </Link>
              <span className="text-slate-800 text-xs">/</span>
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">Protocolos</span>
              <span className="text-slate-800 text-xs">/</span>
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest">Zero-Contraste</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Protocolo v2.1</span>
              </div>
              <button
                onClick={() => setHemoMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-800/50 text-red-400 text-[10px] font-black font-mono uppercase tracking-wider hover:bg-red-950 transition-all cursor-pointer"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                Modo Quirófano
              </button>
            </div>
          </div>
        </nav>

        {/* ── HERO ──────────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden">
          {/* Background layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-20 right-0 w-80 h-80 bg-blue-500/4 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

          <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-16 pb-14 md:pt-20 md:pb-18">
            {/* Badge row */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-[9px] font-black font-mono tracking-[0.35em] text-cyan-400 bg-cyan-950/60 border border-cyan-800/50 px-3 py-1.5 rounded-full uppercase">
                ULTREON™ 3.0
              </span>
              <span className="text-[9px] font-black font-mono tracking-[0.25em] text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full uppercase">
                Dragonfly OPSTAR
              </span>
              <span className="text-[9px] font-black font-mono tracking-[0.25em] text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-full uppercase">
                Protocolo Zero-Contraste
              </span>
            </div>

            {/* Headline */}
            <div className="mb-4">
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-slate-50 leading-none">
                ZERO-CONTRAST
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-400">
                  OCT
                </span>
              </h1>
            </div>

            <p className="text-slate-400 text-lg md:text-xl font-light mb-2 max-w-2xl leading-relaxed">
              Flujo de trabajo de adquisición de OCT manual guiado por suero salino.{' '}
              <span className="text-slate-300 font-medium">Paso a paso, optimizado para sala de hemodinámica.</span>
            </p>
            <p className="text-[11px] font-mono text-slate-600 mb-8 tracking-wider uppercase">
              Protocolo diseñado para sala de hemodinámica · iPad optimizado · 0 ml contraste
            </p>

            {/* Progress summary */}
            <div className="flex items-center gap-3 mb-8">
              <div className="flex-1 max-w-xs">
                <div className="flex justify-between text-[10px] font-mono mb-1.5">
                  <span className="text-slate-500">Progreso de la sesión</span>
                  <span className="text-cyan-400 font-bold">{totalDone}/{totalItems}</span>
                </div>
                <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-sky-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.round((totalDone / totalItems) * 100)}%` }}
                  />
                </div>
              </div>
              {totalDone === totalItems && totalItems > 0 && (
                <span className="text-[10px] font-black font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                  ✓ COMPLETADO
                </span>
              )}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  setActiveStep(1);
                  document.getElementById('protocol-steps')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm transition-all duration-200 shadow-[0_0_25px_rgba(34,211,238,0.3)] hover:shadow-[0_0_40px_rgba(34,211,238,0.45)] cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Iniciar Protocolo
              </button>

              <button
                onClick={() => setShowQuickView((p) => !p)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-bold text-sm transition-all duration-200 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
                Vista Rápida
              </button>

              <button
                onClick={() => setHemoMode(true)}
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-red-950/50 border border-red-800/50 hover:bg-red-950 text-red-400 font-bold text-sm transition-all duration-200 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                </svg>
                Modo Quirófano
              </button>

              <a
                href="/protocols/zero-contrast/Protocolo_Zero_Contrast_OCT_OPSTAR_AI_Levante_A3_v3.pdf"
                download
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 text-slate-200 font-bold text-sm transition-all duration-200 cursor-pointer hover:text-cyan-400"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Póster A3
              </a>

              <a
                href="/protocols/zero-contrast/Protocolo_Zero_Contrast_OCT_OPSTAR_AI_Levante_A4_v3.pdf"
                download
                className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 text-slate-200 font-bold text-sm transition-all duration-200 cursor-pointer hover:text-cyan-400"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Póster A4
              </a>
            </div>
          </div>
        </section>

        {/* ── QUICK VIEW PANEL ─────────────────────────────────────────────── */}
        {showQuickView && (
          <section className="border-t border-slate-900 bg-slate-900/40">
            <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PROTOCOL_STEPS.map((s) => {
                  const prog = getStepProgress(s.id);
                  const color = stepColors[s.id];
                  return (
                    <button
                      key={s.id}
                      onClick={() => {
                        setActiveStep(s.id);
                        setShowQuickView(false);
                        document.getElementById('protocol-steps')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="p-4 rounded-2xl border border-slate-800 bg-slate-950/60 hover:border-slate-700 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center border border-slate-800" style={{ background: `${color}14`, color }}>
                          {s.icon}
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-500">{s.duration}</span>
                      </div>
                      <div className="text-[9px] font-black font-mono uppercase tracking-widest mb-1" style={{ color }}>Step {s.id}</div>
                      <div className="text-xs font-bold text-slate-200 mb-2">{s.title}</div>
                      <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${prog.pct}%`, background: color, transition: 'width 0.4s' }} />
                      </div>
                      <div className="text-[9px] font-mono text-slate-600 mt-1">{prog.done}/{prog.total}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* ── MAIN LAYOUT: SIDEBAR + CONTENT ───────────────────────────────── */}
        <div id="protocol-steps" className="max-w-7xl mx-auto px-4 md:px-8 py-10 flex flex-col lg:flex-row gap-8">

          {/* SIDEBAR */}
          <aside className="lg:w-64 xl:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-20 space-y-2">
              <div className="text-[9px] font-black font-mono tracking-[0.3em] text-slate-600 uppercase mb-4 px-1">
                Pasos del Protocolo
              </div>
              {PROTOCOL_STEPS.map((s) => {
                const prog = getStepProgress(s.id);
                const isActive = activeStep === s.id;
                const color = stepColors[s.id];
                const isDone = prog.pct === 100;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveStep(s.id)}
                    className="w-full text-left p-4 rounded-2xl border transition-all duration-200 cursor-pointer group"
                    style={
                      isActive
                        ? { background: `${color}10`, borderColor: `${color}45`, boxShadow: `0 0 20px ${color}10` }
                        : { background: '#0c111d', borderColor: '#1e293b' }
                    }
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center border transition-all flex-shrink-0"
                        style={
                          isActive || isDone
                            ? { background: `${color}20`, borderColor: `${color}60`, color }
                            : { background: '#0f172a', borderColor: '#1e293b', color: '#475569' }
                        }
                      >
                        {isDone ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : s.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] font-black font-mono uppercase tracking-widest" style={isActive ? { color } : { color: '#475569' }}>
                          Paso {s.id} · {s.code}
                        </div>
                        <div className={`text-xs font-bold truncate ${isActive ? 'text-slate-100' : 'text-slate-500'}`}>
                          {s.title}
                        </div>
                      </div>
                    </div>
                    {/* Mini progress */}
                    <div className="h-0.5 bg-slate-900 rounded-full overflow-hidden ml-11">
                      <div className="h-full rounded-full transition-all duration-400" style={{ width: `${prog.pct}%`, background: color }} />
                    </div>
                    <div className="flex justify-between items-center mt-1 ml-11">
                      <span className="text-[9px] font-mono text-slate-600">{prog.done}/{prog.total} verificados</span>
                      <span className="text-[9px] font-mono" style={isActive ? { color } : { color: '#334155' }}>{s.duration}</span>
                    </div>
                  </button>
                );
              })}

              {/* Sidebar: Hemo Mode Button */}
              <div className="pt-3">
                <button
                  onClick={() => setHemoMode(true)}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl bg-red-950/30 border border-red-900/50 text-red-400 hover:bg-red-950/60 hover:border-red-800 transition-all duration-200 cursor-pointer group"
                >
                  <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-xs font-black font-mono uppercase tracking-wider">Modo Quirófano</span>
                  <svg className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </button>
              </div>

              {/* Sidebar: PDF Downloads */}
              <div className="pt-1">
                <div className="p-4 rounded-2xl border border-slate-900 bg-slate-950/40 space-y-2">
                  <p className="text-[9px] font-black font-mono text-slate-500 uppercase tracking-widest text-center">
                    Pósters del Protocolo
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <a
                      href="/protocols/zero-contrast/Protocolo_Zero_Contrast_OCT_OPSTAR_AI_Levante_A3_v3.pdf"
                      download
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-800 hover:border-cyan-500/40 bg-slate-900/60 hover:bg-cyan-950/20 text-slate-300 hover:text-cyan-400 text-[10px] font-bold font-mono transition-all"
                    >
                      <span>Póster Oficial A3</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                    <a
                      href="/protocols/zero-contrast/Protocolo_Zero_Contrast_OCT_OPSTAR_AI_Levante_A4_v3.pdf"
                      download
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-800 hover:border-cyan-500/40 bg-slate-900/60 hover:bg-cyan-950/20 text-slate-300 hover:text-cyan-400 text-[10px] font-bold font-mono transition-all"
                    >
                      <span>Póster de Bolsillo A4</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Sidebar: QR placeholder */}
              <div className="pt-1">
                <div className="p-4 rounded-2xl border border-slate-900 bg-slate-950/40 flex flex-col items-center gap-3 text-center">
                  <div className="w-20 h-20 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center relative overflow-hidden">
                    {/* QR visual placeholder */}
                    <svg viewBox="0 0 80 80" className="w-14 h-14 opacity-40">
                      <rect x="4" y="4" width="30" height="30" fill="none" stroke="#22d3ee" strokeWidth="4" rx="2"/>
                      <rect x="10" y="10" width="18" height="18" fill="#22d3ee" rx="1" opacity="0.6"/>
                      <rect x="46" y="4" width="30" height="30" fill="none" stroke="#22d3ee" strokeWidth="4" rx="2"/>
                      <rect x="52" y="10" width="18" height="18" fill="#22d3ee" rx="1" opacity="0.6"/>
                      <rect x="4" y="46" width="30" height="30" fill="none" stroke="#22d3ee" strokeWidth="4" rx="2"/>
                      <rect x="10" y="52" width="18" height="18" fill="#22d3ee" rx="1" opacity="0.6"/>
                      <rect x="46" y="46" width="8" height="8" fill="#22d3ee" opacity="0.5" rx="1"/>
                      <rect x="58" y="46" width="8" height="8" fill="#22d3ee" opacity="0.5" rx="1"/>
                      <rect x="46" y="58" width="8" height="8" fill="#22d3ee" opacity="0.5" rx="1"/>
                      <rect x="58" y="58" width="8" height="8" fill="#22d3ee" opacity="0.5" rx="1"/>
                      <rect x="70" y="58" width="6" height="6" fill="#22d3ee" opacity="0.3" rx="1"/>
                      <rect x="70" y="46" width="6" height="6" fill="#22d3ee" opacity="0.3" rx="1"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-[9px] font-black font-mono text-slate-500 uppercase tracking-wider">Código QR</p>
                    <p className="text-[8px] font-mono text-slate-700 mt-0.5">Acceso rápido en sala</p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <main className="flex-1 min-w-0 space-y-8">
            {/* ── ACTIVE STEP CARD ───────────────────────────────────────── */}
            <div className={`rounded-3xl border ${accent.border} ${accent.bg} ${accent.glow} overflow-hidden transition-all duration-300`}>
              {/* Step header */}
              <div className="p-6 md:p-8 border-b border-slate-800/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={`text-[10px] font-black font-mono tracking-[0.35em] uppercase ${accent.text} mb-2`}>
                      Paso {activeStep} / 4 — {currentStepData.code}
                    </div>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-55 font-mono tracking-tight">
                      {currentStepData.title}
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">{currentStepData.titleEn}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                      style={{ background: `${stepColors[activeStep]}15`, borderColor: `${stepColors[activeStep]}40`, color: stepColors[activeStep] }}
                    >
                      {currentStepData.icon}
                    </div>
                    <span className="text-[9px] font-mono font-bold text-slate-600">{currentStepData.duration}</span>
                  </div>
                </div>

                {/* Step progress */}
                <div className="mt-5">
                  <div className="flex justify-between text-[10px] font-mono mb-1.5">
                    <span className="text-slate-600">Progreso de Verificación</span>
                    <span className={accent.text}>{getStepProgress(activeStep).done}/{getStepProgress(activeStep).total}</span>
                  </div>
                  <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${getStepProgress(activeStep).pct}%`, background: stepColors[activeStep] }}
                    />
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div className="p-6 md:p-8 space-y-2.5">
                {currentStepData.checklist.map((item) => {
                  const key = `${activeStep}-${item.id}`;
                  return (
                    <CheckItem
                      key={item.id}
                      label={item.label}
                      sub={item.sub}
                      critical={item.critical}
                      checked={!!checkedItems[key]}
                      onToggle={() => toggleCheck(key)}
                    />
                  );
                })}

                {/* Clinical note */}
                <div className="mt-4 pt-4 border-t border-slate-800/60">
                  <div className="flex gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800/60">
                    <svg className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-[11px] font-mono text-slate-400 leading-relaxed">
                      <span className="text-slate-500 font-bold">NOTA: </span>
                      {currentStepData.notes}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step navigation footer */}
              <div className="px-6 md:px-8 pb-6 flex items-center justify-between gap-4">
                <button
                  onClick={() => setActiveStep(Math.max(1, activeStep - 1) as Step)}
                  disabled={activeStep === 1}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 text-xs font-bold font-mono hover:border-slate-700 hover:text-slate-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  ANTERIOR
                </button>
                <div className="flex gap-1">
                  {([1, 2, 3, 4] as Step[]).map((n) => (
                    <button
                      key={n}
                      onClick={() => setActiveStep(n)}
                      className="w-2 h-2 rounded-full transition-all duration-200 cursor-pointer"
                      style={
                        n === activeStep
                          ? { background: stepColors[activeStep], transform: 'scale(1.3)' }
                          : getStepProgress(n).pct === 100
                          ? { background: stepColors[n], opacity: 0.5 }
                          : { background: '#1e293b' }
                      }
                    />
                  ))}
                </div>
                <button
                  onClick={() => setActiveStep(Math.min(4, activeStep + 1) as Step)}
                  disabled={activeStep === 4}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold font-mono transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  style={
                    activeStep < 4
                      ? { borderColor: `${stepColors[activeStep]}50`, color: stepColors[activeStep], background: `${stepColors[activeStep]}10` }
                      : { borderColor: '#1e293b', color: '#475569' }
                  }
                >
                  SIGUIENTE
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ── VIDEO PLACEHOLDER ──────────────────────────────────────── */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/40 overflow-hidden">
              <div className="p-6 border-b border-slate-800/60 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-200 font-mono uppercase tracking-wider">Videos de Referencia</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Demostraciones del procedimiento (próximamente)</p>
                </div>
                <span className="text-[9px] font-black font-mono text-slate-600 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full uppercase tracking-widest">
                  Próximamente
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-6">
                {[
                  { title: 'Técnica de Inyección', duration: '1:42', tag: 'Inyección' },
                  { title: 'Pullback y Adquisición', duration: '2:15', tag: 'OCT' },
                  { title: 'Resolución de Problemas: Sangre Residual', duration: '0:58', tag: 'Consejos' },
                ].map((vid, i) => (
                  <div
                    key={i}
                    className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-3 overflow-hidden group"
                  >
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 to-slate-950" />
                    {/* Grid pattern */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(34,211,238,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.02)_1px,transparent_1px)] bg-[size:20px_20px]" />
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-cyan-950/60 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
                        <svg className="w-5 h-5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      </div>
                      <span className="text-[9px] font-mono text-slate-400 text-center px-3">{vid.title}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono text-slate-600">{vid.duration}</span>
                        <span className="text-[7px] font-black font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-600 uppercase">{vid.tag}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── TROUBLESHOOTING ────────────────────────────────────────── */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/30 overflow-hidden">
              <div className="p-6 md:p-8 border-b border-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-950/50 border border-amber-800/50 flex items-center justify-center text-amber-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">Problemas Comunes</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Problemas frecuentes y soluciones rápidas para sala</p>
                  </div>
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-3">
                {TROUBLESHOOTING.map((item) => (
                  <TroubleshootingCard key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* ── EVALUACIÓN DE CALIDAD ─────────────────────────────────────── */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/30 overflow-hidden">
              <div className="p-6 md:p-8 border-b border-slate-800/60">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-950/50 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">Evaluación de Calidad</h3>
                    <p className="text-[10px] text-slate-500 mt-0.5">Evalúa la calidad de la adquisición al final del procedimiento</p>
                  </div>
                </div>
              </div>
              <div className="p-6 md:p-8 space-y-5">
                {/* Wash quality */}
                <div>
                  <label className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest block mb-2">
                    Calidad de Aclarado (Lavado)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['excellent', 'adequate', 'suboptimal'] as const).map((v) => (
                      <QualityBadge
                        key={v}
                        value={v}
                        selected={quality.washQuality === v}
                        onSelect={() => setQuality((q) => ({ ...q, washQuality: v }))}
                      />
                    ))}
                  </div>
                </div>

                {/* Residual blood */}
                <div>
                  <label className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest block mb-2">
                    Sangre Residual
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['excellent', 'adequate', 'suboptimal'] as const).map((v) => (
                      <QualityBadge
                        key={v}
                        value={v}
                        selected={quality.residualBlood === v}
                        onSelect={() => setQuality((q) => ({ ...q, residualBlood: v }))}
                      />
                    ))}
                  </div>
                </div>

                {/* OCT image quality */}
                <div>
                  <label className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest block mb-2">
                    Calidad de Imagen OCT
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(['excellent', 'adequate', 'suboptimal'] as const).map((v) => (
                      <QualityBadge
                        key={v}
                        value={v}
                        selected={quality.octImageQuality === v}
                        onSelect={() => setQuality((q) => ({ ...q, octImageQuality: v }))}
                      />
                    ))}
                  </div>
                </div>

                {/* Additional contrast */}
                <div>
                  <label className="text-[10px] font-black font-mono text-slate-400 uppercase tracking-widest block mb-2">
                    ¿Se requirió contraste de rescate?
                  </label>
                  <div className="flex gap-2">
                    {[false, true].map((v) => (
                      <button
                        key={String(v)}
                        onClick={() => setQuality((q) => ({ ...q, additionalContrast: v }))}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-xs font-bold font-mono transition-all duration-200 cursor-pointer ${
                          quality.additionalContrast === v
                            ? v
                              ? 'border-amber-500/50 bg-amber-950/30 text-amber-400'
                              : 'border-emerald-500 bg-emerald-950/40 text-emerald-400'
                            : 'border-slate-800 bg-slate-950/60 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        {v ? '⚠ Sí — Requirió Contraste' : '✓ No — Zero-Contrast'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary badge */}
                {(quality.washQuality || quality.residualBlood || quality.octImageQuality || quality.additionalContrast !== null) && (
                  <div className="pt-4 border-t border-slate-800/60">
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                      <div className="text-[9px] font-black font-mono text-slate-550 uppercase tracking-widest mb-3">Resumen de la Evaluación</div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        {[
                          { label: 'Lavado', value: quality.washQuality },
                          { label: 'Sangre', value: quality.residualBlood },
                          { label: 'Imagen OCT', value: quality.octImageQuality },
                          { label: 'Contraste', value: quality.additionalContrast === false ? 'excellent' : quality.additionalContrast === true ? 'suboptimal' : null },
                        ].map((item) => {
                          const clsMap: Record<string, string> = {
                            excellent: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50',
                            adequate: 'text-yellow-400 bg-yellow-950/30 border-yellow-800/40',
                            suboptimal: 'text-red-400 bg-red-950/30 border-red-800/40',
                          };
                          const valTextMap: Record<string, string> = {
                            excellent: 'Excelente',
                            adequate: 'Aceptable',
                            suboptimal: 'Subóptimo',
                          };
                          return (
                            <div key={item.label} className={`p-2 rounded-xl border ${item.value ? clsMap[item.value] : 'bg-slate-900 border-slate-800 text-slate-600'}`}>
                              <div className="text-[8px] font-mono font-bold mb-1 opacity-70 uppercase">{item.label}</div>
                              <div className="text-xs font-black capitalize">
                                {item.value ? (valTextMap[item.value] ?? item.value) : '—'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── METAS DEL REGISTRO Y BANNER CLÍNICO ─────────────────────── */}
            <div className="rounded-3xl border border-cyan-500/20 bg-slate-900/40 p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-950/60 border border-cyan-800/60 flex items-center justify-center text-cyan-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono uppercase tracking-wider">Metas del Registro OPSTAR-AI</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Objetivo clínico principal y documentación obligatoria en el eCRF</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-350 leading-relaxed font-sans pt-2">
                <div className="space-y-2">
                  <p>
                    <span className="text-cyan-400 font-bold">Prevención de la Nefropatía por Contraste (NIC):</span> El objetivo principal de este protocolo es demostrar la viabilidad de la adquisición de OCT intracoronaria utilizando exclusivamente <span className="text-cyan-300 font-semibold">0 mL de medio de contraste yodado</span>. Esto es especialmente crítico en pacientes con insuficiencia renal severa (TFG &lt; 30 mL/min/1.73m²), donde el contraste convencional puede acelerar la necesidad de terapia de reemplazo renal.
                  </p>
                </div>
                <div className="space-y-2">
                  <p>
                    <span className="text-cyan-400 font-bold">Requisitos de Documentación:</span> Todos los operadores deben documentar de forma estricta los volúmenes de contraste utilizados (meta de 0 mL), los hallazgos de aposición del stent mediante la IA de <span className="text-cyan-300 font-semibold">ULTREON™ 3.0</span> y el grado de aclarado del vaso. Esta información es obligatoria para el cálculo automático de la métrica de optimización procedural en la sección del eCRF del registro.
                  </p>
                </div>
              </div>
            </div>

            {/* ── FOOTER CTA ─────────────────────────────────────────────── */}
            <div className="rounded-3xl border border-slate-800/60 bg-gradient-to-br from-slate-900 to-slate-950 p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div>
                <p className="text-[9px] font-mono font-black text-slate-600 uppercase tracking-widest mb-1">Siguiente paso</p>
                <h4 className="text-sm font-bold text-slate-200">Registrar caso en eCRF OPSTAR-AI</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Documenta los hallazgos OCT y el Score de Optimización</p>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <Link
                  href="/registry/new"
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-[0_0_20px_rgba(34,211,238,0.25)] cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo Caso eCRF
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 font-bold text-xs transition-all cursor-pointer"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* ── FLOATING QUICK ACCESS BUTTON ─────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <button
          onClick={() => setHemoMode(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-950/80 border border-red-800/60 text-red-400 text-xs font-black font-mono uppercase tracking-wider backdrop-blur-xl shadow-xl hover:bg-red-950 transition-all duration-200 cursor-pointer"
          title="Activar Hemo Mode — pantalla completa optimizada"
        >
          <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          <span className="hidden sm:inline">Modo Quirófano</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>
    </>
  );
}
