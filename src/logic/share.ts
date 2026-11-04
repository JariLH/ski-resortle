import type { Comparison, Direction } from './compare.ts';
import { MAX_GUESSES, type GameMode, type GameStatus } from './game.ts';

const DIRECTION_EMOJI: Record<Direction, string> = {
  higher: '⬆️',
  lower: '⬇️',
  equal: '🟩',
};

export function formatKm(km: number): string {
  return `${km.toLocaleString('en-US')} km`;
}

/** Eine Emoji-Zeile pro Tipp, ohne Namen (kein Spoiler). */
export function shareLine(c: Comparison): string {
  const cells = [
    c.countryMatch ? '🟩' : '🟥',
    DIRECTION_EMOJI[c.pisteKm],
    DIRECTION_EMOJI[c.lifts],
    DIRECTION_EMOJI[c.topElevation],
    DIRECTION_EMOJI[c.verticalDrop],
  ].join('');
  return c.correct ? cells : `${cells} ${formatKm(c.distanceKm)}`;
}

export interface ShareInput {
  mode: GameMode;
  date: string;
  status: GameStatus;
  comparisons: Comparison[];
  url: string;
}

export function shareText({ mode, date, status, comparisons, url }: ShareInput): string {
  const score = status === 'won' ? String(comparisons.length) : 'X';
  const title = mode === 'daily' ? `Ski-Resortle ${date}` : 'Ski-Resortle (practice)';
  return [`${title} ${score}/${MAX_GUESSES}`, ...comparisons.map(shareLine), url].join('\n');
}

/** Ländercode → Flaggen-Emoji, z. B. „AT“ → 🇦🇹. */
export function flagEmoji(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '🏳️';
  return String.fromCodePoint(...[...code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}
