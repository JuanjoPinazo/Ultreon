'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  uploadOctEvidenceFileAction,
  uploadOctEvidenceAction,
  getOctEvidenceAction,
  deleteOctEvidenceAction,
} from '@/lib/supabase/actions';

interface OctEvidenceRecord {
  id: string;
  evidence_phase: string;
  evidence_type: string;
  title?: string;
  description?: string;
  is_key_evidence: boolean;
  corelab_quality?: string;
  linked_variable?: string;
  linked_strategy_change?: string;
  file_name: string;
  storage_path: string;
  created_at: string;
}

interface OctEvidenceClientProps {
  caseId: string;
  caseIdentifier: string;
  canUpload: boolean;
  canReview: boolean;
  initialEvidence: OctEvidenceRecord[];
}

const PHASE_OPTIONS = [
  { value: 'pre_pci', label: 'Pre-PCI Assessment' },
  { value: 'strategy_change', label: 'Strategy Modification' },
  { value: 'post_pci', label: 'Post-PCI Result' },
  { value: 'zero_contrast', label: 'Zero-Contrast Protocol' },
  { value: 'follow_up', label: 'Follow-Up' },
  { value: 'report', label: 'Report' },
];

const EVIDENCE_TYPE_OPTIONS = [
  { value: 'oct_frame', label: 'OCT Frame' },
  { value: 'oct_pullback', label: 'OCT Pullback' },
  { value: 'ultreon_screenshot', label: 'ULTREON™ Screenshot' },
  { value: 'angiography', label: 'Angiography' },
  { value: 'ffr_oct', label: 'FFR-OCT' },
  { value: 'calcium', label: 'Calcium Finding' },
  { value: 'lipid_plaque', label: 'Lipid Plaque' },
  { value: 'eel_reference', label: 'EEL Reference' },
  { value: 'stent_expansion', label: 'Stent Expansion' },
  { value: 'malapposition', label: 'Malapposition' },
  { value: 'edge_dissection', label: 'Edge Dissection' },
  { value: 'zero_contrast_quality', label: 'Zero-Contrast Quality' },
  { value: 'report_pdf', label: 'Report PDF' },
  { value: 'other', label: 'Other' },
];

const LINKED_VARIABLE_OPTIONS = [
  { value: 'severe_calcium', label: 'Severe Calcium' },
  { value: 'lipid_plaque', label: 'Lipid Plaque' },
  { value: 'eel_reference', label: 'EEL Reference' },
  { value: 'ffr_oct', label: 'FFR-OCT' },
  { value: 'stent_diameter_change', label: 'Stent Diameter Change' },
  { value: 'stent_length_change', label: 'Stent Length Change' },
  { value: 'landing_zone_change', label: 'Landing Zone Change' },
  { value: 'plaque_preparation', label: 'Plaque Preparation' },
  { value: 'post_stent_msa', label: 'Post-Stent MSA' },
  { value: 'stent_expansion', label: 'Stent Expansion' },
  { value: 'malapposition', label: 'Malapposition' },
  { value: 'edge_dissection', label: 'Edge Dissection' },
  { value: 'contrast_reduction', label: 'Contrast Reduction' },
  { value: 'wash_quality', label: 'Wash Quality' },
];

export default function OctEvidenceClient({
  caseId,
  caseIdentifier,
  canUpload,
  canReview,
  initialEvidence,
}: OctEvidenceClientProps) {
  const [evidence, setEvidence] = useState<OctEvidenceRecord[]>(initialEvidence);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymized, setIsAnonymized] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<OctEvidenceRecord | null>(null);
  const [filterPhase, setFilterPhase] = useState<string>('all');
  const [filterKeyOnly, setFilterKeyOnly] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    phase: 'pre_pci' as const,
    evidenceType: 'oct_frame' as const,
    linkedVariable: '',
    linkedStrategyChange: '',
    title: '',
    description: '',
    isKeyEvidence: false,
  });

  // Handle file selection
  const handleFileSelect = (file: File) => {
    if (file.size > 25 * 1024 * 1024) {
      alert('Archivo muy grande (máximo 25 MB)');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
      alert('Tipo de archivo no permitido (JPG, PNG, WebP, PDF)');
      return;
    }

    setSelectedFile(file);

    // Generate preview
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview('');
    }

    setShowUploadForm(true);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !isAnonymized) {
      alert('Debes confirmar que la imagen no contiene datos personales.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload file and get path
      const formDataObj = new FormData();
      formDataObj.append('file', selectedFile);
      formDataObj.append('caseId', caseId);
      formDataObj.append('phase', formData.phase);
      formDataObj.append('isAnonymized', 'true');

      const uploadResult = await uploadOctEvidenceFileAction(formDataObj);

      if (!uploadResult.success || !uploadResult.path) {
        alert(`Error al subir: ${uploadResult.error || 'Desconocido'}`);
        setIsSubmitting(false);
        return;
      }

      // Save metadata
      const saveResult = await uploadOctEvidenceAction({
        caseId,
        phase: formData.phase,
        evidenceType: formData.evidenceType,
        linkedVariable: formData.linkedVariable || undefined,
        linkedStrategyChange: formData.linkedStrategyChange || undefined,
        title: formData.title || undefined,
        description: formData.description || undefined,
        isKeyEvidence: formData.isKeyEvidence,
        isAnonymized: true,
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
        storagePath: uploadResult.path,
      });

      if (saveResult.error) {
        alert(`Error al guardar: ${saveResult.error}`);
      } else {
        // Refresh evidence list
        const result = await getOctEvidenceAction(caseId);
        if (result.data) {
          setEvidence(result.data);
        }
        resetForm();
        setShowUploadForm(false);
      }
    } catch (err: any) {
      alert(`Error: ${err?.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview('');
    setIsAnonymized(false);
    setFormData({
      phase: 'pre_pci',
      evidenceType: 'oct_frame',
      linkedVariable: '',
      linkedStrategyChange: '',
      title: '',
      description: '',
      isKeyEvidence: false,
    });
  };

  // Filter evidence
  const filteredEvidence = evidence.filter((e) => {
    if (filterPhase !== 'all' && e.evidence_phase !== filterPhase) return false;
    if (filterKeyOnly && !e.is_key_evidence) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      {canUpload && (
        <div className="space-y-4">
          {!showUploadForm ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                isDragging
                  ? 'border-cyan-400 bg-cyan-950/20'
                  : 'border-slate-700 bg-slate-900/40'
              }`}
            >
              <div className="flex flex-col items-center gap-4">
                <svg
                  className="w-12 h-12 text-slate-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33A3 3 0 0116.5 19.5"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Subir OCT Evidence</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Arrastra archivos aquí o haz clic para seleccionar
                  </p>
                  <p className="text-[10px] text-slate-500 mt-2">
                    JPG, PNG, WebP o PDF (máx 25 MB)
                  </p>
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-4 bg-cyan-950 hover:bg-cyan-900 border border-cyan-800 text-cyan-400 px-6 py-2 rounded-xl text-sm font-bold transition-all"
                >
                  Seleccionar Archivo
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
            </div>
          ) : null}

          {/* Upload Form */}
          {showUploadForm && selectedFile && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <h3 className="text-lg font-bold text-slate-50">Metadata & Upload</h3>
                <button
                  onClick={() => resetForm()}
                  className="text-slate-400 hover:text-slate-200 text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Preview */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase">Preview</span>
                  {preview ? (
                    <div className="relative w-full aspect-square bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                      <Image
                        src={preview}
                        alt="Preview"
                        fill
                        className="object-contain p-4"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center">
                      <p className="text-sm text-slate-500">PDF - No preview</p>
                    </div>
                  )}
                  <p className="text-xs text-slate-500">{selectedFile.name}</p>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  {/* Phase */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-2 uppercase">
                      Fase *
                    </label>
                    <select
                      value={formData.phase}
                      onChange={(e) =>
                        setFormData({ ...formData, phase: e.target.value as any })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      {PHASE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Evidence Type */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-2 uppercase">
                      Tipo de Evidencia *
                    </label>
                    <select
                      value={formData.evidenceType}
                      onChange={(e) =>
                        setFormData({ ...formData, evidenceType: e.target.value as any })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      {EVIDENCE_TYPE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Linked Variable */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-2 uppercase">
                      Variable Clínica Enlazada
                    </label>
                    <select
                      value={formData.linkedVariable}
                      onChange={(e) =>
                        setFormData({ ...formData, linkedVariable: e.target.value })
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="">Seleccionar...</option>
                      {LINKED_VARIABLE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="text-xs font-bold text-slate-400 block mb-2 uppercase">
                      Título
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) =>
                        setFormData({ ...formData, title: e.target.value })
                      }
                      placeholder="Ej: OCT Pull-back pre-stent"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  {/* Key Evidence Checkbox */}
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="keyEvidence"
                      checked={formData.isKeyEvidence}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isKeyEvidence: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-slate-600 bg-slate-950"
                    />
                    <label
                      htmlFor="keyEvidence"
                      className="text-sm text-slate-300 cursor-pointer"
                    >
                      Marcar como Key Evidence
                    </label>
                  </div>

                  {/* Anonymization Confirmation */}
                  <div className="pt-4 border-t border-slate-800">
                    <label className="flex items-start gap-3 cursor-pointer p-3 bg-red-950/20 border border-red-800/40 rounded-lg">
                      <input
                        type="checkbox"
                        checked={isAnonymized}
                        onChange={(e) => setIsAnonymized(e.target.checked)}
                        className="mt-1 w-4 h-4 rounded border-red-600 bg-slate-950"
                      />
                      <span className="text-xs text-red-300">
                        ⚠ Confirmo que esta imagen no contiene datos personales del
                        paciente (NHC, SIP, nombre, fecha nacimiento, etc.)
                      </span>
                    </label>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleUpload}
                    disabled={isSubmitting || !isAnonymized}
                    className="w-full bg-cyan-950 hover:bg-cyan-900 disabled:opacity-50 disabled:cursor-not-allowed border border-cyan-800 text-cyan-400 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                  >
                    {isSubmitting ? 'Subiendo...' : 'Confirmar & Subir'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-400 block mb-2 uppercase">
            Fase
          </label>
          <select
            value={filterPhase}
            onChange={(e) => setFilterPhase(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">Todas</option>
            {PHASE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={filterKeyOnly}
              onChange={(e) => setFilterKeyOnly(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-900"
            />
            Solo Key Evidence
          </label>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => {
              setFilterPhase('all');
              setFilterKeyOnly(false);
            }}
            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 rounded-xl px-3 py-2 text-sm font-medium transition-all"
          >
            Resetear
          </button>
        </div>
      </div>

      {/* Evidence Gallery */}
      {filteredEvidence.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100">
              {filteredEvidence.length} evidencia{filteredEvidence.length !== 1 ? 's' : ''}
            </h3>
            <span className="text-xs text-slate-500">
              {evidence.filter((e) => !e.corelab_quality).length} pendiente core lab
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvidence.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedEvidence(item);
                  setShowDetailModal(true);
                }}
                className="bg-slate-900 border border-slate-800 hover:border-cyan-700 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:shadow-cyan-500/10"
              >
                <div className="aspect-square bg-slate-950 relative overflow-hidden group">
                  {item.file_name.endsWith('.pdf') ? (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <svg
                        className="w-12 h-12"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900">
                      <span className="absolute inset-0 flex items-center justify-center text-slate-500 text-sm">
                        Image
                      </span>
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-xs font-bold text-white">Ver detalles</span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 line-clamp-1">
                        {item.title || item.evidence_type}
                      </h4>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {PHASE_OPTIONS.find((p) => p.value === item.evidence_phase)?.label}
                      </p>
                    </div>
                    {item.is_key_evidence && (
                      <span className="text-[10px] font-bold bg-emerald-950/60 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800/40">
                        KEY
                      </span>
                    )}
                  </div>

                  {item.corelab_quality && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded inline-block ${
                        item.corelab_quality === 'excellent'
                          ? 'bg-emerald-950/60 text-emerald-400'
                          : item.corelab_quality === 'diagnostic'
                            ? 'bg-cyan-950/60 text-cyan-400'
                            : item.corelab_quality === 'suboptimal'
                              ? 'bg-yellow-950/60 text-yellow-400'
                              : 'bg-red-950/60 text-red-400'
                      }`}
                    >
                      {item.corelab_quality}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
          <svg
            className="w-12 h-12 mx-auto text-slate-600 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-slate-400 text-sm">No hay evidencia cargada aún.</p>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedEvidence && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900">
              <h3 className="text-lg font-bold text-slate-50">
                {selectedEvidence.title || selectedEvidence.evidence_type}
              </h3>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-200 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    Fase
                  </span>
                  <span className="text-sm font-bold text-slate-100">
                    {PHASE_OPTIONS.find((p) => p.value === selectedEvidence.evidence_phase)
                      ?.label}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    Tipo
                  </span>
                  <span className="text-sm font-bold text-slate-100">
                    {EVIDENCE_TYPE_OPTIONS.find((t) => t.value === selectedEvidence.evidence_type)
                      ?.label}
                  </span>
                </div>
                {selectedEvidence.linked_variable && (
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                      Variable
                    </span>
                    <span className="text-sm font-bold text-cyan-400">
                      {LINKED_VARIABLE_OPTIONS.find(
                        (v) => v.value === selectedEvidence.linked_variable
                      )?.label}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-1">
                    Core Lab
                  </span>
                  <span
                    className={`text-sm font-bold ${
                      selectedEvidence.corelab_quality
                        ? selectedEvidence.corelab_quality === 'excellent'
                          ? 'text-emerald-400'
                          : selectedEvidence.corelab_quality === 'diagnostic'
                            ? 'text-cyan-400'
                            : selectedEvidence.corelab_quality === 'suboptimal'
                              ? 'text-yellow-400'
                              : 'text-red-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {selectedEvidence.corelab_quality || 'Pendiente'}
                  </span>
                </div>
              </div>

              {selectedEvidence.description && (
                <div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase block mb-2">
                    Descripción
                  </span>
                  <p className="text-sm text-slate-300">{selectedEvidence.description}</p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 px-4 py-2 rounded-lg text-sm font-bold transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
