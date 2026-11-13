import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import { unlockErrorMessage, unlockedFileName } from '@/lib/pdf-password';

/**
 * PDF 암호 풀기 — 암호로 연 문서의 쪽을 암호 없는 새 PDF 로 옮긴다.
 * 인쇄·복사 제한만 걸린(열기 암호가 없는) PDF 는 암호 없이 바로 푼다.
 */
function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

type Kind = 'open' | 'restricted' | 'plain';

export function initPdfUnlock(): void {
  const input = byId<HTMLInputElement>('pu-input');
  const drop = byId<HTMLElement>('pu-drop');
  const panel = byId<HTMLElement>('pu-panel');
  const info = byId<HTMLElement>('pu-info');
  const status = byId<HTMLElement>('pu-status');
  const error = byId<HTMLElement>('pu-error');
  const passwordField = byId<HTMLElement>('pu-password-field');
  const password = byId<HTMLInputElement>('pu-password');
  const show = byId<HTMLInputElement>('pu-show');
  const apply = byId<HTMLButtonElement>('pu-apply');
  const reset = byId<HTMLButtonElement>('pu-reset');
  const result = byId<HTMLElement>('pu-result');
  const resultNote = byId<HTMLElement>('pu-result-note');
  const download = byId<HTMLAnchorElement>('pu-download');
  if (!input || !drop || !panel || !password || !apply || !error || !status) return;

  let file: File | null = null;
  let bytes: Uint8Array | null = null;
  let kind: Kind = 'open';
  let resultUrl: string | null = null;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    if (result) result.hidden = true;
    if (download) download.hidden = true;
  };

  const select = async (next: File) => {
    showError('');
    clearResult();
    const validation = validatePdfSelection([next]);
    if (!validation.ok) {
      showError(validation.errors.join(' '));
      return;
    }
    const { PDFDocument } = await import('@cantoo/pdf-lib');
    const data = new Uint8Array(await next.arrayBuffer());
    try {
      await PDFDocument.load(data);
      kind = 'plain';
    } catch (cause) {
      if (!(cause instanceof Error && cause.name === 'EncryptedPDFError')) {
        showError(unlockErrorMessage(cause));
        return;
      }
      try {
        await PDFDocument.load(data, { password: '' });
        kind = 'restricted';
      } catch {
        kind = 'open';
      }
    }
    file = next;
    bytes = data;
    if (info) info.textContent = `${next.name} · ${formatBytes(next.size)}`;
    drop.hidden = true;
    panel.hidden = false;
    if (passwordField) passwordField.hidden = kind !== 'open';
    apply.disabled = kind === 'plain';
    status.textContent =
      kind === 'plain'
        ? '이 PDF에는 암호가 걸려 있지 않습니다. 바로 열어 쓰시면 됩니다.'
        : kind === 'restricted'
          ? '열기 암호 없이 인쇄·복사 같은 사용 제한만 걸린 PDF입니다. 암호 없이 제한을 풀 수 있습니다.'
          : '이 PDF를 열 때 쓰는 암호를 입력하세요.';
    if (kind === 'open') password.focus();
  };

  const run = async () => {
    if (!file || !bytes || kind === 'plain') return;
    showError('');
    clearResult();
    if (kind === 'open' && password.value === '') {
      showError('암호를 입력하세요.');
      return;
    }
    try {
      const { PDFDocument } = await import('@cantoo/pdf-lib');
      const opened = await PDFDocument.load(bytes, {
        password: kind === 'open' ? password.value : '',
      });
      const output = await PDFDocument.create();
      const pages = await output.copyPages(opened, opened.getPageIndices());
      for (const page of pages) output.addPage(page);
      const title = opened.getTitle();
      if (title) output.setTitle(title);
      const saved = await output.save();
      const blob = new Blob([new Uint8Array(saved)], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);
      if (download) {
        download.href = resultUrl;
        download.download = unlockedFileName(file.name);
        download.textContent = `암호 푼 PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultNote) {
        resultNote.textContent = `${opened.getPageCount()}쪽을 암호 없는 PDF로 옮겼습니다. 책갈피(목차)와 양식 입력칸은 빠질 수 있습니다.`;
      }
      if (result) result.hidden = false;
      status.textContent = '';
    } catch (cause) {
      console.error(cause);
      showError(unlockErrorMessage(cause));
    }
  };

  input.addEventListener('change', () => {
    const next = input.files?.[0];
    if (next) void select(next);
    input.value = '';
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
    const next = event.dataTransfer?.files[0];
    if (next) void select(next);
  });
  password.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') apply.click();
  });
  show?.addEventListener('change', () => {
    password.type = show.checked ? 'text' : 'password';
  });
  apply.addEventListener('click', () => void doWork(apply, run));
  reset?.addEventListener('click', () => {
    clearResult();
    file = null;
    bytes = null;
    password.value = '';
    apply.disabled = false;
    panel.hidden = true;
    drop.hidden = false;
    status.textContent = '';
    showError('');
  });

  window.addEventListener('pagehide', () => {
    clearResult();
    file = null;
    bytes = null;
  });
}
