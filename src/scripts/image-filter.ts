import { displayScale } from '@/lib/crop';
import { doWork } from '@/lib/do-work';
import { formatBytes, MAX_TOTAL_BYTES, safeFileName } from '@/lib/files';
import {
  clampFilters,
  DEFAULT_FILTERS,
  type FilterValues,
  filterCss,
  isDefaultFilters,
} from '@/lib/image-filter';

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

export function initImageFilter(): void {
  const input = byId<HTMLInputElement>('if-input');
  const drop = byId<HTMLElement>('if-drop');
  const panel = byId<HTMLElement>('if-panel');
  const canvas = byId<HTMLCanvasElement>('if-canvas');
  const wrap = byId<HTMLElement>('if-preview-wrap');
  const applyButton = byId<HTMLButtonElement>('if-apply');
  const resetFiltersButton = byId<HTMLButtonElement>('if-reset-filters');
  const resetFileButton = byId<HTMLButtonElement>('if-reset');
  const format = byId<HTMLSelectElement>('if-format');
  const quality = byId<HTMLInputElement>('if-quality');
  const qualityValue = byId<HTMLElement>('if-quality-value');
  const status = byId<HTMLElement>('if-status');
  const error = byId<HTMLElement>('if-error');
  const result = byId<HTMLElement>('if-result');
  const resultImage = byId<HTMLImageElement>('if-result-image');
  const resultSummary = byId<HTMLElement>('if-result-summary');
  const download = byId<HTMLAnchorElement>('if-download');

  const controls: Array<{
    key: keyof FilterValues;
    input: HTMLInputElement | null;
    value: HTMLElement | null;
    suffix: string;
  }> = [
    {
      key: 'brightness',
      input: byId('if-brightness'),
      value: byId('if-brightness-value'),
      suffix: '%',
    },
    { key: 'contrast', input: byId('if-contrast'), value: byId('if-contrast-value'), suffix: '%' },
    {
      key: 'saturation',
      input: byId('if-saturation'),
      value: byId('if-saturation-value'),
      suffix: '%',
    },
    {
      key: 'grayscale',
      input: byId('if-grayscale'),
      value: byId('if-grayscale-value'),
      suffix: '%',
    },
    { key: 'sepia', input: byId('if-sepia'), value: byId('if-sepia-value'), suffix: '%' },
    { key: 'blur', input: byId('if-blur'), value: byId('if-blur-value'), suffix: 'px' },
  ];

  if (
    !input ||
    !drop ||
    !panel ||
    !canvas ||
    !wrap ||
    !applyButton ||
    !status ||
    !error ||
    !result
  ) {
    return;
  }

  const values = (): FilterValues =>
    clampFilters(
      Object.fromEntries(
        controls.map((control) => [control.key, Number(control.input?.value ?? 0)]),
      ),
    );

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

  const syncLabels = () => {
    for (const control of controls) {
      if (control.value)
        control.value.textContent = `${control.input?.value ?? 0}${control.suffix}`;
    }
    if (qualityValue)
      qualityValue.textContent = `${Math.round(Number(quality?.value ?? 0.92) * 100)}%`;
  };

  const renderPreview = () => {
    if (!state) return;
    const size = {
      width: Math.round(state.bitmap.width * state.previewScale),
      height: Math.round(state.bitmap.height * state.previewScale),
    };
    canvas.width = Math.max(1, size.width);
    canvas.height = Math.max(1, size.height);
    const context = canvas.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (format?.value === 'image/jpeg') {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.filter = filterCss(values(), state.previewScale);
    context.drawImage(state.bitmap, 0, 0, canvas.width, canvas.height);
    context.filter = 'none';
    applyButton.disabled = false;
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
      state = {
        file,
        bitmap,
        previewScale: displayScale(
          { width: bitmap.width, height: bitmap.height },
          { width: 760, height: 460 },
        ),
      };
      panel.hidden = false;
      renderPreview();
      const available = Math.max(280, wrap.clientWidth - 24);
      canvas.style.width = `${Math.min(available, canvas.width)}px`;
      canvas.style.height = 'auto';
      status.textContent = '필터를 조정한 뒤 저장하세요.';
    } catch (cause) {
      console.error(cause);
      state = null;
      panel.hidden = true;
      showError('이미지를 불러오지 못했습니다. HEIC는 JPG로 변환한 뒤 사용하세요.');
      status.textContent = '';
    }
  };

  for (const control of controls) {
    control.input?.addEventListener('input', () => {
      syncLabels();
      clearResult();
      renderPreview();
    });
  }

  format?.addEventListener('change', () => {
    clearResult();
    renderPreview();
  });
  quality?.addEventListener('input', syncLabels);

  resetFiltersButton?.addEventListener('click', () => {
    for (const control of controls) {
      if (control.input) control.input.value = String(DEFAULT_FILTERS[control.key]);
    }
    clearResult();
    syncLabels();
    renderPreview();
  });

  applyButton.addEventListener(
    'click',
    () =>
      void doWork(applyButton, async () => {
        if (!state) return;
        const filters = values();
        if (isDefaultFilters(filters)) {
          showError(
            '필터를 하나 이상 조정하세요. 필터 없이 저장하려면 이미지 압축 도구를 사용하세요.',
          );
          return;
        }
        clearResult();
        showError('');
        applyButton.disabled = true;
        applyButton.setAttribute('aria-busy', 'true');
        status.textContent = '필터를 적용하는 중…';

        try {
          const output = document.createElement('canvas');
          output.width = state.bitmap.width;
          output.height = state.bitmap.height;
          const context = output.getContext('2d');
          if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
          const mime = format?.value ?? 'image/jpeg';
          if (mime === 'image/jpeg') {
            context.fillStyle = '#ffffff';
            context.fillRect(0, 0, output.width, output.height);
          }
          context.filter = filterCss(filters);
          context.drawImage(state.bitmap, 0, 0);
          context.filter = 'none';

          const blob = await canvasToBlob(
            output,
            mime,
            mime === 'image/png' ? undefined : Number(quality?.value ?? 0.92),
          );
          state.resultUrl = URL.createObjectURL(blob);
          if (resultImage) {
            resultImage.src = state.resultUrl;
            resultImage.alt = '필터를 적용한 이미지 미리보기';
          }
          if (download) {
            const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
            const base = safeFileName(state.file.name.replace(/\.[^.]+$/, '')) || 'image';
            download.href = state.resultUrl;
            download.download = `${base}-filtered.${extension}`;
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
          showError('필터를 적용하지 못했습니다. 더 작은 이미지로 시도하세요.');
          status.textContent = '';
        } finally {
          applyButton.disabled = false;
          applyButton.removeAttribute('aria-busy');
        }
      }),
  );

  resetFileButton?.addEventListener('click', () => {
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
