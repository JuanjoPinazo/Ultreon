'use client';

import React, { useState, useTransition } from 'react';
import Image from 'next/image';
import { getSignedUrlAction } from '@/lib/supabase/media-actions';

interface KeyImage {
  id: string;
  file_name: string;
  file_type?: string;
  media_category: string;
  acquisition_phase: string;
  corelab_quality?: string;
}

interface KeyImagesSectionProps {
  caseId: string;
  keyImages: KeyImage[];
}

const PHASE_LABELS: Record<string, string> = {
  pre_pci: 'Pre-PCI',
  post_pci: 'Post-PCI',
  follow_up: 'Follow-up',
  unknown: 'Desconocida',
};

const CATEGORY_LABELS: Record<string, string> = {
  oct_frame: 'OCT Frame',
  oct_pullback: 'OCT Pullback',
  angiography: 'Angiografía',
  ultreon_screenshot: 'ULTREON Screenshot',
  report_pdf: 'Reporte PDF',
  zero_contrast_image: 'Zero Contrast',
  other: 'Otra',
};

const QUALITY_BADGE_COLOR: Record<string, string> = {
  excellent: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40',
  diagnostic: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/40',
  suboptimal: 'bg-yellow-950/60 text-yellow-400 border-yellow-800/40',
  not_usable: 'bg-red-950/60 text-red-400 border-red-800/40',
};

export default function KeyImagesSection({
  caseId,
  keyImages,
}: KeyImagesSectionProps) {
  const [selectedImage, setSelectedImage] = useState<KeyImage | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleImageClick = (image: KeyImage) => {
    setSelectedImage(image);
    setPreviewUrl(null);

    startTransition(async () => {
      const result = await getSignedUrlAction(image.id, caseId);
      if (result.url) {
        setPreviewUrl(result.url);
      }
    });
  };

  const handleCloseModal = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
  };

  return (
    <>
      {/* Key Images Grid */}
      <section className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-foreground">⭐ Imágenes Clave</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {keyImages.map((image) => (
            <button
              key={image.id}
              onClick={() => handleImageClick(image)}
              className="group relative bg-background border border-border rounded-xl overflow-hidden hover:border-cyan-700 transition-all hover:shadow-[0_0_15px_rgba(34,211,238,0.15)]"
            >
              {/* Thumbnail Placeholder */}
              <div className="aspect-video bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden">
                {/* Pattern background */}
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(15,23,42,0.5)_25%,transparent_25%,transparent_75%,rgba(15,23,42,0.5)_75%,rgba(15,23,42,0.5)),linear-gradient(45deg,rgba(15,23,42,0.5)_25%,transparent_25%,transparent_75%,rgba(15,23,42,0.5)_75%,rgba(15,23,42,0.5))] bg-[length:20px_20px] bg-[position:0_0,10px_10px]" />
                <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                  {image.file_type?.includes('pdf') ? (
                    <div className="text-3xl">📄</div>
                  ) : image.media_category === 'angiography' ? (
                    <div className="text-3xl">📊</div>
                  ) : image.media_category?.includes('oct') ? (
                    <div className="text-3xl">🔬</div>
                  ) : (
                    <div className="text-3xl">🖼️</div>
                  )}
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {image.file_type?.split('/')[1]?.toUpperCase() || 'FILE'}
                  </span>
                </div>
              </div>

              {/* Metadata Overlay */}
              <div className="p-3 bg-background border-t border-border space-y-2">
                <p className="text-xs font-semibold text-muted-foreground truncate group-hover:text-cyan-400 transition-colors">
                  {image.file_name.substring(0, 20)}
                  {image.file_name.length > 20 ? '...' : ''}
                </p>

                <div className="space-y-1 text-[9px]">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {CATEGORY_LABELS[image.media_category] || image.media_category}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      {PHASE_LABELS[image.acquisition_phase]}
                    </span>
                  </div>
                </div>

                {/* Quality Badge */}
                {image.corelab_quality && (
                  <div
                    className={`px-2 py-0.5 rounded border text-[9px] font-bold text-center ${
                      QUALITY_BADGE_COLOR[image.corelab_quality] ||
                      'bg-slate-100 dark:bg-slate-800 text-muted-foreground border-border dark:border-slate-700'
                    }`}
                  >
                    {image.corelab_quality === 'excellent' && '🟢 Excelente'}
                    {image.corelab_quality === 'diagnostic' && '🟦 Diagnóstica'}
                    {image.corelab_quality === 'suboptimal' && '🟨 Subóptima'}
                    {image.corelab_quality === 'not_usable' && '🔴 No usable'}
                  </div>
                )}
              </div>

              {/* Hover Indicator */}
              <div className="absolute inset-0 bg-gradient-to-t from-cyan-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </button>
          ))}
        </div>

        <p className="text-[10px] text-muted-foreground mt-4">
          {keyImages.length} imagen{keyImages.length !== 1 ? 'es' : ''} marcada{keyImages.length !== 1 ? 's' : ''} como clave
        </p>
      </section>

      {/* Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleCloseModal}
        >
          <div
            className="bg-card border border-border rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-background">
              <h3 className="text-sm font-bold text-foreground">
                {selectedImage.file_name}
              </h3>
              <button
                onClick={handleCloseModal}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-all text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 flex flex-col items-center justify-center bg-background min-h-[300px]">
              {previewUrl ? (
                selectedImage.file_type?.includes('pdf') ? (
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-lg font-semibold transition-all"
                  >
                    Abrir PDF →
                  </a>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center p-4">
                    <img
                      src={previewUrl}
                      alt={selectedImage.file_name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )
              ) : (
                <div className="text-muted-foreground text-sm">
                  {isPending ? 'Cargando imagen...' : 'No se pudo cargar la imagen'}
                </div>
              )}
            </div>

            {/* Modal Footer - Metadata */}
            <div className="p-4 border-t border-border bg-background/50 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[9px] text-muted-foreground mb-1">Categoría</p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {CATEGORY_LABELS[selectedImage.media_category]}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground mb-1">Fase</p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {PHASE_LABELS[selectedImage.acquisition_phase]}
                </p>
              </div>
              <div>
                <p className="text-[9px] text-muted-foreground mb-1">Tipo</p>
                <p className="text-xs font-semibold text-muted-foreground">
                  {selectedImage.file_type?.split('/')[1]?.toUpperCase() || 'N/A'}
                </p>
              </div>
              {selectedImage.corelab_quality && (
                <div>
                  <p className="text-[9px] text-muted-foreground mb-1">Calidad</p>
                  <p
                    className={`text-xs font-bold px-2 py-0.5 rounded w-fit ${
                      QUALITY_BADGE_COLOR[selectedImage.corelab_quality] ||
                      'bg-slate-100 dark:bg-slate-800 text-muted-foreground'
                    }`}
                  >
                    {selectedImage.corelab_quality === 'excellent' && 'Excelente'}
                    {selectedImage.corelab_quality === 'diagnostic' && 'Diagnóstica'}
                    {selectedImage.corelab_quality === 'suboptimal' && 'Subóptima'}
                    {selectedImage.corelab_quality === 'not_usable' && 'No usable'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
