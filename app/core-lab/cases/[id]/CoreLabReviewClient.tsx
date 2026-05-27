'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSignedUrlAction, submitCoreLabReviewAction, markAsKeyImageAction } from '@/lib/supabase/media-actions';

interface MediaItem {
  id: string;
  file_name: string;
  file_type?: string;
  media_category: string;
  acquisition_phase: string;
  description?: string;
  is_anonymized: boolean;
  is_key_image: boolean;
  corelab_quality?: string;
  corelab_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

interface CoreLabReviewClientProps {
  caseId: string;
  patientId: string;
  segment: string;
  hospitalName: string;
  initialMedia: MediaItem[];
}

type Quality = 'excellent' | 'diagnostic' | 'suboptimal' | 'not_usable';

const QUALITY_LABELS: Record<Quality, string> = {
  excellent: '🟢 Excelente',
  diagnostic: '🟦 Diagnóstica',
  suboptimal: '🟨 Subóptima',
  not_usable: '🔴 No usable',
};

const PHASE_LABELS: Record<string, string> = {
  pre_pci: 'Pre-PCI',
  post_pci: 'Post-PCI',
  follow_up: 'Follow-up',
  unknown: 'Desconocida',
};

export default function CoreLabReviewClient({
  caseId,
  patientId,
  segment,
  hospitalName,
  initialMedia,
}: CoreLabReviewClientProps) {
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(initialMedia[0] || null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Form state for selected media
  const [quality, setQuality] = useState<Quality | ''>(
    (selectedMedia?.corelab_quality as Quality) || ''
  );
  const [notes, setNotes] = useState(selectedMedia?.corelab_notes || '');

  const handleSelectMedia = (item: MediaItem) => {
    setSelectedMedia(item);
    setQuality((item.corelab_quality as Quality) || '');
    setNotes(item.corelab_notes || '');
    setSignedUrl(null);

    // Load image
    startTransition(async () => {
      const result = await getSignedUrlAction(item.id, caseId);
      if (result.url) {
        setSignedUrl(result.url);
      }
    });
  };

  const handleSaveReview = () => {
    if (!selectedMedia || !quality) return;

    startTransition(async () => {
      const res = await submitCoreLabReviewAction(
        selectedMedia.id,
        quality as Quality,
        notes
      );

      if (res.success) {
        // Update local state
        setMedia((prev) =>
          prev.map((m) =>
            m.id === selectedMedia.id
              ? {
                  ...m,
                  corelab_quality: quality,
                  corelab_notes: notes,
                  reviewed_at: new Date().toISOString(),
                }
              : m
          )
        );
        alert('✓ Revisión guardada correctamente');
      } else {
        alert(`Error: ${res.error}`);
      }
    });
  };

  const handleMarkAsKeyImage = async (mediaId: string, isKey: boolean) => {
    startTransition(async () => {
      const res = await markAsKeyImageAction(mediaId, isKey);
      if (res.success) {
        setMedia((prev) =>
          prev.map((m) => (m.id === mediaId ? { ...m, is_key_image: isKey } : m))
        );
      }
    });
  };

  // Calculate stats
  const stats = {
    total: media.length,
    reviewed: media.filter((m) => m.reviewed_at).length,
    excellent: media.filter((m) => m.corelab_quality === 'excellent').length,
    diagnostic: media.filter((m) => m.corelab_quality === 'diagnostic').length,
    suboptimal: media.filter((m) => m.corelab_quality === 'suboptimal').length,
    notUsable: media.filter((m) => m.corelab_quality === 'not_usable').length,
  };

  const preOctImages = media.filter((m) => m.acquisition_phase === 'pre_pci');
  const postOctImages = media.filter((m) => m.acquisition_phase === 'post_pci');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 md:p-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/core-lab"
            className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold mb-2 inline-block"
          >
            ← Volver al dashboard
          </Link>
          <h1 className="text-base font-bold text-slate-50">
            Revisión Core Lab — {patientId}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {segment} • {hospitalName}
          </p>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Image List */}
          <div className="lg:col-span-1 space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-50 mb-3">Imágenes ({stats.total})</h2>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {media.length === 0 ? (
                  <p className="text-xs text-slate-400">Sin imágenes</p>
                ) : (
                  media.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleSelectMedia(item)}
                      className={`w-full text-left p-3 rounded-lg border transition-all ${
                        selectedMedia?.id === item.id
                          ? 'bg-cyan-950/60 border-cyan-700'
                          : 'bg-slate-900 border-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-300 truncate">
                        {item.file_name}
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {PHASE_LABELS[item.acquisition_phase]}
                      </p>
                      {item.reviewed_at && (
                        <div className="text-[9px] text-emerald-400 mt-1">
                          ✓ Revisado: {item.corelab_quality}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 space-y-2">
              <h3 className="text-xs font-bold text-slate-300">Resumen Calidad</h3>
              <div className="space-y-1 text-[10px]">
                <p>
                  <span className="font-mono text-slate-500">🟢 Excelente:</span>
                  <span className="ml-2 font-semibold text-emerald-400">{stats.excellent}</span>
                </p>
                <p>
                  <span className="font-mono text-slate-500">🟦 Diagnóstica:</span>
                  <span className="ml-2 font-semibold text-cyan-400">{stats.diagnostic}</span>
                </p>
                <p>
                  <span className="font-mono text-slate-500">🟨 Subóptima:</span>
                  <span className="ml-2 font-semibold text-yellow-400">{stats.suboptimal}</span>
                </p>
                <p>
                  <span className="font-mono text-slate-500">🔴 No Usable:</span>
                  <span className="ml-2 font-semibold text-red-400">{stats.notUsable}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Right: Review Panel */}
          <div className="lg:col-span-2">
            {selectedMedia ? (
              <div className="space-y-6">
                {/* Image Preview */}
                <div className="bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden">
                  <div className="aspect-video bg-slate-950 flex items-center justify-center">
                    {signedUrl ? (
                      selectedMedia.file_type?.includes('pdf') ? (
                        <a
                          href={signedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-cyan-500 text-slate-950 rounded-lg font-semibold"
                        >
                          Abrir PDF →
                        </a>
                      ) : (
                        <img
                          src={signedUrl}
                          alt={selectedMedia.file_name}
                          className="w-full h-full object-contain"
                        />
                      )
                    ) : (
                      <span className="text-slate-400">Cargando imagen...</span>
                    )}
                  </div>

                  {/* Image Meta */}
                  <div className="p-4 border-t border-slate-800 bg-slate-950/50">
                    <p className="text-xs font-semibold text-slate-300 mb-2">
                      {selectedMedia.file_name}
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-slate-500">Fase:</span>
                        <span className="ml-2 font-semibold text-slate-300">
                          {PHASE_LABELS[selectedMedia.acquisition_phase]}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Anonimizada:</span>
                        <span
                          className={`ml-2 font-semibold ${selectedMedia.is_anonymized ? 'text-emerald-400' : 'text-red-400'}`}
                        >
                          {selectedMedia.is_anonymized ? '✓' : '✗'}
                        </span>
                      </div>
                      {selectedMedia.description && (
                        <div className="col-span-2">
                          <span className="text-slate-500">Descripción:</span>
                          <p className="text-slate-300 mt-1">{selectedMedia.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Review Form */}
                <div className="bg-slate-900 border border-slate-850 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-slate-50">Evaluación Core Lab</h3>

                  {/* Quality Selection */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-3">
                      Calidad de Imagen
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(QUALITY_LABELS) as Array<[Quality, string]>).map(([q, label]) => (
                        <button
                          key={q}
                          onClick={() => setQuality(q)}
                          className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-all ${
                            quality === q
                              ? 'bg-cyan-950/60 border-cyan-700 text-cyan-400'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
                      Notas de Revisión
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observaciones clínicas, recomendaciones, hallazgos..."
                      rows={3}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg text-xs outline-none focus:border-cyan-500 resize-none"
                    />
                  </div>

                  {/* Key Image Toggle */}
                  <div className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <label className="text-xs font-semibold text-slate-300">
                      Marcar como Key Image
                    </label>
                    <button
                      onClick={() =>
                        handleMarkAsKeyImage(selectedMedia.id, !selectedMedia.is_key_image)
                      }
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedMedia.is_key_image
                          ? 'bg-cyan-500/20 border border-cyan-700 text-cyan-400'
                          : 'bg-slate-800 border border-slate-700 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {selectedMedia.is_key_image ? '⭐ Sí' : '☆ No'}
                    </button>
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveReview}
                    disabled={!quality || isPending}
                    className="w-full px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-lg text-sm transition-all disabled:opacity-40 cursor-pointer"
                  >
                    {isPending ? 'Guardando...' : '✓ Guardar Revisión'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-850 rounded-2xl p-8 text-center">
                <p className="text-slate-400">Selecciona una imagen para revisar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
