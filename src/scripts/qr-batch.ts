import { formatBytes } from '@/lib/files';
import {
  isValidQrErrorLevel,
  isValidQrSize,
  MAX_QR_CONTENT_LENGTH,
  MAX_QR_ITEMS,
  type QrItem,
  qrItemsFromTable,
  qrZipFileName,
  uniqueQrFileNames,
} from '@/lib/qr-batch';
import { readTableFile } from '@/lib/table-file';

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

const dataUrlBytes = (dataUrl: string): Uint8Array => {
  const base64 = dataUrl.split(',')[1] ?? '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
};

export function initQrBatch(): void {
  const fileInput = byId<HTMLInputElement>('qb-file');
  const sample = byId<HTMLButtonElement>('qb-sample');
  const add = byId<HTMLButtonElement>('qb-add');
  const rowsBox = byId<HTMLElement>('qb-rows');
  const importNote = byId<HTMLElement>('qb-import-note');
  const count = byId<HTMLElement>('qb-count');
  const size = byId<HTMLSelectElement>('qb-size');
  const margin = byId<HTMLSelectElement>('qb-margin');
  const ecc = byId<HTMLSelectElement>('qb-ecc');
  const dark = byId<HTMLInputElement>('qb-dark');
  const light = byId<HTMLInputElement>('qb-light');
  const preview = byId<HTMLElement>('qb-preview');
  const pageNote = byId<HTMLElement>('qb-page-note');
  const generate = byId<HTMLButtonElement>('qb-generate');
  const reset = byId<HTMLButtonElement>('qb-reset');
  const status = byId<HTMLElement>('qb-status');
  const error = byId<HTMLElement>('qb-error');
  const result = byId<HTMLElement>('qb-result');
  const resultSize = byId<HTMLElement>('qb-result-size');
  const download = byId<HTMLAnchorElement>('qb-download');

  if (
    !fileInput ||
    !sample ||
    !add ||
    !rowsBox ||
    !importNote ||
    !count ||
    !size ||
    !margin ||
    !ecc ||
    !dark ||
    !light ||
    !preview ||
    !pageNote ||
    !generate ||
    !reset ||
    !status ||
    !error ||
    !result ||
    !resultSize ||
    !download
  ) {
    return;
  }

  let previewTimer = 0;
  let previewToken = 0;
  let resultUrl: string | null = null;
  let running = false;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const setStatus = (message: string) => {
    status.textContent = message;
  };

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    result.hidden = true;
    download.hidden = true;
    download.removeAttribute('href');
  };

  const readItems = (): QrItem[] =>
    Array.from(rowsBox.querySelectorAll<HTMLElement>('.qb-row'))
      .map((row) => ({
        content: row.querySelector<HTMLInputElement>('[data-field="content"]')?.value.trim() ?? '',
        name: row.querySelector<HTMLInputElement>('[data-field="name"]')?.value.trim() ?? '',
      }))
      .filter((item) => item.content)
      .slice(0, MAX_QR_ITEMS);

  const updateCount = () => {
    const items = readItems();
    count.textContent = `${items.length}개`;
    pageNote.textContent = items.length > 0 ? `${items.length}개 · 앞 3개` : '앞 3개';
    return items;
  };

  const schedulePreview = () => {
    updateCount();
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => void renderPreview(), 220);
  };

  const renderPreview = async () => {
    const token = ++previewToken;
    const items = updateCount().slice(0, 3);
    preview.replaceChildren();
    if (items.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'qb-empty';
      empty.textContent = '내용을 입력하면 QR 미리보기가 표시됩니다.';
      preview.append(empty);
      return;
    }

    try {
      const QRCode = (await import('qrcode')).default;
      const qrSize = isValidQrSize(Number(size.value)) ? Number(size.value) : 512;
      const level = isValidQrErrorLevel(ecc.value) ? ecc.value : 'M';
      const previewSize = Math.min(256, qrSize);
      const options = {
        width: previewSize,
        margin: Number(margin.value) || 0,
        errorCorrectionLevel: level,
        color: { dark: dark.value, light: light.value },
      };

      for (const [index, item] of items.entries()) {
        const card = document.createElement('div');
        card.className = 'qb-card';
        if (item.content.length > MAX_QR_CONTENT_LENGTH) {
          card.classList.add('is-error');
          card.textContent = '내용이 너무 깁니다.';
          preview.append(card);
          continue;
        }
        try {
          const dataUrl = await QRCode.toDataURL(item.content, options);
          if (token !== previewToken) return;
          const image = document.createElement('img');
          image.src = dataUrl;
          image.alt = item.name || `QR ${index + 1}`;
          const label = document.createElement('span');
          label.textContent = item.name || `qr-${String(index + 1).padStart(3, '0')}.png`;
          card.append(image, label);
        } catch {
          card.classList.add('is-error');
          card.textContent = 'QR을 만들지 못했습니다.';
        }
        preview.append(card);
      }
    } catch {
      const empty = document.createElement('p');
      empty.className = 'qb-empty';
      empty.textContent = '미리보기를 불러오지 못했습니다.';
      preview.append(empty);
    }
  };

  const bindRow = (row: HTMLElement) => {
    for (const input of row.querySelectorAll('input')) {
      input.addEventListener('input', schedulePreview);
    }
    row.querySelector<HTMLButtonElement>('[data-remove]')?.addEventListener('click', () => {
      row.remove();
      if (rowsBox.querySelectorAll('.qb-row').length === 0) addRow(undefined, false, false);
      schedulePreview();
    });
  };

  const addRow = (item: QrItem = { content: '', name: '' }, focus = false, refresh = true) => {
    if (rowsBox.querySelectorAll('.qb-row').length >= MAX_QR_ITEMS) {
      showError(`한 번에 최대 ${MAX_QR_ITEMS}개까지 만들 수 있습니다.`);
      return;
    }
    const row = document.createElement('div');
    row.className = 'qb-row';
    row.innerHTML = `
      <label class="qb-field qb-content">
        <span>내용</span>
        <input data-field="content" type="text" autocomplete="off" placeholder="https://example.com" />
      </label>
      <label class="qb-field qb-name">
        <span>파일 이름 <span class="hint">(선택)</span></span>
        <input data-field="name" type="text" autocomplete="off" placeholder="qr-001" />
      </label>
      <button class="qb-remove" type="button" data-remove aria-label="항목 삭제" title="항목 삭제">×</button>
    `;
    const content = row.querySelector<HTMLInputElement>('[data-field="content"]');
    const name = row.querySelector<HTMLInputElement>('[data-field="name"]');
    if (content) content.value = item.content;
    if (name) name.value = item.name;
    bindRow(row);
    rowsBox.append(row);
    if (refresh) schedulePreview();
    if (focus) content?.focus();
  };

  const setRows = (items: QrItem[]) => {
    rowsBox.replaceChildren();
    const list = items.length > 0 ? items.slice(0, MAX_QR_ITEMS) : [{ content: '', name: '' }];
    for (const item of list) addRow(item, false, false);
    schedulePreview();
  };

  const sampleItems = (): QrItem[] => [
    { content: 'https://officekit.kr/', name: '홈페이지' },
    { content: 'https://officekit.kr/tools/pdf-merge/', name: 'PDF 합치기' },
    { content: 'https://officekit.kr/tools/quote-generator/', name: '견적서' },
  ];

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showError('CSV·XLSX 파일은 5MB 이하만 불러올 수 있습니다.');
      return;
    }
    showError('');
    setStatus('QR 목록을 읽는 중…');
    try {
      const table = await readTableFile(file);
      const items = qrItemsFromTable(table.rows);
      if (items.length === 0) {
        showError('QR로 만들 내용을 찾지 못했습니다. 첫 열에 내용을 넣어 주세요.');
        setStatus('');
        return;
      }
      setRows(items);
      importNote.textContent = `${items.length}개 항목을 불러왔습니다. 첫 열은 내용, 둘째 열은 파일 이름으로 읽습니다.`;
      setStatus(`${items.length}개 항목을 불러왔습니다.`);
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : '파일을 읽지 못했습니다.');
      setStatus('');
    } finally {
      fileInput.value = '';
    }
  };

  const generateZip = async () => {
    if (running) return;
    const items = readItems();
    if (items.length === 0) {
      showError('QR로 만들 내용을 하나 이상 입력하세요.');
      return;
    }
    const tooLong = items.findIndex((item) => item.content.length > MAX_QR_CONTENT_LENGTH);
    if (tooLong >= 0) {
      showError(
        `${tooLong + 1}번 항목의 내용이 너무 깁니다. ${MAX_QR_CONTENT_LENGTH}자 이하로 줄여 주세요.`,
      );
      return;
    }

    running = true;
    generate.disabled = true;
    clearResult();
    showError('');
    setStatus('QR 코드를 만드는 중…');
    const names = uniqueQrFileNames(items);

    try {
      const QRCode = (await import('qrcode')).default;
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const qrSize = isValidQrSize(Number(size.value)) ? Number(size.value) : 512;
      const level = isValidQrErrorLevel(ecc.value) ? ecc.value : 'M';
      const options = {
        width: qrSize,
        margin: Number(margin.value) || 0,
        errorCorrectionLevel: level,
        color: { dark: dark.value, light: light.value },
      };
      const failed: number[] = [];

      for (const [index, item] of items.entries()) {
        try {
          const dataUrl = await QRCode.toDataURL(item.content, options);
          zip.file(
            names[index] ?? `qr-${String(index + 1).padStart(3, '0')}.png`,
            dataUrlBytes(dataUrl),
          );
        } catch {
          failed.push(index + 1);
        }
        if (index % 5 === 0) {
          setStatus(`QR 코드를 만드는 중… ${index + 1} / ${items.length}`);
          await new Promise((resolve) => window.setTimeout(resolve, 0));
        }
      }

      const generated = items.length - failed.length;
      if (generated === 0) throw new Error('QR 코드를 하나도 만들지 못했습니다.');

      setStatus('ZIP을 만드는 중…');
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      resultUrl = URL.createObjectURL(blob);
      download.href = resultUrl;
      download.download = qrZipFileName();
      download.hidden = false;
      resultSize.textContent = formatBytes(blob.size);
      result.hidden = false;
      result.focus();
      setStatus(`${generated}개 QR 코드를 ZIP으로 만들었습니다.`);
      if (failed.length > 0) {
        showError(`${failed.length}개 항목은 QR로 만들지 못했습니다: ${failed.join(', ')}번`);
      }
    } catch (cause) {
      setStatus('');
      showError(cause instanceof Error ? cause.message : 'QR ZIP을 만들지 못했습니다.');
    } finally {
      running = false;
      generate.disabled = false;
    }
  };

  const resetAll = () => {
    size.value = '512';
    margin.value = '2';
    ecc.value = 'M';
    dark.value = '#111111';
    light.value = '#ffffff';
    importNote.textContent = '';
    clearResult();
    showError('');
    setStatus('');
    setRows([]);
  };

  fileInput.addEventListener('change', () => void handleFile(fileInput.files?.[0]));
  sample.addEventListener('click', () => {
    setRows(sampleItems());
    importNote.textContent = '예시 3개를 채웠습니다. 내용은 자유롭게 고치세요.';
  });
  add.addEventListener('click', () => addRow(undefined, true));
  generate.addEventListener('click', () => void generateZip());
  reset.addEventListener('click', resetAll);
  for (const input of [size, margin, ecc, dark, light]) {
    input.addEventListener('input', schedulePreview);
    input.addEventListener('change', schedulePreview);
  }

  window.addEventListener('pagehide', () => {
    clearResult();
    previewToken += 1;
  });

  setRows(sampleItems());
  importNote.textContent = '예시 3개로 시작합니다. 내용을 고치거나 CSV를 불러오세요.';
}
