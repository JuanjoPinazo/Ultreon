'use client';

import React, { useRef, useState, useEffect } from 'react';
import Card from './Card';
import Badge from './Badge';

interface ClinicalStoryboardCardProps {
  label: string;
  subText: string;
  badge?: string;
  isPrimary?: boolean;
  required?: boolean;
  file: File | null;
  previewUrl?: string;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  whatShouldBeSeen: string[];
  tooltipText: string;
  icons?: React.ReactNode[];
  bottomText?: string;
}

export default function ClinicalStoryboardCard({
  label,
  subText,
  badge,
  isPrimary = false,
  required = false,
  file,
  previewUrl = '',
  onFileSelect,
  onRemove,
  whatShouldBeSeen,
  tooltipText,
  icons,
  bottomText,
}: ClinicalStoryboardCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dimensions, setDimensions] = useState<{ w: number; h: number } | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Load image dimensions dynamically
  useEffect(() => {
    if (previewUrl && file) {
      const img = new Image();
      img.onload = () => {
        setDimensions({ w: img.naturalWidth, h: img.naturalHeight });
      };
      img.src = previewUrl;
    } else {
      setDimensions(null);
    }
  }, [previewUrl, file]);

  const handleCardClick = () => {
    if (!file) {
      fileInputRef.current?.click();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  const formattedSize = file ? (file.size / (1024 * 1024)).toFixed(2) + ' MB' : '';
  const formattedDate = file ? new Date(file.lastModified).toLocaleDateString() : '';

  return (
    <div className="relative flex flex-col h-full group">
      <Card
        active={!!file}
        glowColor={isPrimary ? 'cyan' : 'cyan'}
        onClick={handleCardClick}
        onKeyDown={handleKeyPress}
        tabIndex={file ? -1 : 0}
        className={`flex-1 flex flex-col justify-between p-5 min-h-[360px] relative overflow-hidden transition-all duration-350 select-none border ${
          isPrimary
            ? 'bg-cyan-950/10 border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.08)]'
            : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
        } ${!file ? 'cursor-pointer' : ''}`}
      >
        {/* Background Preview Image if loaded */}
        {previewUrl && (
          <div className="absolute inset-0 z-0 bg-slate-950 transition-all group-hover:scale-102 duration-500">
            <img src={previewUrl} alt={label} className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30" />
          </div>
        )}

        {/* Header Block */}
        <div className="relative z-10 w-full space-y-2">
          <div className="flex justify-between items-start gap-2">
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-100 uppercase tracking-wide leading-none group-hover:text-cyan-400 transition-colors">
                {label}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 font-medium leading-relaxed">
                {subText}
              </span>
            </div>
            
            {/* Badges / Status */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {required && (
                <span className="text-[8px] font-black font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/40 uppercase">
                  OBLIGATORIA
                </span>
              )}
              {badge && (
                <span className="text-[8px] font-black font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-400 border border-amber-800/40 uppercase">
                  {badge}
                </span>
              )}
              
              {/* Tooltip Button (?) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(!showTooltip);
                }}
                className="w-4 h-4 rounded-full border border-slate-700 bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[9px] font-mono flex items-center justify-center cursor-pointer"
                title="Ayuda de imagen"
              >
                ?
              </button>
            </div>
          </div>

          {/* Floating Help Tooltip Context */}
          {showTooltip && (
            <div className="absolute top-8 right-0 left-0 bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-xl z-20 text-[10px] text-slate-350 leading-relaxed animate-scale-up">
              <div className="flex justify-between items-start mb-1.5">
                <span className="font-bold text-cyan-400">Guía Clínica de Imagen</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowTooltip(false); }}
                  className="text-slate-500 hover:text-slate-300 text-xs font-mono"
                >
                  ×
                </button>
              </div>
              <p>{tooltipText}</p>
              <div className="mt-2 text-[8px] text-slate-500 italic">
                (Próximamente: ver ejemplo real)
              </div>
            </div>
          )}
        </div>

        {/* Storyboard Content / Checklist */}
        <div className="relative z-10 my-4 space-y-2.5 w-full flex-1">
          <div className="p-3 rounded-xl bg-slate-950/40 border border-slate-850/60 space-y-1.5">
            <span className="text-[8px] font-bold text-slate-500 font-mono tracking-wider block uppercase">
              ¿QUÉ DEBE VERSE?
            </span>
            <ul className="space-y-1">
              {whatShouldBeSeen.map((item, idx) => (
                <li key={idx} className="flex items-center gap-1.5 text-[10px] text-slate-300">
                  <span className="text-cyan-400 text-[8px]">✔</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {icons && icons.length > 0 && (
            <div className="flex gap-2 items-center">
              {icons.map((icon, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-slate-950/60 border border-slate-850 px-2 py-0.5 rounded text-[8px] font-mono text-slate-400">
                  {icon}
                </div>
              ))}
            </div>
          )}

          {bottomText && (
            <p className="text-[9px] text-slate-500 leading-normal font-medium">
              {bottomText}
            </p>
          )}
        </div>

        {/* Footer Actions / Drop Zone */}
        <div className="relative z-10 w-full pt-3 border-t border-slate-850/60">
          {file ? (
            <div className="space-y-2">
              {/* File Info */}
              <div className="space-y-1 bg-slate-950/50 p-2.5 rounded-xl border border-slate-850">
                <div className="flex justify-between items-center text-[9px] font-mono text-cyan-400">
                  <span className="font-bold truncate max-w-[140px]">✓ Imagen recibida</span>
                  <span>100%</span>
                </div>
                <div className="w-full h-1 bg-cyan-950/80 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full w-full" />
                </div>
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[8px] font-mono text-slate-500 pt-1">
                  <span>Tam: {formattedSize}</span>
                  <span>Res: {dimensions ? `${dimensions.w}x${dimensions.h}` : 'Cargando...'}</span>
                  <span className="col-span-2">Fecha: {formattedDate}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="flex-1 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:text-slate-100 rounded-lg text-[9px] font-bold text-slate-400 text-center transition-all cursor-pointer"
                >
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="px-2 py-1.5 bg-red-950/40 border border-red-900/40 hover:bg-red-950/80 hover:border-red-500 text-red-400 rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                  title="Eliminar evidencia"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex flex-col items-center justify-center p-3 border border-dashed border-slate-800 rounded-xl bg-slate-950/30 group-hover:border-slate-700 transition-colors">
                <span className="text-lg mb-1">📤</span>
                <span className="text-[10px] font-bold text-cyan-400 group-hover:text-cyan-300">Seleccionar Imagen</span>
                <span className="text-[8px] text-slate-500 mt-0.5">PNG, JPG, JPEG · Max 15MB</span>
              </div>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileSelect}
          className="hidden"
        />
      </Card>
    </div>
  );
}
