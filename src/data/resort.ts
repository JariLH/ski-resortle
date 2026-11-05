/** Ein Skigebiet, wie es im Spiel verwendet wird. */
export interface Resort {
  /** Stabile, eindeutige ID (z. B. aus OpenSkiData). Bestimmt die Reihenfolge der Tagesrätsel. */
  id: string;
  /** Gängigster Name des zusammenhängenden Gebiets. */
  name: string;
  /** Orte und Teilgebiete, z. B. „Lech“ für Ski Arlberg. */
  aliases: string[];
  /** Ländercodes nach ISO 3166-1 alpha-2, z. B. [„AT“, „CH“]; Hauptland zuerst. */
  countries: string[];
  lat: number;
  lon: number;
  /** Pistenkilometer */
  pisteKm: number;
  /** Anzahl Lifte */
  lifts: number;
  /** Höchster Punkt in m ü. NN */
  topElevation: number;
  /** Maximale Höhendifferenz in m */
  verticalDrop: number;
}
