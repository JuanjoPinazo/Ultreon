'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';

interface ExportClientProps {
  caseId: string;
  caseData: {
    id_paciente: string;
    centro: string;
    vaso_diana: string;
    created_at: string;
    calcio_ia: boolean | null;
    placa_lipida_ia: boolean | null;
    ffr_oct: number | null;
    expected_contrast_ml: number | null;
    actual_contrast_ml: number | null;
    zero_contrast_completed: boolean | null;
  };
  strategyChanges: any;
  optimization: any;
  followups: Array<{
    followup_type: string;
    followup_date: string;
    mace: boolean;
  }>;
  keyImages: Array<{
    id: string;
    file_name: string;
    media_category: string;
    acquisition_phase: string;
  }>;
}

export default function ExportClient({
  caseId,
  caseData,
  strategyChanges,
  optimization,
  followups,
  keyImages,
}: ExportClientProps) {
  const [isPending, startTransition] = useTransition();
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handleDownloadPDF = () => {
    setDownloadError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/cases/${caseId}/export/pdf`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `congress-summary-${caseId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (err: any) {
        console.error('Download error:', err);
        setDownloadError(err.message || 'Error descargando PDF');
      }
    });
  };

  const contrastReduction = caseData.expected_contrast_ml && caseData.actual_contrast_ml
    ? (((caseData.expected_contrast_ml - caseData.actual_contrast_ml) / caseData.expected_contrast_ml) * 100).toFixed(1)
    : null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 md:p-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <Link
              href={`/cases/${caseId}`}
              className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold mb-2 inline-block"
            >
              ← Volver al caso
            </Link>
            <h1 className="text-base font-bold text-slate-50">
              Congress Summary Export
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Genera un resumen científico anonimizado para presentación en congresos
            </p>
          </div>

          <button
            onClick={handleDownloadPDF}
            disabled={isPending}
            className="flex items-center gap-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {isPending ? 'Generando...' : '📥 Descargar PDF'}
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="space-y-8">
          {/* Error message */}
          {downloadError && (
            <div className="p-4 rounded-2xl bg-red-950/40 border border-red-800/40 text-red-300 text-sm">
              Error: {downloadError}
            </div>
          )}

          {/* Preview */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8">
            <div>
              <span className="text-[9px] font-black font-mono tracking-[0.35em] text-cyan-400 uppercase">
                Vista Previa
              </span>
              <h2 className="text-2xl font-bold text-slate-50 mt-2">
                OPSTAR-AI Levante Registry
              </h2>
              <p className="text-lg font-semibold text-slate-300">Congress Case Summary</p>
            </div>

            <div className="border-t border-slate-800 pt-8 space-y-8">
              {/* Case Overview */}
              <section>
                <h3 className="text-sm font-bold text-slate-50 uppercase mb-4">Case Overview</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Center</p>
                    <p className="text-sm font-semibold text-slate-200">{caseData.centro}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Vessel/Segment</p>
                    <p className="text-sm font-semibold text-slate-200">{caseData.vaso_diana || 'Not specified'}</p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Procedure Date</p>
                    <p className="text-sm font-semibold text-slate-200">
                      {new Date(caseData.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Zero-Contrast Protocol</p>
                    <p className={`text-sm font-semibold ${caseData.zero_contrast_completed ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {caseData.zero_contrast_completed ? '✓ Completed' : '✗ Not completed'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Pre-PCI Assessment */}
              <section>
                <h3 className="text-sm font-bold text-slate-50 uppercase mb-4">Pre-PCI Assessment</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {caseData.ffr_oct !== null && (
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">FFR-OCT</p>
                      <p className="text-sm font-semibold text-slate-200">{caseData.ffr_oct.toFixed(2)}</p>
                    </div>
                  )}
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Severe Calcium</p>
                    <p className="text-sm font-semibold text-slate-200">
                      {caseData.calcio_ia ? 'Yes' : caseData.calcio_ia === false ? 'No' : 'Not assessed'}
                    </p>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                    <p className="text-xs text-slate-500 mb-1">Lipid Plaque</p>
                    <p className="text-sm font-semibold text-slate-200">
                      {caseData.placa_lipida_ia ? 'Yes' : caseData.placa_lipida_ia === false ? 'No' : 'Not assessed'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Strategy Modification */}
              {strategyChanges && (
                <section>
                  <h3 className="text-sm font-bold text-slate-50 uppercase mb-4">Strategy Modification</h3>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-slate-500">Modified by ULTREON™:</span>
                        <span className="ml-2 font-semibold text-slate-200">
                          {strategyChanges.cambio_estrategia ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {strategyChanges.change_magnitude && (
                        <div>
                          <span className="text-slate-500">Magnitude:</span>
                          <span className="ml-2 font-semibold text-slate-200">{strategyChanges.change_magnitude}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              )}

              {/* Post-PCI Optimization */}
              {optimization && (
                <section>
                  <h3 className="text-sm font-bold text-slate-50 uppercase mb-4">Post-PCI Optimization (Tríada ULTREON™)</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {optimization.msa !== undefined && (
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                        <p className="text-xs text-slate-500 mb-1">Minimum Stent Area (mm²)</p>
                        <p className="text-sm font-semibold text-slate-200">{optimization.msa.toFixed(2)}</p>
                      </div>
                    )}
                    {optimization.stent_expansion_percent !== undefined && (
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                        <p className="text-xs text-slate-500 mb-1">Stent Expansion (%)</p>
                        <p className="text-sm font-semibold text-slate-200">{optimization.stent_expansion_percent.toFixed(1)}</p>
                      </div>
                    )}
                    {optimization.opstar_score !== undefined && (
                      <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                        <p className="text-xs text-slate-500 mb-1">OPSTAR Score</p>
                        <p className="text-sm font-semibold text-cyan-400">{optimization.opstar_score.toFixed(1)}/100</p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Contrast Metrics */}
              {contrastReduction && (
                <section>
                  <h3 className="text-sm font-bold text-slate-50 uppercase mb-4">Contrast Utilization</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">Expected (mL)</p>
                      <p className="text-sm font-semibold text-slate-200">{caseData.expected_contrast_ml?.toFixed(1)}</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">Actual Used (mL)</p>
                      <p className="text-sm font-semibold text-slate-200">{caseData.actual_contrast_ml?.toFixed(1)}</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                      <p className="text-xs text-slate-500 mb-1">Reduction (%)</p>
                      <p className="text-sm font-semibold text-emerald-400">{contrastReduction}%</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Follow-up */}
              {followups.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-slate-50 uppercase mb-4">Clinical Follow-up</h3>
                  <div className="space-y-2">
                    {followups.map((fu, idx) => (
                      <div key={idx} className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex justify-between items-center">
                        <span className="text-sm text-slate-300">{fu.followup_type}</span>
                        <span className={`text-sm font-semibold ${fu.mace ? 'text-red-400' : 'text-emerald-400'}`}>
                          {fu.mace ? '⚠ MACE' : '✓ No MACE'}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Key Images */}
              {keyImages.length > 0 && (
                <section>
                  <h3 className="text-sm font-bold text-slate-50 uppercase mb-4">Key Images</h3>
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-4">
                    <p className="text-xs text-slate-400 italic">
                      ✓ {keyImages.length} key image{keyImages.length !== 1 ? 's' : ''} available in clinical platform
                    </p>
                  </div>
                </section>
              )}

              {/* Disclaimer */}
              <div className="border-t border-slate-800 pt-6">
                <p className="text-xs text-slate-500 italic text-center">
                  Anonymized scientific summary for congress presentation. All clinical decisions remain under the responsibility of the interventional cardiologist. Data generated from OPSTAR-AI Levante Registry.
                </p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-cyan-400">
              ℹ Anonimización y Privacidad
            </h3>
            <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
              <li>Nombre del paciente: NO incluido</li>
              <li>NHC / SIP: NO incluido</li>
              <li>Datos personales: NO incluidos</li>
              <li>Case ID: Pseudonimizado (OPSTAR-XXXX-XXXX)</li>
              <li>Centro: Incluido si tienes permisos de acceso</li>
              <li>Hallazgos clínicos: Completamente documentados</li>
              <li>Imágenes: Referencia en plataforma clínica</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
