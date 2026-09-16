'use client';

import React from 'react';
import Link from 'next/link';
import { 
  formatClinicalLabel, 
  formatClinicalValue, 
  isModuleEmpty, 
  MODULE_NAMES 
} from '@/lib/registry/display-labels';

interface CaseDetailProps {
  record: any;
  profileRole: string;
}

export default function CaseDetailClient({ record, profileRole }: CaseDetailProps) {
  const isDraft = record.status === 'DRAFT';
  const isDemo = record.is_demo;

  // Render a simple key-value row
  const renderRow = (key: string, value: any) => {
    if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return null;
    
    return (
      <div key={key} className="flex flex-col py-2 border-b border-border/50 last:border-0">
        <span className="text-[10px] font-bold text-muted-foreground uppercase">{formatClinicalLabel(key)}</span>
        <span className="mt-0.5 text-sm font-medium text-foreground">{formatClinicalValue(value)}</span>
      </div>
    );
  };

  // Render standard module
  const renderModule = (title: string, data: any) => {
    if (isModuleEmpty(data)) return null;

    return (
      <div className="bg-surface border border-border rounded-xl mb-6 shadow-sm overflow-hidden">
        <div className="bg-surface-secondary border-b border-border px-6 py-3">
          <h3 className="text-sm font-bold text-foreground">{title}</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          {Object.entries(data).map(([key, value]) => {
            if (key === 'post_pci_data' || key === 'pullbacks') return null;
            return renderRow(key, value);
          })}
        </div>
      </div>
    );
  };

  // Render pullbacks
  const renderPullbacks = (data: any) => {
    if (!data?.pullbacks || !Array.isArray(data.pullbacks) || data.pullbacks.length === 0) return null;

    return (
      <div className="bg-surface border border-border rounded-xl mb-6 shadow-sm overflow-hidden">
        <div className="bg-surface-secondary border-b border-border px-6 py-3">
          <h3 className="text-sm font-bold text-foreground">Adquisiciones OCT</h3>
        </div>
        <div className="p-6 space-y-6">
          {data.pullbacks.map((pullback: any, index: number) => (
            <div key={index} className="bg-surface-secondary/50 border border-border rounded-lg p-5">
              <h4 className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Adquisición {index + 1}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                {Object.entries(pullback).map(([k, v]) => {
                  if (k === 'id') return null;
                  return renderRow(k, v);
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render post PCI
  const renderPostPCI = (data: any) => {
    const postData = data?.post_pci_data;
    if (isModuleEmpty(postData)) return null;

    return (
      <div className="bg-surface border border-border rounded-xl mb-6 shadow-sm overflow-hidden">
        <div className="bg-surface-secondary border-b border-border px-6 py-3">
          <h3 className="text-sm font-bold text-foreground">Optimización Post-PCI</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
          {Object.entries(postData).map(([key, value]) => renderRow(key, value))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border p-6 md:px-8">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-black text-foreground tracking-tight font-mono">
                {record.anonymous_code}
              </h1>
              {isDemo && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-400 text-[10px] rounded uppercase font-bold tracking-wider">
                  DEMO
                </span>
              )}
              <span className={`px-2 py-1 text-[10px] rounded uppercase font-bold tracking-wider border ${isDraft ? 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800/50' : 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800/50'}`}>
                {isDraft ? 'BORRADOR' : 'COMPLETADO'}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              <span className="text-foreground">{record.hospitals?.name}</span> — Operador: <span className="text-foreground">{record.operators?.full_name}</span> — Fecha: <span className="text-foreground">{new Date(record.procedure_date).toLocaleDateString()}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/follow-up"
              className="px-4 py-2 bg-secondary text-secondary-foreground hover:bg-slate-200 dark:hover:bg-slate-800 border border-border font-bold rounded-xl text-xs transition-colors"
            >
              Volver
            </Link>
            {isDraft && (
              <Link
                href={`/registry/new?caseId=${record.id}`}
                className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-xl text-xs transition-colors"
              >
                Editar Caso
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto p-6 md:p-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          
          {/* Columna Izquierda: Workflow Principal (60%) */}
          <div className="xl:col-span-7 space-y-2">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 ml-1">Ficha Clínica Principal</h2>
            
            {renderModule('1. Datos del Caso', record.core_data)}
            
            {renderPullbacks(record.acquisition_data)}
            
            {renderModule('3. Hallazgos OCT', record.findings_data)}
            
            {renderPostPCI(record.findings_data)}
          </div>
          
          {/* Columna Derecha: Módulos y Valoración (40%) */}
          <div className="xl:col-span-5 space-y-2">
            <h2 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4 ml-1">Módulos Dinámicos y Cierre</h2>
            
            {renderModule(MODULE_NAMES.calcium_module, record.calcium_module)}
            {renderModule(MODULE_NAMES.lipid_module, record.lipid_module)}
            {renderModule(MODULE_NAMES.left_main_module, record.left_main_module)}
            {renderModule(MODULE_NAMES.ffr_oct_module, record.ffr_oct_module)}
            
            {renderModule('Valoración Global', record.global_assessment)}
          </div>
          
        </div>
      </div>
    </div>
  );
}
