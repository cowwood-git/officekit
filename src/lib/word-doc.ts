/**
 * Word(DOC·DOCX) 문서를 안전한 HTML로 바꾸고 A4 페이지로 나눈다.
 * 뷰어와 PDF 변환이 같은 결과를 쓰도록 한 곳에 둔다.
 */
import DOMPurify from 'dompurify';
import { isDoc } from '@/lib/docx';

const ALLOWED_TAGS = [
  'p',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'ul',
  'ol',
  'li',
  'strong',
  'em',
  'u',
  's',
  'del',
  'blockquote',
  'pre',
  'code',
  'br',
  'hr',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
  'img',
  'a',
  'sup',
  'sub',
  'span',
];

const ALLOWED_ATTR = ['href', 'src', 'alt', 'title', 'colspan', 'rowspan'];

export interface WordDocumentHtml {
  html: string;
  text: string;
  legacy: boolean;
  warnings: string[];
}

export async function loadWordHtml(file: File): Promise<WordDocumentHtml> {
  const legacy = isDoc(file.name);
  if (legacy) {
    const [{ toMarkdown }, { marked }] = await Promise.all([
      import('@mdgate/doc'),
      import('marked'),
    ]);
    const markdown = await toMarkdown(new Uint8Array(await file.arrayBuffer()));
    const html = await marked.parse(markdown);
    const clean = DOMPurify.sanitize(html, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      ALLOW_DATA_ATTR: false,
      FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    });
    return {
      html: clean,
      text: markdown,
      legacy: true,
      warnings: ['구형 .doc은 텍스트·표 중심으로 변환되어 서식·이미지가 일부 빠질 수 있습니다.'],
    };
  }

  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const [result, raw] = await Promise.all([
    mammoth.convertToHtml({ arrayBuffer }),
    mammoth.extractRawText({ arrayBuffer }),
  ]);
  const clean = DOMPurify.sanitize(result.value, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
  });
  return {
    html: clean,
    text: raw.value,
    legacy: false,
    warnings: result.messages.map((message) => message.message),
  };
}

export function makeWordPage(number: number): { page: HTMLElement; inner: HTMLElement } {
  const page = document.createElement('article');
  page.className = 'docx-page';
  page.style.width = '794px';
  page.style.height = '1123px';
  const inner = document.createElement('div');
  inner.className = 'docx-page-inner';
  const label = document.createElement('span');
  label.className = 'docx-page-number';
  label.textContent = String(number);
  page.append(inner, label);
  return { page, inner };
}

/** host 안에 A4 페이지를 만들고, 넘치는 블록을 다음 페이지로 옮긴다. */
export async function paginateWordHtml(html: string, host: HTMLElement): Promise<HTMLElement[]> {
  host.replaceChildren();
  const flow = document.createElement('div');
  flow.innerHTML = html;
  const images = Array.from(flow.querySelectorAll('img'));
  await Promise.all(
    images.map(
      (image) =>
        new Promise<void>((resolve) => {
          if (image.complete) {
            resolve();
            return;
          }
          const timer = window.setTimeout(resolve, 1000);
          const done = () => {
            window.clearTimeout(timer);
            resolve();
          };
          image.addEventListener('load', done, { once: true });
          image.addEventListener('error', done, { once: true });
        }),
    ),
  );

  const blocks = Array.from(flow.childNodes);
  const pages: HTMLElement[] = [];
  const addPage = (): HTMLElement => {
    const { page, inner } = makeWordPage(pages.length + 1);
    host.append(page);
    pages.push(page);
    return inner;
  };

  let inner = addPage();
  for (const node of blocks) {
    inner.append(node);
    if (inner.scrollHeight > inner.clientHeight + 1) {
      inner.removeChild(node);
      inner = addPage();
      inner.append(node);
    }
  }

  return pages;
}
