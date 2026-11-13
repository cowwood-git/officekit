import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import { planPages } from '@/lib/pdf-image';
import {
  extractedImageName,
  imageDataToRgba,
  isExtractableKind,
  isTinyImage,
  type RawImage,
} from '@/lib/pdf-image-extract';

interface Loaded {
  file: File;
  task: PDFDocumentLoadingTask;
  doc: PDFDocumentProxy;
  pageCount: number;
}

interface Extracted {
  name: string;
  page: number;
  width: number;
  height: number;
  blob: Blob;
  url: string;
}

const MAX_IMAGES = 100;
const MAX_PAGES = 300;

let current: Loaded | null = null;
let extracted: Extracted[] = [];
let zipUrl: string | null = null;
let running = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('이미지를 만들지 못했습니다.'));
    }, 'image/png');
  });
}

export function initPdfImageExtract(): void {
  const input = byId<HTMLInputElement>('ie-input');
  const drop = byId<HTMLElement>('ie-drop');
  const panel = byId<HTMLElement>('ie-panel');
  const fileInfo = byId<HTMLElement>('ie-file-info');
  const rangeInput = byId<HTMLInputElement>('ie-range');
  const extractButton = byId<HTMLButtonElement>('ie-extract');
  const resetButton = byId<HTMLButtonElement>('ie-reset');
  const list = byId<HTMLElement>('ie-list');
  const zipButton = byId<HTMLAnchorElement>('ie-zip');
  const status = byId<HTMLElement>('ie-status');
  const error = byId<HTMLElement>('ie-error');
  const result = byId<HTMLElement>('ie-result');
  const resultCount = byId<HTMLElement>('ie-result-count');
  const resultSize = byId<HTMLElement>('ie-result-size');

  if (
    !input ||
    !drop ||
    !panel ||
    !rangeInput ||
    !extractButton ||
    !list ||
    !status ||
    !error ||
    !result
  ) {
    return;
  }

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const clearResults = () => {
    for (const item of extracted) URL.revokeObjectURL(item.url);
    extracted = [];
    if (zipUrl) URL.revokeObjectURL(zipUrl);
    zipUrl = null;
    list.replaceChildren();
    result.hidden = true;
    if (zipButton) {
      zipButton.hidden = true;
      zipButton.removeAttribute('href');
    }
  };

  const dispose = async () => {
    if (current) {
      try {
        await current.task.destroy();
      } catch {
        // 이미 정리된 문서는 무시한다.
      }
    }
    current = null;
  };

  const readImage = async (
    page: Awaited<ReturnType<PDFDocumentProxy['getPage']>>,
    name: string,
  ): Promise<RawImage | null> => {
    const objects = (name.startsWith('g_') ? page.commonObjs : page.objs) as unknown as {
      get: (
        id: string,
        callback?: (data: RawImage) => void,
        errorCallback?: (reason: unknown) => void,
      ) => void;
    };
    try {
      return await new Promise<RawImage>((resolve, reject) => {
        const timer = window.setTimeout(() => reject(new Error('이미지 응답 시간 초과')), 5000);
        objects.get(
          name,
          (data) => {
            window.clearTimeout(timer);
            resolve(data);
          },
          (reason) => {
            window.clearTimeout(timer);
            reject(reason);
          },
        );
      });
    } catch {
      return null;
    }
  };

  const addImage = async (pageNumber: number, index: number, raw: RawImage): Promise<void> => {
    if (extracted.length >= MAX_IMAGES) return;
    const width = raw.width;
    const height = raw.height;
    if (!width || !height || isTinyImage(width, height)) return;
    if (!raw.bitmap && !isExtractableKind(raw.kind)) return;

    let canvas: HTMLCanvasElement;
    if (raw.bitmap) {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) return;
      context.drawImage(raw.bitmap, 0, 0);
    } else {
      const rgba = imageDataToRgba(raw);
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d');
      if (!context) return;
      const imageData = context.createImageData(width, height);
      imageData.data.set(rgba);
      context.putImageData(imageData, 0, 0);
    }

    const blob = await canvasToBlob(canvas);
    const name = extractedImageName(pageNumber, index);
    extracted.push({
      name,
      page: pageNumber,
      width,
      height,
      blob,
      url: URL.createObjectURL(blob),
    });
  };

  const renderList = () => {
    list.replaceChildren();
    for (const item of extracted) {
      const card = document.createElement('figure');
      card.className = 'ie-card';
      const image = document.createElement('img');
      image.src = item.url;
      image.alt = `${item.page}쪽 이미지 ${item.name}`;
      image.loading = 'lazy';
      const caption = document.createElement('figcaption');
      const meta = document.createElement('span');
      meta.textContent = `${item.page}쪽 · ${item.width}×${item.height}px · ${formatBytes(item.blob.size)}`;
      const link = document.createElement('a');
      link.href = item.url;
      link.download = item.name;
      link.textContent = 'PNG 저장';
      caption.append(meta, link);
      card.append(image, caption);
      list.append(card);
    }
  };

  const extract = async () => {
    const loaded = current;
    if (!loaded || running) return;
    const plan = planPages(rangeInput.value, loaded.pageCount);
    if (plan.errors.length > 0) {
      showError(plan.errors.join(' '));
      return;
    }

    showError('');
    clearResults();
    running = true;
    extractButton.disabled = true;
    extractButton.setAttribute('aria-busy', 'true');
    if (resetButton) resetButton.disabled = true;

    try {
      const pdfjs = await import('pdfjs-dist');
      for (let index = 0; index < plan.pages.length; index += 1) {
        const pageNumber = plan.pages[index];
        if (pageNumber === undefined || extracted.length >= MAX_IMAGES) break;
        status.textContent = `${index + 1}/${plan.pages.length}쪽 이미지 찾는 중…`;
        const page = await loaded.doc.getPage(pageNumber);
        const operatorList = await page.getOperatorList();
        let imageIndex = 0;
        for (let op = 0; op < operatorList.fnArray.length; op += 1) {
          if (extracted.length >= MAX_IMAGES) break;
          const fn = operatorList.fnArray[op];
          const args = operatorList.argsArray[op];
          if (!args) continue;

          if (fn === pdfjs.OPS.paintImageXObject) {
            const name = args[0];
            if (typeof name !== 'string') continue;
            const raw = await readImage(page, name);
            if (raw) {
              imageIndex += 1;
              await addImage(pageNumber, imageIndex, raw);
            }
          } else if (fn === pdfjs.OPS.paintInlineImageXObject) {
            const raw = args[0] as RawImage | undefined;
            if (raw?.width && raw.height) {
              imageIndex += 1;
              await addImage(pageNumber, imageIndex, raw);
            }
          }
        }
        page.cleanup();
      }

      renderList();
      if (extracted.length === 0) {
        status.textContent = '';
        showError('이미지를 찾지 못했습니다. 벡터 그래픽만 있는 PDF일 수 있습니다.');
        return;
      }
      if (resultCount) resultCount.textContent = `${extracted.length}개`;
      if (resultSize) {
        resultSize.textContent = formatBytes(
          extracted.reduce((sum, item) => sum + item.blob.size, 0),
        );
      }
      result.hidden = false;
      status.textContent = `${extracted.length}개 이미지를 추출했습니다.`;
      await buildZip();
    } catch (cause) {
      console.error(cause);
      showError('이미지를 추출하지 못했습니다. 암호가 걸린 PDF인지 확인하세요.');
      status.textContent = '';
    } finally {
      running = false;
      extractButton.disabled = false;
      extractButton.removeAttribute('aria-busy');
      if (resetButton) resetButton.disabled = false;
    }
  };

  const buildZip = async () => {
    if (extracted.length === 0) return;
    if (zipUrl) URL.revokeObjectURL(zipUrl);
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    for (const item of extracted) zip.file(item.name, item.blob);
    const blob = await zip.generateAsync({ type: 'blob' });
    zipUrl = URL.createObjectURL(blob);
    if (zipButton) {
      zipButton.href = zipUrl;
      zipButton.download = 'pdf-images.zip';
      zipButton.textContent = `ZIP 모두 저장 (${extracted.length}개 · ${formatBytes(blob.size)})`;
      zipButton.hidden = false;
    }
  };

  const acceptFile = async (file: File) => {
    if (running) return;
    showError('');
    clearResults();
    await dispose();
    const validation = validatePdfSelection([file]);
    if (!validation.ok) {
      showError(validation.errors.join(' '));
      return;
    }

    status.textContent = 'PDF를 여는 중…';
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      const task = pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        wasmUrl: '/pdfjs/wasm/',
        iccUrl: '/pdfjs/iccs/',
      });
      const doc = await task.promise;
      if (doc.numPages > MAX_PAGES) {
        await task.destroy();
        showError(`한 번에 최대 ${MAX_PAGES}쪽까지 처리합니다.`);
        status.textContent = '';
        return;
      }
      current = { file, task, doc, pageCount: doc.numPages };
      if (fileInfo) {
        fileInfo.textContent = `${file.name} · ${doc.numPages}쪽 · ${formatBytes(file.size)}`;
      }
      panel.hidden = false;
      status.textContent = '범위를 확인하고 이미지 추출을 누르세요.';
    } catch (cause) {
      console.error(cause);
      current = null;
      panel.hidden = true;
      showError('PDF를 열 수 없습니다. 암호가 걸렸거나 손상된 파일인지 확인하세요.');
      status.textContent = '';
    }
  };

  extractButton.addEventListener('click', () => void doWork(extractButton, extract));

  resetButton?.addEventListener('click', () => {
    void dispose();
    clearResults();
    panel.hidden = true;
    status.textContent = '';
    showError('');
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
    if (file) void acceptFile(file);
  });
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void acceptFile(file);
    input.value = '';
  });

  window.addEventListener('pagehide', () => {
    void dispose();
    clearResults();
  });
}
