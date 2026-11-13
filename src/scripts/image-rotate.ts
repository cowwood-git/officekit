import { displayScale, type Size } from '@/lib/crop';
import { doWork } from '@/lib/do-work';
import { formatBytes, MAX_TOTAL_BYTES, safeFileName } from '@/lib/files';
import {
  canvasTransform,
  normalizeTurns,
  type QuarterTurns,
  rotatedSize,
} from '@/lib/image-rotate';

interface State {
  file: File;
  bitmap: ImageBitmap;
  natural: Size;
  turns: QuarterTurns;
  flipH: boolean;
  flipV: boolean;
  resultUrl?: string;
}

const PREVIEW_MAX_HEIGHT = 460;
const PREVIEW_MAX_WIDTH = 720;

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

export function initImageRotate(): void {
  const input = byId<HTMLInputElement>('ir-input');
  const drop = byId<HTMLElement>('ir-drop');
  const panel = byId<HTMLElement>('ir-panel');
  const canvas = byId<HTMLCanvasElement>('ir-canvas');
  const stage = byId<HTMLElement>('ir-stage');
  const rotateLeft = byId<HTMLButtonElement>('ir-left');
  const rotateRight = byId<HTMLButtonElement>('ir-right');
  const flipHButton = byId<HTMLButtonElement>('ir-flip-h');
  const flipVButton = byId<HTMLButtonElement>('ir-flip-v');
  const resetButton = byId<HTMLButtonElement>('ir-reset-transform');
  const format = byId<HTMLSelectElement>('ir-format');
  const quality = byId<HTMLInputElement>('ir-quality');
  const qualityValue = byId<HTMLElement>('ir-quality-value');
  const applyButton = byId<HTMLButtonElement>('ir-apply');
  const replaceButton = byId<HTMLButtonElement>('ir-replace');
  const status = byId<HTMLElement>('ir-status');
  const error = byId<HTMLElement>('ir-error');
  const info = byId<HTMLElement>('ir-info');
  const result = byId<HTMLElement>('ir-result');
  const resultImage = byId<HTMLImageElement>('ir-result-image');
  const resultSummary = byId<HTMLElement>('ir-result-summary');
  const download = byId<HTMLAnchorElement>('ir-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !canvas ||
    !rotateLeft ||
    !rotateRight ||
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

  const draw = (target: HTMLCanvasElement, width: number, height: number) => {
    if (!state) return;
    const context = target.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, width, height);
    if (format?.value === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
    }
    const transform = canvasTransform(width, height, state.turns, state.flipH, state.flipV);
    context.save();
    context.translate(transform.translateX, transform.translateY);
    context.rotate(transform.rotate);
    context.scale(transform.scaleX, transform.scaleY);
    context.drawImage(state.bitmap, -width / 2, -height / 2, width, height);
    context.restore();
  };

  const renderPreview = () => {
    if (!state) return;
    const size = rotatedSize(state.natural.width, state.natural.height, state.turns);
    const scale = displayScale(size, {
      width: PREVIEW_MAX_WIDTH,
      height: PREVIEW_MAX_HEIGHT,
    });
    canvas.width = Math.max(1, Math.round(size.width * scale));
    canvas.height = Math.max(1, Math.round(size.height * scale));
    draw(canvas, canvas.width, canvas.height);
    if (stage) {
      stage.style.width = `${canvas.width}px`;
      stage.style.height = `${canvas.height}px`;
    }
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;

    if (info) {
      info.textContent = `${size.width} × ${size.height}px · ${formatBytes(state.file.size)}`;
    }
    if (flipHButton) flipHButton.setAttribute('aria-pressed', String(state.flipH));
    if (flipVButton) flipVButton.setAttribute('aria-pressed', String(state.flipV));
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
    if (quality && qualityValue) {
      qualityValue.textContent = `${Math.round(Number(quality.value) * 100)}%`;
    }

    status.textContent = '이미지를 불러오는 중…';
    try {
      state?.bitmap.close();
      state = null;
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      state = {
        file,
        bitmap,
        natural: { width: bitmap.width, height: bitmap.height },
        turns: 0,
        flipH: false,
        flipV: false,
      };
      panel.hidden = false;
      renderPreview();
      status.textContent = '회전·뒤집기를 적용한 뒤 저장하세요.';
    } catch (cause) {
      console.error(cause);
      showError('이미지를 불러오지 못했습니다. HEIC는 JPG로 변환한 뒤 사용하세요.');
      status.textContent = '';
    }
  };

  const update = (mutate: () => void) => {
    if (!state) return;
    mutate();
    clearResult();
    showError('');
    renderPreview();
  };

  rotateLeft.addEventListener('click', () =>
    update(() => {
      if (state) state.turns = normalizeTurns(state.turns - 1);
    }),
  );
  rotateRight.addEventListener('click', () =>
    update(() => {
      if (state) state.turns = normalizeTurns(state.turns + 1);
    }),
  );
  flipHButton?.addEventListener('click', () =>
    update(() => {
      if (state) state.flipH = !state.flipH;
    }),
  );
  flipVButton?.addEventListener('click', () =>
    update(() => {
      if (state) state.flipV = !state.flipV;
    }),
  );
  resetButton?.addEventListener('click', () =>
    update(() => {
      if (!state) return;
      state.turns = 0;
      state.flipH = false;
      state.flipV = false;
    }),
  );

  format?.addEventListener('change', () => {
    clearResult();
    renderPreview();
  });
  quality?.addEventListener('input', () => {
    if (qualityValue) qualityValue.textContent = `${Math.round(Number(quality.value) * 100)}%`;
  });

  applyButton.addEventListener(
    'click',
    () =>
      void doWork(applyButton, async () => {
        if (!state) return;
        showError('');
        clearResult();
        applyButton.disabled = true;
        applyButton.setAttribute('aria-busy', 'true');
        status.textContent = '저장하는 중…';

        try {
          const size = rotatedSize(state.natural.width, state.natural.height, state.turns);
          const output = document.createElement('canvas');
          output.width = size.width;
          output.height = size.height;
          draw(output, size.width, size.height);

          const mime = format?.value ?? 'image/jpeg';
          const blob = await canvasToBlob(
            output,
            mime,
            mime === 'image/png' ? undefined : Number(quality?.value ?? 0.92),
          );
          state.resultUrl = URL.createObjectURL(blob);
          if (resultImage) {
            resultImage.src = state.resultUrl;
            resultImage.alt = '회전한 이미지 미리보기';
          }
          if (download) {
            const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
            const base = safeFileName(state.file.name.replace(/\.[^.]+$/, '')) || 'image';
            download.href = state.resultUrl;
            download.download = `${base}-rotated.${extension}`;
            download.textContent = `결과 내려받기 (${formatBytes(blob.size)})`;
            download.hidden = false;
          }
          if (resultSummary) {
            resultSummary.textContent = `${size.width} × ${size.height}px · ${formatBytes(blob.size)}`;
          }
          result.hidden = false;
          status.textContent = '완료했습니다. 아래에서 내려받으세요.';
          result.focus({ preventScroll: false });
        } catch (cause) {
          console.error(cause);
          showError('저장 중 문제가 발생했습니다. 더 작은 이미지로 다시 시도하세요.');
          status.textContent = '';
        } finally {
          applyButton.disabled = false;
          applyButton.removeAttribute('aria-busy');
        }
      }),
  );

  replaceButton?.addEventListener('click', () => {
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
}
