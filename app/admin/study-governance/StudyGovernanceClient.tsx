'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTransition } from 'react';
import { updateStudyGovernanceAction } from '@/lib/supabase/actions';

interface GovernanceItem {
  id: string;
  section: string;
  title: string;
  body: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface StudyGovernanceClientProps {
  initialGovernance: GovernanceItem[];
}

const SECTION_LABELS: Record<string, string> = {
  scientific_committee: 'Comité Científico',
  core_lab: 'Core Lab OPSTAR-AI',
  data_management: 'Gestión de Datos',
  platform: 'Plataforma OPSTAR-AI',
  privacy: 'Privacidad y Protección de Datos',
};

export default function StudyGovernanceClient({
  initialGovernance,
}: StudyGovernanceClientProps) {
  const [governance, setGovernance] = useState(initialGovernance);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editBody, setEditBody] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleEdit = (item: GovernanceItem) => {
    setEditingId(item.id);
    setEditTitle(item.title);
    setEditBody(item.body);
  };

  const handleSave = (section: string) => {
    if (!editTitle || !editBody) {
      alert('Por favor completa todos los campos');
      return;
    }

    startTransition(async () => {
      const result = await updateStudyGovernanceAction(section, editTitle, editBody);
      if (result.success) {
        setGovernance((prev) =>
          prev.map((item) =>
            item.section === section
              ? { ...item, title: editTitle, body: editBody }
              : item
          )
        );
        setEditingId(null);
        alert('✓ Gobernanza actualizada correctamente');
      } else {
        alert(`Error: ${result.error}`);
      }
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditTitle('');
    setEditBody('');
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="bg-slate-900 border-b border-slate-800 p-4 md:p-8 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/admin"
            className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold mb-2 inline-block"
          >
            ← Volver a Admin
          </Link>
          <h1 className="text-base font-bold text-slate-50">
            Gestión de Gobernanza del Estudio
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Edita la información sobre comité científico, core lab, gestión de datos, plataforma y privacidad.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="space-y-6">
          {governance.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden"
            >
              {editingId === item.id ? (
                // Edit Mode
                <div className="p-6 space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
                      Sección: {SECTION_LABELS[item.section] || item.section}
                    </label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg text-sm outline-none focus:border-cyan-500"
                      placeholder="Título"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-400 uppercase block mb-2">
                      Contenido
                    </label>
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      rows={8}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 rounded-lg text-sm outline-none focus:border-cyan-500 resize-none"
                      placeholder="Contenido detallado..."
                    />
                  </div>

                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => handleSave(item.section)}
                      disabled={isPending}
                      className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-sm transition-all disabled:opacity-50"
                    >
                      {isPending ? 'Guardando...' : '✓ Guardar'}
                    </button>
                    <button
                      onClick={handleCancel}
                      className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-sm transition-all"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="p-6 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-50">
                        {SECTION_LABELS[item.section] || item.section}
                      </h3>
                      <p className="text-xs text-slate-600 mt-1 font-mono">
                        {item.section}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEdit(item)}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-slate-100 rounded-lg text-xs font-semibold transition-all"
                    >
                      Editar
                    </button>
                  </div>

                  <div className="pt-3 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
                      Título Actual
                    </h4>
                    <p className="text-sm text-slate-300">{item.title}</p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">
                      Contenido
                    </h4>
                    <p className="text-sm text-slate-350 whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {item.body}
                    </p>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[9px] text-slate-600">
                    <span>
                      {item.is_active ? '✓ Activo' : '✗ Inactivo'}
                    </span>
                    <span>
                      Orden: {item.display_order}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
