import { describe, expect, it } from 'vitest';
import { normalize } from '../logic/search.ts';
import { ID_LENGTH, MIN_LIFTS, MIN_PISTE_KM } from './import/transform.ts';
import { OVERRIDES } from './overrides.ts';
import { DATA_DATE, RESORTS } from './resorts.ts';

// Plausibilitätsprüfung des Datensatzes, damit fehlerhafte Daten im CI auffallen.
describe('RESORTS', () => {
  it('ist nicht leer', () => {
    expect(RESORTS.length).toBeGreaterThan(0);
  });

  it('hat eindeutige IDs', () => {
    const ids = RESORTS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('hat eindeutige Namen, und kein Alias gleicht einem Namen', () => {
    const names = RESORTS.map((r) => normalize(r.name));
    expect(new Set(names).size).toBe(names.length);
    const aliases = RESORTS.flatMap((r) => r.aliases.map(normalize));
    expect(aliases.filter((a) => names.includes(a))).toEqual([]);
  });

  it('hat gültige Werte', () => {
    for (const r of RESORTS) {
      expect(r.countries.length, r.id).toBeGreaterThan(0);
      for (const c of r.countries) expect(c, r.id).toMatch(/^[A-Z]{2}$/);
      expect(Math.abs(r.lat), r.id).toBeLessThanOrEqual(90);
      expect(Math.abs(r.lon), r.id).toBeLessThanOrEqual(180);
      for (const value of [r.pisteKm, r.lifts, r.topElevation, r.verticalDrop]) {
        expect(Number.isFinite(value), r.id).toBe(true);
        expect(value, r.id).toBeGreaterThanOrEqual(0);
      }
      expect(r.verticalDrop, r.id).toBeLessThanOrEqual(r.topElevation);
    }
  });

  it('hält die Mindestgröße ein', () => {
    for (const r of RESORTS) {
      expect(r.pisteKm, r.id).toBeGreaterThanOrEqual(MIN_PISTE_KM);
      expect(r.lifts, r.id).toBeGreaterThanOrEqual(MIN_LIFTS);
    }
  });

  it('enthält keine ausgeschlossenen Gebiete', () => {
    const ids = new Set(RESORTS.map((r) => r.id));
    for (const [id, reason] of Object.entries(OVERRIDES.exclude)) {
      expect(ids.has(id.slice(0, ID_LENGTH)), reason).toBe(false);
    }
  });

  it('hat ein Exportdatum', () => {
    expect(DATA_DATE).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
