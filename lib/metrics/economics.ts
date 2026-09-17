// lib/metrics/economics.ts

export interface CaseEconomicsRecord {
  id: string;
  case_id: string;
  hospital_id: string;
  operator_id: string;
  beneficiary_id: string | null;
  revenue_snapshot: number | null;
  product_cost_snapshot: number | null;
  gross_compensation: number | null;
  withholding_rate_snapshot: number | null;
  withholding_amount: number | null;
  net_compensation: number | null;
  other_variable_costs: number;
  gross_margin: number | null;
  economic_status: 'PENDING' | 'READY' | 'SETTLED' | 'CANCELLED';
  created_at: string;
}

export interface EconomicMetrics {
  cases: number;
  revenue: number;
  productCost: number;
  compensation: number;
  otherCosts: number;
  grossMargin: number;
  marginPerCase: number;
  investmentPerCase: number;
  investmentTotal: number;
  roi: number;
}

export function calculateEconomicMetrics(cases: CaseEconomicsRecord[]): EconomicMetrics {
  const metrics: EconomicMetrics = {
    cases: cases.length,
    revenue: 0,
    productCost: 0,
    compensation: 0,
    otherCosts: 0,
    grossMargin: 0,
    marginPerCase: 0,
    investmentPerCase: 0,
    investmentTotal: 0,
    roi: 0,
  };

  if (cases.length === 0) return metrics;

  cases.forEach(record => {
    metrics.revenue += Number(record.revenue_snapshot || 0);
    metrics.productCost += Number(record.product_cost_snapshot || 0);
    metrics.compensation += Number(record.gross_compensation || 0);
    metrics.otherCosts += Number(record.other_variable_costs || 0);
    // Explicitly calculate margin to ensure consistency
    metrics.grossMargin += (
      Number(record.revenue_snapshot || 0) -
      Number(record.product_cost_snapshot || 0) -
      Number(record.gross_compensation || 0) -
      Number(record.other_variable_costs || 0)
    );
  });

  metrics.investmentTotal = metrics.productCost + metrics.compensation + metrics.otherCosts;
  
  if (metrics.cases > 0) {
    metrics.marginPerCase = metrics.grossMargin / metrics.cases;
    metrics.investmentPerCase = metrics.investmentTotal / metrics.cases;
  }

  // ROI = Profit (Gross Margin) / Investment
  if (metrics.investmentTotal > 0) {
    metrics.roi = (metrics.grossMargin / metrics.investmentTotal) * 100;
  }

  return metrics;
}

export interface SettlementRecord {
  id: string;
  beneficiary_id: string;
  period_year: number;
  period_month: number;
  status: 'DRAFT' | 'REVIEWED' | 'APPROVED' | 'PAID' | 'CANCELLED';
  gross_total: number;
  withholding_total: number;
  net_total: number;
  case_count: number;
  created_at: string;
}
