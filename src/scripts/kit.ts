/** 새 도구(2026-11)가 같이 쓰는 작은 도우미: 파일 넣기 연결, 복사, 내려받기. */
export function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

/** 파일 선택 input 과 끌어다 놓기 영역을 연결한다. extra 에도 놓을 수 있다. */
export function bindDrop(
  input: HTMLInputElement,
  drop: HTMLElement,
  onFiles: (files: File[]) => void,
  extra: (HTMLElement | null)[] = [],
): void {
  input.addEventListener('change', () => {
    const files = Array.from(input.files ?? []);
    if (files.length) onFiles(files);
    input.value = '';
  });
  for (const target of [drop, ...extra]) {
    if (!target) continue;
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
      if (files.length) onFiles(files);
    });
  }
}

/** 글을 복사하고 단추 글자를 잠깐 "복사됨"으로 바꾼다. */
export async function copyText(button: HTMLElement, text: string): Promise<void> {
  const label = button.dataset.label ?? button.textContent ?? '복사';
  button.dataset.label = label;
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = '복사됨';
  } catch {
    button.textContent = '복사 안 됨';
  }
  window.setTimeout(() => {
    button.textContent = label;
  }, 1400);
}

export function errorSetter(element: HTMLElement): (message: string) => void {
  return (message) => {
    element.hidden = message === '';
    element.textContent = message;
  };
}

export async function zipBlob(files: { name: string; data: Blob | Uint8Array }[]): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  for (const file of files) zip.file(file.name, file.data);
  return zip.generateAsync({ type: 'blob', compression: 'STORE' });
}

export function canvasBlob(
  canvas: HTMLCanvasElement,
  type = 'image/png',
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('저장 실패'))), type, quality);
  });
}
