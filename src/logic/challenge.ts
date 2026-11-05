// „Challenge a friend“: Das Ergebnis des Herausforderers steckt im Link,
// weil die Seite kein Backend hat.
import { seededRandom } from './daily.ts';
import { isDateKey, type DateKey } from './dates.ts';
import { guessesText } from './format.ts';
import { MAX_GUESSES, type GameMode, type GameState } from './game.ts';

export interface Challenge {
  mode: GameMode;
  date: DateKey;
  /** Gespieltes Gebiet; wichtig für den Übungsmodus, dessen Gebiet zufällig ist */
  targetId: string;
  guesses: string[];
  won: boolean;
}

export const CHALLENGE_PARAM = 'challenge';

/** Ergebnis einer beendeten Runde als Challenge. */
export function challengeFromGame(state: GameState): Challenge {
  return {
    mode: state.mode,
    date: state.date,
    targetId: state.targetId,
    guesses: state.guesses,
    won: state.status === 'won',
  };
}

interface Payload {
  v: 1;
  m: 'd' | 'p';
  d: string;
  t: string;
  g: string[];
  w: 0 | 1;
}

// Verschleierung: XOR mit einem festen Pseudozufalls-Strom, damit die Lösung nicht
// durch einfaches Base64-Dekodieren lesbar ist. Kein echter Schutz (ohne Backend nicht möglich).
const OBFUSCATION_SEED = 0x2b5e1f7;

function xorStream(bytes: Uint8Array): Uint8Array {
  const random = seededRandom(OBFUSCATION_SEED);
  return bytes.map((b) => b ^ Math.floor(random() * 256));
}

function toBase64Url(text: string): string {
  const bytes = xorStream(new TextEncoder().encode(text));
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(code: string): string {
  const base64 = code.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  const bytes = xorStream(Uint8Array.from(binary, (ch) => ch.charCodeAt(0)));
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export function encodeChallenge(c: Challenge): string {
  const payload: Payload = {
    v: 1,
    m: c.mode === 'daily' ? 'd' : 'p',
    d: c.date,
    t: c.targetId,
    g: c.guesses,
    w: c.won ? 1 : 0,
  };
  return toBase64Url(JSON.stringify(payload));
}

/** Liest eine Challenge aus dem Link; `null` bei ungültigen oder manipulierten Daten. */
export function decodeChallenge(code: string): Challenge | null {
  let payload: unknown;
  try {
    payload = JSON.parse(fromBase64Url(code));
  } catch {
    return null;
  }
  if (typeof payload !== 'object' || payload === null) return null;
  const p = payload as Record<string, unknown>;
  const guesses = p.g;
  if (
    p.v !== 1 ||
    (p.m !== 'd' && p.m !== 'p') ||
    !isDateKey(p.d) ||
    typeof p.t !== 'string' ||
    !Array.isArray(guesses) ||
    guesses.length > MAX_GUESSES ||
    !guesses.every((g) => typeof g === 'string') ||
    (p.w !== 0 && p.w !== 1)
  ) {
    return null;
  }
  return {
    mode: p.m === 'd' ? 'daily' : 'practice',
    date: p.d,
    targetId: p.t,
    guesses: guesses as string[],
    won: p.w === 1,
  };
}

/** Link zum Teilen, z. B. https://…/#/play?challenge=… */
export function challengeUrl(baseUrl: string, c: Challenge): string {
  const route = c.mode === 'daily' ? '/play' : '/practice';
  return `${baseUrl}#${route}?${CHALLENGE_PARAM}=${encodeChallenge(c)}`;
}

/** Text, der zusammen mit dem Link geteilt wird (ohne Spoiler). */
export function challengeMessage(c: Challenge): string {
  const puzzle = c.mode === 'daily' ? "today's Ski-Resortle" : 'this Ski-Resortle';
  return c.won
    ? `I solved ${puzzle} in ${guessesText(c.guesses.length)}. Can you beat me?`
    : `I couldn't solve ${puzzle}. Can you?`;
}

export interface PlayerResult {
  won: boolean;
  guesses: number;
}

export type Winner = 'you' | 'challenger' | 'tie';

export function challengeWinner(you: PlayerResult, challenger: PlayerResult): Winner {
  if (you.won && challenger.won) {
    if (you.guesses === challenger.guesses) return 'tie';
    return you.guesses < challenger.guesses ? 'you' : 'challenger';
  }
  if (you.won) return 'you';
  if (challenger.won) return 'challenger';
  return 'tie';
}
