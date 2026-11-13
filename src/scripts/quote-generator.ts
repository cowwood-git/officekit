import { formatBytes } from '@/lib/files';
import {
  addDays,
  computeTotals,
  defaultDocumentNumber,
  formatWon,
  itemAmount,
  type Party,
  type QuoteForm,
  type QuoteItem,
  type QuoteType,
  quotePdfFileName,
  validateQuote,
} from '@/lib/quote';
import { buildQuotePdf } from '@/lib/quote-pdf';

const PRESET_KEY = 'officekit-quote-company';
const MAX_ITEMS = 30;

let resultUrl: string | null = null;
let numberTouched = false;
let running = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

const today = (): string => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const readParty = (prefix: string): Party => ({
  company: byId<HTMLInputElement>(`${prefix}-company`)?.value.trim() ?? '',
  businessNumber: byId<HTMLInputElement>(`${prefix}-biz`)?.value.trim() ?? '',
  representative: byId<HTMLInputElement>(`${prefix}-ceo`)?.value.trim() ?? '',
  address: byId<HTMLInputElement>(`${prefix}-address`)?.value.trim() ?? '',
  contact: byId<HTMLInputElement>(`${prefix}-contact`)?.value.trim() ?? '',
});

export function initQuoteGenerator(): void {
  const typeSelect = byId<HTMLSelectElement>('q-type');
  const numberInput = byId<HTMLInputElement>('q-number');
  const dateInput = byId<HTMLInputElement>('q-date');
  const validInput = byId<HTMLInputElement>('q-valid');
  const itemsBody = byId<HTMLElement>('q-items-body');
  const addButton = byId<HTMLButtonElement>('q-add-item');
  const itemCount = byId<HTMLElement>('q-item-count');
  const vatSelect = byId<HTMLSelectElement>('q-vat');
  const noteInput = byId<HTMLTextAreaElement>('q-note');
  const saveCompany = byId<HTMLInputElement>('q-save-company');
  const generate = byId<HTMLButtonElement>('q-generate');
  const reset = byId<HTMLButtonElement>('q-reset');
  const status = byId<HTMLElement>('q-status');
  const error = byId<HTMLElement>('q-error');
  const result = byId<HTMLElement>('q-result');
  const resultSize = byId<HTMLElement>('q-result-size');
  const download = byId<HTMLAnchorElement>('q-download');
  const supply = byId<HTMLElement>('q-supply');
  const vatAmount = byId<HTMLElement>('q-vat-amount');
  const total = byId<HTMLElement>('q-total');

  if (!typeSelect || !numberInput || !dateInput || !itemsBody || !generate || !status || !error) {
    return;
  }

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    if (download) {
      download.removeAttribute('href');
      download.hidden = true;
    }
    if (result) result.hidden = true;
  };

  const currentType = (): QuoteType => (typeSelect.value === 'statement' ? 'statement' : 'quote');
  const currentNumber = () => numberInput.value.trim();
  const currentDate = () => dateInput.value || today();

  const setDefaultNumber = () => {
    if (numberTouched && currentNumber()) return;
    numberInput.value = defaultDocumentNumber(currentType(), currentDate());
  };

  const safeNumber = (value: string | undefined): number => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  };

  const readItems = (): QuoteItem[] =>
    Array.from(itemsBody.querySelectorAll<HTMLElement>('[data-item-row]')).map((row) => ({
      name: row.querySelector<HTMLInputElement>('[data-field="name"]')?.value.trim() ?? '',
      quantity: safeNumber(row.querySelector<HTMLInputElement>('[data-field="quantity"]')?.value),
      unitPrice: safeNumber(row.querySelector<HTMLInputElement>('[data-field="unitPrice"]')?.value),
    }));

  const readForm = (): QuoteForm => ({
    type: currentType(),
    number: currentNumber(),
    date: currentDate(),
    validUntil: validInput?.value ?? '',
    supplier: readParty('q-supplier'),
    buyer: readParty('q-buyer'),
    items: readItems(),
    vatMode:
      vatSelect?.value === 'included'
        ? 'included'
        : vatSelect?.value === 'none'
          ? 'none'
          : 'excluded',
    note: noteInput?.value.trim() ?? '',
  });

  const updateTotals = () => {
    const form = readForm();
    const totals = computeTotals(form.items, form.vatMode);
    if (supply) supply.textContent = formatWon(totals.supply);
    if (vatAmount) vatAmount.textContent = formatWon(totals.vat);
    if (total) total.textContent = formatWon(totals.total);

    const rows = itemsBody.querySelectorAll<HTMLElement>('[data-item-row]');
    if (itemCount) itemCount.textContent = `${rows.length}개`;

    for (const row of rows) {
      const quantity = safeNumber(
        row.querySelector<HTMLInputElement>('[data-field="quantity"]')?.value,
      );
      const unitPrice = safeNumber(
        row.querySelector<HTMLInputElement>('[data-field="unitPrice"]')?.value,
      );
      const amount = row.querySelector<HTMLElement>('[data-item-amount]');
      if (amount) amount.textContent = formatWon(itemAmount({ name: '', quantity, unitPrice }));
    }
  };

  const addItemRow = (focus = false) => {
    if (itemsBody.querySelectorAll('[data-item-row]').length >= MAX_ITEMS) return;
    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.itemRow = 'true';
    row.setAttribute('role', 'listitem');
    row.innerHTML = `
      <label class="item-field item-name">
        <span class="item-label">품목명</span>
        <input data-field="name" type="text" placeholder="예: 웹사이트 디자인" aria-label="품목명" autocomplete="off" />
      </label>
      <label class="item-field item-qty">
        <span class="item-label">수량</span>
        <input data-field="quantity" type="number" min="0" step="0.01" value="1" inputmode="decimal" aria-label="수량" />
      </label>
      <label class="item-field item-price">
        <span class="item-label">단가</span>
        <input data-field="unitPrice" type="number" min="0" step="1" value="0" inputmode="numeric" aria-label="단가" />
      </label>
      <div class="item-field item-amount">
        <span class="item-label">금액</span>
        <strong data-item-amount>0원</strong>
      </div>
      <button class="item-remove" type="button" data-remove aria-label="품목 삭제" title="품목 삭제">
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>
      </button>
    `;
    row.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
      input.addEventListener('input', updateTotals);
    });
    row.querySelector<HTMLButtonElement>('[data-remove]')?.addEventListener('click', () => {
      row.remove();
      if (itemsBody.querySelectorAll('[data-item-row]').length === 0) addItemRow();
      updateTotals();
    });
    itemsBody.append(row);
    updateTotals();
    if (focus) row.querySelector<HTMLInputElement>('[data-field="name"]')?.focus();
  };

  const loadPreset = () => {
    try {
      const raw = localStorage.getItem(PRESET_KEY);
      if (!raw) return;
      const party = JSON.parse(raw) as Partial<Party>;
      const set = (id: string, value: string | undefined) => {
        const input = byId<HTMLInputElement>(id);
        if (input && value) input.value = value;
      };
      set('q-supplier-company', party.company);
      set('q-supplier-biz', party.businessNumber);
      set('q-supplier-ceo', party.representative);
      set('q-supplier-address', party.address);
      set('q-supplier-contact', party.contact);
      if (saveCompany) saveCompany.checked = true;
    } catch {
      // 저장된 값이 깨졌으면 무시한다.
    }
  };

  const savePreset = () => {
    try {
      if (saveCompany?.checked) {
        localStorage.setItem(PRESET_KEY, JSON.stringify(readParty('q-supplier')));
      } else {
        localStorage.removeItem(PRESET_KEY);
      }
    } catch {
      // 저장이 막혀도 PDF 생성은 계속한다.
    }
  };

  const run = async () => {
    if (running) return;
    clearResult();
    showError('');
    const form = readForm();
    const errors = validateQuote(form);
    if (errors.length > 0) {
      showError(errors.join(' '));
      return;
    }
    const totals = computeTotals(form.items, form.vatMode);
    running = true;
    generate.disabled = true;
    generate.setAttribute('aria-busy', 'true');
    if (reset) reset.disabled = true;
    status.textContent = 'PDF를 만드는 중…';

    try {
      const response = await fetch('/fonts/NanumGothic-OfficeKit.ttf');
      if (!response.ok) throw new Error('한글 글꼴을 불러오지 못했습니다.');
      const fontBytes = await response.arrayBuffer();
      const bytes = await buildQuotePdf(form, totals, fontBytes);
      const buffer = new ArrayBuffer(bytes.byteLength);
      new Uint8Array(buffer).set(bytes);
      resultUrl = URL.createObjectURL(new Blob([buffer], { type: 'application/pdf' }));
      if (download) {
        download.href = resultUrl;
        download.download = quotePdfFileName(form.type, form.date);
        download.hidden = false;
      }
      if (resultSize) resultSize.textContent = formatBytes(buffer.byteLength);
      if (result) {
        result.hidden = false;
        result.focus();
      }
      savePreset();
      status.textContent = 'PDF가 준비됐습니다. 아래에서 내려받으세요.';
    } catch (cause) {
      console.error(cause);
      showError(
        cause instanceof Error
          ? cause.message
          : 'PDF를 만들지 못했습니다. 입력값을 확인한 뒤 다시 시도하세요.',
      );
      status.textContent = '';
    } finally {
      running = false;
      generate.disabled = false;
      generate.removeAttribute('aria-busy');
      if (reset) reset.disabled = false;
    }
  };

  const resetForm = () => {
    clearResult();
    showError('');
    if (status) status.textContent = '';
    if (noteInput) noteInput.value = '';
    for (const id of [
      'q-buyer-company',
      'q-buyer-biz',
      'q-buyer-ceo',
      'q-buyer-address',
      'q-buyer-contact',
    ]) {
      const input = byId<HTMLInputElement>(id);
      if (input) input.value = '';
    }
    itemsBody.replaceChildren();
    addItemRow();
    if (dateInput) dateInput.value = today();
    if (validInput) validInput.value = addDays(today(), 14);
    numberTouched = false;
    setDefaultNumber();
    updateTotals();
  };

  typeSelect.addEventListener('change', () => {
    if (!numberTouched) setDefaultNumber();
  });
  numberInput.addEventListener('input', () => {
    numberTouched = numberInput.value.trim() !== '';
  });
  dateInput.addEventListener('change', () => {
    if (!numberTouched) setDefaultNumber();
  });
  vatSelect?.addEventListener('change', updateTotals);
  addButton?.addEventListener('click', () => addItemRow(true));
  generate.addEventListener('click', () => void run());
  reset?.addEventListener('click', resetForm);

  if (dateInput && !dateInput.value) dateInput.value = today();
  if (validInput && !validInput.value) validInput.value = addDays(today(), 14);
  setDefaultNumber();
  loadPreset();
  addItemRow();
  updateTotals();
  window.addEventListener('pagehide', clearResult);
}
