export interface TargetProgress {
  targetTotal: number;
  completed: number;
  remaining: number;
  completionRate: number; // percentage (0-100)
  expectedToDate: number;
  actualRate: number; // cases per month
  variance: number; // completed - expectedToDate
  startDate: string;
  endDate: string | null;
  expectedWeeklyRate: number; // target / weeks or monthly / 4.345
}

export interface CenterTarget {
  id: string;
  hospital_id: string;
  start_date: string;
  end_date: string | null;
  target_total: number;
  target_monthly: number | null;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  notes?: string;
  created_by?: string;
}

export interface OperatorTarget {
  id: string;
  hospital_id: string;
  operator_id: string;
  center_target_id: string | null;
  start_date: string;
  end_date: string | null;
  target_total: number;
  target_monthly: number | null;
  status: 'DRAFT' | 'ACTIVE' | 'CLOSED';
  notes?: string;
  created_by?: string;
}

export interface RegistryCase {
  id: string;
  hospital_id: string;
  operator_id: string | null;
  status: string;
  is_demo: boolean;
  is_prelaunch?: boolean;
  procedure_date: string;
}

/**
 * Validates if a case counts officially towards registry metrics.
 */
export function isOfficialRegistryCase(c: RegistryCase, officialStartDate: string | null): boolean {
  if (c.status !== 'COMPLETED') return false;
  if (c.is_demo) return false;
  if (c.is_prelaunch) return false;
  
  if (officialStartDate) {
    const procDate = new Date(c.procedure_date);
    const officialDate = new Date(officialStartDate);
    if (procDate < officialDate) return false;
  }
  
  return true;
}

/**
 * Calculates progress metrics based on target definition and cases.
 */
export function calculateProgress(
  targetTotal: number,
  targetMonthly: number | null,
  startDateStr: string,
  endDateStr: string | null,
  cases: RegistryCase[]
): TargetProgress {
  const startDate = new Date(startDateStr);
  const endDate = endDateStr ? new Date(endDateStr) : null;
  const now = new Date();

  // Filter valid cases
  const validCases = cases.filter(c => {
    if (!isOfficialRegistryCase(c, null)) return false; // Basic official checks
    
    // Target date bounds
    const procDate = new Date(c.procedure_date);
    if (procDate < startDate) return false;
    if (endDate && procDate > endDate) return false;

    return true;
  });

  const completed = validCases.length;
  const remaining = Math.max(0, targetTotal - completed);
  const completionRate = targetTotal > 0 ? (completed / targetTotal) * 100 : 0;

  // Calculate expected to date (assuming linear progression)
  // If no end date, we can't easily calculate expected without target_monthly, 
  // but for simplicity we calculate based on months passed if target_monthly was provided
  // Let's use a standard time-based calculation if there's an end date.
  let expectedToDate = 0;
  
  if (endDate) {
    const totalDuration = endDate.getTime() - startDate.getTime();
    const passedDuration = now.getTime() - startDate.getTime();
    
    if (passedDuration > 0 && totalDuration > 0) {
      const timeRatio = Math.min(1, passedDuration / totalDuration);
      expectedToDate = Math.round(targetTotal * timeRatio);
    }
  }

  const variance = completed - expectedToDate;

  // Actual rate (cases per month passed)
  let actualRate = 0;
  const passedMonths = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44);
  if (passedMonths > 0) {
    actualRate = completed / passedMonths;
  }

  // Weekly rate as requested (Ritmo semanal orientativo)
  let expectedWeeklyRate = 0;
  if (endDate) {
    const weeksInPeriod = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7);
    if (weeksInPeriod > 0) expectedWeeklyRate = targetTotal / weeksInPeriod;
  } else if (targetMonthly) {
    expectedWeeklyRate = targetMonthly / 4.345;
  }

  return {
    targetTotal,
    completed,
    remaining,
    completionRate: parseFloat(completionRate.toFixed(1)),
    expectedToDate,
    actualRate: parseFloat(actualRate.toFixed(1)),
    variance,
    startDate: startDateStr,
    endDate: endDateStr,
    expectedWeeklyRate: parseFloat(expectedWeeklyRate.toFixed(1))
  };
}

/**
 * Calculates progress for a specific center.
 */
export function getCenterProgress(target: CenterTarget, allCases: RegistryCase[]): TargetProgress {
  const centerCases = allCases.filter(c => c.hospital_id === target.hospital_id);
  return calculateProgress(target.target_total, target.target_monthly, target.start_date, target.end_date, centerCases);
}

/**
 * Calculates progress for a specific operator.
 */
export function getOperatorProgress(target: OperatorTarget, allCases: RegistryCase[]): TargetProgress {
  const operatorCases = allCases.filter(c => c.operator_id === target.operator_id);
  return calculateProgress(target.target_total, target.target_monthly, target.start_date, target.end_date, operatorCases);
}
