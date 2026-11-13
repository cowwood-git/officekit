import type { PDFDocumentLoadingTask, PDFDocumentProxy } from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?worker&url';
import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import {
  type FormFieldInfo,
  type FormFieldType,
  fieldTypeLabel,
  formFileName,
  isBlankFormValue,
  needsUnicodeFont,
  normalizeFieldValue,
} from '@/lib/pdf-form';

interface Loaded {
  file: File;
  bytes: ArrayBuffer;
  task: PDFDocumentLoadingTask;
  doc: PDFDocumentProxy;
  pageCount: number;
  fields: FormFieldInfo[];
}

interface FieldValue {
  name: string;
  type: FormFieldType;
  value: string | string[] | boolean;
}

let current: Loaded | null = null;
let resultUrl: string | null = null;
let running = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPdfFormFill(): void {
  const input = byId<HTMLInputElement>('pf-input');
  const drop = byId<HTMLElement>('pf-drop');
  const panel = byId<HTMLElement>('pf-panel');
  const fileInfo = byId<HTMLElement>('pf-file-info');
  const fieldList = byId<HTMLElement>('pf-fields');
  const fieldCount = byId<HTMLElement>('pf-field-count');
  const filter = byId<HTMLInputElement>('pf-filter');
  const flatten = byId<HTMLInputElement>('pf-flatten');
  const canvas = byId<HTMLCanvasElement>('pf-canvas');
  const previewWrap = byId<HTMLElement>('pf-preview-wrap');
  const previewLabel = byId<HTMLElement>('pf-preview-label');
  const applyButton = byId<HTMLButtonElement>('pf-apply');
  const resetButton = byId<HTMLButtonElement>('pf-reset');
  const status = byId<HTMLElement>('pf-status');
  const error = byId<HTMLElement>('pf-error');
  const result = byId<HTMLElement>('pf-result');
  const resultPages = byId<HTMLElement>('pf-result-pages');
  const resultSize = byId<HTMLElement>('pf-result-size');
  const download = byId<HTMLAnchorElement>('pf-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !fieldList ||
    !filter ||
    !flatten ||
    !canvas ||
    !previewWrap ||
    !applyButton ||
    !status ||
    !error ||
    !result
  ) {
    return;
  }

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const clearResult = () => {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      resultUrl = null;
    }
    result.hidden = true;
    download?.removeAttribute('href');
    if (download) download.hidden = true;
  };

  const dispose = async () => {
    if (current) {
      try {
        await current.task.destroy();
      } catch {
        // 이미 정리된 문서는 무시한다.
      }
    }
    current = null;
  };

  const createControl = (field: FormFieldInfo, index: number): HTMLElement => {
    const id = `pf-field-${index}`;
    if (field.type === 'text') {
      if (field.multiline) {
        const textarea = document.createElement('textarea');
        textarea.id = id;
        textarea.rows = 3;
        textarea.value = field.value;
        textarea.disabled = field.readOnly;
        return textarea;
      }
      const inputElement = document.createElement('input');
      inputElement.id = id;
      inputElement.type = 'text';
      inputElement.value = field.value;
      inputElement.disabled = field.readOnly;
      return inputElement;
    }

    if (field.type === 'checkbox') {
      const checkbox = document.createElement('input');
      checkbox.id = id;
      checkbox.type = 'checkbox';
      checkbox.checked = field.value === 'true';
      checkbox.disabled = field.readOnly;
      return checkbox;
    }

    if (field.type === 'radio' || field.type === 'dropdown') {
      const select = document.createElement('select');
      select.id = id;
      if (field.type === 'dropdown') {
        const blank = document.createElement('option');
        blank.value = '';
        blank.textContent = '(선택 안 함)';
        select.append(blank);
      }
      for (const option of field.options) {
        const element = document.createElement('option');
        element.value = option;
        element.textContent = option;
        select.append(element);
      }
      select.value = field.value;
      select.disabled = field.readOnly;
      return select;
    }

    if (field.type === 'optionlist') {
      const select = document.createElement('select');
      select.id = id;
      select.multiple = true;
      select.size = Math.min(4, Math.max(2, field.options.length));
      const selected = new Set(field.value.split('\u0000'));
      for (const option of field.options) {
        const element = document.createElement('option');
        element.value = option;
        element.textContent = option;
        element.selected = selected.has(option);
        select.append(element);
      }
      select.disabled = field.readOnly;
      return select;
    }

    const unsupported = document.createElement('p');
    unsupported.className = 'pf-unsupported';
    unsupported.textContent = '이 필드 유형은 아직 지원하지 않습니다.';
    return unsupported;
  };

  const renderFields = () => {
    if (!current) return;
    fieldList.replaceChildren();
    const query = filter.value.trim().toLowerCase();
    let visible = 0;

    current.fields.forEach((field, index) => {
      if (query && !field.name.toLowerCase().includes(query)) return;
      visible += 1;
      const row = document.createElement('div');
      row.className = 'pf-field';

      const head = document.createElement('div');
      head.className = 'pf-field-head';
      const name = document.createElement('label');
      name.htmlFor = `pf-field-${index}`;
      name.textContent = field.name;
      const badge = document.createElement('span');
      badge.className = 'pf-badge';
      badge.textContent = fieldTypeLabel(field.type);
      head.append(name, badge);
      if (field.readOnly) {
        const readOnly = document.createElement('span');
        readOnly.className = 'pf-readonly';
        readOnly.textContent = '읽기 전용';
        head.append(readOnly);
      }

      row.append(head, createControl(field, index));
      fieldList.append(row);
    });

    if (fieldCount) fieldCount.textContent = `${visible} / ${current.fields.length}개 필드`;
    if (visible === 0) {
      const empty = document.createElement('p');
      empty.className = 'muted';
      empty.textContent = '검색과 일치하는 필드가 없습니다.';
      fieldList.append(empty);
    }
  };

  const renderPreview = async () => {
    if (!current) return;
    let page: Awaited<ReturnType<PDFDocumentProxy['getPage']>> | null = null;
    try {
      page = await current.doc.getPage(1);
      const base = page.getViewport({ scale: 1 });
      const available = Math.max(280, previewWrap.clientWidth - 24 || 560);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const scale = Math.min(2, (available / base.width) * dpr);
      const viewport = page.getViewport({ scale });
      canvas.width = Math.max(1, Math.ceil(viewport.width));
      canvas.height = Math.max(1, Math.ceil(viewport.height));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('캔버스를 사용할 수 없습니다.');
      await page.render({ canvas, viewport }).promise;

      const annotations = await page.getAnnotations({ intent: 'display' });
      context.save();
      context.font = `${Math.max(9, 10 * scale)}px 'Apple SD Gothic Neo', 'Malgun Gothic', system-ui, sans-serif`;
      for (const annotation of annotations) {
        if (!('fieldName' in annotation) || !annotation.fieldName) continue;
        const [x1, y1] = viewport.convertToViewportPoint(annotation.rect[0], annotation.rect[1]);
        const [x2, y2] = viewport.convertToViewportPoint(annotation.rect[2], annotation.rect[3]);
        const x = Math.min(x1, x2);
        const y = Math.min(y1, y2);
        const width = Math.abs(x2 - x1);
        const height = Math.abs(y2 - y1);
        context.fillStyle = 'rgba(11, 107, 91, 0.16)';
        context.fillRect(x, y, width, height);
        context.strokeStyle = 'rgba(11, 107, 91, 0.8)';
        context.lineWidth = 1;
        context.strokeRect(x, y, width, height);
        if (width > 60 && height > 24) {
          context.fillStyle = '#0b6b5b';
          context.fillText(String(annotation.fieldName), x + 2, Math.max(10, y - 3));
        }
      }
      context.restore();
      if (previewLabel) {
        previewLabel.textContent = `1쪽 필드 위치 · ${current.fields.length}개`;
      }
    } catch (cause) {
      console.error(cause);
      showError('필드 미리보기를 그리지 못했습니다.');
    } finally {
      page?.cleanup();
    }
  };

  const acceptFile = async (file: File) => {
    if (running) return;
    showError('');
    clearResult();
    await dispose();
    const validation = validatePdfSelection([file]);
    if (!validation.ok) {
      showError(validation.errors.join(' '));
      return;
    }

    status.textContent = 'PDF 양식을 읽는 중…';
    try {
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
      const bytes = await file.arrayBuffer();
      const task = pdfjs.getDocument({
        data: new Uint8Array(bytes.slice(0)),
        cMapUrl: '/pdfjs/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '/pdfjs/standard_fonts/',
        wasmUrl: '/pdfjs/wasm/',
        iccUrl: '/pdfjs/iccs/',
      });
      const doc = await task.promise;

      const { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, PDFOptionList } =
        await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(bytes.slice(0), { ignoreEncryption: false });
      const form = pdfDoc.getForm();
      const fields: FormFieldInfo[] = form.getFields().map((field) => {
        const name = field.getName();
        if (field instanceof PDFTextField) {
          return {
            name,
            type: 'text',
            value: field.getText() ?? '',
            options: [],
            multiline: field.isMultiline(),
            readOnly: field.isReadOnly(),
          };
        }
        if (field instanceof PDFCheckBox) {
          return {
            name,
            type: 'checkbox',
            value: field.isChecked() ? 'true' : 'false',
            options: [],
            multiline: false,
            readOnly: field.isReadOnly(),
          };
        }
        if (field instanceof PDFRadioGroup) {
          return {
            name,
            type: 'radio',
            value: field.getSelected() ?? '',
            options: field.getOptions(),
            multiline: false,
            readOnly: field.isReadOnly(),
          };
        }
        if (field instanceof PDFDropdown) {
          return {
            name,
            type: 'dropdown',
            value: field.getSelected()[0] ?? '',
            options: field.getOptions(),
            multiline: false,
            readOnly: field.isReadOnly(),
          };
        }
        if (field instanceof PDFOptionList) {
          return {
            name,
            type: 'optionlist',
            value: field.getSelected().join('\u0000'),
            options: field.getOptions(),
            multiline: false,
            readOnly: field.isReadOnly(),
          };
        }
        return {
          name,
          type: 'unsupported',
          value: '',
          options: [],
          multiline: false,
          readOnly: true,
        };
      });

      if (fields.length === 0) {
        await task.destroy();
        showError('입력 가능한 양식 필드가 없습니다. 스캔 PDF는 PDF OCR을 사용하세요.');
        status.textContent = '';
        return;
      }

      current = { file, bytes, task, doc, pageCount: doc.numPages, fields };
      if (fileInfo) {
        fileInfo.textContent = `${file.name} · ${doc.numPages}쪽 · 필드 ${fields.length}개 · ${formatBytes(file.size)}`;
      }
      panel.hidden = false;
      renderFields();
      await renderPreview();
      status.textContent = '값을 입력한 뒤 저장하세요.';
    } catch (cause) {
      console.error(cause);
      current = null;
      panel.hidden = true;
      showError('PDF 양식을 열 수 없습니다. 암호가 걸렸거나 손상된 파일인지 확인하세요.');
      status.textContent = '';
    }
  };

  const readValues = (): FieldValue[] => {
    if (!current) return [];
    return current.fields.map((field, index) => {
      const control = document.getElementById(`pf-field-${index}`);
      if (field.type === 'text') {
        const value =
          control instanceof HTMLTextAreaElement || control instanceof HTMLInputElement
            ? control.value
            : field.value;
        return { name: field.name, type: field.type, value: normalizeFieldValue(value) };
      }
      if (field.type === 'checkbox') {
        return {
          name: field.name,
          type: field.type,
          value: control instanceof HTMLInputElement ? control.checked : false,
        };
      }
      if (field.type === 'optionlist') {
        return {
          name: field.name,
          type: field.type,
          value:
            control instanceof HTMLSelectElement
              ? [...control.selectedOptions].map((option) => option.value)
              : [],
        };
      }
      if (field.type === 'radio' || field.type === 'dropdown') {
        return {
          name: field.name,
          type: field.type,
          value: control instanceof HTMLSelectElement ? control.value : '',
        };
      }
      return { name: field.name, type: field.type, value: '' };
    });
  };

  let koreanFontPromise: Promise<ArrayBuffer> | null = null;
  const loadKoreanFont = (): Promise<ArrayBuffer> => {
    if (!koreanFontPromise) {
      koreanFontPromise = fetch('/fonts/NanumGothic-OfficeKit.ttf').then((response) => {
        if (!response.ok) throw new Error('한글 폰트를 불러오지 못했습니다.');
        return response.arrayBuffer();
      });
    }
    return koreanFontPromise;
  };

  const run = async () => {
    const loaded = current;
    if (!loaded || running) return;
    const values = readValues();
    const textValues = values
      .filter((value) => typeof value.value === 'string' || Array.isArray(value.value))
      .map((value) => value.value as string | string[]);
    const unicode = needsUnicodeFont(textValues);

    clearResult();
    showError('');
    running = true;
    applyButton.disabled = true;
    applyButton.setAttribute('aria-busy', 'true');
    if (resetButton) resetButton.disabled = true;
    status.textContent = '양식을 채우는 중…';

    try {
      const { default: fontkit } = await import('@pdf-lib/fontkit');
      const {
        PDFDocument,
        StandardFonts,
        PDFTextField,
        PDFCheckBox,
        PDFRadioGroup,
        PDFDropdown,
        PDFOptionList,
      } = await import('pdf-lib');
      const pdfDoc = await PDFDocument.load(loaded.bytes.slice(0));
      pdfDoc.registerFontkit(fontkit);
      const font = unicode
        ? await pdfDoc.embedFont(await loadKoreanFont(), { subset: false })
        : await pdfDoc.embedFont(StandardFonts.Helvetica);
      const form = pdfDoc.getForm();
      const problems: string[] = [];

      for (const value of values) {
        try {
          const field = form.getField(value.name);
          if (field instanceof PDFTextField) {
            field.setText(isBlankFormValue(value.value) ? undefined : String(value.value));
          } else if (field instanceof PDFCheckBox) {
            if (value.value === true) field.check();
            else field.uncheck();
          } else if (field instanceof PDFRadioGroup) {
            if (!isBlankFormValue(value.value)) field.select(String(value.value));
            else field.clear();
          } else if (field instanceof PDFDropdown) {
            if (!isBlankFormValue(value.value)) field.select(String(value.value));
            else field.clear();
          } else if (field instanceof PDFOptionList) {
            const list = Array.isArray(value.value) ? value.value : [];
            if (list.length > 0) field.select(list);
            else field.clear();
          }
        } catch (cause) {
          problems.push(`${value.name}: ${cause instanceof Error ? cause.message : '오류'}`);
        }
      }

      try {
        form.updateFieldAppearances(font);
        for (const field of form.getFields()) {
          if (
            field instanceof PDFTextField ||
            field instanceof PDFDropdown ||
            field instanceof PDFOptionList
          ) {
            try {
              field.setFontSize(10);
            } catch {
              // 기본 DA가 없는 필드는 자동 크기를 유지한다.
            }
          }
        }
        form.updateFieldAppearances(font);
      } catch (cause) {
        console.warn('일부 필드 모양을 갱신하지 못했습니다.', cause);
      }
      if (flatten.checked) form.flatten();

      const bytes = await pdfDoc.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);
      if (download) {
        download.href = resultUrl;
        download.download = formFileName(loaded.file.name);
        download.textContent = `채운 PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultPages) resultPages.textContent = `${loaded.pageCount}쪽`;
      if (resultSize) resultSize.textContent = formatBytes(blob.size);
      status.textContent =
        problems.length > 0
          ? `${values.length - problems.length}개 필드를 채웠습니다. ${problems.length}개는 실패했습니다.`
          : `${values.length}개 필드를 채웠습니다.`;
      if (problems.length > 0) {
        showError(`일부 필드를 채우지 못했습니다: ${problems.slice(0, 3).join(' / ')}`);
      }
      result.hidden = false;
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError('양식을 채우지 못했습니다. 암호가 걸린 PDF인지 확인하세요.');
      status.textContent = '';
    } finally {
      running = false;
      applyButton.disabled = false;
      applyButton.removeAttribute('aria-busy');
      if (resetButton) resetButton.disabled = false;
    }
  };

  filter.addEventListener('input', renderFields);
  applyButton.addEventListener('click', () => void doWork(applyButton, run));

  resetButton?.addEventListener('click', () => {
    void dispose();
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

  window.addEventListener('resize', () => void renderPreview());
  window.addEventListener('pagehide', () => void dispose());
}
