import { doWork } from '@/lib/do-work';
import { formatBytes } from '@/lib/files';
import {
  estimateSeconds,
  frameDelay,
  frameTimes,
  GIF_MAX_IMAGES,
  GIF_MAX_VIDEO_SECONDS,
  gifFileName,
  gifSize,
} from '@/lib/gif';
import { heicAsReadable } from './heic-file';

/** GIF 만들기 — 여러 장의 이미지 또는 짧은 영상 구간을 움직이는 GIF 로. */
function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

type Mode = 'images' | 'video';

const nextFrame = () => new Promise((resolve) => requestAnimationFrame(resolve));

function seek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const done = () => {
      video.removeEventListener('seeked', done);
      video.removeEventListener('error', fail);
      resolve();
    };
    const fail = () => {
      video.removeEventListener('seeked', done);
      reject(new Error('영상을 읽을 수 없습니다.'));
    };
    video.addEventListener('seeked', done);
    video.addEventListener('error', fail);
    video.currentTime = time;
  });
}

export function initGifMaker(): void {
  const input = byId<HTMLInputElement>('gm-input');
  const drop = byId<HTMLElement>('gm-drop');
  const panel = byId<HTMLElement>('gm-panel');
  const error = byId<HTMLElement>('gm-error');
  const status = byId<HTMLElement>('gm-status');
  const list = byId<HTMLElement>('gm-list');
  const imageOptions = byId<HTMLElement>('gm-image-options');
  const videoOptions = byId<HTMLElement>('gm-video-options');
  const video = byId<HTMLVideoElement>('gm-video');
  const delay = byId<HTMLInputElement>('gm-delay');
  const start = byId<HTMLInputElement>('gm-start');
  const length = byId<HTMLInputElement>('gm-length');
  const fps = byId<HTMLSelectElement>('gm-fps');
  const width = byId<HTMLSelectElement>('gm-width');
  const loop = byId<HTMLInputElement>('gm-loop');
  const summary = byId<HTMLElement>('gm-summary');
  const apply = byId<HTMLButtonElement>('gm-apply');
  const reset = byId<HTMLButtonElement>('gm-reset');
  const result = byId<HTMLElement>('gm-result');
  const resultImage = byId<HTMLImageElement>('gm-result-image');
  const resultNote = byId<HTMLElement>('gm-result-note');
  const download = byId<HTMLAnchorElement>('gm-download');
  if (!input || !drop || !panel || !apply || !error || !status || !video) return;

  let mode: Mode = 'images';
  let images: { name: string; bitmap: ImageBitmap; url: string }[] = [];
  let videoFile: File | null = null;
  let videoUrl: string | null = null;
  let resultUrl: string | null = null;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    if (result) result.hidden = true;
  };

  const updateSummary = () => {
    if (!summary) return;
    if (mode === 'images') {
      const ms = Number(delay?.value ?? 500);
      summary.textContent = `${images.length}장 · 한 장에 ${frameDelay(ms) / 1000}초 · 한 바퀴 ${estimateSeconds(images.length, ms)}초`;
    } else {
      const times = frameTimes(
        Number(start?.value ?? 0),
        Number(length?.value ?? 3),
        Number(fps?.value ?? 10),
        video.duration || 0,
      );
      summary.textContent = `${times.length}프레임 · 약 ${Math.round((times.length / Number(fps?.value ?? 10)) * 10) / 10}초`;
    }
  };

  const renderList = () => {
    if (!list) return;
    list.replaceChildren(
      ...images.map((item, index) => {
        const li = document.createElement('li');
        const img = document.createElement('img');
        img.src = item.url;
        img.alt = item.name;
        const label = document.createElement('span');
        label.textContent = String(index + 1);
        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'gm-remove';
        remove.setAttribute('aria-label', `${item.name} 빼기`);
        remove.textContent = '×';
        remove.addEventListener('click', () => {
          URL.revokeObjectURL(item.url);
          item.bitmap.close();
          images = images.filter((other) => other !== item);
          clearResult();
          renderList();
        });
        const left = document.createElement('button');
        left.type = 'button';
        left.className = 'gm-move';
        left.setAttribute('aria-label', `${item.name} 앞으로`);
        left.textContent = '‹';
        left.disabled = index === 0;
        left.addEventListener('click', () => {
          const copy = images.slice();
          [copy[index - 1], copy[index]] = [copy[index] as never, copy[index - 1] as never];
          images = copy;
          clearResult();
          renderList();
        });
        li.append(img, label, left, remove);
        return li;
      }),
    );
    updateSummary();
  };

  const setMode = (next: Mode) => {
    mode = next;
    if (imageOptions) imageOptions.hidden = next !== 'images';
    if (videoOptions) videoOptions.hidden = next !== 'video';
    if (list) list.hidden = next !== 'images';
    video.hidden = next !== 'video';
  };

  const addFiles = async (files: File[]) => {
    showError('');
    clearResult();
    const videoPick = files.find((file) => file.type.startsWith('video/'));
    if (videoPick) {
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      videoFile = videoPick;
      videoUrl = URL.createObjectURL(videoPick);
      video.src = videoUrl;
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => resolve();
      });
      if (!video.duration || !Number.isFinite(video.duration)) {
        showError('이 영상 형식은 브라우저에서 열 수 없습니다. MP4(H.264)·WebM으로 시도하세요.');
        return;
      }
      if (start) start.max = String(Math.max(0, Math.floor(video.duration)));
      setMode('video');
      drop.hidden = true;
      panel.hidden = false;
      status.textContent = `영상 ${Math.round(video.duration * 10) / 10}초 · 최대 ${GIF_MAX_VIDEO_SECONDS}초 구간을 GIF로 만듭니다.`;
      updateSummary();
      return;
    }
    const pics = files.filter(
      (file) => file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name),
    );
    if (pics.length === 0) {
      showError('이미지(JPG·PNG·WebP·HEIC) 또는 영상(MP4·WebM)을 넣어 주세요.');
      return;
    }
    if (images.length + pics.length > GIF_MAX_IMAGES) {
      showError(`이미지는 최대 ${GIF_MAX_IMAGES}장까지 넣을 수 있습니다.`);
      return;
    }
    status.textContent = '이미지를 읽는 중…';
    for (const file of pics.sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true }))) {
      try {
        const readable = await heicAsReadable(file);
        const bitmap = await createImageBitmap(readable, { imageOrientation: 'from-image' });
        images.push({ name: file.name, bitmap, url: URL.createObjectURL(readable) });
      } catch {
        showError(`${file.name}을(를) 읽을 수 없어 뺐습니다.`);
      }
    }
    setMode('images');
    drop.hidden = true;
    panel.hidden = false;
    status.textContent =
      '순서를 확인하고 GIF 만들기를 누르세요. 이미지를 더 끌어다 놓으면 뒤에 붙습니다.';
    renderList();
  };

  const encode = async (
    frames: AsyncIterable<CanvasRenderingContext2D>,
    w: number,
    h: number,
    ms: number,
  ) => {
    const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
    const encoder = GIFEncoder();
    let count = 0;
    for await (const context of frames) {
      const { data } = context.getImageData(0, 0, w, h);
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      encoder.writeFrame(index, w, h, {
        palette,
        delay: frameDelay(ms),
        repeat: loop?.checked === false ? -1 : 0,
      });
      count += 1;
      if (count % 5 === 0) await nextFrame();
    }
    encoder.finish();
    return { bytes: encoder.bytes(), count };
  };

  const run = async () => {
    showError('');
    clearResult();
    const maxWidth = Number(width?.value ?? 480);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    if (!context) return;
    try {
      let output: { bytes: Uint8Array; count: number };
      let size: { width: number; height: number };
      let ms: number;
      if (mode === 'images') {
        const first = images[0];
        if (!first) {
          showError('이미지를 두 장 이상 넣어 주세요.');
          return;
        }
        size = gifSize(first.bitmap.width, first.bitmap.height, maxWidth);
        canvas.width = size.width;
        canvas.height = size.height;
        ms = Number(delay?.value ?? 500);
        const items = images;
        output = await encode(
          (async function* () {
            for (const item of items) {
              // 크기가 다른 이미지는 첫 장 틀 안에 비율을 지켜 가운데 놓는다.
              context.fillStyle = '#ffffff';
              context.fillRect(0, 0, size.width, size.height);
              const scale = Math.min(
                size.width / item.bitmap.width,
                size.height / item.bitmap.height,
              );
              const dw = item.bitmap.width * scale;
              const dh = item.bitmap.height * scale;
              context.drawImage(item.bitmap, (size.width - dw) / 2, (size.height - dh) / 2, dw, dh);
              yield context;
            }
          })(),
          size.width,
          size.height,
          ms,
        );
      } else {
        const rate = Number(fps?.value ?? 10);
        const times = frameTimes(
          Number(start?.value ?? 0),
          Number(length?.value ?? 3),
          rate,
          video.duration,
        );
        size = gifSize(video.videoWidth, video.videoHeight, maxWidth);
        canvas.width = size.width;
        canvas.height = size.height;
        ms = 1000 / rate;
        video.pause();
        output = await encode(
          (async function* () {
            for (const time of times) {
              await seek(video, time);
              context.drawImage(video, 0, 0, size.width, size.height);
              yield context;
            }
          })(),
          size.width,
          size.height,
          ms,
        );
      }
      const blob = new Blob([new Uint8Array(output.bytes)], { type: 'image/gif' });
      resultUrl = URL.createObjectURL(blob);
      if (resultImage) resultImage.src = resultUrl;
      if (download) {
        download.href = resultUrl;
        download.download = gifFileName(mode === 'video' ? videoFile?.name : undefined);
        download.textContent = `GIF 내려받기 (${formatBytes(blob.size)})`;
      }
      if (resultNote) {
        resultNote.textContent = `${size.width}×${size.height}px · ${output.count}프레임 · ${formatBytes(blob.size)}${blob.size > 10 * 1024 * 1024 ? ' — 용량이 큽니다. 가로 크기나 초당 장면 수를 줄여 보세요.' : ''}`;
      }
      if (result) result.hidden = false;
    } catch (cause) {
      console.error(cause);
      showError('GIF를 만들지 못했습니다. 크기를 줄여 다시 시도하세요.');
    }
  };

  input.addEventListener('change', () => {
    const files = Array.from(input.files ?? []);
    if (files.length) void addFiles(files);
    input.value = '';
  });
  for (const target of [drop, panel]) {
    target.addEventListener('dragover', (event) => {
      event.preventDefault();
      drop.dataset.drag = 'true';
    });
    target.addEventListener('dragleave', () => {
      drop.dataset.drag = 'false';
    });
    target.addEventListener('drop', (event) => {
      event.preventDefault();
      drop.dataset.drag = 'false';
      const files = Array.from(event.dataTransfer?.files ?? []);
      if (files.length) void addFiles(files);
    });
  }
  for (const control of [delay, start, length, fps]) {
    control?.addEventListener('input', () => {
      clearResult();
      updateSummary();
    });
  }
  start?.addEventListener('change', () => {
    if (mode === 'video') video.currentTime = Number(start.value) || 0;
  });
  apply.addEventListener('click', () => void doWork(apply, run));
  reset?.addEventListener('click', () => {
    clearResult();
    for (const item of images) {
      URL.revokeObjectURL(item.url);
      item.bitmap.close();
    }
    images = [];
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    videoUrl = null;
    videoFile = null;
    video.removeAttribute('src');
    renderList();
    panel.hidden = true;
    drop.hidden = false;
    status.textContent = '';
    showError('');
  });

  window.addEventListener('pagehide', () => {
    clearResult();
    for (const item of images) {
      URL.revokeObjectURL(item.url);
      item.bitmap.close();
    }
    images = [];
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    videoUrl = null;
    videoFile = null;
    video.removeAttribute('src');
  });
}
