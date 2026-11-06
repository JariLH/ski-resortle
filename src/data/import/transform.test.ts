import { describe, expect, it } from 'vitest';
import {
  buildResorts,
  countriesByLift,
  countriesOf,
  countriesOfLifts,
  liftsByArea,
  parseArea,
  pickName,
  type Area,
  type OsdLiftFeature,
  type OsdSkiAreaFeature,
  type Overrides,
} from './transform.ts';

const NO_OVERRIDES: Overrides = {
  exclude: {},
  merge: {},
  keepSeparate: [],
  dropLifts: {},
  rename: {},
  aliases: {},
  dropAliases: {},
  countries: {},
};

function lifts(prefix: string, count: number): Set<string> {
  return new Set(Array.from({ length: count }, (_, i) => `${prefix}${i}`));
}

function area(overrides: Partial<Area> & Pick<Area, 'id'>): Area {
  return {
    rawName: `Gebiet ${overrides.id}`,
    operating: true,
    downhill: true,
    countries: ['AT'],
    region: 'Tyrol',
    lat: 47.12345,
    lon: 11.98765,
    pisteKm: 10,
    liftIds: lifts(overrides.id, 5),
    maxElevation: 2000,
    minElevation: 1000,
    ...overrides,
  };
}

function lift(id: string, areaIds: string[], liftType = 'chair_lift', status = 'operating'): OsdLiftFeature {
  return { properties: { id, status, liftType, skiAreas: areaIds.map((a) => ({ properties: { id: a } })) } };
}

describe('liftsByArea', () => {
  it('zählt nur Lifte in Betrieb und ohne Förderbänder', () => {
    const index = liftsByArea([
      lift('l1', ['a']),
      lift('l2', ['a', 'b'], 'platter'),
      lift('l3', ['a'], 'magic_carpet'),
      lift('l4', ['a'], 'gondola', 'abandoned'),
    ]);
    expect([...index.get('a')!]).toEqual(['l1', 'l2']);
    expect([...index.get('b')!]).toEqual(['l2']);
  });

  /** Lift mit Name und Linie von `from` nach `to` (x-Koordinaten, y = 0). */
  function segment(id: string, name: string | null, liftType: string, from: number, to: number, areas = ['a']): OsdLiftFeature {
    const feature = lift(id, areas, liftType);
    feature.properties.name = name;
    feature.geometry = { type: 'LineString', coordinates: [[from, 0, 1000], [to, 0, 1100]] };
    return feature;
  }

  it('zählt aneinander anschließende Abschnitte eines Lifts einmal', () => {
    const index = liftsByArea([
      segment('s2', 'Gondel', 'gondola', 1, 2),
      segment('s1', 'Gondel', 'gondola', 0, 1),
      segment('s3', 'Gondel', 'gondola', 2, 3, ['a', 'b']),
    ]);
    expect([...index.get('a')!]).toEqual(['s1']);
    expect([...index.get('b')!]).toEqual(['s1']);
  });

  it('fasst Bahnabschnitte auch ohne Namen und gegenläufig zusammen', () => {
    const index = liftsByArea([
      segment('f1', null, 'funicular', 0, 1),
      segment('f2', null, 'funicular', 2, 1),
      segment('f3', null, 'funicular', 2, 3),
    ]);
    expect(index.get('a')!.size).toBe(1);
  });

  it('trennt verschiedene Lifte', () => {
    const index = liftsByArea([
      // unbenannte Schlepplifte in Reihe
      segment('d1', null, 'drag_lift', 0, 1),
      segment('d2', null, 'drag_lift', 1, 2),
      // gleichnamige Sessellifte mit gemeinsamer Talstation
      segment('c1', 'Jonction', 'chair_lift', 5, 6),
      segment('c2', 'Jonction', 'chair_lift', 5, 7),
      // anderer Typ am selben Punkt
      segment('g1', 'Jonction', 'gondola', 6, 8),
    ]);
    expect(index.get('a')!.size).toBe(5);
  });
});

describe('Länder aus Liftstandorten', () => {
  function placed(id: string, codes: string[]): OsdLiftFeature {
    const feature = lift(id, ['a']);
    feature.properties.places = codes.map((code) => ({ iso3166_1Alpha2: code }));
    return feature;
  }

  it('ordnet jedem Lift seine Länder zu, ein Lift über die Grenze hat beide', () => {
    const index = countriesByLift([placed('l1', ['AT']), placed('l2', ['DE', 'AT']), placed('l3', [])]);
    expect(Object.fromEntries(index)).toEqual({ l1: ['AT'], l2: ['DE', 'AT'], l3: [] });
  });

  it('sortiert nach Anzahl der Lifte und ignoriert Orte ohne Lift', () => {
    const liftCountries = new Map([
      ['l1', ['AT']],
      ['l2', ['AT']],
      ['l3', ['IT', 'AT']],
    ]);
    const places = [{ iso3166_1Alpha2: 'IT' }, { iso3166_1Alpha2: 'IT' }, { iso3166_1Alpha2: 'CH' }];
    expect(countriesOfLifts(['l1', 'l2', 'l3'], liftCountries, places)).toEqual(['AT', 'IT']);
  });

  it('entscheidet Gleichstand nach den Orten des Gebiets', () => {
    const liftCountries = new Map([
      ['l1', ['AT']],
      ['l2', ['DE']],
    ]);
    expect(countriesOfLifts(['l1', 'l2'], liftCountries, [{ iso3166_1Alpha2: 'DE' }])).toEqual(['DE', 'AT']);
  });

  it('nimmt die Orte des Gebiets, wenn kein Lift ein Land hat', () => {
    expect(countriesOfLifts(['l1'], new Map(), [{ iso3166_1Alpha2: 'CH' }])).toEqual(['CH']);
  });
});

describe('countriesOf', () => {
  it('sortiert nach Häufigkeit und entfernt Doppelte', () => {
    const places = [{ iso3166_1Alpha2: 'CH' }, { iso3166_1Alpha2: 'AT' }, { iso3166_1Alpha2: 'AT' }, { iso3166_1Alpha2: null }];
    expect(countriesOf(places)).toEqual(['AT', 'CH']);
  });
});

describe('parseArea', () => {
  const feature: OsdSkiAreaFeature = {
    properties: {
      id: 'abc',
      name: ' Testberg ',
      status: 'operating',
      activities: ['downhill', 'nordic'],
      places: [{ iso3166_1Alpha2: 'DE', localized: { en: { region: 'Bavaria' } } }],
      statistics: {
        runs: {
          byActivity: {
            downhill: {
              byDifficulty: {
                easy: { count: 2, lengthInKm: 1.5, maxElevation: 1500, minElevation: 900 },
                advanced: { count: 1, lengthInKm: 2.25, maxElevation: 1700, minElevation: 1000 },
              },
            },
          },
        },
        lifts: { byType: { chair_lift: { count: 2, maxElevation: 1750, minElevation: 880 } } },
      },
      viewportHint: { center: [11.5, 47.5] },
    },
    geometry: { type: 'Polygon', coordinates: [] },
  };

  it('nimmt nur Alpin-Pisten und Lifte für Länge und Höhen', () => {
    const a = parseArea(feature, new Map([['abc', lifts('x', 2)]]));
    expect(a).toMatchObject({
      id: 'abc',
      rawName: 'Testberg',
      operating: true,
      downhill: true,
      countries: ['DE'],
      region: 'Bavaria',
      lat: 47.5,
      lon: 11.5,
      pisteKm: 3.75,
      maxElevation: 1750,
      minElevation: 880,
    });
    expect(a.liftIds.size).toBe(2);
  });

  it('kommt ohne Pisten, Lifte und Mittelpunkt aus', () => {
    const empty: OsdSkiAreaFeature = {
      properties: {
        ...feature.properties,
        name: null,
        statistics: { runs: { byActivity: {} }, lifts: { byType: {} } },
        viewportHint: null,
      },
      geometry: { type: 'Point', coordinates: [7, 46] },
    };
    expect(parseArea(empty, new Map())).toMatchObject({
      rawName: null,
      pisteKm: 0,
      maxElevation: null,
      minElevation: null,
      lat: 46,
      lon: 7,
    });
  });
});

describe('pickName', () => {
  it('nimmt die erste lateinische Variante, die anderen werden Aliase', () => {
    expect(pickName('芸北国際スキー場, Geihoku Kokusai')).toEqual({ name: 'Geihoku Kokusai', aliases: ['芸北国際スキー場'] });
    expect(pickName('Val Gardena, Gröden, Gherdëina')).toEqual({ name: 'Val Gardena', aliases: ['Gröden', 'Gherdëina'] });
  });

  it('holt lateinische Teile aus gemischten Namen', () => {
    expect(pickName('Уязы-Тау (Uyazy-Tau)').name).toBe('Uyazy-Tau');
    expect(pickName('Krasiya - КРАСИЯ').name).toBe('Krasiya');
  });

  it('lässt rein nicht-lateinische Namen stehen', () => {
    expect(pickName('Медвежья Долина')).toEqual({ name: 'Медвежья Долина', aliases: [] });
  });

  it('entfernt das Präfix „Skigebiet“ und behält den vollen Namen als Alias', () => {
    expect(pickName('Skigebiet Fellhorn/Kanzelwand')).toEqual({
      name: 'Fellhorn/Kanzelwand',
      aliases: ['Skigebiet Fellhorn/Kanzelwand'],
    });
  });
});

describe('buildResorts', () => {
  const names = (areas: Area[], overrides = NO_OVERRIDES) => buildResorts(areas, overrides).resorts.map((r) => r.name);

  it('wendet die Mindestgröße an (3 km, 3 Lifte) und braucht Namen, Betrieb und Alpin-Pisten', () => {
    const result = names([
      area({ id: 'ok', pisteKm: 3, liftIds: lifts('ok', 3) }),
      area({ id: 'short', pisteKm: 2.9 }),
      area({ id: 'few', liftIds: lifts('few', 2) }),
      area({ id: 'noname', rawName: null }),
      area({ id: 'closed', operating: false }),
      area({ id: 'nordic', downhill: false }),
    ]);
    expect(result).toEqual(['Gebiet ok']);
  });

  it('rechnet Werte um und kürzt die ID', () => {
    const { resorts } = buildResorts(
      [area({ id: '0123456789abcdef', pisteKm: 12.6, maxElevation: 2811.4, minElevation: 1303.9, countries: ['AT', 'CH'] })],
      NO_OVERRIDES,
    );
    expect(resorts).toEqual([
      {
        id: '01234567',
        name: 'Gebiet 0123456789abcdef',
        aliases: [],
        countries: ['AT', 'CH'],
        lat: 47.123,
        lon: 11.988,
        pisteKm: 13,
        lifts: 5,
        topElevation: 2811,
        verticalDrop: 1508,
      },
    ]);
  });

  it('faltet Teilgebiete ins größere Gebiet ein, ihr Name wird Alias', () => {
    const big = area({ id: 'big', rawName: 'Ski Arlberg', liftIds: new Set([...lifts('lech', 4), ...lifts('anton', 6)]) });
    const lech = area({ id: 'lech', rawName: 'Lech/Zürs', liftIds: lifts('lech', 4) });
    const { resorts, report } = buildResorts([lech, big], NO_OVERRIDES);
    expect(resorts.map((r) => [r.name, r.aliases, r.lifts])).toEqual([['Ski Arlberg', ['Lech/Zürs'], 10]]);
    expect(report.folded).toEqual([{ child: 'Lech/Zürs', parent: 'Ski Arlberg', shared: 4, childLifts: 4 }]);
  });

  it('faltet Ketten bis zum größten Gebiet ein', () => {
    const top = area({ id: 'top', rawName: 'Netz', liftIds: lifts('x', 10) });
    const mid = area({ id: 'mid', rawName: 'Teil', liftIds: lifts('x', 6) });
    const small = area({ id: 'small', rawName: 'Ortsteil', liftIds: lifts('x', 3) });
    const { resorts, report } = buildResorts([small, mid, top], NO_OVERRIDES);
    expect(resorts.map((r) => [r.name, [...r.aliases].sort()])).toEqual([['Netz', ['Ortsteil', 'Teil']]]);
    expect(report.containers).toEqual([{ id: 'top', name: 'Netz', children: ['Teil', 'Ortsteil'] }]);
  });

  it('faltet nur bei überwiegend gemeinsamen Liften ein', () => {
    const a = area({ id: 'a', rawName: 'A', liftIds: new Set(['s1', 'a1', 'a2', 'a3']) });
    const b = area({ id: 'b', rawName: 'B', liftIds: new Set(['s1', 'b1', 'b2', 'b3', 'b4']) });
    const { resorts, report } = buildResorts([a, b], NO_OVERRIDES);
    expect(resorts.map((r) => r.name).sort()).toEqual(['A', 'B']);
    expect(report.partialOverlaps).toEqual([{ a: 'A', b: 'B', shared: 1 }]);
  });

  it('lässt von genau gleichen Doppeleinträgen einen übrig', () => {
    const same = lifts('x', 5);
    const result = names([area({ id: 'd1', rawName: 'Doppelt', liftIds: same }), area({ id: 'd2', rawName: 'Doppelt', liftIds: same })]);
    expect(result).toEqual(['Doppelt']);
  });

  it('übernimmt den Namen eines Teilgebiets, wenn das Netz keinen hat', () => {
    const net = area({ id: 'net', rawName: null, liftIds: lifts('x', 8) });
    const part = area({ id: 'part', rawName: 'Bekannt', liftIds: lifts('x', 4) });
    expect(names([net, part])).toEqual(['Bekannt']);
  });

  it('schließt Verbünde aus, damit ihre Gebiete einzeln bleiben', () => {
    const verbund = area({ id: 'v', rawName: 'Superski', liftIds: new Set([...lifts('a', 5), ...lifts('b', 5)]) });
    const a = area({ id: 'a', rawName: 'Berg A', liftIds: lifts('a', 5) });
    const b = area({ id: 'b', rawName: 'Berg B', liftIds: lifts('b', 5) });
    const overrides = { ...NO_OVERRIDES, exclude: { v: 'Ticketverbund' } };
    const { resorts, report } = buildResorts([verbund, a, b], overrides);
    expect(resorts.map((r) => r.name).sort()).toEqual(['Berg A', 'Berg B']);
    expect(report.excluded).toEqual([{ id: 'v', name: 'Superski', reason: 'Ticketverbund' }]);
  });

  it('keepSeparate verhindert das Einfalten', () => {
    const big = area({ id: 'big', rawName: 'Groß', liftIds: lifts('x', 10) });
    const small = area({ id: 'small', rawName: 'Klein', liftIds: lifts('x', 4) });
    expect(names([big, small], { ...NO_OVERRIDES, keepSeparate: ['small'] }).sort()).toEqual(['Groß', 'Klein']);
  });

  it('legt getrennt erfasste Teile zusammen', () => {
    const a = area({ id: 'a', rawName: 'Damüls', pisteKm: 40, liftIds: lifts('a', 10), maxElevation: 2050, minElevation: 1400, countries: ['AT'] });
    const b = area({ id: 'b', rawName: 'Mellau', pisteKm: 20, liftIds: lifts('b', 5), maxElevation: 1900, minElevation: 690, countries: ['AT', 'DE'] });
    const { resorts, report } = buildResorts([a, b], { ...NO_OVERRIDES, merge: { a: ['b'] } });
    expect(resorts).toHaveLength(1);
    expect(resorts[0]).toMatchObject({
      name: 'Damüls',
      aliases: ['Mellau'],
      pisteKm: 60,
      lifts: 15,
      topElevation: 2050,
      verticalDrop: 1360,
      countries: ['AT', 'DE'],
    });
    expect(report.mergeOverlaps).toEqual([]);
  });

  it('setzt Namen und Aliase aus der Korrekturliste und bereinigt Aliase', () => {
    const a = area({ id: 'a', rawName: 'Skiarena X, Arena X' });
    const b = area({ id: 'b', rawName: 'Lech' });
    const overrides = { ...NO_OVERRIDES, rename: { a: 'X' }, aliases: { a: ['Lech', 'ARENA X', 'Dorf'] } };
    const { resorts, report } = buildResorts([a, b], overrides);
    // Handgepflegte Aliase haben Vorrang vor gleichen Varianten aus den Daten.
    expect(resorts.find((r) => r.id === 'a')?.aliases).toEqual(['ARENA X', 'Dorf', 'Skiarena X']);
    expect(report.droppedAliases).toEqual(['Lech (bei X)']);
  });

  it('entfernt unpassende Aliase aus den Daten', () => {
    const a = area({ id: 'a', rawName: 'Berg, Berg (eröffnet bald), Monte' });
    const { resorts } = buildResorts([a], { ...NO_OVERRIDES, dropAliases: { a: ['berg (Eröffnet Bald)'] } });
    expect(resorts[0]?.aliases).toEqual(['Monte']);
  });

  it('entfernt Lifte, die nicht zum Netz gehören', () => {
    const a = area({ id: 'a', liftIds: new Set(['l1', 'l2', 'l3', 'l4']) });
    const { resorts, report } = buildResorts([a], { ...NO_OVERRIDES, dropLifts: { l4: 'Dorflift', weg: 'alt' } });
    expect(resorts[0]?.lifts).toBe(3);
    expect(report.unknownOverrideIds).toEqual(['weg']);
  });

  it('wendet die Mindestgröße nach dem Entfernen von Liften an', () => {
    const a = area({ id: 'a', liftIds: new Set(['l1', 'l2', 'l3']) });
    const { resorts } = buildResorts([a], { ...NO_OVERRIDES, dropLifts: { l3: 'Dorflift' } });
    expect(resorts).toEqual([]);
  });

  it('setzt Länder aus der Korrekturliste', () => {
    const a = area({ id: 'a', countries: ['IT'] });
    const { resorts, report } = buildResorts([a], { ...NO_OVERRIDES, countries: { a: ['IT', 'SI'], weg: ['AT'] } });
    expect(resorts[0]?.countries).toEqual(['IT', 'SI']);
    expect(report.unknownOverrideIds).toEqual(['weg']);
  });

  it('ergänzt doppelte Namen um die Region', () => {
    const result = names([
      area({ id: 'a', rawName: 'Crystal Mountain', region: 'Washington', liftIds: lifts('a', 5) }),
      area({ id: 'b', rawName: 'Crystal Mountain', region: 'Michigan', liftIds: lifts('b', 5) }),
    ]);
    expect(result).toEqual(['Crystal Mountain (Washington)', 'Crystal Mountain (Michigan)']);
  });

  it('meldet Korrektur-IDs, die es im Export nicht gibt', () => {
    const { report } = buildResorts([area({ id: 'a' })], { ...NO_OVERRIDES, exclude: { weg: 'alt' }, aliases: { a: ['x'] } });
    expect(report.unknownOverrideIds).toEqual(['weg']);
  });
});
