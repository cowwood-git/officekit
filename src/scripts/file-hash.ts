import {
  type HashAlgorithm,
  hashesMatch,
  hashHex,
  isHashAlgorithm,
  MAX_HASH_BYTES,
} from '@/lib/file-hash';
import { formatBytes } from '@/lib/files';

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initFileHash(): void {
  const drop = byId<HTMLElement>('fh-drop');
  const input = byId<HTMLInputElement>('fh-input');
  const panel = byId<HTMLElement>('fh-panel');
  const fileInfo = byId<HTMLElement>('fh-file');
  const algo = byId<HTMLSelectElement>('fh-algo');
  const run = byId<HTMLButtonElement>('fh-run');
  const reset = byId<HTMLButtonElement>('fh-reset');
  const status = byId<HTMLElement>('fh-status');
  const error = byId<HTMLElement>('fh-error');
  const result = byId<HTMLElement>('fh-result');
  const resultTitle = byId<HTMLElement>('fh-result-title');
  const hashValue = byId<HTMLElement>('fh-hash');
  const copy = byId<HTMLButtonElement>('fh-copy');
  const resultName = byId<HTMLElement>('fh-result-name');
  const resultSize = byId<HTMLElement>('fh-result-size');
  const resultAlgo = byId<HTMLElement>('fh-result-algo');
  const compare = byId<HTMLInputElement>('fh-compare');
  const match = byId<HTMLElement>('fh-match');

  if (
    !drop ||
    !input ||
    !panel ||
    !fileInfo ||
    !algo ||
    !run ||
    !reset ||
    !status ||
    !error ||
    !result ||
    !resultTitle ||
    !hashValue ||
    !copy ||
    !resultName ||
    !resultSize ||
    !resultAlgo ||
    !compare ||
    !match
  ) {
    return;
  }

  let currentFile: File | null = null;
  let currentHash = '';
  let running = false;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const setStatus = (message: string) => {
    status.textContent = message;
  };

  const clearResult = () => {
    currentHash = '';
    result.hidden = true;
    hashValue.textContent = '';
    compare.value = '';
    match.textContent = '';
    delete match.dataset.state;
  };

  const clearAll = () => {
    currentFile = null;
    input.value = '';
    panel.hidden = true;
    fileInfo.textContent = '';
    clearResult();
    showError('');
    setStatus('');
    run.disabled = true;
  };

  const selectFile = (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_HASH_BYTES) {
      clearAll();
      showError(`파일이 ${formatBytes(MAX_HASH_BYTES)}를 넘습니다. 더 작은 파일로 확인하세요.`);
      return;
    }

    currentFile = file;
    panel.hidden = false;
    fileInfo.textContent = `${file.name} · ${formatBytes(file.size)}`;
    clearResult();
    showError('');
    setStatus('파일을 선택했습니다. 해시 계산을 눌러 주세요.');
    run.disabled = false;
  };

  const algorithm = (): HashAlgorithm => (isHashAlgorithm(algo.value) ? algo.value : 'SHA-256');

  const calculate = async () => {
    const file = currentFile;
    if (!file || running) return;
    if (!globalThis.crypto?.subtle) {
      showError('이 브라우저는 파일 해시 계산을 지원하지 않습니다.');
      return;
    }

    const selectedAlgorithm = algorithm();
    running = true;
    run.disabled = true;
    showError('');
    setStatus('해시를 계산하는 중…');

    try {
      const buffer = await file.arrayBuffer();
      const hex = await hashHex(buffer, selectedAlgorithm);
      if (currentFile !== file) return;
      currentHash = hex;
      hashValue.textContent = hex;
      resultTitle.textContent = `${selectedAlgorithm} 해시`;
      resultName.textContent = file.name;
      resultSize.textContent = formatBytes(file.size);
      resultAlgo.textContent = selectedAlgorithm;
      result.hidden = false;
      result.focus();
      setStatus('');
      compare.value = '';
      match.textContent = '';
      delete match.dataset.state;
    } catch (cause) {
      setStatus('');
      showError(
        cause instanceof Error
          ? cause.message
          : '해시를 계산하지 못했습니다. 파일을 다시 선택하세요.',
      );
    } finally {
      running = false;
      run.disabled = !currentFile;
    }
  };

  const fallbackCopy = (value: string) => {
    const area = document.createElement('textarea');
    area.value = value;
    area.setAttribute('readonly', 'true');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    if (!ok) throw new Error('복사하지 못했습니다.');
  };

  const copyHash = async () => {
    if (!currentHash) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(currentHash);
      } else {
        fallbackCopy(currentHash);
      }
      setStatus('해시를 복사했습니다.');
    } catch {
      try {
        fallbackCopy(currentHash);
        setStatus('해시를 복사했습니다.');
      } catch {
        showError('해시를 복사하지 못했습니다. 직접 선택해 복사하세요.');
      }
    }
  };

  const updateMatch = () => {
    if (!currentHash) {
      match.textContent = '';
      delete match.dataset.state;
      return;
    }
    const value = compare.value.trim();
    if (!value) {
      match.textContent = '';
      delete match.dataset.state;
      return;
    }
    if (hashesMatch(value, currentHash)) {
      match.textContent = '일치합니다. 같은 파일로 볼 수 있습니다.';
      match.dataset.state = 'match';
    } else {
      match.textContent = '일치하지 않습니다. 파일이나 해시를 다시 확인하세요.';
      match.dataset.state = 'mismatch';
    }
  };

  input.addEventListener('change', () => selectFile(input.files?.[0]));

  drop.addEventListener('dragover', (event) => {
    event.preventDefault();
    drop.dataset.drag = 'true';
  });
  drop.addEventListener('dragleave', () => {
    delete drop.dataset.drag;
  });
  drop.addEventListener('drop', (event) => {
    event.preventDefault();
    delete drop.dataset.drag;
    selectFile(event.dataTransfer?.files?.[0]);
  });

  algo.addEventListener('change', () => {
    clearResult();
    if (currentFile) setStatus('알고리즘을 바꿨습니다. 다시 계산해 주세요.');
  });

  run.addEventListener('click', () => void calculate());
  reset.addEventListener('click', clearAll);
  copy.addEventListener('click', () => void copyHash());
  compare.addEventListener('input', updateMatch);

  window.addEventListener('pagehide', () => {
    currentFile = null;
    currentHash = '';
  });

  clearAll();
}
