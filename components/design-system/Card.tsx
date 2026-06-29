// components/design-system/Card.tsx
import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  active?: boolean;
  glow?: boolean;
  glowColor?: 'cyan' | 'emerald' | 'red' | 'slate';
  glass?: boolean;
}

export default function Card({
  children,
  active = false,
  glow = false,
  glowColor = 'cyan',
  glass = true,
  className = '',
  ...props
}: CardProps) {
  const glowClasses = {
    cyan: 'shadow-[0_8px_24px_rgba(0,229,255,0.12)] border-[#00E5FF]/45 bg-[#0F1524]',
    emerald: 'shadow-[0_8px_24px_rgba(34,197,94,0.12)] border-[#22C55E]/45 bg-[#0F1524]',
    red: 'shadow-[0_8px_24px_rgba(239,68,68,0.12)] border-red-500/45 bg-[#0F1524]',
    slate: 'shadow-[0_8px_24px_rgba(148,163,184,0.05)] border-slate-700/50 bg-[#0F1524]',
  };

  return (
    <div
      className={`relative rounded-2xl border transition-all duration-300 ${
        glass ? 'bg-[#0F1524]/90 backdrop-blur-xl' : 'bg-[#0F1524]'
      } ${
        active 
          ? glowClasses[glowColor] 
          : 'border-[#1C2436] hover:border-[#00E5FF]/30 shadow-[0_8px_24px_rgba(0,229,255,0.04)]'
      } ${glow && !active ? 'hover:shadow-[0_8px_24px_rgba(0,229,255,0.08)]' : ''} ${className}`}
      {...props}
    >
      {/* Decorative top ambient light line */}
      {active && (
        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-${glowColor === 'cyan' ? 'cyan' : glowColor === 'emerald' ? 'emerald' : 'red'}-400 to-transparent opacity-60`} />
      )}
      {children}
    </div>
  );
}
