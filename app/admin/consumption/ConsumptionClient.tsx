'use client';

import React from 'react';

export default function ConsumptionClient({
  consumptions
}: {
  consumptions: { id: string, consumption_date: string, ultreon_registry_cases?: { anonymous_code: string }, hospitals?: { name: string }, operators?: { first_name: string, last_name: string }, registry_products?: { product_name: string }, quantity: number, unit_cost_snapshot: number, status: string }[];
}) {

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 font-bold text-foreground">Fecha</th>
              <th className="px-6 py-4 font-bold text-foreground">Caso</th>
              <th className="px-6 py-4 font-bold text-foreground">Centro</th>
              <th className="px-6 py-4 font-bold text-foreground">Operador</th>
              <th className="px-6 py-4 font-bold text-foreground">Producto</th>
              <th className="px-6 py-4 font-bold text-foreground text-center">Cant.</th>
              <th className="px-6 py-4 font-bold text-foreground text-center">Coste Snapshot</th>
              <th className="px-6 py-4 font-bold text-foreground text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {consumptions.map(c => (
              <tr key={c.id} className="hover:bg-surface-secondary/50 transition-colors">
                <td className="px-6 py-4 text-muted-foreground">{c.consumption_date}</td>
                <td className="px-6 py-4 font-bold text-foreground">{c.ultreon_registry_cases?.anonymous_code || 'N/A'}</td>
                <td className="px-6 py-4 text-muted-foreground">{c.hospitals?.name}</td>
                <td className="px-6 py-4 text-muted-foreground">{c.operators?.first_name} {c.operators?.last_name}</td>
                <td className="px-6 py-4 text-muted-foreground">{c.registry_products?.product_name}</td>
                <td className="px-6 py-4 text-center font-bold">{c.quantity}</td>
                <td className="px-6 py-4 text-center text-muted-foreground">
                  {c.unit_cost_snapshot ? `${c.unit_cost_snapshot} €` : '-'}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    c.status === 'CONFIRMED' ? 'bg-emerald-950/50 text-emerald-400' :
                    c.status === 'PENDING' ? 'bg-orange-950/50 text-orange-400' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
            {consumptions.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-muted-foreground">
                  No hay consumos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
