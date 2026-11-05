import type { Resort } from '../data/resort.ts';
import { distanceKm } from './geo.ts';

/** Richtung, in der der gesuchte Wert relativ zum Tipp liegt. */
export type Direction = 'higher' | 'lower' | 'equal';

export interface Comparison {
  correct: boolean;
  /** Tipp und Lösung haben mindestens ein Land gemeinsam. */
  countryMatch: boolean;
  pisteKm: Direction;
  lifts: Direction;
  topElevation: Direction;
  verticalDrop: Direction;
  /** Gerundete Entfernung zwischen Tipp und Lösung in km. */
  distanceKm: number;
}

/** „higher“ heißt: Die Lösung hat mehr als der Tipp. */
export function direction(guessValue: number, targetValue: number): Direction {
  if (targetValue > guessValue) return 'higher';
  if (targetValue < guessValue) return 'lower';
  return 'equal';
}

export function compareResorts(guess: Resort, target: Resort): Comparison {
  return {
    correct: guess.id === target.id,
    countryMatch: guess.countries.some((c) => target.countries.includes(c)),
    pisteKm: direction(guess.pisteKm, target.pisteKm),
    lifts: direction(guess.lifts, target.lifts),
    topElevation: direction(guess.topElevation, target.topElevation),
    verticalDrop: direction(guess.verticalDrop, target.verticalDrop),
    distanceKm: Math.round(distanceKm(guess, target)),
  };
}
