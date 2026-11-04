/** Datumsschlüssel im Format YYYY-MM-DD. */
export type DateKey = string;

const MS_PER_DAY = 86_400_000;

/** Aktuelles Datum in Berlin; das Tagesrätsel wechselt um 0:00 Uhr Berliner Zeit. */
export function berlinDateKey(now: Date): DateKey {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function toUtcMs(key: DateKey): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y ?? NaN, (m ?? NaN) - 1, d ?? NaN);
}

function fromUtcMs(ms: number): DateKey {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(key: DateKey, days: number): DateKey {
  return fromUtcMs(toUtcMs(key) + days * MS_PER_DAY);
}

/** Anzahl Tage von `from` bis `to` (negativ, wenn `to` früher liegt). */
export function daysBetween(from: DateKey, to: DateKey): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / MS_PER_DAY);
}

export function isDateKey(value: unknown): value is DateKey {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(toUtcMs(value));
}
