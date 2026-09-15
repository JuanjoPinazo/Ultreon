'use client';

import React, { useState } from 'react';
import { getSignedUrlAction } from '@/lib/supabase/media-actions';

interface MediaItem {
  id: string;
  file_name: string;
  file_type?: string;
  media_category: string;
  acquisition_phase: string;
  description?: string;
  is_key_image: boolean;
  is_anonymized: boolean;
  corelab_quality?: string;
  created_at: string;
  file_size_bytes: bigint;
}

interface ImageGalleryProps {
  media: MediaItem[];
  caseId: string;
  isAdmin?: boolean;
  onKeyImageToggle?: (mediaId: string, isKey: boolean) => Promise<void>;
}

const CATEGORY_LABELS: Record<string, string> = {
  oct_frame: '📹 OCT Frame',
  oct_pullback: '📊 OCT Pullback',
  angiography: '🫀 Angiografía',
  ultreon_screenshot: '🖼️ ULTREON',
  report_pdf: '📄 Informe',
  zero_contrast_image: '✨ Suero / No-Contraste',
  other: '📦 Otro',
};

const QUALITY_LABELS: Record<string, string> = {
  excellent: '🟢 Excelente',
  diagnostic: '🟦 Diagnóstica',
  suboptimal: '🟨 Subóptima',
  not_usable: '🔴 No usable',
};

const PHASE_COLORS: Record<string, string> = {
  pre_pci: 'bg-blue-950/60 text-blue-400 border-blue-800/40',
  post_pci: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/40',
  follow_up: 'bg-purple-950/60 text-purple-400 border-purple-800/40',
  unknown: 'bg-muted text-muted-foreground border-border dark:border-slate-700',
};

export default function ImageGallery({
  media,
  caseId,
  isAdmin = false,
  onKeyImageToggle,
}: ImageGalleryProps) {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleImageClick = async (item: MediaItem) => {
    setSelectedMedia(item);
    setLoadingId(item.id);

    const result = await getSignedUrlAction(item.id, caseId);
    if (result.url) {
      setSignedUrl(result.url);
    }

    setLoadingId(null);
  };

  const handleKeyImageToggle = async (mediaId: string, isKey: boolean) => {
    if (onKeyImageToggle) {
      await onKeyImageToggle(mediaId, isKey);
    }
  };

  if (media.length === 0) {
    return (
      <div className="bg-background/60 border border-border rounded-2xl p-8 text-center">
        <p className="text-muted-foreground text-sm">Sin imágenes en este caso</p>
      </div>
    );
  }

  // Agrupar por categoría
  const groupedByCategory = media.reduce(
    (acc, item) => {
      const cat = item.media_category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(item);
      return acc;
    },
    {} as Record<string, MediaItem[]>
  );

  return (
    <div className="space-y-6">
      {/* Gallery Grid */}
      {Object.entries(groupedByCategory).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-sm font-bold text-muted-foreground mb-3 flex items-center gap-2">
            <span>{CATEGORY_LABELS[category]}</span>
            <span className="text-xs bg-card px-2 py-0.5 rounded-full text-muted-foreground">
              {items.length}
            </span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-cyan-700/50 transition-all cursor-pointer"
                onClick={() => handleImageClick(item)}
              >
                {/* Thumbnail Placeholder */}
                <div className="aspect-square bg-background flex items-center justify-center">
                  {loadingId === item.id ? (
                    <div className="animate-spin">📡</div>
                  ) : (
                    <span className="text-4xl opacity-40">
                      {item.file_type?.includes('pdf') ? '📄' : '🖼️'}
                    </span>
                  )}
                </div>

                {/* Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-end p-3">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {item.file_name}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {item.description || 'Sin descripción'}
                  </p>
                </div>

                {/* Key Image Badge */}
                {item.is_key_image && (
                  <div className="absolute top-2 right-2 bg-cyan-500 text-slate-950 px-2 py-1 rounded-full text-[9px] font-bold">
                    ⭐ KEY
                  </div>
                )}

                {/* Quality Badge */}
                {item.corelab_quality && (
                  <div className="absolute bottom-2 left-2 text-[9px] font-semibold">
                    {QUALITY_LABELS[item.corelab_quality] || '?'}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Preview Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-foreground">
                {selectedMedia.file_name}
              </h3>
              <button
                onClick={() => {
                  setSelectedMedia(null);
                  setSignedUrl(null);
                }}
                className="text-muted-foreground hover:text-foreground text-lg"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Image Preview */}
              {signedUrl && (
                <div className="bg-background rounded-xl overflow-hidden">
                  {selectedMedia.file_type?.includes('pdf') ? (
                    <div className="aspect-video flex items-center justify-center">
                      <a
                        href={signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-cyan-500 text-slate-950 rounded-lg font-semibold hover:bg-cyan-400 transition-all"
                      >
                        Abrir PDF →
                      </a>
                    </div>
                  ) : (
                    <img
                      src={signedUrl}
                      alt={selectedMedia.file_name}
                      className="w-full h-auto"
                      onError={() => console.error('Error loading image')}
                    />
                  )}
                </div>
              )}

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background p-3 rounded-lg">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                    Categoría
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {CATEGORY_LABELS[selectedMedia.media_category]}
                  </p>
                </div>

                <div className="bg-background p-3 rounded-lg">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                    Fase
                  </p>
                  <span
                    className={`text-xs px-2 py-1 rounded border inline-block ${PHASE_COLORS[selectedMedia.acquisition_phase]}`}
                  >
                    {selectedMedia.acquisition_phase === 'pre_pci'
                      ? 'Pre-PCI'
                      : selectedMedia.acquisition_phase === 'post_pci'
                        ? 'Post-PCI'
                        : selectedMedia.acquisition_phase === 'follow_up'
                          ? 'Follow-up'
                          : 'Desconocida'}
                  </span>
                </div>

                <div className="bg-background p-3 rounded-lg">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                    Tamaño
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {(Number(selectedMedia.file_size_bytes) / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>

                <div className="bg-background p-3 rounded-lg">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                    Anonimizada
                  </p>
                  <p className="text-xs font-semibold">
                    {selectedMedia.is_anonymized ? (
                      <span className="text-emerald-400">✓ Sí</span>
                    ) : (
                      <span className="text-red-400">✗ No</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedMedia.description && (
                <div className="bg-background p-3 rounded-lg">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                    Descripción
                  </p>
                  <p className="text-xs text-muted-foreground">{selectedMedia.description}</p>
                </div>
              )}

              {/* Core Lab Quality */}
              {selectedMedia.corelab_quality && (
                <div className="bg-background p-3 rounded-lg">
                  <p className="text-[10px] font-mono text-muted-foreground uppercase mb-1">
                    Calidad Core Lab
                  </p>
                  <p className="text-sm font-semibold">
                    {QUALITY_LABELS[selectedMedia.corelab_quality]}
                  </p>
                </div>
              )}

              {/* Admin Actions */}
              {isAdmin && (
                <div className="border-t border-border pt-4 flex gap-2">
                  <button
                    onClick={() =>
                      handleKeyImageToggle(selectedMedia.id, !selectedMedia.is_key_image)
                    }
                    className={`flex-1 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                      selectedMedia.is_key_image
                        ? 'bg-cyan-950/60 border border-cyan-800/40 text-cyan-400 hover:bg-cyan-950/80'
                        : 'bg-muted border border-border dark:border-slate-700 text-muted-foreground hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {selectedMedia.is_key_image ? '⭐ Marcar como normal' : '☆ Marcar como key'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
