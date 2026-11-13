import {
  coerceScalar,
  convertFileName,
  type Delimiter,
  detectDelimiter,
  normalizeJsonRows,
  uniqueHeaders,
} from '@/lib/csv-json';
import { doWork } from '@/lib/do-work';
import { formatBytes } from '@/lib/files';
import { runLabel } from '@/lib/run-gate';

type Mode = 'csv2json' | 'json2csv';
type Encoding = 'auto' | 'utf-8' | 'euc-kr';

let sourceName: string | null = null;
let sourceFile: File | null = null;
let outputUrl: string | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

async function decodeBytes(buffer: ArrayBuffer, encoding: Encoding): Promise<string> {
  if (encoding === 'utf-8') return new TextDecoder('utf-8').decode(buffer);
  if (encoding === 'euc-kr') return new TextDecoder('euc-kr').decode(buffer);

  const bytes = new Uint8Array(buffer);
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(buffer);
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
  } catch {
    return new TextDecoder('euc-kr').decode(buffer);
  }
}

export function initCsvJson(): void {
  const input = byId<HTMLInputElement>('cj-input');
  const drop = byId<HTMLElement>('cj-drop');
  const modes = byId<HTMLElement>('cj-modes');
  const source = byId<HTMLTextAreaElement>('cj-source');
  const output = byId<HTMLTextAreaElement>('cj-output');
  const convertButton = byId<HTMLButtonElement>('cj-convert');
  const copyButton = byId<HTMLButtonElement>('cj-copy');
  const download = byId<HTMLAnchorElement>('cj-download');
  const clearButton = byId<HTMLButtonElement>('cj-clear');
  const status = byId<HTMLElement>('cj-status');
  const error = byId<HTMLElement>('cj-error');
  const meta = byId<HTMLElement>('cj-meta');
  const csvOptions = byId<HTMLElement>('cj-csv-options');
  const jsonOptions = byId<HTMLElement>('cj-json-options');
  const headerInput = byId<HTMLInputElement>('cj-header');
  const coerceInput = byId<HTMLInputElement>('cj-coerce');
  const nullInput = byId<HTMLInputElement>('cj-null');
  const flattenInput = byId<HTMLInputElement>('cj-flatten');
  const delimiter = byId<HTMLSelectElement>('cj-delimiter');
  const encoding = byId<HTMLSelectElement>('cj-encoding');

  if (!input || !drop || !modes || !source || !output || !convertButton || !status || !error) {
    return;
  }

  let mode: Mode = 'csv2json';

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const clearOutput = () => {
    if (outputUrl) URL.revokeObjectURL(outputUrl);
    outputUrl = null;
    output.value = '';
    download?.removeAttribute('href');
    if (download) download.hidden = true;
    if (meta) meta.textContent = '';
  };

  const selectedDelimiter = (): Delimiter | 'auto' => {
    const value = delimiter?.value ?? 'auto';
    return value === 'auto' ? 'auto' : (value as Delimiter);
  };

  const setMode = (next: Mode) => {
    mode = next;
    modes.querySelectorAll<HTMLButtonElement>('button[data-mode]').forEach((button) => {
      button.setAttribute('aria-pressed', button.dataset.mode === next ? 'true' : 'false');
    });
    if (csvOptions) csvOptions.hidden = next !== 'csv2json';
    if (jsonOptions) jsonOptions.hidden = next !== 'json2csv';
    source.placeholder =
      next === 'csv2json'
        ? 'name,dept,amount\n김오피스,개발,1200000'
        : '[{"name":"김오피스","dept":"개발","amount":1200000}]';
    clearOutput();
    showError('');
  };

  const convert = async () => {
    const text = source.value.trim();
    if (text === '') {
      showError('변환할 내용을 입력하거나 파일을 여세요.');
      return;
    }

    showError('');
    clearOutput();
    convertButton.disabled = true;
    status.textContent = '변환 중…';

    try {
      const XLSX = await import('xlsx');

      if (mode === 'csv2json') {
        const auto = detectDelimiter(text);
        const chosen = selectedDelimiter();
        const fs = chosen === 'auto' ? auto : chosen;
        const workbook = XLSX.read(text, { type: 'string', FS: fs });
        const sheet = workbook.Sheets[workbook.SheetNames[0] ?? ''];
        if (!sheet) throw new Error('CSV에서 표를 찾지 못했습니다.');

        const rows = XLSX.utils.sheet_to_json(sheet, {
          header: 1,
          defval: '',
          raw: false,
          blankrows: false,
        }) as string[][];

        if (rows.length === 0) throw new Error('데이터 행이 없습니다.');

        const transform = (value: string) => {
          if (value === '' && (nullInput?.checked ?? false)) return null;
          return coerceInput?.checked ? coerceScalar(value) : value;
        };

        const useHeader = headerInput?.checked ?? true;
        let data: unknown;
        if (useHeader) {
          const headers = uniqueHeaders((rows[0] ?? []).map((value) => String(value)));
          data = rows
            .slice(1)
            .map((row) =>
              Object.fromEntries(
                headers.map((header, index) => [header, transform(String(row[index] ?? ''))]),
              ),
            );
          if (meta) {
            meta.textContent = `${(data as unknown[]).length}행 · ${headers.length}열 · 구분자 "${fs === '\t' ? '탭' : fs}"`;
          }
        } else {
          data = rows.map((row) => row.map((value) => transform(String(value ?? ''))));
          if (meta) meta.textContent = `${rows.length}행 · ${rows[0]?.length ?? 0}열`;
        }

        output.value = JSON.stringify(data, null, 2);
      } else {
        let parsed: unknown;
        try {
          parsed = JSON.parse(text.replace(/^\uFEFF/, ''));
        } catch (cause) {
          throw new Error(
            `JSON 문법 오류: ${cause instanceof Error ? cause.message : '형식을 확인하세요.'}`,
          );
        }

        const { rows, headers } = normalizeJsonRows(parsed, flattenInput?.checked ?? true);
        if (headers.length === 0) throw new Error('변환할 키가 없습니다.');

        const normalized = rows.map((row) =>
          Object.fromEntries(
            headers.map((header) => {
              const value = row[header];
              if (value === null || value === undefined) return [header, ''];
              if (typeof value === 'object') return [header, JSON.stringify(value)];
              return [header, value];
            }),
          ),
        );

        const sheet = XLSX.utils.json_to_sheet(normalized, { header: headers });
        const chosen = selectedDelimiter();
        const fs = chosen === 'auto' ? ',' : chosen;
        output.value = XLSX.utils.sheet_to_csv(sheet, { FS: fs, RS: '\n' });

        if (meta) {
          meta.textContent = `${rows.length}행 · ${headers.length}열 · 구분자 "${fs === '\t' ? '탭' : fs}"`;
        }
      }

      const target = mode === 'csv2json' ? 'json' : 'csv';
      const blob =
        mode === 'csv2json'
          ? new Blob([output.value], { type: 'application/json;charset=utf-8' })
          : new Blob([`\uFEFF${output.value}`], { type: 'text/csv;charset=utf-8' });

      if (download) {
        outputUrl = URL.createObjectURL(blob);
        download.href = outputUrl;
        download.download = convertFileName(sourceName, target);
        download.textContent = `결과 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (copyButton) copyButton.disabled = output.value === '';
      status.textContent = `완료 · ${formatBytes(new TextEncoder().encode(output.value).length)}`;
    } catch (cause) {
      console.error(cause);
      output.value = '';
      showError(cause instanceof Error ? cause.message : '변환에 실패했습니다.');
      status.textContent = '';
    } finally {
      convertButton.disabled = false;
    }
  };

  const loadFile = async (file: File) => {
    showError('');
    clearOutput();

    if (!/\.(csv|json|txt)$/i.test(file.name)) {
      showError('CSV·JSON·TXT 파일만 열 수 있습니다.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      showError('파일이 20MB를 넘습니다. 더 작은 파일을 사용하세요.');
      return;
    }

    status.textContent = '파일을 읽는 중…';
    try {
      const buffer = await file.arrayBuffer();
      const isJson = /\.json$/i.test(file.name);
      const text = isJson
        ? new TextDecoder('utf-8').decode(buffer)
        : await decodeBytes(buffer, (encoding?.value as Encoding) ?? 'auto');

      sourceName = file.name;
      sourceFile = file;
      source.value = text;
      setMode(isJson ? 'json2csv' : 'csv2json');
      status.textContent = `${file.name} · ${formatBytes(file.size)} · [${runLabel(convertButton)}]을 누르세요.`;
    } catch (cause) {
      console.error(cause);
      showError('파일을 읽지 못했습니다.');
      status.textContent = '';
    }
  };

  modes.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const next = target.dataset.mode as Mode | undefined;
    if (!next || next === mode) return;
    setMode(next);
  });

  convertButton.addEventListener(
    'click',
    () => void doWork(convertButton, convert, { expectResult: false }),
  );

  copyButton?.addEventListener('click', async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      copyButton.textContent = '복사됨';
      window.setTimeout(() => {
        copyButton.textContent = '결과 복사';
      }, 1500);
    } catch {
      showError('자동 복사가 차단되었습니다. 결과를 선택해 Ctrl/Cmd+C로 복사하세요.');
    }
  });

  clearButton?.addEventListener('click', () => {
    source.value = '';
    sourceName = null;
    sourceFile = null;
    clearOutput();
    showError('');
    status.textContent = '';
    if (copyButton) copyButton.disabled = true;
  });

  encoding?.addEventListener('change', () => {
    if (sourceFile && /\.(csv|txt)$/i.test(sourceFile.name)) {
      void loadFile(sourceFile);
    }
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
    if (file) void loadFile(file);
  });

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void loadFile(file);
    input.value = '';
  });

  if (copyButton) copyButton.disabled = true;
  setMode('csv2json');

  window.addEventListener('pagehide', clearOutput);
}
