'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useDemoData } from '@/lib/demo/DemoDataProvider';

export default function CongressDemoPage() {
  const { data } = useDemoData();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  if (!data) return null;
  const slides = data.congress.slides;

  // Auto-advance slides every 15 seconds (optional, but good for congress loops)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 15000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="h-screen w-screen bg-black overflow-hidden relative font-sans cursor-none selection:bg-transparent">
      
      {/* Cinematic animated background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-black to-black animate-[spin_60s_linear_infinite]" />
        <div className="absolute bottom-1/4 -right-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black animate-[spin_40s_linear_infinite_reverse]" />
      </div>

      {/* Hidden nav area to exit the fullscreen presentation (top left corner) */}
      <div className="absolute top-4 left-4 z-50 opacity-0 hover:opacity-100 transition-opacity">
        <Link href="/admin/demo-center" className="bg-card/80 border border-border dark:border-slate-700 text-muted-foreground px-4 py-2 rounded-full text-xs font-mono">
          ← Salir de Congreso (Admin)
        </Link>
      </div>

      <div className="relative z-10 h-full flex flex-col justify-between p-12">
        
        <header className="flex justify-between items-center opacity-50">
          <div className="text-xs font-mono uppercase tracking-[0.3em] text-white">Modo Congreso</div>
          <div className="text-xs font-mono text-white">OPSTAR 2026</div>
        </header>

        <main className="flex-1 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-5xl"
            >
              <div className="text-center mb-16">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 1 }}
                  className="text-5xl md:text-7xl font-light text-white tracking-tight mb-4"
                >
                  {slides[currentSlide].title}
                </motion.h1>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 1 }}
                  className="text-xl md:text-2xl text-cyan-500 font-light"
                >
                  {slides[currentSlide].subtitle}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2, duration: 1 }}
              >
                {/* Dynamically render content based on slide type */}
                {slides[currentSlide].content_type === 'intro' && (
                  <div className="text-center space-y-6">
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto font-light leading-relaxed">
                      {slides[currentSlide].data.description}
                    </p>
                    <div className="flex justify-center gap-8 mt-12">
                      <div className="text-center">
                        <div className="text-5xl font-light text-cyan-400 mb-2">{slides[currentSlide].data.hospitals}</div>
                        <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Hospitales</div>
                      </div>
                      <div className="text-center">
                        <div className="text-5xl font-light text-emerald-400 mb-2">{new Intl.NumberFormat('es-ES').format(slides[currentSlide].data.target_cases || 0)}</div>
                        <div className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Objetivo Casos</div>
                      </div>
                    </div>
                  </div>
                )}
                
                {slides[currentSlide].content_type === 'stats' && (
                  <div className="grid grid-cols-2 gap-8 max-w-4xl mx-auto">
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                      <div className="text-6xl font-light text-emerald-400 mb-4">{slides[currentSlide].data.zero_contrast}%</div>
                      <h3 className="text-lg text-white mb-2">Adopción Zero-Contrast</h3>
                      <p className="text-sm text-muted-foreground">Pacientes intervenidos con cero mililitros de contraste, protegiendo su función renal.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                      <div className="text-6xl font-light text-violet-400 mb-4">{slides[currentSlide].data.strategy_change}%</div>
                      <h3 className="text-lg text-white mb-2">Cambios de Estrategia</h3>
                      <p className="text-sm text-muted-foreground">Intervenciones donde ULTREON™ detectó hallazgos que modificaron el plan inicial.</p>
                    </div>
                  </div>
                )}

                {slides[currentSlide].content_type === 'outro' && (
                  <div className="text-center space-y-8">
                    <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_60px_rgba(6,182,212,0.3)]">
                      <span className="text-4xl text-white font-black">A</span>
                    </div>
                    <h3 className="text-3xl font-light text-white">OPSTAR Intelligence</h3>
                    <p className="text-muted-foreground">{slides[currentSlide].data.message}</p>
                    <div className="mt-8">
                      <Link href="/admin/demo-center" className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-slate-200 transition-colors">
                        Finalizar Presentación
                      </Link>
                    </div>
                  </div>
                )}
              </motion.div>

            </motion.div>
          </AnimatePresence>
        </main>

        <footer className="flex justify-center gap-4 z-20">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === currentSlide ? 'w-16 bg-cyan-400' : 'w-4 bg-white/20'}`}
            />
          ))}
        </footer>

      </div>
    </div>
  );
}
