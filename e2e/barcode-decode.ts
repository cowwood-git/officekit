import {
  BinaryBitmap,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from '@zxing/library';
import sharp from 'sharp';

/** 생성한 바코드 PNG를 실제 디코더로 읽어 스캔 가능성을 자동 검증한다. */
export async function decodeBarcodePng(
  buffer: Buffer,
): Promise<{ text: string; format: string | number }> {
  const { data, info } = await sharp(buffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const source = new RGBLuminanceSource(new Uint8ClampedArray(data), info.width, info.height);
  const bitmap = new BinaryBitmap(new HybridBinarizer(source));
  const reader = new MultiFormatReader();
  reader.setHints(new Map());
  const result = reader.decodeWithState(bitmap);
  return { text: result.getText(), format: result.getBarcodeFormat() };
}
