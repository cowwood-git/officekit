import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import { buildPagePlan, insertFileName, type PagePlan, segmentLabel } from '@/lib/pdf-page-insert';

interface LoadedPdf {
  file: File;
  bytes: ArrayBuffer;
  pageCount: number;
}

const MAX_PAGES = 100;
const MAX_RESULT_PAGES = 100;

let base: LoadedPdf | null = null;
let source: LoadedPdf | null = null;
let resultUrl: string | null = null;
let busy = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPdfPageInsert(): void {
  const baseInput = byId<HTMLInputElement>('pi-base-input');
  const baseDrop = byId<HTMLElement>('pi-base-drop');
  const sourceInput = byId<HTMLInputElement>('pi-source-input');
  const sourceDrop = byId<HTMLElement>('pi-source-drop');
  const baseInfo = byId<HTMLElement>('pi-base-info');
  const sourceInfo = byId<HTMLElement>('pi-source-info');
  const panel = byId<HTMLElement>('pi-panel');
  const mode = byId<HTMLSelectElement>('pi-mode');
  const insertOptions = byId<HTMLElement>('pi-insert-options');
  const replaceOptions = byId<HTMLElement>('pi-replace-options');
  const insertAfter = byId<HTMLInputElement>('pi-insert-after');
  const baseRange = byId<HTMLInputElement>('pi-base-range');
  const sourceRange = byId<HTMLInputElement>('pi-source-range');
  const segments = byId<HTMLElement>('pi-segments');
  const summary = byId<HTMLElement>('pi-summary');
  const planError = byId<HTMLElement>('pi-plan-error');
  const runButton = byId<HTMLButtonElement>('pi-run');
  const clearButton = byId<HTMLButtonElement>('pi-clear');
  const status = byId<HTMLElement>('pi-status');
  const error = byId<HTMLElement>('pi-error');
  const result = byId<HTMLElement>('pi-result');
  const resultValue = byId<HTMLElement>('pi-result-value');
  const resultSummary = byId<HTMLElement>('pi-result-summary');
  const download = byId<HTMLAnchorElement>('pi-download');

  if (
    !baseInput ||
    !baseDrop ||
    !sourceInput ||
    !sourceDrop ||
    !panel ||
    !mode ||
    !insertOptions ||
    !replaceOptions ||
    !insertAfter ||
    !baseRange ||
    !sourceRange ||
    !segments ||
    !summary ||
    !planError ||
    !runButton ||
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

  const showPlanError = (message: string) => {
    planError.hidden = message === '';
    planError.textContent = message;
  };

  const revoke = () => {
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    result.hidden = true;
    if (download) {
      download.hidden = true;
      download.removeAttribute('href');
    }
  };

  const currentPlan = (): PagePlan | null => {
    if (!base || !source) return null;
    return buildPagePlan({
      mode: mode.value === 'replace' ? 'replace' : 'insert',
      baseCount: base.pageCount,
      sourceCount: source.pageCount,
      insertAfter: Number(insertAfter.value) || 0,
      baseRange: baseRange.value,
      sourceRange: sourceRange.value,
    });
  };

  const renderPreview = () => {
    if (!base || !source) return;
    const plan = currentPlan();
    if (!plan) return;
    segments.replaceChildren();
    if (plan.errors.length > 0) {
      showPlanError(plan.errors[0] ?? '설정을 확인하세요.');
      runButton.disabled = true;
      summary.textContent = '';
      return;
    }
    if (plan.resultCount > MAX_RESULT_PAGES) {
      showPlanError(`결과가 ${MAX_RESULT_PAGES}쪽을 넘습니다. 범위를 줄여 주세요.`);
      runButton.disabled = true;
      summary.textContent = '';
      return;
    }

    showPlanError('');
    for (const segment of plan.segments) {
      const chip = document.createElement('span');
      chip.className = `pi-segment pi-segment-${segment.kind}`;
      const label = document.createElement('strong');
      label.textContent = segmentLabel(segment, mode.value === 'replace' ? 'replace' : 'insert');
      const count = document.createElement('small');
      count.textContent = `${segment.pages.length}쪽`;
      chip.append(label, count);
      segments.append(chip);
    }
    summary.textContent = plan.summary;
    runButton.disabled = busy;
  };

  const updateMode = () => {
    const replace = mode.value === 'replace';
    insertOptions.hidden = replace;
    replaceOptions.hidden = !replace;
    revoke();
    renderPreview();
  };

  const acceptFile = async (file: File, target: 'base' | 'source') => {
    showError('');
    revoke();
    const validation = validatePdfSelection([file]);
    if (!validation.ok) {
      showError(validation.errors.join(' '));
      return;
    }

    status.textContent = target === 'base' ? '원본 PDF를 여는 중…' : '끼워 넣을 PDF를 여는 중…';
    try {
      const bytes = await file.arrayBuffer();
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(bytes);
      const pageCount = doc.getPageCount();
      if (pageCount < 1) throw new Error('페이지가 없는 PDF입니다.');
      if (pageCount > MAX_PAGES) {
        throw new Error(`PDF 한 개당 최대 ${MAX_PAGES}쪽까지 지원합니다.`);
      }

      const loaded = { file, bytes, pageCount };
      if (target === 'base') {
        base = loaded;
        if (baseInfo)
          baseInfo.textContent = `${file.name} · ${pageCount}쪽 · ${formatBytes(file.size)}`;
        insertAfter.max = String(pageCount);
        if (Number(insertAfter.value) > pageCount) insertAfter.value = String(pageCount);
        baseRange.placeholder = `예: 2-3 (1~${pageCount})`;
        baseRange.value = '';
        if (insertAfter.value === '') insertAfter.value = String(Math.min(1, pageCount));
      } else {
        source = loaded;
        if (sourceInfo) {
          sourceInfo.textContent = `${file.name} · ${pageCount}쪽 · ${formatBytes(file.size)}`;
        }
        sourceRange.placeholder = `비우면 전체 (1~${pageCount})`;
        sourceRange.value = '';
      }

      if (base && source) {
        panel.hidden = false;
        updateMode();
        status.textContent = '삽입 위치와 쪽 범위를 확인한 뒤 [새 PDF 만들기]를 누르세요.';
      } else {
        status.textContent =
          target === 'base' ? '이제 끼워 넣을 PDF를 선택하세요.' : '이제 원본 PDF를 선택하세요.';
      }
    } catch (cause) {
      console.error(cause);
      if (target === 'base') base = null;
      else source = null;
      showError(
        cause instanceof Error
          ? cause.message
          : 'PDF를 열지 못했습니다. 암호가 걸렸거나 손상된 파일인지 확인하세요.',
      );
      status.textContent = '';
    }
  };

  const apply = async () => {
    if (!base || !source || busy) return;
    const plan = currentPlan();
    if (!plan || plan.errors.length > 0) {
      showPlanError(plan?.errors[0] ?? '설정을 확인하세요.');
      return;
    }

    showError('');
    showPlanError('');
    revoke();
    busy = true;
    runButton.disabled = true;
    status.textContent = 'PDF를 만드는 중…';

    try {
      const { PDFDocument } = await import('pdf-lib');
      const baseDoc = await PDFDocument.load(base.bytes);
      const sourceDoc = await PDFDocument.load(source.bytes);
      const output = await PDFDocument.create();

      const baseIndices = plan.ops
        .filter((op) => op.kind === 'base')
        .map((op) => op.index)
        .filter((value, index, array) => array.indexOf(value) === index);
      const sourceIndices = plan.ops
        .filter((op) => op.kind === 'source')
        .map((op) => op.index)
        .filter((value, index, array) => array.indexOf(value) === index);

      const basePages = await output.copyPages(baseDoc, baseIndices);
      const sourcePages = await output.copyPages(sourceDoc, sourceIndices);
      const baseMap = new Map(baseIndices.map((index, position) => [index, basePages[position]]));
      const sourceMap = new Map(
        sourceIndices.map((index, position) => [index, sourcePages[position]]),
      );

      for (const op of plan.ops) {
        const page = op.kind === 'base' ? baseMap.get(op.index) : sourceMap.get(op.index);
        if (page) output.addPage(page);
      }

      const bytes = await output.save();
      const blob = new Blob([new Uint8Array(bytes)], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);
      if (download) {
        download.href = resultUrl;
        download.download = insertFileName(base.file.name);
        download.textContent = `새 PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultValue) resultValue.textContent = 'PDF가 준비됐습니다';
      if (resultSummary) {
        resultSummary.textContent = `${output.getPageCount()}쪽 · ${formatBytes(blob.size)} · ${plan.summary}`;
      }
      result.hidden = false;
      status.textContent = '완료했습니다. 아래에서 내려받으세요.';
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError('PDF를 만드는 중 문제가 발생했습니다. 암호가 걸린 PDF인지 확인하세요.');
      status.textContent = '';
    } finally {
      busy = false;
      runButton.disabled = false;
    }
  };

  const wireDrop = (drop: HTMLElement, input: HTMLInputElement, target: 'base' | 'source') => {
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
      if (file) void acceptFile(file, target);
    });
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) void acceptFile(file, target);
      input.value = '';
    });
  };

  wireDrop(baseDrop, baseInput, 'base');
  wireDrop(sourceDrop, sourceInput, 'source');

  mode.addEventListener('change', updateMode);
  for (const control of [insertAfter, baseRange, sourceRange]) {
    control.addEventListener('input', () => {
      revoke();
      renderPreview();
    });
  }

  runButton.addEventListener('click', () => void doWork(runButton, apply));
  clearButton?.addEventListener('click', () => {
    if (busy) return;
    base = null;
    source = null;
    revoke();
    panel.hidden = true;
    showError('');
    showPlanError('');
    status.textContent = '';
    if (baseInfo) baseInfo.textContent = '';
    if (sourceInfo) sourceInfo.textContent = '';
    segments.replaceChildren();
    summary.textContent = '';
    baseInput.value = '';
    sourceInput.value = '';
    baseInput.focus();
  });

  window.addEventListener('pagehide', revoke);
}
