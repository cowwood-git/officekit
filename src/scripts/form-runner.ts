/**
 * 양식 실행기 — 입력값 → 레이아웃 → SVG 미리보기/PDF.
 *
 * 화면과 PDF가 같은 layoutDocument 결과를 쓰기 때문에 미리보기와 출력이 어긋나지 않는다.
 * 입력값과 반복 입력(품목·지출 내역)은 이 브라우저(localStorage)에만 임시 저장한다.
 */

import type { DocFonts } from '@/lib/doc/fonts';
import { todayIso } from '@/lib/doc/format';
import { layoutDocument } from '@/lib/doc/layout';
import { renderSvg } from '@/lib/doc/svg';
import type {
  DocImageAsset,
  DocPage,
  FormRow,
  FormRows,
  FormTemplate,
  FormValues,
  RepeatGroup,
} from '@/lib/doc/types';
import { formatBytes, safeFileName } from '@/lib/files';
import {
  makeDocumentNumber,
  normalizePrefix,
  readFormPrefix,
  replaceDocumentPrefix,
  saveFormPrefix,
} from '@/lib/form-prefix';
import type { HwpFormat } from '@/lib/hwp-export';

const REGULAR_FONT_URL = '/fonts/NanumGothic-OfficeKit.ttf';
const BOLD_FONT_URL = '/fonts/NanumGothic-Bold-OfficeKit.ttf';
const DRAFT_V1 = 'officekit.forms.draft.v1.';
const DRAFT_V2 = 'officekit.forms.draft.v2.';
const COMPANY_KEY = 'officekit.forms.company.v1';

type InputElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
type ItemsLayout = 'body' | 'attachment';

interface CompanyProfile {
  company: string;
  businessNumber: string;
  representative: string;
  address: string;
  contact: string;
  logo?: DocImageAsset | null;
  seal?: DocImageAsset | null;
}

interface RoleValue {
  label: string;
  enabled: boolean;
}

function parseRoleValue(raw: string): RoleValue[] {
  const value = raw.trim();
  if (!value) return [];
  if (value.startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(
            (item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object',
          )
          .map((item) => ({
            label: typeof item.label === 'string' ? item.label : '',
            enabled: item.enabled === true,
          }));
      }
    } catch {
      // 예전 쉼표 형식으로 이어서 처리한다.
    }
  }
  return value
    .split(',')
    .map((label) => label.trim())
    .filter(Boolean)
    .map((label) => ({ label, enabled: true }));
}

function countEnabledRoles(raw: string): number {
  return parseRoleValue(raw).filter((role) => role.enabled && role.label.trim()).length;
}

interface FormState {
  values: FormValues;
  rows: FormRows;
}

interface Elements {
  root: HTMLElement;
  form: HTMLElement;
  stage: HTMLElement | null;
  preview: HTMLElement | null;
  status: HTMLElement | null;
  error: HTMLElement | null;
  saveNote: HTMLElement | null;
  companyStatus: HTMLElement | null;
  download: HTMLButtonElement | null;
  fillSample: HTMLButtonElement | null;
  reset: HTMLButtonElement | null;
  prev: HTMLButtonElement | null;
  next: HTMLButtonElement | null;
  pageLabel: HTMLElement | null;
  inputs: Map<string, InputElement>;
  computed: Map<string, HTMLOutputElement>;
  roleGroups: Map<string, HTMLInputElement[]>;
  rowTemplates: Map<string, HTMLElement>;
  modeButtons: HTMLButtonElement[];
}

function find<T extends HTMLElement>(root: ParentNode, selector: string): T | null {
  return root.querySelector<T>(selector);
}

function collectElements(
  root: HTMLElement,
  form: HTMLElement,
  preview: HTMLElement | null,
): Elements {
  const inputs = new Map<string, InputElement>();
  for (const input of form.querySelectorAll<InputElement>('[data-field]')) {
    const id = input.dataset.field;
    if (id) inputs.set(id, input);
  }

  const computed = new Map<string, HTMLOutputElement>();
  for (const output of root.querySelectorAll<HTMLOutputElement>('[data-computed]')) {
    const id = output.dataset.computed;
    if (id) computed.set(id, output);
  }

  const roleGroups = new Map<string, HTMLInputElement[]>();
  for (const option of form.querySelectorAll<HTMLInputElement>('[data-role-option]')) {
    const id = option.dataset.roleOption;
    if (!id) continue;
    const list = roleGroups.get(id) ?? [];
    list.push(option);
    roleGroups.set(id, list);
  }

  const rowTemplates = new Map<string, HTMLElement>();
  for (const groupEl of root.querySelectorAll<HTMLElement>('[data-row-group]')) {
    const id = groupEl.dataset.rowGroup;
    if (!id) continue;
    const first = groupEl.querySelector<HTMLElement>('[data-row-list] > [data-row]');
    if (first) rowTemplates.set(id, first.cloneNode(true) as HTMLElement);
  }

  return {
    root,
    form,
    stage: preview ? find<HTMLElement>(preview, '[data-preview-stage]') : null,
    preview,
    status: find<HTMLElement>(root, '[data-form-status]'),
    error: find<HTMLElement>(root, '[data-form-error]'),
    saveNote: find<HTMLElement>(root, '[data-save-note]'),
    companyStatus: find<HTMLElement>(root, '[data-company-status]'),
    download: find<HTMLButtonElement>(root, '[data-download]'),
    fillSample: find<HTMLButtonElement>(root, '[data-fill-sample]'),
    reset: find<HTMLButtonElement>(root, '[data-reset]'),
    prev: preview ? find<HTMLButtonElement>(preview, '[data-page-prev]') : null,
    next: preview ? find<HTMLButtonElement>(preview, '[data-page-next]') : null,
    pageLabel: preview ? find<HTMLElement>(preview, '[data-page-label]') : null,
    inputs,
    computed,
    roleGroups,
    rowTemplates,
    modeButtons: preview ? [...preview.querySelectorAll<HTMLButtonElement>('[data-mode]')] : [],
  };
}

function emptyRow(group: RepeatGroup): FormRow {
  const row: FormRow = {};
  for (const column of group.columns) {
    if (column.type !== 'computed') row[column.id] = '';
  }
  return row;
}

function hasRowValue(group: RepeatGroup, row: FormRow): boolean {
  return group.columns.some(
    (column) => column.type !== 'computed' && (row[column.id] ?? '').trim() !== '',
  );
}

export function initForm(template: FormTemplate): void {
  const root = document.querySelector<HTMLElement>('[data-form-page]');
  if (!root) return;
  const form = find<HTMLElement>(root, '[data-form]');
  if (!form) return;
  const preview = find<HTMLElement>(root, '[data-doc-preview]');
  const ui = collectElements(root, form, preview);
  const lightbox = preview?.querySelector<HTMLDialogElement>('[data-doc-lightbox]') ?? null;
  const lightboxPageWrap = preview?.querySelector<HTMLElement>('[data-lightbox-page-wrap]') ?? null;
  const lightboxStage = preview?.querySelector<HTMLElement>('[data-lightbox-stage]') ?? null;
  const lightboxPageLabel = preview?.querySelector<HTMLElement>('[data-lightbox-page]') ?? null;
  const lightboxPrev = preview?.querySelector<HTMLButtonElement>('[data-lightbox-prev]') ?? null;
  const lightboxNext = preview?.querySelector<HTMLButtonElement>('[data-lightbox-next]') ?? null;
  const lightboxZoomOut =
    preview?.querySelector<HTMLButtonElement>('[data-lightbox-zoom-out]') ?? null;
  const lightboxZoomIn =
    preview?.querySelector<HTMLButtonElement>('[data-lightbox-zoom-in]') ?? null;
  const lightboxFit = preview?.querySelector<HTMLButtonElement>('[data-lightbox-fit]') ?? null;
  const lightboxZoomLabel =
    preview?.querySelector<HTMLOutputElement>('[data-lightbox-zoom]') ?? null;
  const lightboxClose = preview?.querySelector<HTMLButtonElement>('[data-lightbox-close]') ?? null;
  const lightboxTriggers = preview
    ? [...preview.querySelectorAll<HTMLElement>('[data-preview-open]')]
    : [];

  let lightboxBaseWidth = 0;
  let lightboxZoom = 1;
  let fontsPromise: Promise<DocFonts> | null = null;
  let previewFontsReady = false;
  let pages: DocPage[] = [];
  let pageIndex = 0;
  let mode: 'filled' | 'blank' = 'filled';
  let previewTimer: number | null = null;
  let saveTimer: number | null = null;
  let renderToken = 0;
  let resultUrl: string | null = null;
  let docNoTouched = false;
  let formPrefix = readFormPrefix(template.slug) ?? template.docPrefix ?? '';
  let companyImages: { logo: DocImageAsset | null; seal: DocImageAsset | null } = {
    logo: null,
    seal: null,
  };

  const rowList = (group: RepeatGroup): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-row-group="${group.id}"] [data-row-list]`);

  const groupFor = (element: Element): RepeatGroup | undefined => {
    const groupEl = element.closest<HTMLElement>('[data-row-group]');
    const id = groupEl?.dataset.rowGroup;
    return id ? template.groups?.find((group) => group.id === id) : undefined;
  };

  const layoutStorageKey = `officekit.forms.layout.v1.${template.slug}`;
  const layoutRadios = [...form.querySelectorAll<HTMLInputElement>('input[name="items-layout"]')];

  const readLayoutMode = (): ItemsLayout => {
    if (layoutRadios.length === 0) return 'body';
    const checked = form.querySelector<HTMLInputElement>('input[name="items-layout"]:checked');
    return checked?.value === 'body' ? 'body' : 'attachment';
  };

  const setLayoutMode = (mode: ItemsLayout): void => {
    for (const radio of layoutRadios) radio.checked = radio.value === mode;
  };

  const saveLayoutMode = (mode: ItemsLayout): void => {
    try {
      localStorage.setItem(layoutStorageKey, mode);
    } catch {
      // 저장이 막혀도 이번 화면에서는 선택을 유지한다.
    }
  };

  const readSavedLayoutMode = (): ItemsLayout | null => {
    try {
      const value = localStorage.getItem(layoutStorageKey);
      return value === 'body' || value === 'attachment' ? value : null;
    } catch {
      return null;
    }
  };

  const updateLayoutHint = (): void => {
    const hint = root.querySelector<HTMLElement>('[data-layout-hint]');
    if (!hint) return;
    if (readLayoutMode() === 'attachment') {
      hint.textContent =
        pages.length > 1 ? `본문 1장 + 붙임 ${pages.length - 1}장` : '본문 1장 + 붙임';
    } else {
      hint.textContent = pages.length > 0 ? `본문 ${pages.length}장` : '본문에 이어서';
    }
  };

  const defaultValues = (): FormValues => {
    const values: FormValues = {};
    for (const field of template.fields) {
      if (field.type === 'computed') continue;
      values[field.id] = field.defaultValue ?? '';
      if (field.defaultToday && !values[field.id]) values[field.id] = todayIso();
    }
    if (template.docPrefix && !values.docNo) {
      values.docNo = makeDocumentNumber(
        formPrefix || template.docPrefix || '',
        values.date || todayIso(),
      );
    }
    return values;
  };

  const defaultRows = (): FormRows => {
    const rows: FormRows = {};
    for (const group of template.groups ?? []) {
      const count = Math.max(1, group.minRows ?? 1);
      rows[group.id] = Array.from({ length: count }, () => emptyRow(group));
    }
    return rows;
  };

  const computeState = (values: FormValues, rows: FormRows): FormState => {
    const computed = template.compute ? template.compute(values, rows) : {};
    return { values: { ...values, ...computed }, rows };
  };

  const defaultState = (): FormState => computeState(defaultValues(), defaultRows());

  const readRawValues = (): FormValues => {
    const values: FormValues = {};
    for (const field of template.fields) {
      if (field.type === 'computed') continue;
      if (field.type === 'roles') {
        const editor = form.querySelector<HTMLElement>(`[data-role-editor="${field.id}"]`);
        if (editor) {
          const roles = Array.from(editor.querySelectorAll<HTMLElement>('[data-role-row]')).map(
            (row) => ({
              label: row.querySelector<HTMLInputElement>('[data-role-label]')?.value.trim() ?? '',
              enabled: row.querySelector<HTMLInputElement>('[data-role-enabled]')?.checked ?? false,
            }),
          );
          values[field.id] = JSON.stringify(roles);
          continue;
        }
        const options = ui.roleGroups.get(field.id) ?? [];
        values[field.id] = options
          .filter((option) => option.checked)
          .map((option) => option.value)
          .join(',');
        continue;
      }
      const input = ui.inputs.get(field.id);
      values[field.id] = input ? input.value.trim() : '';
    }
    return values;
  };

  const readRow = (rowEl: HTMLElement, group: RepeatGroup): FormRow => {
    const row: FormRow = {};
    for (const column of group.columns) {
      if (column.type === 'computed') continue;
      const input = rowEl.querySelector<InputElement>(`[data-row-field="${column.id}"]`);
      row[column.id] = input ? input.value.trim() : '';
    }
    return row;
  };

  const readRows = (): FormRows => {
    const rows: FormRows = {};
    for (const group of template.groups ?? []) {
      const list = rowList(group);
      const groupRows: FormRow[] = [];
      if (list) {
        for (const child of Array.from(list.children)) {
          if (child instanceof HTMLElement && child.matches('[data-row]')) {
            groupRows.push(readRow(child, group));
          }
        }
      }
      rows[group.id] = groupRows;
    }
    return rows;
  };

  const readState = (): FormState => computeState(readRawValues(), readRows());

  const isDirty = (): boolean => {
    const defaults = defaultState();
    const current = readState();
    for (const field of template.fields) {
      if (field.type === 'computed') continue;
      if ((current.values[field.id] ?? '') !== (defaults.values[field.id] ?? '')) {
        return true;
      }
    }
    for (const group of template.groups ?? []) {
      const rows = current.rows[group.id] ?? [];
      if (rows.some((row) => Object.values(row).some((value) => value.trim() !== ''))) {
        return true;
      }
    }
    return false;
  };

  const companyFieldIds: Record<Exclude<keyof CompanyProfile, 'logo' | 'seal'>, string> | null =
    template.companyParty
      ? {
          company: `${template.companyParty}Company`,
          businessNumber: `${template.companyParty}Biz`,
          representative: `${template.companyParty}Ceo`,
          address: `${template.companyParty}Address`,
          contact: `${template.companyParty}Contact`,
        }
      : null;

  const parseAsset = (value: unknown): DocImageAsset | null => {
    if (!value || typeof value !== 'object') return null;
    const record = value as Record<string, unknown>;
    if (typeof record.src !== 'string' || !record.src.startsWith('data:image/')) {
      return null;
    }
    const width = typeof record.width === 'number' ? record.width : 0;
    const height = typeof record.height === 'number' ? record.height : 0;
    return width > 0 && height > 0 ? { src: record.src, width, height } : null;
  };

  const updateCompanyImagePreviews = (): void => {
    const set = (
      asset: DocImageAsset | null,
      imageSelector: string,
      removeSelector: string,
    ): void => {
      const image = root.querySelector<HTMLImageElement>(imageSelector);
      const remove = root.querySelector<HTMLButtonElement>(removeSelector);
      if (image) {
        if (asset) {
          image.src = asset.src;
          image.hidden = false;
        } else {
          image.removeAttribute('src');
          image.hidden = true;
        }
      }
      if (remove) remove.hidden = !asset;
    };
    set(companyImages.logo, '[data-company-logo-preview]', '[data-company-logo-remove]');
    set(companyImages.seal, '[data-company-seal-preview]', '[data-company-seal-remove]');
  };

  const readCompanyProfile = (): CompanyProfile | null => {
    try {
      const raw = localStorage.getItem(COMPANY_KEY);
      if (!raw) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      const record = parsed as Record<string, unknown>;
      const profile: CompanyProfile = {
        company: typeof record.company === 'string' ? record.company : '',
        businessNumber: typeof record.businessNumber === 'string' ? record.businessNumber : '',
        representative: typeof record.representative === 'string' ? record.representative : '',
        address: typeof record.address === 'string' ? record.address : '',
        contact: typeof record.contact === 'string' ? record.contact : '',
        logo: parseAsset(record.logo),
        seal: parseAsset(record.seal),
      };
      return profile.company.trim() ? profile : null;
    } catch {
      return null;
    }
  };

  const readCompanyFromForm = (): CompanyProfile | null => {
    if (!companyFieldIds) return null;
    return {
      company: ui.inputs.get(companyFieldIds.company)?.value.trim() ?? '',
      businessNumber: ui.inputs.get(companyFieldIds.businessNumber)?.value.trim() ?? '',
      representative: ui.inputs.get(companyFieldIds.representative)?.value.trim() ?? '',
      address: ui.inputs.get(companyFieldIds.address)?.value.trim() ?? '',
      contact: ui.inputs.get(companyFieldIds.contact)?.value.trim() ?? '',
      logo: companyImages.logo,
      seal: companyImages.seal,
    };
  };

  const setCompanyStatus = (message: string): void => {
    if (ui.companyStatus) ui.companyStatus.textContent = message;
  };

  const applyCompany = (profile: CompanyProfile): void => {
    if (!companyFieldIds) return;
    const entries: Array<[Exclude<keyof CompanyProfile, 'logo' | 'seal'>, string]> = [
      ['company', profile.company],
      ['businessNumber', profile.businessNumber],
      ['representative', profile.representative],
      ['address', profile.address],
      ['contact', profile.contact],
    ];
    for (const [key, value] of entries) {
      const input = ui.inputs.get(companyFieldIds[key]);
      if (input) input.value = value;
    }
    companyImages = { logo: profile.logo ?? null, seal: profile.seal ?? null };
    updateCompanyImagePreviews();
    handleInput(new Event('input'));
  };

  const readImageAsset = (file: File, maxSize: number): Promise<DocImageAsset> =>
    new Promise((resolve, reject) => {
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
        reject(new Error('PNG·JPG·WebP 이미지만 선택할 수 있습니다.'));
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        reject(new Error('2MB 이하 이미지를 선택하세요.'));
        return;
      }
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        if (!context) {
          URL.revokeObjectURL(url);
          reject(new Error('이미지를 처리하지 못했습니다.'));
          return;
        }
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve({
          src: canvas.toDataURL('image/png'),
          width: canvas.width,
          height: canvas.height,
        });
      };
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('이미지를 읽지 못했습니다.'));
      };
      image.src = url;
    });

  const fillRow = (
    rowEl: HTMLElement,
    group: RepeatGroup,
    values: FormRow,
    index: number,
  ): void => {
    rowEl.dataset.rowIndex = String(index);
    for (const column of group.columns) {
      const cell = rowEl.querySelector<HTMLElement>(`[data-row-cell="${column.id}"]`);
      if (!cell) continue;
      if (column.type === 'computed') {
        const output = cell.querySelector<HTMLOutputElement>('[data-row-computed]');
        if (output) {
          output.textContent = '—';
          output.setAttribute('aria-label', `${group.label} ${index + 1} ${column.label}`);
        }
        continue;
      }
      const input = cell.querySelector<InputElement>('[data-row-field]');
      if (!input) continue;
      const raw = values[column.id] ?? '';
      input.value =
        column.type === 'money' && /^\d+$/.test(raw)
          ? new Intl.NumberFormat('ko-KR').format(Number(raw))
          : raw;
      input.setAttribute('aria-label', `${group.label} ${index + 1} ${column.label}`);
    }
    const remove = rowEl.querySelector<HTMLButtonElement>('[data-row-remove]');
    if (remove) remove.setAttribute('aria-label', `${group.label} ${index + 1} 삭제`);
  };

  const syncRows = (group: RepeatGroup, rows: readonly FormRow[]): void => {
    const list = rowList(group);
    const templateRow = ui.rowTemplates.get(group.id);
    if (!list || !templateRow) return;
    const count = Math.max(1, rows.length);
    while (list.children.length > count) list.lastElementChild?.remove();
    while (list.children.length < count) list.append(templateRow.cloneNode(true));
    for (let index = 0; index < count; index += 1) {
      const rowEl = list.children[index];
      if (rowEl instanceof HTMLElement) {
        fillRow(rowEl, group, rows[index] ?? emptyRow(group), index);
      }
    }
  };

  const updateDerived = (state: FormState): void => {
    for (const [id, output] of ui.computed) {
      output.textContent = state.values[id] || '—';
    }
    for (const group of template.groups ?? []) {
      const list = rowList(group);
      if (list) {
        const groupRows = state.rows[group.id] ?? [];
        Array.from(list.children).forEach((child, index) => {
          if (!(child instanceof HTMLElement)) return;
          const derived = group.computeRow?.(groupRows[index] ?? {}) ?? {};
          for (const column of group.columns) {
            if (column.type !== 'computed') continue;
            const output = child.querySelector<HTMLOutputElement>(
              `[data-row-computed="${column.id}"]`,
            );
            if (output) output.textContent = derived[column.id] || '—';
          }
        });
      }
      if (group.summaryField) {
        const summary = root.querySelector<HTMLOutputElement>(`[data-row-summary="${group.id}"]`);
        if (summary) summary.textContent = state.values[group.summaryField] || '—';
      }
    }
  };

  const applyState = (state: FormState): void => {
    for (const field of template.fields) {
      if (field.type === 'computed') continue;
      if (field.type === 'roles') {
        const editor = form.querySelector<HTMLElement>(`[data-role-editor="${field.id}"]`);
        if (editor) {
          const parsed = parseRoleValue(state.values[field.id] ?? '');
          const rows = Array.from(editor.querySelectorAll<HTMLElement>('[data-role-row]'));
          rows.forEach((row, index) => {
            const role = parsed[index] ?? { label: '', enabled: false };
            const enabled = row.querySelector<HTMLInputElement>('[data-role-enabled]');
            const label = row.querySelector<HTMLInputElement>('[data-role-label]');
            if (enabled) enabled.checked = role.enabled;
            if (label) label.value = role.label || field.options?.[index] || '';
          });
          continue;
        }
        const selected = new Set(
          (state.values[field.id] ?? '')
            .split(',')
            .map((value) => value.trim())
            .filter(Boolean),
        );
        for (const option of ui.roleGroups.get(field.id) ?? []) {
          option.checked = selected.has(option.value);
        }
        continue;
      }
      const input = ui.inputs.get(field.id);
      if (input) input.value = state.values[field.id] ?? '';
    }
    for (const group of template.groups ?? []) {
      syncRows(group, state.rows[group.id] ?? []);
    }
    updateDerived(state);
  };

  const showError = (message: string): void => {
    if (ui.error) {
      ui.error.textContent = message;
      ui.error.hidden = !message;
    }
  };

  const setStatus = (message: string): void => {
    if (ui.status) ui.status.textContent = message;
  };

  const askConfirm = (message: string): Promise<boolean> => {
    const dialog = root.querySelector<HTMLDialogElement>('[data-confirm-dialog]');
    if (!dialog || typeof dialog.showModal !== 'function') {
      return Promise.resolve(window.confirm(message));
    }
    const messageEl = dialog.querySelector<HTMLElement>('[data-confirm-message]');
    if (messageEl) messageEl.textContent = message;
    return new Promise((resolve) => {
      const onClose = () => {
        dialog.removeEventListener('close', onClose);
        resolve(dialog.returnValue === 'confirm');
      };
      dialog.returnValue = 'cancel';
      dialog.addEventListener('close', onClose);
      try {
        dialog.showModal();
      } catch {
        dialog.removeEventListener('close', onClose);
        resolve(window.confirm(message));
      }
    });
  };

  const readDraftValues = (raw: unknown): FormValues => {
    const values: FormValues = {};
    if (!raw || typeof raw !== 'object') return values;
    for (const field of template.fields) {
      if (field.type === 'computed') continue;
      const value = (raw as Record<string, unknown>)[field.id];
      if (typeof value === 'string') values[field.id] = value;
    }
    return values;
  };

  const readDraftRows = (raw: unknown): FormRows => {
    const rows: FormRows = { ...defaultRows() };
    if (!raw || typeof raw !== 'object') return rows;
    for (const group of template.groups ?? []) {
      const groupRaw = (raw as Record<string, unknown>)[group.id];
      if (!Array.isArray(groupRaw) || groupRaw.length === 0) continue;
      rows[group.id] = groupRaw.slice(0, group.maxRows ?? 30).map((item) => {
        const row: FormRow = {};
        if (!item || typeof item !== 'object') return row;
        for (const column of group.columns) {
          if (column.type === 'computed') continue;
          const value = (item as Record<string, unknown>)[column.id];
          row[column.id] = typeof value === 'string' ? value : '';
        }
        return row;
      });
    }
    return rows;
  };

  const readDraft = (): FormState | null => {
    try {
      const v2 = localStorage.getItem(`${DRAFT_V2}${template.slug}`);
      if (v2) {
        const parsed: unknown = JSON.parse(v2);
        if (parsed && typeof parsed === 'object') {
          const record = parsed as Record<string, unknown>;
          return computeState(readDraftValues(record.values), readDraftRows(record.rows));
        }
      }
      const v1 = localStorage.getItem(`${DRAFT_V1}${template.slug}`);
      if (v1) {
        const parsed: unknown = JSON.parse(v1);
        if (parsed && typeof parsed === 'object') {
          return computeState(readDraftValues(parsed), defaultRows());
        }
      }
      return null;
    } catch {
      return null;
    }
  };

  const saveDraft = (state: FormState): void => {
    const values: FormValues = {};
    for (const field of template.fields) {
      if (field.type === 'computed') continue;
      values[field.id] = state.values[field.id] ?? '';
    }
    const rows: FormRows = {};
    for (const group of template.groups ?? []) {
      rows[group.id] = (state.rows[group.id] ?? []).map((row) => {
        const next: FormRow = {};
        for (const column of group.columns) {
          if (column.type === 'computed') continue;
          next[column.id] = row[column.id] ?? '';
        }
        return next;
      });
    }
    try {
      localStorage.setItem(`${DRAFT_V2}${template.slug}`, JSON.stringify({ values, rows }));
      if (ui.saveNote) {
        const time = new Intl.DateTimeFormat('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
        }).format(new Date());
        ui.saveNote.textContent = `이 브라우저에 저장됨 · ${time}`;
      }
    } catch {
      // 저장이 막힌 브라우저에서도 작성과 PDF 생성은 계속한다.
    }
  };

  const scheduleSave = (): void => {
    if (saveTimer !== null) window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      saveTimer = null;
      saveDraft(readState());
    }, 400);
  };

  const validate = (state: FormState): string[] => {
    const errors: string[] = [];
    for (const field of template.fields) {
      if (field.type === 'computed') continue;
      if (field.type === 'roles') {
        const count = countEnabledRoles(state.values[field.id] ?? '');
        if (field.required && count === 0) {
          errors.push(`${field.label}을 하나 이상 선택하세요.`);
        }
        if (field.maxSelected && count > field.maxSelected) {
          errors.push(`${field.label}은 최대 ${field.maxSelected}개까지 선택할 수 있습니다.`);
        }
        continue;
      }
      if (field.required && !(state.values[field.id] ?? '').trim()) {
        errors.push(`${field.label} 항목을 입력하세요.`);
      }
    }
    for (const field of template.fields) {
      if (!field.maxLength) continue;
      if ((state.values[field.id] ?? '').length > field.maxLength) {
        errors.push(`${field.label}은(는) ${field.maxLength}자 이내로 입력하세요.`);
      }
    }
    for (const group of template.groups ?? []) {
      const rows = state.rows[group.id] ?? [];
      const filled = rows.filter((row) => hasRowValue(group, row));
      if (group.required && filled.length === 0) {
        errors.push(`${group.label}을 한 줄 이상 입력하세요.`);
      }
      for (const [index, row] of rows.entries()) {
        if (!hasRowValue(group, row)) continue;
        for (const column of group.columns) {
          if (column.required && !(row[column.id] ?? '').trim()) {
            errors.push(`${group.label} ${index + 1}번째 줄의 ${column.label}을 입력하세요.`);
          }
        }
      }
    }
    if (template.validate) errors.push(...template.validate(state.values, state.rows));
    return errors;
  };

  const focusFirstInvalid = (state: FormState): void => {
    for (const field of template.fields) {
      if (!field.required || field.type === 'computed') continue;
      if (field.type === 'roles') {
        if (countEnabledRoles(state.values[field.id] ?? '') === 0) {
          const editor = form.querySelector<HTMLElement>(`[data-role-editor="${field.id}"]`);
          if (editor) {
            editor.querySelector<HTMLInputElement>('[data-role-enabled]')?.focus();
          } else {
            ui.roleGroups.get(field.id)?.[0]?.focus();
          }
          return;
        }
        continue;
      }
      const input = ui.inputs.get(field.id);
      if (input && !input.value.trim()) {
        input.focus();
        return;
      }
    }
    for (const group of template.groups ?? []) {
      const rows = state.rows[group.id] ?? [];
      for (const [index, row] of rows.entries()) {
        if (!hasRowValue(group, row)) continue;
        const missing = group.columns.find(
          (column) => column.required && !(row[column.id] ?? '').trim(),
        );
        if (missing) {
          const input = root.querySelector<InputElement>(
            `[data-row-group="${group.id}"] [data-row-index="${index}"] [data-row-field="${missing.id}"]`,
          );
          input?.focus();
          return;
        }
      }
      if (group.required && rows.every((row) => !hasRowValue(group, row))) {
        root
          .querySelector<InputElement>(`[data-row-group="${group.id}"] [data-row-field]`)
          ?.focus();
        return;
      }
    }
  };

  const fetchFont = async (url: string): Promise<ArrayBuffer> => {
    const response = await fetch(url);
    if (!response.ok) throw new Error('한글 글꼴을 불러오지 못했습니다.');
    return response.arrayBuffer();
  };

  const registerPreviewFonts = async (regular: ArrayBuffer, bold: ArrayBuffer): Promise<void> => {
    if (previewFontsReady || typeof FontFace === 'undefined') return;
    try {
      const regularFace = new FontFace('OfficeKitNanum', regular);
      const boldFace = new FontFace('OfficeKitNanum', bold, { weight: '700' });
      await Promise.all([regularFace.load(), boldFace.load()]);
      document.fonts.add(regularFace);
      document.fonts.add(boldFace);
    } catch {
      // 글꼴 등록이 막혀도 시스템 글꼴로 미리보기를 계속한다.
    } finally {
      previewFontsReady = true;
    }
  };

  const ensureFonts = async (): Promise<DocFonts> => {
    if (!fontsPromise) {
      fontsPromise = (async () => {
        const [regular, bold] = await Promise.all([
          fetchFont(REGULAR_FONT_URL),
          fetchFont(BOLD_FONT_URL),
        ]);
        const { createDocFonts } = await import('@/lib/doc/fonts');
        const fonts = await createDocFonts(regular, bold);
        await registerPreviewFonts(regular, bold);
        return fonts;
      })().catch((cause: unknown) => {
        fontsPromise = null;
        throw cause;
      });
    }
    return fontsPromise;
  };

  const syncLightboxZoom = (): void => {
    if (lightboxPageWrap && lightbox?.open) {
      lightboxPageWrap.style.width = `${Math.round(lightboxBaseWidth * lightboxZoom)}px`;
    }
    if (lightboxZoomLabel) lightboxZoomLabel.textContent = `${Math.round(lightboxZoom * 100)}%`;
    if (lightboxZoomOut) lightboxZoomOut.disabled = lightboxZoom <= 1;
    if (lightboxZoomIn) lightboxZoomIn.disabled = lightboxZoom >= 4;
  };

  const renderLightbox = (): void => {
    if (!lightboxPageWrap || !lightbox?.open || pages.length === 0) return;
    const page = pages[pageIndex];
    if (!page) return;
    lightboxPageWrap.innerHTML = renderSvg(page);
    if (lightboxPageLabel) lightboxPageLabel.textContent = `${pageIndex + 1} / ${pages.length}`;
    if (lightboxPrev) lightboxPrev.disabled = pageIndex === 0;
    if (lightboxNext) lightboxNext.disabled = pageIndex >= pages.length - 1;
    syncLightboxZoom();
  };

  const fitLightbox = (): void => {
    if (!lightboxStage || !lightbox?.open) return;
    const width = Math.max(240, lightboxStage.clientWidth - 32);
    const height = Math.max(240, lightboxStage.clientHeight - 32);
    lightboxBaseWidth = Math.max(200, Math.min(width, (height * 210) / 297));
    lightboxZoom = 1;
    renderLightbox();
    lightboxStage.scrollTo({ left: 0, top: 0 });
  };

  const openLightbox = (): void => {
    if (!lightbox || !lightboxPageWrap) return;
    if (!lightbox.open) {
      lightbox.showModal();
      document.body.classList.add('has-doc-lightbox');
    }
    requestAnimationFrame(() => {
      fitLightbox();
      // 데스크톱에서는 완전 맞춤보다 한 단계 크게 열어 세부 내용을 바로 확인한다.
      lightboxZoom = window.innerWidth >= 900 ? 1.35 : 1;
      syncLightboxZoom();
      lightboxClose?.focus({ preventScroll: true });
    });
  };

  const closeLightbox = (): void => {
    if (!lightbox?.open) return;
    lightbox.close();
    document.body.classList.remove('has-doc-lightbox');
  };

  const renderPage = (): void => {
    if (!ui.stage || pages.length === 0) return;
    const page = pages[pageIndex];
    if (!page) return;
    ui.stage.innerHTML = renderSvg(page);
    if (ui.pageLabel) ui.pageLabel.textContent = `${pageIndex + 1} / ${pages.length}`;
    if (ui.prev) ui.prev.disabled = pageIndex === 0;
    if (ui.next) ui.next.disabled = pageIndex >= pages.length - 1;
    if (lightbox?.open) renderLightbox();
  };

  const renderPreview = async (): Promise<void> => {
    if (!ui.stage) return;
    const token = ++renderToken;
    try {
      const fonts = await ensureFonts();
      if (token !== renderToken) return;
      const state = readState();
      updateDerived(state);
      const attachment = readLayoutMode() === 'attachment';
      pages = layoutDocument(
        template,
        state.values,
        fonts.metrics,
        {
          mode,
          attachment,
          assets: {
            logo: companyImages.logo ?? undefined,
            seal: companyImages.seal ?? undefined,
          },
        },
        state.rows,
      );
      updateLayoutHint();
      if (pageIndex >= pages.length) pageIndex = pages.length - 1;
      if (pageIndex < 0) pageIndex = 0;
      renderPage();
    } catch (cause) {
      if (token !== renderToken) return;
      ui.stage.innerHTML = '';
      const message = document.createElement('p');
      message.className = 'preview-error';
      message.textContent =
        cause instanceof Error ? cause.message : '미리보기를 만들지 못했습니다.';
      ui.stage.append(message);
    }
  };

  const schedulePreview = (delay = 220): void => {
    if (previewTimer !== null) window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => {
      previewTimer = null;
      void renderPreview();
    }, delay);
  };

  const autoDocumentNumber = (date: string): string =>
    makeDocumentNumber(formPrefix || template.docPrefix || '', date);

  const isManualDocumentNumber = (value: string, date: string): boolean => {
    if (!formPrefix || !value) return false;
    return value !== autoDocumentNumber(date || todayIso());
  };

  const syncDocumentNumber = (): void => {
    if (docNoTouched || !formPrefix) return;
    const dateInput = ui.inputs.get('date');
    const docNoInput = ui.inputs.get('docNo');
    if (!dateInput || !docNoInput) return;
    docNoInput.value = autoDocumentNumber(dateInput.value || todayIso());
  };

  const applyPrefix = (value: string): void => {
    const fallback = template.docPrefix ?? '';
    formPrefix = normalizePrefix(value) || fallback;
    const prefixInput = form.querySelector<HTMLInputElement>('[data-doc-prefix]');
    if (prefixInput && prefixInput.value !== formPrefix) prefixInput.value = formPrefix;
    saveFormPrefix(template.slug, formPrefix);
    if (docNoTouched) return;
    syncDocumentNumber();
    const state = readState();
    updateDerived(state);
    scheduleSave();
    schedulePreview();
  };

  const handleInput = (event: Event): void => {
    const target = event.target;
    if (target instanceof HTMLInputElement && target.dataset.field === 'docNo') {
      docNoTouched = true;
    }
    syncDocumentNumber();
    const state = readState();
    updateDerived(state);
    scheduleSave();
    schedulePreview();
  };

  const addRow = (group: RepeatGroup): void => {
    const list = rowList(group);
    const templateRow = ui.rowTemplates.get(group.id);
    if (!list || !templateRow) return;
    const max = group.maxRows ?? 30;
    if (list.children.length >= max) {
      setStatus(`${group.label}은 최대 ${max}줄까지 추가할 수 있습니다.`);
      return;
    }
    const rowEl = templateRow.cloneNode(true) as HTMLElement;
    fillRow(rowEl, group, emptyRow(group), list.children.length);
    list.append(rowEl);
    rowEl.querySelector<InputElement>('[data-row-field]')?.focus();
    handleInput(new Event('input'));
  };

  const removeRow = (button: HTMLButtonElement): void => {
    const rowEl = button.closest<HTMLElement>('[data-row]');
    const list = rowEl?.parentElement;
    const group = groupFor(button);
    if (!rowEl || !list || !group) return;
    const count = Array.from(list.children).filter((child) => child.matches('[data-row]')).length;
    const min = Math.max(1, group.minRows ?? 1);
    if (count <= min) {
      setStatus(`${group.label}은 최소 ${min}줄이 필요합니다.`);
      return;
    }
    rowEl.remove();
    Array.from(list.children).forEach((child, index) => {
      if (child instanceof HTMLElement && child.matches('[data-row]')) {
        fillRow(child, group, readRow(child, group), index);
      }
    });
    handleInput(new Event('input'));
  };

  form.addEventListener('input', handleInput);
  form.addEventListener('change', handleInput);

  const prefixInput = form.querySelector<HTMLInputElement>('[data-doc-prefix]');
  if (prefixInput) {
    prefixInput.value = formPrefix;
    let composingPrefix = false;
    prefixInput.addEventListener('compositionstart', () => {
      composingPrefix = true;
    });
    prefixInput.addEventListener('compositionend', () => {
      composingPrefix = false;
      const normalized = normalizePrefix(prefixInput.value);
      prefixInput.value = normalized;
      applyPrefix(normalized || template.docPrefix || '');
    });
    prefixInput.addEventListener('input', (event) => {
      // 한글 IME 조합 중에는 값을 건드리지 않는다. 조합이 끝난 뒤 한 번만 정리한다.
      if (composingPrefix || (event instanceof InputEvent && event.isComposing)) return;
      const normalized = normalizePrefix(prefixInput.value);
      if (prefixInput.value !== normalized) prefixInput.value = normalized;
      if (normalized) applyPrefix(normalized);
    });
    prefixInput.addEventListener('blur', () => {
      if (!normalizePrefix(prefixInput.value)) applyPrefix(template.docPrefix ?? '');
    });
  }

  for (const radio of layoutRadios) {
    radio.addEventListener('change', () => {
      saveLayoutMode(readLayoutMode());
      pageIndex = 0;
      updateLayoutHint();
      schedulePreview(0);
    });
  }

  const companyLoad = root.querySelector<HTMLButtonElement>('[data-company-load]');
  const companySave = root.querySelector<HTMLButtonElement>('[data-company-save]');
  const companyClear = root.querySelector<HTMLButtonElement>('[data-company-clear]');

  companyLoad?.addEventListener('click', () => {
    const profile = readCompanyProfile();
    if (!profile) {
      setCompanyStatus('저장된 회사 정보가 없습니다.');
      return;
    }
    applyCompany(profile);
    setCompanyStatus(`불러옴: ${profile.company || '회사 정보'}`);
  });

  companySave?.addEventListener('click', () => {
    const profile = readCompanyFromForm();
    if (!profile?.company.trim()) {
      setCompanyStatus('상호를 먼저 입력하세요.');
      return;
    }
    try {
      localStorage.setItem(COMPANY_KEY, JSON.stringify(profile));
      setCompanyStatus(`저장됨: ${profile.company}`);
    } catch {
      setCompanyStatus('브라우저 저장이 막혀 있습니다.');
    }
  });

  companyClear?.addEventListener('click', async () => {
    if (!readCompanyProfile()) {
      setCompanyStatus('저장된 회사 정보가 없습니다.');
      return;
    }
    const ok = await askConfirm(
      '저장된 회사 정보를 지울까요? 입력한 문서 내용은 지워지지 않습니다.',
    );
    if (!ok) return;
    try {
      localStorage.removeItem(COMPANY_KEY);
      companyImages = { logo: null, seal: null };
      updateCompanyImagePreviews();
      schedulePreview(0);
      setCompanyStatus('회사 정보를 지웠습니다.');
    } catch {
      setCompanyStatus('브라우저 저장소를 지우지 못했습니다.');
    }
  });

  const logoInput = root.querySelector<HTMLInputElement>('[data-company-logo]');
  const sealInput = root.querySelector<HTMLInputElement>('[data-company-seal]');
  const logoRemove = root.querySelector<HTMLButtonElement>('[data-company-logo-remove]');
  const sealRemove = root.querySelector<HTMLButtonElement>('[data-company-seal-remove]');

  logoInput?.addEventListener('change', async () => {
    const file = logoInput.files?.[0];
    if (!file) return;
    try {
      companyImages.logo = await readImageAsset(file, 600);
      updateCompanyImagePreviews();
      schedulePreview(0);
      setCompanyStatus('로고를 선택했습니다. 저장을 눌러 주세요.');
    } catch (cause) {
      setCompanyStatus(cause instanceof Error ? cause.message : '로고를 읽지 못했습니다.');
    } finally {
      logoInput.value = '';
    }
  });

  sealInput?.addEventListener('change', async () => {
    const file = sealInput.files?.[0];
    if (!file) return;
    try {
      companyImages.seal = await readImageAsset(file, 400);
      updateCompanyImagePreviews();
      schedulePreview(0);
      setCompanyStatus('도장을 선택했습니다. 저장을 눌러 주세요.');
    } catch (cause) {
      setCompanyStatus(cause instanceof Error ? cause.message : '도장을 읽지 못했습니다.');
    } finally {
      sealInput.value = '';
    }
  });

  logoRemove?.addEventListener('click', () => {
    companyImages.logo = null;
    updateCompanyImagePreviews();
    schedulePreview(0);
    setCompanyStatus('로고를 지웠습니다. 저장을 눌러 주세요.');
  });

  sealRemove?.addEventListener('click', () => {
    companyImages.seal = null;
    updateCompanyImagePreviews();
    schedulePreview(0);
    setCompanyStatus('도장을 지웠습니다. 저장을 눌러 주세요.');
  });

  form.addEventListener('focusout', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.dataset.rowType !== 'money') {
      return;
    }
    const digits = target.value.replace(/\D/g, '');
    if (digits) {
      target.value = new Intl.NumberFormat('ko-KR').format(Number(digits));
    }
    handleInput(new Event('input'));
  });

  root.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const add = target.closest<HTMLButtonElement>('[data-row-add]');
    if (add) {
      const group = groupFor(add);
      if (group) addRow(group);
      return;
    }
    const remove = target.closest<HTMLButtonElement>('[data-row-remove]');
    if (remove) removeRow(remove);
  });

  ui.fillSample?.addEventListener('click', async () => {
    if (isDirty()) {
      const ok = await askConfirm('지금 입력한 내용이 예시로 바뀝니다. 계속할까요?');
      if (!ok) return;
    }
    const defaults = defaultState();
    const sample = { ...template.sample };
    if (formPrefix && sample.docNo) {
      sample.docNo = replaceDocumentPrefix(sample.docNo, formPrefix);
    }
    const values = { ...defaults.values, ...sample };
    const rows = { ...defaults.rows, ...(template.sampleRows ?? {}) };
    const state = computeState(values, rows);
    docNoTouched = isManualDocumentNumber(state.values.docNo ?? '', state.values.date ?? '');
    applyState(state);
    showError('');
    setStatus('예시 입력을 채웠습니다. 내용을 고쳐서 사용하세요.');
    saveDraft(state);
    pageIndex = 0;
    void renderPreview();
  });

  ui.reset?.addEventListener('click', async () => {
    if (isDirty()) {
      const ok = await askConfirm('지금 입력한 내용이 모두 지워집니다. 초기화할까요?');
      if (!ok) return;
    }
    try {
      localStorage.removeItem(`${DRAFT_V1}${template.slug}`);
      localStorage.removeItem(`${DRAFT_V2}${template.slug}`);
    } catch {
      // 저장소가 막힌 브라우저는 지울 것도 없다.
    }
    docNoTouched = false;
    applyState(defaultState());
    showError('');
    setStatus('입력값을 초기화했습니다.');
    if (ui.saveNote) ui.saveNote.textContent = '아직 저장되지 않았습니다.';
    pageIndex = 0;
    void renderPreview();
  });

  for (const button of ui.modeButtons) {
    button.addEventListener('click', () => {
      const nextMode: 'filled' | 'blank' = button.dataset.mode === 'blank' ? 'blank' : 'filled';
      if (mode === nextMode) return;
      mode = nextMode;
      for (const item of ui.modeButtons) {
        item.setAttribute('aria-pressed', String(item === button));
      }
      if (ui.download) {
        ui.download.textContent = mode === 'blank' ? '빈 양식 PDF' : 'PDF 만들기';
      }
      pageIndex = 0;
      void renderPreview();
    });
  }

  ui.prev?.addEventListener('click', () => {
    if (pageIndex === 0) return;
    pageIndex -= 1;
    renderPage();
  });

  ui.next?.addEventListener('click', () => {
    if (pageIndex >= pages.length - 1) return;
    pageIndex += 1;
    renderPage();
  });

  lightboxPrev?.addEventListener('click', () => {
    if (pageIndex === 0) return;
    pageIndex -= 1;
    renderPage();
  });

  lightboxNext?.addEventListener('click', () => {
    if (pageIndex >= pages.length - 1) return;
    pageIndex += 1;
    renderPage();
  });

  const setLightboxZoom = (next: number): void => {
    lightboxZoom = Math.min(4, Math.max(1, Math.round(next * 100) / 100));
    syncLightboxZoom();
  };

  lightboxZoomOut?.addEventListener('click', () => setLightboxZoom(lightboxZoom / 1.25));
  lightboxZoomIn?.addEventListener('click', () => setLightboxZoom(lightboxZoom * 1.25));
  lightboxFit?.addEventListener('click', fitLightbox);
  lightboxClose?.addEventListener('click', closeLightbox);

  for (const trigger of lightboxTriggers) {
    trigger.addEventListener('click', openLightbox);
    if (trigger === ui.stage) {
      trigger.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        openLightbox();
      });
    }
  }

  lightbox?.addEventListener('click', (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox?.addEventListener('close', () => {
    document.body.classList.remove('has-doc-lightbox');
  });

  lightboxStage?.addEventListener(
    'wheel',
    (event) => {
      if (!lightbox?.open || !(event.ctrlKey || event.metaKey)) return;
      event.preventDefault();
      setLightboxZoom(lightboxZoom * (event.deltaY < 0 ? 1.2 : 1 / 1.2));
    },
    { passive: false },
  );

  window.addEventListener('resize', () => {
    if (lightbox?.open) fitLightbox();
  });

  /** 검증을 통과한 입력 상태와 파일 이름(확장자 제외)을 준비한다. */
  const prepareDocument = (): { state: FormState; name: string } | null => {
    const state = readState();
    updateDerived(state);
    // 빈 양식은 인쇄용이므로 필수 입력 검증을 건너뛴다.
    const errors = mode === 'blank' ? [] : validate(state);
    if (errors.length > 0) {
      showError(errors.join(' '));
      setStatus('');
      focusFirstInvalid(state);
      return null;
    }

    showError('');
    const suffix = mode === 'blank' ? '_빈양식' : '';
    const subject = state.values.name || state.values.supplierCompany || '문서';
    const name = safeFileName(
      `${state.values.date || todayIso()}_${template.title}_${subject}${suffix}`,
    );
    saveDraft(state);
    return { state, name };
  };

  const buildPdf = async (state: FormState): Promise<Uint8Array> => {
    const fonts = await ensureFonts();
    const attachment = readLayoutMode() === 'attachment';
    const docPages = layoutDocument(
      template,
      state.values,
      fonts.metrics,
      {
        mode,
        attachment,
        assets: {
          logo: companyImages.logo ?? undefined,
          seal: companyImages.seal ?? undefined,
        },
      },
      state.rows,
    );
    const { renderPdf } = await import('@/lib/doc/pdf');
    return renderPdf(docPages, fonts, {
      title: [template.title, state.values.docNo].filter(Boolean).join(' '),
      author: state.values.name || state.values.supplierCompany || undefined,
      subject: template.description,
    });
  };

  const saveBytes = (bytes: Uint8Array, name: string, type: string): void => {
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);

    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = URL.createObjectURL(new Blob([buffer], { type }));

    const anchor = document.createElement('a');
    anchor.href = resultUrl;
    anchor.download = name;
    anchor.rel = 'noopener';
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
  };

  const hwpButtons = [...root.querySelectorAll<HTMLButtonElement>('[data-hwp-download]')];
  const saveMenu = root.querySelector<HTMLDetailsElement>('[data-save-menu]');
  const downloadButtons = [ui.download, ...hwpButtons].filter(
    (button): button is HTMLButtonElement => Boolean(button),
  );

  const setBusy = (busy: boolean): void => {
    for (const button of downloadButtons) {
      button.disabled = busy;
      if (busy) button.setAttribute('aria-busy', 'true');
      else button.removeAttribute('aria-busy');
    }
  };

  const closeSaveMenu = (): void => {
    if (saveMenu?.open) saveMenu.open = false;
  };

  const handleDownload = async (): Promise<void> => {
    setBusy(true);
    setStatus('PDF를 만드는 중…');
    try {
      const prepared = prepareDocument();
      if (!prepared) {
        setStatus('');
        return;
      }
      const bytes = await buildPdf(prepared.state);
      saveBytes(bytes, `${prepared.name}.pdf`, 'application/pdf');
      setStatus(`${formatBytes(bytes.byteLength)} PDF를 내려받았습니다.`);
    } catch (cause) {
      showError(
        cause instanceof Error
          ? cause.message
          : 'PDF를 만들지 못했습니다. 입력값을 확인한 뒤 다시 시도하세요.',
      );
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  const handleHwpDownload = async (format: HwpFormat): Promise<void> => {
    setBusy(true);
    setStatus('한글 파일을 만드는 중…');
    try {
      const prepared = prepareDocument();
      if (!prepared) {
        setStatus('');
        return;
      }
      setStatus('문서를 한글 개체로 만드는 중…');
      const { buildHwpx } = await import('@/lib/hwpx-native');
      const hwpx = await buildHwpx(template, {
        values: prepared.state.values,
        rows: prepared.state.rows,
        mode,
        attachment: readLayoutMode() === 'attachment',
        assets: {
          logo: companyImages.logo ?? undefined,
          seal: companyImages.seal ?? undefined,
        },
      });

      let bytes = hwpx;
      if (format === 'hwp') {
        const { exportHwpxAsHwp, HWP_MIME } = await import('@/lib/hwp-export');
        bytes = await exportHwpxAsHwp(hwpx, (phase) => {
          setStatus(
            phase === 'engine'
              ? '한글 변환 엔진을 준비하는 중… 처음 한 번만 받습니다.'
              : 'HWPX를 HWP로 옮기는 중…',
          );
        });
        saveBytes(bytes, `${prepared.name}.hwp`, HWP_MIME.hwp);
      } else {
        const { HWP_MIME } = await import('@/lib/hwp-export');
        saveBytes(bytes, `${prepared.name}.hwpx`, HWP_MIME.hwpx);
      }
      setStatus(
        `${formatBytes(bytes.byteLength)} ${format.toUpperCase()} 파일을 내려받았습니다. 한글에서 열어 고칠 수 있습니다.`,
      );
    } catch (cause) {
      showError(
        cause instanceof Error
          ? cause.message
          : '한글 파일을 만들지 못했습니다. PDF를 다시 만든 뒤 시도하세요.',
      );
      setStatus('');
    } finally {
      setBusy(false);
    }
  };

  ui.download?.addEventListener('click', () => {
    void handleDownload();
  });

  for (const button of hwpButtons) {
    button.addEventListener('click', () => {
      closeSaveMenu();
      void handleHwpDownload(button.dataset.hwpDownload === 'hwpx' ? 'hwpx' : 'hwp');
    });
  }

  document.addEventListener('click', (event) => {
    if (!saveMenu?.open) return;
    if (event.target instanceof Node && saveMenu.contains(event.target)) return;
    closeSaveMenu();
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSaveMenu();
  });

  window.addEventListener('pagehide', () => {
    if (resultUrl) {
      URL.revokeObjectURL(resultUrl);
      resultUrl = null;
    }
  });

  // 저장된 초안이 있으면 이어서, 없으면 오늘 날짜와 문서 번호로 시작한다.
  const stored = readDraft();
  const rawValues = { ...defaultValues(), ...(stored?.values ?? {}) };
  const rows = stored ? { ...defaultRows(), ...stored.rows } : defaultRows();
  const state = computeState(rawValues, rows);
  docNoTouched = isManualDocumentNumber(state.values.docNo ?? '', state.values.date ?? '');
  const filledRows = Object.values(rows)
    .flat()
    .filter((row) => Object.values(row).some((value) => value.trim() !== '')).length;
  setLayoutMode(readSavedLayoutMode() ?? (filledRows > 8 ? 'attachment' : 'body'));
  applyState(state);
  updateLayoutHint();
  const savedCompany = readCompanyProfile();
  if (savedCompany) {
    companyImages = {
      logo: savedCompany.logo ?? null,
      seal: savedCompany.seal ?? null,
    };
    updateCompanyImagePreviews();
    setCompanyStatus(`저장됨: ${savedCompany.company} · 불러오기를 누르면 채워집니다.`);
  }
  if (ui.saveNote) {
    ui.saveNote.textContent = stored
      ? '이 브라우저에 저장된 내용을 불러왔습니다.'
      : '입력하면 이 브라우저에 자동 저장됩니다.';
  }

  // 미리보기가 화면에 들어올 때 글꼴을 한 번만 불러온다.
  if (preview && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        void renderPreview();
      },
      { rootMargin: '200px' },
    );
    observer.observe(preview);
  } else {
    void renderPreview();
  }
}
