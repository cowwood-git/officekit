import { doWork } from '@/lib/do-work';
import { formatBytes, MAX_TOTAL_BYTES, safeFileName } from '@/lib/files';
import {
  clampFrame,
  DEFAULT_FRAME,
  type FrameOptions,
  frameOutputSize,
  roundedRectPath,
} from '@/lib/image-frame';

interface State {
  file: File;
  bitmap: ImageBitmap;
  previewScale: number;
  resultUrl?: string;
}

let state: State | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('이미지를 만들지 못했습니다.'));
      },
      type,
      quality,
    );
  });
}

export function initImageFrame(): void {
  const input = byId<HTMLInputElement>('ifr-input');
  const drop = byId<HTMLElement>('ifr-drop');
  const panel = byId<HTMLElement>('ifr-panel');
  const canvas = byId<HTMLCanvasElement>('ifr-canvas');
  const radiusRange = byId<HTMLInputElement>('ifr-radius');
  const radiusValue = byId<HTMLElement>('ifr-radius-value');
  const borderRange = byId<HTMLInputElement>('ifr-border');
  const borderValue = byId<HTMLElement>('ifr-border-value');
  const borderColor = byId<HTMLInputElement>('ifr-border-color');
  const paddingRange = byId<HTMLInputElement>('ifr-padding');
  const paddingValue = byId<HTMLElement>('ifr-padding-value');
  const background = byId<HTMLInputElement>('ifr-background');
  const transparent = byId<HTMLInputElement>('ifr-transparent');
  const shadow = byId<HTMLInputElement>('ifr-shadow');
  const shadowRange = byId<HTMLInputElement>('ifr-shadow-blur');
  const shadowValue = byId<HTMLElement>('ifr-shadow-value');
  const format = byId<HTMLSelectElement>('ifr-format');
  const quality = byId<HTMLInputElement>('ifr-quality');
  const qualityValue = byId<HTMLElement>('ifr-quality-value');
  const applyButton = byId<HTMLButtonElement>('ifr-apply');
  const resetButton = byId<HTMLButtonElement>('ifr-reset');
  const status = byId<HTMLElement>('ifr-status');
  const error = byId<HTMLElement>('ifr-error');
  const info = byId<HTMLElement>('ifr-info');
  const result = byId<HTMLElement>('ifr-result');
  const resultImage = byId<HTMLImageElement>('ifr-result-image');
  const resultSummary = byId<HTMLElement>('ifr-result-summary');
  const download = byId<HTMLAnchorElement>('ifr-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !canvas ||
    !radiusRange ||
    !borderRange ||
    !paddingRange ||
    !applyButton ||
    !status ||
    !error ||
    !result
  ) {
    return;
  }

  const options = (): FrameOptions =>
    clampFrame({
      radius: Number(radiusRange.value),
      borderWidth: Number(borderRange.value),
      borderColor: borderColor?.value ?? DEFAULT_FRAME.borderColor,
      padding: Number(paddingRange.value),
      background: background?.value ?? DEFAULT_FRAME.background,
      shadow: shadow?.checked ?? false,
      shadowBlur: Number(shadowRange?.value ?? DEFAULT_FRAME.shadowBlur),
      shadowColor: DEFAULT_FRAME.shadowColor,
    });

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

  const drawFrame = (target: HTMLCanvasElement, scale: number) => {
    if (!state) return;
    const config = options();
    const size = frameOutputSize(state.bitmap.width, state.bitmap.height, config.padding);
    target.width = Math.max(1, Math.round(size.width * scale));
    target.height = Math.max(1, Math.round(size.height * scale));
    const context = target.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, target.width, target.height);

    const padding = config.padding * scale;
    const imageWidth = state.bitmap.width * scale;
    const imageHeight = state.bitmap.height * scale;
    const radius = config.radius * scale;
    const border = config.borderWidth * scale;
    const transparentBackground = transparent?.checked ?? false;
    const mime = format?.value ?? 'image/png';
    const fillBackground = !transparentBackground || mime === 'image/jpeg';

    context.save();
    if (config.shadow) {
      context.shadowColor = config.shadowColor;
      context.shadowBlur = config.shadowBlur * scale;
      context.shadowOffsetX = 4 * scale;
      context.shadowOffsetY = 6 * scale;
    }
    if (fillBackground) {
      roundedRectPath(
        context,
        padding - border,
        padding - border,
        imageWidth + border * 2,
        imageHeight + border * 2,
        radius + border,
      );
      context.fillStyle = background?.value ?? '#ffffff';
      context.fill();
    } else {
      roundedRectPath(context, padding, padding, imageWidth, imageHeight, radius);
      context.fillStyle = 'rgba(255,255,255,0.001)';
      context.fill();
    }
    context.restore();

    context.save();
    roundedRectPath(
      context,
      padding - border,
      padding - border,
      imageWidth + border * 2,
      imageHeight + border * 2,
      radius + border,
    );
    context.clip();
    roundedRectPath(context, padding, padding, imageWidth, imageHeight, radius);
    context.clip();
    context.drawImage(state.bitmap, padding, padding, imageWidth, imageHeight);
    context.restore();

    if (config.borderWidth > 0) {
      roundedRectPath(
        context,
        padding - border,
        padding - border,
        imageWidth + border * 2,
        imageHeight + border * 2,
        radius + border,
      );
      context.strokeStyle = config.borderColor;
      context.lineWidth = border;
      context.stroke();
    }

    if (info) {
      info.textContent = `${size.width} × ${size.height}px · 모서리 ${Math.round(config.radius)}px · 테두리 ${Math.round(config.borderWidth)}px`;
    }
  };

  const renderPreview = () => {
    if (!state) return;
    drawFrame(canvas, state.previewScale);
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = 'auto';
  };

  const syncLabels = () => {
    if (radiusValue) radiusValue.textContent = `${radiusRange.value}px`;
    if (borderValue) borderValue.textContent = `${borderRange.value}px`;
    if (paddingValue) paddingValue.textContent = `${paddingRange.value}px`;
    if (shadowValue) shadowValue.textContent = `${shadowRange?.value ?? 24}px`;
    if (qualityValue)
      qualityValue.textContent = `${Math.round(Number(quality?.value ?? 0.95) * 100)}%`;
  };

  const acceptFile = async (file: File) => {
    showError('');
    clearResult();
    if (!file.type.startsWith('image/')) {
      showError('이미지 파일만 선택할 수 있습니다.');
      return;
    }
    if (file.size > MAX_TOTAL_BYTES) {
      showError(`파일이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다.`);
      return;
    }
    status.textContent = '이미지를 불러오는 중…';
    try {
      state?.bitmap.close();
      state = null;
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const config = options();
      const output = frameOutputSize(bitmap.width, bitmap.height, config.padding);
      const scale = Math.min(1, 760 / output.width, 460 / output.height);
      state = { file, bitmap, previewScale: scale };
      panel.hidden = false;
      renderPreview();
      status.textContent = '모서리·테두리·여백을 조정한 뒤 저장하세요.';
    } catch (cause) {
      console.error(cause);
      state = null;
      panel.hidden = true;
      showError('이미지를 불러오지 못했습니다. HEIC는 JPG로 변환한 뒤 사용하세요.');
      status.textContent = '';
    }
  };

  for (const control of [
    radiusRange,
    borderRange,
    borderColor,
    paddingRange,
    background,
    transparent,
    shadow,
    shadowRange,
    format,
    quality,
  ]) {
    control?.addEventListener('input', () => {
      if (!state) return;
      clearResult();
      syncLabels();
      const config = options();
      const output = frameOutputSize(state.bitmap.width, state.bitmap.height, config.padding);
      state.previewScale = Math.min(1, 760 / output.width, 460 / output.height);
      renderPreview();
    });
    control?.addEventListener('change', () => {
      if (!state) return;
      clearResult();
      syncLabels();
      renderPreview();
    });
  }

  applyButton.addEventListener(
    'click',
    () =>
      void doWork(applyButton, async () => {
        if (!state) return;
        clearResult();
        showError('');
        applyButton.disabled = true;
        applyButton.setAttribute('aria-busy', 'true');
        status.textContent = '저장하는 중…';

        try {
          const output = document.createElement('canvas');
          drawFrame(output, 1);
          const mime = format?.value ?? 'image/png';
          const blob = await canvasToBlob(
            output,
            mime,
            mime === 'image/png' ? undefined : Number(quality?.value ?? 0.95),
          );
          state.resultUrl = URL.createObjectURL(blob);
          if (resultImage) {
            resultImage.src = state.resultUrl;
            resultImage.alt = '테두리를 넣은 이미지 미리보기';
          }
          if (download) {
            const extension =
              mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
            const base = safeFileName(state.file.name.replace(/\.[^.]+$/, '')) || 'image';
            download.href = state.resultUrl;
            download.download = `${base}-framed.${extension}`;
            download.textContent = `결과 내려받기 (${formatBytes(blob.size)})`;
            download.hidden = false;
          }
          if (resultSummary) {
            resultSummary.textContent = `${output.width} × ${output.height}px · ${formatBytes(blob.size)}`;
          }
          result.hidden = false;
          status.textContent = '완료했습니다. 아래에서 내려받으세요.';
          result.focus({ preventScroll: false });
        } catch (cause) {
          console.error(cause);
          showError('저장 중 문제가 발생했습니다. 더 작은 이미지로 시도하세요.');
          status.textContent = '';
        } finally {
          applyButton.disabled = false;
          applyButton.removeAttribute('aria-busy');
        }
      }),
  );

  resetButton?.addEventListener('click', () => {
    state?.bitmap.close();
    state = null;
    clearResult();
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
    state?.bitmap.close();
    if (state?.resultUrl) URL.revokeObjectURL(state.resultUrl);
  });

  syncLabels();
}
