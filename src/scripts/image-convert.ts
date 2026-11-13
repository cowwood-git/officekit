import { doWork } from '@/lib/do-work';
import { fitWithin, formatBytes, MAX_TOTAL_BYTES } from '@/lib/files';
import {
  extensionFor,
  imageOutputName,
  isSupportedImage,
  labelFor,
  type OutputMime,
  supportsQuality,
} from '@/lib/image-convert';
import {
  keepFormat,
  type ResizeMode,
  type ResizeOptions,
  resizeError,
  resizeTarget,
} from '@/lib/image-resize';

type ItemStatus = 'ready' | 'working' | 'done' | 'error';

interface Item {
  id: string;
  file: File;
  previewUrl: string;
  status: ItemStatus;
  output?: Blob;
  /** 실제 저장한 형식(원본 형식 유지일 때 파일마다 다르다) */
  mime?: OutputMime;
  /** 크기 조절일 때 "4000×3000 → 1280×960" */
  dims?: string;
  message?: string;
}

const MAX_FILES = 20;
const MAX_OUTPUT = 6000;
const items: Item[] = [];
let resultUrl: string | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  release?: () => void;
}

async function decodeImage(file: File): Promise<Decoded> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close(),
    };
  } catch {
    // SVG 등 createImageBitmap 이 실패하는 형식은 <img>로 읽는다.
  }

  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    if (image.naturalWidth < 1 || image.naturalHeight < 1) {
      throw new Error('이미지 크기를 알 수 없습니다.');
    }
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch (cause) {
    URL.revokeObjectURL(url);
    throw cause;
  }
}

function item0Mime(outputs: Array<{ mime: OutputMime }>): OutputMime {
  return outputs[0]?.mime ?? 'image/jpeg';
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

export function initImageConvert(): void {
  const input = byId<HTMLInputElement>('ic-input');
  const drop = byId<HTMLElement>('ic-drop');
  const list = byId<HTMLOListElement>('ic-list');
  const empty = byId<HTMLElement>('ic-empty');
  const panel = byId<HTMLElement>('ic-panel');
  const format = byId<HTMLSelectElement>('ic-format');
  const quality = byId<HTMLInputElement>('ic-quality');
  const qualityValue = byId<HTMLElement>('ic-quality-value');
  const bgWrap = byId<HTMLElement>('ic-bg-wrap');
  const bgColor = byId<HTMLInputElement>('ic-bg');
  const convertButton = byId<HTMLButtonElement>('ic-convert');
  const resetButton = byId<HTMLButtonElement>('ic-reset');
  const status = byId<HTMLElement>('ic-status');
  const error = byId<HTMLElement>('ic-error');
  const result = byId<HTMLElement>('ic-result');
  const resultSummary = byId<HTMLElement>('ic-result-summary');
  const download = byId<HTMLAnchorElement>('ic-download');
  // 이미지 크기 조절 도구(같은 작업 영역에 크기 기준 입력이 더 있다)
  const resizeMode = byId<HTMLSelectElement>('ir-mode');
  const resizeWidth = byId<HTMLInputElement>('ir-width');
  const resizeHeight = byId<HTMLInputElement>('ir-height');
  const resizePercent = byId<HTMLInputElement>('ir-percent');
  const resizeKeep = byId<HTMLInputElement>('ir-keep');
  const readResize = (): ResizeOptions | null =>
    resizeMode
      ? {
          mode: resizeMode.value as ResizeMode,
          width: Number(resizeWidth?.value),
          height: Number(resizeHeight?.value),
          percent: Number(resizePercent?.value),
          keepRatio: resizeKeep?.checked ?? true,
        }
      : null;

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
    if (download) {
      download.removeAttribute('href');
      download.hidden = true;
    }
  };

  const currentMime = (): OutputMime | 'keep' =>
    (format?.value as OutputMime | 'keep' | undefined) ?? 'image/jpeg';
  const totalBytes = () => items.reduce((sum, item) => sum + item.file.size, 0);

  const syncOptions = () => {
    const mime = currentMime();
    if (quality) quality.disabled = mime !== 'keep' && !supportsQuality(mime);
    if (bgWrap) bgWrap.hidden = mime !== 'image/jpeg' && mime !== 'keep';
    if (resizeMode) {
      const mode = resizeMode.value;
      const show: Record<string, boolean> = {
        width: mode === 'width' || mode === 'box',
        height: mode === 'height' || mode === 'box',
        percent: mode === 'percent',
        keep: mode === 'box',
      };
      for (const field of document.querySelectorAll<HTMLElement>('[data-resize-field]')) {
        field.hidden = !show[field.dataset.resizeField ?? ''];
      }
    }
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
      if (item.status === 'working') meta.textContent = '변환 중…';
      else if (item.status === 'done' && item.output) {
        meta.textContent = item.dims
          ? `${item.dims} · ${formatBytes(item.output.size)}`
          : `${formatBytes(item.file.size)} → ${formatBytes(item.output.size)}`;
      } else if (item.status === 'error') meta.textContent = item.message ?? '변환 실패';
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

  const updateSummary = () => {
    status.textContent =
      items.length === 0 ? '' : `${items.length}장 · ${formatBytes(totalBytes())}`;
  };

  const addFiles = (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;
    clearResult();
    showError([]);

    const unsupported = incoming.filter((file) => !isSupportedImage(file));
    if (unsupported.length > 0) {
      showError([
        `지원하지 않는 형식입니다: ${unsupported.map((file) => file.name).join(', ')} (JPG·PNG·WebP·GIF·BMP·SVG·AVIF)`,
      ]);
      return;
    }

    if (items.length + incoming.length > MAX_FILES) {
      showError([`한 번에 최대 ${MAX_FILES}장까지 변환할 수 있습니다.`]);
      return;
    }

    const nextTotal = totalBytes() + incoming.reduce((sum, file) => sum + file.size, 0);
    if (nextTotal > MAX_TOTAL_BYTES) {
      showError([`전체 용량이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다. 나눠서 변환해 주세요.`]);
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
    const mime = currentMime();
    const resize = readResize();
    const invalid = resize ? resizeError(resize) : '';
    if (invalid) {
      showError([invalid]);
      return;
    }
    const qualityValueNumber = Number(quality?.value ?? 0.9);
    const background = bgColor?.value ?? '#ffffff';
    const usedNames = new Set<string>();

    convertButton.disabled = true;
    convertButton.setAttribute('aria-busy', 'true');
    const failures: string[] = [];

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index] as Item;
      item.status = 'working';
      item.message = undefined;
      render();
      status.textContent = `${index + 1}/${items.length} 변환 중… (${item.file.name})`;

      try {
        const decoded = await decodeImage(item.file);
        const sourceSize = { width: decoded.width, height: decoded.height };
        const target = resize
          ? resizeTarget(sourceSize, resize)
          : fitWithin(sourceSize, MAX_OUTPUT);
        const itemMime = mime === 'keep' ? keepFormat(item.file.type) : mime;
        item.mime = itemMime;
        item.dims = resize
          ? `${sourceSize.width}×${sourceSize.height} → ${target.width}×${target.height}`
          : undefined;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, target.width);
        canvas.height = Math.max(1, target.height);
        const context = canvas.getContext('2d');
        if (!context) throw new Error('캔버스를 사용할 수 없습니다.');

        if (itemMime === 'image/jpeg') {
          context.fillStyle = background;
          context.fillRect(0, 0, canvas.width, canvas.height);
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
        decoded.release?.();

        const blob = await canvasToBlob(
          canvas,
          itemMime,
          supportsQuality(itemMime) ? qualityValueNumber : undefined,
        );
        item.output = blob;
        item.status = 'done';
      } catch (cause) {
        console.error(cause);
        item.status = 'error';
        item.message = cause instanceof Error ? cause.message : '변환 실패';
        failures.push(item.file.name);
      }
      render();
    }

    const outputs = items.filter(
      (item): item is Item & { output: Blob; mime: OutputMime } =>
        item.status === 'done' && Boolean(item.output) && Boolean(item.mime),
    );

    if (outputs.length === 0) {
      showError(['모든 파일을 변환하지 못했습니다. 다른 형식으로 다시 시도해 주세요.']);
      status.textContent = '';
      convertButton.disabled = false;
      convertButton.removeAttribute('aria-busy');
      return;
    }

    if (failures.length > 0) {
      showError([`${failures.length}개 파일을 변환하지 못했습니다: ${failures.join(', ')}`]);
    }

    try {
      let blob: Blob;
      let name: string;

      if (outputs.length === 1) {
        const only = outputs[0] as Item & { output: Blob; mime: OutputMime };
        blob = only.output;
        name = imageOutputName(only.file.name, only.mime, usedNames);
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (const item of outputs) {
          zip.file(imageOutputName(item.file.name, item.mime, usedNames), item.output);
        }
        blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
        name = resize ? 'images-resized.zip' : `images-${extensionFor(item0Mime(outputs))}.zip`;
      }

      resultUrl = URL.createObjectURL(blob);
      if (download) {
        download.href = resultUrl;
        download.download = name;
        download.textContent = `결과 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultSummary) {
        const label = mime === 'keep' ? '원본 형식' : labelFor(mime);
        const first = outputs[0];
        resultSummary.textContent =
          outputs.length === 1
            ? `${first?.dims ?? label} · ${formatBytes(blob.size)}`
            : `${outputs.length}장 · ${label} ZIP · ${formatBytes(blob.size)}`;
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
    }
  };

  format?.addEventListener('change', () => {
    syncOptions();
    clearResult();
  });
  for (const field of [resizeMode, resizeWidth, resizeHeight, resizePercent, resizeKeep]) {
    field?.addEventListener('input', () => {
      syncOptions();
      clearResult();
    });
  }
  quality?.addEventListener('input', () => {
    if (qualityValue) qualityValue.textContent = `${Math.round(Number(quality.value) * 100)}%`;
    clearResult();
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
  syncOptions();
  render();

  window.addEventListener('pagehide', () => {
    for (const item of items) URL.revokeObjectURL(item.previewUrl);
    items.length = 0;
    clearResult();
  });
}
