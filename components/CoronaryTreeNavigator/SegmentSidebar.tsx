import React from 'react';
import { CORONARY_SEGMENTS, Segment } from './coronarySegments';

interface SegmentSidebarProps {
  selectedSegmentId: string | null;
  onSelectSegment: (segmentId: string) => void;
}

export function SegmentSidebar({ selectedSegmentId, onSelectSegment }: SegmentSidebarProps) {
  // Group segments for the sidebar
  const groups = ['TCI', 'DA', 'CX', 'CD', 'RAMAS'] as const;

  return (
    <div className="h-full flex flex-col border-l border-slate-800 bg-slate-900/40 w-64 flex-shrink-0 overflow-y-auto">
      <div className="p-4 border-b border-slate-800 sticky top-0 bg-slate-900/90 backdrop-blur-md z-10">
        <h3 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest">
          Selección Manual
        </h3>
      </div>
      <div className="p-2 space-y-4">
        {groups.map((group) => {
          const segments = CORONARY_SEGMENTS.filter(s => s.group === group);
          if (segments.length === 0) return null;

          return (
            <div key={group} className="space-y-1">
              <h4 className="text-[9px] font-mono font-bold text-slate-600 px-2 uppercase tracking-widest mb-1">
                {group}
              </h4>
              <div className="space-y-0.5">
                {segments.map(seg => {
                  const isSelected = selectedSegmentId === seg.id;
                  return (
                    <button
                      key={seg.id}
                      type="button"
                      onClick={() => onSelectSegment(seg.id)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-950/60 text-cyan-400 font-bold border border-cyan-500/30'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      <span>{seg.label}</span>
                      {isSelected && (
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
