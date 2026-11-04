import { addDays, isDateKey, type DateKey } from './dates.ts';

export interface StreakState {
  /** Länge der Serie zum Zeitpunkt von `lastSolved`. */
  current: number;
  /** Letzter Tag, an dem das Tagesrätsel gelöst wurde. */
  lastSolved: DateKey | null;
}

export const EMPTY_STREAK: StreakState = { current: 0, lastSolved: null };

export function recordWin(streak: StreakState, date: DateKey): StreakState {
  if (streak.lastSolved === date) return streak;
  const continues = streak.lastSolved === addDays(date, -1);
  return { current: continues ? streak.current + 1 : 1, lastSolved: date };
}

export function recordLoss(streak: StreakState): StreakState {
  return { ...streak, current: 0 };
}

/** Angezeigte Serie: gilt, solange gestern oder heute gelöst wurde. */
export function displayedStreak(streak: StreakState, today: DateKey): number {
  if (streak.lastSolved === today || streak.lastSolved === addDays(today, -1)) return streak.current;
  return 0;
}

export function isStreakState(value: unknown): value is StreakState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.current === 'number' &&
    Number.isInteger(v.current) &&
    v.current >= 0 &&
    (v.lastSolved === null || isDateKey(v.lastSolved))
  );
}
