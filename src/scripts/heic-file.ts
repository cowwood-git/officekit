import { isHeic, jpegNameFor } from '@/lib/heic';

/**
 * HEIC(아이폰 사진)를 다른 도구가 그대로 쓸 수 있는 JPEG 파일로 바꾼다.
 * 브라우저가 직접 읽을 수 있으면(사파리) 캔버스로 다시 저장하고,
 * 아니면 heic2any(WASM)를 필요할 때만 불러 바꾼다. 어느 쪽이든 결과는 JPEG 파일이다.
 */
export async function heicAsReadable(file: File, used = new Set<string>()): Promise<File> {
  if (!isHeic(file)) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/jpeg', 0.95),
    );
    if (blob) return new File([blob], jpegNameFor(file.name, used), { type: 'image/jpeg' });
  } catch {
    // 브라우저가 HEIC를 못 읽는다 → WASM 디코더
  }
  const { default: heic2any } = await import('heic2any');
  const converted = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.95 });
  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!blob) throw new Error('HEIC 사진을 읽지 못했습니다.');
  return new File([blob], jpegNameFor(file.name, used), { type: 'image/jpeg' });
}
