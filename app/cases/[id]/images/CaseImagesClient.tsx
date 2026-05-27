'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ImageUploader from '@/components/case-detail/ImageUploader';
import ImageGallery from '@/components/case-detail/ImageGallery';
import { markAsKeyImageAction, getCaseMediaAction } from '@/lib/supabase/media-actions';

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

interface CaseImagesClientProps {
  caseId: string;
  hospitalId: string;
  patientId: string;
  segment: string;
  hospitalName: string;
  initialMedia: MediaItem[];
  userRole: string;
}

export default function CaseImagesClient({
  caseId,
  hospitalId,
  patientId,
  segment,
  hospitalName,
  initialMedia,
  userRole,
}: CaseImagesClientProps) {
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem[]>(initialMedia);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isPending, startTransition] = useTransition();

  const isAdmin = userRole === 'admin' || userRole === 'monitor';

  const handleUploadSuccess = () => {
    // Refresh media list
    startTransition(async () => {
      const result = await getCaseMediaAction(caseId);
      if (result.media) {
        setMedia(result.media);
      }
    });
  };

  const handleKeyImageToggle = async (mediaId: string, isKey: boolean) => {
    startTransition(async () => {
      const res = await markAsKeyImageAction(mediaId, isKey);
      if (res.success) {
        setMedia((prev) =>
          prev.map((m) => (m.id === mediaId ? { ...m, is_key_image: isKey } : m))
        );
      }
    });
  };

  // Filter media
  const filteredMedia = media.filter((item) => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'key') return item.is_key_image;
    if (selectedFilter === 'pre-pci') return item.acquisition_phase === 'pre_pci';
    if (selectedFilter === 'post-pci') return item.acquisition_phase === 'post_pci';
    return true;
  });

  const keyImagesCount = media.filter((m) => m.is_key_image).length;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 p-4 md:p-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <Link href={`/cases/${caseId}`} className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold mb-2 inline-block">
              ← Volver al caso
            </Link>
            <h1 className="text-base font-bold text-slate-50">Galería de Imágenes</h1>
            <p className="text-xs text-slate-400 mt-1">
              Caso {patientId} • {segment} • {hospitalName}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4">
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Total Imágenes</p>
              <p className="text-2xl font-bold text-cyan-400">{media.length}</p>
            </div>
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4">
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Key Images</p>
              <p className="text-2xl font-bold text-emerald-400">⭐ {keyImagesCount}</p>
            </div>
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4">
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Anonimizadas</p>
              <p className="text-2xl font-bold text-slate-300">
                {media.filter((m) => m.is_anonymized).length}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4">
              <p className="text-[10px] font-mono text-slate-500 uppercase mb-1">Revisadas</p>
              <p className="text-2xl font-bold text-slate-300">
                {media.filter((m) => m.corelab_quality).length}
              </p>
            </div>
          </div>

          {/* Upload Section */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8">
            <h2 className="text-base font-bold text-slate-50 mb-6">Subir Nueva Imagen</h2>
            <ImageUploader
              caseId={caseId}
              hospitalId={hospitalId}
              onUploadSuccess={handleUploadSuccess}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: '📊 Todas' },
              { id: 'key', label: '⭐ Key Images' },
              { id: 'pre-pci', label: '🔵 Pre-PCI' },
              { id: 'post-pci', label: '🔷 Post-PCI' },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setSelectedFilter(filter.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  selectedFilter === filter.id
                    ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Gallery */}
          <div className="bg-slate-900 border border-slate-850 rounded-3xl p-6 md:p-8">
            <h2 className="text-base font-bold text-slate-50 mb-6">
              {filteredMedia.length} imagen{filteredMedia.length !== 1 ? 'es' : ''}
            </h2>
            <ImageGallery
              media={filteredMedia}
              caseId={caseId}
              isAdmin={isAdmin}
              onKeyImageToggle={handleKeyImageToggle}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
