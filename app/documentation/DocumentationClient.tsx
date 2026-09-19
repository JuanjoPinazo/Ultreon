'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PrintableDossier from './components/PrintableDossier';
import PrintableECRF from './components/PrintableECRF';
import PrintableLocalSheet from './components/PrintableLocalSheet';
import PrintableInclusionsControl from './components/PrintableInclusionsControl';
import PrintableOperatorProfile from './components/PrintableOperatorProfile';
import ScientificTraceability from './components/ScientificTraceability';
import PrintFooter from './components/PrintFooter';

interface HospitalData {
  id: string;
  name: string;
  phase?: string;
  prefix?: string;
  operators?: string[];
  target?: {
    target_total: number;
    target_monthly: number | null;
    target_weekly?: number | null;
    start_date: string;
    end_date: string | null;
    status?: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  } | null;
}

interface DocumentationClientProps {
  profile: {
    fullName: string;
    role: string;
    hospitalId: string | null;
    hospitalName: string;
  };
  hospitals: HospitalData[];
}

export default function DocumentationClient({
  profile,
  hospitals,
}: DocumentationClientProps) {
  const [activeTab, setActiveTab] = useState('dossier');
  const [selectedHospital, setSelectedHospital] = useState(
    profile.hospitalId || (hospitals.length > 0 ? hospitals[0].id : '')
  );

  const activeHospitalData = hospitals.find(h => h.id === selectedHospital) || null;

  const handlePrint = (docType: string) => {
    setActiveTab(docType);
    
    // Set document title for PDF saving
    const originalTitle = document.title;
    const prefix = activeHospitalData?.prefix || 'XX';
    
    const titleMap: Record<string, string> = {
      'dossier': `ULTREON_SitePack_${prefix}_v1.0`,
      'ecrf': `ULTREON_eCRF_v3.0`,
      'operator_profile': `ULTREON_PerfilOperadores_${prefix}`,
      'inclusions': `ULTREON_ControlInclusiones_${prefix}`,
      'signatures': `ULTREON_Firmas_${prefix}`,
      'training': `ULTREON_Formacion_${prefix}`,
      'checklist': `ULTREON_Checklist_${prefix}`,
      'incidents': `ULTREON_Incidencias_${prefix}`,
      'local_sheet': `ULTREON_HojaLocal_${prefix}`
    };
    
    document.title = titleMap[docType] || `ULTREON_Document_${prefix}`;

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = originalTitle;
      }, 1000);
    }, 100);
  };

  const docs = [
    { id: 'dossier', title: 'Dossier Completo', desc: 'Paquete de inicio del centro', icon: '📁' },
    { id: 'ecrf', title: 'eCRF Imprimible', desc: 'Esquema clínico intra-sala', icon: '📝' },
    { id: 'operator_profile', title: 'Ficha Basal Operadores', desc: 'Perfil basal del operador', icon: '👨‍⚕️' },
    { id: 'inclusions', title: 'Control Inclusiones', desc: 'Tabla 20 filas/página', icon: '📋' },
    { id: 'signatures', title: 'Firmas y Funciones', desc: 'Roles y delegación', icon: '✍️' },
    { id: 'training', title: 'Formación', desc: 'Registro de formación', icon: '🎓' },
    { id: 'checklist', title: 'Checklist Inicio', desc: 'Site Initiation', icon: '✅' },
    { id: 'incidents', title: 'Incidencias', desc: 'Registro de desviaciones', icon: '⚠️' },
    { id: 'local_sheet', title: 'Hoja Local Correspondencia', desc: 'NHC/SIP (Uso interno)', icon: '🔒' },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col antialiased font-sans transition-colors">
      <header className="bg-card border-b border-border p-4 md:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 transition-colors no-print">
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

      <div className="flex-1 p-6 md:p-8 max-w-[1200px] w-full mx-auto space-y-6">
        
        <div className="space-y-2 no-print">
          <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            Documentación y Guías del Registro
          </h2>
          <p className="text-sm text-muted-foreground font-light max-w-3xl leading-relaxed">
            Acceso centralizado a los dosieres por centro, eCRF en formato físico y la guía estructurada para el investigador principal.
          </p>
        </div>

        {profile.role === 'admin' && hospitals.length > 0 && (
          <div className="no-print bg-card p-4 border border-border rounded-xl flex items-center gap-4">
            <span className="text-sm font-semibold">Seleccionar Hospital:</span>
            <select
              value={selectedHospital}
              onChange={(e) => setSelectedHospital(e.target.value)}
              className="px-3 py-2 rounded-xl bg-background border border-border focus:border-primary/50 text-sm text-foreground outline-none cursor-pointer w-64"
            >
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
          {docs.map(doc => (
            <div key={doc.id} className={`bg-card border rounded-2xl p-4 flex flex-col justify-between transition-all shadow-sm ${activeTab === doc.id ? 'border-primary ring-1 ring-primary/20' : 'border-border hover:border-primary/50'}`}>
              <div>
                <div className="text-2xl mb-2">{doc.icon}</div>
                <h3 className="font-bold text-foreground text-sm">{doc.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{doc.desc}</p>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => setActiveTab(doc.id)}
                  className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === doc.id ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  Vista previa
                </button>
                <button
                  onClick={() => handlePrint(doc.id)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Imprimir / PDF
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="bg-card border border-border rounded-3xl p-8 min-h-[400px] shadow-sm dark:shadow-none transition-colors">
          <div className="bg-white text-black p-4 md:p-8 rounded-lg shadow-inner overflow-hidden border border-slate-200 print:shadow-none print:border-none print:p-0">
            {activeTab === 'dossier' && <PrintableDossier hospital={activeHospitalData} />}
            {activeTab === 'ecrf' && <PrintableECRF />}
            {activeTab === 'operator_profile' && <PrintableOperatorProfile hospital={activeHospitalData} />}
            {activeTab === 'inclusions' && <PrintableInclusionsControl hospital={activeHospitalData} />}
            {activeTab === 'local_sheet' && <PrintableLocalSheet />}
            
            {/* The rest of the tabs will map to specific pages within PrintableDossier components, or we can make them standalone. The user requested them as separate cards but they are also part of the dossier. Let's make them standalone components where needed, or just tell them it's part of the dossier. Actually, let's create components for them so they can be previewed separately. For now, I'll put placeholders for the new ones, which we will build shortly. */}
            {(['signatures', 'training', 'checklist', 'incidents'].includes(activeTab)) && (
              <div className="p-8 text-center border-2 border-dashed border-slate-300 rounded-xl">
                <p>Componente individual en construcción. Se incluirá en el Dossier Completo.</p>
              </div>
            )}
          </div>
        </div>

      </div>
      <PrintFooter hospitalName={activeHospitalData?.name} />
    </main>
  );
}
