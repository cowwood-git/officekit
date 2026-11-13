import {
  clampRect,
  displayScale,
  fitAspect,
  type Handle,
  moveRect,
  type Rect,
  resizeRect,
  type Size,
} from '@/lib/crop';
import { doWork } from '@/lib/do-work';
import { formatBytes, MAX_TOTAL_BYTES, safeFileName } from '@/lib/files';

const MAX_PREVIEW = 1800;
const MAX_OUTPUT = 6000;
const STAGE_MAX_HEIGHT = 420;

interface State {
  file: File;
  bitmap: ImageBitmap;
  natural: Size;
  previewSize: Size;
  previewScale: number;
  crop: Rect;
  ratio: number | null;
  previewUrl: string;
  stageScale: number;
  outputDirty: boolean;
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
        else reject(new Error('이미지를 변환하지 못했습니다.'));
      },
      type,
      quality,
    );
  });
}

function formatLabel(format: string): string {
  if (format === 'image/png') return 'PNG';
  if (format === 'image/webp') return 'WebP';
  return 'JPG';
}

export function initImageCrop(): void {
  const input = byId<HTMLInputElement>('crop-input');
  const drop = byId<HTMLElement>('crop-drop');
  const panel = byId<HTMLElement>('crop-panel');
  const stage = byId<HTMLElement>('crop-stage');
  const image = byId<HTMLImageElement>('crop-image');
  const box = byId<HTMLElement>('crop-box');
  const badge = byId<HTMLElement>('crop-badge');
  const ratioGroup = byId<HTMLElement>('crop-ratios');
  const xInput = byId<HTMLInputElement>('crop-x');
  const yInput = byId<HTMLInputElement>('crop-y');
  const wInput = byId<HTMLInputElement>('crop-w');
  const hInput = byId<HTMLInputElement>('crop-h');
  const outW = byId<HTMLInputElement>('out-w');
  const outH = byId<HTMLInputElement>('out-h');
  const lock = byId<HTMLInputElement>('out-lock');
  const originalButton = byId<HTMLButtonElement>('out-original');
  const format = byId<HTMLSelectElement>('crop-format');
  const quality = byId<HTMLInputElement>('crop-quality');
  const qualityValue = byId<HTMLElement>('crop-quality-value');
  const applyButton = byId<HTMLButtonElement>('crop-apply');
  const resetButton = byId<HTMLButtonElement>('crop-reset');
  const status = byId<HTMLElement>('crop-status');
  const error = byId<HTMLElement>('crop-error');
  const result = byId<HTMLElement>('crop-result');
  const resultImage = byId<HTMLImageElement>('crop-result-image');
  const resultSummary = byId<HTMLElement>('crop-result-summary');
  const download = byId<HTMLAnchorElement>('crop-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !stage ||
    !image ||
    !box ||
    !xInput ||
    !yInput ||
    !wInput ||
    !hInput ||
    !outW ||
    !outH ||
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

  const syncOutput = () => {
    if (!state || state.outputDirty) return;
    outW.value = String(Math.round(state.crop.width));
    outH.value = String(Math.round(state.crop.height));
  };

  const render = () => {
    if (!state) return;
    const { crop, previewScale, stageScale } = state;
    const left = crop.x * previewScale * stageScale;
    const top = crop.y * previewScale * stageScale;
    const width = crop.width * previewScale * stageScale;
    const height = crop.height * previewScale * stageScale;

    box.style.left = `${left}px`;
    box.style.top = `${top}px`;
    box.style.width = `${width}px`;
    box.style.height = `${height}px`;
    if (badge) badge.textContent = `${Math.round(crop.width)} × ${Math.round(crop.height)}`;

    const setIfIdle = (el: HTMLInputElement, value: number) => {
      if (document.activeElement !== el) el.value = String(Math.round(value));
    };
    setIfIdle(xInput, crop.x);
    setIfIdle(yInput, crop.y);
    setIfIdle(wInput, crop.width);
    setIfIdle(hInput, crop.height);
    syncOutput();
  };

  const layout = () => {
    if (!state) return;
    const availableWidth = Math.max(240, stage.parentElement?.clientWidth ?? 640);
    const scale = displayScale(state.previewSize, {
      width: availableWidth,
      height: STAGE_MAX_HEIGHT,
    });
    state.stageScale = scale;
    stage.style.width = `${Math.round(state.previewSize.width * scale)}px`;
    stage.style.height = `${Math.round(state.previewSize.height * scale)}px`;
    render();
  };

  const toNatural = (clientX: number, clientY: number): { x: number; y: number } => {
    if (!state) return { x: 0, y: 0 };
    const rect = image.getBoundingClientRect();
    const total = state.previewScale * state.stageScale;
    return {
      x: Math.min(Math.max((clientX - rect.left) / total, 0), state.natural.width),
      y: Math.min(Math.max((clientY - rect.top) / total, 0), state.natural.height),
    };
  };

  const makePreview = async (bitmap: ImageBitmap, isPng: boolean) => {
    const scale = Math.min(1, MAX_PREVIEW / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await canvasToBlob(canvas, isPng ? 'image/png' : 'image/jpeg', 0.92);
    return { url: URL.createObjectURL(blob), size: { width, height }, scale };
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
      if (state?.previewUrl) URL.revokeObjectURL(state.previewUrl);
      state?.bitmap.close();
      state = null;

      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const preview = await makePreview(bitmap, file.type === 'image/png');

      state = {
        file,
        bitmap,
        natural: { width: bitmap.width, height: bitmap.height },
        previewSize: preview.size,
        previewScale: preview.scale,
        crop: { x: 0, y: 0, width: bitmap.width, height: bitmap.height },
        ratio: null,
        previewUrl: preview.url,
        stageScale: 1,
        outputDirty: false,
      };

      panel.hidden = false;
      image.src = preview.url;
      image.alt = `${file.name} 미리보기`;
      ratioGroup?.querySelectorAll('button[data-ratio]').forEach((button) => {
        button.setAttribute(
          'aria-pressed',
          button.getAttribute('data-ratio') === 'free' ? 'true' : 'false',
        );
      });
      if (format) format.value = 'image/jpeg';
      if (quality) quality.value = '0.9';
      if (qualityValue) qualityValue.textContent = '90%';
      if (lock) lock.checked = true;
      state.outputDirty = false;

      layout();
      status.textContent = '영역을 조정한 뒤 자르기를 실행하세요.';
    } catch (cause) {
      console.error(cause);
      showError('이미지를 불러오지 못했습니다. 다른 형식으로 다시 시도해 주세요.');
      status.textContent = '';
    }
  };

  // ── 포인터로 크롭 영역 조정 ─────────────────────────────────────────────
  let drag: {
    mode: 'move' | Handle;
    start: { x: number; y: number };
    crop: Rect;
  } | null = null;

  box.addEventListener('pointerdown', (event) => {
    if (!state) return;
    const target = event.target as HTMLElement;
    const handle = target.dataset.handle as Handle | undefined;
    const point = toNatural(event.clientX, event.clientY);
    drag = {
      mode: handle ?? 'move',
      start: point,
      crop: { ...state.crop },
    };
    try {
      box.setPointerCapture(event.pointerId);
    } catch {
      // 합성 이벤트 등 포인터 캡처를 지원하지 않는 환경은 무시한다.
    }
    event.preventDefault();
  });

  box.addEventListener('pointermove', (event) => {
    if (!drag || !state) return;
    const point = toNatural(event.clientX, event.clientY);

    if (drag.mode === 'move') {
      const dx = point.x - drag.start.x;
      const dy = point.y - drag.start.y;
      state.crop = moveRect(drag.crop, dx, dy, state.natural);
    } else {
      state.crop = resizeRect(drag.crop, drag.mode, point, state.natural, state.ratio);
    }
    clearResult();
    render();
  });

  const endDrag = (event: PointerEvent) => {
    if (!drag) return;
    drag = null;
    try {
      if (box.hasPointerCapture(event.pointerId)) box.releasePointerCapture(event.pointerId);
    } catch {
      // 이미 해제된 경우 무시한다.
    }
  };
  box.addEventListener('pointerup', endDrag);
  box.addEventListener('pointercancel', endDrag);

  // ── 비율 프리셋 ────────────────────────────────────────────────────────
  ratioGroup?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const value = target.dataset.ratio;
    if (!value || !state) return;

    state.ratio = value === 'free' ? null : Number(value);
    if (state.ratio) state.crop = fitAspect(state.crop, state.ratio, state.natural);

    ratioGroup.querySelectorAll('button[data-ratio]').forEach((button) => {
      button.setAttribute('aria-pressed', button === target ? 'true' : 'false');
    });
    clearResult();
    render();
  });

  // ── 숫자 입력 ──────────────────────────────────────────────────────────
  const readCropInputs = () => {
    if (!state) return;
    const x = Number(xInput.value) || 0;
    const y = Number(yInput.value) || 0;
    const w = Number(wInput.value) || 0;
    const h = Number(hInput.value) || 0;
    state.crop = clampRect({ x, y, width: w, height: h }, state.natural);
    clearResult();
    render();
  };

  for (const field of [xInput, yInput, wInput, hInput]) {
    field.addEventListener('change', readCropInputs);
  }

  // ── 출력 크기 ──────────────────────────────────────────────────────────
  const markDirty = () => {
    if (state) state.outputDirty = true;
  };

  outW.addEventListener('input', () => {
    markDirty();
    if (!state || !lock?.checked) return;
    const width = Math.min(MAX_OUTPUT, Math.max(1, Number(outW.value) || 1));
    outH.value = String(Math.round(width / (state.crop.width / state.crop.height)));
  });

  outH.addEventListener('input', () => {
    markDirty();
    if (!state || !lock?.checked) return;
    const height = Math.min(MAX_OUTPUT, Math.max(1, Number(outH.value) || 1));
    outW.value = String(Math.round(height * (state.crop.width / state.crop.height)));
  });

  originalButton?.addEventListener('click', () => {
    if (!state) return;
    outW.value = String(Math.round(state.crop.width));
    outH.value = String(Math.round(state.crop.height));
    state.outputDirty = false;
  });

  quality?.addEventListener('input', () => {
    if (qualityValue) qualityValue.textContent = `${Math.round(Number(quality.value) * 100)}%`;
  });

  format?.addEventListener('change', () => {
    if (quality) quality.disabled = format.value === 'image/png';
  });

  // ── 실행 ───────────────────────────────────────────────────────────────
  applyButton.addEventListener(
    'click',
    () =>
      void doWork(applyButton, async () => {
        if (!state) return;
        showError('');
        clearResult();

        const width = Math.round(Number(outW.value) || state.crop.width);
        const height = Math.round(Number(outH.value) || state.crop.height);
        if (width < 1 || height < 1 || width > MAX_OUTPUT || height > MAX_OUTPUT) {
          showError(`출력 크기는 1~${MAX_OUTPUT}px 사이여야 합니다.`);
          return;
        }

        const mime = format?.value ?? 'image/jpeg';
        const qualityValueNumber = Number(quality?.value ?? 0.9);

        applyButton.disabled = true;
        applyButton.setAttribute('aria-busy', 'true');
        status.textContent = '자르는 중…';

        try {
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('캔버스를 사용할 수 없습니다.');

          if (mime === 'image/jpeg') {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, width, height);
          }
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';
          context.drawImage(
            state.bitmap,
            state.crop.x,
            state.crop.y,
            state.crop.width,
            state.crop.height,
            0,
            0,
            width,
            height,
          );

          const blob = await canvasToBlob(
            canvas,
            mime,
            mime === 'image/png' ? undefined : qualityValueNumber,
          );
          state.resultUrl = URL.createObjectURL(blob);

          if (resultImage) {
            resultImage.src = state.resultUrl;
            resultImage.alt = '자르기 결과 미리보기';
          }
          if (download) {
            const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
            const base = safeFileName(state.file.name.replace(/\.[^.]+$/, '')) || 'image';
            download.href = state.resultUrl;
            download.download = `${base}-${width}x${height}.${extension}`;
            download.textContent = `${formatLabel(mime)} 내려받기 (${formatBytes(blob.size)})`;
            download.hidden = false;
          }
          if (resultSummary) {
            resultSummary.textContent = `${width} × ${height} · ${formatBytes(blob.size)}`;
          }

          result.hidden = false;
          status.textContent = '완료했습니다. 아래에서 내려받으세요.';
          result.focus({ preventScroll: false });
        } catch (cause) {
          console.error(cause);
          showError('자르는 중 문제가 발생했습니다. 크기를 줄여 다시 시도하세요.');
          status.textContent = '';
        } finally {
          applyButton.disabled = false;
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
    if (state?.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state?.bitmap.close();
    state = null;
    clearResult();
    panel.hidden = true;
    status.textContent = '';
    showError('');
  });

  window.addEventListener('resize', layout);

  window.addEventListener('pagehide', () => {
    if (state?.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state?.bitmap.close();
    state = null;
    clearResult();
  });
}
