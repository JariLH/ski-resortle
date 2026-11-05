import { h } from './dom.ts';
import { streakPanorama } from './streakPanorama.ts';

export interface StartViewOptions {
  streak: number;
}

export function renderStartView(root: HTMLElement, { streak }: StartViewOptions): void {
  root.replaceChildren(
    h(
      'div',
      { class: 'start' },
      h('h1', { class: 'logo' }, 'Ski-Resortle'),
      h('a', { class: 'button primary large', href: '#/play' }, "Play today's Ski-Resortle"),
      h('a', { class: 'button secondary', href: '#/practice' }, 'Practice'),
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
