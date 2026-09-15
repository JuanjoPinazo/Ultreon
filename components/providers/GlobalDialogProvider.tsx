'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type DialogType = 'warning' | 'error' | 'destructive' | 'unsaved_changes' | 'validation';

interface DialogOptions {
  title: string;
  message: string | ReactNode;
  type: DialogType;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  // For validation specifically
  errors?: { field: string; message: string }[];
}

interface DialogContextProps {
  showDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextProps | undefined>(undefined);

export const useGlobalDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useGlobalDialog must be used within GlobalDialogProvider');
  return context;
};

export function GlobalDialogProvider({ children }: { children: ReactNode }) {
  const [dialog, setDialog] = useState<DialogOptions | null>(null);

  const showDialog = useCallback((options: DialogOptions) => {
    setDialog(options);
  }, []);

  const closeDialog = useCallback(() => {
    setDialog(null);
  }, []);

  const handleConfirm = () => {
    if (dialog?.onConfirm) dialog.onConfirm();
    closeDialog();
  };

  const handleCancel = () => {
    if (dialog?.onCancel) dialog.onCancel();
    closeDialog();
  };

  return (
    <DialogContext.Provider value={{ showDialog, closeDialog }}>
      {children}
      
      <AnimatePresence>
        {dialog && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={handleCancel}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className={`relative w-full max-w-md overflow-hidden rounded-2xl bg-card border shadow-2xl ${
                dialog.type === 'error' || dialog.type === 'destructive' 
                  ? 'border-red-500/20' 
                  : dialog.type === 'warning' || dialog.type === 'unsaved_changes' || dialog.type === 'validation'
                  ? 'border-amber-500/20'
                  : 'border-border'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon based on type */}
                  <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    dialog.type === 'error' || dialog.type === 'destructive' 
                      ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {dialog.type === 'error' || dialog.type === 'destructive' ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                  </div>
                  
                  <div className="flex-1 mt-1">
                    <h3 className="text-lg font-bold text-foreground mb-2">
                      {dialog.title}
                    </h3>
                    <div className="text-sm text-muted-foreground leading-relaxed">
                      {dialog.message}
                    </div>

                    {/* Validation Errors List */}
                    {dialog.type === 'validation' && dialog.errors && dialog.errors.length > 0 && (
                      <ul className="mt-4 space-y-2 text-sm max-h-48 overflow-y-auto">
                        {dialog.errors.map((err, i) => (
                          <li key={i} className="flex gap-2 items-start text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 p-2 rounded-lg border border-red-100 dark:border-red-900/30">
                            <span className="font-bold flex-shrink-0">Campo:</span> 
                            <span>{err.field} - {err.message}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-muted px-6 py-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-background border border-border hover:text-foreground transition-colors"
                >
                  {dialog.cancelLabel || 'Cancelar'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-sm ${
                    dialog.type === 'error' || dialog.type === 'destructive'
                      ? 'bg-red-600 text-white hover:bg-red-500 border border-red-500'
                      : 'bg-cyan-600 text-white hover:bg-cyan-500 border border-cyan-500'
                  }`}
                >
                  {dialog.confirmLabel || 'Aceptar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}
