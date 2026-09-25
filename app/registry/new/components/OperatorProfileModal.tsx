import React, { useState, useEffect } from 'react';
import { getOperatorProfile, upsertOperatorProfile, OperatorClinicalProfile } from '../../../../lib/registry/operator-profile';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  operatorId: string;
  operatorName: string;
  onProfileUpdated: (profile: OperatorClinicalProfile) => void;
}

export default function OperatorProfileModal({ isOpen, onClose, operatorId, operatorName, onProfileUpdated }: Props) {
  const [profile, setProfile] = useState<Partial<OperatorClinicalProfile>>({
    image_usage_oct: 0,
    image_usage_ivus: 0,
    image_usage_angio: 0,
    experience_oct: '',
    experience_level_oct: '',
    experience_ultreon: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && operatorId) {
      setLoading(true);
      getOperatorProfile(operatorId).then(data => {
        if (data) setProfile(data);
        setLoading(false);
      });
    }
  }, [isOpen, operatorId]);

  if (!isOpen) return null;

  const updateField = (key: keyof OperatorClinicalProfile, value: any) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    const sum = (profile.image_usage_oct || 0) + (profile.image_usage_ivus || 0) + (profile.image_usage_angio || 0);
    if (sum !== 10) {
      setError('La suma de usos de OCT, IVUS y Angio debe ser exactamente 10.');
      return;
    }
    
    if (!profile.experience_oct || !profile.experience_level_oct || !profile.experience_ultreon) {
      setError('Por favor, completa todos los campos de experiencia.');
      return;
    }

    setError('');
    setLoading(true);

    const fullProfile = { ...profile, operator_id: operatorId } as OperatorClinicalProfile;
    const res = await upsertOperatorProfile(fullProfile);
    
    if (res.success) {
      onProfileUpdated(fullProfile);
      onClose();
    } else {
      setError(res.error?.message || 'Error al guardar el perfil.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-border w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-border flex justify-between items-center bg-surface">
          <div>
            <h2 className="text-xl font-bold text-foreground">Perfil Clínico del Operador</h2>
            <p className="text-sm text-muted-foreground mt-1">Operador: <span className="font-semibold text-foreground">{operatorName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-muted-foreground">
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Frecuencia de Uso de Imagen (de cada 10 PCI)</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground">OCT</label>
                <input 
                  type="number" min="0" max="10" 
                  inputMode="numeric"
                  value={profile.image_usage_oct === undefined ? '' : profile.image_usage_oct}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    updateField('image_usage_oct', val === '' ? 0 : Math.min(10, parseInt(val, 10) || 0));
                  }}
                  className="bg-card border border-input-border dark:border-slate-700 text-foreground rounded-lg p-2.5 outline-none no-spinner" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground">IVUS</label>
                <input 
                  type="number" min="0" max="10" 
                  inputMode="numeric"
                  value={profile.image_usage_ivus === undefined ? '' : profile.image_usage_ivus}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    updateField('image_usage_ivus', val === '' ? 0 : Math.min(10, parseInt(val, 10) || 0));
                  }}
                  className="bg-card border border-input-border dark:border-slate-700 text-foreground rounded-lg p-2.5 outline-none no-spinner" 
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Solo Angio</label>
                <input 
                  type="number" min="0" max="10" 
                  inputMode="numeric"
                  value={profile.image_usage_angio === undefined ? '' : profile.image_usage_angio}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    updateField('image_usage_angio', val === '' ? 0 : Math.min(10, parseInt(val, 10) || 0));
                  }}
                  className="bg-card border border-input-border dark:border-slate-700 text-foreground rounded-lg p-2.5 outline-none no-spinner" 
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">La suma total debe ser exactamente 10.</p>
          </div>

          <div className="border-t border-border pt-6">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider mb-4">Experiencia General</h3>
            
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Experiencia global con OCT</label>
                <select 
                  className="bg-card border border-input-border dark:border-slate-700 text-foreground rounded-lg p-2.5 outline-none"
                  value={profile.experience_oct || ''}
                  onChange={e => updateField('experience_oct', e.target.value)}
                >
                  <option value="" disabled>Seleccione...</option>
                  <option value="<1 año">&lt; 1 año</option>
                  <option value="1-3 años">1-3 años</option>
                  <option value="3-5 años">3-5 años</option>
                  <option value=">5 años">&gt; 5 años</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Nivel de experiencia OCT</label>
                <select 
                  className="bg-card border border-input-border dark:border-slate-700 text-foreground rounded-lg p-2.5 outline-none"
                  value={profile.experience_level_oct || ''}
                  onChange={e => updateField('experience_level_oct', e.target.value)}
                >
                  <option value="" disabled>Seleccione...</option>
                  <option value="Usuario experto">Usuario experto</option>
                  <option value="Usuario habitual">Usuario habitual</option>
                  <option value="Usuario ocasional">Usuario ocasional</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Experiencia con ULTREON™ 3.0</label>
                <select 
                  className="bg-card border border-input-border dark:border-slate-700 text-foreground rounded-lg p-2.5 outline-none"
                  value={profile.experience_ultreon || ''}
                  onChange={e => updateField('experience_ultreon', e.target.value)}
                >
                  <option value="" disabled>Seleccione...</option>
                  <option value="Primeras utilizaciones">Primeras utilizaciones</option>
                  <option value="Usuario reciente">Usuario reciente</option>
                  <option value="Usuario experimentado">Usuario experimentado</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-card/50 flex justify-end gap-3 rounded-b-2xl">
          <button 
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar Perfil Basal'}
          </button>
        </div>
      </div>
    </div>
  );
}
