import {
  buildAlphabet,
  clampPasswordLength,
  clampWordCount,
  estimatePassphraseBits,
  estimatePasswordBits,
  generatePassphrase,
  generatePassword,
  type PasswordOptions,
  strengthOf,
} from '@/lib/password';

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPasswordGenerator(): void {
  const modeSelect = byId<HTMLSelectElement>('pw-mode');
  const charOptions = byId<HTMLElement>('pw-char-options');
  const wordOptions = byId<HTMLElement>('pw-word-options');
  const lengthRange = byId<HTMLInputElement>('pw-length');
  const lengthValue = byId<HTMLOutputElement>('pw-length-value');
  const lower = byId<HTMLInputElement>('pw-lower');
  const upper = byId<HTMLInputElement>('pw-upper');
  const digits = byId<HTMLInputElement>('pw-digits');
  const symbols = byId<HTMLInputElement>('pw-symbols');
  const ambiguous = byId<HTMLInputElement>('pw-ambiguous');
  const wordsRange = byId<HTMLInputElement>('pw-words');
  const wordsValue = byId<HTMLOutputElement>('pw-words-value');
  const separator = byId<HTMLSelectElement>('pw-separator');
  const output = byId<HTMLOutputElement>('pw-output');
  const meterBar = byId<HTMLElement>('pw-meter-bar');
  const strength = byId<HTMLElement>('pw-strength');
  const generate = byId<HTMLButtonElement>('pw-generate');
  const copy = byId<HTMLButtonElement>('pw-copy');
  const status = byId<HTMLElement>('pw-status');
  const error = byId<HTMLElement>('pw-error');

  if (
    !modeSelect ||
    !charOptions ||
    !wordOptions ||
    !lengthRange ||
    !lower ||
    !upper ||
    !digits ||
    !symbols ||
    !ambiguous ||
    !wordsRange ||
    !separator ||
    !output ||
    !meterBar ||
    !strength ||
    !generate ||
    !copy ||
    !status ||
    !error
  ) {
    return;
  }

  let lastValue = '';
  let statusTimer = 0;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const setStatus = (message: string) => {
    status.textContent = message;
    if (statusTimer) window.clearTimeout(statusTimer);
    if (message) {
      statusTimer = window.setTimeout(() => {
        status.textContent = '';
      }, 2400);
    }
  };

  const wordMode = () => modeSelect.value === 'words';

  const syncVisibility = () => {
    const isWord = wordMode();
    charOptions.hidden = isWord;
    wordOptions.hidden = !isWord;
  };

  const syncOutputs = () => {
    if (lengthValue) lengthValue.textContent = lengthRange.value;
    if (wordsValue) wordsValue.textContent = wordsRange.value;
  };

  const options = (): PasswordOptions => ({
    length: clampPasswordLength(Number(lengthRange.value)),
    lower: lower.checked,
    upper: upper.checked,
    digits: digits.checked,
    symbols: symbols.checked,
    excludeAmbiguous: ambiguous.checked,
  });

  const renderStrength = (bits: number) => {
    const result = strengthOf(bits);
    meterBar.style.width = `${Math.min(100, Math.max(4, Math.round(bits)))}%`;
    meterBar.dataset.level = result.level;
    strength.textContent = `${result.label} · 약 ${Math.round(bits)}비트`;
  };

  const render = () => {
    syncOutputs();
    const isWord = wordMode();

    if (!isWord && buildAlphabet(options()) === '') {
      lastValue = '';
      output.textContent = '문자 종류를 하나 이상 선택하세요.';
      output.classList.add('is-empty');
      meterBar.style.width = '0%';
      meterBar.dataset.level = 'weak';
      strength.textContent = '';
      copy.disabled = true;
      showError('문자 종류를 하나 이상 선택하세요.');
      return;
    }

    try {
      if (isWord) {
        const count = clampWordCount(Number(wordsRange.value));
        lastValue = generatePassphrase(count, separator.value);
        renderStrength(estimatePassphraseBits(count));
      } else {
        const current = options();
        lastValue = generatePassword(current);
        renderStrength(estimatePasswordBits(current));
      }
      output.textContent = lastValue;
      output.classList.remove('is-empty');
      copy.disabled = false;
      showError('');
    } catch (cause) {
      lastValue = '';
      output.textContent = '—';
      output.classList.add('is-empty');
      copy.disabled = true;
      showError(cause instanceof Error ? cause.message : '비밀번호를 만들지 못했습니다.');
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

  const copyValue = async () => {
    if (!lastValue) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(lastValue);
      } else {
        fallbackCopy(lastValue);
      }
      setStatus('비밀번호를 복사했습니다.');
    } catch {
      try {
        fallbackCopy(lastValue);
        setStatus('비밀번호를 복사했습니다.');
      } catch {
        showError('복사하지 못했습니다. 비밀번호를 직접 선택해 복사하세요.');
      }
    }
  };

  modeSelect.addEventListener('change', () => {
    syncVisibility();
    render();
  });

  for (const input of [lower, upper, digits, symbols, ambiguous]) {
    input.addEventListener('change', render);
  }

  lengthRange.addEventListener('input', render);
  wordsRange.addEventListener('input', render);
  separator.addEventListener('change', render);
  generate.addEventListener('click', () => {
    setStatus('');
    render();
  });
  copy.addEventListener('click', () => void copyValue());

  syncVisibility();
  syncOutputs();
  render();
  window.addEventListener('pagehide', () => {
    lastValue = '';
  });
}
