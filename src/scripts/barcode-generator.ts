import {
  BARCODE_FORMATS,
  type BarcodeFormat,
  type BarcodeRow,
  barcodeFileName,
  barcodeLabelFileName,
  barcodeRowsFromTable,
  barcodeZipFileName,
  formatInfo,
  normalizeBarcode,
} from '@/lib/barcode';
import { formatBytes } from '@/lib/files';
import { labelRects, labelsPerPage, presetById } from '@/lib/label-print';
import { readTableFile } from '@/lib/table-file';
import { bindDrop } from './kit';

const MM_TO_PT = 72 / 25.4;
const MAX_BATCH_BYTES = 5 * 1024 * 1024;
const MAX_LABELS = 200;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

type JsBarcodeFn = (element: Element, value: string, options: Record<string, unknown>) => void;

let barcodeLoader: Promise<JsBarcodeFn> | null = null;

function loadBarcode(): Promise<JsBarcodeFn> {
  if (barcodeLoader) return barcodeLoader;
  barcodeLoader = import('jsbarcode').then((module) => {
    return (module as unknown as { default: JsBarcodeFn }).default;
  });
  return barcodeLoader;
}

const sampleFor = (format: BarcodeFormat): string =>
  ({
    CODE128: 'OK-2026-001',
    'GS1-128': '(01)12345678901231|(10)LOT-001',
    EAN13: '400638133393',
    UPC: '03600029145',
    EAN8: '9638507',
    CODE39: 'ASSET-001',
    ITF14: '1001234500001',
  })[format];

const pngBuffer = (canvas: HTMLCanvasElement): Promise<ArrayBuffer> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('PNG를 만들지 못했습니다.'));
        return;
      }
      blob.arrayBuffer().then(resolve).catch(reject);
    }, 'image/png');
  });

export function initBarcodeGenerator(): void {
  const modeSingle = byId<HTMLInputElement>('bc-mode-single');
  const modeBatch = byId<HTMLInputElement>('bc-mode-batch');
  const singlePanel = byId<HTMLElement>('bc-single-panel');
  const batchPanel = byId<HTMLElement>('bc-batch-panel');
  const formatSelect = byId<HTMLSelectElement>('bc-format');
  const formatNote = byId<HTMLElement>('bc-format-note');
  const valueInput = byId<HTMLInputElement>('bc-value');
  const sampleButton = byId<HTMLButtonElement>('bc-sample');
  const checkNote = byId<HTMLElement>('bc-check');
  const widthRange = byId<HTMLInputElement>('bc-width');
  const widthValue = byId<HTMLOutputElement>('bc-width-value');
  const heightRange = byId<HTMLInputElement>('bc-height');
  const heightValue = byId<HTMLOutputElement>('bc-height-value');
  const marginRange = byId<HTMLInputElement>('bc-margin');
  const marginValue = byId<HTMLOutputElement>('bc-margin-value');
  const display = byId<HTMLInputElement>('bc-display');
  const bearerWrap = byId<HTMLElement>('bc-bearer-wrap');
  const bearer = byId<HTMLInputElement>('bc-bearer');
  const dark = byId<HTMLInputElement>('bc-dark');
  const light = byId<HTMLInputElement>('bc-light');
  const pngButton = byId<HTMLButtonElement>('bc-png');
  const svgButton = byId<HTMLButtonElement>('bc-svg');
  const preview = document.getElementById('bc-preview') as SVGSVGElement | null;
  const previewNote = byId<HTMLElement>('bc-preview-note');
  const status = byId<HTMLElement>('bc-status');
  const error = byId<HTMLElement>('bc-error');

  const batchDrop = byId<HTMLElement>('bc-drop');
  const batchFile = byId<HTMLInputElement>('bc-file');
  const batchInner = byId<HTMLElement>('bc-batch-inner');
  const batchCount = byId<HTMLElement>('bc-count');
  const batchTable = byId<HTMLTableElement>('bc-batch-table');
  const batchNote = byId<HTMLElement>('bc-batch-note');
  const batchFormat = byId<HTMLSelectElement>('bc-batch-format');
  const batchPreset = byId<HTMLSelectElement>('bc-batch-preset');
  const batchPrice = byId<HTMLInputElement>('bc-batch-price');
  const batchBearerWrap = byId<HTMLElement>('bc-batch-bearer-wrap');
  const batchBearer = byId<HTMLInputElement>('bc-batch-bearer');
  const batchPreview = byId<HTMLElement>('bc-batch-preview');
  const batchZip = byId<HTMLButtonElement>('bc-batch-zip');
  const batchPdf = byId<HTMLButtonElement>('bc-batch-pdf');
  const batchReset = byId<HTMLButtonElement>('bc-batch-reset');

  if (
    !modeSingle ||
    !modeBatch ||
    !singlePanel ||
    !batchPanel ||
    !formatSelect ||
    !formatNote ||
    !valueInput ||
    !sampleButton ||
    !checkNote ||
    !widthRange ||
    !widthValue ||
    !heightRange ||
    !heightValue ||
    !marginRange ||
    !marginValue ||
    !display ||
    !bearerWrap ||
    !bearer ||
    !dark ||
    !light ||
    !pngButton ||
    !svgButton ||
    !preview ||
    !previewNote ||
    !status ||
    !error ||
    !batchDrop ||
    !batchFile ||
    !batchInner ||
    !batchCount ||
    !batchTable ||
    !batchNote ||
    !batchFormat ||
    !batchPreset ||
    !batchPrice ||
    !batchBearerWrap ||
    !batchBearer ||
    !batchPreview ||
    !batchZip ||
    !batchPdf ||
    !batchReset
  ) {
    return;
  }

  let previewTimer = 0;
  let previewToken = 0;
  let running = false;
  let downloadUrl: string | null = null;
  let rows: BarcodeRow[] = [];
  let lastSample = '';

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const setStatus = (message: string) => {
    status.textContent = message;
  };

  const clearDownload = () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = null;
  };

  const saveBlob = (blob: Blob, name: string) => {
    clearDownload();
    downloadUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = name;
    link.click();
    window.setTimeout(() => {
      if (!downloadUrl) return;
      URL.revokeObjectURL(downloadUrl);
      downloadUrl = null;
    }, 1000);
  };

  const addCanvasBearer = (
    canvas: HTMLCanvasElement,
    options: { height: number; margin: number; lineColor: string },
  ) => {
    const context = canvas.getContext('2d');
    if (!context) return;
    const margin = Number(options.margin) || 0;
    const height = Number(options.height) || 0;
    context.save();
    context.fillStyle = options.lineColor;
    const top = Math.max(0, margin - 10);
    context.fillRect(0, top, canvas.width, 3);
    context.fillRect(0, margin + height + 5, canvas.width, 3);
    context.restore();
  };

  const addSvgBearer = (
    svg: SVGSVGElement,
    options: { height: number; margin: number; lineColor: string },
  ) => {
    const width = Number.parseFloat(svg.getAttribute('width') ?? '') || 0;
    if (!width) return;
    const top = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    top.setAttribute('x', '0');
    top.setAttribute('y', String(Math.max(0, options.margin - 10)));
    top.setAttribute('width', String(width));
    top.setAttribute('height', '3');
    top.setAttribute('fill', options.lineColor);
    const bottom = top.cloneNode(true) as SVGRectElement;
    bottom.setAttribute('y', String(options.margin + options.height + 5));
    svg.append(top, bottom);
  };

  const barcodeOptions = (
    format: BarcodeFormat,
    extra: Record<string, unknown> = {},
  ): Record<string, unknown> => {
    const options: Record<string, unknown> = {
      format: format === 'GS1-128' ? 'CODE128' : format,
      ...extra,
    };
    if (format === 'GS1-128') options.ean128 = true;
    return options;
  };

  const syncFormatUi = () => {
    const format = formatSelect.value as BarcodeFormat;
    bearerWrap.hidden = format !== 'ITF14';
    const batch = batchFormat.value as BarcodeFormat;
    batchBearerWrap.hidden = batch !== 'ITF14';
  };

  const syncSingleOutputs = () => {
    widthValue.textContent = widthRange.value;
    heightValue.textContent = heightRange.value;
    marginValue.textContent = marginRange.value;
  };

  const singleOptions = (format: BarcodeFormat) =>
    barcodeOptions(format, {
      width: Number(widthRange.value) || 2,
      height: Number(heightRange.value) || 80,
      margin: Number(marginRange.value) || 0,
      displayValue: display.checked,
      fontSize: 16,
      lineColor: dark.value,
      background: light.value,
    });

  const renderSingle = async () => {
    const token = ++previewToken;
    const format = formatSelect.value as BarcodeFormat;
    const info = formatInfo(format);
    const normalized = normalizeBarcode(valueInput.value, format);
    formatNote.textContent = info.note;
    checkNote.textContent = normalized.message ?? '';
    checkNote.dataset.state = normalized.ok ? (normalized.message ? 'ok' : '') : 'error';
    pngButton.disabled = !normalized.ok;
    svgButton.disabled = !normalized.ok;

    if (!normalized.ok) {
      preview.replaceChildren();
      previewNote.textContent = '값을 확인하세요.';
      return;
    }

    try {
      const JsBarcode = await loadBarcode();
      if (token !== previewToken) return;
      preview.replaceChildren();
      const options = singleOptions(format);
      JsBarcode(preview, normalized.value, options);
      if (format === 'ITF14' && bearer.checked) {
        addSvgBearer(preview, {
          height: Number(options.height) || 80,
          margin: Number(options.margin) || 0,
          lineColor: String(options.lineColor ?? '#111111'),
        });
      }
      previewNote.textContent = `${info.label} · ${normalized.value.replace(/\xCF/g, '|')}`;
      showError('');
    } catch {
      if (token !== previewToken) return;
      preview.replaceChildren();
      pngButton.disabled = true;
      svgButton.disabled = true;
      previewNote.textContent = '이 값으로 바코드를 만들지 못했습니다.';
    }
  };

  const scheduleSingle = () => {
    syncSingleOutputs();
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => void renderSingle(), 160);
  };

  const downloadPng = async () => {
    const format = formatSelect.value as BarcodeFormat;
    const normalized = normalizeBarcode(valueInput.value, format);
    if (!normalized.ok) return;
    try {
      const JsBarcode = await loadBarcode();
      const canvas = document.createElement('canvas');
      const options = singleOptions(format);
      JsBarcode(canvas, normalized.value, options);
      if (format === 'ITF14' && bearer.checked) {
        addCanvasBearer(canvas, {
          height: Number(options.height) || 80,
          margin: Number(options.margin) || 0,
          lineColor: String(options.lineColor ?? '#111111'),
        });
      }
      saveBlob(
        new Blob([await pngBuffer(canvas)], { type: 'image/png' }),
        barcodeFileName(normalized.value, 'png'),
      );
      setStatus('PNG 파일을 만들었습니다.');
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : 'PNG를 만들지 못했습니다.');
    }
  };

  const downloadSvg = () => {
    const format = formatSelect.value as BarcodeFormat;
    const normalized = normalizeBarcode(valueInput.value, format);
    if (!normalized.ok || preview.childNodes.length === 0) return;
    const clone = preview.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const text = new XMLSerializer().serializeToString(clone);
    saveBlob(
      new Blob([`<?xml version="1.0" encoding="UTF-8"?>${text}`], {
        type: 'image/svg+xml;charset=utf-8',
      }),
      barcodeFileName(normalized.value, 'svg'),
    );
    setStatus('SVG 파일을 만들었습니다.');
  };

  const normalizeRow = (row: BarcodeRow, format: BarcodeFormat) =>
    normalizeBarcode(row.code, format);

  const renderBatchPreview = async () => {
    const format = batchFormat.value as BarcodeFormat;
    const token = ++previewToken;
    batchPreview.replaceChildren();
    const previewRows = rows.slice(0, 3);
    if (previewRows.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'bc-batch-empty';
      empty.textContent = 'CSV를 불러오면 미리보기가 표시됩니다.';
      batchPreview.append(empty);
      return;
    }

    try {
      const JsBarcode = await loadBarcode();
      for (const [index, row] of previewRows.entries()) {
        const normalized = normalizeRow(row, format);
        const card = document.createElement('div');
        card.className = 'bc-card';
        if (!normalized.ok) {
          card.classList.add('is-error');
          card.textContent = `${index + 1}번 코드 오류`;
          batchPreview.append(card);
          continue;
        }
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        const previewOptions = barcodeOptions(format, {
          width: 1.4,
          height: 42,
          margin: 4,
          displayValue: true,
          fontSize: 10,
          lineColor: '#111111',
          background: '#ffffff',
        });
        JsBarcode(svg, normalized.value, previewOptions);
        if (format === 'ITF14' && batchBearer.checked) {
          addSvgBearer(svg, {
            height: 42,
            margin: 4,
            lineColor: '#111111',
          });
        }
        if (token !== previewToken) return;
        const label = document.createElement('span');
        label.textContent = row.name || normalized.value;
        card.append(svg, label);
        batchPreview.append(card);
      }
    } catch {
      const empty = document.createElement('p');
      empty.className = 'bc-batch-empty';
      empty.textContent = '미리보기를 만들지 못했습니다.';
      batchPreview.append(empty);
    }
  };

  const renderBatch = () => {
    const format = batchFormat.value as BarcodeFormat;
    let valid = 0;
    const thead = document.createElement('thead');
    const headRow = document.createElement('tr');
    for (const label of ['코드', '상품명', '가격', '상태']) {
      const th = document.createElement('th');
      th.scope = 'col';
      th.textContent = label;
      headRow.append(th);
    }
    thead.append(headRow);

    const tbody = document.createElement('tbody');
    rows.forEach((row) => {
      const check = normalizeRow(row, format);
      if (check.ok) valid += 1;
      const tr = document.createElement('tr');
      const code = document.createElement('td');
      code.textContent = row.code;
      if (!check.ok) code.classList.add('is-invalid');
      const name = document.createElement('td');
      name.textContent = row.name || '—';
      const price = document.createElement('td');
      price.textContent = row.price || '—';
      const statusCell = document.createElement('td');
      statusCell.textContent = check.ok ? '정상' : '형식 오류';
      if (!check.ok) statusCell.classList.add('is-invalid');
      tr.append(code, name, price, statusCell);
      tbody.append(tr);
    });
    batchTable.replaceChildren(thead, tbody);
    batchCount.textContent = `${rows.length}개`;
    batchNote.textContent =
      valid === rows.length
        ? `${rows.length}개 코드가 모두 형식에 맞습니다.`
        : `${rows.length}개 중 ${valid}개가 정상입니다. 형식이 맞지 않는 코드는 생성에서 제외됩니다.`;
    batchZip.disabled = valid === 0;
    batchPdf.disabled = valid === 0;
    void renderBatchPreview();
  };

  const validRows = (format: BarcodeFormat) =>
    rows
      .map((row) => ({ row, check: normalizeRow(row, format) }))
      .filter(
        (entry): entry is { row: BarcodeRow; check: { ok: true; value: string } } => entry.check.ok,
      );

  const loadBatch = async (file: File | undefined) => {
    if (!file || running) return;
    if (file.size > MAX_BATCH_BYTES) {
      showError(`CSV·XLSX 파일은 ${formatBytes(MAX_BATCH_BYTES)} 이하만 불러올 수 있습니다.`);
      return;
    }
    showError('');
    setStatus('상품 목록을 읽는 중…');
    try {
      const table = await readTableFile(file);
      const parsed = barcodeRowsFromTable(table.rows);
      if (parsed.rows.length === 0) {
        showError('바코드 코드를 찾지 못했습니다. 첫 열에 코드를 넣어 주세요.');
        setStatus('');
        return;
      }
      rows = parsed.rows.slice(0, MAX_LABELS);
      batchInner.hidden = false;
      batchDrop.hidden = true;
      renderBatch();
      setStatus(
        parsed.hasHeader
          ? `${rows.length}개 상품을 불러왔습니다.`
          : `${rows.length}개 항목을 불러왔습니다. 머리글 없이 읽었습니다.`,
      );
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : '파일을 읽지 못했습니다.');
      setStatus('');
    } finally {
      batchFile.value = '';
    }
  };

  const renderBatchCanvas = async (
    value: string,
    format: BarcodeFormat,
    large = false,
    withBearer = false,
  ) => {
    const JsBarcode = await loadBarcode();
    const canvas = document.createElement('canvas');
    const options = barcodeOptions(format, {
      width: large ? 2 : 1.6,
      height: large ? 60 : 48,
      margin: large ? 10 : 5,
      displayValue: true,
      fontSize: large ? 14 : 11,
      lineColor: '#111111',
      background: '#ffffff',
    });
    JsBarcode(canvas, value, options);
    if (format === 'ITF14' && withBearer) {
      addCanvasBearer(canvas, {
        height: Number(options.height) || 48,
        margin: Number(options.margin) || 0,
        lineColor: '#111111',
      });
    }
    return canvas;
  };

  const generateZip = async () => {
    if (running) return;
    const format = batchFormat.value as BarcodeFormat;
    const valid = validRows(format);
    if (valid.length === 0) {
      showError('형식에 맞는 코드가 없습니다.');
      return;
    }
    running = true;
    batchZip.disabled = true;
    batchPdf.disabled = true;
    showError('');
    setStatus('바코드 PNG를 만드는 중…');
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      const used = new Set<string>();
      for (const [index, entry] of valid.entries()) {
        const canvas = await renderBatchCanvas(
          entry.check.value,
          format,
          false,
          format === 'ITF14' && batchBearer.checked,
        );
        let name = barcodeFileName(entry.check.value, 'png');
        if (used.has(name)) {
          const stem = name.slice(0, -4);
          let suffix = 1;
          while (used.has(`${stem} (${suffix}).png`)) suffix += 1;
          name = `${stem} (${suffix}).png`;
        }
        used.add(name);
        zip.file(name, await pngBuffer(canvas));
        if (index % 5 === 0) {
          setStatus(`바코드 PNG를 만드는 중… ${index + 1} / ${valid.length}`);
          await new Promise((resolve) => window.setTimeout(resolve, 0));
        }
      }
      const blob = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
      saveBlob(blob, barcodeZipFileName());
      setStatus(`${valid.length}개 바코드를 ZIP으로 만들었습니다.`);
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : 'ZIP을 만들지 못했습니다.');
      setStatus('');
    } finally {
      running = false;
      batchZip.disabled = false;
      batchPdf.disabled = false;
    }
  };

  const generateLabelPdf = async () => {
    if (running) return;
    const format = batchFormat.value as BarcodeFormat;
    const valid = validRows(format);
    if (valid.length === 0) {
      showError('형식에 맞는 코드가 없습니다.');
      return;
    }

    running = true;
    batchZip.disabled = true;
    batchPdf.disabled = true;
    showError('');
    setStatus('라벨 PDF를 만드는 중…');
    try {
      const response = await fetch('/fonts/NanumGothic-OfficeKit.ttf');
      if (!response.ok) throw new Error('한글 글꼴을 불러오지 못했습니다.');
      const { PDFDocument, rgb } = await import('pdf-lib');
      const fontkit = (await import('@pdf-lib/fontkit')).default;
      const pdf = await PDFDocument.create();
      pdf.registerFontkit(fontkit);
      pdf.setTitle('바코드 라벨');
      pdf.setProducer('옷깃');
      pdf.setCreator('옷깃');
      const font = await pdf.embedFont(await response.arrayBuffer(), { subset: false });
      const sheet = presetById(batchPreset.value);
      const perPage = labelsPerPage(sheet);
      const rects = labelRects(sheet);
      const pageWidth = sheet.pageWidthMm * MM_TO_PT;
      const pageHeight = sheet.pageHeightMm * MM_TO_PT;
      const pad = 2.2 * MM_TO_PT;

      for (let start = 0; start < valid.length; start += perPage) {
        const page = pdf.addPage([pageWidth, pageHeight]);
        const pageRows = valid.slice(start, start + perPage);
        for (const [index, entry] of pageRows.entries()) {
          const rect = rects[index];
          if (!rect) continue;
          const canvas = await renderBatchCanvas(
            entry.check.value,
            format,
            true,
            format === 'ITF14' && batchBearer.checked,
          );
          const bytes = await pngBuffer(canvas);
          const image = await pdf.embedPng(bytes);
          const x = rect.xMm * MM_TO_PT;
          const y = pageHeight - (rect.yMm + rect.heightMm) * MM_TO_PT;
          const width = rect.widthMm * MM_TO_PT;
          const height = rect.heightMm * MM_TO_PT;
          const available = width - pad * 2;
          const targetHeight = Math.min(height * 0.5, 40);
          const scale = Math.min(available / image.width, targetHeight / image.height);
          const drawWidth = image.width * scale;
          const drawHeight = image.height * scale;
          const imageY = y + height - pad - drawHeight;
          page.drawImage(image, {
            x: x + (width - drawWidth) / 2,
            y: imageY,
            width: drawWidth,
            height: drawHeight,
          });

          let textY = imageY - 9;
          if (entry.row.name) {
            const name = entry.row.name.slice(0, 30);
            page.drawText(name, {
              x: x + pad,
              y: textY,
              size: 7.5,
              font,
              color: rgb(0.07, 0.09, 0.11),
            });
            textY -= 8;
          }
          if (batchPrice.checked && entry.row.price) {
            const price = entry.row.price.slice(0, 20);
            page.drawText(price, {
              x: x + pad,
              y: textY,
              size: 7.5,
              font,
              color: rgb(0.38, 0.42, 0.46),
            });
          }
        }
        setStatus(
          `라벨 PDF를 만드는 중… ${Math.min(start + perPage, valid.length)} / ${valid.length}`,
        );
        await new Promise((resolve) => window.setTimeout(resolve, 0));
      }

      const bytes = await pdf.save();
      const buffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buffer).set(bytes);
      saveBlob(new Blob([buffer], { type: 'application/pdf' }), barcodeLabelFileName());
      setStatus(`${valid.length}개 바코드를 라벨 PDF로 만들었습니다.`);
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : '라벨 PDF를 만들지 못했습니다.');
      setStatus('');
    } finally {
      running = false;
      batchZip.disabled = false;
      batchPdf.disabled = false;
    }
  };

  const resetBatch = () => {
    rows = [];
    batchFile.value = '';
    batchInner.hidden = true;
    batchDrop.hidden = false;
    batchTable.replaceChildren();
    batchPreview.replaceChildren();
    batchCount.textContent = '0개';
    batchNote.textContent = '';
    batchZip.disabled = true;
    batchPdf.disabled = true;
    showError('');
    setStatus('');
  };

  const setMode = (batch: boolean) => {
    modeSingle.checked = !batch;
    modeBatch.checked = batch;
    singlePanel.hidden = batch;
    batchPanel.hidden = !batch;
    showError('');
    setStatus('');
    if (!batch) void renderSingle();
    else if (rows.length > 0) renderBatch();
  };

  formatSelect.addEventListener('change', () => {
    const format = formatSelect.value as BarcodeFormat;
    formatNote.textContent = formatInfo(format).note;
    syncFormatUi();
    if (!valueInput.value.trim() || valueInput.value === lastSample) {
      valueInput.value = sampleFor(format);
    }
    lastSample = sampleFor(format);
    scheduleSingle();
  });
  valueInput.addEventListener('input', scheduleSingle);
  sampleButton.addEventListener('click', () => {
    const format = formatSelect.value as BarcodeFormat;
    valueInput.value = sampleFor(format);
    lastSample = valueInput.value;
    scheduleSingle();
  });
  for (const input of [widthRange, heightRange, marginRange, dark, light]) {
    input.addEventListener('input', scheduleSingle);
  }
  display.addEventListener('change', scheduleSingle);
  bearer.addEventListener('change', scheduleSingle);
  pngButton.addEventListener('click', () => void downloadPng());
  svgButton.addEventListener('click', downloadSvg);

  bindDrop(batchFile, batchDrop, (files) => void loadBatch(files[0]));
  batchFormat.addEventListener('change', () => {
    syncFormatUi();
    renderBatch();
  });
  batchPreset.addEventListener('change', () =>
    setStatus('라벨 규격을 바꿨습니다. 라벨 PDF를 다시 만들어 주세요.'),
  );
  batchPrice.addEventListener('change', () =>
    setStatus('가격 표시를 바꿨습니다. 라벨 PDF를 다시 만들어 주세요.'),
  );
  batchZip.addEventListener('click', () => void generateZip());
  batchPdf.addEventListener('click', () => void generateLabelPdf());
  batchReset.addEventListener('click', resetBatch);
  modeSingle.addEventListener('change', () => setMode(false));
  modeBatch.addEventListener('change', () => setMode(true));

  window.addEventListener('pagehide', () => {
    clearDownload();
    previewToken += 1;
    rows = [];
  });

  const initialFormat = BARCODE_FORMATS[0]?.id ?? 'CODE128';
  formatSelect.value = initialFormat;
  valueInput.value = sampleFor(initialFormat);
  lastSample = valueInput.value;
  formatNote.textContent = formatInfo(initialFormat).note;
  syncFormatUi();
  syncSingleOutputs();
  void renderSingle();
  resetBatch();
}
