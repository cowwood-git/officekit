import { formatLabel, isHttpUrl, normalizeScan, pushRecent, type ScanResult } from '@/lib/qr-read';

let stream: MediaStream | null = null;
let timer: number | null = null;
let detectorPromise: Promise<BarcodeDetectorLike | null> | null = null;
let recent: ScanResult[] = [];
let previewUrl: string | null = null;
let scanning = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

async function getDetector(): Promise<BarcodeDetectorLike | null> {
  const Ctor = window.BarcodeDetector;
  if (!Ctor) return null;
  if (!detectorPromise) {
    detectorPromise = Ctor.getSupportedFormats()
      .then((formats) => new Ctor({ formats }))
      .catch(() => null);
  }
  return detectorPromise;
}

interface Detected {
  text: string;
  format: string;
}

async function detectCanvas(canvas: HTMLCanvasElement): Promise<Detected | null> {
  const detector = await getDetector();
  if (detector) {
    try {
      const codes = await detector.detect(canvas);
      const first = codes[0];
      if (first?.rawValue) {
        return { text: first.rawValue, format: first.format };
      }
    } catch {
      // BarcodeDetector 실패 시 jsQR로 폴백
    }
  }

  const { default: jsQR } = await import('jsqr');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const code = jsQR(image.data, image.width, image.height, {
    inversionAttempts: 'attemptBoth',
  });
  if (code?.data) return { text: code.data, format: 'qr_code' };
  return null;
}

export function initQrReader(): void {
  const input = byId<HTMLInputElement>('qrr-input');
  const drop = byId<HTMLElement>('qrr-drop');
  const preview = byId<HTMLImageElement>('qrr-preview');
  const imagePanel = byId<HTMLElement>('qrr-image-panel');
  const cameraPanel = byId<HTMLElement>('qrr-camera-panel');
  const video = byId<HTMLVideoElement>('qrr-video');
  const startButton = byId<HTMLButtonElement>('qrr-start');
  const stopButton = byId<HTMLButtonElement>('qrr-stop');
  const modeButtons = byId<HTMLElement>('qrr-modes');
  const result = byId<HTMLElement>('qrr-result');
  const resultText = byId<HTMLElement>('qrr-result-text');
  const resultFormat = byId<HTMLElement>('qrr-format');
  const openLink = byId<HTMLAnchorElement>('qrr-open');
  const copyButton = byId<HTMLButtonElement>('qrr-copy');
  const clearButton = byId<HTMLButtonElement>('qrr-clear');
  const scanButton = byId<HTMLButtonElement>('qrr-scan');
  const recentList = byId<HTMLUListElement>('qrr-recent');
  const status = byId<HTMLElement>('qrr-status');
  const error = byId<HTMLElement>('qrr-error');

  if (
    !input ||
    !drop ||
    !imagePanel ||
    !cameraPanel ||
    !video ||
    !startButton ||
    !result ||
    !status ||
    !error
  ) {
    return;
  }

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const stopCamera = () => {
    if (timer !== null) {
      window.clearInterval(timer);
      timer = null;
    }
    for (const track of stream?.getTracks() ?? []) track.stop();
    stream = null;
    video.srcObject = null;
    if (stopButton) stopButton.hidden = true;
    if (startButton) startButton.hidden = false;
  };

  const renderRecent = () => {
    if (!recentList) return;
    recentList.replaceChildren();
    if (recent.length === 0) {
      const li = document.createElement('li');
      li.className = 'muted';
      li.textContent = '아직 인식한 코드가 없습니다.';
      recentList.append(li);
      return;
    }
    for (const item of recent) {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'recent-item';
      const text = document.createElement('span');
      text.textContent = item.text.length > 60 ? `${item.text.slice(0, 60)}…` : item.text;
      const badge = document.createElement('em');
      badge.textContent = formatLabel(item.format);
      button.append(text, badge);
      button.addEventListener('click', () => showResult(item.text, item.format, false));
      li.append(button);
      recentList.append(li);
    }
  };

  const showResult = (raw: string, format: string, addRecent = true) => {
    const text = normalizeScan(raw);
    if (!text) return;
    if (resultText) resultText.textContent = text;
    if (resultFormat) resultFormat.textContent = formatLabel(format);
    if (openLink) {
      const safe = isHttpUrl(text);
      openLink.hidden = !safe;
      if (safe) {
        openLink.href = text;
        openLink.rel = 'noopener noreferrer';
      } else {
        openLink.removeAttribute('href');
      }
    }
    result.hidden = false;
    if (addRecent) {
      recent = pushRecent(recent, { text, format, at: Date.now() });
      renderRecent();
    }
    status.textContent = '코드를 인식했습니다.';
  };

  const setMode = (mode: 'image' | 'camera') => {
    imagePanel.hidden = mode !== 'image';
    cameraPanel.hidden = mode !== 'camera';
    modeButtons?.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset.mode === mode ? 'true' : 'false');
    });
    if (mode !== 'camera') stopCamera();
  };

  let pendingFile: File | null = null;

  /** 파일을 고르면 미리보기만 하고, 인식은 [인식하기]를 눌러야 한다. */
  const selectFile = (file: File) => {
    showError('');
    if (!file.type.startsWith('image/')) {
      showError('이미지 파일만 사용할 수 있습니다.');
      return;
    }
    pendingFile = file;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    if (preview) {
      preview.src = previewUrl;
      preview.hidden = false;
    }
    if (result) result.hidden = true;
    if (scanButton) {
      scanButton.hidden = false;
      scanButton.disabled = false;
    }
    status.textContent = `${file.name} · [인식하기]를 누르세요.`;
  };

  const scanFile = async (file: File) => {
    showError('');
    status.textContent = '이미지를 분석하는 중…';
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();

      const detected = await detectCanvas(canvas);
      if (detected) {
        showResult(detected.text, detected.format);
      } else {
        showError('코드를 찾지 못했습니다. QR이 크게 보이도록 자른 뒤 다시 시도하세요.');
        status.textContent = '';
      }
    } catch (cause) {
      console.error(cause);
      showError('이미지를 읽지 못했습니다.');
      status.textContent = '';
    }
  };

  const startCamera = async () => {
    showError('');
    status.textContent = '카메라를 여는 중…';
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
      video.srcObject = stream;
      await video.play();
      if (startButton) startButton.hidden = true;
      if (stopButton) stopButton.hidden = false;
      status.textContent = '카메라를 비추면 자동으로 인식합니다.';

      const canvas = document.createElement('canvas');
      timer = window.setInterval(() => {
        if (!stream || scanning || video.readyState < 2) return;
        const scale = Math.min(1, 1280 / Math.max(video.videoWidth, video.videoHeight));
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) return;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        scanning = true;
        void detectCanvas(canvas)
          .then((detected) => {
            if (!detected) return;
            stopCamera();
            showResult(detected.text, detected.format);
          })
          .finally(() => {
            scanning = false;
          });
      }, 250);
    } catch (cause) {
      console.error(cause);
      const name = cause instanceof Error ? cause.name : '';
      showError(
        name === 'NotAllowedError'
          ? '카메라 권한이 거부되었습니다. 브라우저 주소창의 권한 설정에서 허용해 주세요.'
          : name === 'NotFoundError'
            ? '사용할 수 있는 카메라를 찾지 못했습니다.'
            : '카메라를 열지 못했습니다. HTTPS 또는 localhost에서 사용하세요.',
      );
      status.textContent = '';
      stopCamera();
    }
  };

  modeButtons?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const mode = target.dataset.mode;
    if (mode === 'image' || mode === 'camera') setMode(mode);
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
    if (file) selectFile(file);
  });

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) selectFile(file);
    input.value = '';
  });

  scanButton?.addEventListener('click', async () => {
    if (!pendingFile || scanButton.disabled) return;
    scanButton.disabled = true;
    scanButton.setAttribute('aria-busy', 'true');
    try {
      await scanFile(pendingFile);
    } finally {
      scanButton.disabled = false;
      scanButton.removeAttribute('aria-busy');
    }
  });

  startButton.addEventListener('click', () => void startCamera());
  stopButton?.addEventListener('click', () => {
    stopCamera();
    status.textContent = '카메라를 중지했습니다.';
  });

  copyButton?.addEventListener('click', async () => {
    const text = resultText?.textContent ?? '';
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      copyButton.textContent = '복사됨';
      window.setTimeout(() => {
        copyButton.textContent = '복사';
      }, 1500);
    } catch {
      showError('자동 복사가 차단되었습니다. 결과를 선택해 복사하세요.');
    }
  });

  clearButton?.addEventListener('click', () => {
    result.hidden = true;
    recent = [];
    renderRecent();
    if (preview) preview.hidden = true;
    showError('');
    status.textContent = '';
  });

  window.addEventListener('pagehide', stopCamera);
  setMode('image');
  renderRecent();
  status.textContent = '이미지를 올리거나 카메라를 켜세요.';
}
