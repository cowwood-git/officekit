import {
  extractPalette,
  formatHsl,
  formatRgb,
  inkFor,
  paletteCss,
  type Rgb,
  rgbToHex,
} from '@/lib/color-palette';
import { heicAsReadable } from './heic-file';
import { bindDrop, byId, copyText, errorSetter } from './kit';

/** 이미지 색 추출 — 대표 색 팔레트와, 이미지를 눌러 고른 한 점의 색. */
const MAX_SIDE = 900;

export function initImageColors(): void {
  const input = byId<HTMLInputElement>('cx-input');
  const drop = byId<HTMLElement>('cx-drop');
  const panel = byId<HTMLElement>('cx-panel');
  const error = byId<HTMLElement>('cx-error');
  const status = byId<HTMLElement>('cx-status');
  const canvas = byId<HTMLCanvasElement>('cx-canvas');
  const count = byId<HTMLSelectElement>('cx-count');
  const swatches = byId<HTMLElement>('cx-swatches');
  const picked = byId<HTMLElement>('cx-picked');
  const copyCss = byId<HTMLButtonElement>('cx-copy-css');
  const reset = byId<HTMLButtonElement>('cx-reset');
  if (!input || !drop || !panel || !error || !status || !canvas || !swatches) return;
  const showError = errorSetter(error);
  let palette: Rgb[] = [];

  const chip = (color: Rgb, share?: number): HTMLElement => {
    const hex = rgbToHex(color);
    const item = document.createElement('li');
    item.className = 'cx-chip';
    const face = document.createElement('button');
    face.type = 'button';
    face.className = 'cx-face';
    face.style.background = hex;
    face.style.color = inkFor(color);
    face.textContent = share === undefined ? hex : `${hex} · ${Math.round(share * 100)}%`;
    face.setAttribute('aria-label', `${hex} 복사`);
    face.addEventListener('click', () => void copyText(face, hex));
    const codes = document.createElement('div');
    codes.className = 'cx-codes';
    for (const text of [formatRgb(color), formatHsl(color)]) {
      const code = document.createElement('button');
      code.type = 'button';
      code.textContent = text;
      code.addEventListener('click', () => void copyText(code, text));
      codes.append(code);
    }
    item.append(face, codes);
    return item;
  };

  const analyse = () => {
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const swatchList = extractPalette(data, Number(count?.value ?? 6));
    palette = swatchList;
    swatches.replaceChildren(...swatchList.map((swatch) => chip(swatch, swatch.share)));
  };

  const select = async (file: File) => {
    showError('');
    if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
      showError('이미지 파일을 넣어 주세요.');
      return;
    }
    try {
      const readable = await heicAsReadable(file);
      const bitmap = await createImageBitmap(readable, { imageOrientation: 'from-image' });
      const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas
        .getContext('2d', { willReadFrequently: true })
        ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      drop.hidden = true;
      panel.hidden = false;
      status.textContent =
        '색을 누르면 코드가 복사됩니다. 이미지를 누르면 그 자리 색을 집어 옵니다.';
      if (picked) picked.replaceChildren();
      analyse();
    } catch (cause) {
      console.error(cause);
      showError('이미지를 열 수 없습니다.');
    }
  };

  canvas.addEventListener('click', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor(((event.clientX - rect.left) / rect.width) * canvas.width);
    const y = Math.floor(((event.clientY - rect.top) / rect.height) * canvas.height);
    const pixel = canvas
      .getContext('2d', { willReadFrequently: true })
      ?.getImageData(x, y, 1, 1).data;
    if (!pixel || !picked) return;
    picked.replaceChildren(chip({ r: pixel[0] ?? 0, g: pixel[1] ?? 0, b: pixel[2] ?? 0 }));
  });

  bindDrop(input, drop, (files) => void select(files[0] as File));
  count?.addEventListener('change', analyse);
  copyCss?.addEventListener('click', () => void copyText(copyCss, paletteCss(palette)));
  reset?.addEventListener('click', () => {
    panel.hidden = true;
    drop.hidden = false;
    status.textContent = '';
    showError('');
  });
}
