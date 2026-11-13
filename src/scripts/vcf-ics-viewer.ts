import { formatBytes, MAX_TOTAL_BYTES } from '@/lib/files';
import {
  type CalendarEvent,
  type Contact,
  contactsToCsv,
  decodeText,
  eventsToCsv,
  parseVcfIcs,
} from '@/lib/vcf-ics';

interface Loaded {
  file: File;
  contacts: Contact[];
  events: CalendarEvent[];
  kind: string;
}

let loaded: Loaded | null = null;
let csvUrl: string | null = null;
let csvTimer = 0;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initVcfIcsViewer(): void {
  const input = byId<HTMLInputElement>('vi-input');
  const drop = byId<HTMLElement>('vi-drop');
  const panel = byId<HTMLElement>('vi-panel');
  const info = byId<HTMLElement>('vi-info');
  const stats = {
    contacts: byId<HTMLElement>('vi-stat-contacts'),
    events: byId<HTMLElement>('vi-stat-events'),
    kind: byId<HTMLElement>('vi-stat-kind'),
  };
  const search = byId<HTMLInputElement>('vi-search');
  const contactsSection = byId<HTMLElement>('vi-contacts-section');
  const contactsList = byId<HTMLElement>('vi-contacts-list');
  const eventsSection = byId<HTMLElement>('vi-events-section');
  const eventsList = byId<HTMLElement>('vi-events-list');
  const noResults = byId<HTMLElement>('vi-no-results');
  const contactsDownload = byId<HTMLButtonElement>('vi-contacts-csv');
  const eventsDownload = byId<HTMLButtonElement>('vi-events-csv');
  const resetButton = byId<HTMLButtonElement>('vi-reset');
  const status = byId<HTMLElement>('vi-status');
  const error = byId<HTMLElement>('vi-error');

  if (!input || !drop || !panel || !status || !error) return;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const clearCsv = () => {
    if (csvTimer) {
      window.clearTimeout(csvTimer);
      csvTimer = 0;
    }
    if (csvUrl) URL.revokeObjectURL(csvUrl);
    csvUrl = null;
  };

  const clear = () => {
    clearCsv();
    loaded = null;
    panel.hidden = true;
    if (search) search.value = '';
    for (const key of ['contacts', 'events'] as const) {
      const value = stats[key];
      if (value) value.textContent = '0';
    }
    if (stats.kind) stats.kind.textContent = '-';
  };

  const contactCard = (contact: Contact): HTMLElement => {
    const article = document.createElement('article');
    article.className = 'vi-contact';
    const name = document.createElement('h3');
    name.textContent = contact.name;
    article.append(name);

    if (contact.org || contact.title) {
      const meta = document.createElement('p');
      meta.className = 'vi-contact-meta';
      meta.textContent = [contact.org, contact.title].filter(Boolean).join(' · ');
      article.append(meta);
    }

    for (const phone of contact.phones) {
      const link = document.createElement('a');
      link.className = 'vi-line';
      link.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
      link.textContent = `☎ ${phone}`;
      article.append(link);
    }
    for (const email of contact.emails) {
      const link = document.createElement('a');
      link.className = 'vi-line';
      link.href = `mailto:${email}`;
      link.textContent = `✉ ${email}`;
      article.append(link);
    }
    if (contact.address) {
      const line = document.createElement('p');
      line.className = 'vi-line';
      line.textContent = `⌂ ${contact.address}`;
      article.append(line);
    }
    if (contact.note) {
      const note = document.createElement('p');
      note.className = 'vi-note';
      note.textContent = contact.note;
      article.append(note);
    }
    article.dataset.search = [
      contact.name,
      contact.org,
      contact.title,
      contact.address,
      contact.note,
      ...contact.phones,
      ...contact.emails,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return article;
  };

  const eventCard = (event: CalendarEvent): HTMLElement => {
    const item = document.createElement('li');
    item.className = 'vi-event';

    const date = document.createElement('p');
    date.className = 'vi-event-date';
    const start = event.start?.text ?? '날짜 없음';
    date.textContent = event.end ? `${start} – ${event.end.text}` : start;
    if (event.rrule) {
      const repeat = document.createElement('span');
      repeat.className = 'vi-badge';
      repeat.textContent = '반복';
      date.append(repeat);
    }
    item.append(date);

    const title = document.createElement('h3');
    title.textContent = event.summary;
    item.append(title);

    if (event.location) {
      const location = document.createElement('p');
      location.className = 'vi-line';
      location.textContent = `⌖ ${event.location}`;
      item.append(location);
    }
    if (event.description) {
      const description = document.createElement('p');
      description.className = 'vi-note';
      description.textContent = event.description;
      item.append(description);
    }
    item.dataset.search = [
      event.summary,
      event.location,
      event.description,
      event.start?.text,
      event.end?.text,
      event.rrule,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return item;
  };

  const applyFilter = () => {
    const query = (search?.value ?? '').trim().toLowerCase();
    let visible = 0;
    for (const item of panel.querySelectorAll<HTMLElement>('[data-search]')) {
      const match = !query || (item.dataset.search ?? '').includes(query);
      item.hidden = !match;
      if (match) visible += 1;
    }
    if (noResults) noResults.hidden = query === '' || visible > 0;
    for (const section of [contactsSection, eventsSection]) {
      if (!section) continue;
      const items = section.querySelectorAll<HTMLElement>('[data-search]');
      if (items.length === 0) {
        section.hidden = true;
        continue;
      }
      section.hidden = [...items].every((item) => item.hidden);
    }
  };

  const render = () => {
    if (!loaded) return;
    if (contactsList) {
      contactsList.replaceChildren(...loaded.contacts.map(contactCard));
    }
    if (eventsList) {
      eventsList.replaceChildren(...loaded.events.map(eventCard));
    }
    if (stats.contacts) stats.contacts.textContent = String(loaded.contacts.length);
    if (stats.events) stats.events.textContent = String(loaded.events.length);
    if (stats.kind) {
      stats.kind.textContent =
        loaded.kind === 'both' ? 'VCF+ICS' : loaded.kind === 'vcf' ? 'VCF' : 'ICS';
    }
    if (contactsDownload) contactsDownload.hidden = loaded.contacts.length === 0;
    if (eventsDownload) eventsDownload.hidden = loaded.events.length === 0;
    if (contactsSection) contactsSection.hidden = loaded.contacts.length === 0;
    if (eventsSection) eventsSection.hidden = loaded.events.length === 0;
    if (search) search.disabled = loaded.contacts.length + loaded.events.length === 0;
    applyFilter();
  };

  const download = (kind: 'contacts' | 'events') => {
    if (!loaded) return;
    clearCsv();
    const csv = kind === 'contacts' ? contactsToCsv(loaded.contacts) : eventsToCsv(loaded.events);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    csvUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = csvUrl;
    link.download = kind === 'contacts' ? 'contacts.csv' : 'calendar.csv';
    document.body.append(link);
    link.click();
    link.remove();
    csvTimer = window.setTimeout(clearCsv, 5000);
  };

  const acceptFile = async (file: File) => {
    showError('');
    clear();
    if (!/\.(vcf|vcs|ics|ical)$/i.test(file.name)) {
      showError('VCF(.vcf) 또는 ICS(.ics) 파일만 열 수 있습니다.');
      return;
    }
    if (file.size > MAX_TOTAL_BYTES) {
      showError(`파일이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다. 더 작은 파일을 사용하세요.`);
      return;
    }
    status.textContent = '연락처와 일정을 읽는 중…';
    try {
      const parsed = parseVcfIcs(decodeText(new Uint8Array(await file.arrayBuffer())));
      if (
        parsed.warnings.length > 0 &&
        parsed.contacts.length === 0 &&
        parsed.events.length === 0
      ) {
        throw new Error(parsed.warnings[0]);
      }
      loaded = {
        file,
        contacts: parsed.contacts,
        events: parsed.events,
        kind: parsed.kind,
      };
      if (info) info.textContent = `${file.name} · ${formatBytes(file.size)}`;
      panel.hidden = false;
      render();
      status.textContent = `${parsed.contacts.length}개 연락처 · ${parsed.events.length}개 일정을 읽었습니다.`;
    } catch (cause) {
      console.error(cause);
      clear();
      status.textContent = '';
      showError(
        cause instanceof Error
          ? cause.message
          : '파일을 읽지 못했습니다. VCF·ICS 형식인지 확인하세요.',
      );
    }
  };

  drop.addEventListener('dragover', (event) => {
    event.preventDefault();
    drop.dataset.drag = 'true';
  });
  drop.addEventListener('dragleave', () => {
    drop.dataset.drag = 'false';
  });
  drop.addEventListener('drop', (event) => {
    event.preventDefault();
    drop.dataset.drag = 'false';
    const file = event.dataTransfer?.files?.[0];
    if (file) void acceptFile(file);
  });
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void acceptFile(file);
    input.value = '';
  });
  search?.addEventListener('input', applyFilter);
  contactsDownload?.addEventListener('click', () => download('contacts'));
  eventsDownload?.addEventListener('click', () => download('events'));
  resetButton?.addEventListener('click', () => {
    clear();
    status.textContent = '';
    showError('');
    input.value = '';
    input.focus();
  });
  window.addEventListener('pagehide', clear);
}
