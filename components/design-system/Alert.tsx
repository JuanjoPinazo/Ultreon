// components/design-system/Alert.tsx
import React from 'react';
import Card from './Card';

interface AlertProps {
  title: string;
  description: string;
  variant?: 'info' | 'warning' | 'danger';
  className?: string;
}

export default function Alert({
  title,
  description,
  variant = 'info',
  className = '',
}: AlertProps) {
  const variantMap = {
    info: {
      border: 'border-cyan-900/40 bg-cyan-950/10 text-cyan-400',
      badge: '💬 INFO',
      glow: 'cyan' as const,
    },
    warning: {
      border: 'border-amber-900/40 bg-amber-950/10 text-amber-400',
      badge: '⚠️ ATENCIÓN',
      glow: 'amber' as const,
    },
    danger: {
      border: 'border-red-900/40 bg-red-950/10 text-red-400',
      badge: '🛑 ALERTA CRÍTICA',
      glow: 'red' as const,
    },
  };

  const sel = variantMap[variant];

  return (
    <Card 
      active 
      glowColor={sel.glow === 'amber' ? 'slate' : sel.glow} // custom fallback for amber
      className={`p-4 ${sel.border} ${className}`}
    >
      <div className="flex flex-col gap-1">
        <span className="text-[8px] font-black font-mono tracking-wider block">
          {sel.badge}
        </span>
        <h4 className="text-xs font-bold text-slate-100 mt-1">
          {title}
        </h4>
        <p className="text-[10px] text-slate-400 leading-relaxed font-mono mt-0.5">
          {description}
        </p>
      </div>
    </Card>
  );
}
