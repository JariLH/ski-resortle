import { describe, expect, it } from 'vitest';
import type { Comparison } from './compare.ts';
import { flagEmoji, formatKm, shareLine, shareText } from './share.ts';

const wrong: Comparison = {
  correct: false,
  countryMatch: false,
  pisteKm: 'higher',
  lifts: 'lower',
  topElevation: 'equal',
  verticalDrop: 'higher',
  distanceKm: 1234,
};
const right: Comparison = {
  correct: true,
  countryMatch: true,
  pisteKm: 'equal',
  lifts: 'equal',
  topElevation: 'equal',
  verticalDrop: 'equal',
  distanceKm: 0,
};

describe('shareLine', () => {
  it('kodiert jeden Tipp als Emoji-Zeile mit Entfernung', () => {
    expect(shareLine(wrong)).toBe('🟥⬆️⬇️🟩⬆️ 1,234 km');
    expect(shareLine(right)).toBe('🟩🟩🟩🟩🟩');
  });
});

describe('shareText', () => {
  it('zeigt Datum, Versuche und Link bei einem Sieg', () => {
    const text = shareText({
      mode: 'daily',
      date: '2026-11-04',
      status: 'won',
      comparisons: [wrong, right],
      url: 'https://example.org/',
    });
    expect(text).toBe('Ski-Resortle 2026-11-04 2/10\n🟥⬆️⬇️🟩⬆️ 1,234 km\n🟩🟩🟩🟩🟩\nhttps://example.org/');
  });

  it('zeigt X bei einer Niederlage', () => {
    const text = shareText({ mode: 'daily', date: '2026-11-04', status: 'lost', comparisons: [wrong], url: 'u' });
    expect(text.split('\n')[0]).toBe('Ski-Resortle 2026-11-04 X/10');
  });

  it('kennzeichnet den Übungsmodus', () => {
    const text = shareText({ mode: 'practice', date: '2026-11-04', status: 'won', comparisons: [right], url: 'u' });
    expect(text.split('\n')[0]).toBe('Ski-Resortle (practice) 1/10');
  });
});

describe('formatKm / flagEmoji', () => {
  it('formatiert km mit Tausendertrennzeichen', () => {
    expect(formatKm(12345)).toBe('12,345 km');
  });

  it('wandelt Ländercodes in Flaggen um', () => {
    expect(flagEmoji('AT')).toBe('🇦🇹');
    expect(flagEmoji('ch')).toBe('🇨🇭');
    expect(flagEmoji('???')).toBe('🏳️');
  });
});
