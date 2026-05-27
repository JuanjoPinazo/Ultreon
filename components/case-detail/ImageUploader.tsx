'use client';

import React, { useState, useRef } from 'react';
import { useTransition } from 'react';
import { uploadCaseMediaAction } from '@/lib/supabase/media-actions';
import { detectMediaCategory } from '@/lib/storage/media-helpers';

interface ImageUploaderProps {
  caseId: string;
  hospitalId: string;
  onUploadSuccess?: () => void;
}

type MediaCategory =
  | 'oct_frame'
  | 'oct_pullback'
  | 'angiography'
  | 'ultreon_screenshot'
  | 'report_pdf'
  | 'zero_contrast_image'
  | 'other';

const CATEGORY_LABELS: Record<MediaCategory, string> = {
  oct_frame: 'OCT - Frame',
  oct_pullback: 'OCT - Pullback',
  angiography: 'Angiografía',
  ultreon_screenshot: 'Screenshot ULTREON',
  report_pdf: 'Informe PDF',
  zero_contrast_image: 'Zero-Contrast',
  other: 'Otro',
};

const PHASE_LABELS: Record<string, string> = {
  pre_pci: 'Pre-PCI',
  post_pci: 'Post-PCI',
  follow_up: 'Follow-up',
  unknown: 'Sin especificar',
};

export default function ImageUploader({
  caseId,
  hospitalId,
  onUploadSuccess,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MediaCategory>('other');
  const [selectedPhase, setSelectedPhase] = useState('unknown');
  const [description, setDescription] = useState('');
  const [hasConfirmedAnonymous, setHasConfirmedAnonymous] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      const detectedCategory = detectMediaCategory(file.name);
      if (detectedCategory !== 'other') {
        setSelectedCategory(detectedCategory as MediaCategory);
      }
      setShowForm(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      const detectedCategory = detectMediaCategory(file.name);
      if (detectedCategory !== 'other') {
        setSelectedCategory(detectedCategory as MediaCategory);
      }
      setShowForm(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedFile) {
      setErrorMsg('Seleccione un archivo');
      return;
    }

    if (!hasConfirmedAnonymous) {
      setErrorMsg('Debe confirmar anonimización antes de subir');
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('caseId', caseId);
      formData.append('hospitalId', hospitalId);
      formData.append('category', selectedCategory);
      formData.append('acquisitionPhase', selectedPhase);
      formData.append('description', description);
      formData.append('hasConfirmedAnonymous', String(hasConfirmedAnonymous));

      const res = await uploadCaseMediaAction(formData);

      if (res.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg('✓ Imagen subida exitosamente');
        setSelectedFile(null);
        setShowForm(false);
        setHasConfirmedAnonymous(false);
        setDescription('');
        setTimeout(() => {
          setSuccessMsg(null);
          onUploadSuccess?.();
        }, 2000);
      }
    });
  };

  return (
    <div className="space-y-4">
      {!showForm ? (
        <>
          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-cyan-500 bg-cyan-950/20'
                : 'border-slate-700 bg-slate-950/60 hover:border-slate-600'
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-3">
              <span className="text-3xl">📤</span>
              <h3 className="text-sm font-bold text-slate-200">
                Arrastra imágenes aquí o haz clic para seleccionar
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                JPG, PNG, WebP, PDF • Máx 25 MB
              </p>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Archivo seleccionado */}
          <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4">
            <p className="text-xs font-mono text-slate-500 mb-1 uppercase">
              Archivo seleccionado
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {selectedFile?.name}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {(selectedFile?.size || 0) / 1024 / 1024 > 0
                    ? `${((selectedFile?.size || 0) / 1024 / 1024).toFixed(1)} MB`
                    : 'Cargando...'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setShowForm(false);
                }}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Cambiar
              </button>
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
              Categoría
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as MediaCategory)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm outline-none focus:border-cyan-500"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Fase de adquisición */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
              Fase de Adquisición
            </label>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm outline-none focus:border-cyan-500"
            >
              {Object.entries(PHASE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Descripción */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
              Descripción (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas adicionales sobre la imagen..."
              rows={2}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-sm outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          {/* Advertencia de anonimización */}
          <div className="bg-red-950/30 border border-red-900/40 rounded-2xl p-4">
            <p className="text-xs font-bold text-red-300 mb-2">
              ⚠️ AVISO DE PRIVACIDAD
            </p>
            <p className="text-xs text-red-300/80 mb-3 font-mono">
              No subir imágenes con datos personales visibles. Verifique que la imagen
              haya sido anonimizada completamente antes de cargar.
            </p>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasConfirmedAnonymous}
                onChange={(e) => setHasConfirmedAnonymous(e.target.checked)}
                className="h-4 w-4 rounded bg-slate-900 border border-slate-700 accent-cyan-500"
              />
              <span className="text-xs font-semibold text-slate-300">
                Confirmo que esta imagen ha sido anonimizada
              </span>
            </label>
          </div>

          {/* Mensajes */}
          {errorMsg && (
            <div className="bg-red-950/30 border border-red-900/40 text-red-400 px-3 py-2 rounded-lg text-xs font-mono">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 px-3 py-2 rounded-lg text-xs font-mono">
              {successMsg}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setSelectedFile(null);
              }}
              className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-850 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!hasConfirmedAnonymous || isPending}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
            >
              {isPending ? 'Subiendo...' : 'Subir Imagen'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
