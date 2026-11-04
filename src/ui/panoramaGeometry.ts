// Geometrie des Bergpanoramas für die Serie (reine Funktionen, ohne DOM).
// Tag 0 ist der Startpunkt im Tal, ab Tag 1 steht jeder Tag für einen Gipfel.
// Die Form eines Gipfels hängt nur von seiner Tagesnummer ab, damit die Kette
// beim Weiterwandern gleich aussieht.

export interface Point {
  x: number;
  y: number;
}

export type SlotState = 'past' | 'current' | 'future';

export interface PanoramaSlot {
  day: number;
  /** Gipfel bzw. beim Tag 0 der Startpunkt im Tal */
  summit: Point;
  state: SlotState;
  /** Position der Zahl im Berg, unterhalb der Schneekappe */
  label: Point;
}

export interface Panorama {
  width: number;
  height: number;
  slots: PanoramaSlot[];
  /** Silhouette der vorderen Bergreihe von links nach rechts */
  ridge: Point[];
  /** Silhouette der hinteren Bergreihe */
  backRidge: Point[];
  snowCaps: Point[][];
  /** Zurückgelegter Weg entlang des Grats bis zum aktuellen Gipfel */
  pathDone: Point[];
  /** Noch offener Weg ab dem aktuellen Gipfel */
  pathTodo: Point[];
}

export interface PanoramaOptions {
  /** Anzahl sichtbarer Tage (inkl. Startpunkt, solange er sichtbar ist) */
  visible?: number;
  /** Wie viele erreichte Tage links vom aktuellen sichtbar bleiben */
  before?: number;
}

const SLOT = 100;
const HEIGHT = 240;
const START_Y = 208;
const CAP_DEPTH = 24;

/** Deterministischer Pseudozufall in [0, 1) für eine Ganzzahl. */
export function hash01(n: number, salt: number): number {
  let t = (Math.imul(n, 374761393) + Math.imul(salt, 668265263)) | 0;
  t = Math.imul(t ^ (t >>> 13), 1274126177);
  t ^= t >>> 16;
  return (t >>> 0) / 4294967296;
}

/** Erster sichtbarer Tag: der aktuelle Tag steht nach `before` erreichten Tagen. */
export function firstVisibleDay(streak: number, before: number): number {
  return Math.max(0, streak - before);
}

function summitY(day: number): number {
  return day === 0 ? START_Y : 70 + hash01(day, 1) * 55;
}

function valleyY(day: number): number {
  return 172 + hash01(day, 2) * 28;
}

/** Punkt auf der Strecke a→b, an dem die Höhe `y` erreicht ist (begrenzt auf die Strecke). */
function pointAtY(a: Point, b: Point, y: number): Point {
  const t = b.y === a.y ? 1 : Math.min(0.9, Math.max(0, (y - a.y) / (b.y - a.y)));
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function buildPanorama(streak: number, options: PanoramaOptions = {}): Panorama {
  const visible = options.visible ?? 7;
  const before = options.before ?? 3;
  const first = firstVisibleDay(streak, before);
  const width = visible * SLOT;
  const xOf = (day: number) => (day - first) * SLOT + SLOT / 2;

  // Grat: Gipfel, Schultern und Täler, links und rechts einen Tag über den Rand hinaus.
  const ridge: Point[] = [];
  const summitIndex = new Map<number, number>();
  const firstDay = Math.max(0, first - 1);
  if (firstDay === 0 && xOf(0) > 0) ridge.push({ x: 0, y: START_Y + 4 });
  for (let day = firstDay; day <= first + visible; day++) {
    const summit = { x: xOf(day), y: summitY(day) };
    summitIndex.set(day, ridge.length);
    ridge.push(summit);
    if (day === first + visible) break;
    const next = { x: xOf(day + 1), y: summitY(day + 1) };
    // Vom Startpunkt geht es ohne Tal direkt hinauf.
    const valley = day === 0 ? { x: summit.x + SLOT * 0.45, y: START_Y - 6 } : { x: summit.x + SLOT / 2, y: valleyY(day) };
    const shoulderA = {
      x: (summit.x + valley.x) / 2,
      y: (summit.y + valley.y) / 2 + (hash01(day, 3) - 0.5) * 16,
    };
    const shoulderB = {
      x: (valley.x + next.x) / 2,
      y: (valley.y + next.y) / 2 + (hash01(day, 4) - 0.5) * 16,
    };
    if (day === 0) ridge.push(valley, shoulderB);
    else ridge.push(shoulderA, valley, shoulderB);
  }

  // Hintere Reihe: versetzte, etwas niedrigere Gipfel
  const backRidge: Point[] = [];
  for (let day = firstDay - 1; day <= first + visible; day++) {
    const x = xOf(day) + SLOT / 2;
    backRidge.push({ x: x - SLOT / 2, y: 150 + hash01(day, 5) * 20 });
    backRidge.push({ x, y: 95 + hash01(day, 6) * 40 });
  }

  const slots: PanoramaSlot[] = [];
  const snowCaps: Point[][] = [];
  for (let day = first; day < first + visible; day++) {
    const index = summitIndex.get(day)!;
    const summit = ridge[index]!;
    const state: SlotState = day < streak ? 'past' : day === streak ? 'current' : 'future';
    if (day === 0) {
      slots.push({ day, summit, state, label: { x: summit.x, y: HEIGHT - 10 } });
      continue;
    }
    const left = ridge[index - 1]!;
    const right = ridge[index + 1]!;
    const capY = summit.y + CAP_DEPTH;
    const l = pointAtY(summit, left, capY);
    const r = pointAtY(summit, right, capY);
    snowCaps.push([
      summit,
      r,
      { x: r.x + (l.x - r.x) / 3, y: capY + 7 },
      { x: (l.x + r.x) / 2, y: capY - 3 },
      { x: l.x + (r.x - l.x) / 3, y: capY + 6 },
      l,
    ]);
    slots.push({ day, summit, state, label: { x: summit.x, y: capY + 34 } });
  }

  const currentX = xOf(streak);
  const doneFromX = first === 0 ? xOf(0) : 0;
  const pathDone = ridge.filter((p) => p.x >= doneFromX && p.x <= currentX);
  const pathTodo = ridge.filter((p) => p.x >= currentX && p.x <= width);

  return { width, height: HEIGHT, slots, ridge, backRidge, snowCaps, pathDone, pathTodo };
}
