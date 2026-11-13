import {
  columnWidths,
  type PdfTableOptions,
  pdfTableFileName,
  tablePages,
  truncateCell,
} from '@/lib/csv-pdf';
import { doWork } from '@/lib/do-work';
import { formatBytes, MAX_TOTAL_BYTES, safeFileName } from '@/lib/files';
import { readTableFile } from '@/lib/table-file';

interface State {
  file: File;
  rows: string[][];
  resultUrl?: string;
}

const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
} as const;

let state: State | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('표 페이지를 만들지 못했습니다.'));
    }, 'image/png');
  });
}

export function initCsvPdf(): void {
  const input = byId<HTMLInputElement>('cp-input');
  const drop = byId<HTMLElement>('cp-drop');
  const panel = byId<HTMLElement>('cp-panel');
  const fileInfo = byId<HTMLElement>('cp-file-info');
  const preview = byId<HTMLCanvasElement>('cp-canvas');
  const titleInput = byId<HTMLInputElement>('cp-title');
  const sizeSelect = byId<HTMLSelectElement>('cp-size');
  const orientationSelect = byId<HTMLSelectElement>('cp-orientation');
  const fontRange = byId<HTMLInputElement>('cp-font');
  const fontValue = byId<HTMLElement>('cp-font-value');
  const headerCheck = byId<HTMLInputElement>('cp-header');
  const pageInfo = byId<HTMLElement>('cp-page-info');
  const applyButton = byId<HTMLButtonElement>('cp-apply');
  const resetButton = byId<HTMLButtonElement>('cp-reset');
  const status = byId<HTMLElement>('cp-status');
  const error = byId<HTMLElement>('cp-error');
  const result = byId<HTMLElement>('cp-result');
  const resultPages = byId<HTMLElement>('cp-result-pages');
  const resultSize = byId<HTMLElement>('cp-result-size');
  const download = byId<HTMLAnchorElement>('cp-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !preview ||
    !sizeSelect ||
    !orientationSelect ||
    !fontRange ||
    !headerCheck ||
    !applyButton ||
    !status ||
    !error ||
    !result
  ) {
    return;
  }

  const pageSize = () => {
    const base = PAGE_SIZES[sizeSelect.value as keyof typeof PAGE_SIZES] ?? PAGE_SIZES.a4;
    return orientationSelect.value === 'landscape'
      ? { width: base.height, height: base.width }
      : { width: base.width, height: base.height };
  };

  const options = (): PdfTableOptions => ({
    pageWidth: pageSize().width,
    pageHeight: pageSize().height,
    margin: 32,
    fontSize: Math.min(14, Math.max(6, Number(fontRange.value) || 9)),
    header: headerCheck.checked,
  });

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const clearResult = () => {
    if (state?.resultUrl) {
      URL.revokeObjectURL(state.resultUrl);
      state.resultUrl = undefined;
    }
    result.hidden = true;
    download?.removeAttribute('href');
    if (download) download.hidden = true;
  };

  const drawTablePage = (
    canvas: HTMLCanvasElement,
    rows: string[][],
    pageNumber: number,
    totalPages: number,
    scale: number,
    config: PdfTableOptions,
    title: string,
  ) => {
    const width = config.pageWidth * scale;
    const height = config.pageHeight * scale;
    canvas.width = Math.max(1, Math.ceil(width));
    canvas.height = Math.max(1, Math.ceil(height));
    const context = canvas.getContext('2d');
    if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    const margin = config.margin * scale;
    const fontSize = config.fontSize * scale;
    let cursorY = margin;

    if (title.trim() !== '') {
      context.fillStyle = '#111827';
      context.font = `700 ${fontSize * 1.5}px 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif`;
      context.textBaseline = 'top';
      context.fillText(title.trim().slice(0, 120), margin, cursorY);
      cursorY += fontSize * 2;
    }

    const widths = columnWidths(rows, config.pageWidth - config.margin * 2).map(
      (value) => value * scale,
    );
    const rowHeight = fontSize * 1.7;
    const tableWidth = widths.reduce((sum, value) => sum + value, 0);
    const headerRow = config.header ? rows[0] : undefined;
    const body = config.header ? rows.slice(1) : rows;

    const drawRow = (row: string[], y: number, header: boolean, stripe: boolean) => {
      if (stripe) {
        context.fillStyle = '#f3f6f5';
        context.fillRect(margin, y, tableWidth, rowHeight);
      }
      context.fillStyle = header ? '#e8efed' : '#ffffff';
      context.fillRect(margin, y, tableWidth, header ? rowHeight : 0);
      context.strokeStyle = '#d7dedb';
      context.lineWidth = Math.max(0.5, scale * 0.5);
      context.strokeRect(margin, y, tableWidth, rowHeight);

      let x = margin;
      context.fillStyle = header ? '#111827' : '#1f2937';
      context.font = `${header ? 700 : 400} ${fontSize}px 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif`;
      context.textBaseline = 'middle';
      for (let column = 0; column < widths.length; column += 1) {
        const cellWidth = widths[column] ?? 0;
        const text = truncateCell(row[column] ?? '', cellWidth, fontSize);
        context.fillText(text, x + 4 * scale, y + rowHeight / 2, cellWidth - 8 * scale);
        x += cellWidth;
      }
    };

    if (headerRow) {
      drawRow(headerRow, cursorY, true, false);
      cursorY += rowHeight;
    }
    for (let index = 0; index < body.length; index += 1) {
      drawRow(body[index] ?? [], cursorY, false, index % 2 === 1);
      cursorY += rowHeight;
    }

    context.fillStyle = '#6b7280';
    context.font = `${fontSize * 0.8}px 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif`;
    context.textBaseline = 'alphabetic';
    context.textAlign = 'center';
    context.fillText(`${pageNumber} / ${totalPages}`, width / 2, height - margin * 0.6);
    context.textAlign = 'start';
  };

  const renderPreview = () => {
    if (!state) return;
    const config = options();
    const pages = tablePages(state.rows, config);
    if (pages.length === 0) return;
    const available = 720;
    const scale = Math.min(1.4, available / config.pageWidth);
    drawTablePage(
      preview,
      pages[0]?.rows ?? [],
      1,
      pages.length,
      scale,
      config,
      titleInput?.value ?? '',
    );
    if (pageInfo) pageInfo.textContent = `1 / ${pages.length}페이지 미리보기`;
  };

  const acceptFile = async (file: File) => {
    showError('');
    clearResult();
    if (!/\.(csv|tsv|xlsx|xls|ods)$/i.test(file.name)) {
      showError('CSV·TSV·XLSX·XLS·ODS 파일만 사용할 수 있습니다.');
      return;
    }
    if (file.size > MAX_TOTAL_BYTES) {
      showError(`파일이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다.`);
      return;
    }

    status.textContent = '표를 읽는 중…';
    try {
      const { rows, sheetName } = await readTableFile(file);
      if (rows.length === 0) throw new Error('데이터가 없습니다.');

      state = { file, rows };
      if (titleInput) titleInput.value = safeFileName(file.name.replace(/\.[^.]+$/, ''));
      if (fileInfo) {
        fileInfo.textContent = `${file.name} · ${sheetName} 시트 · ${Math.max(0, rows.length - 1)}행 · ${formatBytes(file.size)}`;
      }
      panel.hidden = false;
      status.textContent = '용지와 글자 크기를 확인한 뒤 PDF를 만드세요.';
      renderPreview();
    } catch (cause) {
      console.error(cause);
      state = null;
      panel.hidden = true;
      showError('표를 읽지 못했습니다. 파일 형식과 인코딩을 확인하세요.');
      status.textContent = '';
    }
  };

  for (const control of [titleInput, sizeSelect, orientationSelect, fontRange, headerCheck]) {
    control?.addEventListener('input', () => {
      if (fontValue) fontValue.textContent = `${fontRange.value}pt`;
      clearResult();
      renderPreview();
    });
    control?.addEventListener('change', () => {
      if (fontValue) fontValue.textContent = `${fontRange.value}pt`;
      clearResult();
      renderPreview();
    });
  }

  applyButton.addEventListener(
    'click',
    () =>
      void doWork(applyButton, async () => {
        const loaded = state;
        if (!loaded) return;
        const config = options();
        const pages = tablePages(loaded.rows, config);
        if (pages.length === 0) {
          showError('표에 데이터가 없습니다.');
          return;
        }

        clearResult();
        showError('');
        applyButton.disabled = true;
        applyButton.setAttribute('aria-busy', 'true');
        status.textContent = 'PDF 표를 만드는 중…';

        try {
          const { PDFDocument } = await import('pdf-lib');
          const pdfDoc = await PDFDocument.create();
          const scale = 150 / 72;
          const canvas = window.document.createElement('canvas');

          for (let index = 0; index < pages.length; index += 1) {
            const page = pages[index];
            if (!page) continue;
            status.textContent = `${index + 1}/${pages.length}페이지 그리는 중…`;
            drawTablePage(
              canvas,
              page.rows,
              page.pageNumber,
              pages.length,
              scale,
              config,
              titleInput?.value ?? '',
            );
            const blob = await canvasToBlob(canvas);
            const embedded = await pdfDoc.embedPng(await blob.arrayBuffer());
            const outputPage = pdfDoc.addPage([config.pageWidth, config.pageHeight]);
            outputPage.drawImage(embedded, {
              x: 0,
              y: 0,
              width: config.pageWidth,
              height: config.pageHeight,
            });
          }

          const bytes = await pdfDoc.save();
          const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
          loaded.resultUrl = URL.createObjectURL(blob);
          if (download) {
            download.href = loaded.resultUrl;
            download.download = pdfTableFileName(loaded.file.name);
            download.textContent = `PDF 표 내려받기 (${formatBytes(blob.size)})`;
            download.hidden = false;
          }
          if (resultPages) resultPages.textContent = `${pages.length}장`;
          if (resultSize) resultSize.textContent = formatBytes(blob.size);
          status.textContent = `${pages.length}장짜리 PDF 표를 만들었습니다.`;
          result.hidden = false;
          result.focus({ preventScroll: false });
        } catch (cause) {
          console.error(cause);
          showError('PDF 표를 만들지 못했습니다. 더 작은 표로 시도하세요.');
          status.textContent = '';
        } finally {
          applyButton.disabled = false;
          applyButton.removeAttribute('aria-busy');
        }
      }),
  );

  resetButton?.addEventListener('click', () => {
    state = null;
    clearResult();
    panel.hidden = true;
    status.textContent = '';
    showError('');
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
    if (file) void acceptFile(file);
  });
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void acceptFile(file);
    input.value = '';
  });

  window.addEventListener('pagehide', () => {
    if (state?.resultUrl) URL.revokeObjectURL(state.resultUrl);
  });

  if (fontValue) fontValue.textContent = `${fontRange.value}pt`;
}
