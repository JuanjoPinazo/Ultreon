import React from 'react';
import { Segment } from './coronarySegments';

interface SelectedSegmentCardProps {
  segment: Segment | null;
}

export function SelectedSegmentCard({ segment }: SelectedSegmentCardProps) {
  if (!segment) {
    return (
      <div className="flex flex-col items-center justify-center h-24 rounded-2xl border border-dashed border-border bg-card/40 text-muted-foreground font-mono text-[10px] uppercase tracking-widest mt-4">
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
        <span className="text-[10px] font-mono font-bold text-muted-foreground uppercase tracking-widest">
          Segmento Activo
        </span>
        <span className="text-lg font-black text-foreground">
          {segment.label}
        </span>
        <span className="text-xs font-mono text-cyan-500/80">
          Vaso: {segment.vessel} | Grupo: {segment.group}
        </span>
      </div>
    </div>
  );
}
