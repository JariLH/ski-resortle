import type { Resort } from '../data/resort.ts';
import { suggest } from '../logic/search.ts';
import { h } from './dom.ts';

export interface Autocomplete {
  close(): void;
}

/**
 * Vorschlagsliste unter dem Eingabefeld. Klick oder Enter auf einen Vorschlag
 * übernimmt den Namen ins Feld, Tab den obersten Vorschlag; abgesendet wird erst
 * mit dem nächsten Enter/Button.
 */
export function attachAutocomplete(
  input: HTMLInputElement,
  list: HTMLUListElement,
  resorts: readonly Resort[],
  onSubmit: () => void,
): Autocomplete {
  let items: Resort[] = [];
  let active = -1;

  function open(): void {
    items = suggest(input.value, resorts);
    active = -1;
    list.replaceChildren(
      ...items.map((resort, index) =>
        h('li', { role: 'option', id: `suggestion-${index}`, 'aria-selected': 'false' }, resort.name),
      ),
    );
    const visible = items.length > 0 && !input.disabled;
    list.hidden = !visible;
    input.setAttribute('aria-expanded', String(visible));
    list.scrollTop = 0;
  }

  function close(): void {
    list.hidden = true;
    active = -1;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function setActive(index: number): void {
    const options = list.children;
    options[active]?.setAttribute('aria-selected', 'false');
    active = index;
    const option = options[active];
    if (!option) {
      input.removeAttribute('aria-activedescendant');
      return;
    }
    option.setAttribute('aria-selected', 'true');
    input.setAttribute('aria-activedescendant', option.id);
    option.scrollIntoView({ block: 'nearest' });
  }

  function choose(index: number): void {
    const resort = items[index];
    if (!resort) return;
    input.value = resort.name;
    close();
  }

  input.addEventListener('focus', open);
  input.addEventListener('click', () => {
    if (list.hidden) open();
  });
  input.addEventListener('input', open);
  input.addEventListener('blur', close);
  input.addEventListener('keydown', (event) => {
    const isOpen = !list.hidden;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!isOpen) open();
      else setActive(Math.min(active + 1, items.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (isOpen) setActive(Math.max(active - 1, 0));
    } else if (event.key === 'Tab' && !event.shiftKey && isOpen && items.length > 0) {
      // Tab übernimmt den obersten Vorschlag, statt den Fokus weiterzugeben.
      event.preventDefault();
      choose(0);
    } else if (event.key === 'Escape') {
      close();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (isOpen && active >= 0) choose(active);
      else {
        close();
        onSubmit();
      }
    }
  });
  // mousedown statt click, damit das Feld den Fokus behält.
  list.addEventListener('mousedown', (event) => {
    event.preventDefault();
    const li = (event.target as HTMLElement).closest('li');
    if (li) choose([...list.children].indexOf(li));
  });

  return { close };
}
