import { getReportDateRangeStrategy } from './report-date-range.strategy';
import { getRevenueGroupingStrategy } from './revenue-grouping.strategy';

describe('seller report strategies', () => {
  it('calculates report start dates by range', () => {
    const now = new Date('2026-06-04T00:00:00.000Z');

    expect(getReportDateRangeStrategy('week').getStartDate(now).toISOString()).toBe('2026-05-28T00:00:00.000Z');
    expect(getReportDateRangeStrategy('month').getStartDate(now).toISOString()).toBe('2026-05-04T00:00:00.000Z');
    expect(getReportDateRangeStrategy('year').getStartDate(now).toISOString()).toBe('2025-06-04T00:00:00.000Z');
  });

  it('selects sampling intervals by range', () => {
    expect(getReportDateRangeStrategy('week').getSamplingIntervalDays()).toBe(1);
    expect(getReportDateRangeStrategy('month').getSamplingIntervalDays()).toBe(1);
    expect(getReportDateRangeStrategy('year').getSamplingIntervalDays()).toBe(30);
  });

  it('groups revenue periods by selected algorithm', () => {
    const date = new Date('2026-06-04T00:00:00.000Z');

    expect(getRevenueGroupingStrategy('day').getPeriodKey(date)).toBe('2026-06-04');
    expect(getRevenueGroupingStrategy('week').getPeriodKey(date)).toBe('2026-W23');
    expect(getRevenueGroupingStrategy('month').getPeriodKey(date)).toBe('2026-06');
  });
});
