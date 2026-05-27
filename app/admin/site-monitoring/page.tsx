import React from 'react';
import { getSiteMonitoringDataAction } from '@/lib/supabase/actions';
import SiteMonitoringClient from './SiteMonitoringClient';

export const metadata = {
  title: 'Site Monitoring | Admin',
  description: 'Monitoreo de avance del registro por centro',
};

export default async function SiteMonitoringPage() {
  const { success, data, error } = await getSiteMonitoringDataAction();

  if (!success || !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-slate-50">Site Monitoring</h1>
          <p className="text-sm text-slate-400">Monitoreo de avance del registro por centro</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
          <p className="text-slate-400">{error || 'Error al cargar los datos.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-50">Site Monitoring</h1>
        <p className="text-sm text-slate-400">Monitoreo de avance del registro por centro</p>
      </div>

      <SiteMonitoringClient
        hospitals={data.hospitals}
        cases={data.cases}
        followups={data.followups}
        media={data.media}
        coreLabReviews={data.coreLabReviews}
        objectives={data.objectives}
      />
    </div>
  );
}
