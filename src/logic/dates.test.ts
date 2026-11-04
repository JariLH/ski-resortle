import { describe, expect, it } from 'vitest';
import { addDays, berlinDateKey, daysBetween, isDateKey } from './dates.ts';

describe('berlinDateKey', () => {
  it('wechselt um 0:00 Uhr Berliner Zeit (Winterzeit, UTC+1)', () => {
    expect(berlinDateKey(new Date('2026-11-04T22:59:59Z'))).toBe('2026-11-04');
    expect(berlinDateKey(new Date('2026-11-04T23:00:00Z'))).toBe('2026-11-05');
  });

  it('wechselt um 0:00 Uhr Berliner Zeit (Sommerzeit, UTC+2)', () => {
    expect(berlinDateKey(new Date('2026-07-01T21:59:59Z'))).toBe('2026-07-01');
    expect(berlinDateKey(new Date('2026-07-01T22:00:00Z'))).toBe('2026-07-02');
  });
});

describe('addDays / daysBetween', () => {
  it('rechnet über Monats- und Jahresgrenzen', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysBetween('2026-01-01', '2026-11-04')).toBe(307);
    expect(daysBetween('2026-01-02', '2026-01-01')).toBe(-1);
  });

  it('ist unabhängig von der Zeitumstellung', () => {
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  });
});

describe('isDateKey', () => {
  it('prüft das Format', () => {
    expect(isDateKey('2026-11-04')).toBe(true);
    expect(isDateKey('2026-1-4')).toBe(false);
    expect(isDateKey(42)).toBe(false);
  });
});
