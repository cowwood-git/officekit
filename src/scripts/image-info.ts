import { doWork } from '@/lib/do-work';
import { formatBytes, MAX_TOTAL_BYTES, safeFileName } from '@/lib/files';
import { exifFacts, exifMapUrl } from '@/lib/image-info';

interface State {
  file: File;
  bitmap: ImageBitmap;
  previewUrl: string;
  resultUrl?: string;
  exif: Record<string, unknown>;
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

export function initImageInfo(): void {
  const input = byId<HTMLInputElement>('ii-input');
  const drop = byId<HTMLElement>('ii-drop');
  const panel = byId<HTMLElement>('ii-panel');
  const preview = byId<HTMLImageElement>('ii-preview');
  const basics = byId<HTMLElement>('ii-basics');
  const exifList = byId<HTMLUListElement>('ii-exif');
  const exifNote = byId<HTMLElement>('ii-exif-note');
  const mapLink = byId<HTMLAnchorElement>('ii-map');
  const format = byId<HTMLSelectElement>('ii-format');
  const quality = byId<HTMLInputElement>('ii-quality');
  const qualityValue = byId<HTMLElement>('ii-quality-value');
  const applyButton = byId<HTMLButtonElement>('ii-apply');
  const resetButton = byId<HTMLButtonElement>('ii-reset');
  const status = byId<HTMLElement>('ii-status');
  const error = byId<HTMLElement>('ii-error');
  const result = byId<HTMLElement>('ii-result');
  const resultImage = byId<HTMLImageElement>('ii-result-image');
  const resultSummary = byId<HTMLElement>('ii-result-summary');
  const download = byId<HTMLAnchorElement>('ii-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !preview ||
    !basics ||
    !exifList ||
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

  const renderBasicInfo = (file: File, width: number, height: number) => {
    const megapixels = (width * height) / 1_000_000;
    basics.replaceChildren();
    const rows: Array<[string, string]> = [
      ['파일명', file.name],
      ['형식', file.type || '알 수 없음'],
      ['파일 크기', formatBytes(file.size)],
      ['해상도', `${width} × ${height}px`],
      ['화소', `${megapixels.toFixed(1)}MP`],
      ['비율', `${(width / height).toFixed(2)} : 1`],
      ['수정한 날짜', new Date(file.lastModified).toLocaleString('ko-KR')],
    ];
    for (const [label, value] of rows) {
      const dt = document.createElement('dt');
      dt.textContent = label;
      const dd = document.createElement('dd');
      dd.textContent = value;
      basics.append(dt, dd);
    }
  };

  const renderExif = (data: Record<string, unknown>) => {
    exifList.replaceChildren();
    const facts = exifFacts(data);
    if (facts.length === 0) {
      if (exifNote) {
        exifNote.hidden = false;
        exifNote.textContent = '촬영 정보·위치 같은 EXIF 메타데이터가 없습니다.';
      }
      if (mapLink) mapLink.hidden = true;
      return;
    }
    if (exifNote) {
      exifNote.hidden = false;
      exifNote.textContent = `${facts.length}개 메타데이터 항목을 찾았습니다.`;
    }
    for (const fact of facts) {
      const item = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = fact.label;
      const value = document.createElement('strong');
      value.textContent = fact.value;
      item.append(label, value);
      exifList.append(item);
    }

    const map = exifMapUrl(data);
    if (mapLink) {
      mapLink.hidden = !map;
      if (map) {
        mapLink.href = map;
        mapLink.rel = 'noopener noreferrer';
      } else {
        mapLink.removeAttribute('href');
      }
    }
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

    status.textContent = '이미지를 읽는 중…';
    try {
      state?.bitmap.close();
      if (state?.previewUrl) URL.revokeObjectURL(state.previewUrl);
      state = null;

      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const previewUrl = URL.createObjectURL(file);
      let exif: Record<string, unknown> = {};
      try {
        const { default: exifr } = await import('exifr');
        exif = ((await exifr.parse(file, {
          gps: true,
          tiff: true,
          exif: true,
          translateValues: true,
          reviveValues: true,
        })) ?? {}) as Record<string, unknown>;
      } catch (cause) {
        console.warn('EXIF를 읽지 못했습니다.', cause);
      }

      state = { file, bitmap, previewUrl, exif };
      preview.src = previewUrl;
      preview.alt = `${file.name} 미리보기`;
      renderBasicInfo(file, bitmap.width, bitmap.height);
      renderExif(exif);
      panel.hidden = false;
      status.textContent =
        exifFacts(exif).length > 0
          ? '메타데이터를 확인한 뒤 필요하면 제거하세요.'
          : '메타데이터가 없습니다. 그래도 재저장하면 파일이 새로 만들어집니다.';
    } catch (cause) {
      console.error(cause);
      state = null;
      panel.hidden = true;
      showError('이미지를 읽지 못했습니다. HEIC는 JPG로 변환한 뒤 사용하세요.');
      status.textContent = '';
    }
  };

  applyButton.addEventListener(
    'click',
    () =>
      void doWork(applyButton, async () => {
        if (!state) return;
        clearResult();
        showError('');
        applyButton.disabled = true;
        applyButton.setAttribute('aria-busy', 'true');
        status.textContent = '메타데이터를 제거하는 중…';

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
          context.drawImage(state.bitmap, 0, 0);
          const blob = await canvasToBlob(
            output,
            mime,
            mime === 'image/png' ? undefined : Number(quality?.value ?? 0.92),
          );
          state.resultUrl = URL.createObjectURL(blob);
          if (resultImage) {
            resultImage.src = state.resultUrl;
            resultImage.alt = '메타데이터를 제거한 이미지 미리보기';
          }
          if (download) {
            const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
            const base = safeFileName(state.file.name.replace(/\.[^.]+$/, '')) || 'image';
            download.href = state.resultUrl;
            download.download = `${base}-clean.${extension}`;
            download.textContent = `정리된 이미지 내려받기 (${formatBytes(blob.size)})`;
            download.hidden = false;
          }
          if (resultSummary) {
            resultSummary.textContent = `${output.width} × ${output.height}px · ${formatBytes(blob.size)} · EXIF 제거됨`;
          }
          result.hidden = false;
          status.textContent = '메타데이터를 제거했습니다. 아래에서 내려받으세요.';
          result.focus({ preventScroll: false });
        } catch (cause) {
          console.error(cause);
          showError('이미지를 저장하지 못했습니다. 더 작은 이미지로 시도하세요.');
          status.textContent = '';
        } finally {
          applyButton.disabled = false;
          applyButton.removeAttribute('aria-busy');
        }
      }),
  );

  format?.addEventListener('change', clearResult);
  quality?.addEventListener('input', () => {
    if (qualityValue) qualityValue.textContent = `${Math.round(Number(quality.value) * 100)}%`;
  });

  resetButton?.addEventListener('click', () => {
    state?.bitmap.close();
    if (state?.previewUrl) URL.revokeObjectURL(state.previewUrl);
    clearResult();
    state = null;
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
    if (state?.previewUrl) URL.revokeObjectURL(state.previewUrl);
    if (state?.resultUrl) URL.revokeObjectURL(state.resultUrl);
  });

  if (qualityValue) {
    qualityValue.textContent = `${Math.round(Number(quality?.value ?? 0.92) * 100)}%`;
  }
}
