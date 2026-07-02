import React from 'react';
import Link from 'next/link';

export default function AdminDemoCenterPage() {
  const cards = [
    {
      title: 'Demo Clínica',
      description: 'Caso clínico completo con imágenes OCT reales, hallazgos ULTREON y cambio de estrategia.',
      href: '/demo/clinical',
      icon: '🩺',
      color: 'from-blue-500/20 to-cyan-500/10',
      border: 'border-cyan-500/30',
    },
    {
      title: 'Demo Dirección',
      description: 'Dashboard ejecutivo con adopción, consumo, potencial económico, margen y ROI.',
      href: '/demo/executive',
      icon: '📈',
      color: 'from-purple-500/20 to-indigo-500/10',
      border: 'border-indigo-500/30',
    },
    {
      title: 'Demo Congreso',
      description: 'Modo presentación fullscreen para reuniones científicas, KOLs y congresos.',
      href: '/demo/congress',
      icon: '🏛️',
      color: 'from-amber-500/20 to-orange-500/10',
      border: 'border-orange-500/30',
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      
      <div className="mb-8">
        <h1 className="text-3xl font-light text-white tracking-tight mb-2">OPSTAR AI Demo Center</h1>
        <p className="text-slate-400">Panel de control exclusivo para administradores. Lanzador de simulaciones.</p>
      </div>

      <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-6 mb-10 flex items-start gap-4">
        <div className="text-2xl mt-1">⚠️</div>
        <div>
          <h3 className="text-amber-400 font-bold mb-1">Aviso Crítico de Privacidad</h3>
          <p className="text-sm text-slate-300">
            Las imágenes demo deben estar completamente anonimizadas antes de subirse a las carpetas estáticas (<code className="bg-black/50 px-1 py-0.5 rounded text-amber-200">/public/demo/oct/...</code>). Asegúrate de eliminar cualquier referencia a nombres, fechas o IDs de pacientes en los DICOM/PNG.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className={`bg-[#111]/80 backdrop-blur-xl border ${card.border} rounded-3xl p-8 relative overflow-hidden flex flex-col transition-all duration-300 shadow-xl hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
            
            <div className="text-4xl mb-4">{card.icon}</div>
            <h3 className="text-xl font-semibold text-white mb-2">{card.title}</h3>
            <p className="text-slate-400 text-sm mb-8 flex-grow">{card.description}</p>
            
            <Link 
              href={card.href}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-mono text-xs font-bold uppercase tracking-wider text-center transition-all"
            >
              Abrir {card.title}
            </Link>
          </div>
        ))}
      </div>

    </div>
  );
}
