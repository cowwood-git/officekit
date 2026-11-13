import type { PDFDocument } from 'pdf-lib';
import { doWork } from '@/lib/do-work';
import { formatBytes, validatePdfSelection } from '@/lib/files';
import {
  cleanMetadata,
  formatPdfDate,
  hasMetadata,
  metadataFileName,
  metadataSummary,
} from '@/lib/pdf-metadata';

interface Loaded {
  file: File;
  pageCount: number;
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
  creationDate?: string;
  modificationDate?: string;
}

let current: Loaded | null = null;
let resultUrl: string | null = null;
let running = false;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initPdfMetadata(): void {
  const input = byId<HTMLInputElement>('pm-input');
  const drop = byId<HTMLElement>('pm-drop');
  const panel = byId<HTMLElement>('pm-panel');
  const fileInfo = byId<HTMLElement>('pm-file-info');
  const currentBox = byId<HTMLElement>('pm-current');
  const currentDates = byId<HTMLElement>('pm-current-dates');
  const titleInput = byId<HTMLInputElement>('pm-title');
  const authorInput = byId<HTMLInputElement>('pm-author');
  const subjectInput = byId<HTMLInputElement>('pm-subject');
  const keywordsInput = byId<HTMLTextAreaElement>('pm-keywords');
  const applyButton = byId<HTMLButtonElement>('pm-apply');
  const clearButton = byId<HTMLButtonElement>('pm-clear');
  const resetButton = byId<HTMLButtonElement>('pm-reset');
  const status = byId<HTMLElement>('pm-status');
  const error = byId<HTMLElement>('pm-error');
  const result = byId<HTMLElement>('pm-result');
  const resultSummary = byId<HTMLElement>('pm-result-summary');
  const resultSize = byId<HTMLElement>('pm-result-size');
  const download = byId<HTMLAnchorElement>('pm-download');

  if (
    !input ||
    !drop ||
    !panel ||
    !titleInput ||
    !authorInput ||
    !subjectInput ||
    !keywordsInput ||
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

  const renderCurrent = () => {
    if (!currentBox) return;
    const values = [
      current?.title && `제목: ${current.title}`,
      current?.author && `작성자: ${current.author}`,
      current?.subject && `주제: ${current.subject}`,
      current?.keywords && `키워드: ${current.keywords}`,
      current?.creator && `만든 프로그램: ${current.creator}`,
      current?.producer && `PDF 엔진: ${current.producer}`,
    ].filter(Boolean);
    currentBox.textContent =
      values.length > 0 ? values.join(' · ') : '저장된 메타데이터가 없습니다.';
    if (currentDates) {
      currentDates.textContent = `만든 날짜 ${formatPdfDate(current?.creationDate)} · 수정한 날짜 ${formatPdfDate(current?.modificationDate)}`;
    }
  };

  const fill = (doc: PDFDocument) => {
    const keywords = doc.getKeywords();
    return {
      title: doc.getTitle() ?? '',
      author: doc.getAuthor() ?? '',
      subject: doc.getSubject() ?? '',
      keywords: keywords ?? '',
      creator: doc.getCreator() ?? '',
      producer: doc.getProducer() ?? '',
      creationDate: doc.getCreationDate()?.toISOString(),
      modificationDate: doc.getModificationDate()?.toISOString(),
    };
  };

  const acceptFile = async (file: File) => {
    if (running) return;
    showError('');
    clearResult();
    const validation = validatePdfSelection([file]);
    if (!validation.ok) {
      showError(validation.errors.join(' '));
      return;
    }

    status.textContent = 'PDF 정보를 읽는 중…';
    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const metadata = fill(doc);
      current = {
        file,
        pageCount: doc.getPageCount(),
        ...metadata,
      };

      titleInput.value = metadata.title;
      authorInput.value = metadata.author;
      subjectInput.value = metadata.subject;
      keywordsInput.value = metadata.keywords;
      if (fileInfo) {
        fileInfo.textContent = `${file.name} · ${doc.getPageCount()}쪽 · ${formatBytes(file.size)}`;
      }
      renderCurrent();
      panel.hidden = false;
      status.textContent = '값을 고친 뒤 저장하세요. 빈칸으로 저장하면 해당 항목이 비워집니다.';
    } catch (cause) {
      console.error(cause);
      current = null;
      panel.hidden = true;
      showError('PDF를 열 수 없습니다. 암호가 걸렸거나 손상된 파일인지 확인하세요.');
      status.textContent = '';
    }
  };

  const run = async () => {
    const loaded = current;
    if (!loaded || running) return;
    const cleaned = cleanMetadata({
      title: titleInput.value,
      author: authorInput.value,
      subject: subjectInput.value,
      keywords: keywordsInput.value,
    });

    showError('');
    clearResult();
    running = true;
    applyButton.disabled = true;
    applyButton.setAttribute('aria-busy', 'true');
    if (resetButton) resetButton.disabled = true;
    status.textContent = '메타데이터를 저장하는 중…';

    try {
      const { PDFDocument } = await import('pdf-lib');
      const doc = await PDFDocument.load(await loaded.file.arrayBuffer());
      doc.setTitle(cleaned.title);
      doc.setAuthor(cleaned.author);
      doc.setSubject(cleaned.subject);
      doc.setKeywords(cleaned.keywords);
      doc.setModificationDate(new Date());

      const bytes = await doc.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      resultUrl = URL.createObjectURL(blob);
      if (download) {
        download.href = resultUrl;
        download.download = metadataFileName(loaded.file.name);
        download.textContent = `메타데이터 PDF 내려받기 (${formatBytes(blob.size)})`;
        download.hidden = false;
      }
      if (resultSummary) resultSummary.textContent = metadataSummary(cleaned);
      if (resultSize) resultSize.textContent = formatBytes(blob.size);
      status.textContent = hasMetadata(cleaned)
        ? '저장했습니다. 아래에서 내려받으세요.'
        : '모든 메타데이터를 비웠습니다.';
      result.hidden = false;
      result.focus({ preventScroll: false });
    } catch (cause) {
      console.error(cause);
      showError('저장하지 못했습니다. 암호가 걸린 PDF인지 확인하세요.');
      status.textContent = '';
    } finally {
      running = false;
      applyButton.disabled = false;
      applyButton.removeAttribute('aria-busy');
      if (resetButton) resetButton.disabled = false;
    }
  };

  const clearAll = () => {
    titleInput.value = '';
    authorInput.value = '';
    subjectInput.value = '';
    keywordsInput.value = '';
    clearResult();
    titleInput.focus();
  };

  applyButton.addEventListener('click', () => void doWork(applyButton, run));
  clearButton?.addEventListener('click', clearAll);

  resetButton?.addEventListener('click', () => {
    current = null;
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
    if (resultUrl) URL.revokeObjectURL(resultUrl);
  });
}
