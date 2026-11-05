export function formatKm(km: number): string {
  return `${km.toLocaleString('en-US')} km`;
}

/** „1 guess“, „2 guesses“ */
export function guessesText(count: number): string {
  return `${count} ${count === 1 ? 'guess' : 'guesses'}`;
}

/** Ländercode → Flaggen-Emoji, z. B. „AT“ → 🇦🇹. */
export function flagEmoji(countryCode: string): string {
  const code = countryCode.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return '🏳️';
  return String.fromCodePoint(...[...code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}
