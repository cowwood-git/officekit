import { TEXT_OPERATIONS, type TextOperation, transformText } from '@/lib/text-convert';

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initTextConvert(): void {
  const operation = byId<HTMLSelectElement>('tx-operation');
  const input = byId<HTMLTextAreaElement>('tx-input');
  const output = byId<HTMLTextAreaElement>('tx-output');
  const copyButton = byId<HTMLButtonElement>('tx-copy');
  const swapButton = byId<HTMLButtonElement>('tx-swap');
  const clearButton = byId<HTMLButtonElement>('tx-clear');
  const status = byId<HTMLElement>('tx-status');

  if (!operation || !input || !output || !status) return;

  const groups = new Map<string, HTMLOptGroupElement>();
  for (const item of TEXT_OPERATIONS) {
    let group = groups.get(item.group);
    if (!group) {
      group = document.createElement('optgroup');
      group.label = item.group;
      groups.set(item.group, group);
      operation.append(group);
    }
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    group.append(option);
  }

  const run = () => {
    if (input.value === '') {
      output.value = '';
      status.textContent = '변환할 텍스트를 입력하세요.';
      return;
    }
    try {
      const result = transformText(operation.value as TextOperation, input.value);
      output.value = result;
      status.textContent =
        result === '' ? '결과가 비어 있습니다. 입력을 확인하세요.' : '변환했습니다.';
    } catch (cause) {
      output.value = '';
      const name = cause instanceof Error ? cause.name : '';
      status.textContent =
        name === 'URIError'
          ? 'URL 디코딩에 실패했습니다. % 인코딩을 확인하세요.'
          : 'Base64 디코딩에 실패했습니다. 입력값을 확인하세요.';
    }
  };

  operation.addEventListener('change', run);
  input.addEventListener('input', run);

  if (!operation.value) operation.value = TEXT_OPERATIONS[0]?.value ?? 'upper';

  copyButton?.addEventListener('click', async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      copyButton.textContent = '복사됨';
      window.setTimeout(() => {
        copyButton.textContent = '결과 복사';
      }, 1500);
    } catch {
      status.textContent = '자동 복사가 차단되었습니다. 결과를 선택해 복사하세요.';
    }
  });

  swapButton?.addEventListener('click', () => {
    if (!output.value) return;
    input.value = output.value;
    const current = operation.value as TextOperation;
    const inverse: Partial<Record<TextOperation, TextOperation>> = {
      'base64-encode': 'base64-decode',
      'base64-decode': 'base64-encode',
      'url-encode': 'url-decode',
      'url-decode': 'url-encode',
      'html-encode': 'html-decode',
      'html-decode': 'html-encode',
    };
    const next = inverse[current];
    if (next) operation.value = next;
    run();
  });

  clearButton?.addEventListener('click', () => {
    input.value = '';
    output.value = '';
    status.textContent = '지웠습니다.';
    input.focus();
  });

  run();
}
