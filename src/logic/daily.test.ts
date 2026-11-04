import { describe, expect, it } from 'vitest';
import { addDays } from './dates.ts';
import { DAY_ZERO, dailyResort, puzzleOrder, randomResort } from './daily.ts';
import { TEST_RESORTS } from './testResorts.ts';

describe('puzzleOrder', () => {
  it('enthält jedes Gebiet genau einmal', () => {
    const order = puzzleOrder(TEST_RESORTS);
    expect([...order].sort()).toEqual(TEST_RESORTS.map((r) => r.id).sort());
  });

  it('hängt nicht von der Reihenfolge im Datensatz ab', () => {
    expect(puzzleOrder([...TEST_RESORTS].reverse())).toEqual(puzzleOrder(TEST_RESORTS));
  });
});

describe('dailyResort', () => {
  it('ist für ein Datum immer gleich', () => {
    expect(dailyResort(TEST_RESORTS, '2026-11-04')).toBe(dailyResort(TEST_RESORTS, '2026-11-04'));
  });

  it('wiederholt kein Gebiet, bevor alle einmal dran waren', () => {
    const n = TEST_RESORTS.length;
    const ids = Array.from({ length: n }, (_, i) => dailyResort(TEST_RESORTS, addDays(DAY_ZERO, i)).id);
    expect(new Set(ids).size).toBe(n);
    expect(dailyResort(TEST_RESORTS, addDays(DAY_ZERO, n)).id).toBe(ids[0]);
  });

  it('funktioniert auch vor Tag 0', () => {
    expect(() => dailyResort(TEST_RESORTS, '2025-06-01')).not.toThrow();
  });

  it('wirft bei leerem Datensatz', () => {
    expect(() => dailyResort([], '2026-11-04')).toThrow();
  });
});

describe('randomResort', () => {
  it('nutzt den übergebenen Zufall', () => {
    expect(randomResort(TEST_RESORTS, () => 0)).toBe(TEST_RESORTS[0]);
    expect(randomResort(TEST_RESORTS, () => 0.999)).toBe(TEST_RESORTS[TEST_RESORTS.length - 1]);
  });
});
