import { displayScale } from '@/lib/crop';
import { doWork } from '@/lib/do-work';
import { formatBytes, MAX_TOTAL_BYTES, safeFileName } from '@/lib/files';
import { splitRects } from '@/lib/image-split';

const MAX_TILES = 25;

interface State {
  file: File;
  bitmap: ImageBitmap;
}

let state: State | null = null;
let resultUrl: string | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('조각을 만들지 못했습니다.'));
    }, 'image/png');
  });
}

export function initImageSplit(): void {
  const input = byId<HTMLInputElement>('is-input');
  const drop = byId<HTMLElement>('is-drop');
  const panel = byId<HTMLElement>('is-panel');
  const board = byId<HTMLCanvasElement>('is-canvas');
  const info = byId<HTMLElement>('is-info');
  const rowsSelect = byId<HTMLSelectElement>('is-rows');
  const colsSelect = byId<HTMLSelectElement>('is-cols');
  const tileInfo = byId<HTMLElement>('is-tile-info');
  const applyButton = byId<HTMLButtonElement>('is-apply');
  const clearButton = byId<HTMLButtonElement>('is-clear');
  const status = byId<HTMLElement>('is-status');
  const error = byId<HTMLElement>('is-error');
  const result = byId<HTMLElement>('is-result');
  const resultCount = byId<HTMLElement>('is-result-count');
  const resultSize = byId<HTMLElement>('is-result-size');
  const download = byId<HTMLAnchorElement>('is-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !board ||
    !info ||
    !rowsSelect ||
    !colsSelect ||
    !tileInfo ||
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
    download?.removeAttribute('href');
    if (download) download.hidden = true;
  };

  const rows = () => Math.max(1, Number(rowsSelect.value) || 2);
  const cols = () => Math.max(1, Number(colsSelect.value) || 2);

  const drawBoard = () => {
    if (!state) return;
    const scale = displayScale(
      { width: state.bitmap.width, height: state.bitmap.height },
      { width: 760, height: 460 },
    );
    board.width = Math.max(1, Math.round(state.bitmap.width * scale));
    board.height = Math.max(1, Math.round(state.bitmap.height * scale));
    const context = board.getContext('2d');
    if (!context) return;
    context.clearRect(0, 0, board.width, board.height);
    context.drawImage(state.bitmap, 0, 0, board.width, board.height);

    context.save();
    context.strokeStyle = 'rgba(204, 34, 34, 0.9)';
    context.lineWidth = 2;
    context.setLineDash([6, 4]);
    for (let row = 1; row < rows(); row += 1) {
      const y = (board.height * row) / rows();
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(board.width, y);
      context.stroke();
    }
    for (let col = 1; col < cols(); col += 1) {
      const x = (board.width * col) / cols();
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, board.height);
      context.stroke();
    }
    context.restore();

    const tiles = splitRects(state.bitmap.width, state.bitmap.height, rows(), cols());
    const first = tiles[0];
    tileInfo.textContent = `${tiles.length}조각 · 조각 크기 약 ${first?.width ?? 0}×${first?.height ?? 0}px`;
    applyButton.disabled = tiles.length > MAX_TILES;
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
      state = { file, bitmap };
      info.textContent = `${file.name} · ${bitmap.width} × ${bitmap.height}px · ${formatBytes(file.size)}`;
      panel.hidden = false;
      drawBoard();
      status.textContent = '나눌 행·열을 고른 뒤 ZIP으로 내려받으세요.';
    } catch (cause) {
      console.error(cause);
      state = null;
      panel.hidden = true;
      showError('이미지를 불러오지 못했습니다. HEIC는 JPG로 변환한 뒤 사용하세요.');
      status.textContent = '';
    }
  };

  for (const control of [rowsSelect, colsSelect]) {
    control.addEventListener('change', () => {
      clearResult();
      drawBoard();
    });
  }

  applyButton.addEventListener(
    'click',
    () =>
      void doWork(applyButton, async () => {
        if (!state) return;
        const tiles = splitRects(state.bitmap.width, state.bitmap.height, rows(), cols());
        if (tiles.length > MAX_TILES) {
          showError(`조각이 너무 많습니다. 최대 ${MAX_TILES}개까지 지원합니다.`);
          return;
        }

        clearResult();
        showError('');
        applyButton.disabled = true;
        applyButton.setAttribute('aria-busy', 'true');
        status.textContent = '조각을 만드는 중…';

        try {
          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();
          const base = safeFileName(state.file.name.replace(/\.[^.]+$/, '')) || 'image';

          for (let index = 0; index < tiles.length; index += 1) {
            const tile = tiles[index];
            if (!tile) continue;
            const canvas = document.createElement('canvas');
            canvas.width = tile.width;
            canvas.height = tile.height;
            const context = canvas.getContext('2d');
            if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
            context.drawImage(
              state.bitmap,
              tile.x,
              tile.y,
              tile.width,
              tile.height,
              0,
              0,
              tile.width,
              tile.height,
            );
            const blob = await canvasToBlob(canvas);
            zip.file(
              `${base}-r${String(tile.row + 1).padStart(2, '0')}c${String(tile.col + 1).padStart(2, '0')}.png`,
              blob,
            );
          }

          const blob = await zip.generateAsync({ type: 'blob' });
          resultUrl = URL.createObjectURL(blob);
          if (download) {
            download.href = resultUrl;
            download.download = `${base}-split.zip`;
            download.textContent = `ZIP 내려받기 (${tiles.length}조각 · ${formatBytes(blob.size)})`;
            download.hidden = false;
          }
          if (resultCount) resultCount.textContent = `${tiles.length}조각`;
          if (resultSize) resultSize.textContent = formatBytes(blob.size);
          status.textContent = `${rows()}×${cols()}로 나눴습니다.`;
          result.hidden = false;
          result.focus({ preventScroll: false });
        } catch (cause) {
          console.error(cause);
          showError('이미지를 나누지 못했습니다. 더 작은 이미지로 다시 시도하세요.');
          status.textContent = '';
        } finally {
          applyButton.disabled = false;
          applyButton.removeAttribute('aria-busy');
        }
      }),
  );

  clearButton?.addEventListener('click', () => {
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
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  });
}
