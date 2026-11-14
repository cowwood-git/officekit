import { doWork } from '@/lib/do-work';
import { formatBytes } from '@/lib/files';
import {
  clampOffset,
  idPhotoFileName,
  mmToPx,
  type PhotoPreset,
  placement,
  presetById,
  SHEET_MM,
  sheetLayout,
  type View,
} from '@/lib/id-photo';
import { setDpi } from '@/lib/image-dpi';
import { heicAsReadable } from './heic-file';
import { removeBackgroundInWorker, toModelInput } from './remove-bg-client';

/** 증명사진 — 규격 틀에 맞춰 옮기고 키운 뒤 300dpi JPG(한 장 또는 4×6 인화지)로 저장. */
function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

const PREVIEW_HEIGHT = 360;

function toBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('저장 실패'))),
      'image/jpeg',
      0.95,
    );
  });
}

export function initIdPhoto(): void {
  const input = byId<HTMLInputElement>('ip-input');
  const drop = byId<HTMLElement>('ip-drop');
  const panel = byId<HTMLElement>('ip-panel');
  const error = byId<HTMLElement>('ip-error');
  const status = byId<HTMLElement>('ip-status');
  const preview = byId<HTMLCanvasElement>('ip-preview');
  const presetSelect = byId<HTMLSelectElement>('ip-preset');
  const presetNote = byId<HTMLElement>('ip-preset-note');
  const zoom = byId<HTMLInputElement>('ip-zoom');
  const background = byId<HTMLInputElement>('ip-bg');
  const cutoutToggle = byId<HTMLInputElement>('ip-cutout');
  const guide = byId<HTMLInputElement>('ip-guide');
  const layout = byId<HTMLSelectElement>('ip-layout');
  const apply = byId<HTMLButtonElement>('ip-apply');
  const reset = byId<HTMLButtonElement>('ip-reset');
  const result = byId<HTMLElement>('ip-result');
  const resultImage = byId<HTMLImageElement>('ip-result-image');
  const resultNote = byId<HTMLElement>('ip-result-note');
  const download = byId<HTMLAnchorElement>('ip-download');
  if (!input || !drop || !panel || !preview || !apply || !error || !status) return;

  /** 지금 그리는 사진 — 원본 또는 배경을 지운 사진 */
  let image: ImageBitmap | null = null;
  let original: ImageBitmap | null = null;
  let cutout: ImageBitmap | null = null;
  let fileName = 'photo';
  let view: View = { zoom: 1, offsetX: 0, offsetY: 0 };
  let resultUrl: string | null = null;

  const preset = (): PhotoPreset => presetById(presetSelect?.value ?? 'half');
  const bg = () => background?.value || '#ffffff';

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const closePhotos = () => {
    original?.close();
    cutout?.close();
    original = null;
    cutout = null;
    image = null;
    if (cutoutToggle) cutoutToggle.checked = false;
  };

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    if (result) result.hidden = true;
  };

  const drawPhoto = (
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
  ) => {
    if (!image) return;
    context.save();
    context.beginPath();
    context.rect(x, y, w, h);
    context.clip();
    context.fillStyle = bg();
    context.fillRect(x, y, w, h);
    const place = placement(image.width, image.height, w, h, view);
    context.imageSmoothingQuality = 'high';
    context.drawImage(image, x + place.x, y + place.y, place.width, place.height);
    context.restore();
  };

  const render = () => {
    if (!image) return;
    const current = preset();
    const height = PREVIEW_HEIGHT;
    const width = Math.round((height * current.widthMm) / current.heightMm);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    preview.width = width * ratio;
    preview.height = height * ratio;
    preview.style.width = `${width}px`;
    preview.style.aspectRatio = `${width} / ${height}`;
    const context = preview.getContext('2d');
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawPhoto(context, 0, 0, width, height);
    if (guide?.checked) {
      // 얼굴 위치 안내: 머리 꼭대기~턱이 사진 높이의 약 70%, 눈은 위에서 약 45%
      context.strokeStyle = 'rgba(0, 150, 170, 0.9)';
      context.lineWidth = 1.5;
      context.setLineDash([5, 4]);
      context.beginPath();
      context.ellipse(width / 2, height * 0.46, width * 0.3, height * 0.34, 0, 0, Math.PI * 2);
      context.stroke();
      context.beginPath();
      context.moveTo(width * 0.12, height * 0.42);
      context.lineTo(width * 0.88, height * 0.42);
      context.stroke();
      context.setLineDash([]);
    }
  };

  const setView = (next: View) => {
    if (!image) return;
    const current = preset();
    view = clampOffset(image.width, image.height, current.widthMm, current.heightMm, next);
    clearResult();
    render();
  };

  const select = async (file: File) => {
    showError('');
    clearResult();
    if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
      showError('사진 파일(JPG·PNG·WebP·HEIC)을 넣어 주세요.');
      return;
    }
    try {
      status.textContent = '사진을 여는 중…';
      const readable = await heicAsReadable(file);
      closePhotos();
      original = await createImageBitmap(readable, { imageOrientation: 'from-image' });
      image = original;
      fileName = file.name;
      view = { zoom: 1, offsetX: 0, offsetY: 0 };
      if (zoom) zoom.value = '1';
      drop.hidden = true;
      panel.hidden = false;
      status.textContent = '사진을 끌어서 위치를, 슬라이더로 크기를 맞추세요.';
      render();
    } catch (cause) {
      console.error(cause);
      status.textContent = '';
      showError('사진을 열 수 없습니다. 다른 파일로 시도하세요.');
    }
  };

  const run = async () => {
    if (!image) return;
    showError('');
    clearResult();
    const current = preset();
    const photoW = mmToPx(current.widthMm);
    const photoH = mmToPx(current.heightMm);
    const sheet = layout?.value === 'sheet';
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) return;
    let count = 1;
    if (sheet) {
      canvas.width = mmToPx(SHEET_MM.width);
      canvas.height = mmToPx(SHEET_MM.height);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      const { positions } = sheetLayout({ width: current.widthMm, height: current.heightMm });
      count = positions.length;
      for (const position of positions) {
        const x = mmToPx(position.x);
        const y = mmToPx(position.y);
        drawPhoto(context, x, y, photoW, photoH);
        context.strokeStyle = '#d0d0d0';
        context.lineWidth = 1;
        context.strokeRect(x - 0.5, y - 0.5, photoW + 1, photoH + 1);
      }
    } else {
      canvas.width = photoW;
      canvas.height = photoH;
      drawPhoto(context, 0, 0, photoW, photoH);
    }
    const blob = await toBlob(canvas);
    const bytes = setDpi(new Uint8Array(await blob.arrayBuffer()), 300);
    const out = new Blob([new Uint8Array(bytes)], { type: 'image/jpeg' });
    resultUrl = URL.createObjectURL(out);
    if (resultImage) resultImage.src = resultUrl;
    if (download) {
      download.href = resultUrl;
      download.download = idPhotoFileName(fileName, current, sheet);
      download.textContent = `JPG 내려받기 (${formatBytes(out.size)})`;
    }
    if (resultNote) {
      resultNote.textContent = sheet
        ? `4×6인치(10×15cm) 인화지에 ${current.label} ${count}장 · ${canvas.width}×${canvas.height}px · 300dpi. 사진관·편의점 인화기에서 4×6(4R)으로 뽑으세요.`
        : `${current.label} · ${photoW}×${photoH}px · 300dpi`;
    }
    if (result) result.hidden = false;
  };

  // 끌어서 옮기기
  let drag: { x: number; y: number; view: View } | null = null;
  preview.addEventListener('pointerdown', (event) => {
    if (!image) return;
    drag = { x: event.clientX, y: event.clientY, view };
    preview.setPointerCapture(event.pointerId);
  });
  preview.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const rect = preview.getBoundingClientRect();
    setView({
      zoom: view.zoom,
      offsetX: drag.view.offsetX + (event.clientX - drag.x) / rect.width,
      offsetY: drag.view.offsetY + (event.clientY - drag.y) / rect.height,
    });
  });
  const endDrag = () => {
    drag = null;
  };
  preview.addEventListener('pointerup', endDrag);
  preview.addEventListener('pointercancel', endDrag);
  preview.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 0.05 : 0.01;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    setView({ zoom: view.zoom, offsetX: view.offsetX + move[0], offsetY: view.offsetY + move[1] });
  });
  preview.addEventListener(
    'wheel',
    (event) => {
      if (!image || !zoom) return;
      event.preventDefault();
      const next = Math.min(3, Math.max(0.5, view.zoom * (event.deltaY < 0 ? 1.05 : 0.95)));
      zoom.value = String(next);
      setView({ ...view, zoom: next });
    },
    { passive: false },
  );

  zoom?.addEventListener('input', () => setView({ ...view, zoom: Number(zoom.value) }));
  presetSelect?.addEventListener('change', () => {
    if (presetNote) presetNote.textContent = preset().note;
    setView(view);
  });
  for (const control of [background, guide]) control?.addEventListener('input', render);
  layout?.addEventListener('change', clearResult);
  background?.addEventListener('input', clearResult);
  for (const swatch of document.querySelectorAll<HTMLButtonElement>('[data-ip-bg]')) {
    swatch.addEventListener('click', () => {
      if (!background) return;
      background.value = swatch.dataset.ipBg ?? '#ffffff';
      clearResult();
      render();
    });
  }

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void select(file);
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
    const file = event.dataTransfer?.files[0];
    if (file) void select(file);
  });
  // 원래 배경 지우기 — 지운 자리에 배경색이 보인다. 결과는 사진마다 한 번만 만든다.
  cutoutToggle?.addEventListener('change', async () => {
    if (!original) return;
    clearResult();
    showError('');
    if (cutoutToggle.checked && !cutout) {
      const target = original;
      cutoutToggle.disabled = true;
      apply.disabled = true;
      status.textContent = '원래 배경을 지우는 중…';
      try {
        const output = await removeBackgroundInWorker(await toModelInput(target), (done, total) => {
          status.textContent = `처음 한 번 AI 모델을 받는 중… ${Math.round(done / 1e6)}/${Math.round(total / 1e6)}MB`;
        });
        const bitmap = await createImageBitmap(output.image, {
          resizeWidth: target.width,
          resizeHeight: target.height,
          resizeQuality: 'high',
        });
        // 처리 중에 다른 사진으로 바뀌었으면 버린다.
        if (target !== original) {
          bitmap.close();
          return;
        }
        cutout = bitmap;
        status.textContent = '배경을 지웠습니다. 배경색을 고르세요.';
      } catch (cause) {
        console.error(cause);
        cutoutToggle.checked = false;
        status.textContent = '';
        showError(
          '배경을 지우지 못했습니다. 다른 브라우저로 다시 시도하거나 단색 벽 앞에서 찍은 사진을 쓰세요.',
        );
        return;
      } finally {
        cutoutToggle.disabled = false;
        apply.disabled = false;
      }
    }
    image = cutoutToggle.checked && cutout ? cutout : original;
    render();
  });

  apply.addEventListener('click', () => void doWork(apply, run));
  reset?.addEventListener('click', () => {
    clearResult();
    closePhotos();
    panel.hidden = true;
    drop.hidden = false;
    status.textContent = '';
    showError('');
  });

  window.addEventListener('pagehide', () => {
    closePhotos();
    clearResult();
  });
}
