import { RESULT_EVENT } from '@/lib/do-work';
import { formatBytes, MAX_TOTAL_BYTES } from '@/lib/files';
import {
  normalizeOcrText,
  type OcrLanguage,
  ocrCharCount,
  ocrFileName,
  preprocessSize,
  textForDownload,
} from '@/lib/ocr';
import { disposeOcr, ocrStatusLabel, recognizeCanvas } from './ocr-client';

interface Loaded {
  file: File;
  bitmap: ImageBitmap;
  previewUrl: string;
}

let current: Loaded | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function buildCanvas(bitmap: ImageBitmap, preprocess: boolean): HTMLCanvasElement {
  const target = preprocessSize({ width: bitmap.width, height: bitmap.height });
  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('캔버스를 사용할 수 없습니다.');

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, target.width, target.height);

  if (preprocess) {
    const image = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = image.data;
    for (let index = 0; index < data.length; index += 4) {
      const gray =
        0.299 * (data[index] as number) +
        0.587 * (data[index + 1] as number) +
        0.114 * (data[index + 2] as number);
      const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.35 + 128));
      data[index] = contrast;
      data[index + 1] = contrast;
      data[index + 2] = contrast;
    }
    context.putImageData(image, 0, 0);
  }

  return canvas;
}

export function initImageOcr(): void {
  const input = byId<HTMLInputElement>('ocr-input');
  const drop = byId<HTMLElement>('ocr-drop');
  const panel = byId<HTMLElement>('ocr-panel');
  const preview = byId<HTMLImageElement>('ocr-preview');
  const info = byId<HTMLElement>('ocr-file-info');
  const language = byId<HTMLSelectElement>('ocr-language');
  const preprocess = byId<HTMLInputElement>('ocr-preprocess');
  const runButton = byId<HTMLButtonElement>('ocr-run');
  const resetButton = byId<HTMLButtonElement>('ocr-reset');
  const progress = byId<HTMLProgressElement>('ocr-progress');
  const status = byId<HTMLElement>('ocr-status');
  const error = byId<HTMLElement>('ocr-error');
  const result = byId<HTMLElement>('ocr-result');
  const textArea = byId<HTMLTextAreaElement>('ocr-text');
  const confidence = byId<HTMLElement>('ocr-confidence');
  const chars = byId<HTMLElement>('ocr-chars');
  const copyButton = byId<HTMLButtonElement>('ocr-copy');
  const download = byId<HTMLAnchorElement>('ocr-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !preview ||
    !runButton ||
    !status ||
    !error ||
    !result ||
    !textArea
  ) {
    return;
  }

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const setProgress = (value: number, label?: string) => {
    if (progress) {
      progress.hidden = value <= 0 || value >= 1;
      progress.value = Math.min(1, Math.max(0, value));
    }
    if (label) status.textContent = label;
  };

  const syncCounts = () => {
    if (chars) chars.textContent = `${ocrCharCount(textArea.value)}자`;
  };

  const acceptFile = async (file: File) => {
    showError('');
    if (!file.type.startsWith('image/')) {
      showError('이미지 파일만 선택할 수 있습니다.');
      return;
    }
    if (file.size > MAX_TOTAL_BYTES) {
      showError(`파일이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다. 더 작은 이미지를 사용하세요.`);
      return;
    }

    status.textContent = '이미지를 불러오는 중…';
    try {
      current?.bitmap.close();
      if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
      current = null;
      result.hidden = true;

      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const previewUrl = URL.createObjectURL(file);
      current = { file, bitmap, previewUrl };

      preview.src = previewUrl;
      preview.alt = `${file.name} 미리보기`;
      if (info) {
        info.textContent = `${file.name} · ${bitmap.width}×${bitmap.height} · ${formatBytes(file.size)}`;
      }
      panel.hidden = false;
      setProgress(0);
      status.textContent = '언어와 옵션을 확인한 뒤 텍스트 추출을 누르세요.';
    } catch (cause) {
      console.error(cause);
      showError('이미지를 불러오지 못했습니다. HEIC는 JPG로 변환한 뒤 사용하세요.');
      status.textContent = '';
    }
  };

  const run = async () => {
    if (!current) return;
    showError('');
    runButton.disabled = true;
    runButton.setAttribute('aria-busy', 'true');
    setProgress(0.01, '준비 중…');

    try {
      const selected = (language?.value as OcrLanguage) ?? 'kor+eng';
      const canvas = buildCanvas(current.bitmap, preprocess?.checked ?? true);

      status.textContent = '텍스트 인식 중…';
      const ocrResult = await recognizeCanvas(canvas, selected, (message) => {
        const label = ocrStatusLabel(message.status);
        const percent = Math.round((message.progress ?? 0) * 100);
        setProgress(message.progress ?? 0, `${label}… ${percent}%`);
      });
      const text = normalizeOcrText(ocrResult.text);

      textArea.value = text || '(인식된 텍스트가 없습니다)';
      syncCounts();
      if (confidence) {
        confidence.textContent = `${Math.round(ocrResult.confidence)}%`;
      }

      if (download) {
        const blob = new Blob([textForDownload(text)], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        download.href = url;
        download.download = ocrFileName(current.file.name);
        download.textContent = `텍스트 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }

      result.hidden = false;
      window.dispatchEvent(new CustomEvent(RESULT_EVENT));
      setProgress(0);
      status.textContent = text
        ? '완료했습니다. 텍스트를 복사하거나 TXT로 내려받으세요.'
        : '텍스트를 찾지 못했습니다. 이미지를 더 선명하게 다시 시도해 보세요.';
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      setProgress(0);
      showError(
        '텍스트 추출에 실패했습니다. 첫 실행은 언어 데이터를 내려받느라 시간이 걸릴 수 있습니다. 네트워크를 확인한 뒤 다시 시도하세요.',
      );
      status.textContent = '';
    } finally {
      runButton.disabled = false;
      runButton.removeAttribute('aria-busy');
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

  runButton.addEventListener('click', () => void run());

  textArea.addEventListener('input', syncCounts);

  copyButton?.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(textArea.value);
      copyButton.textContent = '복사됨';
      window.setTimeout(() => {
        copyButton.textContent = '텍스트 복사';
      }, 1500);
    } catch {
      textArea.select();
      showError('자동 복사가 차단되었습니다. 선택된 텍스트를 Ctrl/Cmd+C로 복사하세요.');
    }
  });

  resetButton?.addEventListener('click', () => {
    current?.bitmap.close();
    if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
    current = null;
    panel.hidden = true;
    result.hidden = true;
    setProgress(0);
    status.textContent = '';
    showError('');
    textArea.value = '';
    syncCounts();
  });

  window.addEventListener('pagehide', () => {
    current?.bitmap.close();
    if (current?.previewUrl) URL.revokeObjectURL(current.previewUrl);
    current = null;
    void disposeOcr();
  });
}
