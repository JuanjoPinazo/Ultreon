import React from 'react';
import { getBusinessIntelligenceDataAction } from '@/lib/supabase/actions';
import BusinessIntelligenceClient from './BusinessIntelligenceClient';

export const metadata = {
  title: 'Inteligencia de Negocios | Admin',
  description: 'Dashboard de métricas financieras y operacionales del registro multicéntrico',
};

export default async function BusinessIntelligencePage() {
  const { success, data } = await getBusinessIntelligenceDataAction();

  if (!success || !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">Inteligencia de Negocios</h1>
          <p className="text-sm text-muted-foreground">Métricas financieras y operacionales por centro</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">Error al cargar los datos. Intenta nuevamente.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">Inteligencia de Negocios</h1>
        <p className="text-sm text-muted-foreground">Métricas financieras y operacionales por centro</p>
      </div>

      <BusinessIntelligenceClient
        hospitals={data.hospitals}
        metrics={data.metrics}
        objectives={data.objectives}
        caseCounts={data.caseCounts}
      />
    </div>
  );
}
