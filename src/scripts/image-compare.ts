import { formatBytes } from '@/lib/files';
import { compareSize, diffPixels, formatRatio, thresholdFor } from '@/lib/image-diff';
import { heicAsReadable } from './heic-file';
import { bindDrop, byId, canvasBlob, errorSetter } from './kit';

/** 이미지 비교 — 두 장을 겹쳐 밀어 보거나, 달라진 곳을 빨갛게 표시한다. */
type Mode = 'slider' | 'diff' | 'side';

interface Slot {
  name: string;
  size: number;
  bitmap: ImageBitmap;
}

export function initImageCompare(): void {
  const error = byId<HTMLElement>('ic-error');
  const status = byId<HTMLElement>('ic-status');
  const panel = byId<HTMLElement>('ic-panel');
  const canvas = byId<HTMLCanvasElement>('ic-view');
  const split = byId<HTMLInputElement>('ic-split');
  const splitField = byId<HTMLElement>('ic-split-field');
  const sensitivity = byId<HTMLInputElement>('ic-sensitivity');
  const sensitivityField = byId<HTMLElement>('ic-sensitivity-field');
  const stat = byId<HTMLElement>('ic-stat');
  const save = byId<HTMLButtonElement>('ic-save');
  const swap = byId<HTMLButtonElement>('ic-swap');
  if (!error || !status || !panel || !canvas) return;
  const showError = errorSetter(error);

  const slots: [Slot | null, Slot | null] = [null, null];
  let mode: Mode = 'slider';
  let pixels: [ImageData, ImageData] | null = null;

  const label = (index: 0 | 1) => byId<HTMLElement>(`ic-name-${index}`);

  const prepare = () => {
    const [a, b] = slots;
    if (!a || !b) return;
    const size = compareSize(a.bitmap.width, a.bitmap.height);
    const scratch = document.createElement('canvas');
    scratch.width = size.width;
    scratch.height = size.height;
    const context = scratch.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    const read = (bitmap: ImageBitmap) => {
      context.clearRect(0, 0, size.width, size.height);
      context.drawImage(bitmap, 0, 0, size.width, size.height);
      return context.getImageData(0, 0, size.width, size.height);
    };
    pixels = [read(a.bitmap), read(b.bitmap)];
    const different =
      Math.abs(a.bitmap.width / a.bitmap.height - b.bitmap.width / b.bitmap.height) > 0.01;
    status.textContent = different
      ? `두 이미지의 비율이 달라 두 번째 이미지를 첫 번째 크기(${size.width}×${size.height})로 늘려 맞췄습니다.`
      : `${size.width}×${size.height}px 기준으로 비교합니다.`;
    panel.hidden = false;
    draw();
  };

  const draw = () => {
    if (!pixels) return;
    const [a, b] = pixels;
    const context = canvas.getContext('2d');
    if (!context) return;
    if (mode === 'side') {
      canvas.width = a.width * 2 + 8;
      canvas.height = a.height;
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.putImageData(a, 0, 0);
      context.putImageData(b, a.width + 8, 0);
    } else {
      canvas.width = a.width;
      canvas.height = a.height;
    }
    if (mode === 'slider') {
      const x = Math.round((Number(split?.value ?? 50) / 100) * a.width);
      context.putImageData(b, 0, 0);
      context.putImageData(a, 0, 0, 0, 0, x, a.height);
      context.fillStyle = '#ffffff';
      context.fillRect(x - 1, 0, 2, a.height);
    }
    if (mode === 'diff' || mode === 'side' || stat) {
      const result = diffPixels(a.data, b.data, thresholdFor(Number(sensitivity?.value ?? 70)));
      if (mode === 'diff')
        context.putImageData(new ImageData(result.mask, a.width, a.height), 0, 0);
      if (stat) {
        stat.textContent =
          result.changed === 0
            ? '두 이미지가 같습니다(지금 민감도 기준).'
            : `다른 픽셀 ${result.changed.toLocaleString('ko-KR')}개 · 전체의 ${formatRatio(result.ratio)}`;
      }
    }
    if (splitField) splitField.hidden = mode !== 'slider';
    if (sensitivityField) sensitivityField.hidden = mode !== 'diff';
  };

  const load = async (index: 0 | 1, file: File) => {
    showError('');
    if (!file.type.startsWith('image/') && !/\.(heic|heif)$/i.test(file.name)) {
      showError('이미지 파일을 넣어 주세요.');
      return;
    }
    try {
      const readable = await heicAsReadable(file);
      const bitmap = await createImageBitmap(readable, { imageOrientation: 'from-image' });
      slots[index]?.bitmap.close();
      slots[index] = { name: file.name, size: file.size, bitmap };
      const target = label(index);
      if (target)
        target.textContent = `${file.name} · ${bitmap.width}×${bitmap.height} · ${formatBytes(file.size)}`;
      const drop = byId<HTMLElement>(`ic-drop-${index}`);
      drop?.setAttribute('data-filled', 'true');
      if (slots[0] && slots[1]) prepare();
      else
        status.textContent =
          index === 0
            ? '비교할 두 번째 이미지를 넣으세요.'
            : '기준이 될 첫 번째 이미지를 넣으세요.';
    } catch (cause) {
      console.error(cause);
      showError(`${file.name}을(를) 열 수 없습니다.`);
    }
  };

  for (const index of [0, 1] as const) {
    const input = byId<HTMLInputElement>(`ic-input-${index}`);
    const drop = byId<HTMLElement>(`ic-drop-${index}`);
    if (!input || !drop) continue;
    bindDrop(input, drop, (files) => {
      // 한 칸에 두 장을 한꺼번에 넣으면 순서대로 두 칸을 채운다.
      if (files.length >= 2) {
        void load(0, files[0] as File).then(() => load(1, files[1] as File));
      } else void load(index, files[0] as File);
    });
  }

  for (const radio of document.querySelectorAll<HTMLInputElement>('input[name="ic-mode"]')) {
    radio.addEventListener('change', () => {
      mode = radio.value as Mode;
      draw();
    });
  }
  split?.addEventListener('input', draw);
  sensitivity?.addEventListener('input', draw);
  swap?.addEventListener('click', () => {
    [slots[0], slots[1]] = [slots[1], slots[0]];
    for (const index of [0, 1] as const) {
      const target = label(index);
      const slot = slots[index];
      if (target && slot)
        target.textContent = `${slot.name} · ${slot.bitmap.width}×${slot.bitmap.height} · ${formatBytes(slot.size)}`;
    }
    prepare();
  });
  save?.addEventListener('click', async () => {
    const blob = await canvasBlob(canvas);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = mode === 'diff' ? 'compare-diff.png' : 'compare.png';
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 4000);
  });

  window.addEventListener('pagehide', () => {
    for (const slot of slots) slot?.bitmap.close();
    slots[0] = null;
    slots[1] = null;
  });
}
