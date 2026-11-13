import { degrees } from 'pdf-lib';
import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import { normalizeRotation, organizeFileName, rotateBy } from '@/lib/pdf-organize';
import { applyQuickAction, type QuickMode } from '@/lib/pdf-quick';

interface PageItem {
  id: string;
  originalIndex: number;
  rotation: number;
  thumb: string;
}

interface Loaded {
  file: File;
  bytes: ArrayBuffer;
  task: PDFDocumentLoadingTask;
  doc: PDFDocumentProxy;
  items: PageItem[];
}

const MAX_PAGES = 100;
let current: Loaded | null = null;
let resultUrl: string | null = null;
let busy = false;
let dragIndex: number | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPdfOrganize(): void {
  const input = byId<HTMLInputElement>('po2-input');
  const drop = byId<HTMLElement>('po2-drop');
  const panel = byId<HTMLElement>('po2-panel');
  const info = byId<HTMLElement>('po2-file-info');
  const list = byId<HTMLOListElement>('po2-list');
  const status = byId<HTMLElement>('po2-status');
  const error = byId<HTMLElement>('po2-error');
  const progress = byId<HTMLProgressElement>('po2-progress');
  const applyButton = byId<HTMLButtonElement>('po2-apply');
  const rotateAll = byId<HTMLButtonElement>('po2-rotate-all');
  const resetButton = byId<HTMLButtonElement>('po2-reset');
  const clearButton = byId<HTMLButtonElement>('po2-clear');
  const result = byId<HTMLElement>('po2-result');
  const resultSummary = byId<HTMLElement>('po2-result-summary');
  const download = byId<HTMLAnchorElement>('po2-download');

  if (!input || !drop || !panel || !list || !status || !error || !applyButton || !result) return;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    result.hidden = true;
    if (download) {
      download.removeAttribute('href');
      download.hidden = true;
    }
  };

  const setProgress = (value: number, label?: string) => {
    if (progress) {
      progress.hidden = value <= 0 || value >= 1;
      progress.value = Math.min(1, Math.max(0, value));
    }
    if (label) status.textContent = label;
  };

  const render = () => {
    const loaded = current;
    if (!loaded) return;
    list.replaceChildren();
    applyButton.disabled = loaded.items.length === 0 || busy;
    if (rotateAll) rotateAll.disabled = loaded.items.length === 0 || busy;
    if (resetButton) resetButton.disabled = busy;
    if (clearButton) clearButton.disabled = busy;
    status.textContent = `${loaded.items.length}장 · 드래그하거나 버튼으로 순서를 바꾸세요`;

    loaded.items.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'page-card';
      li.draggable = !busy;
      li.dataset.index = String(index);
      li.dataset.id = item.id;

      const thumbWrap = document.createElement('div');
      thumbWrap.className = 'page-thumb';
      const img = document.createElement('img');
      img.src = item.thumb;
      img.alt = `원본 ${item.originalIndex + 1}쪽 미리보기`;
      img.loading = 'lazy';
      img.style.transform = `rotate(${item.rotation}deg) scale(${
        item.rotation === 90 || item.rotation === 270 ? 0.72 : 1
      })`;
      thumbWrap.append(img);

      const badge = document.createElement('span');
      badge.className = 'page-badge';
      badge.textContent = String(index + 1);
      thumbWrap.append(badge);

      const meta = document.createElement('span');
      meta.className = 'page-meta';
      meta.textContent =
        item.originalIndex + 1 === index + 1
          ? `${item.rotation}°`
          : `원본 ${item.originalIndex + 1}쪽 · ${item.rotation}°`;

      const controls = document.createElement('div');
      controls.className = 'page-controls';
      const make = (action: string, label: string, text: string, disabled = false) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'icon-btn';
        button.textContent = text;
        button.dataset.action = action;
        button.dataset.id = item.id;
        button.setAttribute('aria-label', label);
        button.disabled = disabled || busy;
        return button;
      };
      controls.append(
        make('left', '앞으로 이동', '←', index === 0),
        make('right', '뒤로 이동', '→', index === loaded.items.length - 1),
        make('rotate', '90도 회전', '⟳'),
        make('remove', '페이지 삭제', '✕'),
      );

      li.append(thumbWrap, meta, controls);
      list.append(li);
    });
  };

  const move = (from: number, to: number) => {
    if (!current || to < 0 || to >= current.items.length) return;
    const [item] = current.items.splice(from, 1);
    if (!item) return;
    current.items.splice(to, 0, item);
    clearResult();
    render();
  };

  const load = async (file: File) => {
    if (busy) return;
    showError('');
    clearResult();
    await dispose();

    const validation = validatePdfSelection([file]);
    if (!validation.ok) {
      showError(validation.errors.join(' '));
      return;
    }

    busy = true;
    setProgress(0.01, 'PDF를 여는 중…');
    try {
      const bytes = await file.arrayBuffer();
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

      const task = pdfjs.getDocument({
        data: new Uint8Array(bytes.slice(0)),
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        wasmUrl: '/pdfjs/wasm/',
        iccUrl: '/pdfjs/iccs/',
      });
      const doc = await task.promise;

      if (doc.numPages > MAX_PAGES) {
        await task.destroy();
        throw new Error(`한 번에 최대 ${MAX_PAGES}쪽까지 편집할 수 있습니다.`);
      }

      const items: PageItem[] = [];
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');

      for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber += 1) {
        setProgress(
          (pageNumber - 1) / doc.numPages,
          `${pageNumber}/${doc.numPages}쪽 미리보기 만드는 중…`,
        );
        const page = await doc.getPage(pageNumber);
        const base = page.getViewport({ scale: 1 });
        const scale = 160 / base.width;
        const viewport = page.getViewport({ scale });
        if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, viewport }).promise;
        page.cleanup();

        items.push({
          id: crypto.randomUUID(),
          originalIndex: pageNumber - 1,
          rotation: 0,
          thumb: canvas.toDataURL('image/jpeg', 0.72),
        });
      }

      current = { file, bytes, task, doc, items };
      if (info) {
        info.textContent = `${file.name} · ${doc.numPages}쪽 · ${formatBytes(file.size)}`;
      }
      panel.hidden = false;
      setProgress(0);
      busy = false;
      render();
    } catch (cause) {
      console.error(cause);
      current = null;
      panel.hidden = true;
      showError(
        cause instanceof Error
          ? cause.message
          : 'PDF를 열 수 없습니다. 암호가 걸렸거나 손상된 파일인지 확인하세요.',
      );
      setProgress(0);
    } finally {
      busy = false;
    }
  };

  const apply = async () => {
    const loaded = current;
    if (!loaded || loaded.items.length === 0 || busy) return;
    showError('');
    clearResult();
    busy = true;
    render();
    setProgress(0.05, 'PDF를 만드는 중…');

    try {
      const { PDFDocument } = await import('pdf-lib');
      const source = await PDFDocument.load(loaded.bytes);
      const output = await PDFDocument.create();
      const indices = loaded.items.map((item) => item.originalIndex);
      const copied = await output.copyPages(source, indices);

      copied.forEach((page, index) => {
        const item = loaded.items[index];
        const original = page.getRotation().angle;
        page.setRotation(degrees(normalizeRotation(original + (item?.rotation ?? 0))));
        output.addPage(page);
      });

      const bytes = await output.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);

      if (download) {
        download.href = resultUrl;
        download.download = organizeFileName(loaded.file.name);
        download.textContent = `정리한 PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultSummary) {
        resultSummary.textContent = `${output.getPageCount()}쪽 · ${formatBytes(blob.size)}`;
      }

      result.hidden = false;
      setProgress(0, '완료했습니다. 아래에서 내려받으세요.');
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError('PDF를 만드는 중 문제가 발생했습니다. 다시 시도해 주세요.');
      setProgress(0);
    } finally {
      busy = false;
      render();
    }
  };

  list.addEventListener('click', (event) => {
    const target = event.target;
    const loaded = current;
    if (!(target instanceof HTMLButtonElement) || !loaded) return;
    const id = target.dataset.id;
    const action = target.dataset.action;
    const index = loaded.items.findIndex((item) => item.id === id);
    if (index < 0 || !action) return;

    if (action === 'left') move(index, index - 1);
    else if (action === 'right') move(index, index + 1);
    else if (action === 'rotate') {
      const item = loaded.items[index];
      if (item) item.rotation = rotateBy(item.rotation);
      clearResult();
      render();
    } else if (action === 'remove') {
      loaded.items.splice(index, 1);
      clearResult();
      render();
    }
  });

  list.addEventListener('dragstart', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('.page-card');
    if (!target) return;
    dragIndex = Number(target.dataset.index);
    event.dataTransfer?.setData('text/plain', String(dragIndex));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  });

  list.addEventListener('dragover', (event) => {
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
  });

  list.addEventListener('drop', (event) => {
    event.preventDefault();
    const target = (event.target as HTMLElement).closest<HTMLElement>('.page-card');
    if (!target || dragIndex === null) return;
    const to = Number(target.dataset.index);
    if (Number.isFinite(to) && to !== dragIndex) move(dragIndex, to);
    dragIndex = null;
  });

  rotateAll?.addEventListener('click', () => {
    if (!current) return;
    for (const item of current.items) item.rotation = rotateBy(item.rotation);
    clearResult();
    render();
  });

  resetButton?.addEventListener('click', () => {
    if (!current) return;
    current.items.sort((a, b) => a.originalIndex - b.originalIndex);
    for (const item of current.items) item.rotation = 0;
    clearResult();
    render();
  });

  applyButton.addEventListener('click', () => void doWork(applyButton, apply));

  // 목적별 페이지(삭제·추출·회전): 원본 쪽 번호를 적어 한 번에 적용한다.
  const quickBox = document.querySelector<HTMLElement>('[data-quick]');
  const quickRange = byId<HTMLInputElement>('po2-quick-range');
  const quickAngle = byId<HTMLSelectElement>('po2-quick-angle');
  const quickApply = byId<HTMLButtonElement>('po2-quick-apply');
  const runQuick = () => {
    if (!current || !quickBox || !quickRange) return;
    const outcome = applyQuickAction(current.items, {
      mode: quickBox.dataset.quick as QuickMode,
      range: quickRange.value,
      pageCount: current.doc.numPages,
      angle: Number(quickAngle?.value ?? 90),
    });
    if (outcome.error) {
      showError(outcome.error);
      return;
    }
    showError('');
    current.items = outcome.items;
    clearResult();
    render();
    status.textContent = outcome.message;
  };
  quickApply?.addEventListener('click', runQuick);
  quickRange?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      runQuick();
    }
  });

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
    if (file) void load(file);
  });

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void load(file);
    input.value = '';
  });

  clearButton?.addEventListener('click', () => {
    if (busy) return;
    void dispose();
    clearResult();
    panel.hidden = true;
    status.textContent = '';
    showError('');
    setProgress(0);
  });

  window.addEventListener('pagehide', () => {
    void dispose();
  });
}

async function dispose(): Promise<void> {
  if (current) {
    try {
      await current.task.destroy();
    } catch {
      // 이미 종료된 경우 무시
    }
  }
  current = null;
}
