import { describe, expect, it } from 'vitest';
import { flagEmoji, formatKm, guessesText } from './format.ts';

describe('formatKm', () => {
  it('formatiert km mit Tausendertrennzeichen', () => {
    expect(formatKm(0)).toBe('0 km');
    expect(formatKm(12345)).toBe('12,345 km');
  });
});

describe('guessesText', () => {
  it('nutzt Singular und Plural', () => {
    expect(guessesText(1)).toBe('1 guess');
    expect(guessesText(4)).toBe('4 guesses');
  });
});

describe('flagEmoji', () => {
  it('wandelt Ländercodes in Flaggen um', () => {
    expect(flagEmoji('AT')).toBe('🇦🇹');
    expect(flagEmoji('ch')).toBe('🇨🇭');
    expect(flagEmoji('???')).toBe('🏳️');
  });
});
