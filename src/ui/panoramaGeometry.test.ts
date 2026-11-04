import { describe, expect, it } from 'vitest';
import { buildPanorama, firstVisibleDay, hash01 } from './panoramaGeometry.ts';

describe('firstVisibleDay', () => {
  it('beginnt am Start, bis genug Tage erreicht sind', () => {
    expect(firstVisibleDay(0, 3)).toBe(0);
    expect(firstVisibleDay(3, 3)).toBe(0);
    expect(firstVisibleDay(4, 3)).toBe(1);
    expect(firstVisibleDay(40, 3)).toBe(37);
  });
});

describe('hash01', () => {
  it('ist deterministisch und liegt in [0, 1)', () => {
    for (let n = 0; n < 200; n++) {
      const v = hash01(n, 1);
      expect(v).toBe(hash01(n, 1));
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('buildPanorama', () => {
  it('zeigt bei Serie 0 den Startpunkt als aktuellen Tag ganz links', () => {
    const p = buildPanorama(0);
    expect(p.slots.map((s) => s.day)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(p.slots[0]!.state).toBe('current');
    expect(p.slots.slice(1).every((s) => s.state === 'future')).toBe(true);
    expect(p.pathDone).toHaveLength(1);
    expect(p.snowCaps).toHaveLength(6);
  });

  it('wandert mit: der aktuelle Gipfel steht nach 3 erreichten Gipfeln', () => {
    const p = buildPanorama(10);
    expect(p.slots.map((s) => s.day)).toEqual([7, 8, 9, 10, 11, 12, 13]);
    expect(p.slots.map((s) => s.state)).toEqual(['past', 'past', 'past', 'current', 'future', 'future', 'future']);
    // Der Weg kommt von links aus dem Bild und endet am aktuellen Gipfel.
    const current = p.slots[3]!.summit;
    expect(p.pathDone[0]!.x).toBeLessThanOrEqual(0);
    expect(p.pathDone.at(-1)).toEqual(current);
    expect(p.pathTodo[0]).toEqual(current);
  });

  it('gibt jedem Gipfel unabhängig vom Ausschnitt dieselbe Höhe', () => {
    const a = buildPanorama(5).slots.find((s) => s.day === 6)!;
    const b = buildPanorama(8).slots.find((s) => s.day === 6)!;
    expect(a.summit.y).toBe(b.summit.y);
  });

  it('bleibt innerhalb der Zeichenfläche und hat einen durchgehenden Grat', () => {
    for (const streak of [0, 1, 2, 3, 4, 17, 365]) {
      const p = buildPanorama(streak);
      for (const s of p.slots) {
        expect(s.summit.y).toBeGreaterThan(30);
        expect(s.label.y).toBeLessThan(p.height);
      }
      const xs = p.ridge.map((pt) => pt.x);
      expect(xs).toEqual([...xs].sort((a, b) => a - b));
      expect(xs[0]).toBeLessThanOrEqual(0);
      expect(xs.at(-1)).toBeGreaterThanOrEqual(p.width);
    }
  });
});
