// app/login/page.tsx
'use client';

import React, { useActionState, useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginAction } from '@/lib/supabase/actions';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(loginAction, null);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'inactive') {
      setLocalError('Su cuenta está inactiva o pendiente de validación. Póngase en contacto con el administrador.');
    }
  }, [searchParams]);

  useEffect(() => {
    if (state?.success) {
      if (state.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    }
  }, [state, router]);

  const displayedError = state?.error || localError;

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden relative">
      {/* Subtle cyan glow top border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

      {/* Card Header */}
      <div className="p-8 pb-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white font-black text-base tracking-tighter">
            A
          </div>
        </div>
        
        <div className="flex justify-center items-center gap-2 mb-1">
          <span className="text-[9px] font-mono font-bold tracking-widest text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            ULTREON™ 3.0
          </span>
          <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase">
            SECURE ACCESS
          </span>
        </div>

        <h1 className="text-2xl font-extrabold tracking-tight text-slate-50 mt-2">
          OPSTAR-AI <span className="font-light text-slate-400">Registry</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          Acceso seguro para el Registro de Hemodinámica de Levante
        </p>
      </div>

      {/* Form Body */}
      <form action={formAction} className="p-8 pt-4 space-y-5">
        
        {/* Email Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="email">
            Correo Electrónico
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            placeholder="ejemplo@hospital.com"
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 transition-all text-sm outline-none text-slate-200 placeholder-slate-650"
          />
        </div>

        {/* Password Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-400 tracking-wider uppercase font-mono" htmlFor="password">
            Contraseña
          </label>
          <input
            type="password"
            name="password"
            id="password"
            required
            placeholder="••••••••"
            disabled={isPending}
            className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500/50 transition-all text-sm outline-none text-slate-200 placeholder-slate-650"
          />
        </div>

        {/* Error Message */}
        {displayedError && (
          <div className="p-3 bg-red-950/20 border border-red-500/30 text-red-400 rounded-xl text-xs leading-relaxed font-mono flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">⚠</span>
            <span>{displayedError}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black transition-all text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isPending ? (
            <>
              <svg className="animate-spin h-4 w-4 text-slate-950" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Conectando...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Acceder al Registro</span>
            </>
          )}
        </button>
      </form>

      {/* Card Footer */}
      <div className="p-6 bg-slate-950 border-t border-slate-850/50 text-center text-[10px] text-slate-600 font-mono">
        🔒 Conexión segura SSL/TLS · Cumple RGPD de datos médicos
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 md:p-8 antialiased font-sans">
      {/* Cyan glow background orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <Suspense fallback={
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center flex flex-col items-center gap-4">
          <div className="animate-spin h-6 w-6 border-t-2 border-cyan-400 rounded-full" />
          <span className="text-xs text-slate-500 font-mono">Cargando consola de seguridad...</span>
        </div>
      }>
        <LoginForm />
      </Suspense>
    </main>
  );
}
