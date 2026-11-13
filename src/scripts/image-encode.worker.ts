// 이미지 인코딩을 화면과 다른 스레드에서 돌린다(큰 사진은 수 초 걸린다).
import { codecQuality, type EncodeMime, oxipngLevel } from '@/lib/image-encode';

export interface EncodeRequest {
  id: number;
  mime: EncodeMime;
  quality: number;
  width: number;
  height: number;
  pixels: Uint8ClampedArray<ArrayBuffer>;
}

export type EncodeResponse =
  | { id: number; ok: true; buffer: ArrayBuffer }
  | { id: number; ok: false; message: string };

async function encode(request: EncodeRequest): Promise<ArrayBuffer> {
  const image = new ImageData(request.pixels, request.width, request.height);
  if (request.mime === 'image/jpeg') {
    const { default: encodeJpeg } = await import('@jsquash/jpeg/encode');
    return encodeJpeg(image, { quality: codecQuality(request.quality) });
  }
  if (request.mime === 'image/webp') {
    const { default: encodeWebp } = await import('@jsquash/webp/encode');
    return encodeWebp(image, { quality: codecQuality(request.quality) });
  }
  const { default: optimise } = await import('@jsquash/oxipng/optimise');
  return optimise(image, { level: oxipngLevel(image.width, image.height) });
}

self.addEventListener('message', async (event: MessageEvent<EncodeRequest>) => {
  const { id } = event.data;
  try {
    const buffer = await encode(event.data);
    (self as unknown as Worker).postMessage({ id, ok: true, buffer } satisfies EncodeResponse, [
      buffer,
    ]);
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : String(cause);
    (self as unknown as Worker).postMessage({ id, ok: false, message } satisfies EncodeResponse);
  }
});
