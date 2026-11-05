import type { Resort } from '../data/resort.ts';
import type { Comparison, Direction } from '../logic/compare.ts';
import { flagEmoji, formatKm } from '../logic/format.ts';
import { h } from './dom.ts';
import { arrowDownIcon, arrowUpIcon, checkIcon, peakIcon, verticalIcon } from './icons.ts';

const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });

export function countryName(code: string): string {
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
}

const DIRECTION_TEXT: Record<Direction, string> = {
  higher: 'higher',
  lower: 'lower',
  equal: 'correct',
};

function directionIcon(dir: Direction): SVGElement {
  if (dir === 'higher') return arrowUpIcon();
  if (dir === 'lower') return arrowDownIcon();
  return checkIcon();
}

/** Spalten der Tabelle: Rasterbereich (CSS grid-area) und Überschrift. */
const COLUMNS = [
  { area: 'name', title: 'Resort' },
  { area: 'dist', title: 'Distance' },
  { area: 'country', title: 'Country' },
  { area: 'km', title: 'Slopes' },
  { area: 'lifts', title: 'Lifts' },
  { area: 'peak', title: 'Highest Point' },
  { area: 'vert', title: 'Elevation Gain' },
] as const;

type Area = (typeof COLUMNS)[number]['area'];

/** Kopfzeile mit den Namen der Kategorien. */
export function guessHeader(): HTMLElement {
  return h(
    'div',
    { class: 'guess-header', role: 'row' },
    ...COLUMNS.map(({ area, title }) => h('div', { class: `area-${area}`, role: 'columnheader' }, title)),
  );
}

function numberCell(area: Area, caption: Node | string, label: string, value: string, dir: Direction): HTMLElement {
  return h(
    'div',
    {
      class: `cell number area-${area}${dir === 'equal' ? ' ok' : ''}`,
      role: 'cell',
      'aria-label': `${label}: ${value}, ${DIRECTION_TEXT[dir]}`,
      title: label,
    },
    h('span', { class: 'caption' }, caption),
    h('span', { class: 'value' }, h('span', {}, value), directionIcon(dir)),
  );
}

/** Eine Zeile der Tipp-Tabelle. */
export function guessRow(resort: Resort, c: Comparison): HTMLElement {
  const country = resort.countries.map(countryName).join(', ');
  return h(
    'div',
    { class: `guess-row${c.correct ? ' correct' : ''}`, role: 'row' },
    h('div', { class: 'guess-name area-name', role: 'cell' }, resort.name),
    h(
      'div',
      {
        class: `cell distance area-dist${c.correct ? ' ok' : ''}`,
        role: 'cell',
        'aria-label': `Distance: ${formatKm(c.distanceKm)}`,
      },
      formatKm(c.distanceKm),
    ),
    h(
      'div',
      {
        class: `cell country area-country${resort.countries.length > 1 ? ' multi' : ''}${c.countryMatch ? ' ok' : ''}`,
        role: 'cell',
        title: country,
        'aria-label': `Country: ${country}, ${c.countryMatch ? 'correct' : 'wrong'}`,
      },
      ...resort.countries.map((code) => h('span', { class: 'flag' }, flagEmoji(code))),
    ),
    numberCell('km', 'km', 'Slopes', `${resort.pisteKm}`, c.pisteKm),
    numberCell('lifts', 'lifts', 'Lifts', `${resort.lifts}`, c.lifts),
    numberCell('peak', peakIcon(), 'Highest point', `${resort.topElevation} m`, c.topElevation),
    numberCell('vert', verticalIcon(), 'Elevation gain', `${resort.verticalDrop} m`, c.verticalDrop),
  );
}
