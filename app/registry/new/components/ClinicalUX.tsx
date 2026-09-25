import React, { useState, useEffect } from 'react';

// Priority 6 - UX Components

export const ClinicalSelect = ({ label, value, onChange, options, required, error }: any) => (
  <div className="flex flex-col gap-1.5 mb-4">
    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
      {label} {required && <span className="text-primary">*</span>}
    </label>
    <select
      className={`bg-surface border ${error ? 'border-destructive' : 'border-input-border'} text-foreground rounded-lg p-2.5 text-sm focus:border-primary focus:ring-1 focus:ring-focus-ring outline-none transition-all`}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Seleccionar...</option>
      {options.map((opt: any) => (
        <option key={opt.value || opt} value={opt.value || opt}>
          {opt.label || opt}
        </option>
      ))}
    </select>
    {error && <span className="text-[10px] text-red-400">{error}</span>}
  </div>
);

export const ClinicalMultiSelect = ({ label, options, selected = [], onChange, error }: any) => {
  const toggle = (val: string) => {
    const safeSelected = Array.isArray(selected) ? selected : [];
    if (safeSelected.includes(val)) {
      onChange(safeSelected.filter((v: string) => v !== val));
    } else {
      onChange([...safeSelected, val]);
    }
  };

  return (
    <div className="flex flex-col gap-2 mb-4">
      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map((opt: any) => {
          const val = opt.value || opt;
          const lbl = opt.label || opt;
          const safeSelected = Array.isArray(selected) ? selected : [];
          const isSelected = safeSelected.includes(val);
          return (
            <button
              key={val}
              type="button"
              onClick={() => toggle(val)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isSelected
                  ? 'bg-primary-soft border-primary text-foreground font-bold shadow-md ring-1 ring-primary/40 dark:bg-primary/20 dark:border-primary/50 dark:text-primary-soft dark:ring-0'
                  : 'bg-surface border-input-border text-foreground-secondary hover:border-primary hover:text-foreground dark:border-input-border dark:text-muted-foreground dark:hover:border-primary dark:hover:text-foreground'
              }`}
            >
              {lbl}
            </button>
          );
        })}
      </div>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
};

export const ClinicalRadioChips = ({ label, options, value, onChange, error }: any) => (
  <div className="flex flex-col gap-2 mb-4">
    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt: any) => {
        const val = opt.value || opt;
        const lbl = opt.label || opt;
        const isSelected = value === val;
        return (
          <button
            key={val}
            type="button"
            onClick={() => onChange(val)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              isSelected
                ? 'bg-primary-soft border-primary text-foreground font-bold shadow-md ring-1 ring-primary/40 dark:bg-primary/20 dark:border-primary/50 dark:text-primary-soft dark:ring-0'
                : 'bg-surface border-input-border text-foreground-secondary hover:border-primary hover:text-foreground dark:border-input-border dark:text-muted-foreground dark:hover:border-primary dark:hover:text-foreground'
            }`}
          >
            {lbl}
          </button>
        );
      })}
    </div>
    {error && <span className="text-[10px] text-red-400">{error}</span>}
  </div>
);

export const ClinicalScale = ({ label, value, onChange, error, minLabel = "Min", maxLabel = "Max" }: any) => {
  return (
    <div className="flex flex-col gap-2 mb-4 w-full">
      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="flex flex-nowrap w-full justify-between sm:justify-start sm:gap-1.5 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`flex-none w-10 h-10 rounded-lg font-bold border transition-all flex items-center justify-center text-sm shrink-0 ${
              value === num
                ? 'bg-primary-soft border-primary text-foreground font-bold shadow-md ring-1 ring-primary/40 dark:bg-primary/20 dark:border-primary/50 dark:text-primary-soft dark:ring-0'
                : 'bg-surface border-input-border text-foreground-secondary hover:bg-surface-secondary hover:border-primary dark:bg-background dark:border-input-border dark:text-muted-foreground dark:hover:bg-muted dark:hover:border-primary'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-[-4px]">
        <span>1 = {minLabel}</span>
        <span>10 = {maxLabel}</span>
      </div>
      {error && <span className="text-[10px] text-red-400">{error}</span>}
    </div>
  );
};

export const ClinicalNumberStepper = ({ label, value, onChange, unit = "", min = 0 }: any) => {
  const handleChange = (e: any) => {
    const val = e.target.value.replace(/\D/g, '');
    if (val === '') onChange('');
    else {
      const num = parseInt(val, 10);
      if (!isNaN(num) && num >= min) onChange(num.toString());
    }
  };

  return (
    <div className="flex flex-col gap-1.5 mb-4">
      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</label>
      <div className="relative w-full sm:w-48">
        <input
          type="number"
          inputMode="numeric"
          min={min}
          className="w-full bg-surface border border-border text-foreground h-10 text-center font-bold outline-none rounded-lg focus:bg-surface-secondary focus:border-primary focus:ring-1 focus:ring-primary transition-all no-spinner"
          value={value || ''}
          onChange={handleChange}
        />
        {unit && value !== '' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none font-bold">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
};

export const PullbackCard = ({ children, title, subtitle, isFast, isLeftMain }: any) => (
  <div className="bg-background border border-border rounded-xl overflow-hidden mb-6 shadow-md">
    <div className="bg-muted border-b border-border px-5 py-3 flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-3">
        <h3 className="font-bold text-foreground uppercase tracking-wider">{title}</h3>
        {subtitle && <span className="text-[11px] font-bold text-primary bg-primary-soft dark:text-cyan-400 dark:bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-200 dark:border-cyan-800/50">{subtitle}</span>}
      </div>
      <div className="flex gap-2">
        {isFast && <span className="text-[10px] font-bold text-amber-400 bg-amber-950/50 px-2 py-1 rounded border border-amber-800/50 uppercase tracking-widest">Pullback Rápido</span>}
        {isLeftMain && <span className="text-[10px] font-bold text-purple-400 bg-purple-950/50 px-2 py-1 rounded border border-purple-800/50 uppercase tracking-widest">TCI</span>}
      </div>
    </div>
    <div className="p-5 flex flex-col gap-4">
      {children}
    </div>
  </div>
);

export const ConditionalSection = ({ title, show, children, colorClass = "cyan" }: any) => {
  if (!show) return null;
  
  const borderColors: any = {
    cyan: 'border-cyan-200 dark:border-cyan-800/50',
    amber: 'border-amber-800/50',
    emerald: 'border-emerald-800/50',
    purple: 'border-purple-800/50',
    blue: 'border-blue-800/50',
  };
  
  const bgColors: any = {
    cyan: 'bg-primary-soft dark:bg-cyan-950/20',
    amber: 'bg-amber-950/20',
    emerald: 'bg-emerald-950/20',
    purple: 'bg-purple-950/20',
    blue: 'bg-blue-950/20',
  };

  const textColors: any = {
    cyan: 'text-primary dark:text-cyan-400',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    purple: 'text-purple-400',
    blue: 'text-blue-400',
  };

  return (
    <div className={`mt-6 rounded-xl border ${borderColors[colorClass]} ${bgColors[colorClass]} overflow-hidden animate-fade-slide`}>
      <div className={`px-5 py-3 border-b ${borderColors[colorClass]} ${bgColors[colorClass]}`}>
        <h3 className={`font-bold uppercase tracking-widest text-[11px] ${textColors[colorClass]}`}>{title}</h3>
      </div>
      <div className="p-5 flex flex-col gap-3">
        {children}
      </div>
    </div>
  );
};
