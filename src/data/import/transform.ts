// Umwandlung der OpenSkiData-Exporte in den Spieldatensatz.
// Reine Funktionen ohne Datei- oder Netzwerkzugriff; das Einlesen macht scripts/import-resorts.ts.
import { normalize } from '../../logic/search.ts';
import type { Resort } from '../resort.ts';

// ---------------------------------------------------------------------------
// Ausschnitt des OpenSkiData-Formats (nur die Felder, die wir brauchen)

interface ElevationStats {
  count: number;
  lengthInKm?: number;
  maxElevation?: number | null;
  minElevation?: number | null;
}

export interface OsdPlace {
  iso3166_1Alpha2?: string | null;
  localized?: { en?: { region?: string | null; locality?: string | null } };
}

export interface OsdSkiAreaFeature {
  properties: {
    id: string;
    name: string | null;
    status: string | null;
    activities: string[];
    places: OsdPlace[];
    statistics: {
      runs: { byActivity: { downhill?: { byDifficulty: Record<string, ElevationStats> } } };
      lifts: { byType: Record<string, ElevationStats> };
    };
    viewportHint?: { center: [number, number] } | null;
  };
  geometry: { type: string; coordinates: unknown };
}

export interface OsdLiftFeature {
  properties: {
    id: string;
    name?: string | null;
    status: string | null;
    places?: OsdPlace[];
    liftType: string | null;
    skiAreas: { properties: { id: string } }[];
  };
  geometry?: { type: string; coordinates: unknown } | null;
}

export interface OsdRunFeature {
  properties: {
    id: string;
    uses: string[];
    skiAreas: { properties: { id: string } }[];
  };
  geometry: { type: string; coordinates: unknown };
}

// ---------------------------------------------------------------------------
// Regeln aus SPEC.md

export const MIN_PISTE_KM = 3;
export const MIN_LIFTS = 3;
/** Förderbänder zählen nicht als Lift. */
const IGNORED_LIFT_TYPES = new Set(['magic_carpet']);
/** Bahnen, die in OpenStreetMap oft in viele Abschnitte zerlegt sind (Weichen, Ausweichen, Brücken). */
const RAIL_LIFT_TYPES = new Set(['funicular', 'railway']);
/** Ein Gebiet ist Teilgebiet eines größeren, wenn mindestens dieser Anteil seiner Lifte auch zum größeren gehört. */
export const SUB_AREA_SHARE = 0.5;
/** Länge der Spiel-ID (Anfang der OpenSkiData-ID); kurz, damit Challenge-Links kurz bleiben. */
export const ID_LENGTH = 8;

/** Handgepflegte Korrekturen, Schlüssel sind vollständige OpenSkiData-IDs. */
export interface Overrides {
  /** Ticket-/Marketingverbünde und Fehleinträge, jeweils mit Begründung. */
  exclude: Record<string, string>;
  /** Ziel-ID → IDs von Teilen ohne gemeinsame Lifte, die zum selben Netz gehören. */
  merge: Record<string, string[]>;
  /** IDs, die nie automatisch als Teilgebiet eingefaltet werden. */
  keepSeparate: string[];
  /** Lift-ID → Begründung: Lifte, die OpenSkiData einem Gebiet zuordnet, die aber nicht zu dessen Netz gehören. */
  dropLifts: Record<string, string>;
  rename: Record<string, string>;
  aliases: Record<string, string[]>;
  /** Aliase, die aus den OpenSkiData-Namen entstehen, aber nicht passen (z. B. Zusätze wie „eröffnet demnächst“). */
  dropAliases: Record<string, string[]>;
  /** Länder, wenn die Liftstandorte nicht reichen (z. B. Pisten über die Grenze, alle Lifte auf einer Seite). */
  countries: Record<string, string[]>;
  /** Gebiete, die OpenSkiData nur als Teil eines größeren Eintrags führt (siehe carveAreas). */
  carve: CarvedArea[];
}

export interface CarvedArea {
  /** OpenSkiData-ID des Eintrags, der die Lifte enthält */
  from: string;
  /** Name, weitere Varianten mit Komma getrennt wie in OpenSkiData; die weiteren werden Aliase */
  name: string;
  /** Lift-IDs, bei zerstückelten Liften die kleinste Abschnitts-ID */
  lifts: string[];
}

// ---------------------------------------------------------------------------
// Einlesen

/** Ein Gebiet nach dem Einlesen, vor Filtern und Korrekturen. */
export interface Area {
  id: string;
  /** Rohname aus OpenSkiData, ggf. mehrere Varianten mit Komma getrennt. */
  rawName: string | null;
  operating: boolean;
  downhill: boolean;
  /** Ländercodes, häufigstes zuerst. */
  countries: string[];
  region: string | null;
  lat: number;
  lon: number;
  pisteKm: number;
  /** IDs der zählenden Lifte. */
  liftIds: Set<string>;
  /** Höchster und tiefster Punkt von Alpin-Pisten und Liften; `null`, wenn unbekannt. */
  maxElevation: number | null;
  minElevation: number | null;
}

/** Nur Lifte in Betrieb und ohne Förderbänder zählen. */
function countedLifts(lifts: readonly OsdLiftFeature[]): OsdLiftFeature[] {
  return lifts.filter(({ properties: p }) => p.status === 'operating' && !IGNORED_LIFT_TYPES.has(p.liftType ?? ''));
}

/**
 * Lift-ID-Mengen je Gebiet: nur Lifte in Betrieb und ohne Förderbänder.
 * Abschnitte desselben Lifts zählen einmal, unter der ID des Abschnitts mit der kleinsten ID.
 */
export function liftsByArea(lifts: readonly OsdLiftFeature[]): Map<string, Set<string>> {
  const counted = countedLifts(lifts);
  const unitOf = liftUnits(counted);
  const index = new Map<string, Set<string>>();
  for (const { properties: lift } of counted) {
    for (const area of lift.skiAreas) {
      const id = area.properties.id;
      let set = index.get(id);
      if (!set) index.set(id, (set = new Set()));
      set.add(unitOf(lift.id));
    }
  }
  return index;
}

/** Länder je Lift (IDs wie in liftsByArea); ein Lift über die Grenze liegt in beiden. */
export function countriesByLift(lifts: readonly OsdLiftFeature[]): Map<string, string[]> {
  const counted = countedLifts(lifts);
  const unitOf = liftUnits(counted);
  const index = new Map<string, string[]>();
  for (const { properties: lift } of counted) {
    const id = unitOf(lift.id);
    const countries = index.get(id) ?? [];
    for (const code of countriesOf(lift.places ?? [])) if (!countries.includes(code)) countries.push(code);
    index.set(id, countries);
  }
  return index;
}

/**
 * Länder eines Gebiets nach der Zahl seiner Lifte, die dort stehen; bei Gleichstand in der Reihenfolge
 * der Orte des Gebiets. Die Orte allein sind unzuverlässig (Grenznähe genügt), daher zählen die Lifte.
 */
export function countriesOfLifts(liftIds: Iterable<string>, liftCountries: Map<string, string[]>, places: readonly OsdPlace[]): string[] {
  const counts = new Map<string, number>();
  for (const id of liftIds) for (const code of liftCountries.get(id) ?? []) counts.set(code, (counts.get(code) ?? 0) + 1);
  const fallback = countriesOf(places);
  if (counts.size === 0) return fallback;
  const rank = (code: string): number => (fallback.includes(code) ? fallback.indexOf(code) : fallback.length);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || rank(a[0]) - rank(b[0]) || (a[0] < b[0] ? -1 : 1))
    .map(([code]) => code);
}

/**
 * Fasst Abschnitte eines Lifts zusammen: gleicher Typ und Name, und das Ende des einen Abschnitts
 * ist der Anfang des nächsten. Bei Bahnen genügt ein gemeinsamer Endpunkt in beliebiger Richtung
 * (Ausweichen sind oft gegenläufig erfasst), und auch unbenannte Abschnitte werden zusammengefasst.
 * Bei anderen Liften nur benannte, damit zwei unbenannte Schlepplifte in Reihe getrennt bleiben.
 */
function liftUnits(lifts: readonly OsdLiftFeature[]): (id: string) => string {
  const parent = new Map<string, string>();
  const find = (id: string): string => {
    let current = id;
    while (parent.get(current) !== current) current = parent.get(current)!;
    return current;
  };
  const union = (a: string, b: string): void => {
    const [ra, rb] = [find(a), find(b)];
    if (ra < rb) parent.set(rb, ra);
    else if (rb < ra) parent.set(ra, rb);
  };

  const starts = new Map<string, string[]>();
  const add = (key: string, id: string): void => {
    const ids = starts.get(key);
    if (ids) ids.push(id);
    else starts.set(key, [id]);
  };
  const chainable: { id: string; group: string; rail: boolean; ends: [string, string] }[] = [];
  for (const { properties: p, geometry } of lifts) {
    parent.set(p.id, p.id);
    const ends = endpoints(geometry);
    const rail = RAIL_LIFT_TYPES.has(p.liftType ?? '');
    const name = p.name?.trim() ?? '';
    if (!ends || (!rail && name === '')) continue;
    const group = `${p.liftType}|${name}`;
    chainable.push({ id: p.id, group, rail, ends });
    add(`${group}|${ends[0]}`, p.id);
    if (rail) add(`${group}|${ends[1]}`, p.id);
  }
  for (const { id, group, rail, ends } of chainable) {
    for (const end of rail ? ends : [ends[1]]) {
      for (const other of starts.get(`${group}|${end}`) ?? []) union(id, other);
    }
  }
  return find;
}

/** Anfangs- und Endpunkt einer Liftlinie, auf ca. 1 m gerundet. */
function endpoints(geometry: OsdLiftFeature['geometry']): [string, string] | null {
  if (geometry?.type !== 'LineString' || !Array.isArray(geometry.coordinates)) return null;
  const coords = geometry.coordinates as number[][];
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (!first || !last || coords.length < 2) return null;
  const key = (c: number[]): string => `${c[0]?.toFixed(5)},${c[1]?.toFixed(5)}`;
  return [key(first), key(last)];
}

// ---------------------------------------------------------------------------
// Gebiete aus Liften eines größeren Eintrags bilden

type Coord = number[];

/**
 * Bildet Gebiete, die OpenSkiData nur als Teil eines größeren Eintrags führt, aus ihren Liften.
 * Jede Alpin-Piste des Eintrags gehört zum Lift, der ihr am nächsten liegt; Pisten an den
 * herausgelösten Liften zählen zum neuen Gebiet. Der Eintrag verliert diese Lifte und Pisten-km
 * (seine Höhen bleiben). ID des neuen Gebiets ist die kleinste seiner Lift-IDs.
 */
export function carveAreas(
  areas: readonly Area[],
  carves: readonly CarvedArea[],
  lifts: readonly OsdLiftFeature[],
  runs: readonly OsdRunFeature[],
  liftCountries: Map<string, string[]>,
): Area[] {
  const result = [...areas];
  if (carves.length === 0) return result;
  const counted = countedLifts(lifts);
  const unitOf = liftUnits(counted);
  const linesByLift = new Map<string, Coord[][]>();
  for (const { properties: p, geometry } of counted) {
    if (geometry?.type !== 'LineString') continue;
    const id = unitOf(p.id);
    linesByLift.set(id, [...(linesByLift.get(id) ?? []), geometry.coordinates as Coord[]]);
  }

  for (const carve of carves) {
    const index = result.findIndex((a) => a.id === carve.from);
    const source = result[index];
    if (!source) throw new Error(`carve: Gebiet ${carve.from} fehlt im Export`);
    const own = new Set(carve.lifts);
    for (const id of own) if (!source.liftIds.has(id)) throw new Error(`carve: Lift ${id} gehört nicht zu ${carve.from}`);
    const id = [...own].sort()[0]!;
    if (result.some((a) => a.id === id)) throw new Error(`carve: ID ${id} ist schon vergeben`);

    // Ebene Näherung in Metern, genau genug für Abstände innerhalb eines Gebiets
    const ky = (EARTH_RADIUS_KM * 1000 * Math.PI) / 180;
    const kx = ky * Math.cos((source.lat * Math.PI) / 180);
    const xy = (c: Coord): [number, number] => [(c[0] ?? 0) * kx, (c[1] ?? 0) * ky];
    const segments: { lift: string; a: [number, number]; b: [number, number] }[] = [];
    for (const lift of source.liftIds) {
      for (const line of linesByLift.get(lift) ?? []) {
        for (let i = 1; i < line.length; i++) segments.push({ lift, a: xy(line[i - 1]!), b: xy(line[i]!) });
      }
    }
    const nearestLift = (points: Coord[]): string | null => {
      let best: { lift: string; d: number } | null = null;
      for (const point of points) {
        const p = xy(point);
        for (const s of segments) {
          const d = segmentDistance(p, s.a, s.b);
          if (!best || d < best.d) best = { lift: s.lift, d };
        }
      }
      return best?.lift ?? null;
    };

    const coords: Coord[] = [...own].flatMap((lift) => (linesByLift.get(lift) ?? []).flat());
    let pisteKm = 0;
    for (const run of runs) {
      if (!run.properties.uses.includes('downhill')) continue;
      if (!run.properties.skiAreas.some((a) => a.properties.id === carve.from)) continue;
      const points = runPoints(run.geometry);
      const lift = nearestLift(points);
      if (lift === null || !own.has(lift)) continue;
      pisteKm += runLengthKm(run.geometry);
      coords.push(...points);
    }

    const heights = finite(coords.map((c) => c[2]));
    const liftCoords = [...own].flatMap((lift) => (linesByLift.get(lift) ?? []).flat());
    const lons = liftCoords.map((c) => c[0] ?? 0);
    const lats = liftCoords.map((c) => c[1] ?? 0);
    result[index] = {
      ...source,
      liftIds: new Set([...source.liftIds].filter((l) => !own.has(l))),
      pisteKm: Math.max(0, source.pisteKm - pisteKm),
    };
    result.push({
      id,
      rawName: carve.name,
      operating: true,
      downhill: true,
      countries: countriesOfLifts(own, liftCountries, []),
      region: source.region,
      lat: liftCoords.length > 0 ? (Math.min(...lats) + Math.max(...lats)) / 2 : source.lat,
      lon: liftCoords.length > 0 ? (Math.min(...lons) + Math.max(...lons)) / 2 : source.lon,
      pisteKm,
      liftIds: own,
      maxElevation: heights.length > 0 ? Math.max(...heights) : null,
      minElevation: heights.length > 0 ? Math.min(...heights) : null,
    });
  }
  return result;
}

const EARTH_RADIUS_KM = 6371.0088;

/** Alle Punkte einer Pistengeometrie (Linien und Pistenflächen). */
function runPoints(geometry: OsdRunFeature['geometry']): Coord[] {
  const c = geometry.coordinates;
  switch (geometry.type) {
    case 'LineString':
      return c as Coord[];
    case 'MultiLineString':
    case 'Polygon':
      return (c as Coord[][]).flat();
    case 'MultiPolygon':
      return (c as Coord[][][]).flat(2);
    default:
      return [];
  }
}

/** Länge einer Piste wie in den OpenSkiData-Statistiken: nur Linien, Pistenflächen zählen nicht. */
function runLengthKm(geometry: OsdRunFeature['geometry']): number {
  if (geometry.type === 'LineString') return lineLengthKm(geometry.coordinates as Coord[]);
  if (geometry.type === 'MultiLineString') return (geometry.coordinates as Coord[][]).reduce((sum, line) => sum + lineLengthKm(line), 0);
  return 0;
}

function lineLengthKm(line: Coord[]): number {
  let km = 0;
  for (let i = 1; i < line.length; i++) km += haversineKm(line[i - 1]!, line[i]!);
  return km;
}

function haversineKm(a: Coord, b: Coord): number {
  const rad = Math.PI / 180;
  const [lon1, lat1, lon2, lat2] = [(a[0] ?? 0) * rad, (a[1] ?? 0) * rad, (b[0] ?? 0) * rad, (b[1] ?? 0) * rad];
  const h = Math.sin((lat2 - lat1) / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin((lon2 - lon1) / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Abstand eines Punkts von einer Strecke in der Ebene. */
function segmentDistance(p: [number, number], a: [number, number], b: [number, number]): number {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const lengthSq = dx * dx + dy * dy;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSq));
  return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
}

/** Ländercodes nach Häufigkeit in den Orten, bei Gleichstand in Reihenfolge des Auftretens. */
export function countriesOf(places: readonly OsdPlace[]): string[] {
  const counts = new Map<string, number>();
  for (const place of places) {
    const code = place.iso3166_1Alpha2?.toUpperCase();
    if (code && /^[A-Z]{2}$/.test(code)) counts.set(code, (counts.get(code) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([code]) => code);
}

function finite(values: (number | null | undefined)[]): number[] {
  return values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
}

export function parseArea(
  feature: OsdSkiAreaFeature,
  liftIndex: Map<string, Set<string>>,
  liftCountries: Map<string, string[]> = new Map(),
): Area {
  const p = feature.properties;
  const liftIds = liftIndex.get(p.id) ?? new Set<string>();
  const runs = Object.values(p.statistics.runs.byActivity.downhill?.byDifficulty ?? {});
  const lifts = Object.values(p.statistics.lifts.byType);
  const parts = [...runs, ...lifts];
  const highs = finite(parts.map((s) => s.maxElevation));
  const lows = finite(parts.map((s) => s.minElevation));
  const [lon, lat] = p.viewportHint?.center ?? pointOf(feature);
  return {
    id: p.id,
    rawName: p.name?.trim() || null,
    operating: p.status === 'operating',
    downhill: p.activities.includes('downhill'),
    countries: countriesOfLifts(liftIds, liftCountries, p.places),
    region: p.places.find((pl) => pl.localized?.en?.region)?.localized?.en?.region ?? null,
    lat,
    lon,
    pisteKm: runs.reduce((sum, s) => sum + (s.lengthInKm ?? 0), 0),
    liftIds,
    maxElevation: highs.length > 0 ? Math.max(...highs) : null,
    minElevation: lows.length > 0 ? Math.min(...lows) : null,
  };
}

function pointOf(feature: OsdSkiAreaFeature): [number, number] {
  if (feature.geometry.type === 'Point') return feature.geometry.coordinates as [number, number];
  throw new Error(`Gebiet ${feature.properties.id} hat keinen Mittelpunkt`);
}

// ---------------------------------------------------------------------------
// Namen

/** Enthält nur lateinische Buchstaben (inkl. Akzente), Ziffern und Satzzeichen. */
export function isLatin(text: string): boolean {
  return /\p{L}/u.test(text) && !/[^\p{Script=Latin}\P{L}]/u.test(text);
}

/**
 * Name für die englische Seite und Aliase aus den Namensvarianten.
 * „芸北国際スキー場, Geihoku Kokusai“ → „Geihoku Kokusai“, Alias „芸北国際スキー場“.
 * „Уязы-Тау (Uyazy-Tau)“ → „Uyazy-Tau“, „Krasiya - КРАСИЯ“ → „Krasiya“.
 * Das deutsche Präfix „Skigebiet“ entfällt: „Skigebiet Hinterstoder“ → „Hinterstoder“.
 */
export function pickName(rawName: string): { name: string; aliases: string[] } {
  const variants = rawName
    .split(', ')
    .map((v) => v.trim())
    .filter((v) => v !== '');
  const picked = variants.find(isLatin) ?? variants.map(latinPart).find((v) => v !== null) ?? variants[0] ?? rawName;
  const name = picked.replace(/^Skigebiet\s+/, '');
  return { name, aliases: unique(variants.filter((v) => v !== name)) };
}

/** Lateinische Teile eines gemischten Namens, getrennt durch Bindestrich oder Klammern. */
function latinPart(variant: string): string | null {
  const parts = variant
    .split(/\s[-–]\s|[()（）]/)
    .map((v) => v.trim())
    .filter(isLatin);
  return parts.length > 0 ? parts.join(' - ') : null;
}

function unique(texts: string[]): string[] {
  const seen = new Set<string>();
  return texts.filter((t) => {
    const key = normalize(t);
    if (key === '' || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Aufbau des Datensatzes

export interface ImportReport {
  /** Gebiete im Export */
  total: number;
  excluded: { id: string; name: string | null; reason: string }[];
  merged: { target: string; parts: string[] }[];
  /** Zusammengelegte Teile mit gemeinsamen Liften: Pisten-km wären doppelt gezählt */
  mergeOverlaps: string[];
  /** Automatisch eingefaltete Teilgebiete */
  folded: { child: string; parent: string; shared: number; childLifts: number }[];
  /** Gebiete mit gemeinsamen Liften, die nicht eingefaltet wurden */
  partialOverlaps: { a: string; b: string; shared: number }[];
  /** Gebiete, die mehrere benannte Teilgebiete aufgenommen haben: Netz oder Verbund? */
  containers: { id: string; name: string; children: string[] }[];
  /** Namen, die trotz Regionszusatz doppelt sind (per rename oder exclude lösen) */
  duplicateNames: string[];
  /** Override-IDs, die es im Export nicht gibt */
  unknownOverrideIds: string[];
  /** Doppelte Namen, die um die Region ergänzt wurden */
  disambiguated: string[];
  /** Namen ohne lateinische Schrift */
  nonLatinNames: string[];
  /** Gebiete ohne Höhenangabe (nicht übernommen) */
  missingElevation: string[];
  /** Aliase, die verworfen wurden, weil sie einem Gebietsnamen gleichen */
  droppedAliases: string[];
}

interface Entry {
  area: Area;
  /** Namen weiterer Teile (Merge, Teilgebiete), werden Aliase */
  absorbedNames: string[];
  children: string[];
}

function label(area: Area): string {
  return area.rawName ?? `(ohne Name ${area.id})`;
}

export function buildResorts(
  areas: readonly Area[],
  overrides: Overrides,
): { resorts: Resort[]; report: ImportReport } {
  const byId = new Map(areas.map((a) => [a.id, a]));
  const report: ImportReport = {
    total: areas.length,
    excluded: [],
    merged: [],
    mergeOverlaps: [],
    folded: [],
    partialOverlaps: [],
    containers: [],
    unknownOverrideIds: [],
    disambiguated: [],
    duplicateNames: [],
    nonLatinNames: [],
    missingElevation: [],
    droppedAliases: [],
  };

  const overrideIds = [
    ...Object.keys(overrides.exclude),
    ...Object.entries(overrides.merge).flat(2),
    ...overrides.keepSeparate,
    ...Object.keys(overrides.rename),
    ...Object.keys(overrides.aliases),
    ...Object.keys(overrides.dropAliases),
    ...Object.keys(overrides.countries),
  ];
  report.unknownOverrideIds = [...new Set(overrideIds.filter((id) => !byId.has(id)))];
  const knownLifts = new Set(areas.flatMap((a) => [...a.liftIds]));
  const droppedLifts = new Set(Object.keys(overrides.dropLifts));
  report.unknownOverrideIds.push(...[...droppedLifts].filter((id) => !knownLifts.has(id)));

  // 1. Nur Alpin-Gebiete in Betrieb; Verbünde und Fehleinträge raus
  const entries = new Map<string, Entry>();
  for (const area of areas) {
    if (!area.operating || !area.downhill) continue;
    const reason = overrides.exclude[area.id];
    if (reason !== undefined) {
      report.excluded.push({ id: area.id, name: area.rawName, reason });
      continue;
    }
    const liftIds = new Set([...area.liftIds].filter((id) => !droppedLifts.has(id)));
    entries.set(area.id, { area: { ...area, liftIds }, absorbedNames: [], children: [] });
  }

  // 2. Getrennt erfasste Teile desselben Netzes zusammenlegen
  for (const [targetId, partIds] of Object.entries(overrides.merge)) {
    const target = entries.get(targetId);
    if (!target) continue;
    const merged: string[] = [];
    for (const partId of partIds) {
      const part = entries.get(partId);
      if (!part) continue;
      const shared = [...part.area.liftIds].filter((l) => target.area.liftIds.has(l)).length;
      if (shared > 0) report.mergeOverlaps.push(`${label(part.area)} → ${label(target.area)}: ${shared} gemeinsame Lifte`);
      mergeInto(target, part);
      entries.delete(partId);
      merged.push(label(part.area));
    }
    report.merged.push({ target: label(target.area), parts: merged });
  }

  // 3. Teilgebiete in das größere Gebiet einfalten (kleinere zuerst, damit Ketten aufgehen)
  const keep = new Set(overrides.keepSeparate);
  const liftOwners = new Map<string, string[]>();
  for (const [id, { area }] of entries) {
    for (const lift of area.liftIds) {
      const owners = liftOwners.get(lift);
      if (owners) owners.push(id);
      else liftOwners.set(lift, [id]);
    }
  }
  // Positiv, wenn a größer ist als b. Bei gleicher Größe (Doppeleinträge) entscheidet die ID,
  // damit genau einer übrig bleibt.
  const isLarger = (a: Area, b: Area): number =>
    a.liftIds.size - b.liftIds.size || a.pisteKm - b.pisteKm || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
  const sizeOrder = [...entries.values()].sort((a, b) => isLarger(a.area, b.area));
  const parentOf = new Map<string, string>();
  const root = (id: string): string => {
    let current = id;
    while (parentOf.has(current)) current = parentOf.get(current)!;
    return current;
  };

  for (const child of sizeOrder) {
    const shared = new Map<string, number>();
    for (const lift of child.area.liftIds) {
      for (const owner of liftOwners.get(lift) ?? []) {
        if (owner !== child.area.id) shared.set(owner, (shared.get(owner) ?? 0) + 1);
      }
    }
    let best: { id: string; count: number } | null = null;
    for (const [id, count] of shared) {
      const other = entries.get(id)!.area;
      if (isLarger(other, child.area) <= 0) continue;
      if (!best || count > best.count) best = { id, count };
    }
    const enough = best && best.count >= SUB_AREA_SHARE * child.area.liftIds.size;
    if (best && enough && !keep.has(child.area.id)) {
      const parentId = root(best.id);
      parentOf.set(child.area.id, parentId);
      report.folded.push({
        child: label(child.area),
        parent: label(entries.get(best.id)!.area),
        shared: best.count,
        childLifts: child.area.liftIds.size,
      });
    }
    for (const [id, count] of shared) {
      if (isLarger(entries.get(id)!.area, child.area) <= 0) continue;
      if (enough && id === best!.id && !keep.has(child.area.id)) continue;
      report.partialOverlaps.push({ a: label(child.area), b: label(entries.get(id)!.area), shared: count });
    }
  }
  for (const [childId] of [...parentOf].reverse()) {
    const child = entries.get(childId)!;
    const parent = entries.get(root(childId))!;
    // Unbenanntes Netz übernimmt den Namen seines größten benannten Teilgebiets.
    if (!parent.area.rawName && child.area.rawName) parent.area.rawName = child.area.rawName;
    else if (child.area.rawName) parent.absorbedNames.push(child.area.rawName);
    parent.absorbedNames.push(...child.absorbedNames);
    if (child.area.rawName) parent.children.push(child.area.rawName);
    entries.delete(childId);
  }
  for (const { area, children } of entries.values()) {
    if (children.length >= 2) report.containers.push({ id: area.id, name: label(area), children });
  }

  // 4. Mindestgröße und Namen
  const selected: { area: Area; name: string; aliases: string[] }[] = [];
  for (const { area, absorbedNames } of entries.values()) {
    if (!area.rawName) continue;
    if (area.pisteKm < MIN_PISTE_KM || area.liftIds.size < MIN_LIFTS) continue;
    if (area.maxElevation === null || area.minElevation === null || area.countries.length === 0) {
      report.missingElevation.push(label(area));
      continue;
    }
    const picked = pickName(area.rawName);
    const name = overrides.rename[area.id] ?? picked.name;
    const variants = [picked.name, ...picked.aliases, ...absorbedNames.flatMap((n) => [pickName(n).name, ...pickName(n).aliases])];
    const aliases = [...(overrides.aliases[area.id] ?? []), ...variants];
    if (!isLatin(name)) report.nonLatinNames.push(name);
    const countries = overrides.countries[area.id];
    selected.push({ area: countries ? { ...area, countries } : area, name, aliases });
  }

  // 5. Doppelte Namen um die Region ergänzen
  const nameCount = new Map<string, number>();
  for (const s of selected) nameCount.set(normalize(s.name), (nameCount.get(normalize(s.name)) ?? 0) + 1);
  for (const s of selected) {
    if (nameCount.get(normalize(s.name))! > 1 && s.area.region && overrides.rename[s.area.id] === undefined) {
      s.name = `${s.name} (${s.area.region})`;
      report.disambiguated.push(s.name);
    }
  }

  const finalCount = new Map<string, number>();
  for (const s of selected) finalCount.set(normalize(s.name), (finalCount.get(normalize(s.name)) ?? 0) + 1);
  report.duplicateNames = selected
    .filter((s) => finalCount.get(normalize(s.name))! > 1)
    .map((s) => `${s.name} [${s.area.id}]`);

  // 6. Aliase bereinigen: nicht der eigene Name, nicht der Name eines anderen Gebiets
  const allNames = new Set(selected.map((s) => normalize(s.name)));
  const resorts: Resort[] = selected.map(({ area, name, aliases }) => {
    const own = normalize(name);
    const unwanted = new Set((overrides.dropAliases[area.id] ?? []).map(normalize));
    const cleaned = unique(aliases).filter((alias) => {
      const key = normalize(alias);
      if (key === own || unwanted.has(key)) return false;
      if (allNames.has(key)) {
        report.droppedAliases.push(`${alias} (bei ${name})`);
        return false;
      }
      return true;
    });
    const top = area.maxElevation!;
    return {
      id: area.id.slice(0, ID_LENGTH),
      name,
      aliases: cleaned,
      countries: area.countries,
      lat: round(area.lat, 3),
      lon: round(area.lon, 3),
      pisteKm: Math.round(area.pisteKm),
      lifts: area.liftIds.size,
      topElevation: Math.round(top),
      verticalDrop: Math.round(top - area.minElevation!),
    };
  });
  resorts.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { resorts, report };
}

function mergeInto(target: Entry, part: Entry): void {
  const a = target.area;
  const b = part.area;
  a.pisteKm += b.pisteKm;
  for (const lift of b.liftIds) a.liftIds.add(lift);
  a.maxElevation = combine(a.maxElevation, b.maxElevation, Math.max);
  a.minElevation = combine(a.minElevation, b.minElevation, Math.min);
  for (const c of b.countries) if (!a.countries.includes(c)) a.countries.push(c);
  if (b.rawName) target.absorbedNames.push(b.rawName);
  target.absorbedNames.push(...part.absorbedNames);
}

function combine(a: number | null, b: number | null, pick: (x: number, y: number) => number): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return pick(a, b);
}

function round(value: number, digits: number): number {
  const f = 10 ** digits;
  return Math.round(value * f) / f;
}
