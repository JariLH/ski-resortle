import type { Resort } from '../data/resort.ts';
import type { Comparison } from '../logic/compare.ts';
import { MAX_GUESSES, type GameState } from '../logic/game.ts';
import { flagEmoji, formatKm, shareText } from '../logic/share.ts';
import { h } from './dom.ts';
import { closeIcon } from './icons.ts';
import { createResortMap, type MarkedResort } from './map.ts';

export interface ResultDialogOptions {
  state: GameState;
  target: Resort;
  guesses: { resort: Resort; comparison: Comparison }[];
  resorts: readonly Resort[];
  marked: readonly MarkedResort[];
  onClose: () => void;
}

function shareUrl(): string {
  return `${location.origin}${location.pathname}`;
}

/** Auf Touch-Geräten das System-Teilen-Menü, sonst in die Zwischenablage kopieren. */
async function share(text: string): Promise<'shared' | 'copied' | 'failed'> {
  const preferNativeShare = typeof navigator.share === 'function' && matchMedia('(pointer: coarse)').matches;
  if (preferNativeShare) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'shared';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/**
 * End-Popup: Karte auf die Lösung gezoomt, Anzahl Versuche, Tippübersicht, Teilen.
 * Gibt eine Funktion zurück, die das Popup ohne `onClose` entfernt (beim Verlassen der Seite).
 */
export function openResultDialog(options: ResultDialogOptions): () => void {
  const { state, target, guesses, resorts, marked, onClose } = options;
  const won = state.status === 'won';
  const count = guesses.length;

  const mapEl = h('div', { class: 'dialog-map' });
  const closeButton = h('button', { class: 'icon-button dialog-close', type: 'button', 'aria-label': 'Close' }, closeIcon());
  const shareButton = h('button', { class: 'button primary', type: 'button' }, 'Share result');
  const shareStatus = h('p', { class: 'share-status', role: 'status' });

  const summary = h(
    'ol',
    { class: 'summary' },
    ...guesses.map(({ resort, comparison }) =>
      h(
        'li',
        { class: comparison.correct ? 'correct' : 'wrong' },
        h('span', { class: 'summary-name' }, resort.name),
        h('span', { class: 'summary-distance' }, comparison.correct ? 'Correct' : formatKm(comparison.distanceKm)),
      ),
    ),
  );

  const attempts = won
    ? `Solved in ${count} of ${MAX_GUESSES} ${count === 1 ? 'guess' : 'guesses'}`
    : `Not solved · ${count} of ${MAX_GUESSES} guesses used`;

  const dialog = h(
    'dialog',
    { class: 'result-dialog', 'aria-labelledby': 'result-title' },
    closeButton,
    mapEl,
    h(
      'div',
      { class: 'dialog-body' },
      h('h2', { id: 'result-title' }, won ? 'You found it!' : 'The resort was'),
      h('p', { class: 'result-resort' }, `${flagEmoji(target.country)} ${target.name}`),
      h('p', { class: 'result-attempts' }, attempts),
      count > 0 ? summary : null,
      h('div', { class: 'share' }, shareButton, shareStatus),
    ),
  );

  document.body.append(dialog);
  dialog.showModal();
  // Karte erst nach dem Öffnen erzeugen, damit sie ihre Größe kennt.
  const map = createResortMap(mapEl, { resorts, focus: target });
  map.setMarked(marked);

  shareButton.addEventListener('click', async () => {
    const text = shareText({
      mode: state.mode,
      date: state.date,
      status: state.status,
      comparisons: guesses.map((g) => g.comparison),
      url: shareUrl(),
    });
    const result = await share(text);
    shareStatus.textContent =
      result === 'copied' ? 'Copied to clipboard' : result === 'failed' ? 'Could not share. Please try again.' : '';
  });

  closeButton.addEventListener('click', () => dialog.close());
  // Klick auf den abgedunkelten Hintergrund schließt das Popup.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });
  let removed = false;
  const remove = () => {
    if (removed) return;
    removed = true;
    map.destroy();
    dialog.remove();
  };
  dialog.addEventListener('close', () => {
    if (removed) return;
    remove();
    onClose();
  });
  return remove;
}
