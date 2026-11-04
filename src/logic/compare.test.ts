import { describe, expect, it } from 'vitest';
import { compareResorts, direction } from './compare.ts';
import { distanceKm } from './geo.ts';
import { makeResort } from './testResorts.ts';

describe('direction', () => {
  it('zeigt die Richtung der Lösung an', () => {
    expect(direction(100, 200)).toBe('higher');
    expect(direction(200, 100)).toBe('lower');
    expect(direction(150, 150)).toBe('equal');
  });
});

describe('distanceKm', () => {
  it('ist 0 für denselben Punkt', () => {
    expect(distanceKm({ lat: 47, lon: 11 }, { lat: 47, lon: 11 })).toBe(0);
  });

  it('berechnet bekannte Entfernungen', () => {
    // Berlin – München ca. 504 km
    const d = distanceKm({ lat: 52.52, lon: 13.405 }, { lat: 48.137, lon: 11.575 });
    expect(d).toBeGreaterThan(495);
    expect(d).toBeLessThan(510);
  });
});

describe('compareResorts', () => {
  const target = makeResort({ id: 't', name: 'Ziel', country: 'AT', pisteKm: 100, lifts: 20, topElevation: 2000, verticalDrop: 1000 });

  it('erkennt den richtigen Tipp', () => {
    const c = compareResorts(target, target);
    expect(c).toEqual({
      correct: true,
      countryMatch: true,
      pisteKm: 'equal',
      lifts: 'equal',
      topElevation: 'equal',
      verticalDrop: 'equal',
      distanceKm: 0,
    });
  });

  it('vergleicht alle Attribute einzeln', () => {
    const guess = makeResort({
      id: 'g',
      name: 'Tipp',
      country: 'CH',
      lat: 48,
      pisteKm: 50,
      lifts: 30,
      topElevation: 2000,
      verticalDrop: 1200,
    });
    const c = compareResorts(guess, target);
    expect(c.correct).toBe(false);
    expect(c.countryMatch).toBe(false);
    expect(c.pisteKm).toBe('higher');
    expect(c.lifts).toBe('lower');
    expect(c.topElevation).toBe('equal');
    expect(c.verticalDrop).toBe('lower');
    expect(c.distanceKm).toBe(111);
  });
});
