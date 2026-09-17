'use client';

import { useState } from 'react';
export default function EconomicsClient({ cases }: { cases: any[] }) {
  const [filterHospital, setFilterHospital] = useState('ALL');
  const [filterOperator, setFilterOperator] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const filteredCases = cases.filter(c => {
    if (filterHospital !== 'ALL' && c.hospital_id !== filterHospital) return false;
    if (filterOperator !== 'ALL' && c.operator_id !== filterOperator) return false;
    if (filterStatus !== 'ALL' && c.economic_status !== filterStatus) return false;
    return true;
  });

  // Extract unique options for filters
  const hospitals = Array.from(new Set(cases.map(c => c.hospital?.name).filter(Boolean)));
  const operators = Array.from(new Set(cases.map(c => `${c.operator?.first_name} ${c.operator?.last_name}`).filter(Boolean)));

  const formatMoney = (amount: number | null) => {
    if (amount === null || amount === undefined) return '---';
    return Number(amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return <span className="px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded text-xs font-medium border border-yellow-500/20">Pendiente</span>;
      case 'READY': return <span className="px-2 py-1 bg-cyan-500/10 text-cyan-500 rounded text-xs font-medium border border-cyan-500/20">Listo</span>;
      case 'SETTLED': return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-xs font-medium border border-emerald-500/20">Liquidado</span>;
      case 'CANCELLED': return <span className="px-2 py-1 bg-rose-500/10 text-rose-500 rounded text-xs font-medium border border-rose-500/20">Cancelado</span>;
      default: return <span>{status}</span>;
    }
  };

  return (
    <div className="space-y-4 mt-8">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-xl font-semibold">Registro Económico por Caso</h2>
        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
          <select 
            className="bg-card border border-border rounded-lg px-3 py-2 text-sm"
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
          >
            <option value="ALL">Todos los Estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="READY">Listo</option>
            <option value="SETTLED">Liquidado</option>
          </select>
          {/* We'd add more complex filters here based on actual hospital IDs, 
              but for simplicity using names as a mock filter representation. 
              In a real app, map by ID. */}
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-4 py-3">Fecha / Caso</th>
                <th className="px-4 py-3">Centro / Operador</th>
                <th className="px-4 py-3">Beneficiario</th>
                <th className="px-4 py-3 text-right">Ingreso</th>
                <th className="px-4 py-3 text-right">Coste Prod.</th>
                <th className="px-4 py-3 text-right">Comp. Bruta</th>
                <th className="px-4 py-3 text-right">Margen</th>
                <th className="px-4 py-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredCases.map((c) => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(c.created_at))}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">{c.case_id.split('-')[0]}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium truncate max-w-[150px]">{c.hospital?.name || '---'}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-[150px]">Dr. {c.operator?.last_name || '---'}</div>
                  </td>
                  <td className="px-4 py-3 truncate max-w-[150px]">
                    {c.beneficiary?.display_name || <span className="text-muted-foreground italic">Sin asignar</span>}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatMoney(c.revenue_snapshot)}</td>
                  <td className="px-4 py-3 text-right text-rose-500/90">{formatMoney(c.product_cost_snapshot)}</td>
                  <td className="px-4 py-3 text-right text-rose-500/90">{formatMoney(c.gross_compensation)}</td>
                  <td className="px-4 py-3 text-right text-emerald-500 font-semibold">{formatMoney(c.gross_margin)}</td>
                  <td className="px-4 py-3 text-center">
                    {getStatusBadge(c.economic_status)}
                  </td>
                </tr>
              ))}
              
              {filteredCases.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                    No se encontraron registros económicos con estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
