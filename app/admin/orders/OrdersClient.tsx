'use client';

import React from 'react';

export default function OrdersClient({
  orders
}: {
  orders: { id: string, order_number: string, order_date: string, hospitals?: { name: string }, registry_order_items?: { quantity: number, registry_products?: { product_name: string } }[], expected_date?: string, received_date?: string, status: string }[];
}) {

  return (
    <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-surface-secondary border-b border-border">
            <tr>
              <th className="px-6 py-4 font-bold text-foreground">Ref.</th>
              <th className="px-6 py-4 font-bold text-foreground">Fecha</th>
              <th className="px-6 py-4 font-bold text-foreground">Centro</th>
              <th className="px-6 py-4 font-bold text-foreground text-center">Unidades</th>
              <th className="px-6 py-4 font-bold text-foreground text-center">Previsto</th>
              <th className="px-6 py-4 font-bold text-foreground text-center">Recepción</th>
              <th className="px-6 py-4 font-bold text-foreground text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map(o => {
              const totalUnits = o.registry_order_items?.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0) || 0;
              return (
                <tr key={o.id} className="hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-6 py-4 font-mono font-bold text-foreground">{o.order_number}</td>
                  <td className="px-6 py-4 text-muted-foreground">{o.order_date}</td>
                  <td className="px-6 py-4 text-muted-foreground">{o.hospitals?.name}</td>
                  <td className="px-6 py-4 text-center font-bold">{totalUnits}</td>
                  <td className="px-6 py-4 text-center text-muted-foreground">{o.expected_date || '-'}</td>
                  <td className="px-6 py-4 text-center text-muted-foreground">{o.received_date || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider ${
                      o.status === 'RECEIVED' ? 'bg-emerald-950/50 text-emerald-400' :
                      o.status === 'SHIPPED' ? 'bg-cyan-950/50 text-cyan-400' :
                      o.status === 'CONFIRMED' ? 'bg-indigo-950/50 text-indigo-400' :
                      o.status === 'CANCELLED' ? 'bg-red-950/50 text-red-400' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                  No hay pedidos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
