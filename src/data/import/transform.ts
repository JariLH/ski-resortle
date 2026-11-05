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
    status: string | null;
    liftType: string | null;
    skiAreas: { properties: { id: string } }[];
  };
}

// ---------------------------------------------------------------------------
// Regeln aus SPEC.md

export const MIN_PISTE_KM = 3;
export const MIN_LIFTS = 3;
/** Förderbänder zählen nicht als Lift. */
const IGNORED_LIFT_TYPES = new Set(['magic_carpet']);
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
  rename: Record<string, string>;
  aliases: Record<string, string[]>;
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

/** Lift-ID-Mengen je Gebiet: nur Lifte in Betrieb und ohne Förderbänder. */
export function liftsByArea(lifts: readonly OsdLiftFeature[]): Map<string, Set<string>> {
  const index = new Map<string, Set<string>>();
  for (const { properties: lift } of lifts) {
    if (lift.status !== 'operating' || IGNORED_LIFT_TYPES.has(lift.liftType ?? '')) continue;
    for (const area of lift.skiAreas) {
      const id = area.properties.id;
      let set = index.get(id);
      if (!set) index.set(id, (set = new Set()));
      set.add(lift.id);
    }
  }
  return index;
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

export function parseArea(feature: OsdSkiAreaFeature, liftIndex: Map<string, Set<string>>): Area {
  const p = feature.properties;
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
    countries: countriesOf(p.places),
    region: p.places.find((pl) => pl.localized?.en?.region)?.localized?.en?.region ?? null,
    lat,
    lon,
    pisteKm: runs.reduce((sum, s) => sum + (s.lengthInKm ?? 0), 0),
    liftIds: liftIndex.get(p.id) ?? new Set(),
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
  ];
  report.unknownOverrideIds = [...new Set(overrideIds.filter((id) => !byId.has(id)))];

  // 1. Nur Alpin-Gebiete in Betrieb; Verbünde und Fehleinträge raus
  const entries = new Map<string, Entry>();
  for (const area of areas) {
    if (!area.operating || !area.downhill) continue;
    const reason = overrides.exclude[area.id];
    if (reason !== undefined) {
      report.excluded.push({ id: area.id, name: area.rawName, reason });
      continue;
    }
    entries.set(area.id, { area: { ...area, liftIds: new Set(area.liftIds) }, absorbedNames: [], children: [] });
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
    selected.push({ area, name, aliases });
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
    const cleaned = unique(aliases).filter((alias) => {
      const key = normalize(alias);
      if (key === own) return false;
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
