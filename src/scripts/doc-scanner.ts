import { doWork } from '@/lib/do-work';
import {
  applyScanFilter,
  defaultQuad,
  fitWithin,
  isConvexQuad,
  MAX_SOURCE_SIDE,
  outputSize,
  type PaperMode,
  type Point,
  pdfPlacement,
  type Quad,
  type ScanFilter,
  scanFileName,
  warpQuad,
} from '@/lib/doc-scan';
import { formatBytes } from '@/lib/files';
import { heicAsReadable } from './heic-file';
import { bindDrop, byId, canvasBlob, errorSetter, zipBlob } from './kit';

/**
 * 문서 스캐너 — 사진에서 문서의 네 모서리를 손가락·마우스로 맞추면
 * 반듯하게 펴고 종이처럼 다듬어 PDF(또는 JPG)로 저장한다.
 * 화면에는 줄인 사본만 들고 있고, 원본은 저장할 때 한 장씩 다시 읽는다(휴대폰 메모리).
 */
const EDIT_SIDE = 1400;
const PREVIEW_SIDE = 700;
const MAX_PAGES = 40;
const HANDLE_CSS = 11;
const HIT_CSS = 34;

interface Page {
  file: File;
  /** 편집용으로 줄인 사진 */
  edit: HTMLCanvasElement;
  /** 0~1 비율 좌표 */
  quad: Quad;
  rotation: number;
  thumb: string;
}

function drawScaled(source: CanvasImageSource, width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('캔버스를 쓸 수 없습니다.');
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, width, height);
  return canvas;
}

async function decode(file: File, maxSide: number): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  try {
    const size = fitWithin(bitmap.width, bitmap.height, maxSide);
    return drawScaled(bitmap, size.width, size.height);
  } finally {
    bitmap.close();
  }
}

const toPixels = (quad: Quad, width: number, height: number): Quad =>
  quad.map((p) => ({ x: p.x * width, y: p.y * height })) as Quad;

/** 펴기 → 다듬기 → 돌리기. 결과 캔버스를 돌려준다. */
function process(
  source: HTMLCanvasElement,
  quadRatio: Quad,
  filter: ScanFilter,
  paper: PaperMode,
  rotation: number,
  maxSide: number,
): HTMLCanvasElement {
  const context = source.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('캔버스를 쓸 수 없습니다.');
  const pixels = context.getImageData(0, 0, source.width, source.height);
  const quad = toPixels(quadRatio, source.width, source.height);
  const size = outputSize(quad, paper, maxSide);
  const data = warpQuad(pixels, quad, size.width, size.height);
  applyScanFilter(data, size.width, size.height, filter);
  const flat = document.createElement('canvas');
  flat.width = size.width;
  flat.height = size.height;
  flat.getContext('2d')?.putImageData(new ImageData(data, size.width, size.height), 0, 0);
  const turns = ((rotation % 4) + 4) % 4;
  if (turns === 0) return flat;
  const turned = document.createElement('canvas');
  const sideways = turns % 2 === 1;
  turned.width = sideways ? size.height : size.width;
  turned.height = sideways ? size.width : size.height;
  const out = turned.getContext('2d');
  if (!out) return flat;
  out.translate(turned.width / 2, turned.height / 2);
  out.rotate((turns * Math.PI) / 2);
  out.drawImage(flat, -size.width / 2, -size.height / 2);
  return turned;
}

export function initDocScanner(): void {
  const input = byId<HTMLInputElement>('ds-input');
  const camera = byId<HTMLInputElement>('ds-camera');
  const more = byId<HTMLInputElement>('ds-more');
  const drop = byId<HTMLElement>('ds-drop');
  const panel = byId<HTMLElement>('ds-panel');
  const status = byId<HTMLElement>('ds-status');
  const errorBox = byId<HTMLElement>('ds-error');
  const editor = byId<HTMLCanvasElement>('ds-editor');
  const preview = byId<HTMLCanvasElement>('ds-preview');
  const warn = byId<HTMLElement>('ds-warn');
  const filterSelect = byId<HTMLSelectElement>('ds-filter');
  const paperSelect = byId<HTMLSelectElement>('ds-paper');
  const formatSelect = byId<HTMLSelectElement>('ds-format');
  const resetCorners = byId<HTMLButtonElement>('ds-corners');
  const rotate = byId<HTMLButtonElement>('ds-rotate');
  const list = byId<HTMLOListElement>('ds-pages');
  const save = byId<HTMLButtonElement>('ds-save');
  const clear = byId<HTMLButtonElement>('ds-clear');
  const result = byId<HTMLElement>('ds-result');
  const resultNote = byId<HTMLElement>('ds-result-note');
  const download = byId<HTMLAnchorElement>('ds-download');
  if (!input || !drop || !panel || !status || !errorBox || !editor || !preview || !list || !save)
    return;

  const showError = errorSetter(errorBox);
  const pages: Page[] = [];
  let current = -1;
  let dragging = -1;
  let selected = 0;
  let resultUrl: string | null = null;
  let previewTimer = 0;

  const filter = () => (filterSelect?.value as ScanFilter) || 'document';
  const paper = () => (paperSelect?.value as PaperMode) || 'a4';
  const page = () => pages[current];

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    if (result) result.hidden = true;
  };

  /** 화면 1px 이 캔버스 몇 px 인지 */
  const cssScale = () => {
    const rect = editor.getBoundingClientRect();
    return rect.width ? editor.width / rect.width : 1;
  };

  const drawEditor = () => {
    const item = page();
    const context = editor.getContext('2d');
    if (!item || !context) return;
    const { edit } = item;
    if (editor.width !== edit.width || editor.height !== edit.height) {
      editor.width = edit.width;
      editor.height = edit.height;
    }
    const quad = toPixels(item.quad, edit.width, edit.height);
    const s = cssScale();
    context.drawImage(edit, 0, 0);
    // 고른 영역 밖은 어둡게
    context.save();
    context.beginPath();
    context.rect(0, 0, edit.width, edit.height);
    context.moveTo(quad[0].x, quad[0].y);
    for (const p of [quad[3], quad[2], quad[1]]) context.lineTo(p.x, p.y);
    context.closePath();
    context.fillStyle = 'rgba(10, 20, 30, 0.45)';
    context.fill('evenodd');
    context.restore();
    context.lineWidth = 2.5 * s;
    context.strokeStyle = isConvexQuad(quad) ? '#12a5b8' : '#e5484d';
    context.beginPath();
    context.moveTo(quad[0].x, quad[0].y);
    for (const p of quad.slice(1)) context.lineTo(p.x, p.y);
    context.closePath();
    context.stroke();
    quad.forEach((p, index) => {
      context.beginPath();
      context.arc(p.x, p.y, HANDLE_CSS * s, 0, Math.PI * 2);
      context.fillStyle = index === dragging || index === selected ? '#12a5b8' : '#ffffff';
      context.fill();
      context.lineWidth = 2.5 * s;
      context.strokeStyle = '#0b7d8c';
      context.stroke();
    });
    // 끄는 동안 손가락에 가린 곳을 돋보기로 보여 준다(점 반대편 위 모서리).
    if (dragging >= 0) {
      const p = quad[dragging] as Point;
      const radius = 62 * s;
      const zoom = 2.5;
      const cx = p.x < edit.width / 2 ? edit.width - radius - 12 * s : radius + 12 * s;
      const cy = radius + 12 * s;
      context.save();
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.clip();
      context.fillStyle = '#ffffff';
      context.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
      const half = radius / zoom;
      context.drawImage(
        edit,
        p.x - half,
        p.y - half,
        half * 2,
        half * 2,
        cx - radius,
        cy - radius,
        radius * 2,
        radius * 2,
      );
      context.strokeStyle = '#e5484d';
      context.lineWidth = 1.5 * s;
      context.beginPath();
      context.moveTo(cx - 12 * s, cy);
      context.lineTo(cx + 12 * s, cy);
      context.moveTo(cx, cy - 12 * s);
      context.lineTo(cx, cy + 12 * s);
      context.stroke();
      context.restore();
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.lineWidth = 3 * s;
      context.strokeStyle = '#ffffff';
      context.stroke();
    }
    if (warn) warn.hidden = isConvexQuad(quad);
  };

  const renderPreview = () => {
    const item = page();
    if (!item) return;
    const quad = toPixels(item.quad, item.edit.width, item.edit.height);
    if (!isConvexQuad(quad)) return;
    try {
      const out = process(item.edit, item.quad, filter(), paper(), item.rotation, PREVIEW_SIDE);
      preview.width = out.width;
      preview.height = out.height;
      preview.getContext('2d')?.drawImage(out, 0, 0);
      const thumb = drawScaled(out, ...thumbSize(out));
      item.thumb = thumb.toDataURL('image/jpeg', 0.7);
      const img = list.querySelector<HTMLImageElement>(`[data-index="${current}"] img`);
      if (img) img.src = item.thumb;
    } catch {
      // 모서리가 한 줄에 놓이는 등 펼 수 없는 순간은 건너뛴다.
    }
  };

  const thumbSize = (canvas: HTMLCanvasElement): [number, number] => {
    const size = fitWithin(canvas.width, canvas.height, 160);
    return [size.width, size.height];
  };

  const schedulePreview = () => {
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(renderPreview, 60);
  };

  const renderList = () => {
    list.replaceChildren(
      ...pages.map((item, index) => {
        const li = document.createElement('li');
        li.dataset.index = String(index);
        li.className = index === current ? 'ds-page is-current' : 'ds-page';
        const pick = document.createElement('button');
        pick.type = 'button';
        pick.className = 'ds-pick';
        pick.setAttribute('aria-label', `${index + 1}쪽 편집`);
        if (index === current) pick.setAttribute('aria-current', 'true');
        const img = document.createElement('img');
        img.alt = '';
        img.src = item.thumb;
        const label = document.createElement('span');
        label.textContent = `${index + 1}쪽`;
        pick.append(img, label);
        pick.addEventListener('click', () => select(index));
        const tools = document.createElement('div');
        tools.className = 'ds-page-tools';
        const button = (text: string, aria: string, action: () => void, disabled = false) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = text;
          b.setAttribute('aria-label', aria);
          b.disabled = disabled;
          b.addEventListener('click', action);
          return b;
        };
        tools.append(
          button('◀', `${index + 1}쪽 앞으로`, () => move(index, -1), index === 0),
          button('▶', `${index + 1}쪽 뒤로`, () => move(index, 1), index === pages.length - 1),
          button('✕', `${index + 1}쪽 삭제`, () => remove(index)),
        );
        li.append(pick, tools);
        return li;
      }),
    );
    save.textContent =
      formatSelect?.value === 'jpg'
        ? `JPG로 저장 (${pages.length}장)`
        : `PDF로 저장 (${pages.length}쪽)`;
  };

  const select = (index: number) => {
    current = index;
    selected = 0;
    renderList();
    drawEditor();
    renderPreview();
  };

  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= pages.length) return;
    const [item] = pages.splice(index, 1);
    if (item) pages.splice(target, 0, item);
    if (current === index) current = target;
    else if (current === target) current = index;
    clearResult();
    renderList();
  };

  const remove = (index: number) => {
    pages.splice(index, 1);
    clearResult();
    if (pages.length === 0) {
      reset();
      return;
    }
    current = Math.min(current >= index ? current - 1 : current, pages.length - 1);
    select(Math.max(0, current));
  };

  const reset = () => {
    pages.length = 0;
    current = -1;
    clearResult();
    panel.hidden = true;
    drop.hidden = false;
    status.textContent = '';
    list.replaceChildren();
  };

  const add = async (files: File[]) => {
    showError('');
    clearResult();
    const images = files.filter(
      (file) => file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name),
    );
    if (images.length === 0) {
      showError('사진 파일(JPG·PNG·WebP·HEIC)을 넣어 주세요.');
      return;
    }
    const room = MAX_PAGES - pages.length;
    if (room <= 0) {
      showError(`한 번에 ${MAX_PAGES}쪽까지 만들 수 있습니다.`);
      return;
    }
    const used = new Set<string>();
    const first = pages.length;
    for (const [index, original] of images.slice(0, room).entries()) {
      status.textContent = `사진을 여는 중… (${index + 1}/${Math.min(images.length, room)})`;
      try {
        const file = await heicAsReadable(original, used);
        const edit = await decode(file, EDIT_SIDE);
        const quad = defaultQuad(1, 1);
        pages.push({
          file,
          edit,
          quad,
          rotation: 0,
          thumb: drawScaled(edit, ...thumbSize(edit)).toDataURL('image/jpeg', 0.7),
        });
      } catch {
        showError(`${original.name}: 사진을 열지 못했습니다.`);
      }
    }
    if (images.length > room) showError(`${MAX_PAGES}쪽을 넘는 사진은 빼고 넣었습니다.`);
    status.textContent = '';
    if (pages.length === first) return;
    drop.hidden = true;
    panel.hidden = false;
    select(first);
    editor.focus({ preventScroll: true });
  };

  // ── 모서리 끌기 ──
  const pointAt = (event: PointerEvent): Point => {
    const rect = editor.getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)),
    };
  };

  editor.addEventListener('pointerdown', (event) => {
    const item = page();
    if (!item) return;
    const rect = editor.getBoundingClientRect();
    const at = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    let best = -1;
    let bestDist = HIT_CSS;
    item.quad.forEach((p, index) => {
      const d = Math.hypot(p.x * rect.width - at.x, p.y * rect.height - at.y);
      if (d < bestDist) {
        bestDist = d;
        best = index;
      }
    });
    if (best < 0) return;
    event.preventDefault();
    dragging = best;
    selected = best;
    editor.setPointerCapture(event.pointerId);
    drawEditor();
  });

  editor.addEventListener('pointermove', (event) => {
    const item = page();
    if (!item || dragging < 0) return;
    item.quad[dragging] = pointAt(event);
    drawEditor();
  });

  const endDrag = () => {
    if (dragging < 0) return;
    dragging = -1;
    clearResult();
    drawEditor();
    schedulePreview();
  };
  editor.addEventListener('pointerup', endDrag);
  editor.addEventListener('pointercancel', endDrag);

  editor.addEventListener('keydown', (event) => {
    const item = page();
    if (!item) return;
    if (/^[1-4]$/.test(event.key)) {
      selected = Number(event.key) - 1;
      drawEditor();
      event.preventDefault();
      return;
    }
    const step = event.shiftKey ? 0.002 : 0.01;
    const delta: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const d = delta[event.key];
    if (!d) return;
    event.preventDefault();
    const p = item.quad[selected] as Point;
    item.quad[selected] = {
      x: Math.min(1, Math.max(0, p.x + d[0])),
      y: Math.min(1, Math.max(0, p.y + d[1])),
    };
    clearResult();
    drawEditor();
    schedulePreview();
  });

  window.addEventListener('resize', () => drawEditor());

  resetCorners?.addEventListener('click', () => {
    const item = page();
    if (!item) return;
    item.quad = defaultQuad(1, 1, 0);
    clearResult();
    drawEditor();
    renderPreview();
  });

  rotate?.addEventListener('click', () => {
    const item = page();
    if (!item) return;
    item.rotation = (item.rotation + 1) % 4;
    clearResult();
    renderPreview();
  });

  for (const control of [filterSelect, paperSelect]) {
    control?.addEventListener('change', () => {
      clearResult();
      renderPreview();
    });
  }
  formatSelect?.addEventListener('change', () => {
    clearResult();
    renderList();
  });

  // ── 저장 ──
  const run = async () => {
    showError('');
    clearResult();
    const bad = pages.findIndex(
      (item) => !isConvexQuad(toPixels(item.quad, item.edit.width, item.edit.height)),
    );
    if (bad >= 0) {
      showError(`${bad + 1}쪽의 모서리가 꼬였습니다. 네 점을 문서 모서리에 순서대로 맞춰 주세요.`);
      select(bad);
      return;
    }
    const asJpg = formatSelect?.value === 'jpg';
    const outputs: Blob[] = [];
    try {
      for (const [index, item] of pages.entries()) {
        status.textContent = `${index + 1}/${pages.length}쪽 펴는 중…`;
        const full = await decode(item.file, MAX_SOURCE_SIDE);
        const out = process(
          full,
          item.quad,
          filter(),
          paper(),
          item.rotation,
          Number.POSITIVE_INFINITY,
        );
        outputs.push(await canvasBlob(out, 'image/jpeg', filter() === 'bw' ? 0.8 : 0.85));
        full.width = 0;
        out.width = 0;
      }
      let blob: Blob;
      let name: string;
      const date = new Date();
      if (asJpg) {
        if (outputs.length === 1) {
          blob = outputs[0] as Blob;
          name = scanFileName(date, 'jpg');
        } else {
          blob = await zipBlob(
            outputs.map((data, index) => ({ name: scanFileName(date, 'jpg', index + 1), data })),
          );
          name = scanFileName(date, 'zip');
        }
      } else {
        status.textContent = 'PDF로 묶는 중…';
        const { PDFDocument } = await import('pdf-lib');
        const pdf = await PDFDocument.create();
        pdf.setProducer('옷깃 문서 스캐너');
        for (const data of outputs) {
          const image = await pdf.embedJpg(new Uint8Array(await data.arrayBuffer()));
          const place = pdfPlacement(image.width, image.height, paper());
          pdf.addPage(place.page).drawImage(image, {
            x: place.x,
            y: place.y,
            width: place.width,
            height: place.height,
          });
        }
        blob = new Blob([new Uint8Array(await pdf.save())], { type: 'application/pdf' });
        name = scanFileName(date, 'pdf');
      }
      resultUrl = URL.createObjectURL(blob);
      if (download) {
        download.href = resultUrl;
        download.download = name;
        download.textContent = `${name} 내려받기`;
      }
      if (resultNote) {
        resultNote.textContent = `${pages.length}${asJpg ? '장' : '쪽'} · ${formatBytes(blob.size)}`;
      }
      status.textContent = '';
      if (result) {
        result.hidden = false;
        result.focus({ preventScroll: false });
      }
    } catch (error) {
      status.textContent = '';
      showError(error instanceof Error ? error.message : '저장하지 못했습니다.');
    }
  };

  save.addEventListener('click', () => void doWork(save, run));
  clear?.addEventListener('click', reset);

  bindDrop(input, drop, (files) => void add(files));
  for (const extra of [camera, more]) {
    extra?.addEventListener('change', () => {
      const files = Array.from(extra.files ?? []);
      extra.value = '';
      if (files.length) void add(files);
    });
  }
  panel.addEventListener('dragover', (event) => event.preventDefault());
  panel.addEventListener('drop', (event) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer?.files ?? []);
    if (files.length) void add(files);
  });

  window.addEventListener('pagehide', reset);
}
