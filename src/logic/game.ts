import type { DateKey } from './dates.ts';

export const MAX_GUESSES = 10;

export type GameMode = 'daily' | 'practice';
/** „lost“ gilt sowohl für 10 Fehlversuche als auch für „show result“. */
export type GameStatus = 'playing' | 'won' | 'lost';

export interface GameState {
  mode: GameMode;
  date: DateKey;
  targetId: string;
  /** IDs der getippten Gebiete in Reihenfolge. */
  guesses: string[];
  status: GameStatus;
}

export type GuessOutcome = 'accepted' | 'duplicate' | 'finished';

export function newGame(mode: GameMode, date: DateKey, targetId: string): GameState {
  return { mode, date, targetId, guesses: [], status: 'playing' };
}

export function submitGuess(state: GameState, resortId: string): { state: GameState; outcome: GuessOutcome } {
  if (state.status !== 'playing') return { state, outcome: 'finished' };
  if (state.guesses.includes(resortId)) return { state, outcome: 'duplicate' };
  const guesses = [...state.guesses, resortId];
  let status: GameStatus = 'playing';
  if (resortId === state.targetId) status = 'won';
  else if (guesses.length >= MAX_GUESSES) status = 'lost';
  return { state: { ...state, guesses, status }, outcome: 'accepted' };
}

/** „show result“: Lösung zeigen und Runde als nicht gelöst beenden. */
export function revealResult(state: GameState): GameState {
  if (state.status !== 'playing') return state;
  return { ...state, status: 'lost' };
}

export function isGameState(value: unknown): value is GameState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    (v.mode === 'daily' || v.mode === 'practice') &&
    typeof v.date === 'string' &&
    typeof v.targetId === 'string' &&
    Array.isArray(v.guesses) &&
    v.guesses.every((g) => typeof g === 'string') &&
    (v.status === 'playing' || v.status === 'won' || v.status === 'lost')
  );
}
