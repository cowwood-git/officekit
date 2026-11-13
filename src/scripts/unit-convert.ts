import {
  convertAll,
  convertUnit,
  formatUnitValue,
  UNIT_CATEGORIES,
  type UnitCategory,
  unitsFor,
} from '@/lib/unit-convert';

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initUnitConvert(): void {
  const category = byId<HTMLSelectElement>('uc-category');
  const value = byId<HTMLInputElement>('uc-value');
  const from = byId<HTMLSelectElement>('uc-from');
  const to = byId<HTMLSelectElement>('uc-to');
  const result = byId<HTMLElement>('uc-result');
  const resultUnit = byId<HTMLElement>('uc-result-unit');
  const allList = byId<HTMLUListElement>('uc-all');
  const swapButton = byId<HTMLButtonElement>('uc-swap');
  const copyButton = byId<HTMLButtonElement>('uc-copy');
  const status = byId<HTMLElement>('uc-status');
  const error = byId<HTMLElement>('uc-error');

  if (!category || !value || !from || !to || !result || !allList) return;

  const fillUnits = () => {
    const selected = category.value as UnitCategory;
    const units = unitsFor(selected);
    from.replaceChildren();
    to.replaceChildren();
    for (const unit of units) {
      const option = document.createElement('option');
      option.value = unit.id;
      option.textContent = unit.label;
      from.append(option);
      to.append(option.cloneNode(true));
    }
    const preferred: Record<string, [string, string]> = {
      length: ['m', 'ft'],
      mass: ['kg', 'lb'],
      temperature: ['c', 'f'],
      area: ['m2', 'pyeong'],
      volume: ['l', 'ml'],
      data: ['mb', 'gb'],
      speed: ['kmh', 'mps'],
    };
    const pair = preferred[selected] ?? [units[0]?.id ?? '', units[1]?.id ?? ''];
    from.value = pair[0];
    to.value = pair[1];
  };

  const copyText = () => {
    const converted = convertUnit(
      category.value as UnitCategory,
      Number(value.value),
      from.value,
      to.value,
    );
    if (converted === null) return '';
    const toLabel = unitsFor(category.value as UnitCategory).find((unit) => unit.id === to.value);
    return `${value.value} ${from.value} = ${formatUnitValue(converted)} ${toLabel?.label ?? to.value}`;
  };

  const run = () => {
    if (error) error.hidden = true;
    const raw = value.value.replace(/,/g, '').trim();
    if (raw === '') {
      if (result) result.textContent = '-';
      if (resultUnit) resultUnit.textContent = '';
      allList.replaceChildren();
      return;
    }
    const numeric = Number(raw);
    if (!Number.isFinite(numeric)) {
      if (error) {
        error.hidden = false;
        error.textContent = '숫자를 입력하세요.';
      }
      if (result) result.textContent = '-';
      allList.replaceChildren();
      return;
    }

    const selected = category.value as UnitCategory;
    const converted = convertUnit(selected, numeric, from.value, to.value);
    const target = unitsFor(selected).find((unit) => unit.id === to.value);
    if (result) result.textContent = converted === null ? '-' : formatUnitValue(converted);
    if (resultUnit) resultUnit.textContent = target?.label ?? '';

    allList.replaceChildren();
    for (const entry of convertAll(selected, numeric, from.value)) {
      const item = document.createElement('li');
      const label = document.createElement('span');
      label.textContent = entry.unit.label;
      const amount = document.createElement('strong');
      amount.textContent = formatUnitValue(entry.value);
      item.append(label, amount);
      allList.append(item);
    }
    if (status) status.textContent = `${from.value} → ${to.value} 변환`;
  };

  category.addEventListener('change', () => {
    fillUnits();
    run();
  });

  for (const control of [value, from, to]) {
    control.addEventListener('input', run);
    control.addEventListener('change', run);
  }

  swapButton?.addEventListener('click', () => {
    const previous = from.value;
    from.value = to.value;
    to.value = previous;
    run();
  });

  copyButton?.addEventListener('click', async () => {
    const text = copyText();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      copyButton.textContent = '복사됨';
      window.setTimeout(() => {
        copyButton.textContent = '결과 복사';
      }, 1500);
    } catch {
      if (status) status.textContent = '자동 복사가 차단되었습니다.';
    }
  });

  const select = byId<HTMLSelectElement>('uc-category');
  if (select) {
    for (const item of UNIT_CATEGORIES) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.label;
      select.append(option);
    }
  }

  fillUnits();
  run();
}
