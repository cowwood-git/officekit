import type { PDFDocument as PDFDocumentType } from 'pdf-lib';
import { RESULT_EVENT } from '@/lib/do-work';
import { formatBytes, safeFileName, validatePdfSelection } from '@/lib/files';
import { chunkPages, formatPageList, parsePageRanges } from '@/lib/pdf-split';
import { runWithProgress } from '@/lib/work-progress';

type Mode = 'range' | 'chunks' | 'each';

interface SplitFile {
  file: File;
  bytes: ArrayBuffer;
  pageCount: number;
}

let current: SplitFile | null = null;
let resultUrl: string | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function baseName(name: string): string {
  return safeFileName(name.replace(/\.pdf$/i, '')) || 'document';
}

function downloadNameFor(pages: number[], mode: Mode): string {
  if (mode === 'range') {
    const label = formatPageList(pages).replace(/[,\s]+/g, '_');
    return `${baseName(current?.file.name ?? '')}-${label}.pdf`;
  }
  return `${baseName(current?.file.name ?? '')}-split.zip`;
}

export function initPdfSplit(): void {
  const input = byId<HTMLInputElement>('split-input');
  const drop = byId<HTMLElement>('split-drop');
  const panel = byId<HTMLElement>('split-panel');
  const fileInfo = byId<HTMLElement>('split-file-info');
  const rangeField = byId<HTMLElement>('split-range-field');
  const rangeInput = byId<HTMLInputElement>('split-range');
  const chunkField = byId<HTMLElement>('split-chunk-field');
  const chunkInput = byId<HTMLInputElement>('split-chunk');
  const splitButton = byId<HTMLButtonElement>('split-button');
  const resetButton = byId<HTMLButtonElement>('split-reset');
  const status = byId<HTMLElement>('split-status');
  const progress = byId<HTMLElement>('split-progress');
  const error = byId<HTMLElement>('split-error');
  const result = byId<HTMLElement>('split-result');
  const resultSummary = byId<HTMLElement>('split-result-summary');
  const download = byId<HTMLAnchorElement>('split-download');

  if (!input || !drop || !panel || !splitButton || !status || !error || !result) return;

  const mode = (): Mode => {
    const checked = document.querySelector<HTMLInputElement>('input[name="split-mode"]:checked');
    return (checked?.value as Mode) ?? 'range';
  };

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

  const updateFields = () => {
    const selected = mode();
    if (rangeField) rangeField.hidden = selected !== 'range';
    if (chunkField) chunkField.hidden = selected !== 'chunks';
    if (splitButton) {
      splitButton.textContent =
        selected === 'range'
          ? '선택한 페이지만 추출'
          : selected === 'chunks'
            ? '나누어 ZIP으로 저장'
            : '한 장씩 ZIP으로 저장';
    }
  };

  const acceptFile = async (file: File) => {
    clearResult();
    showError([]);

    const validation = validatePdfSelection([file]);
    if (!validation.ok) {
      showError(validation.errors);
      return;
    }

    status.textContent = 'PDF를 확인하는 중…';
    try {
      const bytes = await file.arrayBuffer();
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(bytes, { updateMetadata: false });
      const pageCount = doc.getPageCount();

      current = { file, bytes, pageCount };
      if (fileInfo) {
        fileInfo.textContent = `${file.name} · ${pageCount}쪽 · ${formatBytes(file.size)}`;
      }
      if (rangeInput) {
        rangeInput.value = '';
        rangeInput.placeholder = `예: 1-${Math.max(1, Math.min(3, pageCount))}, ${pageCount}`;
      }
      if (chunkInput) {
        chunkInput.max = String(pageCount);
        chunkInput.value = String(Math.min(5, pageCount));
      }
      if (panel) panel.hidden = false;
      status.textContent = '';
      updateFields();
    } catch {
      current = null;
      showError(['PDF를 읽을 수 없습니다. 암호가 걸렸거나 손상된 파일인지 확인하세요.']);
      status.textContent = '';
    }
  };

  const loadSource = async () => {
    if (!current) throw new Error('파일이 없습니다.');
    const { PDFDocument } = await import('pdf-lib');
    return PDFDocument.load(current.bytes);
  };

  const makePdf = async (
    source: PDFDocumentType,
    pages: number[],
  ): Promise<{ blob: Blob; bytes: Uint8Array }> => {
    const { PDFDocument } = await import('pdf-lib');
    const output = await PDFDocument.create();
    const copied = await output.copyPages(
      source,
      pages.map((page) => page - 1),
    );
    for (const page of copied) output.addPage(page);
    const bytes = await output.save();
    return { blob: new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }), bytes };
  };

  const makeZip = async (source: PDFDocumentType, chunks: number[][]): Promise<Blob> => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const pad = Math.max(2, String(chunks.length).length);

    for (let index = 0; index < chunks.length; index += 1) {
      const chunk = chunks[index] as number[];
      const { bytes } = await makePdf(source, chunk);
      zip.file(`part-${String(index + 1).padStart(pad, '0')}.pdf`, bytes);
      status.textContent = `${index + 1}/${chunks.length} 처리 중…`;
    }

    return zip.generateAsync({ type: 'blob', compression: 'STORE' });
  };

  const run = async () => {
    if (!current) return;
    clearResult();
    showError([]);

    const selected = mode();
    let chunks: number[][] = [];

    if (selected === 'range') {
      const parsed = parsePageRanges(rangeInput?.value ?? '', current.pageCount);
      if (parsed.errors.length > 0) {
        showError(parsed.errors);
        return;
      }
      chunks = [parsed.pages];
    } else if (selected === 'chunks') {
      const size = Number(chunkInput?.value ?? 0);
      if (!Number.isInteger(size) || size < 1 || size > current.pageCount) {
        showError([`나눌 페이지 수는 1~${current.pageCount} 사이의 정수여야 합니다.`]);
        return;
      }
      chunks = chunkPages(current.pageCount, size);
    } else {
      chunks = chunkPages(current.pageCount, 1);
    }

    if (chunks.length === 0) {
      showError(['나눌 페이지가 없습니다.']);
      return;
    }

    splitButton.disabled = true;
    splitButton.setAttribute('aria-busy', 'true');
    status.textContent = '';

    const file = current.file;
    const totalPages = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    const zipped = chunks.length > 1;
    const steps = zipped
      ? [
          'PDF 구조 확인',
          `${totalPages}쪽을 ${chunks.length}묶음으로 나누기`,
          `PDF ${chunks.length}개 만들기`,
          'ZIP으로 묶기',
        ]
      : ['PDF 구조 확인', `${totalPages}쪽 골라내기`, '새 PDF 만들기', '파일 정리'];

    try {
      const { blob, name } = await runWithProgress(progress ?? document.createElement('div'), {
        title: zipped ? 'PDF를 나누는 중' : 'PDF를 만드는 중',
        steps,
        units: totalPages,
        task: async () => {
          const source = await loadSource();
          if (chunks.length === 1 && selected !== 'each') {
            const single = await makePdf(source, chunks[0] as number[]);
            return { blob: single.blob, name: downloadNameFor(chunks[0] as number[], selected) };
          }
          if (chunks.length === 1 && selected === 'each') {
            const single = await makePdf(source, chunks[0] as number[]);
            return { blob: single.blob, name: `${baseName(file.name)}-page-1.pdf` };
          }
          return {
            blob: await makeZip(source, chunks),
            name: downloadNameFor(chunks[0] as number[], selected),
          };
        },
      });

      resultUrl = URL.createObjectURL(blob);
      if (download) {
        download.href = resultUrl;
        download.download = name;
        download.textContent = `결과 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultSummary) {
        resultSummary.textContent =
          chunks.length === 1
            ? `${totalPages}쪽 PDF 1개`
            : `${chunks.length}개 파일 · 총 ${totalPages}쪽`;
      }

      result.hidden = false;
      window.dispatchEvent(new CustomEvent(RESULT_EVENT));
      status.textContent = '완료했습니다. 아래에서 내려받으세요.';
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError(['나누는 중 문제가 발생했습니다. 파일 수나 페이지 수를 줄여 다시 시도하세요.']);
      status.textContent = '';
    } finally {
      splitButton.disabled = false;
      splitButton.removeAttribute('aria-busy');
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

  document.querySelectorAll<HTMLInputElement>('input[name="split-mode"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      clearResult();
      showError([]);
      updateFields();
    });
  });

  splitButton.addEventListener('click', () => void run());

  resetButton?.addEventListener('click', () => {
    current = null;
    clearResult();
    showError([]);
    status.textContent = '';
    if (panel) panel.hidden = true;
    if (fileInfo) fileInfo.textContent = '';
    if (rangeInput) rangeInput.value = '';
  });

  window.addEventListener('pagehide', () => {
    current = null;
    clearResult();
  });

  updateFields();
}
