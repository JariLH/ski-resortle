import { describe, expect, it } from 'vitest';
import { EMPTY_STREAK, displayedStreak, isStreakState, recordLoss, recordWin } from './streak.ts';

describe('Serie', () => {
  it('beginnt mit 1 beim ersten Sieg', () => {
    expect(recordWin(EMPTY_STREAK, '2026-11-04')).toEqual({ current: 1, lastSolved: '2026-11-04' });
  });

  it('zählt an aufeinanderfolgenden Tagen hoch', () => {
    let s = recordWin(EMPTY_STREAK, '2026-11-03');
    s = recordWin(s, '2026-11-04');
    s = recordWin(s, '2026-11-05');
    expect(s.current).toBe(3);
  });

  it('zählt denselben Tag nur einmal', () => {
    const s = recordWin(EMPTY_STREAK, '2026-11-04');
    expect(recordWin(s, '2026-11-04')).toBe(s);
  });

  it('beginnt nach einem ausgelassenen Tag von vorne', () => {
    let s = recordWin(EMPTY_STREAK, '2026-11-01');
    s = recordWin(s, '2026-11-03');
    expect(s.current).toBe(1);
  });

  it('wird bei einer Niederlage auf 0 gesetzt', () => {
    let s = recordWin(EMPTY_STREAK, '2026-11-03');
    s = recordLoss(s);
    expect(displayedStreak(s, '2026-11-04')).toBe(0);
    s = recordWin(s, '2026-11-05');
    expect(s.current).toBe(1);
  });

  it('bleibt sichtbar, solange gestern gelöst wurde', () => {
    const s = recordWin(recordWin(EMPTY_STREAK, '2026-11-02'), '2026-11-03');
    expect(displayedStreak(s, '2026-11-03')).toBe(2);
    expect(displayedStreak(s, '2026-11-04')).toBe(2);
    expect(displayedStreak(s, '2026-11-05')).toBe(0);
  });

  it('prüft gespeicherte Werte', () => {
    expect(isStreakState({ current: 2, lastSolved: '2026-11-04' })).toBe(true);
    expect(isStreakState({ current: -1, lastSolved: null })).toBe(false);
    expect(isStreakState({ current: 1, lastSolved: 'gestern' })).toBe(false);
  });
});
