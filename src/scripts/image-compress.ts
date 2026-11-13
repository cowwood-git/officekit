import { doWork } from '@/lib/do-work';
import { fitWithin, formatBytes, MAX_TOTAL_BYTES } from '@/lib/files';
import { imageOutputName, type OutputMime, supportsQuality } from '@/lib/image-convert';

type FormatChoice = 'auto' | 'jpeg' | 'webp' | 'png';
type ItemStatus = 'ready' | 'working' | 'done' | 'error';

interface Item {
  id: string;
  file: File;
  previewUrl: string;
  status: ItemStatus;
  output?: Blob;
  outputMime?: OutputMime;
  message?: string;
}

const MAX_FILES = 20;
const MAX_OUTPUT = 6000;
const items: Item[] = [];
let resultUrl: string | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function mimeFor(choice: FormatChoice, file: File): OutputMime {
  if (choice === 'auto') {
    if (file.type === 'image/png') return 'image/png';
    if (file.type === 'image/webp') return 'image/webp';
    return 'image/jpeg';
  }
  return `image/${choice}` as OutputMime;
}

function dpiQuality(quality: number): number {
  return Math.min(0.95, Math.max(0.4, quality));
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('이 형식으로 저장할 수 없습니다.'));
      },
      mime,
      quality,
    );
  });
}

export function initImageCompress(): void {
  const input = byId<HTMLInputElement>('image-input');
  const drop = byId<HTMLElement>('image-drop');
  const list = byId<HTMLOListElement>('image-list');
  const empty = byId<HTMLElement>('image-empty');
  const panel = byId<HTMLElement>('image-panel');
  const quality = byId<HTMLInputElement>('image-quality');
  const qualityValue = byId<HTMLElement>('image-quality-value');
  const maxDim = byId<HTMLSelectElement>('image-max-dim');
  const format = byId<HTMLSelectElement>('image-format');
  const convertButton = byId<HTMLButtonElement>('image-convert');
  const resetButton = byId<HTMLButtonElement>('image-reset');
  const status = byId<HTMLElement>('image-status');
  const error = byId<HTMLElement>('image-error');
  const result = byId<HTMLElement>('image-result');
  const outOriginal = byId<HTMLElement>('out-original');
  const outCompressed = byId<HTMLElement>('out-compressed');
  const outSaved = byId<HTMLElement>('out-saved');
  const outCount = byId<HTMLElement>('out-count');
  const resultNote = byId<HTMLElement>('image-note');
  const download = byId<HTMLAnchorElement>('image-download');

  if (
    !input ||
    !drop ||
    !list ||
    !empty ||
    !panel ||
    !convertButton ||
    !status ||
    !error ||
    !result
  ) {
    return;
  }

  const showError = (messages: string[]) => {
    error.hidden = messages.length === 0;
    error.textContent = messages.join(' ');
  };

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    result.hidden = true;
    download?.removeAttribute('href');
    if (download) download.hidden = true;
  };

  const totalOriginal = () => items.reduce((sum, item) => sum + item.file.size, 0);

  const updateSummary = () => {
    status.textContent =
      items.length === 0 ? '' : `${items.length}장 · ${formatBytes(totalOriginal())}`;
  };

  const render = () => {
    list.replaceChildren();
    empty.hidden = items.length > 0;
    panel.hidden = items.length === 0;
    convertButton.disabled = items.length === 0;

    items.forEach((item) => {
      const li = document.createElement('li');
      li.dataset.state = item.status;

      const thumb = document.createElement('span');
      thumb.className = 'thumb';
      const img = document.createElement('img');
      img.src = item.previewUrl;
      img.alt = '';
      img.width = 48;
      img.height = 48;
      img.loading = 'lazy';
      thumb.append(img);

      const info = document.createElement('span');
      info.className = 'file-info';
      const name = document.createElement('strong');
      name.textContent = item.file.name;
      const meta = document.createElement('span');
      meta.className = 'file-meta';
      if (item.status === 'working') meta.textContent = '압축 중…';
      else if (item.status === 'done' && item.output) {
        const saved = Math.round(((item.file.size - item.output.size) / item.file.size) * 100);
        meta.textContent = `${formatBytes(item.file.size)} → ${formatBytes(item.output.size)} (${saved > 0 ? `${saved}% 절감` : '증가'})`;
      } else if (item.status === 'error') meta.textContent = item.message ?? '압축 실패';
      else meta.textContent = `${formatBytes(item.file.size)} · ${item.file.type || '이미지'}`;
      info.append(name, meta);

      const actions = document.createElement('span');
      actions.className = 'file-actions';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'icon-btn danger';
      remove.textContent = '✕';
      remove.setAttribute('aria-label', `${item.file.name} 목록에서 제거`);
      remove.dataset.id = item.id;
      remove.dataset.action = 'remove';
      remove.disabled = item.status === 'working';
      actions.append(remove);

      li.append(thumb, info, actions);
      list.append(li);
    });
  };

  const addFiles = (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;
    clearResult();
    showError([]);

    const unsupported = incoming.filter((file) => !/^image\/(jpeg|png|webp)$/.test(file.type));
    if (unsupported.length > 0) {
      showError([`JPG·PNG·WebP만 지원합니다: ${unsupported.map((file) => file.name).join(', ')}`]);
      return;
    }
    if (items.length + incoming.length > MAX_FILES) {
      showError([`한 번에 최대 ${MAX_FILES}장까지 압축할 수 있습니다.`]);
      return;
    }
    const nextTotal = totalOriginal() + incoming.reduce((sum, file) => sum + file.size, 0);
    if (nextTotal > MAX_TOTAL_BYTES) {
      showError([`전체 용량이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다. 나눠서 압축해 주세요.`]);
      return;
    }

    for (const file of incoming) {
      items.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        status: 'ready',
      });
    }
    render();
    updateSummary();
  };

  const convert = async () => {
    if (items.length === 0) return;
    clearResult();
    showError([]);
    const choice = (format?.value as FormatChoice) ?? 'auto';
    const qualityNumber = dpiQuality(Number(quality?.value ?? 0.9));
    const dimension = Number(maxDim?.value ?? 0);
    const failures: string[] = [];

    convertButton.disabled = true;
    convertButton.setAttribute('aria-busy', 'true');

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index] as Item;
      item.status = 'working';
      item.message = undefined;
      render();
      status.textContent = `${index + 1}/${items.length} 압축 중… (${item.file.name})`;

      try {
        const bitmap = await createImageBitmap(item.file, { imageOrientation: 'from-image' });
        const target = fitWithin(
          { width: bitmap.width, height: bitmap.height },
          dimension || MAX_OUTPUT,
        );
        const mime = mimeFor(choice, item.file);

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, target.width);
        canvas.height = Math.max(1, target.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
        if (mime === 'image/jpeg') {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();

        const blob = await canvasToBlob(
          canvas,
          mime,
          supportsQuality(mime) ? qualityNumber : undefined,
        );
        item.output = blob;
        item.outputMime = mime;
        item.status = 'done';
      } catch (cause) {
        console.error(cause);
        item.status = 'error';
        item.message = cause instanceof Error ? cause.message : '압축 실패';
        failures.push(item.file.name);
      }
      render();
    }

    const outputs = items.filter(
      (item): item is Item & { output: Blob; outputMime: OutputMime } =>
        item.status === 'done' && Boolean(item.output) && Boolean(item.outputMime),
    );

    if (outputs.length === 0) {
      showError(['모든 파일을 압축하지 못했습니다. 다른 이미지로 다시 시도해 주세요.']);
      status.textContent = '';
      convertButton.disabled = false;
      convertButton.removeAttribute('aria-busy');
      return;
    }

    if (failures.length > 0) {
      showError([`${failures.length}개 파일을 압축하지 못했습니다: ${failures.join(', ')}`]);
    }

    try {
      const usedNames = new Set<string>();
      const originalBytes = outputs.reduce((sum, item) => sum + item.file.size, 0);
      const compressedBytes = outputs.reduce((sum, item) => sum + item.output.size, 0);
      const saved = Math.round(((originalBytes - compressedBytes) / originalBytes) * 100);

      let blob: Blob;
      let name: string;

      if (outputs.length === 1) {
        const only = outputs[0] as Item & { output: Blob; outputMime: OutputMime };
        blob = only.output;
        name = imageOutputName(only.file.name, only.outputMime, usedNames);
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (const item of outputs) {
          zip.file(imageOutputName(item.file.name, item.outputMime, usedNames), item.output);
        }
        blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
        name = 'images-compressed.zip';
      }

      resultUrl = URL.createObjectURL(blob);
      if (outOriginal) outOriginal.textContent = formatBytes(originalBytes);
      if (outCompressed) outCompressed.textContent = formatBytes(compressedBytes);
      if (outSaved) outSaved.textContent = saved > 0 ? `${saved}%` : '증가';
      if (outCount) outCount.textContent = `${outputs.length}장`;
      if (download) {
        download.href = resultUrl;
        download.download = name;
        download.textContent = `결과 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultNote) {
        resultNote.hidden = saved > 0;
        resultNote.textContent =
          saved > 0
            ? ''
            : '일부 이미지는 이미 최적화되어 용량이 늘었습니다. 파일별 결과를 확인하고 원본을 사용하세요.';
      }

      result.hidden = false;
      status.textContent = '완료했습니다. 아래에서 내려받으세요.';
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError(['ZIP을 만드는 중 문제가 발생했습니다. 파일 수를 줄여 다시 시도하세요.']);
      status.textContent = '';
    } finally {
      convertButton.disabled = false;
      convertButton.removeAttribute('aria-busy');
      updateSummary();
    }
  };

  const syncFormat = () => {
    const choice = (format?.value as FormatChoice) ?? 'auto';
    if (quality) quality.disabled = choice === 'png';
  };

  format?.addEventListener('change', () => {
    syncFormat();
    clearResult();
  });
  quality?.addEventListener('input', () => {
    if (qualityValue) qualityValue.textContent = `${Math.round(Number(quality.value) * 100)}%`;
    clearResult();
  });
  maxDim?.addEventListener('change', clearResult);

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
    if (event.dataTransfer?.files) addFiles(event.dataTransfer.files);
  });

  input.addEventListener('change', () => {
    if (input.files) addFiles(input.files);
    input.value = '';
  });

  list.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    if (target.dataset.action !== 'remove') return;
    const index = items.findIndex((item) => item.id === target.dataset.id);
    if (index < 0) return;
    const [removed] = items.splice(index, 1);
    if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
    clearResult();
    showError([]);
    render();
    updateSummary();
  });

  convertButton.addEventListener('click', () => void doWork(convertButton, convert));

  resetButton?.addEventListener('click', () => {
    for (const item of items) URL.revokeObjectURL(item.previewUrl);
    items.length = 0;
    clearResult();
    showError([]);
    render();
    updateSummary();
  });

  if (qualityValue)
    qualityValue.textContent = `${Math.round(Number(quality?.value ?? 0.9) * 100)}%`;
  syncFormat();
  render();

  window.addEventListener('pagehide', () => {
    for (const item of items) URL.revokeObjectURL(item.previewUrl);
    items.length = 0;
    clearResult();
  });
}
