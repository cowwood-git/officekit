/**
 * 모든 도구 화면에 공통으로 붙는 파일 흐름(ToolLayout 이 불러온다).
 *
 * 1. 붙여넣기 — Ctrl/⌘+V 로 붙여넣은 파일을 도구의 파일 input 에 넣는다.
 * 2. 잘못 넣은 파일 안내 — 이 도구가 받지 않는 형식이면 열 수 있는 도구로 안내한다.
 * 3. 이어서 하기 — 결과 파일을 다음 도구 페이지로 넘긴다(IndexedDB, 같은 브라우저 안에서만).
 *
 * 도구별 스크립트는 고치지 않는다. 파일은 input.files 에 넣고 'change' 를 보내므로
 * 사용자가 직접 고른 것과 똑같이 처리된다. 파일은 서버로 가지 않는다.
 */
import {
  formatLabel,
  isHandoffFresh,
  matchesAccept,
  nextToolsFor,
  pastedName,
  suggestToolFor,
} from '../lib/file-flow';

interface FlowTool {
  title: string;
  href: string;
}

const article = document.querySelector<HTMLElement>('article.tool[data-tool-slug]');
const body = document.querySelector<HTMLElement>('[data-tool-body]');
const slug = article?.dataset.toolSlug ?? '';
const flowData = document.getElementById('file-flow-data');
const TOOLS: Record<string, FlowTool> = flowData ? JSON.parse(flowData.textContent || '{}') : {};
// 자체 붙여넣기 처리가 있는 도구는 공통 처리를 건너뛴다(두 번 처리 방지).
const OWN_PASTE = new Set(['image-base64']);

/* ---------- 파일 input 찾기·채우기 ---------- */

function fileInputs(): HTMLInputElement[] {
  if (!body) return [];
  return Array.from(body.querySelectorAll<HTMLInputElement>('input[type="file"]')).filter(
    (input) => !input.disabled,
  );
}

function dropzoneOf(input: HTMLInputElement): HTMLElement | null {
  return (
    input.closest<HTMLElement>('.dropzone') ??
    (input.id ? body?.querySelector<HTMLElement>(`label.dropzone[for="${input.id}"]`) : null) ??
    null
  );
}

const isShown = (element: HTMLElement | null) =>
  Boolean(element && element.getClientRects().length > 0 && !element.closest('[hidden]'));

/** 이 파일들을 받을 input — 보이는 드롭존의 input 을 먼저 고른다. */
function targetInput(files: File[]): HTMLInputElement | null {
  const fits = fileInputs().filter((input) =>
    files.some((file) => matchesAccept(file, input.accept)),
  );
  return fits.find((input) => isShown(dropzoneOf(input))) ?? fits[0] ?? null;
}

function fillInput(input: HTMLInputElement, files: File[]): boolean {
  const accepted = files.filter((file) => matchesAccept(file, input.accept));
  const chosen = input.multiple ? accepted : accepted.slice(0, 1);
  if (chosen.length === 0) return false;
  try {
    const transfer = new DataTransfer();
    for (const file of chosen) transfer.items.add(file);
    input.files = transfer.files;
  } catch {
    return false; // DataTransfer 생성자가 없는 아주 오래된 브라우저
  }
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}

/* ---------- 안내 문구 ---------- */

function noticeFor(input: HTMLInputElement | null): HTMLElement | null {
  const anchor = (input && dropzoneOf(input)) ?? body?.querySelector<HTMLElement>('.dropzone');
  if (!anchor) return null;
  let notice = anchor.nextElementSibling as HTMLElement | null;
  if (!notice?.matches('[data-flow-notice]')) {
    notice = document.createElement('div');
    notice.className = 'flow-notice';
    notice.dataset.flowNotice = '';
    notice.setAttribute('role', 'status');
    notice.setAttribute('aria-live', 'polite');
    notice.hidden = true;
    anchor.after(notice);
  }
  return notice;
}

function clearNotice(input: HTMLInputElement | null): void {
  const notice = noticeFor(input);
  if (notice) {
    notice.hidden = true;
    notice.replaceChildren();
  }
}

function showWrongFile(input: HTMLInputElement, file: File): void {
  const notice = noticeFor(input);
  if (!notice) return;
  const text = document.createElement('p');
  text.textContent = `이 도구에서 열 수 없는 형식이에요: ${file.name} (${formatLabel(file.name)})`;
  notice.replaceChildren(text);
  const target = suggestToolFor(file, input.accept, slug);
  const tool = target ? TOOLS[target] : undefined;
  if (target && tool) {
    const link = document.createElement('a');
    link.className = 'btn btn-secondary flow-notice-link';
    link.href = tool.href;
    link.textContent = `${tool.title}에서 열기 →`;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      void handOff(target, [file], tool.href);
    });
    notice.append(link);
  }
  notice.hidden = false;
}

function showInfo(input: HTMLInputElement, message: string): void {
  const notice = noticeFor(input);
  if (!notice) return;
  const text = document.createElement('p');
  text.textContent = message;
  notice.replaceChildren(text);
  notice.hidden = false;
}

/** 놓거나 고른 파일이 이 input 과 맞지 않으면 안내한다. */
function checkFiles(input: HTMLInputElement, files: File[]): void {
  if (files.length === 0) return;
  const wrong = files.find((file) => !matchesAccept(file, input.accept));
  if (wrong) showWrongFile(input, wrong);
  else clearNotice(input);
}

/* ---------- IndexedDB 에 잠깐 맡기기 ---------- */

const DB_NAME = 'officekit-flow';
const STORE = 'handoff';
const KEY = 'pending';

interface Handoff {
  to: string;
  from: string;
  createdAt: number;
  files: { name: string; type: string; blob: Blob }[];
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = run(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function handOff(to: string, files: File[], href: string): Promise<void> {
  try {
    const record: Handoff = {
      to,
      from: slug,
      createdAt: Date.now(),
      files: files.map((file) => ({ name: file.name, type: file.type, blob: file })),
    };
    await withStore('readwrite', (store) => store.put(record, KEY));
  } catch {
    // 저장이 막힌 브라우저(사생활 보호 모드 등)는 그냥 이동한다. 파일은 다시 고르면 된다.
  }
  window.location.href = href;
}

/** 이 도구로 넘어온 파일을 꺼내고, 맡겨 둔 것은 바로 지운다. */
async function takeHandoff(): Promise<File[]> {
  try {
    const record = await withStore<Handoff | undefined>('readonly', (store) => store.get(KEY));
    if (!record) return [];
    await withStore('readwrite', (store) => store.delete(KEY));
    if (record.to !== slug || !isHandoffFresh(record.createdAt, Date.now())) return [];
    return record.files.map((item) => new File([item.blob], item.name, { type: item.type }));
  } catch {
    return [];
  }
}

/* ---------- 1. 붙여넣기 ---------- */

function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  if (target instanceof HTMLTextAreaElement) return true;
  if (target instanceof HTMLInputElement) return target.type !== 'file' && target.type !== 'button';
  return false;
}

function setupPaste(): void {
  if (OWN_PASTE.has(slug) || fileInputs().length === 0) return;
  document.addEventListener('paste', (event) => {
    if (isEditable(event.target)) return; // 글 입력칸에는 글이 붙어야 한다
    const raw = Array.from(event.clipboardData?.files ?? []);
    if (raw.length === 0) return;
    const now = new Date();
    const files = raw.map((file) => {
      const name = pastedName(file.name, file.type, now);
      return name === file.name ? file : new File([file], name, { type: file.type });
    });
    const input = targetInput(files);
    if (!input) {
      const first = fileInputs()[0];
      if (first && files[0]) showWrongFile(first, files[0]);
      return;
    }
    event.preventDefault();
    clearNotice(input);
    fillInput(input, files);
  });

  // 이미지를 받는 드롭존에만 "붙여넣기" 안내를 단다(캡처 → 붙여넣기가 가장 흔하다).
  const key = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘V' : 'Ctrl+V';
  for (const input of fileInputs()) {
    const zone = dropzoneOf(input);
    if (!zone || zone.querySelector('.dropzone-paste')) continue;
    if (!matchesAccept({ name: 'a.png', type: 'image/png' }, input.accept)) continue;
    const hint = document.createElement('small');
    hint.className = 'dropzone-paste';
    hint.textContent = `캡처한 이미지는 ${key}로 바로 붙여넣을 수 있어요`;
    zone.append(hint);
  }
}

/* ---------- 2. 잘못 넣은 파일 ---------- */

function setupWrongFile(): void {
  if (!body) return;
  // 도구 스크립트보다 먼저 보도록 캡처 단계에서 듣는다(처리는 막지 않는다).
  body.addEventListener(
    'drop',
    (event) => {
      const zone = (event.target as HTMLElement | null)?.closest<HTMLElement>('.dropzone');
      if (!zone) return;
      const input =
        zone.querySelector<HTMLInputElement>('input[type="file"]') ??
        (zone instanceof HTMLLabelElement && zone.htmlFor
          ? (document.getElementById(zone.htmlFor) as HTMLInputElement | null)
          : null);
      if (!input) return;
      checkFiles(input, Array.from(event.dataTransfer?.files ?? []));
    },
    true,
  );
  body.addEventListener(
    'change',
    (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || input.type !== 'file') return;
      checkFiles(input, Array.from(input.files ?? []));
    },
    true,
  );
}

/* ---------- 3. 이어서 하기 ---------- */

let shownKey = '';

function resultLink(): HTMLAnchorElement | null {
  if (!body) return null;
  const links = Array.from(
    body.querySelectorAll<HTMLAnchorElement>('a[download][href^="blob:"]'),
  ).filter((link) => link.download && isShown(link));
  return links[0] ?? null;
}

function renderNext(): void {
  const link = resultLink();
  const key = link ? `${link.href}|${link.download}` : '';
  if (key === shownKey) return;
  shownKey = key;
  for (const old of document.querySelectorAll('[data-flow-next]')) old.remove();
  if (!link) return;
  const slugs = nextToolsFor(slug, link.download).filter((next) => TOOLS[next]);
  if (slugs.length === 0) return;

  const box = document.createElement('nav');
  box.className = 'flow-next';
  box.dataset.flowNext = '';
  box.setAttribute('aria-label', '이 결과로 이어서 하기');
  const label = document.createElement('span');
  label.className = 'flow-next-label';
  label.textContent = '이 파일로 이어서';
  box.append(label);
  for (const next of slugs) {
    const tool = TOOLS[next] as FlowTool;
    const chip = document.createElement('a');
    chip.className = 'flow-next-chip';
    chip.href = tool.href;
    chip.textContent = `${tool.title} →`;
    chip.addEventListener('click', async (event) => {
      event.preventDefault();
      chip.setAttribute('aria-busy', 'true');
      try {
        const blob = await (await fetch(link.href)).blob();
        await handOff(next, [new File([blob], link.download, { type: blob.type })], tool.href);
      } catch {
        window.location.href = tool.href;
      }
    });
    box.append(chip);
  }
  (link.closest('.tool-actions') ?? link).after(box);
}

function setupNext(): void {
  if (!body) return;
  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      renderNext();
    });
  };
  new MutationObserver(schedule).observe(body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ['href', 'hidden', 'download', 'class'],
  });
}

/* ---------- 넘어온 파일 받기 ---------- */

async function receiveHandoff(): Promise<void> {
  const files = await takeHandoff();
  if (files.length === 0) return;
  const input = targetInput(files);
  if (!input) return;
  if (fillInput(input, files)) {
    const names = files.map((file) => file.name).join(', ');
    showInfo(input, `이전 도구의 결과를 이어서 불러왔어요: ${names}`);
  }
}

// 붙여넣기·안내·이어서 하기 표시는 바로 듣는다(빠른 입력도 놓치지 않게).
if (article && body) {
  setupPaste();
  setupWrongFile();
  setupNext();
}

// 넘어온 파일은 도구 스크립트가 준비된 뒤(로딩 가림막이 걷힌 뒤)에 넣는다.
if (article && body) {
  if (body.classList.contains('is-loading')) {
    let received = false;
    const once = () => {
      if (received) return;
      received = true;
      void receiveHandoff();
    };
    window.addEventListener('officekit:tool-ready', once, { once: true });
    window.setTimeout(once, 6500);
  } else {
    void receiveHandoff();
  }
}
