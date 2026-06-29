import React from 'react';
import { Segment } from './coronarySegments';

interface SelectedSegmentCardProps {
  segment: Segment | null;
}

export function SelectedSegmentCard({ segment }: SelectedSegmentCardProps) {
  if (!segment) {
    return (
      <div className="flex flex-col items-center justify-center h-24 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 text-slate-500 font-mono text-[10px] uppercase tracking-widest mt-4">
        Ningún segmento seleccionado
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 shadow-[0_0_20px_rgba(34,211,238,0.1)] mt-4 transition-all animate-fade-in">
      <div className="w-12 h-12 rounded-full border border-cyan-500/50 flex items-center justify-center bg-cyan-950 text-cyan-400 font-black text-sm">
        {segment.shortLabel}
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
          Segmento Activo
        </span>
        <span className="text-lg font-black text-slate-50">
          {segment.label}
        </span>
        <span className="text-xs font-mono text-cyan-500/80">
          Vaso: {segment.vessel} | Grupo: {segment.group}
        </span>
      </div>
    </div>
  );
}
