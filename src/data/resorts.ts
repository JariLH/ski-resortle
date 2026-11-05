import type { Resort } from './resort.ts';
import data from './resorts.json';

// Skigebiete aus OpenSkiData (© OpenStreetMap-Mitwirkende, ODbL).
// Erzeugt mit `npm run import-data`, nicht von Hand bearbeiten; Korrekturen gehören in overrides.ts.
export const RESORTS: Resort[] = data.resorts;

/** Stand des OpenSkiData-Exports, z. B. „2026-11-05“. */
export const DATA_DATE: string = data.exportedAt;
