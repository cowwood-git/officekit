import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import {
  checkNewPassword,
  hasRestriction,
  lockedFileName,
  type PdfPermissions,
  passwordHint,
  permissionOptions,
} from '@/lib/pdf-password';

/** PDF 암호 걸기 — @cantoo/pdf-lib 로 AES-256 암호화. 파일은 브라우저 밖으로 나가지 않는다. */
function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function randomOwnerPassword(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function initPdfProtect(): void {
  const input = byId<HTMLInputElement>('pp-input');
  const drop = byId<HTMLElement>('pp-drop');
  const panel = byId<HTMLElement>('pp-panel');
  const info = byId<HTMLElement>('pp-info');
  const status = byId<HTMLElement>('pp-status');
  const error = byId<HTMLElement>('pp-error');
  const password = byId<HTMLInputElement>('pp-password');
  const confirm = byId<HTMLInputElement>('pp-confirm');
  const strength = byId<HTMLElement>('pp-strength');
  const show = byId<HTMLInputElement>('pp-show');
  const print = byId<HTMLInputElement>('pp-print');
  const copy = byId<HTMLInputElement>('pp-copy');
  const modify = byId<HTMLInputElement>('pp-modify');
  const apply = byId<HTMLButtonElement>('pp-apply');
  const reset = byId<HTMLButtonElement>('pp-reset');
  const result = byId<HTMLElement>('pp-result');
  const resultNote = byId<HTMLElement>('pp-result-note');
  const download = byId<HTMLAnchorElement>('pp-download');
  if (!input || !drop || !panel || !password || !confirm || !apply || !error || !status) return;

  let file: File | null = null;
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

  const select = (next: File) => {
    showError('');
    clearResult();
    const validation = validatePdfSelection([next]);
    if (!validation.ok) {
      showError(validation.errors.join(' '));
      return;
    }
    file = next;
    if (info) info.textContent = `${next.name} · ${formatBytes(next.size)}`;
    drop.hidden = true;
    panel.hidden = false;
    status.textContent = '열 때 쓸 암호를 두 번 입력하세요.';
    password.focus();
  };

  const run = async () => {
    if (!file) return;
    showError('');
    clearResult();
    const problem = checkNewPassword(password.value, confirm.value);
    if (problem) {
      showError(problem);
      return;
    }
    const permissions: PdfPermissions = {
      printing: print?.checked ?? true,
      copying: copy?.checked ?? true,
      modifying: modify?.checked ?? true,
    };
    try {
      const { PDFDocument } = await import('@cantoo/pdf-lib');
      const bytes = new Uint8Array(await file.arrayBuffer());
      let doc: Awaited<ReturnType<typeof PDFDocument.load>>;
      try {
        doc = await PDFDocument.load(bytes);
      } catch (cause) {
        if (cause instanceof Error && cause.name === 'EncryptedPDFError') {
          showError('이미 암호가 걸린 PDF입니다. 먼저 "PDF 암호 풀기"로 푼 뒤 다시 거세요.');
          return;
        }
        throw cause;
      }
      const restricted = hasRestriction(permissions);
      doc.encrypt({
        userPassword: password.value,
        // 제한을 걸 때 소유자 암호가 열기 암호와 같으면 제한이 무의미하다 → 무작위로 만든다.
        ownerPassword: restricted ? randomOwnerPassword() : password.value,
        permissions: permissionOptions(permissions),
      });
      const saved = await doc.save();
      const blob = new Blob([new Uint8Array(saved)], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);
      if (download) {
        download.href = resultUrl;
        download.download = lockedFileName(file.name);
        download.textContent = `암호 PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultNote) {
        const limits = [
          !permissions.printing && '인쇄',
          !permissions.copying && '내용 복사',
          !permissions.modifying && '수정',
        ].filter(Boolean);
        resultNote.textContent = limits.length
          ? `AES-256으로 잠갔습니다. ${limits.join('·')}을(를) 막았습니다. 암호를 잊으면 열 수 없으니 따로 적어 두세요.`
          : 'AES-256으로 잠갔습니다. 암호를 잊으면 열 수 없으니 따로 적어 두세요.';
      }
      if (result) result.hidden = false;
      status.textContent = '';
    } catch (cause) {
      console.error(cause);
      showError('PDF를 처리할 수 없습니다. 손상된 파일인지 확인하세요.');
    }
  };

  const updateStrength = () => {
    if (strength) strength.textContent = passwordHint(password.value);
  };

  input.addEventListener('change', () => {
    const next = input.files?.[0];
    if (next) select(next);
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
    if (next) select(next);
  });
  password.addEventListener('input', updateStrength);
  show?.addEventListener('change', () => {
    const type = show.checked ? 'text' : 'password';
    password.type = type;
    confirm.type = type;
  });
  apply.addEventListener('click', () => void doWork(apply, run));
  reset?.addEventListener('click', () => {
    clearResult();
    file = null;
    password.value = '';
    confirm.value = '';
    updateStrength();
    panel.hidden = true;
    drop.hidden = false;
    status.textContent = '';
    showError('');
  });

  window.addEventListener('pagehide', () => {
    clearResult();
    file = null;
  });
}
