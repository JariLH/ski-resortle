import './style.css';
import { RESORTS } from './data/resorts.ts';
import { dailyResort, randomResort } from './logic/daily.ts';
import { berlinDateKey } from './logic/dates.ts';
import { newGame } from './logic/game.ts';
import { displayedStreak } from './logic/streak.ts';
import { h } from './ui/dom.ts';
import { renderGameView } from './ui/gameView.ts';
import { renderPlaceholderPage, renderStartView } from './ui/startView.ts';
import { loadDailyGame, loadStreak } from './ui/storage.ts';

const app = document.querySelector<HTMLElement>('#app')!;
const view = h('div', { class: 'view' });
app.replaceChildren(view, footer());

let cleanup: (() => void) | null = null;

function footer(): HTMLElement {
  const link = (href: string, text: string) => h('a', { href, target: '_blank', rel: 'noopener' }, text);
  return h(
    'footer',
    { class: 'footer' },
    h(
      'p',
      {},
      'Map data © ',
      link('https://www.openstreetmap.org/copyright', 'OpenStreetMap contributors'),
      ' · Resort data: ',
      link('https://openskidata.org', 'OpenSkiData'),
      ' (',
      link('https://opendatacommons.org/licenses/odbl/', 'ODbL'),
      ')',
    ),
    h('p', {}, h('a', { href: '#/legal' }, 'Legal notice'), ' · ', h('a', { href: '#/privacy' }, 'Privacy')),
  );
}

function goHome(): void {
  location.hash = '#/';
}

function route(): void {
  cleanup?.();
  cleanup = null;
  const today = berlinDateKey(new Date());
  const path = location.hash.replace(/^#/, '') || '/';
  document.body.dataset.view = path.slice(1) || 'start';

  switch (path) {
    case '/play': {
      const state = loadDailyGame(today) ?? newGame('daily', today, dailyResort(RESORTS, today).id);
      cleanup = renderGameView(view, { state, resorts: RESORTS, onExit: goHome });
      break;
    }
    case '/practice': {
      const state = newGame('practice', today, randomResort(RESORTS).id);
      cleanup = renderGameView(view, { state, resorts: RESORTS, onExit: goHome });
      break;
    }
    case '/legal':
      renderPlaceholderPage(view, 'Legal notice');
      break;
    case '/privacy':
      renderPlaceholderPage(view, 'Privacy');
      break;
    default:
      renderStartView(view, { streak: displayedStreak(loadStreak(), today) });
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
