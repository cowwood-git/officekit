import { doWork } from '@/lib/do-work';
import { formatBytes, moveBy, validatePdfSelection } from '@/lib/files';
import { createSteps } from '@/lib/steps';

interface Item {
  id: string;
  file: File;
  pages: number;
}

const items: Item[] = [];
let resultUrl: string | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPdfMerge(): void {
  const input = byId<HTMLInputElement>('pdf-input');
  const drop = byId<HTMLElement>('pdf-drop');
  const list = byId<HTMLOListElement>('pdf-list');
  const empty = byId<HTMLElement>('pdf-empty');
  const mergeButton = byId<HTMLButtonElement>('pdf-merge');
  const resetButton = byId<HTMLButtonElement>('pdf-reset');
  const status = byId<HTMLElement>('pdf-status');
  const error = byId<HTMLElement>('pdf-error');
  const result = byId<HTMLElement>('pdf-result');
  const download = byId<HTMLAnchorElement>('pdf-download');
  const summary = byId<HTMLElement>('pdf-summary');

  if (!input || !drop || !list || !empty || !mergeButton || !status || !error || !result) return;

  const stepsRoot = byId<HTMLElement>('pdf-steps');
  const steps = stepsRoot ? createSteps(stepsRoot) : null;

  const showError = (messages: string[]) => {
    error.hidden = messages.length === 0;
    error.textContent = messages.join(' ');
  };

  const clearResult = () => {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      resultUrl = null;
    }
    result.hidden = true;
    if (download) {
      download.removeAttribute('href');
      download.hidden = true;
    }
  };

  const totalPages = () => items.reduce((sum, item) => sum + item.pages, 0);
  const totalBytes = () => items.reduce((sum, item) => sum + item.file.size, 0);

  const render = () => {
    list.replaceChildren();
    empty.hidden = items.length > 0;

    items.forEach((item, index) => {
      const li = document.createElement('li');

      const info = document.createElement('span');
      info.className = 'file-info';
      const name = document.createElement('strong');
      name.textContent = item.file.name;
      const meta = document.createElement('span');
      meta.className = 'file-meta';
      meta.textContent = `${item.pages}쪽 · ${formatBytes(item.file.size)}`;
      info.append(name, meta);

      const actions = document.createElement('span');
      actions.className = 'file-actions';

      const up = document.createElement('button');
      up.type = 'button';
      up.className = 'icon-btn';
      up.textContent = '↑';
      up.setAttribute('aria-label', `${item.file.name} 위로 이동`);
      up.disabled = index === 0;
      up.dataset.action = 'up';
      up.dataset.id = item.id;

      const down = document.createElement('button');
      down.type = 'button';
      down.className = 'icon-btn';
      down.textContent = '↓';
      down.setAttribute('aria-label', `${item.file.name} 아래로 이동`);
      down.disabled = index === items.length - 1;
      down.dataset.action = 'down';
      down.dataset.id = item.id;

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'icon-btn danger';
      remove.textContent = '✕';
      remove.setAttribute('aria-label', `${item.file.name} 목록에서 제거`);
      remove.dataset.action = 'remove';
      remove.dataset.id = item.id;

      actions.append(up, down, remove);
      li.append(info, actions);
      list.append(li);
    });

    if (summary) {
      summary.textContent =
        items.length === 0
          ? ''
          : `${items.length}개 파일 · ${totalPages()}쪽 · ${formatBytes(totalBytes())}`;
    }

    mergeButton.disabled = items.length < 2;
    if (resetButton) resetButton.disabled = items.length === 0;

    // 단계: 파일이 있으면 02 순서, 없으면 01 선택. 결과가 살아 있으면 03 유지.
    if (steps) {
      steps.summary(1, items.length === 0 ? '' : `${items.length}개 · ${totalPages()}쪽`);
      if (items.length === 0) steps.go(1);
      else if (!resultUrl) steps.go(2);
    }
  };

  const addFiles = async (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;
    showError([]);

    const combined = [...items.map((item) => item.file), ...incoming];
    const validation = validatePdfSelection(combined);
    if (!validation.ok) {
      showError(validation.errors);
      return;
    }

    status.textContent = 'PDF를 확인하는 중…';
    const { PDFDocument } = await import('pdf-lib');

    const failures: string[] = [];
    for (const file of incoming) {
      try {
        const doc = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
        items.push({ id: crypto.randomUUID(), file, pages: doc.getPageCount() });
      } catch {
        failures.push(`${file.name}: PDF를 읽을 수 없습니다(암호가 걸렸거나 손상됨).`);
      }
    }

    status.textContent = '';
    showError(failures);
    clearResult();
    render();
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
    if (event.dataTransfer?.files) void addFiles(event.dataTransfer.files);
  });

  input.addEventListener('change', () => {
    if (input.files) void addFiles(input.files);
    input.value = '';
  });

  list.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const { action, id } = target.dataset;
    if (!action || !id) return;
    const index = items.findIndex((item) => item.id === id);
    if (index < 0) return;

    if (action === 'remove') {
      items.splice(index, 1);
    } else if (action === 'up' || action === 'down') {
      const delta = action === 'up' ? -1 : 1;
      const next = moveBy(items, index, delta);
      items.splice(0, items.length, ...next);
    }

    clearResult();
    showError([]);
    render();
  });

  mergeButton.addEventListener(
    'click',
    () =>
      void doWork(mergeButton, async () => {
        if (items.length < 2) return;
        clearResult();
        showError([]);
        mergeButton.disabled = true;
        mergeButton.setAttribute('aria-busy', 'true');
        status.textContent = 'PDF를 합치는 중…';

        try {
          const { PDFDocument } = await import('pdf-lib');
          const merged = await PDFDocument.create();

          for (const item of items) {
            const source = await PDFDocument.load(await item.file.arrayBuffer());
            const pages = await merged.copyPages(source, source.getPageIndices());
            for (const page of pages) merged.addPage(page);
          }

          const bytes = await merged.save();
          const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
          resultUrl = URL.createObjectURL(blob);

          if (download) {
            const today = new Date().toISOString().slice(0, 10).replaceAll('-', '');
            download.href = resultUrl;
            download.download = `merged-${today}.pdf`;
            download.textContent = `합친 PDF 내려받기 (${formatBytes(blob.size)})`;
            download.hidden = false;
          }

          result.hidden = false;
          status.textContent = '완료했습니다. 아래에서 내려받으세요.';
          steps?.summary(2, `${items.length}개 순서대로 합침`);
          steps?.go(3);
          result.focus({ preventScroll: false });
        } catch (cause) {
          console.error(cause);
          showError([
            '합치는 중 문제가 발생했습니다. 파일 수를 줄이거나 암호가 없는 PDF로 다시 시도하세요.',
          ]);
          status.textContent = '';
        } finally {
          mergeButton.disabled = false;
          mergeButton.removeAttribute('aria-busy');
        }
      }),
  );

  resetButton?.addEventListener('click', () => {
    items.length = 0;
    clearResult();
    showError([]);
    status.textContent = '';
    render();
  });

  window.addEventListener('pagehide', () => {
    items.length = 0;
    clearResult();
  });

  render();
}
