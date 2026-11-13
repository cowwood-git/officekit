import { formatBytes } from '@/lib/files';
import {
  customSheet,
  type LabelRow,
  type LabelSheet,
  labelFileName,
  labelRects,
  labelSize,
  labelsPerPage,
  MAX_LABELS,
  pagesFor,
  presetById,
  rowsFromTable,
} from '@/lib/label-print';
import { readTableFile } from '@/lib/table-file';

const MM_TO_PT = 72 / 25.4;
const MAX_CSV_BYTES = 5 * 1024 * 1024;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

const emptyRow = (): LabelRow => ({ name: '', postal: '', address: '', phone: '' });

export function initLabelPrint(): void {
  const preset = byId<HTMLSelectElement>('lp-preset');
  const start = byId<HTMLInputElement>('lp-start');
  const columns = byId<HTMLInputElement>('lp-columns');
  const rowsCount = byId<HTMLInputElement>('lp-rows-count');
  const margin = byId<HTMLInputElement>('lp-margin');
  const gap = byId<HTMLInputElement>('lp-gap');
  const custom = byId<HTMLElement>('lp-custom');
  const font = byId<HTMLSelectElement>('lp-font');
  const border = byId<HTMLInputElement>('lp-border');
  const fileInput = byId<HTMLInputElement>('lp-file');
  const sample = byId<HTMLButtonElement>('lp-sample');
  const add = byId<HTMLButtonElement>('lp-add');
  const rowsBox = byId<HTMLElement>('lp-rows');
  const importNote = byId<HTMLElement>('lp-import-note');
  const count = byId<HTMLElement>('lp-count');
  const sizeNote = byId<HTMLElement>('lp-size-note');
  const presetNote = byId<HTMLElement>('lp-preset-note');
  const pageNote = byId<HTMLElement>('lp-page-note');
  const preview = byId<HTMLElement>('lp-preview');
  const generate = byId<HTMLButtonElement>('lp-generate');
  const reset = byId<HTMLButtonElement>('lp-reset');
  const status = byId<HTMLElement>('lp-status');
  const error = byId<HTMLElement>('lp-error');
  const result = byId<HTMLElement>('lp-result');
  const resultSize = byId<HTMLElement>('lp-result-size');
  const download = byId<HTMLAnchorElement>('lp-download');

  if (
    !preset ||
    !start ||
    !columns ||
    !rowsCount ||
    !margin ||
    !gap ||
    !custom ||
    !font ||
    !border ||
    !fileInput ||
    !sample ||
    !add ||
    !rowsBox ||
    !importNote ||
    !count ||
    !sizeNote ||
    !presetNote ||
    !pageNote ||
    !preview ||
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

  const sheetNow = (): LabelSheet => {
    if (preset.value === 'custom') {
      return customSheet({
        columns: Number(columns.value),
        rows: Number(rowsCount.value),
        marginMm: Number(margin.value),
        gapMm: Number(gap.value),
      });
    }
    return presetById(preset.value);
  };

  const readRows = (): LabelRow[] =>
    Array.from(rowsBox.querySelectorAll<HTMLElement>('.lp-row'))
      .map((row) => ({
        name: row.querySelector<HTMLInputElement>('[data-field="name"]')?.value.trim() ?? '',
        postal: row.querySelector<HTMLInputElement>('[data-field="postal"]')?.value.trim() ?? '',
        address:
          row.querySelector<HTMLTextAreaElement>('[data-field="address"]')?.value.trim() ?? '',
        phone: row.querySelector<HTMLInputElement>('[data-field="phone"]')?.value.trim() ?? '',
      }))
      .filter((row) => row.name || row.postal || row.address || row.phone)
      .slice(0, MAX_LABELS);

  const makeCell = (row: LabelRow | null) => {
    const cell = document.createElement('div');
    cell.className = 'lp-cell';
    if (!row) {
      cell.classList.add('is-empty');
      return cell;
    }
    if (row.name) {
      const name = document.createElement('strong');
      name.textContent = row.name;
      cell.append(name);
    }
    const address = [row.postal, row.address].filter(Boolean).join(' ');
    if (address) {
      const line = document.createElement('span');
      line.textContent = address;
      line.style.whiteSpace = 'pre-line';
      cell.append(line);
    }
    if (row.phone) {
      const phone = document.createElement('small');
      phone.textContent = row.phone;
      cell.append(phone);
    }
    return cell;
  };

  const renderPreview = (sheet: LabelSheet, firstPage: Array<LabelRow | null>) => {
    preview.replaceChildren();
    preview.style.aspectRatio = `${sheet.pageWidthMm} / ${sheet.pageHeightMm}`;
    const rects = labelRects(sheet);
    for (const [index, rect] of rects.entries()) {
      const cell = makeCell(firstPage[index] ?? null);
      cell.style.left = `${(rect.xMm / sheet.pageWidthMm) * 100}%`;
      cell.style.top = `${(rect.yMm / sheet.pageHeightMm) * 100}%`;
      cell.style.width = `${(rect.widthMm / sheet.pageWidthMm) * 100}%`;
      cell.style.height = `${(rect.heightMm / sheet.pageHeightMm) * 100}%`;
      preview.append(cell);
    }
  };

  const updatePresetUi = () => {
    const isCustom = preset.value === 'custom';
    custom.hidden = !isCustom;
    const sheet = sheetNow();
    const per = labelsPerPage(sheet);
    start.max = String(per);
    const current = Math.min(per, Math.max(1, Number(start.value) || 1));
    start.value = String(current);
    const size = labelSize(sheet);
    sizeNote.textContent = `${size.widthMm.toFixed(1)} × ${size.heightMm.toFixed(1)}mm · ${per}칸/장`;
    presetNote.textContent = isCustom
      ? 'A4 안에서 행·열·여백·간격을 직접 맞춥니다.'
      : presetById(preset.value).note;
  };

  const refresh = () => {
    updatePresetUi();
    const rows = readRows();
    const sheet = sheetNow();
    const per = labelsPerPage(sheet);
    const startAt = Math.min(per, Math.max(1, Number(start.value) || 1));
    const pages = pagesFor(rows, sheet, startAt);
    count.textContent = `${rows.length}개`;
    pageNote.textContent = rows.length
      ? `${rows.length}개 · ${pages.length}페이지`
      : '라벨을 입력하세요.';
    renderPreview(sheet, pages[0] ?? []);
  };

  const bindRow = (row: HTMLElement) => {
    for (const input of row.querySelectorAll('input, textarea')) {
      input.addEventListener('input', refresh);
    }
    row.querySelector<HTMLButtonElement>('[data-remove]')?.addEventListener('click', () => {
      row.remove();
      if (rowsBox.querySelectorAll('.lp-row').length === 0) addRow(undefined, false, false);
      refresh();
    });
  };

  const addRow = (row: LabelRow = emptyRow(), focus = false, doRefresh = true) => {
    if (rowsBox.querySelectorAll('.lp-row').length >= MAX_LABELS) {
      showError(`한 번에 최대 ${MAX_LABELS}개까지 추가할 수 있습니다.`);
      return;
    }
    const element = document.createElement('div');
    element.className = 'lp-row';
    element.innerHTML = `
      <label class="lp-field lp-name">
        <span>이름</span>
        <input data-field="name" type="text" autocomplete="off" placeholder="홍길동" />
      </label>
      <label class="lp-field lp-postal">
        <span>우편번호</span>
        <input data-field="postal" type="text" autocomplete="off" placeholder="06236" />
      </label>
      <label class="lp-field lp-phone">
        <span>연락처</span>
        <input data-field="phone" type="tel" autocomplete="off" placeholder="010-0000-0000" />
      </label>
      <label class="lp-field lp-address">
        <span>주소</span>
        <textarea data-field="address" rows="1" placeholder="서울시 강남구 테헤란로 1"></textarea>
      </label>
      <button class="lp-remove" type="button" data-remove aria-label="라벨 삭제" title="라벨 삭제">×</button>
    `;
    const setValue = (field: string, value: string) => {
      const input = element.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `[data-field="${field}"]`,
      );
      if (input) input.value = value;
    };
    setValue('name', row.name);
    setValue('postal', row.postal);
    setValue('phone', row.phone);
    setValue('address', row.address);
    bindRow(element);
    rowsBox.append(element);
    if (doRefresh) refresh();
    if (focus) element.querySelector<HTMLInputElement>('[data-field="name"]')?.focus();
  };

  const setRows = (rows: LabelRow[]) => {
    rowsBox.replaceChildren();
    const list = rows.length > 0 ? rows.slice(0, MAX_LABELS) : [emptyRow()];
    for (const row of list) addRow(row, false, false);
    refresh();
  };

  const sampleRows = (): LabelRow[] => [
    {
      name: '홍길동',
      postal: '06236',
      address: '서울시 강남구 테헤란로 1',
      phone: '010-1234-5678',
    },
    {
      name: '김옷깃',
      postal: '48058',
      address: '부산시 해운대구 센텀중앙로 1',
      phone: '010-2222-3333',
    },
    { name: '이인연', postal: '03154', address: '서울시 종로구 사직로 1', phone: '02-000-0000' },
  ];

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_CSV_BYTES) {
      showError('CSV·XLSX 파일은 5MB 이하만 불러올 수 있습니다.');
      return;
    }
    setStatus('주소 목록을 읽는 중…');
    showError('');
    try {
      const table = await readTableFile(file);
      const parsed = rowsFromTable(table.rows);
      if (parsed.rows.length === 0) {
        showError('라벨로 만들 주소를 찾지 못했습니다. 첫 행과 열 구성을 확인하세요.');
        setStatus('');
        return;
      }
      setRows(parsed.rows);
      importNote.textContent = parsed.hasHeader
        ? `첫 행을 머리글로 읽었습니다. ${parsed.rows.length}개 라벨을 불러왔습니다.`
        : `머리글 없이 읽었습니다. 이름·주소·연락처 순서로 인식했습니다. ${parsed.rows.length}개 라벨.`;
      setStatus(`${parsed.rows.length}개 라벨을 불러왔습니다.`);
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : '파일을 읽지 못했습니다.');
      setStatus('');
    } finally {
      fileInput.value = '';
    }
  };

  const drawFit = (
    page: import('pdf-lib').PDFPage,
    text: string,
    x: number,
    y: number,
    size: number,
    maxWidth: number,
    pdfFont: import('pdf-lib').PDFFont,
    color: import('pdf-lib').RGB,
  ) => {
    const clean = text.replace(/\s+/g, ' ').trim();
    if (!clean) return;
    let value = clean;
    if (pdfFont.widthOfTextAtSize(value, size) > maxWidth) {
      while (value.length > 1 && pdfFont.widthOfTextAtSize(`${value}…`, size) > maxWidth) {
        value = value.slice(0, -1);
      }
      value = `${value}…`;
    }
    page.drawText(value, { x, y, size, font: pdfFont, color });
  };

  const wrapText = (
    text: string,
    size: number,
    maxWidth: number,
    maxLines: number,
    pdfFont: import('pdf-lib').PDFFont,
  ): string[] => {
    const lines: string[] = [];
    for (const paragraph of text.split('\n')) {
      let current = '';
      for (const char of paragraph) {
        const next = current + char;
        if (pdfFont.widthOfTextAtSize(next, size) > maxWidth && current) {
          lines.push(current);
          current = char;
          if (lines.length >= maxLines) break;
        } else {
          current = next;
        }
      }
      if (lines.length >= maxLines) break;
      if (current) lines.push(current);
    }
    return lines.slice(0, maxLines);
  };

  const drawLabel = (
    page: import('pdf-lib').PDFPage,
    row: LabelRow,
    rect: { x: number; y: number; width: number; height: number },
    pdfFont: import('pdf-lib').PDFFont,
    baseSize: number,
    colors: { ink: import('pdf-lib').RGB; muted: import('pdf-lib').RGB },
  ) => {
    const pad = Math.min(2.2 * MM_TO_PT, Math.min(rect.width, rect.height) * 0.1);
    const width = rect.width - pad * 2;
    const heightMm = rect.height / MM_TO_PT;
    const scale = Math.min(2.2, Math.max(1, heightMm / 35));
    const nameSize = baseSize * scale * 1.1;
    const bodySize = baseSize * scale;
    const phoneSize = bodySize * 0.9;
    let cursor = rect.y + rect.height - pad;

    if (row.name) {
      drawFit(
        page,
        row.name,
        rect.x + pad,
        cursor - nameSize,
        nameSize,
        width,
        pdfFont,
        colors.ink,
      );
      cursor -= nameSize * 1.25;
    }

    const addressText = [row.postal, row.address].filter(Boolean).join('\n');
    const reservedPhone = row.phone ? phoneSize * 1.6 : 0;
    const available = Math.max(0, cursor - rect.y - pad - reservedPhone);
    const lineHeight = bodySize * 1.25;
    const maxLines = Math.max(1, Math.floor(available / lineHeight));
    if (addressText) {
      const lines = wrapText(addressText, bodySize, width, maxLines, pdfFont);
      for (const line of lines) {
        page.drawText(line, {
          x: rect.x + pad,
          y: cursor - bodySize,
          size: bodySize,
          font: pdfFont,
          color: colors.ink,
        });
        cursor -= lineHeight;
      }
    }

    if (row.phone) {
      drawFit(
        page,
        row.phone,
        rect.x + pad,
        cursor - phoneSize,
        phoneSize,
        width,
        pdfFont,
        colors.muted,
      );
    }
  };

  const generatePdf = async () => {
    if (running) return;
    const rows = readRows();
    if (rows.length === 0) {
      showError('라벨 내용을 하나 이상 입력하세요.');
      return;
    }

    const sheet = sheetNow();
    const per = labelsPerPage(sheet);
    const startAt = Math.min(per, Math.max(1, Number(start.value) || 1));
    const pages = pagesFor(rows, sheet, startAt);
    const baseSize = Math.max(7, Number(font.value) || 9.5);
    const borderOn = border.checked;

    running = true;
    generate.disabled = true;
    clearResult();
    showError('');
    setStatus('PDF를 만드는 중…');

    try {
      const response = await fetch('/fonts/NanumGothic-OfficeKit.ttf');
      if (!response.ok) throw new Error('한글 글꼴을 불러오지 못했습니다.');
      const fontBytes = await response.arrayBuffer();
      const { PDFDocument, rgb } = await import('pdf-lib');
      const fontkit = (await import('@pdf-lib/fontkit')).default;
      const pdf = await PDFDocument.create();
      pdf.registerFontkit(fontkit);
      pdf.setTitle('라벨 인쇄');
      pdf.setProducer('옷깃');
      pdf.setCreator('옷깃');
      const pdfFont = await pdf.embedFont(fontBytes, { subset: false });
      const pageWidth = sheet.pageWidthMm * MM_TO_PT;
      const pageHeight = sheet.pageHeightMm * MM_TO_PT;
      const rects = labelRects(sheet);
      const colors = {
        ink: rgb(0.07, 0.09, 0.11),
        muted: rgb(0.38, 0.42, 0.46),
        line: rgb(0.82, 0.84, 0.86),
      };

      for (const pageRows of pages) {
        const page = pdf.addPage([pageWidth, pageHeight]);
        pageRows.forEach((row, slot) => {
          if (!row) return;
          const rect = rects[slot];
          if (!rect) return;
          const x = rect.xMm * MM_TO_PT;
          const y = pageHeight - (rect.yMm + rect.heightMm) * MM_TO_PT;
          const width = rect.widthMm * MM_TO_PT;
          const height = rect.heightMm * MM_TO_PT;
          if (borderOn) {
            page.drawRectangle({
              x,
              y,
              width,
              height,
              borderColor: colors.line,
              borderWidth: 0.5,
            });
          }
          drawLabel(page, row, { x, y, width, height }, pdfFont, baseSize, colors);
        });
      }

      const bytes = await pdf.save();
      const buffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buffer).set(bytes);
      resultUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
      download.href = resultUrl;
      download.download = labelFileName();
      download.hidden = false;
      resultSize.textContent = formatBytes(buffer.byteLength);
      result.hidden = false;
      result.focus();
      setStatus(`${rows.length}개 라벨을 ${pages.length}페이지 PDF로 만들었습니다.`);
    } catch (cause) {
      setStatus('');
      showError(cause instanceof Error ? cause.message : 'PDF를 만들지 못했습니다.');
    } finally {
      running = false;
      generate.disabled = false;
    }
  };

  const resetAll = () => {
    preset.value = 'sheet-3x8';
    start.value = '1';
    columns.value = '3';
    rowsCount.value = '8';
    margin.value = '10';
    gap.value = '2';
    font.value = '9.5';
    border.checked = false;
    importNote.textContent = '';
    clearResult();
    showError('');
    setStatus('');
    setRows([]);
  };

  preset.addEventListener('change', refresh);
  for (const input of [columns, rowsCount, margin, gap, start]) {
    input.addEventListener('input', refresh);
  }
  font.addEventListener('change', refresh);
  border.addEventListener('change', refresh);
  fileInput.addEventListener('change', () => void handleFile(fileInput.files?.[0]));
  sample.addEventListener('click', () => {
    setRows(sampleRows());
    importNote.textContent = '예시 주소 3개를 채웠습니다. 내용은 자유롭게 고치세요.';
  });
  add.addEventListener('click', () => addRow(undefined, true));
  generate.addEventListener('click', () => void generatePdf());
  reset.addEventListener('click', resetAll);

  window.addEventListener('pagehide', () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
  });

  setRows(sampleRows());
  importNote.textContent = '예시 주소 3개로 시작합니다. 내용을 고치거나 CSV를 불러오세요.';
}
