/**
 * 양식 → HWPX 네이티브 생성.
 *
 * PDF를 거치지 않고 표·문단·상자를 한글 개체로 직접 만든다.
 * 화면·PDF와 같은 문서 모델(FormTemplate)을 쓰므로 내용은 항상 같다.
 */
import type { FormTemplate } from '@/lib/doc/types';
import { buildHwpxParts, type HwpxOptions } from './document';
import { packHwpx } from './package';

export async function buildHwpx(template: FormTemplate, options: HwpxOptions): Promise<Uint8Array> {
  const parts = buildHwpxParts(template, options);
  return packHwpx({
    headXml: parts.headXml,
    sectionXml: parts.sectionXml,
    images: parts.images,
  });
}
