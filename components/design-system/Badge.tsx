// components/design-system/Badge.tsx
import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: 'cyan' | 'emerald' | 'red' | 'amber' | 'slate';
  dot?: boolean;
  pulse?: boolean;
}

export default function Badge({
  children,
  variant = 'slate',
  dot = false,
  pulse = false,
  className = '',
  ...props
}: BadgeProps) {
  const variantStyles = {
    cyan: 'bg-cyan-950/60 text-cyan-400 border-cyan-800/40',
    emerald: 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40',
    red: 'bg-red-950/60 text-red-400 border-red-800/40',
    amber: 'bg-amber-950/60 text-amber-400 border-amber-800/40',
    slate: 'bg-slate-900 border-slate-800 text-slate-400',
  };

  const dotColors = {
    cyan: 'bg-cyan-400',
    emerald: 'bg-emerald-400',
    red: 'bg-red-400',
    amber: 'bg-amber-400',
    slate: 'bg-slate-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider uppercase rounded-full border ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]} ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {children}
    </span>
  );
}
