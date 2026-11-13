import {
  formatPercent,
  formatWon,
  parseNumberInput,
  percentChange,
  percentOf,
  percentRatio,
  supplyFromTotal,
  vatFromSupply,
} from '@/lib/percent-vat';

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPercentCalc(): void {
  const ofValue = byId<HTMLInputElement>('pcv-of-value');
  const ofPercent = byId<HTMLInputElement>('pcv-of-percent');
  const ofResult = byId<HTMLElement>('pcv-of-result');

  const ratioPart = byId<HTMLInputElement>('pcv-ratio-part');
  const ratioWhole = byId<HTMLInputElement>('pcv-ratio-whole');
  const ratioResult = byId<HTMLElement>('pcv-ratio-result');

  const changeFrom = byId<HTMLInputElement>('pcv-change-from');
  const changeTo = byId<HTMLInputElement>('pcv-change-to');
  const changeResult = byId<HTMLElement>('pcv-change-result');
  const changeNote = byId<HTMLElement>('pcv-change-note');

  const vatAmount = byId<HTMLInputElement>('pcv-vat-amount');
  const vatMode = byId<HTMLSelectElement>('pcv-vat-mode');
  const vatRate = byId<HTMLSelectElement>('pcv-vat-rate');
  const vatSupply = byId<HTMLElement>('pcv-vat-supply');
  const vatTax = byId<HTMLElement>('pcv-vat-tax');
  const vatTotal = byId<HTMLElement>('pcv-vat-total');
  const vatNote = byId<HTMLElement>('pcv-vat-note');

  const copyButton = byId<HTMLButtonElement>('pcv-copy');
  const status = byId<HTMLElement>('pcv-status');

  if (
    !ofValue ||
    !ofPercent ||
    !ratioPart ||
    !ratioWhole ||
    !changeFrom ||
    !changeTo ||
    !vatAmount ||
    !vatMode ||
    !vatRate ||
    !vatSupply ||
    !vatTax ||
    !vatTotal
  ) {
    return;
  }

  let summary = '';

  const run = () => {
    const value = parseNumberInput(ofValue.value);
    const percent = parseNumberInput(ofPercent.value);
    if (ofResult) {
      ofResult.textContent =
        value === null || percent === null ? '-' : formatWon(percentOf(value, percent));
    }

    const part = parseNumberInput(ratioPart.value);
    const whole = parseNumberInput(ratioWhole.value);
    if (ratioResult) {
      ratioResult.textContent =
        part === null || whole === null ? '-' : formatPercent(percentRatio(part, whole));
    }

    const from = parseNumberInput(changeFrom.value);
    const to = parseNumberInput(changeTo.value);
    const change = from === null || to === null ? null : percentChange(from, to);
    if (changeResult) changeResult.textContent = formatPercent(change);
    if (changeNote) {
      changeNote.textContent =
        change === null
          ? '기준값이 0이면 증감률을 계산할 수 없습니다.'
          : change > 0
            ? `${formatWon(to ?? 0)}으로 증가했습니다.`
            : change < 0
              ? `${formatWon(to ?? 0)}으로 감소했습니다.`
              : '변화가 없습니다.';
    }

    const amount = parseNumberInput(vatAmount.value);
    const rate = Number(vatRate.value) || 10;
    const mode = vatMode.value;
    const vat =
      amount === null
        ? null
        : mode === 'included'
          ? supplyFromTotal(amount, rate)
          : vatFromSupply(amount, rate);
    vatSupply.textContent = vat ? formatWon(vat.supply) : '-';
    vatTax.textContent = vat ? formatWon(vat.vat) : '-';
    vatTotal.textContent = vat ? formatWon(vat.total) : '-';
    if (vatNote) {
      vatNote.textContent =
        mode === 'included'
          ? `${rate}% 포함 금액에서 공급가액을 역산했습니다.`
          : `${rate}% 세율로 부가세를 더했습니다.`;
    }

    summary = [
      ofResult ? `X의 Y%: ${ofResult.textContent}` : '',
      ratioResult ? `비율: ${ratioResult.textContent}` : '',
      changeResult ? `증감률: ${changeResult.textContent}` : '',
      vat
        ? `공급가액 ${formatWon(vat.supply)} · 부가세 ${formatWon(vat.vat)} · 합계 ${formatWon(vat.total)}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
  };

  for (const control of [
    ofValue,
    ofPercent,
    ratioPart,
    ratioWhole,
    changeFrom,
    changeTo,
    vatAmount,
    vatMode,
    vatRate,
  ]) {
    control.addEventListener('input', run);
    control.addEventListener('change', run);
  }

  copyButton?.addEventListener('click', async () => {
    if (!summary) return;
    try {
      await navigator.clipboard.writeText(summary);
      copyButton.textContent = '복사됨';
      window.setTimeout(() => {
        copyButton.textContent = '결과 복사';
      }, 1500);
    } catch {
      if (status) status.textContent = '자동 복사가 차단되었습니다. 결과를 선택해 복사하세요.';
    }
  });

  run();
}
