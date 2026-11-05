import { describe, expect, it } from 'vitest';
import {
  challengeFromGame,
  challengeMessage,
  challengeUrl,
  challengeWinner,
  decodeChallenge,
  encodeChallenge,
  type Challenge,
} from './challenge.ts';
import { newGame, revealResult, submitGuess } from './game.ts';

const daily: Challenge = {
  mode: 'daily',
  date: '2026-11-05',
  targetId: 'skiwelt',
  guesses: ['ski-arlberg', 'les-3-vallees', 'skiwelt'],
  won: true,
};

describe('Challenge-Link', () => {
  it('kodiert und dekodiert verlustfrei', () => {
    expect(decodeChallenge(encodeChallenge(daily))).toEqual(daily);
    const practice: Challenge = { ...daily, mode: 'practice', won: false, guesses: ['zürs-ä'] };
    expect(decodeChallenge(encodeChallenge(practice))).toEqual(practice);
  });

  it('erzeugt URL-sichere Codes', () => {
    expect(encodeChallenge(daily)).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('verschleiert die Daten: einfaches Base64-Dekodieren verrät die Lösung nicht', () => {
    const code = encodeChallenge(daily);
    const plain = atob(code.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (code.length % 4)) % 4));
    expect(plain).not.toContain('skiwelt');
    expect(plain).not.toContain('2026-11-05');
    // Unverschleiertes Base64 wird nicht als Challenge akzeptiert
    const unobfuscated = btoa(JSON.stringify({ v: 1, m: 'd', d: '2026-11-05', t: 'x', g: [], w: 0 }));
    expect(decodeChallenge(unobfuscated)).toBeNull();
  });

  it('baut den Link je nach Modus', () => {
    expect(challengeUrl('https://x.org/', daily)).toMatch(/^https:\/\/x\.org\/#\/play\?challenge=[A-Za-z0-9_-]+$/);
    expect(challengeUrl('https://x.org/', { ...daily, mode: 'practice' })).toContain('#/practice?challenge=');
  });

  it('lehnt ungültige Codes ab', () => {
    expect(decodeChallenge('')).toBeNull();
    expect(decodeChallenge('%%%')).toBeNull();
    expect(decodeChallenge(btoa('{"v":2}'))).toBeNull();
    const tooMany = encodeChallenge({ ...daily, guesses: Array.from({ length: 11 }, (_, i) => `r${i}`) });
    expect(decodeChallenge(tooMany)).toBeNull();
  });

  it('übernimmt das Ergebnis einer beendeten Runde', () => {
    let state = newGame('daily', '2026-11-05', 'target');
    state = submitGuess(state, 'a').state;
    state = submitGuess(state, 'target').state;
    expect(challengeFromGame(state)).toEqual({
      mode: 'daily',
      date: '2026-11-05',
      targetId: 'target',
      guesses: ['a', 'target'],
      won: true,
    });
    expect(challengeFromGame(revealResult(newGame('practice', '2026-11-05', 't'))).won).toBe(false);
  });
});

describe('challengeMessage', () => {
  it('nennt das Ergebnis ohne Spoiler', () => {
    expect(challengeMessage(daily)).toBe("I solved today's Ski-Resortle in 3 guesses. Can you beat me?");
    expect(challengeMessage({ ...daily, guesses: ['skiwelt'] })).toBe(
      "I solved today's Ski-Resortle in 1 guess. Can you beat me?",
    );
    expect(challengeMessage({ ...daily, won: false })).toBe("I couldn't solve today's Ski-Resortle. Can you?");
    expect(challengeMessage({ ...daily, mode: 'practice' })).toContain('this Ski-Resortle');
  });
});

describe('challengeWinner', () => {
  const won = (guesses: number) => ({ won: true, guesses });
  const lost = (guesses: number) => ({ won: false, guesses });

  it('vergleicht die Anzahl der Tipps, wenn beide gelöst haben', () => {
    expect(challengeWinner(won(4), won(6))).toBe('you');
    expect(challengeWinner(won(5), won(4))).toBe('challenger');
    expect(challengeWinner(won(3), won(3))).toBe('tie');
  });

  it('behandelt nicht gelöste Runden', () => {
    expect(challengeWinner(won(9), lost(10))).toBe('you');
    expect(challengeWinner(lost(3), won(10))).toBe('challenger');
    expect(challengeWinner(lost(3), lost(10))).toBe('tie');
  });
});
