import { h } from './dom.ts';
import { streakPanorama } from './streakPanorama.ts';

export interface StartViewOptions {
  streak: number;
  /** Übungsmodus nur im Dev-Server anbieten. */
  showPractice: boolean;
}

export function renderStartView(root: HTMLElement, { streak, showPractice }: StartViewOptions): void {
  root.replaceChildren(
    h(
      'div',
      { class: 'start' },
      h('h1', { class: 'logo' }, 'Ski-Resortle'),
      h('a', { class: 'button primary large', href: '#/play' }, "Play today's Ski-Resortle"),
      showPractice ? h('a', { class: 'button secondary', href: '#/practice' }, 'Practice') : null,
      h('div', { class: 'streak' }, streakPanorama(streak), h('span', { class: 'streak-label' }, 'day streak')),
    ),
  );
}

/** Platzhalter für Impressum und Datenschutz, Inhalte folgen. */
export function renderPlaceholderPage(root: HTMLElement, title: string): void {
  root.replaceChildren(
    h(
      'div',
      { class: 'page' },
      h('h1', {}, title),
      h('p', {}, 'Coming soon.'),
      h('a', { class: 'button secondary', href: '#/' }, 'Back'),
    ),
  );
}
