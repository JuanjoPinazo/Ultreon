// components/design-system/UploadCard.tsx
import React, { useRef } from 'react';
import Card from './Card';
import Badge from './Badge';

interface UploadCardProps {
  label: string;
  subText: string;
  file: File | null;
  previewUrl?: string;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

export default function UploadCard({
  label,
  subText,
  file,
  previewUrl = '',
  onFileSelect,
  className = '',
}: UploadCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCardClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card 
      active={!!file} 
      glowColor="cyan" 
      onClick={handleCardClick}
      className={`min-h-[160px] flex flex-col justify-between p-4 cursor-pointer relative overflow-hidden group select-none ${className}`}
    >
      {/* Background Preview Image */}
      {previewUrl && (
        <div className="absolute inset-0 z-0 bg-slate-950 transition-all group-hover:scale-105 duration-500">
          <img src={previewUrl} alt={label} className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
        </div>
      )}

      {/* Main Info */}
      <div className="relative z-10 w-full space-y-1">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-slate-100 block group-hover:text-cyan-400 transition-colors leading-tight">
            {label}
          </span>
          {file && (
            <Badge variant="cyan" dot pulse className="scale-90 origin-top-right">
              OK
            </Badge>
          )}
        </div>
        <span className="text-[9px] text-slate-500 block leading-tight font-medium">
          {subText}
        </span>
      </div>

      {/* Progress / Status indicator */}
      <div className="relative z-10 mt-6 w-full space-y-2">
        {file ? (
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[8px] font-mono text-cyan-400">
              <span className="font-bold truncate max-w-[120px]">{file.name}</span>
              <span>100%</span>
            </div>
            <div className="w-full h-1 bg-cyan-950/80 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500 rounded-full w-full" />
            </div>
            <span className="text-[8px] font-mono font-bold text-slate-500 block">
              🛡️ ANÓNIMO & COMPILADO
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-slate-500 font-bold group-hover:text-slate-400 transition-colors">
            <span>📤</span>
            <span>SUBIR EVIDENCIA</span>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={onFileSelect}
        className="hidden"
      />
    </Card>
  );
}
