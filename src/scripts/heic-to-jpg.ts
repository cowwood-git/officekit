import { doWork } from '@/lib/do-work';
import { fitWithin, formatBytes, safeFileName } from '@/lib/files';
import { isHeic, jpegNameFor, validateHeicSelection } from '@/lib/heic';

type ItemState = 'ready' | 'working' | 'done' | 'error';

interface Item {
  id: string;
  file: File;
  state: ItemState;
  message?: string;
  output?: Blob;
  previewUrl?: string;
}

interface Decoded {
  source: CanvasImageSource;
  width: number;
  height: number;
  release?: () => void;
}

const items: Item[] = [];
let resultUrl: string | null = null;
let decoderLoaded = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

async function decodeHeic(file: File, onDecoder: () => void): Promise<Decoded> {
  // 1) 브라우저 기본 디코딩 (Safari 등)
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      release: () => bitmap.close(),
    };
  } catch {
    // 계속 진행
  }

  // 2) <img> 디코딩 (Safari가 createImageBitmap 을 지원하지 않는 경우)
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      release: () => URL.revokeObjectURL(url),
    };
  } catch {
    URL.revokeObjectURL(url);
  }

  // 3) WASM 디코더 (Chrome·Edge·Firefox)
  onDecoder();
  const { default: heic2any } = await import('heic2any');
  const converted = await heic2any({
    blob: file,
    toType: 'image/jpeg',
    quality: 0.95,
  });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!blob) throw new Error('HEIC를 변환하지 못했습니다.');

  const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' });
  return {
    source: bitmap,
    width: bitmap.width,
    height: bitmap.height,
    release: () => bitmap.close(),
  };
}

export function initHeicToJpg(): void {
  const input = byId<HTMLInputElement>('heic-input');
  const drop = byId<HTMLElement>('heic-drop');
  const list = byId<HTMLOListElement>('heic-list');
  const empty = byId<HTMLElement>('heic-empty');
  const panel = byId<HTMLElement>('heic-panel');
  const quality = byId<HTMLSelectElement>('heic-quality');
  const maxDim = byId<HTMLSelectElement>('heic-max-dim');
  const convertButton = byId<HTMLButtonElement>('heic-convert');
  const resetButton = byId<HTMLButtonElement>('heic-reset');
  const status = byId<HTMLElement>('heic-status');
  const error = byId<HTMLElement>('heic-error');
  const result = byId<HTMLElement>('heic-result');
  const resultSummary = byId<HTMLElement>('heic-result-summary');
  const download = byId<HTMLAnchorElement>('heic-download');

  if (!input || !drop || !list || !empty || !convertButton || !status || !error || !result) return;

  const showError = (messages: string[]) => {
    error.hidden = messages.length === 0;
    error.textContent = messages.join(' ');
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

  const render = () => {
    list.replaceChildren();
    empty.hidden = items.length > 0;
    if (panel) panel.hidden = items.length === 0;
    convertButton.disabled = items.length === 0;

    items.forEach((item) => {
      const li = document.createElement('li');
      li.dataset.state = item.state;

      const thumb = document.createElement('span');
      thumb.className = 'thumb';
      if (item.previewUrl) {
        const img = document.createElement('img');
        img.src = item.previewUrl;
        img.alt = '';
        img.width = 48;
        img.height = 48;
        img.loading = 'lazy';
        thumb.append(img);
      } else {
        thumb.textContent = 'HEIC';
        thumb.classList.add('thumb-placeholder');
      }

      const info = document.createElement('span');
      info.className = 'file-info';
      const name = document.createElement('strong');
      name.textContent = item.file.name;
      const meta = document.createElement('span');
      meta.className = 'file-meta';
      if (item.state === 'done' && item.output) {
        meta.textContent = `완료 · ${formatBytes(item.output.size)}`;
      } else if (item.state === 'working') {
        meta.textContent = '변환 중…';
      } else if (item.state === 'error') {
        meta.textContent = item.message ?? '변환 실패';
      } else {
        meta.textContent = formatBytes(item.file.size);
      }
      info.append(name, meta);

      const actions = document.createElement('span');
      actions.className = 'file-actions';

      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'icon-btn danger';
      remove.textContent = '✕';
      remove.setAttribute('aria-label', `${item.file.name} 목록에서 제거`);
      remove.dataset.action = 'remove';
      remove.dataset.id = item.id;
      remove.disabled = item.state === 'working';

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

    const candidates = [...items.map((item) => item.file), ...incoming];
    const validation = validateHeicSelection(candidates);
    if (!validation.ok) {
      showError(validation.errors);
      return;
    }

    for (const file of incoming) {
      if (!isHeic(file)) continue;
      items.push({ id: crypto.randomUUID(), file, state: 'ready' });
    }
    status.textContent = '';
    render();
  };

  const convert = async () => {
    if (items.length === 0) return;
    clearResult();
    showError([]);

    const qualityValue = Number(quality?.value ?? 0.92);
    const maxDimension = Number(maxDim?.value ?? 2000);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) {
      showError(['캔버스를 사용할 수 없는 브라우저입니다.']);
      return;
    }

    convertButton.disabled = true;
    convertButton.setAttribute('aria-busy', 'true');
    const usedNames = new Set<string>();
    let success = 0;
    const failures: string[] = [];

    try {
      for (let index = 0; index < items.length; index += 1) {
        const item = items[index] as Item;
        item.state = 'working';
        item.message = undefined;
        render();
        status.textContent = `${index + 1}/${items.length} 변환 중… (${item.file.name})`;

        try {
          const decoded = await decodeHeic(item.file, () => {
            if (decoderLoaded) return;
            status.textContent =
              'HEIC 디코더를 불러오는 중… (첫 1회, 약 1.3MB) 잠시만 기다려 주세요.';
          });
          decoderLoaded = true;

          const target =
            maxDimension > 0
              ? fitWithin({ width: decoded.width, height: decoded.height }, maxDimension)
              : { width: decoded.width, height: decoded.height };

          canvas.width = Math.max(1, target.width);
          canvas.height = Math.max(1, target.height);
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.imageSmoothingEnabled = true;
          context.imageSmoothingQuality = 'high';
          context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
          decoded.release?.();

          const blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
              (value) => {
                if (value) resolve(value);
                else reject(new Error('JPG로 변환하지 못했습니다.'));
              },
              'image/jpeg',
              qualityValue,
            );
          });

          if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
          item.output = blob;
          item.previewUrl = URL.createObjectURL(blob);
          item.state = 'done';
          success += 1;
        } catch (cause) {
          console.error(cause);
          item.state = 'error';
          item.message = '변환 실패 (파일 손상 또는 메모리 부족)';
          failures.push(item.file.name);
        }

        render();
      }

      if (success === 0) {
        showError([
          '모든 파일을 변환하지 못했습니다. 파일이 손상되지 않았는지, 다른 HEIC 파일로 다시 시도해 주세요.',
        ]);
        status.textContent = '';
        return;
      }

      if (failures.length > 0) {
        showError([`${failures.length}개 파일을 변환하지 못했습니다: ${failures.join(', ')}`]);
      }

      const outputs = items
        .filter((item): item is Item & { output: Blob } => Boolean(item.output))
        .map((item) => ({ name: jpegNameFor(item.file.name, usedNames), blob: item.output }));

      let finalBlob: Blob;
      let finalName: string;

      if (outputs.length === 1) {
        const only = outputs[0] as { name: string; blob: Blob };
        finalBlob = only.blob;
        finalName = only.name;
      } else {
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        for (const output of outputs) zip.file(output.name, output.blob);
        finalBlob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
        finalName = `${safeFileName('heic')}-jpg.zip`;
      }

      resultUrl = URL.createObjectURL(finalBlob);
      if (download) {
        download.href = resultUrl;
        download.download = finalName;
        download.textContent = `결과 내려받기 (${formatBytes(finalBlob.size)})`;
        download.hidden = false;
      }
      if (resultSummary) {
        resultSummary.textContent =
          outputs.length === 1
            ? `JPG 1장 · ${formatBytes(finalBlob.size)}`
            : `${outputs.length}장 · ${formatBytes(finalBlob.size)}`;
      }

      result.hidden = false;
      status.textContent = '완료했습니다. 아래에서 내려받으세요.';
      result.focus({ preventScroll: false });
    } finally {
      convertButton.disabled = false;
      convertButton.removeAttribute('aria-busy');
    }
  };

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
  });

  convertButton.addEventListener('click', () => void doWork(convertButton, convert));

  resetButton?.addEventListener('click', () => {
    for (const item of items) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
    items.length = 0;
    clearResult();
    showError([]);
    status.textContent = '';
    render();
  });

  render();

  window.addEventListener('pagehide', () => {
    for (const item of items) {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
    }
    items.length = 0;
    clearResult();
  });
}
