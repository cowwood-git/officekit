import { displayScale, type Size } from '@/lib/crop';
import { doWork } from '@/lib/do-work';
import { formatBytes, MAX_TOTAL_BYTES, safeFileName } from '@/lib/files';
import { outputScaleFor } from '@/lib/watermark';
import { drawWatermark, type WatermarkLayout } from '@/lib/watermark-canvas';

type Layout = WatermarkLayout;

interface State {
  file: File;
  bitmap: ImageBitmap;
  natural: Size;
  previewSize: Size;
  previewScale: number;
  stageScale: number;
  resultUrl?: string;
}

const PREVIEW_MAX = 1600;
const STAGE_MAX_HEIGHT = 440;
const EXPORT_MAX = 6000;

let state: State | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('이미지를 변환하지 못했습니다.'));
      },
      type,
      quality,
    );
  });
}

export function initImageWatermark(): void {
  const input = byId<HTMLInputElement>('wm-input');
  const drop = byId<HTMLElement>('wm-drop');
  const panel = byId<HTMLElement>('wm-panel');
  const stage = byId<HTMLElement>('wm-stage');
  const canvas = byId<HTMLCanvasElement>('wm-canvas');
  const textInput = byId<HTMLInputElement>('wm-text');
  const sizeRange = byId<HTMLInputElement>('wm-size');
  const sizeValue = byId<HTMLElement>('wm-size-value');
  const opacityRange = byId<HTMLInputElement>('wm-opacity');
  const opacityValue = byId<HTMLElement>('wm-opacity-value');
  const colorInput = byId<HTMLInputElement>('wm-color');
  const angleSelect = byId<HTMLSelectElement>('wm-angle');
  const layoutSelect = byId<HTMLSelectElement>('wm-layout');
  const shadowInput = byId<HTMLInputElement>('wm-shadow');
  const format = byId<HTMLSelectElement>('wm-format');
  const quality = byId<HTMLInputElement>('wm-quality');
  const qualityValue = byId<HTMLElement>('wm-quality-value');
  const applyButton = byId<HTMLButtonElement>('wm-apply');
  const resetButton = byId<HTMLButtonElement>('wm-reset');
  const status = byId<HTMLElement>('wm-status');
  const error = byId<HTMLElement>('wm-error');
  const result = byId<HTMLElement>('wm-result');
  const resultImage = byId<HTMLImageElement>('wm-result-image');
  const resultSummary = byId<HTMLElement>('wm-result-summary');
  const download = byId<HTMLAnchorElement>('wm-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !stage ||
    !canvas ||
    !textInput ||
    !sizeRange ||
    !opacityRange ||
    !colorInput ||
    !angleSelect ||
    !layoutSelect ||
    !applyButton ||
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

  const clearResult = () => {
    if (state?.resultUrl) {
      URL.revokeObjectURL(state.resultUrl);
      state.resultUrl = undefined;
    }
    result.hidden = true;
    if (resultImage) resultImage.removeAttribute('src');
    download?.removeAttribute('href');
    if (download) download.hidden = true;
  };

  const options = () => ({
    text: textInput.value,
    sizePercent: Number(sizeRange.value) || 6,
    opacity: (Number(opacityRange.value) || 25) / 100,
    color: colorInput.value || '#ffffff',
    angle: Number(angleSelect.value) || 0,
    layout: (layoutSelect.value as Layout) ?? 'tile',
    shadow: shadowInput?.checked ?? true,
  });

  const drawPreview = () => {
    if (!state) return;
    canvas.width = state.previewSize.width;
    canvas.height = state.previewSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      state.bitmap,
      0,
      0,
      state.natural.width,
      state.natural.height,
      0,
      0,
      canvas.width,
      canvas.height,
    );
    drawWatermark(ctx, state.previewSize, options());
    applyButton.disabled = textInput.value.trim() === '';
  };

  const layout = () => {
    if (!state) return;
    const available = Math.max(240, stage.parentElement?.clientWidth ?? 640);
    const scale = displayScale(state.previewSize, {
      width: available,
      height: STAGE_MAX_HEIGHT,
    });
    state.stageScale = scale;
    const width = Math.round(state.previewSize.width * scale);
    const height = Math.round(state.previewSize.height * scale);
    stage.style.width = `${width}px`;
    stage.style.height = `${height}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    drawPreview();
  };

  const acceptFile = async (file: File) => {
    showError('');
    clearResult();

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
      state?.bitmap.close();
      state = null;

      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const previewScale = Math.min(1, PREVIEW_MAX / Math.max(bitmap.width, bitmap.height));

      state = {
        file,
        bitmap,
        natural: { width: bitmap.width, height: bitmap.height },
        previewSize: {
          width: Math.max(1, Math.round(bitmap.width * previewScale)),
          height: Math.max(1, Math.round(bitmap.height * previewScale)),
        },
        previewScale,
        stageScale: 1,
      };

      panel.hidden = false;
      layout();
      status.textContent = '워터마크를 조정한 뒤 저장하세요.';
    } catch (cause) {
      console.error(cause);
      showError('이미지를 불러오지 못했습니다. HEIC는 JPG로 변환한 뒤 사용하세요.');
      status.textContent = '';
    }
  };

  for (const control of [
    textInput,
    sizeRange,
    opacityRange,
    colorInput,
    angleSelect,
    layoutSelect,
  ]) {
    control.addEventListener('input', () => {
      if (sizeValue) sizeValue.textContent = `${sizeRange.value}%`;
      if (opacityValue) opacityValue.textContent = `${opacityRange.value}%`;
      clearResult();
      drawPreview();
    });
    control.addEventListener('change', () => {
      clearResult();
      drawPreview();
    });
  }

  shadowInput?.addEventListener('change', () => {
    clearResult();
    drawPreview();
  });

  quality?.addEventListener('input', () => {
    if (qualityValue) qualityValue.textContent = `${Math.round(Number(quality.value) * 100)}%`;
  });

  applyButton.addEventListener(
    'click',
    () =>
      void doWork(applyButton, async () => {
        if (!state) return;
        if (textInput.value.trim() === '') {
          showError('워터마크 문구를 입력하세요.');
          return;
        }

        showError('');
        clearResult();
        applyButton.disabled = true;
        applyButton.setAttribute('aria-busy', 'true');
        status.textContent = '저장하는 중…';

        try {
          const scale = outputScaleFor(state.natural, EXPORT_MAX);
          const width = Math.round(state.natural.width * scale);
          const height = Math.round(state.natural.height * scale);

          const output = document.createElement('canvas');
          output.width = width;
          output.height = height;
          const ctx = output.getContext('2d');
          if (!ctx) throw new Error('캔버스를 사용할 수 없습니다.');

          ctx.drawImage(
            state.bitmap,
            0,
            0,
            state.natural.width,
            state.natural.height,
            0,
            0,
            width,
            height,
          );
          drawWatermark(ctx, { width, height }, options());

          const mime = format?.value ?? 'image/jpeg';
          const blob = await canvasToBlob(
            output,
            mime,
            mime === 'image/png' ? undefined : Number(quality?.value ?? 0.92),
          );
          state.resultUrl = URL.createObjectURL(blob);

          if (resultImage) {
            resultImage.src = state.resultUrl;
            resultImage.alt = '워터마크 결과 미리보기';
          }
          if (download) {
            const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
            const base = safeFileName(state.file.name.replace(/\.[^.]+$/, '')) || 'image';
            download.href = state.resultUrl;
            download.download = `${base}-watermark.${extension}`;
            download.textContent = `결과 내려받기 (${formatBytes(blob.size)})`;
            download.hidden = false;
          }
          if (resultSummary) {
            resultSummary.textContent = `${width} × ${height} · ${formatBytes(blob.size)}${
              scale < 1 ? ' · 6000px로 축소' : ''
            }`;
          }

          result.hidden = false;
          status.textContent = '완료했습니다. 아래에서 내려받으세요.';
          result.focus({ preventScroll: false });
        } catch (cause) {
          console.error(cause);
          showError('저장 중 문제가 발생했습니다. 이미지 크기를 줄여 다시 시도하세요.');
          status.textContent = '';
        } finally {
          applyButton.disabled = textInput.value.trim() === '';
          applyButton.removeAttribute('aria-busy');
        }
      }),
  );

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

  resetButton?.addEventListener('click', () => {
    state?.bitmap.close();
    state = null;
    clearResult();
    panel.hidden = true;
    status.textContent = '';
    showError('');
  });

  if (sizeValue) sizeValue.textContent = `${sizeRange.value}%`;
  if (opacityValue) opacityValue.textContent = `${opacityRange.value}%`;
  window.addEventListener('resize', layout);

  window.addEventListener('pagehide', () => {
    state?.bitmap.close();
    state = null;
    clearResult();
  });
}
