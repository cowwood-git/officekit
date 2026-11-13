import { doWork } from '@/lib/do-work';
import { formatBytes, MAX_TOTAL_BYTES, safeFileName } from '@/lib/files';
import {
  COLLAGE_RATIOS,
  type CollageMode,
  type CollageRatio,
  collageFileName,
  collageLayout,
  coverCrop,
} from '@/lib/image-collage';
import { roundedRectPath } from '@/lib/image-frame';

interface Entry {
  file: File;
  bitmap: ImageBitmap;
}

const MAX_IMAGES = 9;

let entries: Entry[] = [];
let previewScale = 1;
let resultUrl: string | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('콜라주를 만들지 못했습니다.'));
      },
      type,
      quality,
    );
  });
}

export function initImageCollage(): void {
  const input = byId<HTMLInputElement>('ic-input');
  const drop = byId<HTMLElement>('ic-drop');
  const panel = byId<HTMLElement>('ic-panel');
  const list = byId<HTMLUListElement>('ic-list');
  const canvas = byId<HTMLCanvasElement>('ic-canvas');
  const modeSelect = byId<HTMLSelectElement>('ic-mode');
  const ratioSelect = byId<HTMLSelectElement>('ic-ratio');
  const fitSelect = byId<HTMLSelectElement>('ic-fit');
  const gapRange = byId<HTMLInputElement>('ic-gap');
  const gapValue = byId<HTMLElement>('ic-gap-value');
  const marginRange = byId<HTMLInputElement>('ic-margin');
  const marginValue = byId<HTMLElement>('ic-margin-value');
  const radiusRange = byId<HTMLInputElement>('ic-radius');
  const radiusValue = byId<HTMLElement>('ic-radius-value');
  const background = byId<HTMLInputElement>('ic-background');
  const format = byId<HTMLSelectElement>('ic-format');
  const quality = byId<HTMLInputElement>('ic-quality');
  const qualityValue = byId<HTMLElement>('ic-quality-value');
  const info = byId<HTMLElement>('ic-info');
  const applyButton = byId<HTMLButtonElement>('ic-apply');
  const clearButton = byId<HTMLButtonElement>('ic-clear');
  const status = byId<HTMLElement>('ic-status');
  const error = byId<HTMLElement>('ic-error');
  const result = byId<HTMLElement>('ic-result');
  const resultImage = byId<HTMLImageElement>('ic-result-image');
  const resultSummary = byId<HTMLElement>('ic-result-summary');
  const download = byId<HTMLAnchorElement>('ic-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !list ||
    !canvas ||
    !modeSelect ||
    !ratioSelect ||
    !fitSelect ||
    !gapRange ||
    !marginRange ||
    !radiusRange ||
    !background ||
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
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      resultUrl = null;
    }
    result.hidden = true;
    if (resultImage) resultImage.removeAttribute('src');
    download?.removeAttribute('href');
    if (download) download.hidden = true;
  };

  const dimensions = () => {
    const ratio = COLLAGE_RATIOS[(ratioSelect.value as CollageRatio) ?? 'square'];
    return { width: ratio.width, height: ratio.height };
  };

  const layout = () => {
    const { width, height } = dimensions();
    return collageLayout(
      entries.map((entry) => entry.bitmap.width / entry.bitmap.height),
      {
        width,
        height,
        gap: Number(gapRange.value) || 0,
        margin: Number(marginRange.value) || 0,
        mode: (modeSelect.value as CollageMode) ?? 'justified',
      },
    );
  };

  const drawCollage = (target: HTMLCanvasElement, scale: number) => {
    const { width, height } = dimensions();
    target.width = Math.max(1, Math.round(width * scale));
    target.height = Math.max(1, Math.round(height * scale));
    const context = target.getContext('2d');
    if (!context) return;
    context.fillStyle = background.value || '#ffffff';
    context.fillRect(0, 0, target.width, target.height);

    const rects = layout();
    const radius = (Number(radiusRange.value) || 0) * scale;
    const cover = fitSelect.value !== 'contain';

    entries.forEach((entry, index) => {
      const rect = rects[index];
      if (!rect) return;
      const x = rect.x * scale;
      const y = rect.y * scale;
      const cellWidth = rect.width * scale;
      const cellHeight = rect.height * scale;
      context.save();
      if (radius > 0) {
        roundedRectPath(context, x, y, cellWidth, cellHeight, radius);
        context.clip();
      }

      if (cover) {
        const crop = coverCrop(entry.bitmap.width, entry.bitmap.height, cellWidth, cellHeight);
        context.drawImage(
          entry.bitmap,
          crop.x,
          crop.y,
          crop.width,
          crop.height,
          x,
          y,
          cellWidth,
          cellHeight,
        );
      } else {
        const imageAspect = entry.bitmap.width / entry.bitmap.height;
        const cellAspect = cellWidth / cellHeight;
        const drawWidth = imageAspect > cellAspect ? cellWidth : cellHeight * imageAspect;
        const drawHeight = imageAspect > cellAspect ? cellWidth / imageAspect : cellHeight;
        context.drawImage(
          entry.bitmap,
          x + (cellWidth - drawWidth) / 2,
          y + (cellHeight - drawHeight) / 2,
          drawWidth,
          drawHeight,
        );
      }
      context.restore();
    });

    if (info) {
      info.textContent = `${entries.length}장 · ${width} × ${height}px · ${modeSelect.selectedOptions[0]?.textContent ?? ''}`;
    }
  };

  const renderPreview = () => {
    if (entries.length === 0) return;
    const { width, height } = dimensions();
    previewScale = Math.min(1, 760 / width, 480 / height);
    drawCollage(canvas, previewScale);
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = 'auto';
    applyButton.disabled = entries.length < 2;
  };

  const renderList = () => {
    list.replaceChildren();
    entries.forEach((entry, index) => {
      const item = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = `${index + 1}. ${entry.file.name}`;

      const actions = document.createElement('div');
      actions.className = 'ic-actions';
      const up = document.createElement('button');
      up.type = 'button';
      up.textContent = '↑';
      up.title = '앞으로';
      up.disabled = index === 0;
      up.addEventListener('click', () => {
        if (index === 0) return;
        const previous = entries[index - 1];
        const current = entries[index];
        if (previous && current) {
          entries[index - 1] = current;
          entries[index] = previous;
        }
        clearResult();
        renderList();
        renderPreview();
      });

      const down = document.createElement('button');
      down.type = 'button';
      down.textContent = '↓';
      down.title = '뒤로';
      down.disabled = index === entries.length - 1;
      down.addEventListener('click', () => {
        if (index === entries.length - 1) return;
        const current = entries[index];
        const next = entries[index + 1];
        if (current && next) {
          entries[index] = next;
          entries[index + 1] = current;
        }
        clearResult();
        renderList();
        renderPreview();
      });

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '빼기';
      remove.addEventListener('click', () => {
        entry.bitmap.close();
        entries.splice(index, 1);
        clearResult();
        renderList();
        if (entries.length === 0) {
          panel.hidden = true;
          status.textContent = '';
        } else {
          renderPreview();
        }
      });
      actions.append(up, down, remove);
      item.append(name, actions);
      list.append(item);
    });
  };

  const syncLabels = () => {
    if (gapValue) gapValue.textContent = `${gapRange.value}px`;
    if (marginValue) marginValue.textContent = `${marginRange.value}px`;
    if (radiusValue) radiusValue.textContent = `${radiusRange.value}px`;
    if (qualityValue)
      qualityValue.textContent = `${Math.round(Number(quality?.value ?? 0.92) * 100)}%`;
  };

  const acceptFiles = async (files: File[]) => {
    showError('');
    clearResult();
    if (files.length > MAX_IMAGES) {
      showError(`한 번에 최대 ${MAX_IMAGES}장까지 사용할 수 있습니다.`);
      return;
    }
    if (files.some((file) => !file.type.startsWith('image/'))) {
      showError('이미지 파일만 선택할 수 있습니다.');
      return;
    }
    const total = files.reduce((sum, file) => sum + file.size, 0);
    if (total > MAX_TOTAL_BYTES) {
      showError(`전체 용량이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다.`);
      return;
    }

    status.textContent = '이미지를 불러오는 중…';
    try {
      for (const entry of entries) entry.bitmap.close();
      entries = [];
      for (const file of files) {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        entries.push({ file, bitmap });
      }
      panel.hidden = false;
      renderList();
      renderPreview();
      status.textContent =
        entries.length < 2
          ? '이미지를 2장 이상 선택하세요.'
          : '배치와 비율을 확인한 뒤 저장하세요.';
    } catch (cause) {
      console.error(cause);
      for (const entry of entries) entry.bitmap.close();
      entries = [];
      panel.hidden = true;
      showError('이미지를 불러오지 못했습니다. HEIC는 JPG로 변환한 뒤 사용하세요.');
      status.textContent = '';
    }
  };

  for (const control of [
    modeSelect,
    ratioSelect,
    fitSelect,
    gapRange,
    marginRange,
    radiusRange,
    background,
    format,
    quality,
  ]) {
    control?.addEventListener('input', () => {
      clearResult();
      syncLabels();
      renderPreview();
    });
    control?.addEventListener('change', () => {
      clearResult();
      syncLabels();
      renderPreview();
    });
  }

  applyButton.addEventListener(
    'click',
    () =>
      void doWork(applyButton, async () => {
        if (entries.length < 2) return;
        clearResult();
        showError('');
        applyButton.disabled = true;
        applyButton.setAttribute('aria-busy', 'true');
        status.textContent = '콜라주를 만드는 중…';

        try {
          const output = document.createElement('canvas');
          drawCollage(output, 1);
          const mime = format?.value ?? 'image/png';
          const blob = await canvasToBlob(
            output,
            mime,
            mime === 'image/png' ? undefined : Number(quality?.value ?? 0.92),
          );
          resultUrl = URL.createObjectURL(blob);
          if (resultImage) {
            resultImage.src = resultUrl;
            resultImage.alt = '콜라주 미리보기';
          }
          if (download) {
            const extension =
              mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
            const base = safeFileName(entries[0]?.file.name.replace(/\.[^.]+$/, '') ?? 'collage');
            download.href = resultUrl;
            download.download = collageFileName(`${base}.png`).replace(/\.png$/, `.${extension}`);
            download.textContent = `콜라주 내려받기 (${formatBytes(blob.size)})`;
            download.hidden = false;
          }
          if (resultSummary) {
            resultSummary.textContent = `${output.width} × ${output.height}px · ${formatBytes(blob.size)} · ${modeSelect.selectedOptions[0]?.textContent ?? ''}`;
          }
          result.hidden = false;
          status.textContent = '완료했습니다. 아래에서 내려받으세요.';
          result.focus({ preventScroll: false });
        } catch (cause) {
          console.error(cause);
          showError('콜라주를 만들지 못했습니다. 더 작은 이미지로 다시 시도하세요.');
          status.textContent = '';
        } finally {
          applyButton.disabled = entries.length < 2;
          applyButton.removeAttribute('aria-busy');
        }
      }),
  );

  clearButton?.addEventListener('click', () => {
    for (const entry of entries) entry.bitmap.close();
    entries = [];
    clearResult();
    list.replaceChildren();
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
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length > 0) void acceptFiles(files);
  });
  input.addEventListener('change', () => {
    const files = Array.from(input.files ?? []);
    if (files.length > 0) void acceptFiles(files);
    input.value = '';
  });

  window.addEventListener('pagehide', () => {
    for (const entry of entries) entry.bitmap.close();
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  });

  syncLabels();
}
