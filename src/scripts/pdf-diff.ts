import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import {
  comparePdfPages,
  MAX_COMPARE_PAGES,
  type PageDiff,
  type PdfDiffResult,
  pdfDiffFileName,
  pdfDiffSummary,
  totalTextLength,
} from '@/lib/pdf-diff';
import { pageText } from '@/lib/pdf-text';
import { toDiffText } from '@/lib/text-diff';
import { renderDiffRows } from './diff-view';

interface LoadedPdf {
  file: File;
  task: PDFDocumentLoadingTask;
  doc: PDFDocumentProxy;
  pageCount: number;
}

let oldPdf: LoadedPdf | null = null;
let newPdf: LoadedPdf | null = null;
let lastResult: PdfDiffResult | null = null;
let downloadUrl: string | null = null;
let busy = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPdfDiff(): void {
  const oldInput = byId<HTMLInputElement>('pd-old-input');
  const oldDrop = byId<HTMLElement>('pd-old-drop');
  const newInput = byId<HTMLInputElement>('pd-new-input');
  const newDrop = byId<HTMLElement>('pd-new-drop');
  const oldInfo = byId<HTMLElement>('pd-old-info');
  const newInfo = byId<HTMLElement>('pd-new-info');
  const panel = byId<HTMLElement>('pd-panel');
  const onlyChanged = byId<HTMLInputElement>('pd-only-changed');
  const runButton = byId<HTMLButtonElement>('pd-run');
  const clearButton = byId<HTMLButtonElement>('pd-clear');
  const status = byId<HTMLElement>('pd-status');
  const error = byId<HTMLElement>('pd-error');
  const result = byId<HTMLElement>('pd-result');
  const resultSummary = byId<HTMLElement>('pd-result-summary');
  const pagesContainer = byId<HTMLElement>('pd-pages');
  const download = byId<HTMLAnchorElement>('pd-download');
  const stats = {
    added: byId<HTMLElement>('pd-stat-added'),
    removed: byId<HTMLElement>('pd-stat-removed'),
    changed: byId<HTMLElement>('pd-stat-changed'),
    unchanged: byId<HTMLElement>('pd-stat-unchanged'),
  };

  if (
    !oldInput ||
    !oldDrop ||
    !newInput ||
    !newDrop ||
    !panel ||
    !onlyChanged ||
    !runButton ||
    !status ||
    !error ||
    !result ||
    !pagesContainer
  ) {
    return;
  }

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const revoke = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = null;
    if (download) {
      download.hidden = true;
      download.removeAttribute('href');
    }
  };

  const updateReady = () => {
    if (oldPdf && newPdf) {
      panel.hidden = false;
      runButton.disabled = busy;
      status.textContent = '두 PDF를 읽었습니다. [텍스트 비교하기]를 누르세요.';
    } else {
      panel.hidden = true;
      runButton.disabled = true;
    }
  };

  const load = async (file: File, side: 'old' | 'new') => {
    showError('');
    revoke();
    lastResult = null;
    result.hidden = true;

    const validation = validatePdfSelection([file]);
    if (!validation.ok) {
      showError(validation.errors.join(' '));
      return;
    }

    status.textContent = side === 'old' ? '원본 PDF를 여는 중…' : '수정본 PDF를 여는 중…';
    try {
      const bytes = await file.arrayBuffer();
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      const task = pdfjs.getDocument({
        data: new Uint8Array(bytes),
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        wasmUrl: '/pdfjs/wasm/',
        iccUrl: '/pdfjs/iccs/',
      });
      const doc = await task.promise;
      if (doc.numPages > MAX_COMPARE_PAGES) {
        await task.destroy();
        throw new Error(`PDF 한 개당 최대 ${MAX_COMPARE_PAGES}쪽까지 비교할 수 있습니다.`);
      }

      const loaded = { file, task, doc, pageCount: doc.numPages };
      if (side === 'old') {
        if (oldPdf) await oldPdf.task.destroy().catch(() => undefined);
        oldPdf = loaded;
        if (oldInfo) {
          oldInfo.textContent = `${file.name} · ${doc.numPages}쪽 · ${formatBytes(file.size)}`;
        }
      } else {
        if (newPdf) await newPdf.task.destroy().catch(() => undefined);
        newPdf = loaded;
        if (newInfo) {
          newInfo.textContent = `${file.name} · ${doc.numPages}쪽 · ${formatBytes(file.size)}`;
        }
      }
      updateReady();
    } catch (cause) {
      console.error(cause);
      if (side === 'old') oldPdf = null;
      else newPdf = null;
      showError(
        cause instanceof Error
          ? cause.message
          : 'PDF를 열지 못했습니다. 암호가 걸렸거나 손상된 파일인지 확인하세요.',
      );
      status.textContent = '';
      updateReady();
    }
  };

  const extract = async (pdf: LoadedPdf, label: string): Promise<string[]> => {
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= pdf.pageCount; pageNumber += 1) {
      status.textContent = `${label} ${pageNumber}/${pdf.pageCount}쪽 텍스트 추출 중…`;
      const page = await pdf.doc.getPage(pageNumber);
      const content = await page.getTextContent();
      const items = content.items
        .filter((item): item is typeof item & { str: string } => 'str' in item)
        .map((item) => ({ str: item.str, hasEOL: 'hasEOL' in item && Boolean(item.hasEOL) }));
      pages.push(pageText(items));
      page.cleanup();
    }
    return pages;
  };

  const renderPage = (page: PageDiff, index: number): HTMLElement => {
    const details = document.createElement('details');
    details.className = `pd-page pd-page-${page.type}`;
    if (index === 0 && page.type !== 'same') details.open = true;

    const summary = document.createElement('summary');
    const badge = document.createElement('span');
    badge.className = 'pd-badge';
    badge.textContent =
      page.type === 'changed'
        ? '변경'
        : page.type === 'added'
          ? '추가'
          : page.type === 'removed'
            ? '삭제'
            : '그대로';

    const label = document.createElement('span');
    label.className = 'pd-page-label';
    if (page.type === 'added') label.textContent = `${page.newPage}쪽 추가`;
    else if (page.type === 'removed') label.textContent = `${page.oldPage}쪽 삭제`;
    else if (page.type === 'changed') label.textContent = `${page.oldPage}쪽 → ${page.newPage}쪽`;
    else label.textContent = `${page.oldPage}쪽`;

    summary.append(badge, label);

    if (page.type === 'changed' && page.diff) {
      const meta = document.createElement('span');
      meta.className = 'pd-page-meta';
      const parts: string[] = [];
      if (page.diff.stats.changed > 0) parts.push(`변경 ${page.diff.stats.changed}`);
      if (page.diff.stats.added > 0) parts.push(`추가 ${page.diff.stats.added}`);
      if (page.diff.stats.removed > 0) parts.push(`삭제 ${page.diff.stats.removed}`);
      meta.textContent = parts.join(' · ') || '차이 없음';
      summary.append(meta);
    }

    details.append(summary);

    if (page.type === 'changed' && page.diff) {
      const list = document.createElement('ol');
      list.className = 'td-diff pd-diff';
      list.setAttribute('aria-label', `${page.oldPage}쪽 텍스트 비교`);
      renderDiffRows(list, page.diff.rows, { maxRows: 1500 });
      details.append(list);
    } else if (page.type === 'added' || page.type === 'removed') {
      const pre = document.createElement('pre');
      pre.className = 'pd-page-text';
      const text = page.type === 'added' ? page.newText : page.oldText;
      pre.textContent =
        text.length > 4000
          ? `${text.slice(0, 4000)}\n\n… (${text.length.toLocaleString('ko-KR')}자 중 앞부분만 표시)`
          : text || '(텍스트 없음)';
      details.append(pre);
    } else {
      const note = document.createElement('p');
      note.className = 'muted pd-same-note';
      note.textContent = '이 쪽은 텍스트가 같습니다.';
      details.append(note);
    }

    return details;
  };

  const renderResult = () => {
    if (!lastResult) return;
    const value = lastResult;
    if (stats.added) stats.added.textContent = String(value.stats.addedPages);
    if (stats.removed) stats.removed.textContent = String(value.stats.removedPages);
    if (stats.changed) stats.changed.textContent = String(value.stats.changedPages);
    if (stats.unchanged) stats.unchanged.textContent = String(value.stats.unchangedPages);
    if (resultSummary) resultSummary.textContent = pdfDiffSummary(value.stats);

    pagesContainer.replaceChildren();
    const visible = value.pages.filter((page) => !onlyChanged.checked || page.type !== 'same');
    visible.forEach((page, index) => {
      pagesContainer.append(renderPage(page, index));
    });
    if (visible.length === 0) {
      const note = document.createElement('p');
      note.className = 'muted pd-empty';
      note.textContent = onlyChanged.checked
        ? '바뀐 쪽이 없습니다. “바뀐 쪽만 보기”를 끄면 같은 쪽도 볼 수 있습니다.'
        : '표시할 쪽이 없습니다.';
      pagesContainer.append(note);
    }

    const lines: string[] = [
      `원본: ${oldPdf?.file.name ?? ''} (${value.stats.oldPages}쪽)`,
      `수정본: ${newPdf?.file.name ?? ''} (${value.stats.newPages}쪽)`,
      pdfDiffSummary(value.stats),
      '',
    ];
    for (const page of value.pages) {
      if (page.type === 'same') continue;
      if (page.type === 'added') {
        lines.push(`--- ${page.newPage}쪽 추가 ---`, page.newText, '');
      } else if (page.type === 'removed') {
        lines.push(`--- ${page.oldPage}쪽 삭제 ---`, page.oldText, '');
      } else if (page.diff) {
        lines.push(`--- ${page.oldPage}쪽 → ${page.newPage}쪽 변경 ---`);
        lines.push(toDiffText(page.diff.rows));
        lines.push('');
      }
    }
    const text = lines.join('\n');
    revoke();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    downloadUrl = URL.createObjectURL(blob);
    if (download) {
      download.href = downloadUrl;
      download.download = pdfDiffFileName(
        oldPdf?.file.name ?? '원본.pdf',
        newPdf?.file.name ?? '수정본.pdf',
      );
      download.textContent = `비교 결과 TXT 내려받기 (${formatBytes(blob.size)})`;
      download.hidden = false;
    }
    result.hidden = false;
  };

  const compare = async () => {
    if (!oldPdf || !newPdf || busy) return;
    showError('');
    revoke();
    result.hidden = true;
    lastResult = null;
    busy = true;
    runButton.disabled = true;
    try {
      const oldTexts = await extract(oldPdf, '원본');
      const newTexts = await extract(newPdf, '수정본');
      if (totalTextLength(oldTexts) === 0 && totalTextLength(newTexts) === 0) {
        showError(
          '두 PDF 모두 텍스트 레이어가 없습니다. 스캔 이미지 PDF는 PDF OCR로 글자를 먼저 인식하세요.',
        );
        status.textContent = '';
        return;
      }
      if (totalTextLength(oldTexts) === 0 || totalTextLength(newTexts) === 0) {
        showError('한쪽 PDF에 텍스트가 없습니다. 스캔 PDF인지 확인하세요.');
        status.textContent = '';
        return;
      }

      lastResult = comparePdfPages(oldTexts, newTexts);
      renderResult();
      status.textContent = lastResult.changed
        ? '비교가 끝났습니다. 바뀐 쪽을 확인하세요.'
        : '두 PDF의 페이지 텍스트가 같습니다.';
    } catch (cause) {
      console.error(cause);
      showError(cause instanceof Error ? cause.message : 'PDF 텍스트를 비교하지 못했습니다.');
      status.textContent = '';
    } finally {
      busy = false;
      runButton.disabled = false;
    }
  };

  const wireDrop = (drop: HTMLElement, input: HTMLInputElement, side: 'old' | 'new') => {
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
      if (file) void load(file, side);
    });
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) void load(file, side);
      input.value = '';
    });
  };

  wireDrop(oldDrop, oldInput, 'old');
  wireDrop(newDrop, newInput, 'new');

  onlyChanged.addEventListener('change', renderResult);
  runButton.addEventListener('click', () => void doWork(runButton, compare));
  clearButton?.addEventListener('click', () => {
    if (busy) return;
    void oldPdf?.task.destroy().catch(() => undefined);
    void newPdf?.task.destroy().catch(() => undefined);
    oldPdf = null;
    newPdf = null;
    lastResult = null;
    revoke();
    panel.hidden = true;
    result.hidden = true;
    showError('');
    status.textContent = '';
    pagesContainer.replaceChildren();
    if (oldInfo) oldInfo.textContent = '';
    if (newInfo) newInfo.textContent = '';
    oldInput.value = '';
    newInput.value = '';
    oldInput.focus();
  });

  window.addEventListener('pagehide', () => {
    void oldPdf?.task.destroy().catch(() => undefined);
    void newPdf?.task.destroy().catch(() => undefined);
    revoke();
  });
}
