import type { LoggerMessage, Worker } from 'tesseract.js';
import type { OcrLanguage } from '@/lib/ocr';

let worker: Worker | null = null;
let workerLang: OcrLanguage | null = null;
let progressHandler: ((message: LoggerMessage) => void) | null = null;

const STATUS_KO: Record<string, string> = {
  'loading tesseract core': '인식 엔진 불러오는 중',
  'initializing tesseract': '엔진 초기화 중',
  'loading language traineddata': '언어 데이터 불러오는 중',
  'initializing api': '언어 데이터 적용 중',
  'recognizing text': '텍스트 인식 중',
};

export function ocrStatusLabel(status: string): string {
  return STATUS_KO[status] ?? status;
}

async function getWorker(language: OcrLanguage): Promise<Worker> {
  if (worker && workerLang === language) return worker;

  if (worker) {
    await worker.terminate();
    worker = null;
    workerLang = null;
  }

  const { createWorker, OEM } = await import('tesseract.js');
  worker = await createWorker(language, OEM.LSTM_ONLY, {
    workerPath: '/ocr/worker.min.js',
    corePath: '/ocr/core/tesseract-core-simd-lstm.wasm.js',
    langPath: '/ocr/lang',
    gzip: true,
    logger: (message: LoggerMessage) => progressHandler?.(message),
  });
  workerLang = language;
  return worker;
}

export interface OcrResult {
  text: string;
  confidence: number;
}

export async function recognizeCanvas(
  canvas: HTMLCanvasElement,
  language: OcrLanguage,
  onProgress?: (message: LoggerMessage) => void,
): Promise<OcrResult> {
  progressHandler = onProgress ?? null;
  try {
    const instance = await getWorker(language);
    const { data } = await instance.recognize(canvas);
    return { text: data.text, confidence: data.confidence };
  } finally {
    progressHandler = null;
  }
}

/** OCR 엔진은 언어 데이터를 메모리에 들고 있으므로 페이지를 떠날 때 종료한다. */
export async function disposeOcr(): Promise<void> {
  progressHandler = null;
  if (worker) {
    try {
      await worker.terminate();
    } catch {
      // 이미 종료된 워커는 무시
    }
  }
  worker = null;
  workerLang = null;
}
