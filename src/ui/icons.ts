import { svg } from './dom.ts';

const attrs = 'xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';

/** Gipfel mit Punkt an der Spitze (höchster Punkt). */
export const peakIcon = () =>
  svg(`<svg ${attrs} viewBox="0 0 24 24" stroke-width="1.8" class="icon"><path d="M2.5 20.5 10 8l3.2 5.2 2.3-3.2 6 10.5z"/><circle cx="10" cy="4.2" r="1.6" fill="currentColor" stroke="none"/></svg>`);

/** Pfeil mit zwei Enden (Höhendifferenz). */
export const verticalIcon = () =>
  svg(`<svg ${attrs} viewBox="0 0 24 24" stroke-width="1.8" class="icon"><path d="M12 3v18M7.5 7.5 12 3l4.5 4.5M7.5 16.5 12 21l4.5-4.5"/></svg>`);

export const arrowUpIcon = () =>
  svg(`<svg ${attrs} viewBox="0 0 24 24" stroke-width="2.4" class="icon dir"><path d="M12 19V5M6 11l6-6 6 6"/></svg>`);

export const arrowDownIcon = () =>
  svg(`<svg ${attrs} viewBox="0 0 24 24" stroke-width="2.4" class="icon dir"><path d="M12 5v14M6 13l6 6 6-6"/></svg>`);

export const checkIcon = () =>
  svg(`<svg ${attrs} viewBox="0 0 24 24" stroke-width="2.4" class="icon dir"><path d="M5 12.5 10 17.5 19 7"/></svg>`);

/** Absenden-Button: Pfeil nach rechts. */
export const submitIcon = () =>
  svg(`<svg ${attrs} viewBox="0 0 24 24" stroke-width="2.2" class="icon"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`);

export const closeIcon = () =>
  svg(`<svg ${attrs} viewBox="0 0 24 24" stroke-width="2.2" class="icon"><path d="M6 6l12 12M18 6 6 18"/></svg>`);
