// components/design-system/MetricCard.tsx
import React from 'react';
import Card from './Card';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subText?: string;
  active?: boolean;
  glowColor?: 'cyan' | 'emerald' | 'red' | 'slate';
  className?: string;
}

export default function MetricCard({
  label,
  value,
  unit = '',
  subText = '',
  active = false,
  glowColor = 'cyan',
  className = '',
}: MetricCardProps) {
  return (
    <Card active={active} glowColor={glowColor} className={`p-4 ${className}`}>
      <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block">
        {label}
      </span>
      <div className="flex items-baseline gap-1 mt-2">
        <span className="text-2xl md:text-3xl font-black text-slate-100 tracking-tight leading-none">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono font-bold text-slate-500 uppercase">
            {unit}
          </span>
        )}
      </div>
      {subText && (
        <span className="text-[9px] text-slate-400 mt-2 block font-medium">
          {subText}
        </span>
      )}
    </Card>
  );
}
