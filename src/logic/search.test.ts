import { describe, expect, it } from 'vitest';
import { normalize, resolveInput, suggest } from './search.ts';
import { TEST_RESORTS } from './testResorts.ts';

const names = (list: { name: string }[]) => list.map((r) => r.name);

describe('normalize', () => {
  it('ignoriert Groß-/Kleinschreibung, Akzente und Sonderzeichen', () => {
    expect(normalize('  Les 3 Vallées ')).toBe('les 3 vallees');
    expect(normalize('Fellhorn/Kanzelwand')).toBe('fellhorn kanzelwand');
    expect(normalize('St. Anton')).toBe('st anton');
  });
});

describe('suggest', () => {
  it('schlägt bei leerer Eingabe alle Gebiete alphabetisch vor', () => {
    expect(names(suggest('', TEST_RESORTS))).toEqual([
      'Feldberg',
      'Fellhorn/Kanzelwand',
      'Les 3 Vallées',
      'Matterhorn Ski Paradise',
      'Ski Arlberg',
    ]);
    expect(suggest('   ', TEST_RESORTS)).toHaveLength(5);
  });

  it('filtert nach Teilstring, Treffer am Anfang zuerst', () => {
    expect(names(suggest('ski', TEST_RESORTS))).toEqual(['Ski Arlberg', 'Matterhorn Ski Paradise']);
    expect(names(suggest('fel', TEST_RESORTS))).toEqual(['Feldberg', 'Fellhorn/Kanzelwand']);
    expect(names(suggest('vallees', TEST_RESORTS))).toEqual(['Les 3 Vallées']);
  });

  it('liefert nichts bei unbekannter Eingabe', () => {
    expect(suggest('xyz', TEST_RESORTS)).toEqual([]);
  });
});

describe('resolveInput', () => {
  it('erkennt exakte Namen unabhängig von Schreibweise', () => {
    expect(resolveInput('ski arlberg', TEST_RESORTS)).toMatchObject({ kind: 'exact', resort: { id: 'arlberg' } });
    expect(resolveInput('LES 3 VALLEES', TEST_RESORTS)).toMatchObject({ kind: 'exact', resort: { id: 'vallees' } });
  });

  it('erkennt Aliase', () => {
    expect(resolveInput('Lech', TEST_RESORTS)).toMatchObject({ kind: 'alias', resort: { id: 'arlberg' } });
    expect(resolveInput('meribel', TEST_RESORTS)).toMatchObject({ kind: 'alias', resort: { id: 'vallees' } });
  });

  it('bevorzugt Namen vor Aliasen', () => {
    // „Fellhorn“ ist Alias; ein Gebiet namens „Fellhorn“ gäbe es nicht. Name „Feldberg“ bleibt exakt.
    expect(resolveInput('Feldberg', TEST_RESORTS).kind).toBe('exact');
    expect(resolveInput('Fellhorn', TEST_RESORTS).kind).toBe('alias');
  });

  it('meldet leere und unbekannte Eingaben', () => {
    expect(resolveInput('  ', TEST_RESORTS)).toEqual({ kind: 'empty' });
    expect(resolveInput('Lec', TEST_RESORTS)).toEqual({ kind: 'unknown' });
  });
});
