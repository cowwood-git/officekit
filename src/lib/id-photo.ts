/** 증명사진 규격과 인화지 배치 계산. 길이는 mm, 출력은 300dpi 픽셀. */
export interface PhotoPreset {
  id: string;
  label: string;
  widthMm: number;
  heightMm: number;
  note: string;
}

export const PHOTO_PRESETS: PhotoPreset[] = [
  { id: 'half', label: '반명함 3×4cm', widthMm: 30, heightMm: 40, note: '이력서·학생증·사원증' },
  {
    id: 'passport',
    label: '여권 3.5×4.5cm',
    widthMm: 35,
    heightMm: 45,
    note: '여권·주민등록증·운전면허증',
  },
  { id: 'card', label: '명함판 5×7cm', widthMm: 50, heightMm: 70, note: '각종 원서·자격증' },
  {
    id: 'us-visa',
    label: '미국 비자 5×5cm',
    widthMm: 51,
    heightMm: 51,
    note: '미국 비자·여권(2×2인치)',
  },
];

export const PRINT_DPI = 300;

/** 4×6인치(10×15cm) 인화지 */
export const SHEET_MM = { width: 101.6, height: 152.4 };

export function mmToPx(mm: number, dpi = PRINT_DPI): number {
  return Math.round((mm / 25.4) * dpi);
}

export function presetById(id: string): PhotoPreset {
  return PHOTO_PRESETS.find((preset) => preset.id === id) ?? (PHOTO_PRESETS[0] as PhotoPreset);
}

export interface View {
  /** 1 = 사진이 틀을 꽉 채우는 최소 배율 */
  zoom: number;
  /** 틀 중심에서 사진 중심까지(틀 너비·높이 대비 비율) */
  offsetX: number;
  offsetY: number;
}

/**
 * 원본을 틀(boxW×boxH)에 그릴 위치. zoom 1 이 "틀을 꽉 채우는(cover)" 크기이고,
 * 1보다 작으면 여백이 생기며 그 자리는 배경색으로 채운다.
 */
export function placement(
  imageW: number,
  imageH: number,
  boxW: number,
  boxH: number,
  view: View,
): { x: number; y: number; width: number; height: number } {
  const cover = Math.max(boxW / imageW, boxH / imageH);
  const scale = cover * view.zoom;
  const width = imageW * scale;
  const height = imageH * scale;
  return {
    x: (boxW - width) / 2 + view.offsetX * boxW,
    y: (boxH - height) / 2 + view.offsetY * boxH,
    width,
    height,
  };
}

/** 사진이 틀 밖으로 너무 멀리 나가지 않게 이동량을 묶는다. */
export function clampOffset(
  imageW: number,
  imageH: number,
  boxW: number,
  boxH: number,
  view: View,
): View {
  const cover = Math.max(boxW / imageW, boxH / imageH);
  const width = imageW * cover * view.zoom;
  const height = imageH * cover * view.zoom;
  const limitX = Math.abs(width - boxW) / 2 / boxW + 0.25;
  const limitY = Math.abs(height - boxH) / 2 / boxH + 0.25;
  return {
    zoom: view.zoom,
    offsetX: Math.min(limitX, Math.max(-limitX, view.offsetX)),
    offsetY: Math.min(limitY, Math.max(-limitY, view.offsetY)),
  };
}

/** 인화지에 사진을 몇 장, 어디에 놓을지. 간격 gapMm, 가장자리 여백 marginMm. */
export function sheetLayout(
  photoMm: { width: number; height: number },
  sheetMm = SHEET_MM,
  gapMm = 2,
  marginMm = 2,
): { columns: number; rows: number; positions: { x: number; y: number }[] } {
  const countFit = (space: number, size: number) =>
    Math.max(0, Math.floor((space - 2 * marginMm + gapMm) / (size + gapMm)));
  const columns = countFit(sheetMm.width, photoMm.width);
  const rows = countFit(sheetMm.height, photoMm.height);
  const usedW = columns * photoMm.width + Math.max(0, columns - 1) * gapMm;
  const usedH = rows * photoMm.height + Math.max(0, rows - 1) * gapMm;
  const left = (sheetMm.width - usedW) / 2;
  const top = (sheetMm.height - usedH) / 2;
  const positions: { x: number; y: number }[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      positions.push({
        x: left + column * (photoMm.width + gapMm),
        y: top + row * (photoMm.height + gapMm),
      });
    }
  }
  return { columns, rows, positions };
}

export function idPhotoFileName(original: string, preset: PhotoPreset, sheet: boolean): string {
  const dot = original.lastIndexOf('.');
  const base = (dot > 0 ? original.slice(0, dot) : original) || 'photo';
  const size = `${preset.widthMm / 10}x${preset.heightMm / 10}cm`;
  return `${base}-${size}${sheet ? '-4x6' : ''}.jpg`;
}
