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
  // Predefined list of beautiful gradient combinations for UI
  const colorGradients = [
    'from-cyan-500 to-blue-600',
    'from-blue-600 to-indigo-600',
    'from-cyan-500 to-teal-500',
    'from-indigo-600 to-purple-600',
    'from-teal-500 to-emerald-500',
    'from-cyan-600 to-blue-700',
  ];

  const centers = hospitals.map((h, i) => ({
    name: h.name,
    role: h.code === 'HOSP-SANJUAN' ? 'Centro Coordinador y Promotor' : 'Centro Participante',
    city: h.city || 'Levante',
    investigators: h.investigators.map(inv => 
      `${inv.full_name}${inv.is_principal_investigator ? ' (IP)' : ''}`
    ),
    cases: `${h.cases} ${h.cases === 1 ? 'caso' : 'casos'} registrado(s)`,
    color: colorGradients[i % colorGradients.length],
  }));

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased font-sans">
      
      {/* Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black text-xs">
            A
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">ULTREON™ 3.0</span>
              <span className="text-[8px] font-mono font-bold text-slate-500 uppercase">IDENTIDAD CIENTÍFICA</span>
            </div>
            <h1 className="text-base font-bold text-slate-50">Sobre el Registro OPSTAR-AI</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-200">{profile.fullName}</p>
            <p className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              {profile.role === 'admin' ? 'Administrador' : profile.role === 'monitor' ? 'Monitor' : 'Investigador'} {profile.role === 'hospital_user' && `· ${profile.hospitalName}`}
            </p>
          </div>
          <div className="h-8 w-[1px] bg-slate-800" />
          <Link
            href="/dashboard"
            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-medium transition-all"
          >
            Volver al Panel
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 p-6 md:p-8 max-w-[1400px] w-full mx-auto space-y-8">
        
        {/* ── HERO BRANDING SECTION ── */}
        <div className="relative bg-slate-900 border border-slate-850 rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/35 to-transparent" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-4">
              <span className="text-[10px] font-black font-mono tracking-[0.3em] text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800/40 uppercase inline-block">
                Iniciativa Multicéntrica OPSTAR-AI Levante
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-slate-50 tracking-tight leading-none">
                Revolucionando la Optimización Coronaria
              </h2>
              <p className="text-sm md:text-base text-slate-300 font-light leading-relaxed max-w-3xl">
                OPSTAR-AI Levante Registry es una red científica integrada por los principales laboratorios de hemodinámica de la Comunidad Valenciana. Nuestro objetivo principal es investigar y documentar la eficacia del software de guiado de precisión por Tomografía de Coherencia Óptica (OCT) acoplado a algoritmos de inteligencia artificial, junto a flujos estructurados de contraste mínimo (Zero-Contrast) para mejorar el pronóstico cardiovascular y reducir la nefropatía inducida por contraste.
              </p>
            </div>

            {/* Interactive Network / Connectivity Graphic */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative w-64 h-64 bg-slate-950/50 border border-slate-800 rounded-full p-4 flex items-center justify-center shadow-inner group">
                <div className="absolute inset-0 bg-cyan-500/5 rounded-full blur-md group-hover:bg-cyan-500/10 transition-all" />
                
                {/* SVG Connecting Map */}
                <svg className="w-full h-full text-cyan-500/30" viewBox="0 0 100 100">
                  {/* Connection lines */}
                  <line x1="50" y1="50" x2="25" y2="25" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" className="animate-pulse" />
                  <line x1="50" y1="50" x2="75" y2="25" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
                  <line x1="50" y1="50" x2="15" y2="60" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
                  <line x1="50" y1="50" x2="85" y2="60" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
                  <line x1="50" y1="50" x2="50" y2="85" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2" />
                  
                  {/* Central Node (Valencia Coordinator) */}
                  <circle cx="50" cy="50" r="6" fill="#06b6d4" className="animate-ping opacity-75" />
                  <circle cx="50" cy="50" r="4.5" fill="#0891b2" />
                  
                  {/* Satellite Nodes */}
                  <circle cx="25" cy="25" r="3" fill="#3b82f6" />
                  <circle cx="75" cy="25" r="3" fill="#3b82f6" />
                  <circle cx="15" cy="60" r="3" fill="#14b8a6" />
                  <circle cx="85" cy="60" r="3" fill="#14b8a6" />
                  <circle cx="50" cy="85" r="3" fill="#6366f1" />
                  
                  {/* Labels on SVG */}
                  <text x="50" y="42" textAnchor="middle" fill="#22d3ee" fontSize="5" fontWeight="bold" className="font-mono">VLC</text>
                  <text x="25" y="19" textAnchor="middle" fill="#64748b" fontSize="4" className="font-mono">CST</text>
                  <text x="75" y="19" textAnchor="middle" fill="#64748b" fontSize="4" className="font-mono">FE</text>
                  <text x="12" y="68" textAnchor="middle" fill="#64748b" fontSize="4" className="font-mono">ALC</text>
                  <text x="88" y="68" textAnchor="middle" fill="#64748b" fontSize="4" className="font-mono">ELC</text>
                  <text x="50" y="93" textAnchor="middle" fill="#64748b" fontSize="4" className="font-mono">PESET</text>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ── SCIENTIFIC DIRECTORY (PARTICIPATING HOSPITALS) ── */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
            <div>
              <h3 className="text-lg font-black text-slate-50 tracking-tight">Directorio Científico de Centros y PIs</h3>
              <p className="text-xs text-slate-400">Centros investigadores activos en el reclutamiento y seguimiento longitudinal.</p>
            </div>
            <span className="px-3 py-1 bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono font-bold rounded-lg">
              Total: {hospitals.length} Centros Activos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {centers.map((center, index) => (
              <div
                key={index}
                className="bg-slate-900 border border-slate-850 hover:border-cyan-500/30 rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 w-2 h-full bg-gradient-to-b ${center.color}`} />
                
                <div className="space-y-4 pl-3">
                  <div>
                    <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-wider block">
                      {center.role}
                    </span>
                    <h4 className="text-sm font-bold text-slate-100 mt-1 leading-tight group-hover:text-cyan-400 transition-colors">
                      {center.name}
                    </h4>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[8px] font-mono font-bold text-slate-500 uppercase">Investigadores</span>
                    <ul className="text-xs space-y-1 text-slate-300">
                      {center.investigators.map((inv, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <span className="text-cyan-500 text-[10px]">🩺</span>
                          {inv}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-850 pl-3 flex justify-between items-center text-[10px] font-mono">
                  <span className="text-slate-500 uppercase">Sede: {center.city}</span>
                  <span className="px-2 py-0.5 bg-cyan-950/40 text-cyan-400 border border-cyan-800/35 rounded-full font-bold">
                    {center.cases}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── STEERING COMMITTEE & GOVERNANCE ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 space-y-6">
            <h3 className="text-lg font-black text-slate-50 tracking-tight">Comité de Coordinación y Gobernanza Científica</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs leading-relaxed">
              <div className="space-y-2">
                <h4 className="font-bold text-cyan-400 font-mono text-[11px] uppercase tracking-wider">Comité Científico Ejecutor</h4>
                <p className="text-slate-300">
                  Presidido por el <span className="font-semibold text-slate-200">Dr. Alberto Pérez</span> (Hospital Clínico), encargado de auditar y autorizar los protocolos de optimización por OCT y la coherencia en las puntuaciones OPSTAR de cada centro participante.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-cyan-400 font-mono text-[11px] uppercase tracking-wider">Core Lab y Gestión de Datos</h4>
                <p className="text-slate-300">
                  La adjudicación y centralización de imágenes OCT se realiza de forma ciega en el <span className="font-semibold text-slate-200">Levante Cardiovascular Core Lab</span>, garantizando que no existan discrepancias inter-observador en la categorización del calcio o landing zones.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-cyan-400 font-mono text-[11px] uppercase tracking-wider">Cumplimiento Ético</h4>
                <p className="text-slate-300">
                  Aprobado por el <span className="font-semibold text-slate-200">Comité de Ética de la Investigación con Medicamentos (CEIm)</span> autonómico. Cumple con la Declaración de Helsinki, directrices ICH GCP y regulaciones de protección de datos (LOPDGDD/RGPD).
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-cyan-400 font-mono text-[11px] uppercase tracking-wider">Estándares de Outcomes (ARC-2)</h4>
                <p className="text-slate-300">
                  Todos los eventos clínicos de seguimiento (MACE, tipos de infarto y trombosis de stent) siguen rigurosamente los consensos definidos por el <span className="font-semibold text-slate-200">Academic Research Consortium (ARC-2)</span>.
                </p>
              </div>
            </div>
          </div>

          {/* Platforms stats card */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8 flex flex-col justify-between space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-100">Arquitectura de la Plataforma</h3>
              <p className="text-xs text-slate-400 mt-1">Detalles de infraestructura y cumplimiento científico de datos.</p>
            </div>

            <div className="space-y-3 font-mono text-[10px] text-slate-300">
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span className="text-slate-500 uppercase">Hosting de Datos:</span>
                <span className="font-bold text-slate-200">Supabase (SSL + TDE)</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span className="text-slate-500 uppercase">Pseudonimización:</span>
                <span className="font-bold text-slate-200">Algoritmo SHA-256</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span className="text-slate-500 uppercase">Trazabilidad de Firma:</span>
                <span className="font-bold text-slate-200">Audit Trail Append-only</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-850">
                <span className="text-slate-500 uppercase">Cumplimiento:</span>
                <span className="font-bold text-cyan-400">FDA 21 CFR Part 11</span>
              </div>
            </div>

            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-center">
              <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest block">Licencia Científica</span>
              <span className="text-xs font-bold text-slate-300 mt-1 block">OPSTAR Levante Research Group</span>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
