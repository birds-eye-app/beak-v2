import { describe, expect, test } from 'vitest';
import {
  describeFilters,
  formatDate,
  formatKm,
  formatMinutes,
  formatTime,
  observerLabel,
  parsePageState,
  serializePageState,
} from '../../src/big-days/format';

describe('big days formatting', () => {
  test('dates render without timezone drift', () => {
    expect(formatDate('2025-05-10')).toBe('May 10, 2025');
    expect(formatDate('1923-09-23')).toBe('Sep 23, 1923');
    expect(formatDate(null)).toBe('');
    expect(formatDate('garbage')).toBe('garbage');
  });

  test('durations and distances', () => {
    expect(formatMinutes(786)).toBe('13h 06m');
    expect(formatMinutes(50)).toBe('50m');
    expect(formatMinutes(60)).toBe('1h 00m');
    expect(formatMinutes(null)).toBe('');
    expect(formatKm(18.938)).toBe('18.9 km');
    expect(formatKm(27.76)).toBe('27.8 km');
    expect(formatKm(123.4)).toBe('123 km');
    expect(formatKm(0.42)).toBe('0.4 km');
    expect(formatKm(undefined)).toBe('');
  });

  test('start times', () => {
    expect(formatTime('05:20:00')).toBe('5:20 AM');
    expect(formatTime('12:29:00')).toBe('12:29 PM');
    expect(formatTime('00:05:00')).toBe('12:05 AM');
    expect(formatTime(null)).toBe('');
  });

  test('observer label is the pseudonymous id', () => {
    expect(observerLabel('obsr59592')).toBe('obsr59592');
  });
});

describe('big days URL state', () => {
  test('round-trips region and filters', () => {
    const s = parsePageState('?r=US-NY-005&y=2025&m=5&solo=1');
    expect(s).toEqual({
      region: 'US-NY-005',
      filters: { year: 2025, month: 5, solo: true },
    });
    expect(serializePageState(s)).toBe('?r=US-NY-005&y=2025&m=5&solo=1');
  });

  test('defaults and rejects junk', () => {
    expect(parsePageState('')).toEqual({
      region: 'US',
      filters: { year: null, month: null, solo: false },
    });
    expect(parsePageState('?r=us-ny').region).toBe('US-NY');
    expect(parsePageState('?r=drop%20table').region).toBe('US');
    expect(parsePageState('?r=WORLD').region).toBe('WORLD');
    expect(parsePageState('?y=99&m=13').filters).toEqual({
      year: null,
      month: null,
      solo: false,
    });
    expect(
      serializePageState({
        region: 'US',
        filters: { year: null, month: null, solo: false },
      })
    ).toBe('');
  });

  test('filter description', () => {
    expect(describeFilters({ year: null, month: null, solo: false })).toBe(
      'All time'
    );
    expect(describeFilters({ year: 2025, month: 5, solo: true })).toBe(
      'May 2025 · solo'
    );
    expect(describeFilters({ year: null, month: 1, solo: false })).toBe(
      'January, any year'
    );
  });
});
