import { type IcsEventInput, icsFileName, serializeIcsFile } from '@/lib/vcf-ics';

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

const pad2 = (value: number) => String(value).padStart(2, '0');

function today(): string {
  const date = new Date();
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDate(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return value || '-';
  const [, year, month, day] = match;
  return `${year}. ${Number(month)}. ${Number(day)}.`;
}

export function initIcsMaker(): void {
  const titleInput = byId<HTMLInputElement>('ics-title');
  const allDay = byId<HTMLInputElement>('ics-allday');
  const startDate = byId<HTMLInputElement>('ics-start-date');
  const startTime = byId<HTMLInputElement>('ics-start-time');
  const startTimeField = byId<HTMLElement>('ics-start-time-field');
  const endDate = byId<HTMLInputElement>('ics-end-date');
  const endTime = byId<HTMLInputElement>('ics-end-time');
  const endTimeField = byId<HTMLElement>('ics-end-time-field');
  const location = byId<HTMLInputElement>('ics-location');
  const reminder = byId<HTMLSelectElement>('ics-reminder');
  const url = byId<HTMLInputElement>('ics-url');
  const description = byId<HTMLTextAreaElement>('ics-description');
  const generate = byId<HTMLButtonElement>('ics-generate');
  const reset = byId<HTMLButtonElement>('ics-reset');
  const status = byId<HTMLElement>('ics-status');
  const error = byId<HTMLElement>('ics-error');
  const summaryTitle = byId<HTMLElement>('ics-summary-title');
  const summaryWhen = byId<HTMLElement>('ics-summary-when');
  const summaryWhere = byId<HTMLElement>('ics-summary-where');
  const summaryReminder = byId<HTMLElement>('ics-summary-reminder');

  if (
    !titleInput ||
    !allDay ||
    !startDate ||
    !startTime ||
    !startTimeField ||
    !endDate ||
    !endTime ||
    !endTimeField ||
    !location ||
    !reminder ||
    !url ||
    !description ||
    !generate ||
    !reset ||
    !status ||
    !error ||
    !summaryTitle ||
    !summaryWhen ||
    !summaryWhere ||
    !summaryReminder
  ) {
    return;
  }

  let downloadUrl: string | null = null;

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  const setStatus = (message: string) => {
    status.textContent = message;
  };

  const syncAllDay = () => {
    const check = allDay.checked;
    startTimeField.hidden = check;
    endTimeField.hidden = check;
  };

  const readEvent = (): IcsEventInput => ({
    summary: titleInput.value.trim(),
    start: startDate.value,
    end: endDate.value || startDate.value,
    startTime: startTime.value,
    endTime: endTime.value,
    allDay: allDay.checked,
    location: location.value.trim(),
    description: description.value.trim(),
    url: url.value.trim(),
    reminderMinutes: Number(reminder.value) || 0,
  });

  const updateSummary = () => {
    const event = readEvent();
    const start = formatDate(event.start);
    const end = formatDate(event.end || event.start);
    summaryTitle.textContent = event.summary || '일정 제목';

    if (!event.start) {
      summaryWhen.textContent = '날짜를 선택하세요.';
    } else if (event.allDay) {
      summaryWhen.textContent =
        event.end && event.end !== event.start ? `${start} ~ ${end} · 종일` : `${start} · 종일`;
    } else {
      const time = event.startTime && event.endTime ? `${event.startTime} ~ ${event.endTime}` : '';
      summaryWhen.textContent =
        event.end && event.end !== event.start
          ? `${start} ${time} ~ ${end}`
          : `${start} ${time}`.trim();
    }

    summaryWhere.textContent = event.location || '장소 없음';
    summaryReminder.textContent =
      Number(reminder.value) > 0 ? (reminder.selectedOptions[0]?.textContent ?? '알림') : '없음';
  };

  const resetForm = () => {
    titleInput.value = '';
    allDay.checked = false;
    startDate.value = today();
    endDate.value = today();
    startTime.value = '09:00';
    endTime.value = '10:00';
    location.value = '';
    reminder.value = '0';
    url.value = '';
    description.value = '';
    showError('');
    setStatus('');
    syncAllDay();
    updateSummary();
  };

  const generateFile = () => {
    const event = readEvent();
    if (!event.summary) {
      showError('일정 제목을 입력하세요.');
      titleInput.focus();
      return;
    }
    if (!event.start) {
      showError('시작일을 선택하세요.');
      startDate.focus();
      return;
    }
    if (!event.allDay && (!event.startTime || !event.endTime)) {
      showError('시작·종료 시간을 입력하세요.');
      return;
    }

    try {
      const text = serializeIcsFile([event]);
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
      const urlValue = URL.createObjectURL(
        new Blob([text], { type: 'text/calendar;charset=utf-8' }),
      );
      downloadUrl = urlValue;
      const link = document.createElement('a');
      link.href = urlValue;
      link.download = icsFileName();
      link.click();
      window.setTimeout(() => {
        if (downloadUrl !== urlValue) return;
        URL.revokeObjectURL(urlValue);
        downloadUrl = null;
      }, 1000);
      showError('');
      setStatus(`${link.download} 파일을 만들었습니다.`);
    } catch (cause) {
      showError(cause instanceof Error ? cause.message : 'ICS 파일을 만들지 못했습니다.');
    }
  };

  for (const input of [
    titleInput,
    startDate,
    endDate,
    startTime,
    endTime,
    location,
    reminder,
    url,
    description,
  ]) {
    input.addEventListener('input', updateSummary);
    input.addEventListener('change', updateSummary);
  }
  allDay.addEventListener('change', () => {
    syncAllDay();
    if (allDay.checked && endDate.value < startDate.value) endDate.value = startDate.value;
    updateSummary();
  });
  generate.addEventListener('click', generateFile);
  reset.addEventListener('click', resetForm);

  window.addEventListener('pagehide', () => {
    if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    downloadUrl = null;
  });

  resetForm();
}
