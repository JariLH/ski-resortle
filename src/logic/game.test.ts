import { describe, expect, it } from 'vitest';
import { MAX_GUESSES, isGameState, newGame, revealResult, submitGuess, type GameState } from './game.ts';

const start = () => newGame('daily', '2026-11-04', 'target');

describe('submitGuess', () => {
  it('nimmt falsche Tipps an und spielt weiter', () => {
    const { state, outcome } = submitGuess(start(), 'a');
    expect(outcome).toBe('accepted');
    expect(state.guesses).toEqual(['a']);
    expect(state.status).toBe('playing');
  });

  it('gewinnt mit dem richtigen Tipp', () => {
    const { state } = submitGuess(submitGuess(start(), 'a').state, 'target');
    expect(state.status).toBe('won');
    expect(state.guesses).toEqual(['a', 'target']);
  });

  it('lehnt doppelte Tipps ab, ohne einen Versuch zu verbrauchen', () => {
    const first = submitGuess(start(), 'a').state;
    const { state, outcome } = submitGuess(first, 'a');
    expect(outcome).toBe('duplicate');
    expect(state).toBe(first);
  });

  it(`verliert nach ${MAX_GUESSES} falschen Tipps`, () => {
    let state: GameState = start();
    for (let i = 0; i < MAX_GUESSES; i++) {
      expect(state.status).toBe('playing');
      state = submitGuess(state, `wrong-${i}`).state;
    }
    expect(state.status).toBe('lost');
    expect(submitGuess(state, 'target').outcome).toBe('finished');
  });

  it('gewinnt auch mit dem letzten Tipp', () => {
    let state: GameState = start();
    for (let i = 0; i < MAX_GUESSES - 1; i++) state = submitGuess(state, `wrong-${i}`).state;
    state = submitGuess(state, 'target').state;
    expect(state.status).toBe('won');
  });
});

describe('revealResult', () => {
  it('beendet eine laufende Runde als verloren', () => {
    expect(revealResult(start()).status).toBe('lost');
  });

  it('ändert beendete Runden nicht', () => {
    const won = submitGuess(start(), 'target').state;
    expect(revealResult(won)).toBe(won);
  });
});

describe('isGameState', () => {
  it('erkennt gültige und ungültige Spielstände', () => {
    expect(isGameState(start())).toBe(true);
    expect(isGameState({ ...start(), status: 'foo' })).toBe(false);
    expect(isGameState({ ...start(), guesses: [1] })).toBe(false);
    expect(isGameState(null)).toBe(false);
  });
});
