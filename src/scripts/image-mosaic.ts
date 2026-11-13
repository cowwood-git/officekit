import {
  clampRect,
  displayScale,
  type Handle,
  moveRect,
  type Rect,
  resizeRect,
  type Size,
} from '@/lib/crop';
import { doWork } from '@/lib/do-work';
import { formatBytes, MAX_TOTAL_BYTES, safeFileName } from '@/lib/files';
import { blurRadius, centeredRegion, exportScaleFor, mosaicBlock } from '@/lib/redact';

type Mode = 'mosaic' | 'blur' | 'black';

interface Region {
  id: string;
  rect: Rect;
}

interface State {
  file: File;
  bitmap: ImageBitmap;
  natural: Size;
  previewSize: Size;
  previewScale: number;
  stageScale: number;
  regions: Region[];
  selected: string | null;
  mode: Mode;
  strength: number;
  resultUrl?: string;
}

const PREVIEW_MAX = 1600;
const STAGE_MAX_HEIGHT = 440;
const EXPORT_MAX = 6000;

let state: State | null = null;
const tempCanvas = document.createElement('canvas');

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

function applyEffect(
  ctx: CanvasRenderingContext2D,
  source: ImageBitmap,
  rect: Rect,
  scale: number,
  mode: Mode,
  strength: number,
): void {
  const x = rect.x * scale;
  const y = rect.y * scale;
  const width = Math.max(1, rect.width * scale);
  const height = Math.max(1, rect.height * scale);

  if (mode === 'black') {
    ctx.fillStyle = '#000000';
    ctx.fillRect(x, y, width, height);
    return;
  }

  if (mode === 'mosaic') {
    const block = mosaicBlock(strength, scale);
    const columns = Math.max(1, Math.round(width / block));
    const rows = Math.max(1, Math.round(height / block));

    tempCanvas.width = columns;
    tempCanvas.height = rows;
    const temp = tempCanvas.getContext('2d');
    if (!temp) return;
    temp.imageSmoothingEnabled = true;
    temp.imageSmoothingQuality = 'high';
    temp.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, columns, rows);

    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.beginPath();
    ctx.rect(x, y, width, height);
    ctx.clip();
    ctx.drawImage(tempCanvas, 0, 0, columns, rows, x, y, width, height);
    ctx.restore();
    return;
  }

  // blur
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.filter = `blur(${blurRadius(strength, scale)}px)`;
  ctx.drawImage(
    source,
    0,
    0,
    source.width,
    source.height,
    0,
    0,
    source.width * scale,
    source.height * scale,
  );
  ctx.restore();
  ctx.filter = 'none';
}

export function initImageMosaic(): void {
  const input = byId<HTMLInputElement>('mosaic-input');
  const drop = byId<HTMLElement>('mosaic-drop');
  const panel = byId<HTMLElement>('mosaic-panel');
  const stage = byId<HTMLElement>('mosaic-stage');
  const canvas = byId<HTMLCanvasElement>('mosaic-canvas');
  const layer = byId<HTMLElement>('mosaic-layer');
  const modes = byId<HTMLElement>('mosaic-modes');
  const strength = byId<HTMLInputElement>('mosaic-strength');
  const strengthValue = byId<HTMLElement>('mosaic-strength-value');
  const addButton = byId<HTMLButtonElement>('region-add');
  const deleteButton = byId<HTMLButtonElement>('region-delete');
  const clearButton = byId<HTMLButtonElement>('region-clear');
  const format = byId<HTMLSelectElement>('mosaic-format');
  const quality = byId<HTMLInputElement>('mosaic-quality');
  const qualityValue = byId<HTMLElement>('mosaic-quality-value');
  const applyButton = byId<HTMLButtonElement>('mosaic-apply');
  const resetButton = byId<HTMLButtonElement>('mosaic-reset');
  const status = byId<HTMLElement>('mosaic-status');
  const error = byId<HTMLElement>('mosaic-error');
  const result = byId<HTMLElement>('mosaic-result');
  const resultImage = byId<HTMLImageElement>('mosaic-result-image');
  const resultSummary = byId<HTMLElement>('mosaic-result-summary');
  const download = byId<HTMLAnchorElement>('mosaic-download');
  const count = byId<HTMLElement>('region-count');

  if (
    !input ||
    !drop ||
    !panel ||
    !stage ||
    !canvas ||
    !layer ||
    !modes ||
    !strength ||
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

  const drawPreview = () => {
    if (!state) return;
    const { bitmap, natural, previewSize, previewScale, regions, mode, strength: power } = state;
    canvas.width = previewSize.width;
    canvas.height = previewSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(
      bitmap,
      0,
      0,
      natural.width,
      natural.height,
      0,
      0,
      previewSize.width,
      previewSize.height,
    );

    for (const region of regions) {
      applyEffect(ctx, bitmap, region.rect, previewScale, mode, power);
    }
  };

  const renderOverlay = () => {
    if (!state) return;
    layer.replaceChildren();
    const scale = state.previewScale * state.stageScale;

    for (const region of state.regions) {
      const element = document.createElement('div');
      element.className = `region${region.id === state.selected ? ' selected' : ''}`;
      element.dataset.regionId = region.id;
      element.style.left = `${region.rect.x * scale}px`;
      element.style.top = `${region.rect.y * scale}px`;
      element.style.width = `${region.rect.width * scale}px`;
      element.style.height = `${region.rect.height * scale}px`;

      if (region.id === state.selected) {
        for (const handle of ['nw', 'ne', 'sw', 'se'] as const) {
          const span = document.createElement('span');
          span.className = `region-handle ${handle}`;
          span.dataset.handle = handle;
          element.append(span);
        }
      }

      layer.append(element);
    }

    if (count) {
      count.textContent =
        state.regions.length === 0
          ? '가릴 영역을 추가하세요.'
          : `${state.regions.length}개 영역 · 선택한 영역을 드래그해 이동`;
    }
    if (deleteButton) deleteButton.disabled = !state.selected;
  };

  // 백그라운드 탭에서 rAF 가 멈추는 문제를 피하려고 동기 렌더링한다.
  const schedule = () => {
    drawPreview();
    renderOverlay();
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
    layer.style.width = `${width}px`;
    layer.style.height = `${height}px`;
    drawPreview();
    renderOverlay();
  };

  const toNatural = (clientX: number, clientY: number): { x: number; y: number } => {
    if (!state) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const total = state.previewScale * state.stageScale;
    return {
      x: Math.min(Math.max((clientX - rect.left) / total, 0), state.natural.width),
      y: Math.min(Math.max((clientY - rect.top) / total, 0), state.natural.height),
    };
  };

  const addRegion = () => {
    if (!state) return;
    const rect = centeredRegion(state.natural, 0.35);
    const region: Region = { id: crypto.randomUUID(), rect };
    state.regions.push(region);
    state.selected = region.id;
    clearResult();
    schedule();
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
      const previewSize = {
        width: Math.max(1, Math.round(bitmap.width * previewScale)),
        height: Math.max(1, Math.round(bitmap.height * previewScale)),
      };

      state = {
        file,
        bitmap,
        natural: { width: bitmap.width, height: bitmap.height },
        previewSize,
        previewScale,
        stageScale: 1,
        regions: [],
        selected: null,
        mode:
          (modes.querySelector('[aria-pressed="true"]')?.getAttribute('data-mode') as Mode) ??
          'mosaic',
        strength: Number(strength.value) || 20,
      };

      panel.hidden = false;
      layout();
      addRegion();
      status.textContent = '가릴 영역을 추가하고 위치를 조정하세요.';
    } catch (cause) {
      console.error(cause);
      showError('이미지를 불러오지 못했습니다. 다른 형식으로 다시 시도해 주세요.');
      status.textContent = '';
    }
  };

  // ── 영역 조작 ──────────────────────────────────────────────────────────
  let drag: {
    id: string;
    mode: 'move' | Handle;
    start: { x: number; y: number };
    rect: Rect;
  } | null = null;

  layer.addEventListener('pointerdown', (event) => {
    if (!state) return;
    const target = event.target as HTMLElement;
    const regionElement = target.closest<HTMLElement>('[data-region-id]');

    if (!regionElement) {
      state.selected = null;
      renderOverlay();
      return;
    }

    const id = regionElement.dataset.regionId;
    const region = state.regions.find((item) => item.id === id);
    if (!id || !region) return;

    state.selected = id;
    layer.focus({ preventScroll: true });
    const handle = target.dataset.handle as Handle | undefined;
    drag = {
      id,
      mode: handle ?? 'move',
      start: toNatural(event.clientX, event.clientY),
      rect: { ...region.rect },
    };

    try {
      layer.setPointerCapture(event.pointerId);
    } catch {
      // 합성 이벤트 환경 무시
    }
    event.preventDefault();
    schedule();
  });

  layer.addEventListener('pointermove', (event) => {
    if (!drag || !state) return;
    const point = toNatural(event.clientX, event.clientY);
    const region = state.regions.find((item) => item.id === drag?.id);
    if (!region) return;

    if (drag.mode === 'move') {
      region.rect = moveRect(
        drag.rect,
        point.x - drag.start.x,
        point.y - drag.start.y,
        state.natural,
      );
    } else {
      region.rect = resizeRect(drag.rect, drag.mode, point, state.natural);
    }

    clearResult();
    schedule();
  });

  const endDrag = (event: PointerEvent) => {
    if (!drag) return;
    drag = null;
    try {
      if (layer.hasPointerCapture(event.pointerId)) layer.releasePointerCapture(event.pointerId);
    } catch {
      // 무시
    }
  };
  layer.addEventListener('pointerup', endDrag);
  layer.addEventListener('pointercancel', endDrag);

  // 키보드: 방향키 이동, +/- 크기, Delete 삭제
  layer.addEventListener('keydown', (event) => {
    if (!state?.selected) return;
    const region = state.regions.find((item) => item.id === state?.selected);
    if (!region) return;

    const step = event.shiftKey ? 10 : 2;
    let next: Rect | null = null;

    if (event.key === 'ArrowLeft') next = moveRect(region.rect, -step, 0, state.natural);
    else if (event.key === 'ArrowRight') next = moveRect(region.rect, step, 0, state.natural);
    else if (event.key === 'ArrowUp') next = moveRect(region.rect, 0, -step, state.natural);
    else if (event.key === 'ArrowDown') next = moveRect(region.rect, 0, step, state.natural);
    else if (event.key === '+' || event.key === '=' || event.key === 'Add') {
      next = clampRect(
        {
          x: region.rect.x - step,
          y: region.rect.y - step,
          width: region.rect.width + step * 2,
          height: region.rect.height + step * 2,
        },
        state.natural,
      );
    } else if (event.key === '-' || event.key === 'Subtract') {
      next = clampRect(
        {
          x: region.rect.x + step,
          y: region.rect.y + step,
          width: region.rect.width - step * 2,
          height: region.rect.height - step * 2,
        },
        state.natural,
      );
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      state.regions = state.regions.filter((item) => item.id !== state?.selected);
      state.selected = null;
      clearResult();
      schedule();
      return;
    } else {
      return;
    }

    if (next) {
      event.preventDefault();
      region.rect = next;
      clearResult();
      schedule();
    }
  });

  // ── 모드·강도 ──────────────────────────────────────────────────────────
  modes.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const mode = target.dataset.mode as Mode | undefined;
    if (!mode || !state) return;
    state.mode = mode;
    modes.querySelectorAll('button').forEach((button) => {
      button.setAttribute('aria-pressed', button === target ? 'true' : 'false');
    });
    clearResult();
    schedule();
  });

  strength.addEventListener('input', () => {
    if (strengthValue) strengthValue.textContent = strength.value;
    if (!state) return;
    state.strength = Number(strength.value) || 20;
    clearResult();
    schedule();
  });

  addButton?.addEventListener('click', addRegion);

  deleteButton?.addEventListener('click', () => {
    if (!state?.selected) return;
    state.regions = state.regions.filter((region) => region.id !== state?.selected);
    state.selected = null;
    clearResult();
    schedule();
  });

  clearButton?.addEventListener('click', () => {
    if (!state) return;
    state.regions = [];
    state.selected = null;
    clearResult();
    schedule();
  });

  quality?.addEventListener('input', () => {
    if (qualityValue) qualityValue.textContent = `${Math.round(Number(quality.value) * 100)}%`;
  });

  // ── 내보내기 ───────────────────────────────────────────────────────────
  applyButton.addEventListener(
    'click',
    () =>
      void doWork(applyButton, async () => {
        if (!state) return;
        if (state.regions.length === 0) {
          showError('가릴 영역을 하나 이상 추가하세요.');
          return;
        }

        showError('');
        clearResult();
        applyButton.disabled = true;
        applyButton.setAttribute('aria-busy', 'true');
        status.textContent = '가리는 중…';

        try {
          const scale = exportScaleFor(state.natural, EXPORT_MAX);
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
          for (const region of state.regions) {
            applyEffect(ctx, state.bitmap, region.rect, scale, state.mode, state.strength);
          }

          const mime = format?.value ?? 'image/jpeg';
          const blob = await canvasToBlob(
            output,
            mime,
            mime === 'image/png' ? undefined : Number(quality?.value ?? 0.92),
          );
          state.resultUrl = URL.createObjectURL(blob);

          if (resultImage) {
            resultImage.src = state.resultUrl;
            resultImage.alt = '가리기 결과 미리보기';
          }
          if (download) {
            const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
            const base = safeFileName(state.file.name.replace(/\.[^.]+$/, '')) || 'image';
            download.href = state.resultUrl;
            download.download = `${base}-redacted.${extension}`;
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
          showError('가리는 중 문제가 발생했습니다. 이미지 크기를 줄여 다시 시도하세요.');
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
    state?.bitmap.close();
    state = null;
    clearResult();
    panel.hidden = true;
    status.textContent = '';
    showError('');
  });

  window.addEventListener('resize', layout);

  window.addEventListener('pagehide', () => {
    state?.bitmap.close();
    state = null;
    clearResult();
  });
}
