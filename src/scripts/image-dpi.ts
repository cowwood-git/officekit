import { doWork } from '@/lib/do-work';
import { formatBytes } from '@/lib/files';
import {
  clampDpi,
  dpiFileName,
  printSizeCm,
  readDpi,
  setDpi,
  sniffDpiFormat,
} from '@/lib/image-dpi';
import { bindDrop, byId, errorSetter, zipBlob } from './kit';

/** 이미지 DPI 변경 — 픽셀은 그대로 두고 인쇄 해상도 정보만 바꾼다. */
interface Item {
  file: File;
  bytes: Uint8Array;
  dpi: number | null;
  width: number;
  height: number;
}

const MAX_FILES = 50;

async function pixelSize(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file);
  const size = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return size;
}

export function initImageDpi(): void {
  const input = byId<HTMLInputElement>('id-input');
  const drop = byId<HTMLElement>('id-drop');
  const panel = byId<HTMLElement>('id-panel');
  const error = byId<HTMLElement>('id-error');
  const status = byId<HTMLElement>('id-status');
  const rows = byId<HTMLElement>('id-rows');
  const preset = byId<HTMLSelectElement>('id-preset');
  const custom = byId<HTMLInputElement>('id-custom');
  const apply = byId<HTMLButtonElement>('id-apply');
  const reset = byId<HTMLButtonElement>('id-reset');
  const result = byId<HTMLElement>('id-result');
  const resultNote = byId<HTMLElement>('id-result-note');
  const download = byId<HTMLAnchorElement>('id-download');
  if (!input || !drop || !panel || !error || !status || !rows || !apply) return;
  const showError = errorSetter(error);

  let items: Item[] = [];
  let resultUrl: string | null = null;

  const target = () =>
    clampDpi(preset?.value === 'custom' ? Number(custom?.value) : Number(preset?.value ?? 300));

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    if (result) result.hidden = true;
  };

  const render = () => {
    clearResult();
    if (custom) custom.hidden = preset?.value !== 'custom';
    const dpi = target();
    rows.replaceChildren(
      ...items.map((item) => {
        const row = document.createElement('tr');
        const cells = [
          item.file.name,
          `${item.width}×${item.height}`,
          item.dpi
            ? `${item.dpi}dpi · ${printSizeCm(item.width, item.dpi)}×${printSizeCm(item.height, item.dpi)}cm`
            : '정보 없음',
          `${dpi}dpi · ${printSizeCm(item.width, dpi)}×${printSizeCm(item.height, dpi)}cm`,
        ];
        for (const text of cells) {
          const cell = document.createElement('td');
          cell.textContent = text;
          row.append(cell);
        }
        return row;
      }),
    );
  };

  const add = async (files: File[]) => {
    showError('');
    const skipped: string[] = [];
    for (const file of files) {
      if (items.length >= MAX_FILES) {
        showError(`한 번에 최대 ${MAX_FILES}장까지 바꿀 수 있습니다.`);
        break;
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      if (!sniffDpiFormat(bytes)) {
        skipped.push(file.name);
        continue;
      }
      try {
        items.push({ file, bytes, dpi: readDpi(bytes), ...(await pixelSize(file)) });
      } catch {
        skipped.push(file.name);
      }
    }
    if (skipped.length) showError(`JPG·PNG가 아니거나 열 수 없어 뺐습니다: ${skipped.join(', ')}`);
    if (items.length === 0) return;
    drop.hidden = true;
    panel.hidden = false;
    status.textContent = `${items.length}장 · 픽셀과 화질은 그대로 두고 DPI 정보만 바꿉니다.`;
    render();
  };

  const run = async () => {
    if (items.length === 0) return;
    clearResult();
    const dpi = target();
    const outputs = items.map((item) => ({
      name: dpiFileName(item.file.name, dpi),
      data: new Blob([new Uint8Array(setDpi(item.bytes, dpi))], {
        type: item.file.type || 'image/jpeg',
      }),
    }));
    const single = outputs.length === 1 ? outputs[0] : undefined;
    const blob = single ? single.data : await zipBlob(outputs);
    resultUrl = URL.createObjectURL(blob);
    if (download) {
      download.href = resultUrl;
      download.download = single ? single.name : `dpi-${dpi}.zip`;
      download.textContent = `${single ? '이미지' : 'ZIP'} 내려받기 (${formatBytes(blob.size)})`;
    }
    if (resultNote)
      resultNote.textContent = `${outputs.length}장을 ${dpi}dpi로 바꿨습니다. 용량과 화질은 원본과 같습니다.`;
    if (result) result.hidden = false;
  };

  bindDrop(input, drop, (files) => void add(files), [panel]);
  preset?.addEventListener('change', render);
  custom?.addEventListener('input', render);
  apply.addEventListener('click', () => void doWork(apply, run));
  reset?.addEventListener('click', () => {
    clearResult();
    items = [];
    rows.replaceChildren();
    panel.hidden = true;
    drop.hidden = false;
    status.textContent = '';
    showError('');
  });

  window.addEventListener('pagehide', () => {
    clearResult();
    items = [];
    rows.replaceChildren();
  });
}
