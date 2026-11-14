import { doWork } from '@/lib/do-work';
import { formatBytes } from '@/lib/files';
import { type BgOutput, cutoutName, downloadMb, isHexColor } from '@/lib/remove-bg';
import { heicAsReadable } from './heic-file';
import { encodeCanvas } from './image-encoder';
import {
  hasWebGpu,
  removeBackgroundInWorker,
  stopRemoveBg,
  toModelInput,
} from './remove-bg-client';

const MAX_FILE_BYTES = 30 * 1024 * 1024;

let source: { file: File; name: string } | null = null;
let cutout: ImageBitmap | null = null;
let resultUrl: string | null = null;
let previewUrl: string | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initRemoveBg(): void {
  const input = byId<HTMLInputElement>('rb-input');
  const drop = byId<HTMLElement>('rb-drop');
  const panel = byId<HTMLElement>('rb-panel');
  const info = byId<HTMLElement>('rb-info');
  const sizeNote = byId<HTMLElement>('rb-size-note');
  const runButton = byId<HTMLButtonElement>('rb-run');
  const resetButton = byId<HTMLButtonElement>('rb-reset');
  const status = byId<HTMLElement>('rb-status');
  const progress = byId<HTMLProgressElement>('rb-progress');
  const error = byId<HTMLElement>('rb-error');
  const result = byId<HTMLElement>('rb-result');
  const before = byId<HTMLImageElement>('rb-before');
  const preview = byId<HTMLCanvasElement>('rb-preview');
  const bgInputs = Array.from(document.querySelectorAll<HTMLInputElement>('input[name="rb-bg"]'));
  const bgColor = byId<HTMLInputElement>('rb-color');
  const format = byId<HTMLSelectElement>('rb-format');
  const download = byId<HTMLAnchorElement>('rb-download');

  if (!input || !drop || !panel || !runButton || !status || !error || !result || !preview) return;
  const selectedBg = () => bgInputs.find((item) => item.checked)?.value ?? 'transparent';

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const setProgress = (value: number) => {
    if (!progress) return;
    progress.hidden = value <= 0 || value >= 1;
    progress.value = Math.min(1, Math.max(0, value));
  };

  const syncSizeNote = () => {
    if (!sizeNote) return;
    sizeNote.textContent = `처음 한 번 AI 모델 약 ${downloadMb(hasWebGpu())}MB를 받습니다. 한 번 받으면 이 브라우저에 저장돼 다음부터 바로 시작합니다.`;
  };

  const syncFormat = () => {
    if (!format) return;
    // 투명 배경은 JPG로 저장할 수 없다 → PNG로 바꾼다.
    const jpg = format.querySelector<HTMLOptionElement>('option[value="jpg"]');
    const transparent = selectedBg() === 'transparent';
    if (jpg) jpg.disabled = transparent;
    if (transparent && format.value === 'jpg') format.value = 'png';
    if (bgColor) bgColor.disabled = selectedBg() !== 'color';
  };

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    if (download) {
      download.hidden = true;
      download.removeAttribute('href');
    }
  };

  /** 미리보기 캔버스에 현재 배경 설정으로 그린다(투명은 체크무늬 위에 보인다 — CSS) */
  const paint = (target: HTMLCanvasElement, image: ImageBitmap) => {
    target.width = image.width;
    target.height = image.height;
    const context = target.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, target.width, target.height);
    const bg = selectedBg();
    if (bg !== 'transparent') {
      const color =
        bg === 'white'
          ? '#ffffff'
          : bgColor && isHexColor(bgColor.value)
            ? bgColor.value
            : '#ffffff';
      context.fillStyle = color;
      context.fillRect(0, 0, target.width, target.height);
    }
    context.drawImage(image, 0, 0);
  };

  const refreshPreview = () => {
    if (!cutout) return;
    paint(preview, cutout);
    clearResult();
    void buildDownload();
  };

  const buildDownload = async () => {
    if (!cutout || !source || !download) return;
    const output = (format?.value as BgOutput) ?? 'png';
    const mime = output === 'jpg' ? 'image/jpeg' : output === 'webp' ? 'image/webp' : 'image/png';
    const canvas = document.createElement('canvas');
    paint(canvas, cutout);
    const blob = await encodeCanvas(canvas, mime, 0.9);
    clearResult();
    resultUrl = URL.createObjectURL(blob);
    download.href = resultUrl;
    download.download = cutoutName(source.name, output);
    download.textContent = `내려받기 (${output.toUpperCase()} · ${formatBytes(blob.size)})`;
    download.hidden = false;
  };

  const reset = () => {
    stopRemoveBg();
    cutout?.close();
    cutout = null;
    source = null;
    clearResult();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    panel.hidden = true;
    result.hidden = true;
    status.textContent = '';
    showError('');
    setProgress(0);
  };

  const accept = async (file: File) => {
    reset();
    if (file.size > MAX_FILE_BYTES) {
      showError(`사진 한 장은 ${formatBytes(MAX_FILE_BYTES)}까지 넣을 수 있습니다.`);
      return;
    }
    try {
      const readable = await heicAsReadable(file);
      if (!readable.type.startsWith('image/')) throw new Error('not image');
      source = { file: readable, name: file.name };
      previewUrl = URL.createObjectURL(readable);
      if (before) before.src = previewUrl;
      if (info) info.textContent = `${file.name} · ${formatBytes(file.size)}`;
      panel.hidden = false;
      syncSizeNote();
      status.textContent = '[배경 지우기]를 누르세요.';
    } catch {
      showError('이 파일은 사진으로 읽을 수 없습니다. JPG·PNG·WebP·HEIC 사진을 넣어 주세요.');
    }
  };

  const run = async () => {
    if (!source) return;
    showError('');
    clearResult();
    result.hidden = true;
    runButton.disabled = true;
    setProgress(0.01);
    status.textContent = '사진을 준비하는 중…';
    try {
      const image = await toModelInput(source.file);
      status.textContent = '배경 지우기 엔진을 준비하는 중…';
      const started = performance.now();
      const output = await removeBackgroundInWorker(image, (done, total) => {
        setProgress(total > 0 ? done / total : 0);
        status.textContent = `처음 한 번 엔진을 받는 중… ${Math.round(done / 1e6)}/${Math.round(total / 1e6)}MB`;
      });
      cutout?.close();
      cutout = await createImageBitmap(output.image);
      paint(preview, cutout);
      await buildDownload();
      const seconds = ((performance.now() - started) / 1000).toFixed(1);
      result.hidden = false;
      result.dataset.device = output.device;
      status.textContent = `완료했습니다 (${seconds}초, ${output.device === 'gpu' ? '그래픽 가속' : '일반 모드'}).`;
    } catch (cause) {
      console.error(cause);
      showError(
        '배경을 지우지 못했습니다. 사진 크기를 줄이거나 다른 브라우저로 다시 시도해 주세요.',
      );
      status.textContent = '';
    } finally {
      setProgress(0);
      runButton.disabled = false;
    }
  };

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void accept(file);
    input.value = '';
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
    if (file) void accept(file);
  });
  for (const item of bgInputs) {
    item.addEventListener('change', () => {
      syncFormat();
      refreshPreview();
    });
  }
  bgColor?.addEventListener('input', refreshPreview);
  format?.addEventListener('change', () => {
    clearResult();
    void buildDownload();
  });
  runButton.addEventListener('click', () => void doWork(runButton, run));
  resetButton?.addEventListener('click', reset);
  window.addEventListener('pagehide', reset);
  syncFormat();
  syncSizeNote();
}
