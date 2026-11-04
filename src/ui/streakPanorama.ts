import { buildPanorama, type Point } from './panoramaGeometry.ts';

const SVG_NS = 'http://www.w3.org/2000/svg';

function el<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

const pts = (points: Point[]) => points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

/** Fläche unter einer Silhouette bis zum unteren Rand. */
function area(points: Point[], height: number): string {
  const first = points[0]!;
  const last = points.at(-1)!;
  return pts([...points, { x: last.x, y: height }, { x: first.x, y: height }]);
}

/** Illustriertes Bergpanorama: Jeder Tag der Serie ist ein Gipfel, der Weg zeigt den Fortschritt. */
export function streakPanorama(streak: number): SVGSVGElement {
  const p = buildPanorama(streak);
  const svg = el('svg', {
    class: 'panorama',
    viewBox: `0 0 ${p.width} ${p.height}`,
    role: 'img',
    'aria-label': `Current streak: ${streak} ${streak === 1 ? 'day' : 'days'}`,
  });

  svg.append(
    el('polygon', { class: 'range-back', points: area(p.backRidge, p.height) }),
    el('polygon', { class: 'range-front', points: area(p.ridge, p.height) }),
  );
  for (const cap of p.snowCaps) svg.append(el('polygon', { class: 'snow', points: pts(cap) }));

  if (p.pathTodo.length > 1) svg.append(el('polyline', { class: 'path-todo', points: pts(p.pathTodo) }));
  if (p.pathDone.length > 1) svg.append(el('polyline', { class: 'path-done', points: pts(p.pathDone) }));

  for (const slot of p.slots) {
    // Fähnchen auf jedem erreichten Gipfel
    if (slot.day > 0 && slot.state !== 'future') {
      const { x, y } = slot.summit;
      svg.append(
        el('line', { class: 'flag-pole', x1: x, y1: y, x2: x, y2: y - 24 }),
        el('polygon', { class: 'flag', points: pts([{ x, y: y - 24 }, { x: x + 15, y: y - 19 }, { x, y: y - 14 }]) }),
      );
    }
    const label = el('text', {
      class: `peak-number ${slot.state}`,
      x: slot.label.x,
      y: slot.label.y,
      'text-anchor': 'middle',
      'aria-hidden': 'true',
    });
    label.textContent = String(slot.day);
    svg.append(label);
  }
  return svg;
}
