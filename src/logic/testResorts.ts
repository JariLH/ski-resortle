import type { Resort } from '../data/resort.ts';

/** Kleiner, fester Testdatensatz, unabhängig von den echten Daten. */
export function makeResort(overrides: Partial<Resort> & Pick<Resort, 'id' | 'name'>): Resort {
  return {
    aliases: [],
    country: 'AT',
    lat: 47,
    lon: 11,
    pisteKm: 100,
    lifts: 20,
    topElevation: 2000,
    verticalDrop: 1000,
    ...overrides,
  };
}

export const TEST_RESORTS: Resort[] = [
  makeResort({ id: 'arlberg', name: 'Ski Arlberg', aliases: ['Lech', 'St. Anton am Arlberg'] }),
  makeResort({ id: 'zermatt', name: 'Matterhorn Ski Paradise', aliases: ['Zermatt'], country: 'CH' }),
  makeResort({ id: 'vallees', name: 'Les 3 Vallées', aliases: ['Méribel'], country: 'FR' }),
  makeResort({ id: 'feldberg', name: 'Feldberg', country: 'DE' }),
  makeResort({ id: 'fellhorn', name: 'Fellhorn/Kanzelwand', aliases: ['Fellhorn'], country: 'DE' }),
];
