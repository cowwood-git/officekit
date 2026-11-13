import { charCount, docxTextFileName, isDoc, isWordFile, wordCount } from '@/lib/docx';
import { formatBytes, MAX_TOTAL_BYTES } from '@/lib/files';
import { loadWordHtml, paginateWordHtml } from '@/lib/word-doc';

interface Loaded {
  file: File;
  text: string;
  textUrl?: string;
}

let state: Loaded | null = null;

function byId<T extends HTMLElement>(id: string): T | null {
  return document.getElementById(id) as T | null;
}

export function initDocxViewer(): void {
  const input = byId<HTMLInputElement>('docx-input');
  const drop = byId<HTMLElement>('docx-drop');
  const panel = byId<HTMLElement>('docx-panel');
  const info = byId<HTMLElement>('docx-file-info');
  const meta = byId<HTMLElement>('docx-meta');
  const warnings = byId<HTMLElement>('docx-warnings');
  const warningList = byId<HTMLUListElement>('docx-warning-list');
  const content = byId<HTMLElement>('docx-content');
  const pagePrev = byId<HTMLButtonElement>('docx-prev');
  const pageNext = byId<HTMLButtonElement>('docx-next');
  const pageLabel = byId<HTMLElement>('docx-page-label');
  const layoutSelect = byId<HTMLSelectElement>('docx-layout');
  const copyButton = byId<HTMLButtonElement>('docx-copy');
  const download = byId<HTMLAnchorElement>('docx-download');
  const printButton = byId<HTMLButtonElement>('docx-print');
  const resetButton = byId<HTMLButtonElement>('docx-reset');
  const status = byId<HTMLElement>('docx-status');
  const error = byId<HTMLElement>('docx-error');

  if (!input || !drop || !panel || !info || !content || !status || !error) {
    return;
  }

  const showError = (message: string) => {
    error.hidden = message === '';
    error.textContent = message;
  };

  let docPages: HTMLElement[] = [];
  let docPageIndex = 0;
  let docLayout: 'single' | 'spread' = 'single';

  const updatePager = () => {
    const count = docPages.length;
    if (pageLabel) {
      pageLabel.textContent =
        docLayout === 'spread' && docPageIndex + 2 <= count
          ? `${docPageIndex + 1}–${docPageIndex + 2} / ${count}`
          : `${docPageIndex + 1} / ${count}`;
    }
    if (pagePrev) pagePrev.disabled = count === 0 || docPageIndex <= 0;
    if (pageNext) {
      const step = docLayout === 'spread' ? 2 : 1;
      pageNext.disabled = count === 0 || docPageIndex + step >= count;
    }
  };

  const showDocPage = (index: number) => {
    if (docPages.length === 0) return;
    docPageIndex = Math.min(docPages.length - 1, Math.max(0, index));
    const scale =
      docLayout === 'spread'
        ? Math.min(1, Math.max(0.35, (content.clientWidth - 48) / (794 * 2)))
        : Math.min(1, Math.max(0.3, (content.clientWidth - 32) / 794));
    docPages.forEach((page, pageIndex) => {
      page.style.zoom = String(scale);
      page.hidden =
        docLayout === 'spread'
          ? pageIndex !== docPageIndex && pageIndex !== docPageIndex + 1
          : pageIndex !== docPageIndex;
    });
    content.scrollTop = 0;
    updatePager();
  };

  const paginate = async (html: string) => {
    content.dataset.layout = 'single';
    docLayout = 'single';
    docPageIndex = 0;
    if (layoutSelect) layoutSelect.value = 'single';
    docPages = await paginateWordHtml(html, content);
    showDocPage(0);
  };

  const clearDownload = () => {
    if (state?.textUrl) URL.revokeObjectURL(state.textUrl);
    if (state) state.textUrl = undefined;
    download?.removeAttribute('href');
    if (download) download.hidden = true;
  };

  const load = async (file: File) => {
    showError('');
    clearDownload();
    panel.hidden = true;
    docPages = [];
    docPageIndex = 0;
    docLayout = 'single';
    content.replaceChildren();
    updatePager();

    if (!isWordFile(file.name)) {
      showError('DOC·DOCX 파일만 열 수 있습니다.');
      return;
    }
    if (file.size > MAX_TOTAL_BYTES) {
      showError(`파일이 ${formatBytes(MAX_TOTAL_BYTES)}를 넘습니다. 더 작은 문서를 사용하세요.`);
      return;
    }

    const legacy = isDoc(file.name);
    status.textContent = legacy ? '구형 DOC 문서를 읽는 중…' : '문서를 변환하는 중…';
    await new Promise((resolve) => window.setTimeout(resolve, 30));

    try {
      const word = await loadWordHtml(file);
      panel.hidden = false;
      await paginate(word.html);
      const text = word.text;
      const messages = word.warnings.map((message) => ({ type: 'warning', message }));

      content.querySelectorAll('a').forEach((anchor) => {
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer nofollow';
      });

      state = { file, text };

      if (copyButton) copyButton.disabled = text.trim() === '';
      if (download) {
        const blob = new Blob([`\uFEFF${text}`], { type: 'text/plain;charset=utf-8' });
        state.textUrl = URL.createObjectURL(blob);
        download.href = state.textUrl;
        download.download = docxTextFileName(file.name);
        download.textContent = '텍스트 저장';
        download.hidden = false;
      }

      if (info) {
        info.textContent = `${file.name} · ${formatBytes(file.size)}${word.legacy ? ' · 구형 DOC' : ''}`;
      }
      if (meta) {
        meta.textContent = `${wordCount(text)}단어 · ${charCount(text)}자 · ${docPages.length}쪽${
          word.legacy ? ' · 텍스트 미리보기' : ` · 변환 경고 ${messages.length}건`
        }`;
      }
      if (warnings && warningList) {
        warningList.replaceChildren();
        for (const message of messages) {
          const li = document.createElement('li');
          li.textContent = `${message.type}: ${message.message}`;
          warningList.append(li);
        }
        warnings.hidden = messages.length === 0;
      }

      status.textContent = word.legacy
        ? '구형 DOC을 텍스트·표 중심으로 불러왔습니다. 서식·이미지는 일부 빠질 수 있습니다.'
        : '문서를 불러왔습니다. 내용을 확인하고 텍스트로 저장할 수 있습니다.';
    } catch (cause) {
      console.error(cause);
      state = null;
      showError('문서를 열지 못했습니다. 암호가 걸렸거나 손상된 DOC·DOCX인지 확인하세요.');
      status.textContent = '';
    }
  };

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
    if (file) void load(file);
  });

  input.addEventListener('change', () => {
    const file = input.files?.[0];
    if (file) void load(file);
    input.value = '';
  });

  copyButton?.addEventListener('click', async () => {
    if (!state) return;
    try {
      await navigator.clipboard.writeText(state.text);
      copyButton.textContent = '복사됨';
      window.setTimeout(() => {
        copyButton.textContent = '텍스트 복사';
      }, 1500);
    } catch {
      showError('자동 복사가 차단되었습니다. 본문을 선택해 Ctrl/Cmd+C로 복사하세요.');
    }
  });

  printButton?.addEventListener('click', () => window.print());

  layoutSelect?.addEventListener('change', () => {
    docLayout = layoutSelect.value === 'spread' ? 'spread' : 'single';
    content.dataset.layout = docLayout;
    if (docLayout === 'spread' && docPageIndex % 2 !== 0) docPageIndex -= 1;
    showDocPage(docPageIndex);
  });

  pagePrev?.addEventListener('click', () => {
    showDocPage(docPageIndex - (docLayout === 'spread' ? 2 : 1));
  });
  pageNext?.addEventListener('click', () => {
    showDocPage(docPageIndex + (docLayout === 'spread' ? 2 : 1));
  });

  resetButton?.addEventListener('click', () => {
    clearDownload();
    state = null;
    docPages = [];
    docPageIndex = 0;
    docLayout = 'single';
    content.replaceChildren();
    updatePager();
    panel.hidden = true;
    status.textContent = '';
    showError('');
  });

  window.addEventListener('pagehide', () => {
    clearDownload();
    state = null;
    docPages = [];
    content.replaceChildren();
  });
}
