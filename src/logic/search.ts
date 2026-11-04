import type { Resort } from '../data/resort.ts';

/** Vereinheitlicht Eingaben: Kleinschreibung, ohne Akzente, Sonderzeichen als Leerzeichen. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function sortByName(resorts: readonly Resort[]): Resort[] {
  return [...resorts].sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
}

/**
 * Vorschläge zur Eingabe. Leere Eingabe: alle Gebiete alphabetisch.
 * Sonst: Namen, die die Eingabe enthalten; Treffer am Namensanfang zuerst.
 */
export function suggest(query: string, resorts: readonly Resort[]): Resort[] {
  const q = normalize(query);
  const sorted = sortByName(resorts);
  if (q === '') return sorted;
  const prefix: Resort[] = [];
  const contains: Resort[] = [];
  for (const resort of sorted) {
    const name = normalize(resort.name);
    if (name.startsWith(q)) prefix.push(resort);
    else if (name.includes(q)) contains.push(resort);
  }
  return [...prefix, ...contains];
}

export type Resolution =
  | { kind: 'empty' }
  | { kind: 'exact'; resort: Resort }
  | { kind: 'alias'; resort: Resort }
  | { kind: 'unknown' };

/** Ordnet eine abgesendete Eingabe einem Gebiet zu. Namen haben Vorrang vor Aliasen. */
export function resolveInput(text: string, resorts: readonly Resort[]): Resolution {
  const q = normalize(text);
  if (q === '') return { kind: 'empty' };
  const byName = resorts.find((r) => normalize(r.name) === q);
  if (byName) return { kind: 'exact', resort: byName };
  const byAlias = resorts.find((r) => r.aliases.some((alias) => normalize(alias) === q));
  if (byAlias) return { kind: 'alias', resort: byAlias };
  return { kind: 'unknown' };
}
