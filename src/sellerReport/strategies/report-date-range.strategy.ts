export type ReportTimeRange = 'week' | 'month' | 'year';

export interface ReportDateRangeStrategy {
  getStartDate(now: Date): Date;
  getSamplingIntervalDays(): number;
}

class WeekDateRangeStrategy implements ReportDateRangeStrategy {
  getStartDate(now: Date): Date {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return start;
  }

  getSamplingIntervalDays(): number {
    return 1;
  }
}

class MonthDateRangeStrategy implements ReportDateRangeStrategy {
  getStartDate(now: Date): Date {
    const start = new Date(now);
    start.setMonth(start.getMonth() - 1);
    return start;
  }

  getSamplingIntervalDays(): number {
    return 1;
  }
}

class YearDateRangeStrategy implements ReportDateRangeStrategy {
  getStartDate(now: Date): Date {
    const start = new Date(now);
    start.setFullYear(start.getFullYear() - 1);
    return start;
  }

  getSamplingIntervalDays(): number {
    return 30;
  }
}

export const reportDateRangeStrategies: Record<ReportTimeRange, ReportDateRangeStrategy> = {
  week: new WeekDateRangeStrategy(),
  month: new MonthDateRangeStrategy(),
  year: new YearDateRangeStrategy(),
};

export function getReportDateRangeStrategy(timeRange: ReportTimeRange): ReportDateRangeStrategy {
  return reportDateRangeStrategies[timeRange] ?? reportDateRangeStrategies.week;
}
