import './style.css';
import { RESORTS } from './data/resorts.ts';
import { CHALLENGE_PARAM, decodeChallenge } from './logic/challenge.ts';
import { dailyResort, randomResort } from './logic/daily.ts';
import { berlinDateKey } from './logic/dates.ts';
import { newGame } from './logic/game.ts';
import { displayedStreak } from './logic/streak.ts';
import { h } from './ui/dom.ts';
import { renderGameView } from './ui/gameView.ts';
import { renderPlaceholderPage, renderStartView } from './ui/startView.ts';
import { loadDailyChallenge, loadDailyGame, loadStreak, saveDailyChallenge } from './ui/storage.ts';

const EXPIRED_NOTICE = "This challenge has expired – here is today's Ski-Resortle";

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
  const [rawPath = '', query = ''] = location.hash.replace(/^#/, '').split('?');
  const path = rawPath || '/';
  document.body.dataset.view = path.slice(1) || 'start';
  // Challenge-Link: Daten übernehmen und aus der Adresse entfernen
  const code = new URLSearchParams(query).get(CHALLENGE_PARAM);
  const linkChallenge = code ? decodeChallenge(code) : null;
  if (code) history.replaceState(null, '', `#${path}`);

  switch (path) {
    case '/play': {
      let notice: string | undefined;
      if (linkChallenge?.mode === 'daily') {
        if (linkChallenge.date === today) saveDailyChallenge(linkChallenge);
        else notice = EXPIRED_NOTICE;
      }
      const state = loadDailyGame(today) ?? newGame('daily', today, dailyResort(RESORTS, today).id);
      const challenge = loadDailyChallenge(today);
      cleanup = renderGameView(view, { state, resorts: RESORTS, challenge, notice, onExit: goHome });
      break;
    }
    case '/practice': {
      // Übungs-Challenge: dasselbe Gebiet wie der Herausforderer spielen
      const challenge =
        linkChallenge?.mode === 'practice' && RESORTS.some((r) => r.id === linkChallenge.targetId) ? linkChallenge : null;
      const targetId = challenge?.targetId ?? randomResort(RESORTS).id;
      const state = newGame('practice', today, targetId);
      cleanup = renderGameView(view, { state, resorts: RESORTS, challenge, onExit: goHome });
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
