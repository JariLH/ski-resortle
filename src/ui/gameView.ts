import type { Resort } from '../data/resort.ts';
import type { Challenge } from '../logic/challenge.ts';
import { compareResorts } from '../logic/compare.ts';
import { MAX_GUESSES, revealResult, submitGuess, type GameState } from '../logic/game.ts';
import { resolveInput } from '../logic/search.ts';
import { recordLoss, recordWin } from '../logic/streak.ts';
import { attachAutocomplete } from './autocomplete.ts';
import { h } from './dom.ts';
import { guessHeader, guessRow } from './guessRow.ts';
import { submitIcon } from './icons.ts';
import { createResortMap, type MarkedResort } from './map.ts';
import { openResultDialog, type PlayerGuesses } from './resultDialog.ts';
import { loadStreak, saveDailyGame, saveStreak } from './storage.ts';

export interface GameViewOptions {
  state: GameState;
  resorts: readonly Resort[];
  /** Challenge eines Freundes; der Vergleich erscheint im End-Popup. */
  challenge?: Challenge | null;
  /** Kurzer Hinweis über der Karte, z. B. bei einem abgelaufenen Challenge-Link */
  notice?: string;
  /** Wird nach dem Schließen des End-Popups aufgerufen. */
  onExit: () => void;
}

/** Rundenansicht. Gibt eine Aufräumfunktion zurück. */
export function renderGameView(root: HTMLElement, options: GameViewOptions): () => void {
  const { resorts, onExit, challenge, notice } = options;
  let state = options.state;
  const byId = new Map(resorts.map((r) => [r.id, r]));
  const target = byId.get(state.targetId);
  if (!target) throw new Error(`Skigebiet ${state.targetId} nicht gefunden`);

  const mapEl = h('div', { class: 'game-map' });
  const input = h('input', {
    class: 'guess-input',
    type: 'text',
    autocomplete: 'off',
    autocapitalize: 'off',
    spellcheck: 'false',
    enterkeyhint: 'send',
    role: 'combobox',
    'aria-label': 'Ski resort',
    'aria-autocomplete': 'list',
    'aria-controls': 'suggestions',
    'aria-expanded': 'false',
  });
  const suggestions = h('ul', { class: 'suggestions', id: 'suggestions', role: 'listbox', hidden: '' });
  const submitButton = h('button', { class: 'submit-button', type: 'button', 'aria-label': 'Submit guess' }, submitIcon());
  const message = h('p', { class: 'message', role: 'status', 'aria-live': 'polite' });
  // Kopfzeile erst ab dem ersten Tipp anzeigen.
  const header = guessHeader();
  header.hidden = true;
  const table = h('div', { class: 'guess-table', role: 'table', 'aria-label': 'Your guesses' }, header);
  const showResultButton = h('button', { class: 'button secondary show-result', type: 'button' }, 'Show result');

  root.replaceChildren(
    h(
      'div',
      { class: 'game' },
      notice ? h('p', { class: 'notice', role: 'status' }, notice) : null,
      mapEl,
      h('div', { class: 'guess-form' }, h('div', { class: 'input-wrap' }, input, suggestions), submitButton),
      message,
      table,
      showResultButton,
    ),
  );

  const map = createResortMap(mapEl, {
    resorts,
    onResortClick: (resort) => {
      if (state.status !== 'playing') return;
      input.value = resort.name;
      setMessage('');
    },
  });
  const autocomplete = attachAutocomplete(input, suggestions, resorts, submit);
  submitButton.addEventListener('click', submit);
  showResultButton.addEventListener('click', () => {
    finish(revealResult(state));
  });

  function guessedResorts(): Resort[] {
    return state.guesses.map((id) => byId.get(id)).filter((r): r is Resort => r !== undefined);
  }

  function markedResorts(): MarkedResort[] {
    const marked: MarkedResort[] = guessedResorts()
      .filter((r) => r.id !== target!.id)
      .map((r) => ({ id: r.id, state: 'wrong', distanceKm: compareResorts(r, target!).distanceKm }));
    if (state.status !== 'playing') marked.push({ id: target!.id, state: 'correct' });
    return marked;
  }

  function setMessage(text: string, node?: Node): void {
    message.replaceChildren(text);
    if (node) message.append(node);
  }

  function updateControls(): void {
    const playing = state.status === 'playing';
    input.disabled = !playing;
    submitButton.disabled = !playing;
    showResultButton.hidden = !playing;
    input.placeholder = playing ? `Guess ${state.guesses.length + 1} of ${MAX_GUESSES}` : 'Round finished';
  }

  function appendRow(resort: Resort): void {
    header.hidden = false;
    table.append(guessRow(resort, compareResorts(resort, target!)));
  }

  function submit(): void {
    if (state.status !== 'playing') return;
    const resolution = resolveInput(input.value, resorts);
    switch (resolution.kind) {
      case 'empty':
        setMessage('Type the name of a ski resort.');
        return;
      case 'unknown':
        setMessage('Unknown resort');
        return;
      case 'alias':
        // Erst nach erneutem Absenden wird der richtige Name als Tipp gewertet.
        input.value = resolution.resort.name;
        setMessage('Do you mean: ', h('strong', {}, resolution.resort.name));
        return;
      case 'exact': {
        const { state: next, outcome } = submitGuess(state, resolution.resort.id);
        if (outcome === 'duplicate') {
          setMessage('Already guessed');
          return;
        }
        if (outcome !== 'accepted') return;
        state = next;
        input.value = '';
        setMessage('');
        appendRow(resolution.resort);
        if (state.status === 'playing') {
          saveDailyGame(state);
          updateControls();
          map.setMarked(markedResorts());
          map.fitTo(guessedResorts());
        } else {
          autocomplete.close();
          finish(state);
        }
      }
    }
  }

  /** Runde beenden: speichern, Serie aktualisieren, Lösung zeigen, Popup öffnen. */
  function finish(finished: GameState): void {
    state = finished;
    if (state.mode === 'daily') {
      saveDailyGame(state);
      const streak = loadStreak();
      saveStreak(state.status === 'won' ? recordWin(streak, state.date) : recordLoss(streak));
    }
    showFinished();
  }

  function showFinished(): void {
    autocomplete.close();
    input.blur();
    input.value = '';
    updateControls();
    map.setMarked(markedResorts());
    map.fitTo([...guessedResorts(), target!]);
    closeDialog = openResultDialog({
      state,
      target: target!,
      guesses: guessedResorts().map((resort) => ({ resort, comparison: compareResorts(resort, target!) })),
      challenger: challengerGuesses(),
      resorts,
      marked: markedResorts(),
      onClose: onExit,
    });
  }

  /** Tippfolge des Herausforderers; nur wenn er dasselbe Gebiet gespielt hat. */
  function challengerGuesses(): PlayerGuesses | null {
    if (!challenge || challenge.targetId !== target!.id) return null;
    const guesses = challenge.guesses
      .map((id) => byId.get(id))
      .filter((r): r is Resort => r !== undefined)
      .map((resort) => ({ resort, comparison: compareResorts(resort, target!) }));
    return { won: challenge.won, guesses };
  }

  let closeDialog: (() => void) | null = null;

  // Gespeicherte Runde wiederherstellen.
  for (const resort of guessedResorts()) appendRow(resort);
  updateControls();
  map.setMarked(markedResorts());
  if (state.guesses.length > 0) map.fitTo(guessedResorts());
  if (state.status !== 'playing') showFinished();

  return () => {
    closeDialog?.();
    map.destroy();
  };
}
