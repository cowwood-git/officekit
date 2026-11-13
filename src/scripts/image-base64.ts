import {
  BASE64_MAX_BYTES,
  dataUri,
  decodeBase64,
  encodeBase64,
  extensionFor,
  parseBase64Input,
  sniffImageMime,
  snippetsFor,
} from '@/lib/base64-image';
import { formatBytes } from '@/lib/files';
import { bindDrop, byId, copyText, errorSetter } from './kit';

/** 이미지 Base64 — 이미지 → data URI·HTML·CSS 코드, 붙여 넣은 Base64 → 이미지 파일. */
export function initImageBase64(): void {
  const input = byId<HTMLInputElement>('b6-input');
  const drop = byId<HTMLElement>('b6-drop');
  const error = byId<HTMLElement>('b6-error');
  const encodePanel = byId<HTMLElement>('b6-encode');
  const encodeInfo = byId<HTMLElement>('b6-encode-info');
  const encodePreview = byId<HTMLImageElement>('b6-encode-preview');
  const format = byId<HTMLSelectElement>('b6-format');
  const output = byId<HTMLTextAreaElement>('b6-output');
  const copy = byId<HTMLButtonElement>('b6-copy');
  const paste = byId<HTMLTextAreaElement>('b6-paste');
  const decode = byId<HTMLButtonElement>('b6-decode');
  const decodeError = byId<HTMLElement>('b6-decode-error');
  const decodePanel = byId<HTMLElement>('b6-decoded');
  const decodePreview = byId<HTMLImageElement>('b6-decoded-preview');
  const decodeInfo = byId<HTMLElement>('b6-decoded-info');
  const decodeDownload = byId<HTMLAnchorElement>('b6-download');
  if (!input || !drop || !error || !output || !paste || !decode) return;
  const showError = errorSetter(error);
  const showDecodeError = decodeError ? errorSetter(decodeError) : showError;

  let uri = '';
  let alt = '이미지';
  let decodedUrl: string | null = null;

  const renderOutput = () => {
    if (!uri) return;
    const snippets = snippetsFor(uri, alt);
    output.value = snippets[(format?.value as keyof typeof snippets) ?? 'dataUri'] ?? uri;
  };

  const encode = async (file: File) => {
    showError('');
    if (file.size > BASE64_MAX_BYTES) {
      showError(`${formatBytes(BASE64_MAX_BYTES)} 이하 이미지만 바꿀 수 있습니다.`);
      return;
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mime = sniffImageMime(bytes) ?? (file.type.startsWith('image/') ? file.type : null);
    if (!mime) {
      showError('이미지 파일(PNG·JPG·GIF·WebP·SVG·ICO)을 넣어 주세요.');
      return;
    }
    uri = dataUri(mime, encodeBase64(bytes));
    alt = file.name.replace(/\.[^.]+$/, '');
    if (encodePreview) encodePreview.src = uri;
    if (encodeInfo) {
      encodeInfo.textContent = `${file.name} · 원본 ${formatBytes(file.size)} → Base64 ${uri.length.toLocaleString('ko-KR')}자(약 ${formatBytes(uri.length)})${file.size > 100 * 1024 ? ' · 100KB가 넘는 이미지는 파일로 두는 편이 페이지가 빠릅니다.' : ''}`;
    }
    if (encodePanel) encodePanel.hidden = false;
    renderOutput();
  };

  const runDecode = () => {
    showDecodeError('');
    if (decodePanel) decodePanel.hidden = true;
    const parsed = parseBase64Input(paste.value);
    if (!parsed) {
      showDecodeError(
        'Base64 형식이 아닙니다. data:image/…;base64, 로 시작하는 글이나 Base64 문자열을 붙여 넣으세요.',
      );
      return;
    }
    let bytes: Uint8Array;
    try {
      bytes = decodeBase64(parsed.base64);
    } catch {
      showDecodeError('Base64를 풀 수 없습니다. 중간이 잘리지 않았는지 확인하세요.');
      return;
    }
    const mime = sniffImageMime(bytes) ?? parsed.mime;
    if (!mime?.startsWith('image/')) {
      showDecodeError(
        '풀어 보니 이미지가 아닙니다. 글자를 Base64로 바꾼 것이라면 텍스트 변환 도구를 쓰세요.',
      );
      return;
    }
    if (decodedUrl) URL.revokeObjectURL(decodedUrl);
    const blob = new Blob([new Uint8Array(bytes)], { type: mime });
    decodedUrl = URL.createObjectURL(blob);
    if (decodePreview) decodePreview.src = decodedUrl;
    if (decodeInfo) decodeInfo.textContent = `${mime} · ${formatBytes(blob.size)}`;
    if (decodeDownload) {
      decodeDownload.href = decodedUrl;
      decodeDownload.download = `image.${extensionFor(mime)}`;
      decodeDownload.textContent = `이미지 내려받기 (${formatBytes(blob.size)})`;
    }
    if (decodePanel) decodePanel.hidden = false;
  };

  bindDrop(input, drop, (files) => void encode(files[0] as File));
  format?.addEventListener('change', renderOutput);
  copy?.addEventListener('click', () => void copyText(copy, output.value));
  decode.addEventListener('click', runDecode);

  window.addEventListener('pagehide', () => {
    if (decodedUrl) URL.revokeObjectURL(decodedUrl);
    decodedUrl = null;
  });
}
