// Erzeugt src/data/resorts.json aus den OpenSkiData-Exporten.
// Aufruf: `npm run import-data` (lädt die Exporte nach data-raw/, falls sie fehlen)
//         `npm run import-data -- --download` (Exporte neu laden)
// Läuft direkt mit Node (Type Stripping), daher nur Node-Bordmittel und keine Typprüfung durch tsc.
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { buildResorts, countriesByLift, liftsByArea, parseArea } from '../src/data/import/transform.ts';
import { OVERRIDES } from '../src/data/overrides.ts';

const BASE_URL = 'https://tiles.openskimap.org/geojson';
const RAW_DIR = 'data-raw';
const OUT_FILE = 'src/data/resorts.json';
const REPORT_FILE = `${RAW_DIR}/import-report.json`;

async function ensureFile(name, forceDownload) {
  const path = `${RAW_DIR}/${name}`;
  if (forceDownload || !existsSync(path)) {
    console.log(`Lade ${BASE_URL}/${name} …`);
    const response = await fetch(`${BASE_URL}/${name}`);
    if (!response.ok) throw new Error(`Download fehlgeschlagen: ${response.status} ${response.statusText}`);
    mkdirSync(RAW_DIR, { recursive: true });
    writeFileSync(path, Buffer.from(await response.arrayBuffer()));
  }
  return path;
}

const forceDownload = process.argv.includes('--download');
const areasPath = await ensureFile('ski_areas.geojson', forceDownload);
const liftsPath = await ensureFile('lifts.geojson', forceDownload);

const areaFeatures = JSON.parse(readFileSync(areasPath, 'utf8')).features;
const liftFeatures = JSON.parse(readFileSync(liftsPath, 'utf8')).features;
const liftIndex = liftsByArea(liftFeatures);
const liftCountries = countriesByLift(liftFeatures);
const areas = areaFeatures.map((f) => parseArea(f, liftIndex, liftCountries));
const { resorts, report } = buildResorts(areas, OVERRIDES);

const ids = new Set(resorts.map((r) => r.id));
if (ids.size !== resorts.length) throw new Error('Gekürzte IDs sind nicht eindeutig, ID_LENGTH erhöhen');

const exportedAt = statSync(areasPath).mtime.toISOString().slice(0, 10);
// Ein Gebiet pro Zeile: kompakt und mit gut lesbaren Diffs bei Datenupdates
const lines = resorts.map((r) => `  ${JSON.stringify(r)}`).join(',\n');
writeFileSync(OUT_FILE, `{\n "exportedAt": "${exportedAt}",\n "resorts": [\n${lines}\n ]\n}\n`);
writeFileSync(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);

console.log(`Export vom ${exportedAt}: ${report.total} Gebiete → ${resorts.length} im Spiel`);
console.log(`Ausgeschlossen: ${report.excluded.length}, zusammengelegt: ${report.merged.length}, eingefaltete Teilgebiete: ${report.folded.length}`);
const warn = (title, items) => {
  if (items.length === 0) return;
  console.log(`\n${title} (${items.length}):`);
  for (const item of items.slice(0, 40)) console.log(`  ${typeof item === 'string' ? item : JSON.stringify(item)}`);
  if (items.length > 40) console.log('  …');
};
warn('Override-IDs nicht im Export', report.unknownOverrideIds);
warn('Zusammengelegte Teile mit gemeinsamen Liften', report.mergeOverlaps);
warn('Gebiete mit mehreren Teilgebieten (Netz oder Verbund?)', report.containers.map((c) => `${c.name} [${c.id}]: ${c.children.join(' | ')}`));
warn('Doppelte Namen trotz Regionszusatz', report.duplicateNames);
warn('Namen um Region ergänzt', report.disambiguated);
warn('Namen ohne lateinische Schrift', report.nonLatinNames);
warn('Ohne Höhen- oder Länderangabe (nicht übernommen)', report.missingElevation);
console.log(`\nVollständiger Report: ${REPORT_FILE}`);
