import type { Resort } from '../data/resort.ts';
import { daysBetween, type DateKey } from './dates.ts';

/** Tag 0 der Rätselreihenfolge. */
export const DAY_ZERO: DateKey = '2026-01-01';
/** Fester Seed, damit alle Spieler dieselbe Reihenfolge bekommen. */
const SHUFFLE_SEED = 0x5a1e5;

/** Deterministischer Zufallsgenerator (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Gemischte Reihenfolge der IDs; unabhängig von der Reihenfolge im Datensatz. */
export function puzzleOrder(resorts: readonly Resort[], seed = SHUFFLE_SEED): string[] {
  const ids = resorts.map((r) => r.id).sort();
  const random = seededRandom(seed);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [ids[i], ids[j]] = [ids[j]!, ids[i]!];
  }
  return ids;
}

/** Gebiet des Tages: Tag n nimmt Eintrag n der gemischten Reihenfolge, danach geht es von vorne los. */
export function dailyResort(resorts: readonly Resort[], date: DateKey): Resort {
  if (resorts.length === 0) throw new Error('Keine Skigebiete vorhanden');
  const order = puzzleOrder(resorts);
  const n = order.length;
  const index = ((daysBetween(DAY_ZERO, date) % n) + n) % n;
  const id = order[index];
  const resort = resorts.find((r) => r.id === id);
  if (!resort) throw new Error(`Skigebiet ${id} nicht gefunden`);
  return resort;
}

/** Zufälliges Gebiet für den Übungsmodus. */
export function randomResort(resorts: readonly Resort[], random: () => number = Math.random): Resort {
  const resort = resorts[Math.floor(random() * resorts.length)];
  if (!resort) throw new Error('Keine Skigebiete vorhanden');
  return resort;
}
