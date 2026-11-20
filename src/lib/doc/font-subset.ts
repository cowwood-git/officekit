/**
 * 양식 PDF용 글꼴 서브셋(HarfBuzz hb-subset).
 *
 * 왜 따로 두나: pdf-lib의 `embedFont(…, { subset: true })`(@pdf-lib/fontkit)는 이 나눔고딕에서
 * 글리프 대부분을 빈 칸으로 만든다(2026-11-20 mupdf·Poppler·Quartz로 확인). 그래서 원본을
 * 통째로 넣어 PDF 1개가 약 1.5MB였다. 업계 표준 서브셋터인 HarfBuzz로 문서에 실제로 쓰인 글자만
 * 남긴 글꼴을 만들고, pdf-lib에는 그 작은 글꼴을 `subset: false`로 넣는다.
 *
 * hb-subset.wasm은 가져오는 것(import)이 없는 단독 모듈이라 C API를 그대로 부른다.
 * 실패하면 null을 돌려주고, 호출하는 쪽은 원본 글꼴을 그대로 넣는다(예전 동작).
 */

import type { PDFDocument, PDFFont } from 'pdf-lib';

export type Subsetter = (font: Uint8Array, text: string) => Uint8Array | null;

interface HbExports {
  memory: WebAssembly.Memory;
  malloc(size: number): number;
  free(ptr: number): void;
  hb_blob_create(data: number, length: number, mode: number, user: number, destroy: number): number;
  hb_blob_destroy(blob: number): void;
  hb_blob_get_data(blob: number, length: number): number;
  hb_blob_get_length(blob: number): number;
  hb_face_create(blob: number, index: number): number;
  hb_face_destroy(face: number): void;
  hb_face_reference_blob(face: number): number;
  hb_set_add(set: number, codepoint: number): void;
  hb_subset_input_create_or_fail(): number;
  hb_subset_input_destroy(input: number): void;
  hb_subset_input_unicode_set(input: number): number;
  hb_subset_or_fail(face: number, input: number): number;
}

/** HB_MEMORY_MODE_WRITABLE: 넘긴 메모리를 HarfBuzz가 복사하지 않고 그대로 쓴다. */
const HB_MEMORY_MODE_WRITABLE = 2;

/** 글꼴 파일 끝에 붙이는 0 바이트 수(글리프 헤더 10바이트 + 4바이트 정렬). */
const TAIL_PADDING = 12;

/** 이미 받아 둔 hb-subset.wasm 바이트(또는 컴파일된 모듈)로 서브셋 함수를 만든다. */
export async function createSubsetter(wasm: BufferSource | WebAssembly.Module): Promise<Subsetter> {
  const instance =
    wasm instanceof WebAssembly.Module
      ? await WebAssembly.instantiate(wasm)
      : (await WebAssembly.instantiate(wasm)).instance;
  const hb = instance.exports as unknown as HbExports;

  return (font, text) => {
    const fontPtr = hb.malloc(font.byteLength);
    if (!fontPtr) return null;
    new Uint8Array(hb.memory.buffer).set(font, fontPtr);
    const blob = hb.hb_blob_create(fontPtr, font.byteLength, HB_MEMORY_MODE_WRITABLE, 0, 0);
    const face = hb.hb_face_create(blob, 0);
    hb.hb_blob_destroy(blob);
    const input = hb.hb_subset_input_create_or_fail();
    let result: Uint8Array | null = null;
    if (input) {
      const unicodes = hb.hb_subset_input_unicode_set(input);
      for (const char of new Set(text)) {
        const code = char.codePointAt(0);
        if (code !== undefined) hb.hb_set_add(unicodes, code);
      }
      const subset = hb.hb_subset_or_fail(face, input);
      hb.hb_subset_input_destroy(input);
      if (subset) {
        const out = hb.hb_face_reference_blob(subset);
        const length = hb.hb_blob_get_length(out);
        const data = hb.hb_blob_get_data(out, 0);
        // 서브셋 중 메모리가 늘었을 수 있어 버퍼를 새로 잡아 복사한다.
        // 끝에 0을 TAIL_PADDING만큼 덧붙인다: pdf-lib의 fontkit은 빈 글리프(공백)도 헤더 10바이트를
        // 읽는데, HarfBuzz 출력은 공백이 glyf 표의 마지막이 되기 쉬워 파일 끝을 넘어 오류가 난다.
        // 0은 체크섬 합에 영향이 없고, 읽힌 헤더도 0(빈 글리프)이라 결과가 맞다.
        if (length > 0 && data) {
          result = new Uint8Array(length + TAIL_PADDING);
          result.set(new Uint8Array(hb.memory.buffer, data, length));
        }
        hb.hb_blob_destroy(out);
        hb.hb_face_destroy(subset);
      }
    }
    hb.hb_face_destroy(face);
    hb.free(fontPtr);
    return result;
  };
}

let loading: Promise<Subsetter | null> | null = null;

/**
 * 브라우저에서 hb-subset.wasm(약 680KB, /_astro/ 해시 파일이라 서비스 워커가 캐시)을 한 번만 받아
 * 서브셋 함수를 만든다. 실패하면 null이고, 다음 PDF 때 다시 시도한다.
 */
export function loadSubsetter(): Promise<Subsetter | null> {
  loading ??= (async () => {
    try {
      const { default: url } = await import('harfbuzzjs/dist/harfbuzz-subset.wasm?url');
      const response = await fetch(url);
      if (!response.ok) throw new Error(`hb-subset ${response.status}`);
      return await createSubsetter(await response.arrayBuffer());
    } catch {
      loading = null;
      return null;
    }
  })();
  return loading;
}

/**
 * PDF에 쓰일 글자(text)만 남긴 글꼴을 넣는다. 서브셋을 못 만들면 원본을 넣는다(PDF가 커질 뿐 내용은 같다).
 * text에는 실제로 그릴 글자를 빠짐없이 넣어야 한다(빠진 글자는 빈 칸으로 찍힌다).
 * subsetter를 넘기지 않으면 브라우저에서 hb-subset.wasm을 받아 쓴다.
 */
export async function embedTextFont(
  pdf: PDFDocument,
  bytes: ArrayBuffer | Uint8Array,
  text: string,
  subsetter?: Subsetter | null,
): Promise<PDFFont> {
  const source = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const active = subsetter === undefined ? await loadSubsetter() : subsetter;
  let subset: Uint8Array | null = null;
  try {
    subset = active ? active(source, text || ' ') : null;
  } catch {
    subset = null;
  }
  return pdf.embedFont(subset ?? source, { subset: false });
}
