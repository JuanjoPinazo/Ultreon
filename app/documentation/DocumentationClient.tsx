'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface DocumentationClientProps {
  profile: {
    fullName: string;
    role: string;
    hospitalId: string | null;
    hospitalName: string;
  };
  hospitals: { id: string; name: string }[];
}

export default function DocumentationClient({
  profile,
  hospitals,
}: DocumentationClientProps) {
  const [activeTab, setActiveTab] = useState('dossier');
  const [selectedHospital, setSelectedHospital] = useState(
    profile.hospitalId || (hospitals.length > 0 ? hospitals[0].id : '')
  );

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col antialiased font-sans transition-colors">
      {/* Header Bar */}
      <header className="bg-card border-b border-border p-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xs hover:opacity-90 transition-opacity">
            A
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/40 uppercase">
                Biblioteca
              </span>
            </div>
            <h1 className="text-base font-bold text-foreground">Documentación</h1>
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
      <div className="flex-1 p-6 md:p-8 max-w-[1200px] w-full mx-auto space-y-6">
        
        {/* Title */}
        <div className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            Documentación y Guías del Registro
          </h2>
          <p className="text-sm text-muted-foreground font-light max-w-3xl leading-relaxed">
            Acceso centralizado a los dosieres por centro, eCRF en formato físico y la guía estructurada para el investigador principal.
          </p>
        </div>

        {/* Tabs Navigation */}
        <div className="flex gap-2 p-1 bg-slate-200 dark:bg-slate-800/50 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('dossier')}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'dossier'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Dossier del Centro
          </button>
          <button
            onClick={() => setActiveTab('ecrf')}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'ecrf'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            eCRF Imprimible
          </button>
          <button
            onClick={() => setActiveTab('guia')}
            className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'guia'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Guía del Investigador
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-card border border-border rounded-3xl p-8 min-h-[400px] shadow-sm dark:shadow-none transition-colors">
          
          {activeTab === 'dossier' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">Dossier de Auditoría del Centro</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                    Dossier del Centro con métricas del Registro y códigos pseudoanónimos. La correspondencia entre código del Registro y NHC/SIP permanece exclusivamente bajo custodia local del centro y no se almacena en la plataforma central.
                  </p>
                </div>
                {profile.role === 'admin' && hospitals.length > 0 && (
                  <select
                    value={selectedHospital}
                    onChange={(e) => setSelectedHospital(e.target.value)}
                    className="px-3 py-2.5 rounded-xl bg-background border border-border focus:border-cyan-500/50 text-xs text-muted-foreground outline-none cursor-pointer w-48"
                  >
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="p-6 bg-background/50 border border-border rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xl mb-2">
                  🔒
                </div>
                <h4 className="text-md font-bold text-foreground">Dossier en construcción</h4>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Esta funcionalidad de generación de dossier automático se activará próximamente.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'ecrf' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">eCRF Imprimible (Versión Papel)</h3>
                <p className="text-sm text-muted-foreground">
                  Documento estandarizado para la recogida de datos intra-sala antes de su volcado digital.
                </p>
              </div>
              <div className="p-6 bg-background/50 border border-border rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xl mb-2">
                  📄
                </div>
                <h4 className="text-md font-bold text-foreground">Documento en preparación</h4>
                <p className="text-sm text-muted-foreground max-w-sm">
                  El PDF del eCRF estructurado está siendo formateado para asegurar su legibilidad en formato impreso y su total concordancia con el portal.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'guia' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-foreground">Guía del Investigador</h3>
                <p className="text-sm text-muted-foreground">
                  Instrucciones detalladas sobre los criterios de inclusión, exclusión, y uso de la plataforma ULTREON 3.0.
                </p>
              </div>
              <div className="p-6 bg-background/50 border border-border rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
                <div className="h-12 w-12 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xl mb-2">
                  📘
                </div>
                <h4 className="text-md font-bold text-foreground">Manual Clínico Pendiente</h4>
                <p className="text-sm text-muted-foreground max-w-sm">
                  La última versión del protocolo clínico y guía del investigador está en revisión final por el Comité Ético (CEIm).
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
