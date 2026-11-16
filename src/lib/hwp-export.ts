/**
 * HWPX → HWP(바이너리) 변환.
 *
 * HWPX는 우리가 PDF를 거치지 않고 직접 만든 네이티브 문서다.
 * HWP는 한글 2010 이하 호환용으로, 같은 개체를 rhwp로 한 번 더 옮긴다.
 * (PDF → HWP 가 아니라 HWPX → HWP 이므로 표·문단이 그대로 유지된다.)
 */
import { ensureRhwp, loadRhwpModule } from '@/lib/rhwp';

export type HwpFormat = 'hwp' | 'hwpx';

export type HwpProgress = (phase: 'engine' | 'convert') => void;

export const HWP_MIME: Record<HwpFormat, string> = {
  hwp: 'application/x-hwp',
  hwpx: 'application/hwp+zip',
};

export async function exportHwpxAsHwp(
  hwpx: Uint8Array,
  onProgress?: HwpProgress,
): Promise<Uint8Array> {
  onProgress?.('engine');
  await ensureRhwp();
  const rhwp = await loadRhwpModule();

  onProgress?.('convert');
  const doc = (() => {
    try {
      return new rhwp.HwpDocument(hwpx);
    } catch (cause) {
      console.warn('HWPX → HWP 변환 실패', cause);
      throw new Error('한글 파일로 바꾸지 못했습니다. HWPX로 저장한 뒤 한글에서 열어 주세요.');
    }
  })();

  try {
    return doc.exportHwp();
  } finally {
    doc.free();
  }
}
