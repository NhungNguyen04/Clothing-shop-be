export type RevenueGroupBy = 'day' | 'week' | 'month';

export interface RevenueGroupingStrategy {
  getPeriodKey(date: Date): string;
}

class DayRevenueGroupingStrategy implements RevenueGroupingStrategy {
  getPeriodKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}

class WeekRevenueGroupingStrategy implements RevenueGroupingStrategy {
  getPeriodKey(date: Date): string {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${weekNum}`;
  }
}

class MonthRevenueGroupingStrategy implements RevenueGroupingStrategy {
  getPeriodKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }
}

export const revenueGroupingStrategies: Record<RevenueGroupBy, RevenueGroupingStrategy> = {
  day: new DayRevenueGroupingStrategy(),
  week: new WeekRevenueGroupingStrategy(),
  month: new MonthRevenueGroupingStrategy(),
};

export function getRevenueGroupingStrategy(groupBy: RevenueGroupBy): RevenueGroupingStrategy {
  return revenueGroupingStrategies[groupBy] ?? revenueGroupingStrategies.day;
}
