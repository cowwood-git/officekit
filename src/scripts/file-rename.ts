import { doWork } from '@/lib/do-work';
import {
  type AffixPosition,
  affixTemplate,
  applyRename,
  DEFAULT_RULE,
  type NumberPosition,
  numberTemplate,
  type RenameRule,
  todayStamp,
  zipName,
} from '@/lib/file-rename';
import { formatBytes } from '@/lib/files';
import { bindDrop, byId, errorSetter, zipBlob } from './kit';

/** 파일 이름 일괄 변경 — 브라우저는 내 PC 파일 이름을 직접 못 바꾸므로 새 이름으로 ZIP 에 담아 준다. */
const MAX_FILES = 500;
const MAX_BYTES = 500 * 1024 * 1024;
type Mode = 'replace' | 'affix' | 'number' | 'template';

export function initFileRename(): void {
  const input = byId<HTMLInputElement>('fr-input');
  const drop = byId<HTMLElement>('fr-drop');
  const panel = byId<HTMLElement>('fr-panel');
  const error = byId<HTMLElement>('fr-error');
  const status = byId<HTMLElement>('fr-status');
  const rows = byId<HTMLElement>('fr-rows');
  const template = byId<HTMLInputElement>('fr-template');
  const find = byId<HTMLInputElement>('fr-find');
  const replace = byId<HTMLInputElement>('fr-replace');
  const findTemplate = byId<HTMLInputElement>('fr-find-template');
  const replaceTemplate = byId<HTMLInputElement>('fr-replace-template');
  const affixText = byId<HTMLInputElement>('fr-affix-text');
  const affixPosition = byId<HTMLSelectElement>('fr-affix-position');
  const numberBase = byId<HTMLInputElement>('fr-number-base');
  const numberPosition = byId<HTMLSelectElement>('fr-number-position');
  const numberKeep = byId<HTMLInputElement>('fr-number-keep');
  const start = byId<HTMLInputElement>('fr-start');
  const digits = byId<HTMLSelectElement>('fr-digits');
  const textCase = byId<HTMLSelectElement>('fr-case');
  const order = byId<HTMLSelectElement>('fr-order');
  const apply = byId<HTMLButtonElement>('fr-apply');
  const reset = byId<HTMLButtonElement>('fr-reset');
  const result = byId<HTMLElement>('fr-result');
  const resultNote = byId<HTMLElement>('fr-result-note');
  const download = byId<HTMLAnchorElement>('fr-download');
  const exampleBefore = byId<HTMLElement>('fr-example-before');
  const exampleAfter = byId<HTMLElement>('fr-example-after');
  const exampleNote = byId<HTMLElement>('fr-example-note');
  const numberSettings = document.querySelector<HTMLElement>('[data-fr-number-settings]');
  const modeInputs = [...document.querySelectorAll<HTMLInputElement>('input[name="fr-mode"]')];
  const modePanels = [...document.querySelectorAll<HTMLElement>('[data-fr-panel]')];
  if (
    !input ||
    !drop ||
    !panel ||
    !error ||
    !status ||
    !rows ||
    !apply ||
    modeInputs.length === 0
  ) {
    return;
  }
  const showError = errorSetter(error);

  let files: File[] = [];
  let resultUrl: string | null = null;
  let mode: Mode = 'replace';
  const today = todayStamp();

  const clearResult = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    if (result) result.hidden = true;
  };

  const ordered = () => {
    const list = files.slice();
    const how = order?.value ?? 'added';
    if (how === 'name') list.sort((a, b) => a.name.localeCompare(b.name, 'ko', { numeric: true }));
    if (how === 'date') list.sort((a, b) => a.lastModified - b.lastModified);
    return list;
  };

  const rule = (): RenameRule => {
    let templateValue = '{name}';
    let findValue = '';
    let replaceValue = '';

    if (mode === 'replace') {
      findValue = find?.value ?? '';
      replaceValue = replace?.value ?? '';
    } else if (mode === 'affix') {
      templateValue = affixTemplate(
        affixText?.value ?? '',
        (affixPosition?.value as AffixPosition) ?? 'before',
      );
    } else if (mode === 'number') {
      templateValue = numberTemplate(
        numberBase?.value ?? '',
        (numberPosition?.value as NumberPosition) ?? 'after',
        Boolean(numberKeep?.checked),
      );
    } else {
      templateValue = template?.value ?? '{name}';
      findValue = findTemplate?.value ?? '';
      replaceValue = replaceTemplate?.value ?? '';
    }

    return {
      ...DEFAULT_RULE,
      template: templateValue,
      find: findValue,
      replace: replaceValue,
      start: Number(start?.value) || 1,
      digits: Number(digits?.value ?? 2),
      textCase: (textCase?.value as RenameRule['textCase']) ?? 'keep',
      date: today,
    };
  };

  const preview = () => {
    clearResult();
    const list = ordered();
    const names = applyRename(
      list.map((file) => file.name),
      rule(),
    );

    const sampleBefore = list[0]?.name ?? 'IMG_0001.jpg';
    const sampleAfter = names[0] ?? sampleBefore;
    if (exampleBefore) exampleBefore.textContent = sampleBefore;
    if (exampleAfter) exampleAfter.textContent = sampleAfter;
    if (exampleNote) {
      if (list.length === 0) {
        exampleNote.textContent = '파일을 넣으면 실제 이름으로 보여 줍니다';
      } else {
        const changed = names.filter((name, index) => name !== list[index]?.name).length;
        exampleNote.textContent =
          changed > 0
            ? `${list.length}개 중 ${changed}개 이름이 바뀝니다`
            : '바뀌는 이름이 없습니다';
      }
    }

    rows.replaceChildren(
      ...list.slice(0, 200).map((file, index) => {
        const row = document.createElement('tr');
        const before = document.createElement('td');
        before.textContent = file.name;
        const after = document.createElement('td');
        after.textContent = names[index] ?? '';
        if (names[index] !== file.name) after.className = 'fr-changed';
        row.append(before, after);
        return row;
      }),
    );

    const total = list.reduce((sum, file) => sum + file.size, 0);
    status.textContent = `${list.length}개 · ${formatBytes(total)}${list.length > 200 ? ' · 미리보기는 앞 200개만 보여 줍니다' : ''}`;
  };

  const setMode = (next: Mode) => {
    mode = next;
    for (const item of modeInputs) item.checked = item.value === next;
    for (const item of modePanels) item.hidden = item.dataset.frPanel !== next;
    if (numberSettings) {
      numberSettings.hidden = next !== 'number' && next !== 'template';
    }
    preview();
  };

  const add = (incoming: File[]) => {
    showError('');
    const next = [...files, ...incoming];
    if (next.length > MAX_FILES) {
      showError(`한 번에 최대 ${MAX_FILES}개까지 바꿀 수 있습니다.`);
      return;
    }
    if (next.reduce((sum, file) => sum + file.size, 0) > MAX_BYTES) {
      showError(`전체 용량이 ${formatBytes(MAX_BYTES)}를 넘습니다. 나눠서 바꿔 주세요.`);
      return;
    }
    files = next;
    drop.hidden = true;
    panel.hidden = false;
    preview();
  };

  const run = async () => {
    if (files.length === 0) return;
    showError('');
    clearResult();
    const list = ordered();
    const names = applyRename(
      list.map((file) => file.name),
      rule(),
    );
    const blob = await zipBlob(
      list.map((file, index) => ({ name: names[index] ?? file.name, data: file })),
    );
    resultUrl = URL.createObjectURL(blob);
    if (download) {
      download.href = resultUrl;
      download.download = zipName();
      download.textContent = `ZIP 내려받기 (${formatBytes(blob.size)})`;
    }
    if (resultNote) {
      const changed = names.filter((name, index) => name !== list[index]?.name).length;
      resultNote.textContent = `${list.length}개 중 ${changed}개의 이름을 바꿔 ZIP 하나에 담았습니다. 압축을 풀면 새 이름의 파일이 나옵니다.`;
    }
    if (result) result.hidden = false;
  };

  const resetForm = () => {
    clearResult();
    files = [];
    rows.replaceChildren();
    panel.hidden = true;
    drop.hidden = false;
    status.textContent = '';
    showError('');
    if (find) find.value = '';
    if (replace) replace.value = '';
    if (findTemplate) findTemplate.value = '';
    if (replaceTemplate) replaceTemplate.value = '';
    if (affixText) affixText.value = '';
    if (affixPosition) affixPosition.value = 'before';
    if (numberBase) numberBase.value = '';
    if (numberPosition) numberPosition.value = 'after';
    if (numberKeep) numberKeep.checked = false;
    if (template) template.value = '{name}';
    if (start) start.value = '1';
    if (digits) digits.value = '2';
    if (textCase) textCase.value = 'keep';
    if (order) order.value = 'added';
    setMode('replace');
  };

  bindDrop(input, drop, add, [panel]);
  for (const control of [
    template,
    find,
    replace,
    findTemplate,
    replaceTemplate,
    affixText,
    affixPosition,
    numberBase,
    numberPosition,
    numberKeep,
    start,
    digits,
    textCase,
    order,
  ]) {
    control?.addEventListener('input', preview);
    control?.addEventListener('change', preview);
  }
  for (const modeInput of modeInputs) {
    modeInput.addEventListener('change', () => {
      if (modeInput.checked) setMode(modeInput.value as Mode);
    });
  }
  for (const token of document.querySelectorAll<HTMLButtonElement>('[data-fr-token]')) {
    token.addEventListener('click', () => {
      if (!template) return;
      const at = template.selectionStart ?? template.value.length;
      const text = token.dataset.frToken ?? '';
      template.value =
        template.value.slice(0, at) + text + template.value.slice(template.selectionEnd ?? at);
      template.focus();
      preview();
    });
  }
  for (const preset of document.querySelectorAll<HTMLButtonElement>('[data-fr-preset]')) {
    preset.addEventListener('click', () => {
      const kind = preset.dataset.frPreset;
      if (kind === 'strip') {
        if (find) find.value = 'IMG_';
        if (replace) replace.value = '';
        setMode('replace');
      } else if (kind === 'date') {
        if (template) template.value = '{date}_{name}';
        if (findTemplate) findTemplate.value = '';
        if (replaceTemplate) replaceTemplate.value = '';
        setMode('template');
      } else if (kind === 'number') {
        if (numberBase) numberBase.value = '';
        if (numberPosition) numberPosition.value = 'after';
        if (numberKeep) numberKeep.checked = true;
        setMode('number');
      } else if (kind === 'space') {
        if (find) find.value = ' ';
        if (replace) replace.value = '_';
        setMode('replace');
      }
    });
  }
  apply.addEventListener('click', () => void doWork(apply, run));
  reset?.addEventListener('click', resetForm);

  window.addEventListener('pagehide', () => {
    clearResult();
    files = [];
    rows.replaceChildren();
  });
}
