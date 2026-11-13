import {
  clampRotation,
  fitSealFontSize,
  type SealMode,
  type SealShape,
  sealFileName,
  sealTextLines,
} from '@/lib/seal';

const FONT_FAMILY = 'NanumGothic';
const FONT_URL = '/fonts/NanumGothic-OfficeKit.ttf';
const SIGN_WIDTH = 900;
const SIGN_HEIGHT = 400;

let fontPromise: Promise<boolean> | null = null;

function loadFont(): Promise<boolean> {
  if (fontPromise) return fontPromise;
  fontPromise = (async () => {
    try {
      const face = new FontFace(FONT_FAMILY, `url(${FONT_URL})`, { weight: '800' });
      await face.load();
      document.fonts.add(face);
      return true;
    } catch {
      return false;
    }
  })();
  return fontPromise;
}

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

interface Point {
  x: number;
  y: number;
}

export function initSealMaker(): void {
  const sealRadio = byId<HTMLInputElement>('sm-mode-seal');
  const signRadio = byId<HTMLInputElement>('sm-mode-sign');
  const sealPanel = byId<HTMLElement>('sm-seal-panel');
  const signPanel = byId<HTMLElement>('sm-sign-panel');
  const textInput = byId<HTMLTextAreaElement>('sm-text');
  const shapeSelect = byId<HTMLSelectElement>('sm-shape');
  const colorInput = byId<HTMLInputElement>('sm-color');
  const borderRange = byId<HTMLInputElement>('sm-border');
  const borderValue = byId<HTMLOutputElement>('sm-border-value');
  const rotationRange = byId<HTMLInputElement>('sm-rotation');
  const rotationValue = byId<HTMLOutputElement>('sm-rotation-value');
  const sizeSelect = byId<HTMLSelectElement>('sm-size');
  const penColor = byId<HTMLInputElement>('sm-pen-color');
  const penWidth = byId<HTMLInputElement>('sm-pen-width');
  const penWidthValue = byId<HTMLOutputElement>('sm-pen-width-value');
  const undoButton = byId<HTMLButtonElement>('sm-undo');
  const clearButton = byId<HTMLButtonElement>('sm-clear');
  const stage = byId<HTMLElement>('sm-stage');
  const canvas = byId<HTMLCanvasElement>('sm-canvas');
  const download = byId<HTMLButtonElement>('sm-download');
  const reset = byId<HTMLButtonElement>('sm-reset');
  const status = byId<HTMLElement>('sm-status');
  const error = byId<HTMLElement>('sm-error');

  if (
    !sealRadio ||
    !signRadio ||
    !sealPanel ||
    !signPanel ||
    !textInput ||
    !shapeSelect ||
    !colorInput ||
    !borderRange ||
    !rotationRange ||
    !sizeSelect ||
    !penColor ||
    !penWidth ||
    !stage ||
    !canvas ||
    !download ||
    !reset ||
    !status ||
    !error
  ) {
    return;
  }

  const context = canvas.getContext('2d');
  if (!context) return;

  let mode: SealMode = 'seal';
  let drawing: Point[] | null = null;
  const strokes: Point[][] = [];
  let fontLoaded = false;
  let downloadUrl: string | null = null;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const setStatus = (message: string) => {
    status.textContent = message;
  };

  const syncOutputs = () => {
    if (borderValue) borderValue.textContent = borderRange.value;
    if (rotationValue) rotationValue.textContent = `${rotationRange.value}°`;
    if (penWidthValue) penWidthValue.textContent = penWidth.value;
  };

  const syncDownload = () => {
    const hasContent =
      mode === 'seal'
        ? sealTextLines(textInput.value).length > 0
        : strokes.some((stroke) => stroke.length > 0);
    download.disabled = !hasContent;
  };

  const configureCanvas = () => {
    if (mode === 'seal') {
      const size = Math.max(600, Number(sizeSelect.value) || 1200);
      canvas.width = size;
      canvas.height = size;
      canvas.setAttribute('aria-label', '도장 미리보기');
      stage.dataset.mode = 'seal';
    } else {
      canvas.width = SIGN_WIDTH;
      canvas.height = SIGN_HEIGHT;
      canvas.setAttribute('aria-label', '손글씨 서명 입력판');
      stage.dataset.mode = 'sign';
    }
  };

  const drawSeal = () => {
    const size = canvas.width;
    const ctx = context;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const lines = sealTextLines(textInput.value);
    if (lines.length === 0) {
      syncDownload();
      return;
    }

    const shape = (shapeSelect.value === 'square' ? 'square' : 'circle') as SealShape;
    const color = colorInput.value;
    const border = Math.max(2, Number(borderRange.value) * (size / 800));
    const rotation = clampRotation(Number(rotationRange.value));
    const margin = size * 0.07;

    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.strokeStyle = color;
    ctx.lineWidth = border;

    if (shape === 'circle') {
      ctx.beginPath();
      ctx.arc(0, 0, size / 2 - margin, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      const side = size - margin * 2;
      ctx.strokeRect(-side / 2, -side / 2, side, side);
    }

    const maxWidth = size * (shape === 'circle' ? 0.58 : 0.74);
    const maxHeight = size * (shape === 'circle' ? 0.52 : 0.68);
    const fontSize = fitSealFontSize({
      lines,
      maxWidth,
      maxHeight,
      maxSize: size * 0.34,
      minSize: Math.max(10, size * 0.05),
      measure: (text, candidate) => {
        ctx.font = `800 ${candidate}px "${FONT_FAMILY}", sans-serif`;
        return ctx.measureText(text).width;
      },
    });

    ctx.font = `800 ${fontSize}px "${FONT_FAMILY}", sans-serif`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lineHeight = fontSize * 1.16;
    const startY = -(lineHeight * (lines.length - 1)) / 2;
    lines.forEach((line, index) => {
      ctx.fillText(line, 0, startY + index * lineHeight);
    });
    ctx.restore();
    syncDownload();
  };

  const drawSignature = () => {
    const ctx = context;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor.value;
    ctx.fillStyle = penColor.value;
    ctx.lineWidth = Math.max(1, Number(penWidth.value));

    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      if (stroke.length === 1) {
        const point = stroke[0];
        if (!point) continue;
        ctx.beginPath();
        ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }
      ctx.beginPath();
      const first = stroke[0];
      if (!first) continue;
      ctx.moveTo(first.x, first.y);
      for (const point of stroke.slice(1)) ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    syncDownload();
  };

  const render = () => {
    if (mode === 'seal') drawSeal();
    else drawSignature();
  };

  const setMode = (next: SealMode) => {
    mode = next;
    sealRadio.checked = next === 'seal';
    signRadio.checked = next === 'sign';
    sealPanel.hidden = next !== 'seal';
    signPanel.hidden = next !== 'sign';
    drawing = null;
    configureCanvas();
    render();
    setStatus(next === 'seal' ? '도장 모양을 미리 보고 있습니다.' : '서명판에 직접 그려 보세요.');
  };

  const pointFromEvent = (event: PointerEvent): Point => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const endStroke = (event: PointerEvent) => {
    if (!drawing) return;
    drawing = null;
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    syncDownload();
  };

  canvas.addEventListener('pointerdown', (event) => {
    if (mode !== 'sign' || event.button !== 0) return;
    event.preventDefault();
    canvas.setPointerCapture(event.pointerId);
    const stroke = [pointFromEvent(event)];
    strokes.push(stroke);
    drawing = stroke;
    showError('');
    setStatus('');
    drawSignature();
  });

  canvas.addEventListener('pointermove', (event) => {
    if (!drawing) return;
    event.preventDefault();
    drawing.push(pointFromEvent(event));
    drawSignature();
  });

  canvas.addEventListener('pointerup', endStroke);
  canvas.addEventListener('pointercancel', endStroke);

  sealRadio.addEventListener('change', () => setMode('seal'));
  signRadio.addEventListener('change', () => setMode('sign'));

  textInput.addEventListener('input', () => {
    showError('');
    render();
  });
  shapeSelect.addEventListener('change', render);
  colorInput.addEventListener('input', render);
  borderRange.addEventListener('input', () => {
    syncOutputs();
    render();
  });
  rotationRange.addEventListener('input', () => {
    syncOutputs();
    render();
  });
  sizeSelect.addEventListener('change', () => {
    configureCanvas();
    render();
  });

  penColor.addEventListener('input', () => {
    render();
  });
  penWidth.addEventListener('input', () => {
    syncOutputs();
    render();
  });

  undoButton?.addEventListener('click', () => {
    strokes.pop();
    render();
  });

  clearButton?.addEventListener('click', () => {
    strokes.length = 0;
    render();
  });

  download.addEventListener('click', () => {
    if (download.disabled) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        showError('PNG를 만들지 못했습니다. 다시 시도하세요.');
        return;
      }
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      const url = URL.createObjectURL(blob);
      downloadUrl = url;
      const link = document.createElement('a');
      link.href = url;
      link.download = sealFileName(mode);
      link.click();
      window.setTimeout(() => {
        if (downloadUrl !== url) return;
        URL.revokeObjectURL(url);
        downloadUrl = null;
      }, 1000);
      setStatus(`${link.download} 파일을 만들었습니다.`);
    }, 'image/png');
  });

  reset.addEventListener('click', () => {
    textInput.value = '옷깃';
    shapeSelect.value = 'circle';
    colorInput.value = '#b83a2f';
    borderRange.value = '10';
    rotationRange.value = '0';
    sizeSelect.value = '1200';
    penColor.value = '#111827';
    penWidth.value = '4';
    strokes.length = 0;
    showError('');
    setStatus('');
    syncOutputs();
    setMode('seal');
  });

  syncOutputs();
  setMode('seal');
  textInput.value = '옷깃';
  render();

  void loadFont().then((ok) => {
    fontLoaded = ok;
    if (!ok) setStatus('한글 글꼴을 불러오지 못해 기본 글꼴로 표시합니다.');
    if (fontLoaded) render();
  });

  window.addEventListener('pagehide', () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = null;
    drawing = null;
    strokes.length = 0;
  });
}
