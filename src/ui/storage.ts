import { isGameState, type GameState } from '../logic/game.ts';
import { EMPTY_STREAK, isStreakState, type StreakState } from '../logic/streak.ts';

const DAILY_KEY = 'ski-resortle:daily';
const STREAK_KEY = 'ski-resortle:streak';

// localStorage kann fehlen oder werfen (privater Modus, blockierte Website-Daten).
function read(key: string): unknown {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Speichern ist optional, das Spiel läuft trotzdem.
  }
}

/** Gespeicherte Tagesrunde, nur wenn sie zum angegebenen Tag gehört. */
export function loadDailyGame(date: string): GameState | null {
  const value = read(DAILY_KEY);
  return isGameState(value) && value.mode === 'daily' && value.date === date ? value : null;
}

export function saveDailyGame(state: GameState): void {
  if (state.mode === 'daily') write(DAILY_KEY, state);
}

export function loadStreak(): StreakState {
  const value = read(STREAK_KEY);
  return isStreakState(value) ? value : EMPTY_STREAK;
}

export function saveStreak(streak: StreakState): void {
  write(STREAK_KEY, streak);
}
