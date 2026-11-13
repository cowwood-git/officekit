import { displayScale } from '@/lib/crop';
import { doWork } from '@/lib/do-work';
import { formatBytes, MAX_TOTAL_BYTES, safeFileName } from '@/lib/files';
import { type MergeMode, mergeLayout } from '@/lib/image-merge';

interface Entry {
  file: File;
  bitmap: ImageBitmap;
}

const MAX_IMAGES = 9;
const MAX_EXPORT = 10_000;

let entries: Entry[] = [];
let resultUrl: string | null = null;

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

export function initImageMerge(): void {
  const input = byId<HTMLInputElement>('im-input');
  const drop = byId<HTMLElement>('im-drop');
  const panel = byId<HTMLElement>('im-panel');
  const list = byId<HTMLUListElement>('im-list');
  const canvas = byId<HTMLCanvasElement>('im-canvas');
  const modeSelect = byId<HTMLSelectElement>('im-mode');
  const gapRange = byId<HTMLInputElement>('im-gap');
  const gapValue = byId<HTMLElement>('im-gap-value');
  const backgroundInput = byId<HTMLInputElement>('im-background');
  const formatSelect = byId<HTMLSelectElement>('im-format');
  const qualityRange = byId<HTMLInputElement>('im-quality');
  const qualityValue = byId<HTMLElement>('im-quality-value');
  const applyButton = byId<HTMLButtonElement>('im-apply');
  const clearButton = byId<HTMLButtonElement>('im-clear');
  const status = byId<HTMLElement>('im-status');
  const error = byId<HTMLElement>('im-error');
  const info = byId<HTMLElement>('im-info');
  const result = byId<HTMLElement>('im-result');
  const resultImage = byId<HTMLImageElement>('im-result-image');
  const resultSummary = byId<HTMLElement>('im-result-summary');
  const download = byId<HTMLAnchorElement>('im-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !list ||
    !canvas ||
    !modeSelect ||
    !gapRange ||
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

  const layout = () => {
    const mode = (modeSelect.value as MergeMode) ?? 'horizontal';
    return mergeLayout(
      entries.map((entry) => ({ width: entry.bitmap.width, height: entry.bitmap.height })),
      mode,
      Number(gapRange.value) || 0,
    );
  };

  const renderPreview = () => {
    if (entries.length === 0) return;
    const plan = layout();
    if (plan.width === 0 || plan.height === 0) return;
    const scale = displayScale(
      { width: plan.width, height: plan.height },
      { width: 760, height: 480 },
    );
    canvas.width = Math.max(1, Math.round(plan.width * scale));
    canvas.height = Math.max(1, Math.round(plan.height * scale));
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (formatSelect?.value === 'image/jpeg') {
      context.fillStyle = backgroundInput?.value || '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    entries.forEach((entry, index) => {
      const placement = plan.placements[index];
      if (!placement) return;
      context.drawImage(
        entry.bitmap,
        placement.x * scale,
        placement.y * scale,
        placement.width * scale,
        placement.height * scale,
      );
    });
    if (info) {
      info.textContent = `${entries.length}장 · ${Math.round(plan.width)} × ${Math.round(plan.height)}px`;
    }
    applyButton.disabled = entries.length < 2;
  };

  const renderList = () => {
    list.replaceChildren();
    entries.forEach((entry, index) => {
      const item = document.createElement('li');
      const name = document.createElement('span');
      name.textContent = `${entry.file.name} (${entry.bitmap.width}×${entry.bitmap.height})`;
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'im-remove';
      remove.textContent = '빼기';
      remove.setAttribute('aria-label', `${entry.file.name} 빼기`);
      remove.addEventListener('click', () => {
        entry.bitmap.close();
        entries.splice(index, 1);
        clearResult();
        renderList();
        renderPreview();
        if (entries.length === 0) {
          panel.hidden = true;
          status.textContent = '';
        }
      });
      item.append(name, remove);
      list.append(item);
    });
  };

  const acceptFiles = async (files: File[]) => {
    showError('');
    clearResult();
    if (files.length === 0) return;
    if (files.length > MAX_IMAGES) {
      showError(`한 번에 최대 ${MAX_IMAGES}장까지 합칠 수 있습니다.`);
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
      status.textContent = '순서와 간격을 확인한 뒤 저장하세요.';
    } catch (cause) {
      console.error(cause);
      for (const entry of entries) entry.bitmap.close();
      entries = [];
      panel.hidden = true;
      showError('이미지를 불러오지 못했습니다. HEIC는 JPG로 변환한 뒤 사용하세요.');
      status.textContent = '';
    }
  };

  for (const control of [modeSelect, gapRange, formatSelect, backgroundInput]) {
    control?.addEventListener('input', () => {
      if (gapValue) gapValue.textContent = `${gapRange.value}px`;
      clearResult();
      renderPreview();
    });
    control?.addEventListener('change', () => {
      clearResult();
      renderPreview();
    });
  }

  qualityRange?.addEventListener('input', () => {
    if (qualityValue) qualityValue.textContent = `${Math.round(Number(qualityRange.value) * 100)}%`;
  });

  applyButton.addEventListener(
    'click',
    () =>
      void doWork(applyButton, async () => {
        if (entries.length < 2) return;
        const plan = layout();
        if (plan.width <= 0 || plan.height <= 0) return;
        clearResult();
        showError('');
        applyButton.disabled = true;
        applyButton.setAttribute('aria-busy', 'true');
        status.textContent = '합치는 중…';

        try {
          const scale = Math.min(1, MAX_EXPORT / Math.max(plan.width, plan.height));
          const output = document.createElement('canvas');
          output.width = Math.max(1, Math.round(plan.width * scale));
          output.height = Math.max(1, Math.round(plan.height * scale));
          const context = output.getContext('2d');
          if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
          if (formatSelect?.value === 'image/jpeg') {
            context.fillStyle = backgroundInput?.value || '#ffffff';
            context.fillRect(0, 0, output.width, output.height);
          }
          entries.forEach((entry, index) => {
            const placement = plan.placements[index];
            if (!placement) return;
            context.drawImage(
              entry.bitmap,
              placement.x * scale,
              placement.y * scale,
              placement.width * scale,
              placement.height * scale,
            );
          });

          const mime = formatSelect?.value ?? 'image/jpeg';
          const blob = await canvasToBlob(
            output,
            mime,
            mime === 'image/png' ? undefined : Number(qualityRange?.value ?? 0.92),
          );
          resultUrl = URL.createObjectURL(blob);
          if (resultImage) {
            resultImage.src = resultUrl;
            resultImage.alt = '합친 이미지 미리보기';
          }
          if (download) {
            const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
            const base = safeFileName(entries[0]?.file.name.replace(/\.[^.]+$/, '') ?? 'image');
            download.href = resultUrl;
            download.download = `${base}-merged.${extension}`;
            download.textContent = `결과 내려받기 (${formatBytes(blob.size)})`;
            download.hidden = false;
          }
          if (resultSummary) {
            resultSummary.textContent = `${output.width} × ${output.height}px · ${formatBytes(blob.size)}${
              scale < 1 ? ' · 10000px로 축소' : ''
            }`;
          }
          result.hidden = false;
          status.textContent = '완료했습니다. 아래에서 내려받으세요.';
          result.focus({ preventScroll: false });
        } catch (cause) {
          console.error(cause);
          showError('이미지를 합치지 못했습니다. 더 작은 이미지로 다시 시도하세요.');
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

  if (gapValue) gapValue.textContent = `${gapRange.value}px`;
  if (qualityValue) {
    qualityValue.textContent = `${Math.round(Number(qualityRange?.value ?? 0.92) * 100)}%`;
  }
}
