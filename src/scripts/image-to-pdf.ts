import { doWork } from '@/lib/do-work';
import { fitWithin, formatBytes, moveBy, safeFileName, validateImageSelection } from '@/lib/files';
import { isHeic } from '@/lib/heic';
import { fitRect, type PageMode, pageSizeFor } from '@/lib/image-pdf';
import { heicAsReadable } from './heic-file';

interface Item {
  id: string;
  file: File;
  width: number;
  height: number;
  previewUrl: string;
}

const items: Item[] = [];
let resultUrl: string | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initImageToPdf(): void {
  const input = byId<HTMLInputElement>('img-input');
  const drop = byId<HTMLElement>('img-drop');
  const list = byId<HTMLOListElement>('img-list');
  const empty = byId<HTMLElement>('img-empty');
  const panel = byId<HTMLElement>('img-panel');
  const pageMode = byId<HTMLSelectElement>('img-page-mode');
  const quality = byId<HTMLSelectElement>('img-quality');
  const makeButton = byId<HTMLButtonElement>('img-make');
  const resetButton = byId<HTMLButtonElement>('img-reset');
  const sortButton = byId<HTMLButtonElement>('img-sort');
  const status = byId<HTMLElement>('img-status');
  const error = byId<HTMLElement>('img-error');
  const result = byId<HTMLElement>('img-result');
  const resultSummary = byId<HTMLElement>('img-result-summary');
  const download = byId<HTMLAnchorElement>('img-download');
  const summary = byId<HTMLElement>('img-summary');

  if (!input || !drop || !list || !empty || !makeButton || !status || !error || !result) return;

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
    download?.removeAttribute('href');
    if (download) download.hidden = true;
  };

  const render = () => {
    list.replaceChildren();
    empty.hidden = items.length > 0;
    if (panel) panel.hidden = items.length === 0;
    if (makeButton) makeButton.disabled = items.length === 0;

    items.forEach((item, index) => {
      const li = document.createElement('li');

      const thumb = document.createElement('img');
      thumb.src = item.previewUrl;
      thumb.alt = '';
      thumb.width = 48;
      thumb.height = 48;
      thumb.loading = 'lazy';

      const info = document.createElement('span');
      info.className = 'file-info';
      const name = document.createElement('strong');
      name.textContent = item.file.name;
      const meta = document.createElement('span');
      meta.className = 'file-meta';
      meta.textContent = `${item.width}×${item.height} · ${formatBytes(item.file.size)}`;
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
      li.append(thumb, info, actions);
      list.append(li);
    });

    if (summary) {
      summary.textContent =
        items.length === 0 ? '' : `${items.length}장 · ${formatBytes(totalBytes())}`;
    }
  };

  const totalBytes = () => items.reduce((sum, item) => sum + item.file.size, 0);

  const addFiles = async (fileList: FileList | File[]) => {
    let incoming = Array.from(fileList);
    if (incoming.length === 0) return;
    showError([]);
    clearResult();

    // 아이폰 HEIC 사진은 먼저 JPEG로 읽어 둔다(그 뒤로는 JPG와 같다).
    if (incoming.some((file) => isHeic(file))) {
      status.textContent = 'HEIC 사진을 읽는 중… (처음 한 번은 몇 초 걸립니다)';
      const used = new Set<string>();
      const readable: File[] = [];
      const heicFailures: string[] = [];
      for (const file of incoming) {
        try {
          readable.push(await heicAsReadable(file, used));
        } catch {
          heicFailures.push(`${file.name}: HEIC 사진을 읽지 못했습니다.`);
        }
      }
      status.textContent = '';
      if (heicFailures.length > 0) showError(heicFailures);
      incoming = readable;
      if (incoming.length === 0) return;
    }

    const validation = validateImageSelection([...items.map((item) => item.file), ...incoming]);
    if (!validation.ok) {
      showError(validation.errors);
      return;
    }

    status.textContent = '이미지를 확인하는 중…';
    const failures: string[] = [];

    for (const file of incoming) {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        items.push({
          id: crypto.randomUUID(),
          file,
          width: bitmap.width,
          height: bitmap.height,
          previewUrl: URL.createObjectURL(file),
        });
        bitmap.close();
      } catch {
        failures.push(`${file.name}: 이미지를 읽을 수 없습니다.`);
      }
    }

    status.textContent = '';
    showError(failures);
    render();
  };

  const makePdf = async () => {
    if (items.length === 0) return;
    clearResult();
    showError([]);
    makeButton.disabled = true;
    makeButton.setAttribute('aria-busy', 'true');

    try {
      const { PDFDocument } = await import('pdf-lib');
      const pdf = await PDFDocument.create();
      const mode = (pageMode?.value as PageMode) ?? 'a4';
      const highQuality = (quality?.value ?? 'high') === 'high';
      const jpegQuality = highQuality ? 0.92 : 0.72;

      for (let index = 0; index < items.length; index += 1) {
        const item = items[index] as Item;
        status.textContent = `${index + 1}/${items.length} 변환 중…`;

        const bitmap = await createImageBitmap(item.file, { imageOrientation: 'from-image' });
        const target = fitWithin({ width: bitmap.width, height: bitmap.height }, 3000);
        const keepAlpha = item.file.type === 'image/png' && highQuality;

        const canvas = document.createElement('canvas');
        canvas.width = target.width;
        canvas.height = target.height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('캔버스를 사용할 수 없습니다.');

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        if (!keepAlpha) {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.drawImage(bitmap, 0, 0, target.width, target.height);
        bitmap.close();

        const mime = keepAlpha ? 'image/png' : 'image/jpeg';
        const blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (value) => {
              if (value) resolve(value);
              else reject(new Error('이미지를 변환하지 못했습니다.'));
            },
            mime,
            jpegQuality,
          );
        });

        const bytes = new Uint8Array(await blob.arrayBuffer());
        const embedded =
          mime === 'image/png' ? await pdf.embedPng(bytes) : await pdf.embedJpg(bytes);

        const page = pageSizeFor(mode, target);
        const margin = mode === 'image' ? 0 : 24;
        const rect = fitRect(target, page, margin);
        const pdfPage = pdf.addPage([page.width, page.height]);
        pdfPage.drawImage(embedded, {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
        });
      }

      const output = await pdf.save();
      const blob = new Blob([new Uint8Array(output)], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);

      if (download) {
        const today = new Date().toISOString().slice(0, 10).replaceAll('-', '');
        download.href = resultUrl;
        download.download = `${safeFileName('images')}-${today}.pdf`;
        download.textContent = `PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultSummary) {
        resultSummary.textContent = `${items.length}장 · ${formatBytes(blob.size)}`;
      }

      result.hidden = false;
      status.textContent = '완료했습니다. 아래에서 내려받으세요.';
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError(['PDF를 만드는 중 문제가 발생했습니다. 이미지 수를 줄이거나 다시 시도하세요.']);
      status.textContent = '';
    } finally {
      makeButton.disabled = false;
      makeButton.removeAttribute('aria-busy');
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
      const [removed] = items.splice(index, 1);
      if (removed) URL.revokeObjectURL(removed.previewUrl);
    } else if (action === 'up' || action === 'down') {
      const next = moveBy(items, index, action === 'up' ? -1 : 1);
      items.splice(0, items.length, ...next);
    }

    clearResult();
    showError([]);
    render();
  });

  sortButton?.addEventListener('click', () => {
    items.sort((a, b) => a.file.name.localeCompare(b.file.name, 'ko'));
    clearResult();
    render();
  });

  makeButton.addEventListener('click', () => void doWork(makeButton, makePdf));

  resetButton?.addEventListener('click', () => {
    for (const item of items) URL.revokeObjectURL(item.previewUrl);
    items.length = 0;
    clearResult();
    showError([]);
    status.textContent = '';
    render();
  });

  render();

  window.addEventListener('pagehide', () => {
    for (const item of items) URL.revokeObjectURL(item.previewUrl);
    items.length = 0;
    clearResult();
  });
}
