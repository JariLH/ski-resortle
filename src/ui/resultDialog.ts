import type { Resort } from '../data/resort.ts';
import {
  challengeFromGame,
  challengeMessage,
  challengeUrl,
  challengeWinner,
} from '../logic/challenge.ts';
import type { Comparison } from '../logic/compare.ts';
import { flagEmoji, formatKm, guessesText } from '../logic/format.ts';
import { MAX_GUESSES, type GameState } from '../logic/game.ts';
import { h } from './dom.ts';
import { closeIcon } from './icons.ts';
import { createResortMap, type MarkedResort } from './map.ts';

export interface GuessResult {
  resort: Resort;
  comparison: Comparison;
}

/** Ergebnis eines Spielers: gelöst und Tippfolge. */
export interface PlayerGuesses {
  won: boolean;
  guesses: GuessResult[];
}

export interface ResultDialogOptions {
  state: GameState;
  target: Resort;
  guesses: GuessResult[];
  /** Ergebnis des Herausforderers aus dem Challenge-Link, sonst `null` */
  challenger: PlayerGuesses | null;
  resorts: readonly Resort[];
  marked: readonly MarkedResort[];
  onClose: () => void;
}

/** Auf Touch-Geräten das System-Teilen-Menü, sonst in die Zwischenablage kopieren. */
async function shareLink(message: string, url: string): Promise<'shared' | 'copied' | 'failed'> {
  const preferNativeShare = typeof navigator.share === 'function' && matchMedia('(pointer: coarse)').matches;
  if (preferNativeShare) {
    try {
      await navigator.share({ text: message, url });
      return 'shared';
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'shared';
    }
  }
  try {
    await navigator.clipboard.writeText(`${message}\n${url}`);
    return 'copied';
  } catch {
    return 'failed';
  }
}

/** Eigene Tippfolge allein (ohne Challenge). */
function summaryList(guesses: GuessResult[]): HTMLElement {
  return h(
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
}

function versusCell(guess: GuessResult | undefined, index: number): HTMLElement {
  if (!guess) return h('div', { class: 'versus-cell empty', 'aria-hidden': 'true' });
  const { resort, comparison } = guess;
  return h(
    'div',
    { class: `versus-cell ${comparison.correct ? 'correct' : 'wrong'}` },
    h('span', { class: 'versus-name' }, h('span', { class: 'versus-index' }, `${index + 1}.`), ` ${resort.name}`),
    h('span', { class: 'versus-distance' }, comparison.correct ? 'Correct' : formatKm(comparison.distanceKm)),
  );
}

/** Beide Tippfolgen nebeneinander: Tipp 1 neben Tipp 1 usw. Wer weniger brauchte, ist grün markiert. */
function versusTable(you: PlayerGuesses, challenger: PlayerGuesses): HTMLElement {
  const winner = challengeWinner(
    { won: you.won, guesses: you.guesses.length },
    { won: challenger.won, guesses: challenger.guesses.length },
  );
  const head = (label: string, player: PlayerGuesses, isWinner: boolean) =>
    h(
      'div',
      { class: `versus-head${isWinner ? ' winner' : ''}` },
      h('span', { class: 'versus-label' }, label),
      h('span', { class: 'versus-count' }, player.won ? guessesText(player.guesses.length) : 'Not solved'),
    );
  const cells: HTMLElement[] = [];
  const rows = Math.max(you.guesses.length, challenger.guesses.length);
  for (let i = 0; i < rows; i++) {
    cells.push(versusCell(you.guesses[i], i), versusCell(challenger.guesses[i], i));
  }
  return h(
    'div',
    { class: 'versus', role: 'group', 'aria-label': 'Your guesses next to your challenger’s guesses' },
    head('You', you, winner === 'you'),
    head('Challenger', challenger, winner === 'challenger'),
    ...cells,
  );
}

/**
 * End-Popup: Karte auf die Lösung gezoomt, Anzahl Versuche, Tippübersicht bzw. Vergleich
 * mit dem Herausforderer, „Challenge a friend“.
 * Gibt eine Funktion zurück, die das Popup ohne `onClose` entfernt (beim Verlassen der Seite).
 */
export function openResultDialog(options: ResultDialogOptions): () => void {
  const { state, target, guesses, challenger, resorts, marked, onClose } = options;
  const won = state.status === 'won';
  const count = guesses.length;

  const mapEl = h('div', { class: 'dialog-map' });
  const closeButton = h('button', { class: 'icon-button dialog-close', type: 'button', 'aria-label': 'Close' }, closeIcon());
  const challengeButton = h('button', { class: 'button primary', type: 'button' }, 'Challenge a friend');
  const shareStatus = h('p', { class: 'share-status', role: 'status' });

  const attempts = won
    ? `Solved in ${count} of ${MAX_GUESSES} ${count === 1 ? 'guess' : 'guesses'}`
    : `Not solved · ${count} of ${MAX_GUESSES} guesses used`;

  let details: HTMLElement[] = [];
  if (challenger) {
    details = [versusTable({ won, guesses }, challenger)];
  } else if (count > 0) {
    details = [summaryList(guesses)];
  }

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
      ...details,
      h('div', { class: 'share' }, challengeButton, shareStatus),
    ),
  );

  document.body.append(dialog);
  dialog.showModal();
  // Karte erst nach dem Öffnen erzeugen, damit sie ihre Größe kennt.
  const map = createResortMap(mapEl, { resorts, focus: target });
  map.setMarked(marked);

  challengeButton.addEventListener('click', async () => {
    const challenge = challengeFromGame(state);
    const url = challengeUrl(`${location.origin}${location.pathname}`, challenge);
    const result = await shareLink(challengeMessage(challenge), url);
    shareStatus.textContent =
      result === 'copied' ? 'Link copied to clipboard' : result === 'failed' ? 'Could not share. Please try again.' : '';
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
