const FAVORITES_KEY = 'officekit.forms.favorites';
const RECENT_KEY = 'officekit.forms.recent';
const MAX_RECENT = 8;

function readSlugs(key: string): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function writeSlugs(key: string, slugs: readonly string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(slugs));
  } catch {
    // 저장 공간이 막힌 브라우저에서는 조용히 동작만 유지한다.
  }
}

export function getFavorites(): string[] {
  return readSlugs(FAVORITES_KEY);
}

export function getRecent(): string[] {
  return readSlugs(RECENT_KEY);
}

export function isFavorite(slug: string): boolean {
  return getFavorites().includes(slug);
}

export function toggleFavorite(slug: string): boolean {
  const favorites = getFavorites();
  const next = favorites.includes(slug)
    ? favorites.filter((item) => item !== slug)
    : [slug, ...favorites];
  writeSlugs(FAVORITES_KEY, next);
  return next.includes(slug);
}

export function clearRecent(): void {
  writeSlugs(RECENT_KEY, []);
}

/** 양식 페이지를 열 때 최근 목록 맨 앞으로 올린다. */
export function rememberRecent(slug: string): void {
  const next = [slug, ...getRecent().filter((item) => item !== slug)].slice(0, MAX_RECENT);
  writeSlugs(RECENT_KEY, next);
}

/** 양식 페이지의 즐겨찾기 버튼과 최근 목록을 연결한다. */
export function initFormFavorite(slug: string): void {
  rememberRecent(slug);
  const button = document.querySelector<HTMLButtonElement>('[data-form-favorite]');
  if (!button) return;
  const icon = button.querySelector<HTMLElement>('[data-favorite-icon]');
  const label = button.querySelector<HTMLElement>('[data-favorite-label]');

  const sync = () => {
    const active = isFavorite(slug);
    button.setAttribute('aria-pressed', String(active));
    button.setAttribute(
      'aria-label',
      active ? '이 양식을 즐겨찾기에서 제거' : '이 양식을 즐겨찾기에 추가',
    );
    if (icon) icon.textContent = active ? '★' : '☆';
    if (label) label.textContent = active ? '즐겨찾기됨' : '즐겨찾기';
  };

  button.addEventListener('click', () => {
    toggleFavorite(slug);
    sync();
  });
  sync();
}

/** 양식관의 "내 양식"에 즐겨찾기·최근 본 양식을 채운다. */
export function initMyForms(): void {
  const section = document.querySelector<HTMLElement>('[data-my-forms]');
  if (!section) return;

  const cards = new Map<string, HTMLAnchorElement>();
  for (const card of document.querySelectorAll<HTMLAnchorElement>('[data-form-card]')) {
    const slug = card.getAttribute('href')?.match(/^\/forms\/([^/]+)\/$/)?.[1];
    if (slug) cards.set(slug, card);
  }

  const favorites = getFavorites().filter((slug) => cards.has(slug));
  const favoritesSet = new Set(favorites);
  const recent = getRecent().filter((slug) => cards.has(slug) && !favoritesSet.has(slug));

  const render = (selector: string, slugs: readonly string[]) => {
    const group = section.querySelector<HTMLElement>(selector);
    if (!group) return;
    const list = group.querySelector<HTMLUListElement>('ul');
    if (!list) return;
    list.replaceChildren();
    for (const slug of slugs) {
      const source = cards.get(slug);
      if (!source) continue;
      const card = source.cloneNode(true) as HTMLAnchorElement;
      card.hidden = false;
      card.removeAttribute('data-form-result');
      card.dataset.myForm = slug;
      const item = document.createElement('li');
      item.append(card);
      list.append(item);
    }
    group.hidden = slugs.length === 0;
  };

  render('[data-my-favorites]', favorites);
  render('[data-my-recent]', recent);

  const clearButton = section.querySelector<HTMLButtonElement>('[data-clear-recent]');
  if (clearButton) {
    clearButton.hidden = recent.length === 0;
    clearButton.addEventListener('click', () => {
      clearRecent();
      render('[data-my-recent]', []);
      clearButton.hidden = true;
      section.hidden = favorites.length === 0;
    });
  }

  section.hidden = favorites.length === 0 && recent.length === 0;
}
