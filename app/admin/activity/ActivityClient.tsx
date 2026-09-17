'use client';

import React from 'react';
import { getCenterOperationalMetrics } from '@/lib/metrics/operational';
import type { CenterTarget, RegistryCase } from '@/lib/metrics/progress';
import type { ConsumptionRecord, StockRecord, OrderRecord, OrderItemRecord } from '@/lib/metrics/operational';

export default function ActivityClient({
  hospitals,
  centerTargets,
  cases,
  consumptions,
  stock,
  orders,
  orderItems,
  registrySettings
}: {
  hospitals: { id: string; name: string }[];
  centerTargets: CenterTarget[];
  cases: RegistryCase[];
  consumptions: (ConsumptionRecord & { hospital_id: string })[];
  stock: (StockRecord & { hospital_id: string })[];
  orders: (OrderRecord & { hospital_id: string; id: string })[];
  orderItems: OrderItemRecord[];
  registrySettings: any;
}) {

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 font-bold text-foreground">Centro</th>
              <th className="px-6 py-4 font-bold text-foreground text-center">Objetivo</th>
              <th className="px-6 py-4 font-bold text-foreground text-center">Completados</th>
              <th className="px-6 py-4 font-bold text-foreground text-center">Restantes</th>
              <th className="px-6 py-4 font-bold text-foreground text-center">Consumo (Mes)</th>
              <th className="px-6 py-4 font-bold text-foreground text-center">Stock Disp.</th>
              <th className="px-6 py-4 font-bold text-foreground text-center">Cobertura</th>
              <th className="px-6 py-4 font-bold text-foreground text-center">Inbound</th>
              <th className="px-6 py-4 font-bold text-foreground text-center">Pedido Rec.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {hospitals.map(hospital => {
              const hTarget = centerTargets.find(t => t.hospital_id === hospital.id) || null;
              const hCases = cases.filter(c => c.hospital_id === hospital.id);
              const hConsumptions = consumptions.filter(c => c.hospital_id === hospital.id);
              const hStock = stock.find(s => s.hospital_id === hospital.id) || null;
              const hOrders = orders.filter(o => o.hospital_id === hospital.id);
              
              const metrics = getCenterOperationalMetrics(hTarget, hCases, hConsumptions, hStock, hOrders, orderItems, registrySettings?.official_start_date);

              return (
                <tr key={hospital.id} className="hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{hospital.name}</td>
                  <td className="px-6 py-4 text-center text-muted-foreground">{metrics.targetTotal > 0 ? metrics.targetTotal : '-'}</td>
                  <td className="px-6 py-4 text-center font-bold text-emerald-500">{metrics.completedCases}</td>
                  <td className="px-6 py-4 text-center text-muted-foreground">{metrics.remainingCases}</td>
                  <td className="px-6 py-4 text-center text-muted-foreground">{metrics.monthlyConsumption}</td>
                  <td className="px-6 py-4 text-center font-bold text-cyan-500">{metrics.availableStock}</td>
                  <td className="px-6 py-4 text-center">
                    {metrics.coverageWeeks > 0 ? (
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        metrics.coverageWeeks < 2 ? 'bg-red-950/50 text-red-400' :
                        metrics.coverageWeeks < 4 ? 'bg-orange-950/50 text-orange-400' :
                        'bg-emerald-950/50 text-emerald-400'
                      }`}>
                        {metrics.coverageWeeks.toFixed(1)} sem
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-muted-foreground">{metrics.confirmedInbound > 0 ? `+${metrics.confirmedInbound}` : '-'}</td>
                  <td className="px-6 py-4 text-center">
                    {metrics.recommendedOrderQuantity > 0 ? (
                      <span className="px-2 py-1 rounded bg-indigo-950/50 text-indigo-400 text-xs font-bold border border-indigo-800/30">
                        {metrics.recommendedOrderQuantity} ud
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
