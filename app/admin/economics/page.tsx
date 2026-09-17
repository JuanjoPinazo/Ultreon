import { getCaseEconomicsAction } from '@/lib/supabase/actions';
import { calculateEconomicMetrics } from '@/lib/metrics/economics';
import EconomicsClient from './EconomicsClient';
import { redirect } from 'next/navigation';

export default async function AdminEconomicsPage() {
  const result = await getCaseEconomicsAction();
  
  if (result.error) {
    redirect('/admin');
  }

  const economicsData = result.data || [];
  const metrics = calculateEconomicMetrics(economicsData);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión Económica</h1>
        <p className="text-muted-foreground mt-2">
          Visión global de compensaciones, costes, ingresos y ROI del registro.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Cards */}
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Casos Económicos</span>
          <span className="text-3xl font-bold">{metrics.cases}</span>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Ingresos (Revenue)</span>
          <span className="text-3xl font-bold">{metrics.revenue.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Margen Bruto</span>
          <span className="text-3xl font-bold text-emerald-500">{metrics.grossMargin.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">ROI Global</span>
          <span className="text-3xl font-bold text-cyan-500">{metrics.roi.toFixed(2)}%</span>
        </div>
        
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Coste Producto</span>
          <span className="text-xl font-semibold text-rose-500">{metrics.productCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Compensaciones</span>
          <span className="text-xl font-semibold text-rose-500">{metrics.compensation.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Inversión Total</span>
          <span className="text-xl font-semibold text-rose-500">{metrics.investmentTotal.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
        </div>
        <div className="p-6 bg-card rounded-xl border border-border shadow-sm flex flex-col gap-2">
          <span className="text-sm font-medium text-muted-foreground">Margen / Caso</span>
          <span className="text-xl font-semibold text-emerald-500">{metrics.marginPerCase.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
        </div>
      </div>

      <EconomicsClient cases={economicsData} />
    </div>
  );
}
