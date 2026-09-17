import { RegistryCase, CenterTarget, isOfficialRegistryCase } from './progress';

export interface CenterOperationalMetrics {
  targetTotal: number;
  completedCases: number;
  remainingCases: number;
  
  confirmedConsumption: number;
  pendingConsumption: number;
  monthlyConsumption: number;
  
  availableStock: number;
  reservedStock: number;
  
  weeklyConsumptionRate: number;
  coverageWeeks: number;
  
  openOrders: number;
  confirmedInbound: number;
  
  recommendedOrderQuantity: number;
}

export interface ConsumptionRecord {
  status: 'PENDING' | 'CONFIRMED' | 'ADJUSTED' | 'CANCELLED';
  quantity: number;
  consumption_date: string;
  is_prelaunch?: boolean;
}

export interface StockRecord {
  quantity_on_hand: number;
  quantity_reserved: number;
}

export interface OrderRecord {
  status: 'DRAFT' | 'REQUESTED' | 'CONFIRMED' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';
  is_prelaunch?: boolean;
}

export interface OrderItemRecord {
  order_id: string;
  quantity: number;
}

export function getCenterOperationalMetrics(
  target: CenterTarget | null,
  cases: RegistryCase[],
  consumptions: ConsumptionRecord[],
  stock: StockRecord | null,
  orders: OrderRecord[],
  orderItems: OrderItemRecord[],
  officialStartDate?: string | null
): CenterOperationalMetrics {
  const targetTotal = target?.target_total || 0;
  
  // Exclude DEMO, PRELAUNCH, non-COMPLETED cases, and enforce dates
  const validCases = cases.filter(c => {
    if (!isOfficialRegistryCase(c, officialStartDate || null)) return false;
    
    if (target) {
      const pDate = new Date(c.procedure_date || (c as any).created_at);
      const sDate = new Date(target.start_date);
      if (pDate < sDate) return false;
      
      if (target.end_date) {
        const eDate = new Date(target.end_date);
        if (pDate > eDate) return false;
      }
    }
    return true;
  });

  const completedCases = validCases.length;
  const remainingCases = Math.max(0, targetTotal - completedCases);
  
  // Consumptions
  let confirmedConsumption = 0;
  let pendingConsumption = 0;
  let monthlyConsumption = 0;
  
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  consumptions.forEach(c => {
    if (c.is_prelaunch) return; // Exclude prelaunch from official consumption metric
    
    if (c.status === 'CONFIRMED') {
      confirmedConsumption += c.quantity;
      const cDate = new Date(c.consumption_date);
      if (cDate >= thirtyDaysAgo) {
        monthlyConsumption += c.quantity;
      }
    } else if (c.status === 'PENDING') {
      pendingConsumption += c.quantity;
    }
  });

  // Stock
  const availableStock = stock ? stock.quantity_on_hand - stock.quantity_reserved : 0;
  const reservedStock = stock ? stock.quantity_reserved : 0;
  
  // Orders (exclude prelaunch)
  const officialOrders = orders.filter(o => !o.is_prelaunch);
  const openOrdersCount = officialOrders.filter(o => !['RECEIVED', 'CANCELLED', 'DRAFT'].includes(o.status)).length;
  
  let confirmedInbound = 0;
  const confirmedOrderIds = officialOrders.filter(o => o.status === 'CONFIRMED' || o.status === 'SHIPPED').map(o => (o as OrderRecord & { id: string }).id);
  
  orderItems.forEach(oi => {
    if (confirmedOrderIds.includes(oi.order_id)) {
      confirmedInbound += oi.quantity;
    }
  });

  // Weekly Rate
  // Look at confirmed consumption over the last 8 weeks to determine rate
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);
  let consumptionLast8Weeks = 0;
  let firstConsumptionDate: Date | null = null;
  
  consumptions.forEach(c => {
    if (c.is_prelaunch) return;
    if (c.status === 'CONFIRMED') {
      const cDate = new Date(c.consumption_date);
      if (cDate >= eightWeeksAgo) {
        consumptionLast8Weeks += c.quantity;
        if (firstConsumptionDate === null || cDate.getTime() < firstConsumptionDate.getTime()) {
          firstConsumptionDate = cDate;
        }
      }
    }
  });
  
  let weeklyConsumptionRate = 0;
  if (consumptionLast8Weeks > 0 && firstConsumptionDate) {
    const fcDate = firstConsumptionDate as any as Date;
    const msDiff = now.getTime() - fcDate.getTime();
    let weeksActive = Math.max(1, msDiff / (7 * 24 * 60 * 60 * 1000));
    weeksActive = Math.min(8, weeksActive);
    weeklyConsumptionRate = consumptionLast8Weeks / weeksActive;
  }
  
  // Coverage Weeks
  const coverageWeeks = weeklyConsumptionRate > 0 ? availableStock / weeklyConsumptionRate : 0;
  
  // Recommended Order (target 4 weeks of coverage)
  const coverageTargetWeeks = 4;
  const expectedNeeds = weeklyConsumptionRate * coverageTargetWeeks;
  let recommendedOrderQuantity = Math.max(0, Math.ceil(expectedNeeds - availableStock - confirmedInbound));
  
  // Cannot recommend more than the remaining target
  recommendedOrderQuantity = Math.min(recommendedOrderQuantity, remainingCases);
  
  // If target is fulfilled, don't recommend ordering
  if (remainingCases <= 0) {
    recommendedOrderQuantity = 0;
  }

  return {
    targetTotal,
    completedCases,
    remainingCases,
    confirmedConsumption,
    pendingConsumption,
    monthlyConsumption,
    availableStock,
    reservedStock,
    weeklyConsumptionRate,
    coverageWeeks,
    openOrders: openOrdersCount,
    confirmedInbound,
    recommendedOrderQuantity
  };
}
