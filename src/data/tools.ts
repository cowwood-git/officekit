import type { Locale } from '@/i18n/ui';

export type ToolCategory = 'document' | 'image' | 'text' | 'utility';

export type LocalizedText = { ko: string } & Partial<Record<Exclude<Locale, 'ko'>, string>>;

export interface FaqItem {
  q: string;
  a: string;
}

export interface Source {
  label: string;
  href: string;
}

export interface Tool {
  slug: string;
  category: ToolCategory;
  icon: string;
  title: LocalizedText;
  /** 카드에 쓰는 한 줄 설명 (40~90자) */
  summary: LocalizedText;
  /** meta description (70~155자) */
  description: LocalizedText;
  keywords: string[];
  /** 최종 검토일. 실제로 동작을 확인한 날짜만 넣는다. */
  updated: string;
  faq: FaqItem[];
  sources: Source[];
  related: string[];
}

export const CATEGORIES: Record<ToolCategory, { label: string; description: string }> = {
  document: {
    label: 'PDF',
    description: 'PDF를 합치고 나누고, 다른 형식으로 바꾸는 문서 작업',
  },
  image: {
    label: '이미지',
    description: '사진·스캔본의 용량을 줄이고 형식을 바꾸는 작업',
  },
  text: {
    label: '텍스트',
    description: '보고서·자기소개서·메일을 다듬는 가벼운 도구',
  },
  utility: {
    label: '유틸',
    description: 'QR·날짜·변환처럼 자주 쓰는 작은 도구',
  },
};

export const tools: Tool[] = [
  {
    slug: 'pdf-merge',
    category: 'document',
    icon: '📄',
    title: {
      ko: 'PDF 합치기',
      en: 'Merge PDF',
      ja: 'PDF結合',
    },
    summary: {
      ko: '여러 PDF를 원하는 순서로 하나로 합칩니다.',
      en: 'Combine multiple PDFs into one file, in the order you choose.',
      ja: '複数のPDFを好きな順番で1つにまとめます。',
    },
    description: {
      ko: '여러 개의 PDF를 순서대로 합쳐 하나의 파일로 만듭니다. 설치·회원가입 없이 브라우저에서 처리하며, 파일은 서버로 전송되지 않습니다. 페이지 수와 용량을 확인한 뒤 바로 내려받으세요.',
      en: 'Merge multiple PDF files into one in the order you choose. Runs entirely in your browser; files are never uploaded.',
      ja: '複数のPDFを順番どおりに1つに結合します。ブラウザ内で処理し、ファイルはサーバーに送信されません。',
    },
    keywords: ['PDF 합치기', 'PDF 병합', 'PDF 합치는 법', '여러 PDF 하나로', 'PDF 합치기 무료'],
    updated: '2026-11-10',
    faq: [
      {
        q: '파일이 서버로 전송되나요?',
        a: '아니요. PDF 합치기는 브라우저에 내려받은 라이브러리(pdf-lib)가 브라우저 안에서 처리합니다. 네트워크 탭을 열어 확인해도 파일 전송 요청은 발생하지 않습니다. 다만 아주 큰 파일은 브라우저 메모리 한계로 실패할 수 있습니다.',
      },
      {
        q: '순서를 바꿀 수 있나요?',
        a: '파일 목록에서 위·아래 버튼으로 순서를 바꾼 뒤 합치면 됩니다. 목록에 보이는 순서가 그대로 결과 PDF의 페이지 순서가 됩니다.',
      },
      {
        q: '암호가 걸린 PDF도 합칠 수 있나요?',
        a: '암호를 모르면 열 수 없습니다. 보안이 걸린 PDF는 암호를 해제한 뒤 사용하세요. 암호 해제 기능은 파일을 복호화하는 별도 도구로 제공할 예정입니다.',
      },
      {
        q: '몇 개까지 합칠 수 있나요?',
        a: '개수 제한은 두지 않았지만, 전체 용량 50MB 이하를 권장합니다. 그보다 크면 브라우저가 느려지거나 실패할 수 있습니다.',
      },
    ],
    sources: [
      { label: 'pdf-lib 공식 문서', href: 'https://pdf-lib.js.org/' },
      {
        label: 'MDN — File API',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/File_API',
      },
    ],
    related: ['pdf-split', 'image-compress', 'text-counter'],
  },
  {
    slug: 'pdf-split',
    category: 'document',
    icon: '✂️',
    title: {
      ko: 'PDF 나누기',
      en: 'Split PDF',
      ja: 'PDF分割',
    },
    summary: {
      ko: '한 PDF를 범위·페이지 수 기준으로 나눕니다.',
      en: 'Split a PDF by page range or into equal chunks.',
      ja: '1つのPDFを範囲やページ数で分割します。',
    },
    description: {
      ko: 'PDF를 지정한 페이지만 추출하거나, 일정 페이지 수씩 여러 파일로 나누고 ZIP으로 내려받으세요. 설치·회원가입 없이 브라우저에서 처리하며 파일은 서버로 전송되지 않습니다.',
      en: 'Extract specific pages or split a PDF into chunks and download as ZIP. Runs entirely in your browser; files are never uploaded.',
      ja: '指定ページの抽出や、Nページごとの分割とZIPダウンロードができます。ブラウザ内で処理し、ファイルは送信されません。',
    },
    keywords: ['PDF 나누기', 'PDF 분할', 'PDF 페이지 추출', 'PDF 자르기', 'PDF 나누기 무료'],
    updated: '2026-11-10',
    faq: [
      {
        q: '페이지 번호는 1부터인가요?',
        a: '네. 첫 페이지가 1입니다. 예를 들어 3쪽짜리 PDF에서 "1-2"를 입력하면 앞의 두 페이지만 추출합니다.',
      },
      {
        q: '여러 범위를 각각 다른 파일로 만들 수 있나요?',
        a: '현재 범위 추출은 입력한 범위를 하나의 PDF로 묶습니다. 서로 다른 파일로 나누려면 범위를 바꿔 여러 번 실행하거나, "페이지 수만큼" 모드를 사용하세요.',
      },
      {
        q: '나눈 파일은 어떻게 저장되나요?',
        a: '한 개면 PDF로, 여러 개면 ZIP으로 내려받습니다. ZIP 안의 파일은 part-01.pdf, part-02.pdf 순서로 들어갑니다.',
      },
      {
        q: '암호가 걸린 PDF도 나눌 수 있나요?',
        a: '암호를 모르면 열 수 없습니다. 암호를 해제한 뒤 사용하세요. 또한 입력 폼·북마크·주석은 나누는 과정에서 일부 사라질 수 있습니다.',
      },
    ],
    sources: [
      { label: 'pdf-lib 공식 문서', href: 'https://pdf-lib.js.org/' },
      { label: 'JSZip 문서', href: 'https://stuk.github.io/jszip/' },
    ],
    related: ['pdf-merge', 'jpg-to-pdf', 'image-compress'],
  },
  {
    slug: 'jpg-to-pdf',
    category: 'document',
    icon: '📷',
    title: {
      ko: 'JPG → PDF',
      en: 'JPG to PDF',
      ja: 'JPG → PDF 変換',
    },
    summary: {
      ko: '사진·스캔본을 순서대로 묶어 한 PDF로 만듭니다.',
      en: 'Combine photos and scans into a single PDF in the order you choose.',
      ja: '写真やスキャン画像を順番どおりに1つのPDFにまとめます。',
    },
    description: {
      ko: 'JPG·PNG·WebP·아이폰 HEIC 이미지를 여러 장 골라 A4·Letter·원본 크기 PDF로 만듭니다. 순서 변경과 화질 선택이 가능하고, 파일은 서버로 전송되지 않습니다.',
      en: 'Combine JPG, PNG, and WebP images into an A4, Letter, or original-size PDF. Reorder pages and choose quality. Nothing is uploaded.',
      ja: 'JPG・PNG・WebP画像を複数選び、A4・Letter・元サイズのPDFに変換します。順番と画質を選べ、ファイルは送信されません。',
    },
    keywords: ['JPG PDF 변환', '이미지 PDF', '사진 PDF로', 'PNG PDF', '스캔본 PDF'],
    updated: '2026-11-10',
    faq: [
      {
        q: '여러 장의 순서를 바꿀 수 있나요?',
        a: '목록에서 위·아래 버튼으로 순서를 바꾸거나, "이름순 정렬"로 파일명 기준으로 한 번에 정렬할 수 있습니다. 목록 순서가 PDF 페이지 순서가 됩니다.',
      },
      {
        q: '화질과 용량은 어떻게 조절하나요?',
        a: '화질을 "원본 우선"으로 두면 JPEG 92%로, "용량 우선"은 72%로 저장합니다. PNG는 원본 우선일 때 투명도를 유지하지만, 용량은 JPEG보다 클 수 있습니다.',
      },
      {
        q: '아이폰 HEIC 사진도 되나요?',
        a: '됩니다. HEIC 사진을 넣으면 브라우저 안에서 JPG로 먼저 읽은 뒤 PDF에 담습니다. 처음 한 번은 변환 모듈을 불러오느라 몇 초 걸릴 수 있습니다.',
      },
      {
        q: 'A4로 만들면 여백이 생기나요?',
        a: '네. 기본 여백은 24pt(약 8.5mm)이고, 이미지 비율을 유지한 채 페이지 가운데에 배치합니다. 여백 없이 원본 비율을 쓰려면 페이지 크기를 "원본 크기"로 선택하세요.',
      },
    ],
    sources: [
      { label: 'pdf-lib 공식 문서', href: 'https://pdf-lib.js.org/' },
      {
        label: 'MDN — createImageBitmap',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap',
      },
    ],
    related: ['pdf-to-jpg', 'pdf-merge', 'image-compress'],
  },
  {
    slug: 'pdf-to-jpg',
    category: 'document',
    icon: '📸',
    title: {
      ko: 'PDF → JPG',
      en: 'PDF to JPG',
      ja: 'PDF → JPG 変換',
    },
    summary: {
      ko: 'PDF 페이지를 JPG 이미지로 바꿔 ZIP으로 받습니다.',
      en: 'Convert PDF pages to JPG images and download them as a ZIP.',
      ja: 'PDFの各ページをJPG画像に変換し、ZIPで保存します。',
    },
    description: {
      ko: 'PDF 페이지를 원하는 해상도와 화질로 JPG 이미지로 변환합니다. 1페이지는 JPG, 여러 페이지는 ZIP으로 받고 파일은 서버로 전송되지 않습니다.',
      en: 'Turn PDF pages into JPG images at your chosen resolution and quality. One page downloads as JPG, multiple pages as ZIP. Nothing is uploaded.',
      ja: 'PDFのページを解像度・画質を選んでJPGに変換します。1ページはJPG、複数ページはZIPで保存。ファイルは送信されません。',
    },
    keywords: ['PDF JPG 변환', 'PDF 이미지로', 'PDF 캡처', 'PDF 사진 변환', 'PDF JPG 저장'],
    updated: '2026-11-10',
    faq: [
      {
        q: '텍스트를 복사할 수 있나요?',
        a: '아니요. JPG는 이미지 형식이라 텍스트 선택·검색이 되지 않습니다. 검색 가능한 문서가 필요하면 원본 PDF를 보관하세요.',
      },
      {
        q: '여러 페이지는 어떻게 받나요?',
        a: '2페이지 이상이면 페이지별 JPG를 ZIP으로 묶어 내려받습니다. 파일명은 원본 페이지 번호를 따라 page-01.jpg 형식입니다.',
      },
      {
        q: '해상도는 어떤 걸 고르면 되나요?',
        a: '화면 확인·메신저는 72 DPI, 일반 제출은 144 DPI, 인쇄는 216 DPI를 권장합니다. 높일수록 선명하지만 용량과 메모리 사용이 늘어납니다.',
      },
      {
        q: '암호가 걸린 PDF도 되나요?',
        a: '암호를 모르면 열 수 없습니다. 암호를 해제한 뒤 사용하세요. 또한 아주 오래된 문서는 포함된 글꼴에 따라 원본과 글자 모양이 조금 다를 수 있습니다.',
      },
    ],
    sources: [
      { label: 'pdf.js 공식 문서', href: 'https://mozilla.github.io/pdf.js/' },
      {
        label: 'MDN — Canvas toBlob',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob',
      },
    ],
    related: ['jpg-to-pdf', 'pdf-split', 'image-compress'],
  },
  {
    slug: 'heic-to-jpg',
    category: 'image',
    icon: '📱',
    title: {
      ko: 'HEIC → JPG',
      en: 'HEIC to JPG',
      ja: 'HEIC → JPG 変換',
    },
    summary: {
      ko: '아이폰 HEIC 사진을 호환되는 JPG로 바꿉니다.',
      en: 'Convert iPhone HEIC photos to widely supported JPG files.',
      ja: 'iPhoneのHEIC写真を互換性の高いJPGに変換します。',
    },
    description: {
      ko: '아이폰 HEIC·HEIF 사진을 JPG로 변환합니다. Chrome은 브라우저 변환 엔진으로, Safari는 기기 기능으로 처리하며 사진은 서버로 전송되지 않습니다. 여러 장은 ZIP으로 받습니다.',
      en: 'Convert HEIC/HEIF photos to JPG. Chrome uses a built-in decoder, Safari uses the device decoder. Photos never leave your browser.',
      ja: 'HEIC・HEIF写真をJPGに変換。Chromeはブラウザ内蔵デコーダー、Safariは端末のデコーダーを使い、写真は送信されません。',
    },
    keywords: ['HEIC JPG 변환', '아이폰 사진 JPG', 'HEIC 변환', 'HEIF JPG', '아이폰 사진 윈도우'],
    updated: '2026-11-14',
    faq: [
      {
        q: '왜 첫 변환이 느린가요?',
        a: 'Chrome·Edge·Firefox는 HEIC를 기본으로 읽지 못해 사진 변환 엔진(약 1.3MB)을 내려받습니다. 첫 1회만 걸리고 이후에는 브라우저에 저장되어 빠릅니다. Safari는 기기 기능을 써서 바로 변환됩니다.',
      },
      {
        q: '사진이 서버로 올라가나요?',
        a: '아니요. 디코딩과 JPG 인코딩이 브라우저 탭 안에서만 이루어집니다. 다만 첫 변환 때 디코더 파일을 내려받는 요청은 발생합니다.',
      },
      {
        q: '여러 장을 한 번에 바꿀 수 있나요?',
        a: '최대 20장, 전체 50MB까지 순차 변환합니다. 메모리 보호를 위해 동시에 처리하지 않습니다. 결과는 ZIP으로 묶여 내려받습니다.',
      },
      {
        q: '화질이나 위치 정보가 유지되나요?',
        a: '화질은 선택한 JPG 품질(85%·92%)로 다시 인코딩됩니다. 촬영 위치·기기 정보 같은 EXIF 메타데이터는 복사되지 않으므로, 위치 정보가 필요한 사진은 원본을 보관하세요.',
      },
    ],
    sources: [
      { label: 'libheif (GitHub)', href: 'https://github.com/strukturag/libheif' },
      { label: 'libheif (GitHub)', href: 'https://github.com/strukturag/libheif' },
    ],
    related: ['image-compress', 'jpg-to-pdf', 'pdf-to-jpg'],
  },
  {
    slug: 'image-crop',
    category: 'image',
    icon: '📐',
    title: {
      ko: '이미지 자르기·리사이즈',
      en: 'Crop & Resize Image',
      ja: '画像の切り抜き・リサイズ',
    },
    summary: {
      ko: '비율을 맞춰 자르고 원하는 크기로 저장합니다.',
      en: 'Crop to a ratio and export at the size you need.',
      ja: '比率に合わせて切り抜き、好きなサイズで保存します。',
    },
    description: {
      ko: '이미지를 드래그해 자르고 출력 크기를 지정합니다. 1:1·3:4·16:9 비율 프리셋, JPG·PNG·WebP 저장을 지원하며 파일은 서버로 전송되지 않습니다.',
      en: 'Crop images visually and export at a target size. Ratio presets, JPG/PNG/WebP output, all processed in your browser.',
      ja: 'ドラッグで切り抜き、出力サイズを指定。比率プリセットとJPG・PNG・WebP保存に対応し、ファイルは送信されません。',
    },
    keywords: [
      '이미지 자르기',
      '사진 크기 조정',
      '이미지 리사이즈',
      '증명사진 자르기',
      '프로필 사진 크기',
    ],
    updated: '2026-11-10',
    faq: [
      {
        q: '원본 화질이 유지되나요?',
        a: '자른 영역을 그대로 복사하고 출력 크기로 다시 그립니다. 원본보다 크게 출력하면 확대되며 흐려질 수 있고, JPG로 저장하면 재인코딩됩니다. 원본은 수정되지 않습니다.',
      },
      {
        q: '증명사진 비율로 자를 수 있나요?',
        a: '3:4 프리셋을 선택하고 출력 크기를 600×800으로 지정하면 됩니다. 얼굴 위치는 박스를 드래그해 맞추세요.',
      },
      {
        q: '투명 배경이 사라졌어요.',
        a: 'JPG 형식에는 투명 칸이 없어서 그 자리를 흰색으로 칠합니다. 투명 배경을 유지하려면 형식을 PNG나 WebP로 선택하세요.',
      },
      {
        q: '큰 사진을 자르면 실패합니다.',
        a: '브라우저 메모리 한계 때문입니다. 출력 크기를 3000px 이하로 낮추거나, 먼저 이미지 압축 도구로 용량을 줄인 뒤 사용하세요.',
      },
    ],
    sources: [
      {
        label: 'MDN — CanvasRenderingContext2D.drawImage',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage',
      },
      {
        label: 'MDN — createImageBitmap',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap',
      },
    ],
    related: ['image-compress', 'heic-to-jpg', 'jpg-to-pdf'],
  },
  {
    slug: 'image-mosaic',
    category: 'image',
    icon: '🕶️',
    title: {
      ko: '이미지 모자이크·가리기',
      en: 'Mosaic & Redact Image',
      ja: '画像のモザイク・隠し',
    },
    summary: {
      ko: '신분증·계좌번호 같은 개인정보를 가립니다.',
      en: 'Redact sensitive details with mosaic, blur, or solid black boxes.',
      ja: '個人情報をモザイク・ぼかし・黒塗りで隠します。',
    },
    description: {
      ko: '이미지에서 가릴 영역을 지정해 모자이크·블러·검은색으로 덮습니다. 신분증·계좌번호·얼굴 가리기에 적합하며, 저장 시 EXIF가 제거됩니다. 파일은 서버로 전송되지 않습니다.',
      en: 'Select areas to hide with mosaic, blur, or solid black. Ideal for IDs, account numbers, and faces. EXIF is stripped on save; nothing is uploaded.',
      ja: '隠したい範囲を選び、モザイク・ぼかし・黒塗りで覆います。身分証や口座番号、顔の隠しに最適。保存時にEXIFを削除し、ファイルは送信されません。',
    },
    keywords: ['이미지 모자이크', '사진 가리기', '개인정보 가리기', '신분증 가리기', '얼굴 블러'],
    updated: '2026-11-10',
    faq: [
      {
        q: '모자이크를 하면 완전히 복원되지 않나요?',
        a: '아닙니다. 모자이크·블러는 원본 픽셀을 완전히 지우지 않으므로, 강도가 낮거나 원본이 고해상도이면 복원 시도가 가능합니다. 이름·주민번호·계좌번호처럼 민감한 정보는 검은색으로 완전히 덮는 것을 권장합니다.',
      },
      {
        q: '여러 곳을 한 번에 가릴 수 있나요?',
        a: '네. 영역 추가를 눌러 여러 사각형을 만들고 각각 이동·크기 조절할 수 있습니다. 선택한 영역은 모서리를 끌어 조정하고, 선택 삭제로 제거합니다.',
      },
      {
        q: 'EXIF 위치 정보도 지워지나요?',
        a: '네. 결과 이미지를 다시 인코딩하므로 촬영 위치·기기 정보 같은 EXIF가 제거됩니다. 원본 파일은 수정되지 않습니다.',
      },
      {
        q: '얼굴을 가릴 때 주의할 점이 있나요?',
        a: '턱·귀·머리카락 경계까지 영역을 넉넉히 잡으세요. 얼굴 일부만 가리면 주변 정보로 신원이 추정될 수 있습니다. 필요하면 목·옷깃까지 함께 가리는 편이 안전합니다.',
      },
    ],
    sources: [
      {
        label: 'MDN — CanvasRenderingContext2D.filter',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter',
      },
      {
        label: 'MDN — drawImage',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage',
      },
    ],
    related: ['image-crop', 'image-compress', 'heic-to-jpg'],
  },
  {
    slug: 'image-ocr',
    category: 'image',
    icon: '🔍',
    title: {
      ko: '이미지 OCR',
      en: 'Image OCR',
      ja: '画像OCR',
    },
    summary: {
      ko: '사진·스캔본에서 텍스트를 추출합니다.',
      en: 'Extract text from photos and scanned documents.',
      ja: '写真やスキャン画像からテキストを抽出します。',
    },
    description: {
      ko: '이미지에서 한국어·영어 텍스트를 추출합니다. 스캔본·영수증·명함에 적합하며, 인식 엔진이 브라우저에서 실행되어 이미지가 서버로 전송되지 않습니다.',
      en: 'Extract Korean and English text from images. Runs entirely in your browser; images are never uploaded.',
      ja: '画像から韓国語・英語のテキストを抽出。ブラウザ内で処理し、画像は送信されません。',
    },
    keywords: ['이미지 OCR', '사진 텍스트 추출', '스캔본 텍스트', '영수증 OCR', '이미지 글자 인식'],
    updated: '2026-11-10',
    faq: [
      {
        q: '첫 실행이 왜 느린가요?',
        a: '인식 엔진과 언어 데이터를 내려받기 때문입니다. 한국어+영어 기준 약 7~12MB이며, 한 번 받으면 브라우저에 캐시되어 다음부터는 빨라집니다. 이미지는 전송되지 않습니다.',
      },
      {
        q: '한국어와 영어를 같이 인식할 수 있나요?',
        a: '네. 언어에서 “한국어 + 영어”를 선택하세요. 다만 언어를 바꾸면 해당 언어 데이터를 새로 받아야 합니다.',
      },
      {
        q: 'PDF도 바로 넣을 수 있나요?',
        a: '현재는 이미지 파일만 지원합니다. PDF는 PDF → JPG로 페이지를 이미지로 바꾼 뒤 넣어 주세요. 텍스트가 이미 들어 있는 PDF는 복사하면 되므로 OCR이 필요 없습니다.',
      },
      {
        q: '손글씨도 인식되나요?',
        a: '인쇄체 위주 엔진이라 손글씨 정확도는 매우 낮습니다. 표·다단 레이아웃도 줄 순서가 섞일 수 있으므로, 중요한 문서는 결과를 반드시 검토하세요.',
      },
    ],
    sources: [
      { label: 'tesseract.js (GitHub)', href: 'https://github.com/naptha/tesseract.js' },
      { label: 'Tesseract OCR 문서', href: 'https://tesseract-ocr.github.io/' },
    ],
    related: ['pdf-to-jpg', 'image-crop', 'text-counter'],
  },
  {
    slug: 'image-watermark',
    category: 'image',
    icon: '💧',
    title: {
      ko: '이미지 워터마크',
      en: 'Image Watermark',
      ja: '画像ウォーターマーク',
    },
    summary: {
      ko: '대외비·초안 같은 문구를 이미지에 넣습니다.',
      en: 'Add text watermarks like “Confidential” or “Draft” to images.',
      ja: '「社外秘」「下書き」などの文字を画像に入れます。',
    },
    description: {
      ko: '이미지에 대외비·초안·출처 문구를 워터마크로 넣습니다. 반복 배치, 크기·투명도·색상·각도를 조절하고 원본 해상도로 저장하세요. 파일은 서버로 전송되지 않습니다.',
      en: 'Add text watermarks with tiled or single placement, adjustable size, opacity, color, and angle. Export at original resolution. Nothing is uploaded.',
      ja: '繰り返し配置や中央・右下の文字ウォーターマークを追加。サイズ・透明度・色・角度を調整し、元の解像度で保存できます。',
    },
    keywords: ['이미지 워터마크', '대외비 표시', '사진 워터마크', '로고 넣기', '이미지 문구 삽입'],
    updated: '2026-11-10',
    faq: [
      {
        q: '로고 이미지도 넣을 수 있나요?',
        a: '현재는 텍스트 워터마크만 지원합니다. 로고·서명 이미지를 얹는 기능은 다음 업데이트에서 추가할 예정입니다.',
      },
      {
        q: '워터마크를 넣은 사진에서 다시 지울 수 있나요?',
        a: '이 도구는 이미지 위에 직접 그려 넣으므로 제거 기능을 제공하지 않습니다. 원본 파일을 반드시 보관하세요.',
      },
      {
        q: '글자가 잘 안 보입니다.',
        a: '색상과 투명도를 조정하세요. 밝은 이미지에는 어두운 색, 어두운 이미지에는 밝은 색이 잘 보입니다. 그림자 옵션을 켜면 복잡한 배경에서도 읽기 쉬워집니다.',
      },
      {
        q: '투명 PNG로 저장할 수 있나요?',
        a: '네. 형식을 PNG로 선택하면 투명 배경이 유지됩니다. JPG 형식에는 투명 칸이 없어서 그 자리를 흰색으로 칠합니다.',
      },
    ],
    sources: [
      {
        label: 'MDN — CanvasRenderingContext2D.fillText',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText',
      },
      {
        label: 'MDN — Canvas text styles',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_text',
      },
    ],
    related: ['image-crop', 'image-mosaic', 'image-compress'],
  },
  {
    slug: 'image-merge',
    category: 'image',
    icon: '🧩',
    title: {
      ko: '이미지 합치기',
      en: 'Merge Images',
      ja: '画像の結合',
    },
    summary: {
      ko: '여러 사진을 가로·세로·격자로 이어 한 장으로 만듭니다.',
      en: 'Combine multiple images horizontally, vertically, or in a grid.',
      ja: '複数の画像を横・縦・グリッドで1枚にまとめます。',
    },
    description: {
      ko: '2~9장의 이미지를 가로·세로·격자로 이어 붙여 한 장으로 만듭니다. 간격·배경색·형식을 지정하고 JPG·PNG·WebP로 저장하며 이미지는 서버로 전송되지 않습니다.',
      en: 'Combine 2–9 images horizontally, vertically, or in a grid. Set gaps, background, and export to JPG, PNG, or WebP without uploading.',
      ja: '2〜9枚の画像を横・縦・グリッドで結合します。間隔・背景・形式を指定して保存できます。',
    },
    keywords: ['이미지 합치기', '사진 이어붙이기', '이미지 콜라주', '스크린샷 합치기', '사진 합성'],
    updated: '2026-11-10',
    faq: [
      {
        q: '세로로 긴 스크린샷도 합칠 수 있나요?',
        a: '네. 세로 배치를 선택하면 가장 넓은 이미지에 너비를 맞춰 위에서 아래로 이어 붙입니다.',
      },
      {
        q: '이미지 순서를 바꿀 수 있나요?',
        a: '현재는 파일을 선택한 순서대로 합칩니다. 순서를 바꾸려면 “모두 지우기” 후 원하는 순서로 다시 선택하세요.',
      },
      {
        q: '투명 배경을 유지할 수 있나요?',
        a: 'PNG 또는 WebP를 선택하면 투명 배경이 유지됩니다. JPG 형식에는 투명 칸이 없어서 그 자리를 고른 배경색으로 칠합니다.',
      },
      {
        q: '화질이 떨어지나요?',
        a: '원본 픽셀을 사용해 합치며, 결과가 10,000px를 넘을 때만 비율을 유지해 축소합니다. JPG는 저장 시 재압축됩니다.',
      },
    ],
    sources: [
      {
        label: 'MDN — CanvasRenderingContext2D.drawImage',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage',
      },
      {
        label: 'MDN — createImageBitmap',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap',
      },
    ],
    related: ['image-split', 'image-crop', 'image-convert'],
  },
  {
    slug: 'image-split',
    category: 'image',
    icon: '✂️',
    title: {
      ko: '이미지 분할',
      en: 'Split Image',
      ja: '画像分割',
    },
    summary: {
      ko: '이미지를 격자로 잘라 여러 조각 ZIP으로 받습니다.',
      en: 'Split an image into grid tiles and download them as a ZIP.',
      ja: '画像をグリッドで分割し、ZIPでまとめて保存します。',
    },
    description: {
      ko: '한 장의 이미지를 원하는 행·열로 나눠 PNG 조각으로 저장합니다. 조각은 행·열 번호가 붙은 파일로 ZIP에 담기며 최대 25조각까지 지원합니다.',
      en: 'Split one image into a grid of PNG tiles with row and column names, packaged in a ZIP. Up to 25 tiles.',
      ja: '1枚の画像を行・列で分割し、番号付きPNGをZIPで保存します。最大25分割まで対応します。',
    },
    keywords: ['이미지 분할', '사진 자르기', '이미지 나누기', '격자 자르기', '타일 이미지'],
    updated: '2026-11-10',
    faq: [
      {
        q: '조각을 JPG로 받을 수 있나요?',
        a: '현재는 화질 손실이 없는 PNG로만 저장합니다. JPG가 필요하면 이미지 형식 변환 도구로 바꾸세요.',
      },
      {
        q: '조각 크기가 1px씩 다른 이유는?',
        a: '이미지 크기가 행·열로 나누어떨어지지 않을 때 픽셀 경계를 반올림하기 때문입니다. 빈틈이나 겹침은 생기지 않습니다.',
      },
      {
        q: '큰 이미지도 나눌 수 있나요?',
        a: '파일 50MB까지 지원합니다. 브라우저 메모리에 따라 매우 큰 이미지는 실패할 수 있으니 먼저 압축하세요.',
      },
      {
        q: 'GIF 애니메이션은 어떻게 되나요?',
        a: '첫 프레임만 이미지로 읽어 나눕니다. 움직이는 GIF는 조각으로 나눌 수 없습니다.',
      },
    ],
    sources: [
      {
        label: 'MDN — CanvasRenderingContext2D.drawImage',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage',
      },
      { label: 'JSZip (GitHub)', href: 'https://github.com/Stuk/jszip' },
    ],
    related: ['image-merge', 'image-crop', 'image-compress'],
  },
  {
    slug: 'image-info',
    category: 'image',
    icon: '🔍',
    title: {
      ko: '이미지 정보·EXIF 제거',
      en: 'Image Info & EXIF Remover',
      ja: '画像情報・EXIF削除',
    },
    summary: {
      ko: '사진의 촬영 정보·GPS를 확인하고 제거합니다.',
      en: 'Inspect photo metadata and GPS, then remove it.',
      ja: '写真の撮影情報・GPSを確認して削除します。',
    },
    description: {
      ko: '이미지의 해상도·형식·촬영 기기·촬영 시각·GPS 위치를 확인하고 EXIF 메타데이터를 제거해 새로 저장합니다. 위치 정보가 담긴 사진도 서버에 올리지 않습니다.',
      en: 'Inspect resolution, camera, capture time, and GPS coordinates, then strip EXIF metadata by re-saving the image. Nothing is uploaded.',
      ja: '解像度・撮影機器・撮影日時・GPS位置を確認し、EXIFを削除して保存します。',
    },
    keywords: ['이미지 정보', 'EXIF 제거', '사진 GPS 삭제', '촬영 정보 확인', '메타데이터 제거'],
    updated: '2026-11-10',
    faq: [
      {
        q: 'EXIF를 지우면 화질이 떨어지나요?',
        a: 'JPG는 새로 저장하면서 재압축되어 화질이 약간 달라질 수 있습니다. PNG는 무손실이지만 파일이 커질 수 있습니다.',
      },
      {
        q: 'GPS 위치도 지워지나요?',
        a: '네. 새 이미지에는 EXIF 자체가 포함되지 않으므로 촬영 위치·기기·시각이 모두 사라집니다.',
      },
      {
        q: '모든 메타데이터를 보여주나요?',
        a: '주요 촬영 정보만 보여줍니다. 제조사별 특수 태그는 표시되지 않을 수 있지만, 재저장 시 모두 제거됩니다.',
      },
      {
        q: 'PNG에도 EXIF가 있나요?',
        a: 'PNG는 EXIF보다 텍스트 청크에 정보를 저장하는 경우가 있습니다. 이 도구는 이미지를 다시 인코딩해 이런 부가 정보도 함께 제거합니다.',
      },
    ],
    sources: [
      { label: 'exifr (GitHub)', href: 'https://github.com/MikeKovarik/exifr' },
      {
        label: 'MDN — createImageBitmap',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/createImageBitmap',
      },
    ],
    related: ['image-mosaic', 'image-compress', 'image-rotate'],
  },
  {
    slug: 'image-filter',
    category: 'image',
    icon: '🎨',
    title: {
      ko: '이미지 필터',
      en: 'Image Filters',
      ja: '画像フィルター',
    },
    summary: {
      ko: '어두운 사진을 밝히고 색을 살리거나, 흑백·세피아·흐림 효과를 줍니다.',
      en: 'Adjust brightness, contrast, saturation, grayscale, sepia, and blur.',
      ja: '明るさ・コントラスト・彩度・白黒・セピア・ぼかしを調整します。',
    },
    description: {
      ko: '이미지의 밝기·대비·채도·흑백·세피아·블러를 슬라이더로 조정하고 원본 해상도로 저장합니다. 미리보기를 보며 보정하고 JPG·PNG·WebP로 내려받으세요.',
      en: 'Adjust brightness, contrast, saturation, grayscale, sepia, and blur with live preview. Export at original resolution to JPG, PNG, or WebP.',
      ja: '明るさ・コントラスト・彩度・白黒・セピア・ぼかしを調整し、元の解像度で保存します。',
    },
    keywords: ['이미지 필터', '사진 밝기 조절', '사진 흑백', '세피아 효과', '이미지 블러'],
    updated: '2026-11-10',
    faq: [
      {
        q: '필터를 나중에 되돌릴 수 있나요?',
        a: '저장된 이미지에는 필터가 적용되어 되돌릴 수 없습니다. 원본 파일을 반드시 보관하세요.',
      },
      {
        q: '어떤 필터가 있나요?',
        a: '밝기·대비·채도 조절과 흑백·세피아 톤, 흐림 효과가 있습니다. 슬라이더를 여러 개 함께 움직여 한 번에 저장할 수 있습니다.',
      },
      {
        q: '화질은 유지되나요?',
        a: '원본 해상도로 저장합니다. 다만 JPG·WebP는 재압축되므로 최고 화질이 필요하면 PNG를 선택하세요.',
      },
      {
        q: '모바일에서도 되나요?',
        a: '최신 모바일 브라우저에서 동작합니다. 매우 큰 이미지는 기기 메모리에 따라 처리 시간이 길어질 수 있습니다.',
      },
    ],
    sources: [
      {
        label: 'MDN — CanvasRenderingContext2D.filter',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/filter',
      },
      {
        label: 'MDN — CSS filter',
        href: 'https://developer.mozilla.org/en-US/docs/Web/CSS/filter',
      },
    ],
    related: ['image-info', 'image-rotate', 'image-compress'],
  },
  {
    slug: 'image-frame',
    category: 'image',
    icon: '🪟',
    title: {
      ko: '이미지 테두리·둥근 모서리',
      en: 'Image Frame & Rounded Corners',
      ja: '画像枠・角丸',
    },
    summary: {
      ko: '사진에 둥근 모서리·테두리·그림자를 넣습니다.',
      en: 'Add rounded corners, borders, padding, and shadows to images.',
      ja: '画像に角丸・枠線・影を追加します。',
    },
    description: {
      ko: '이미지 모서리를 둥글게 다듬고 테두리·바깥 여백·그림자를 넣어 카드처럼 꾸밉니다. 원본 해상도를 유지하고 PNG·JPG·WebP로 저장합니다.',
      en: 'Round image corners and add borders, padding, and shadows. Keep the original resolution and export to PNG, JPG, or WebP.',
      ja: '画像の角を丸くし、枠線・余白・影を追加してPNG・JPG・WebPで保存します。',
    },
    keywords: ['이미지 둥근 모서리', '사진 테두리', '이미지 액자', '사진 그림자', '썸네일 꾸미기'],
    updated: '2026-11-10',
    faq: [
      {
        q: '투명 배경으로 저장할 수 있나요?',
        a: '네. PNG·WebP를 선택하고 “투명 배경”을 켜면 바깥 여백이 투명하게 저장됩니다.',
      },
      {
        q: '결과 크기가 원본과 다른 이유는?',
        a: '바깥 여백만큼 양쪽으로 늘어나기 때문입니다. 여백 24px이면 가로·세로가 각각 48px 늘어납니다.',
      },
      {
        q: '모서리 반경은 어떤 기준인가요?',
        a: '픽셀 단위입니다. 원본 해상도 기준으로 적용되며, 미리보기는 축소해서 보여줍니다.',
      },
      {
        q: 'JPG로 저장하면 배경이 검게 나와요.',
        a: 'JPG 형식에는 투명 칸이 없어서 그 자리를 배경색으로 칠합니다. “투명 배경”을 끄고 원하는 배경색을 지정하세요.',
      },
    ],
    sources: [
      {
        label: 'MDN — CanvasRenderingContext2D.clip',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/clip',
      },
      {
        label: 'MDN — shadowBlur',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/shadowBlur',
      },
    ],
    related: ['image-merge', 'image-crop', 'image-filter'],
  },
  {
    slug: 'image-collage',
    category: 'image',
    icon: '🖼️',
    title: {
      ko: '이미지 콜라주',
      en: 'Image Collage',
      ja: '画像コラージュ',
    },
    summary: {
      ko: '여러 사진을 비율에 맞춰 빈틈없이 배치합니다.',
      en: 'Arrange multiple photos into a polished collage.',
      ja: '複数の写真を比率に合わせて配置します。',
    },
    description: {
      ko: '2~9장의 이미지를 1:1·4:5·16:9 등 비율에 맞춰 콜라주로 만듭니다. 저스트파이드·격자·스트립 배치, 간격·여백·모서리·배경색을 조절하고 PNG·JPG·WebP로 저장합니다.',
      en: 'Create collages from 2–9 images in 1:1, 4:5, 16:9, and more. Justified, grid, and strip layouts with gaps, margins, corners, and background controls.',
      ja: '2〜9枚の画像を1:1・4:5・16:9などの比率でコラージュにします。',
    },
    keywords: ['이미지 콜라주', '사진 콜라주', '인스타 콜라주', '썸네일 만들기', '사진 배치'],
    updated: '2026-11-10',
    faq: [
      {
        q: '저스트파이드가 무엇인가요?',
        a: '이미지 비율에 따라 행 높이와 칸 너비를 계산해 사진을 빈틈없이 채우는 배치입니다. 단순 격자보다 사진이 자연스럽게 이어집니다.',
      },
      {
        q: '사진이 잘리는 게 싫어요.',
        a: '“이미지 맞춤”을 “맞추기”로 바꾸면 사진 전체가 보이고 빈 공간은 배경색으로 채워집니다.',
      },
      {
        q: '순서를 바꿀 수 있나요?',
        a: '네. 이미지 목록의 ↑·↓ 버튼으로 순서를 바꾸면 콜라주에 바로 반영됩니다.',
      },
      {
        q: '출력 크기를 바꿀 수 있나요?',
        a: '비율 프리셋마다 고정 해상도를 사용합니다. 1:1은 1080×1080, 4:5는 1080×1350, 16:9는 1920×1080입니다.',
      },
    ],
    sources: [
      {
        label: 'MDN — CanvasRenderingContext2D.drawImage',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage',
      },
      {
        label: 'MDN — CanvasRenderingContext2D.clip',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/clip',
      },
    ],
    related: ['image-merge', 'image-frame', 'image-crop'],
  },
  {
    slug: 'image-rotate',
    category: 'image',
    icon: '🔃',
    title: {
      ko: '이미지 회전·뒤집기',
      en: 'Rotate & Flip Image',
      ja: '画像の回転・反転',
    },
    summary: {
      ko: '눕거나 거꾸로 찍힌 사진을 90°씩 돌리고, 거울처럼 좌우·상하 반전합니다.',
      en: 'Rotate images by 90° or flip them horizontally and vertically.',
      ja: '画像を90°回転、または左右・上下に反転します。',
    },
    description: {
      ko: '이미지를 90° 단위로 회전하거나 좌우·상하로 뒤집어 저장합니다. 원본 해상도를 유지하고 JPG·PNG·WebP로 내려받으며 사진은 서버로 전송되지 않습니다.',
      en: 'Rotate images in 90° steps or flip them horizontally and vertically. Keep the original resolution and export to JPG, PNG, or WebP.',
      ja: '画像を90°単位で回転・反転し、元の解像度のままJPG・PNG・WebPで保存できます。',
    },
    keywords: ['이미지 회전', '사진 돌리기', '이미지 뒤집기', '사진 반전', '사진 방향'],
    updated: '2026-11-10',
    faq: [
      {
        q: '원본 화질이 떨어지나요?',
        a: '회전은 원본 픽셀을 다시 배치하는 것이라 해상도가 유지됩니다. 다만 JPG로 저장하면 재압축이 일어나므로, 최고 화질이 필요하면 PNG를 선택하세요.',
      },
      {
        q: '미세하게 기울어진 사진도 바로잡을 수 있나요?',
        a: '이 도구는 90° 단위 회전만 지원합니다. 1° 단위 미세 보정은 지원하지 않습니다.',
      },
      {
        q: '여러 장을 한 번에 돌릴 수 있나요?',
        a: '현재는 한 번에 한 장씩 처리합니다. 여러 장은 순서대로 저장하세요.',
      },
      {
        q: 'GIF 애니메이션도 유지되나요?',
        a: '아니요. GIF는 첫 프레임만 이미지로 읽어 처리하므로 애니메이션이 사라집니다.',
      },
    ],
    sources: [
      {
        label: 'MDN — CanvasRenderingContext2D.rotate',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/rotate',
      },
      {
        label: 'MDN — drawImage',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage',
      },
    ],
    related: ['image-crop', 'image-compress', 'image-convert'],
  },
  {
    slug: 'pdf-viewer',
    category: 'document',
    icon: '📖',
    title: {
      ko: 'PDF 뷰어',
      en: 'PDF Viewer',
    },
    summary: {
      ko: '프로그램 설치 없이 PDF를 열어 쪽을 넘기고 확대해 봅니다.',
      en: 'Open a PDF and page through or zoom without installing anything.',
    },
    description: {
      ko: 'PDF 파일을 브라우저에서 바로 열어 쪽 이동·확대·폭 맞춤으로 확인합니다. 긴 문서도 보이는 쪽만 그려 빠르게 열리고, 파일은 서버로 전송되지 않습니다.',
      en: 'Open PDF files right in your browser with page navigation, zoom, and fit-to-width. Long documents open fast because only visible pages are drawn, and nothing is uploaded.',
    },
    keywords: ['PDF 뷰어', 'PDF 열기', 'PDF 보기', 'PDF 리더', '설치 없이 PDF'],
    updated: '2026-11-11',
    faq: [
      {
        q: '어떤 PDF까지 열 수 있나요?',
        a: '일반 문서와 스캔본 모두 열립니다. 2,000쪽까지 열 수 있고, 화면에 보이는 쪽부터 그리므로 긴 문서도 처음이 빠릅니다. 암호가 걸린 PDF는 열 수 없습니다.',
      },
      {
        q: '글자를 복사할 수 있나요?',
        a: '이 뷰어는 보기 전용이라 글자 선택은 지원하지 않습니다. 텍스트가 필요하면 PDF 텍스트 추출 도구를 쓰세요.',
      },
      {
        q: '휴대폰에서도 되나요?',
        a: '됩니다. 처음 열 때 화면 폭에 맞춰 보여 주고, 확대 버튼으로 크게 볼 수 있습니다.',
      },
    ],
    sources: [
      {
        label: 'Mozilla pdf.js',
        href: 'https://mozilla.github.io/pdf.js/',
      },
      {
        label: 'MDN — Intersection Observer API',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API',
      },
    ],
    related: ['pdf-text', 'pdf-to-jpg', 'pdf-organize'],
  },
  {
    slug: 'image-resize',
    category: 'image',
    icon: '📐',
    title: {
      ko: '이미지 크기 조절',
      en: 'Resize Image',
    },
    summary: {
      ko: '사진을 원하는 가로·세로 픽셀이나 비율로 줄이고 키웁니다.',
      en: 'Resize photos by width, height, both, or a percentage.',
    },
    description: {
      ko: '이미지를 가로·세로 픽셀 또는 비율(%)로 줄이거나 키웁니다. 비율을 유지한 채 상자 안에 맞추거나 정확한 크기로 맞출 수 있고, 여러 장도 한 번에 처리하며 서버로 보내지 않습니다.',
      en: 'Resize images by pixel width, height, both, or percentage. Keep the aspect ratio or force an exact size, process up to 20 files at once, and never upload anything.',
    },
    keywords: [
      '이미지 크기 조절',
      '사진 크기 줄이기',
      '이미지 리사이즈',
      '픽셀 변경',
      '사진 해상도 줄이기',
      'resize',
    ],
    updated: '2026-11-11',
    faq: [
      {
        q: '가로만 정하면 세로는 어떻게 되나요?',
        a: '원본 비율대로 자동으로 정해집니다. 예를 들어 4000×3000 사진의 가로를 1200px로 하면 세로는 900px이 됩니다.',
      },
      {
        q: '가로·세로를 둘 다 정하면 사진이 찌그러지나요?',
        a: '"비율 유지"를 켜 두면 정한 상자 안에 맞춰 찌그러지지 않습니다. 끄면 적은 크기 그대로 늘리거나 줄이므로 비율이 바뀔 수 있습니다.',
      },
      {
        q: '크게 키우면 선명해지나요?',
        a: '픽셀 수만 늘어나고 없던 디테일이 생기지는 않습니다. 원본보다 크게 키우면 조금 흐려 보일 수 있습니다.',
      },
      {
        q: '용량도 줄어드나요?',
        a: '픽셀 수가 줄어드는 만큼 대부분 함께 줄어듭니다. 용량을 더 줄이려면 저장 형식을 JPG나 WebP로 고르고 화질을 낮추세요.',
      },
    ],
    sources: [
      {
        label: 'MDN — CanvasRenderingContext2D.drawImage',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/drawImage',
      },
      {
        label: 'MDN — imageSmoothingQuality',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/imageSmoothingQuality',
      },
    ],
    related: ['image-compress', 'image-crop', 'image-convert'],
  },
  {
    slug: 'sheet-viewer',
    category: 'document',
    icon: '📊',
    title: {
      ko: 'CSV·XLS·XLSX 뷰어',
      en: 'CSV, XLS & XLSX Viewer',
      ja: 'CSV・XLS・XLSX ビューア',
    },
    summary: {
      ko: '엑셀 없이 표를 열고 시트를 확인합니다.',
      en: 'Open spreadsheets and switch sheets without Excel.',
      ja: 'Excelなしで表を開き、シートを確認します。',
    },
    description: {
      ko: 'CSV·XLSX·XLS·ODS 파일을 브라우저에서 열어 표로 확인합니다. 시트 전환, 페이지 이동, CSV·JSON 내보내기를 지원하며 파일은 서버로 전송되지 않습니다.',
      en: 'Open CSV, XLSX, XLS, and ODS files in your browser. Switch sheets, page through rows, and export CSV or JSON. Nothing is uploaded.',
      ja: 'CSV・XLSX・XLS・ODSをブラウザで開いて表として確認。シート切替、ページ移動、CSV・JSON出力に対応し、ファイルは送信されません。',
    },
    keywords: ['엑셀 뷰어', 'CSV 뷰어', 'XLS 열기', 'XLSX 열기', '엑셀 없이 보기', 'CSV 인코딩'],
    updated: '2026-11-10',
    faq: [
      {
        q: '수식이 계산된 값으로 보이나요?',
        a: '파일에 저장된 마지막 계산 결과를 보여줍니다. 수식을 다시 계산하지는 않으므로, 파일을 연 뒤 값을 바꿨다면 엑셀에서 다시 계산해야 합니다.',
      },
      {
        q: '시트가 여러 개면 어떻게 보나요?',
        a: '파일을 열면 시트 탭이 표시됩니다. 탭을 누르면 해당 시트로 전환되고, 페이지는 첫 페이지로 돌아갑니다.',
      },
      {
        q: 'CSV 한글이 깨집니다.',
        a: 'CSV 인코딩을 EUC-KR로 바꿔 다시 열어 보세요. 자동 모드는 UTF-8을 먼저 시도하고 실패하면 EUC-KR로 읽습니다. 그래도 깨지면 원본 프로그램에서 UTF-8로 저장하는 것이 좋습니다.',
      },
      {
        q: '큰 파일도 열리나요?',
        a: '현재 페이지만 셀 단위로 읽어 메모리를 아끼지만, 50MB를 넘거나 수십만 행이면 브라우저가 느려질 수 있습니다. 이 경우 CSV로 나눠서 확인하세요.',
      },
    ],
    sources: [
      { label: 'SheetJS 문서', href: 'https://docs.sheetjs.com/' },
      {
        label: 'MDN — TextDecoder',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder',
      },
    ],
    related: ['text-counter', 'image-ocr', 'pdf-to-jpg'],
  },
  {
    slug: 'docx-viewer',
    category: 'document',
    icon: '📝',
    title: {
      ko: 'DOC·DOCX 뷰어',
      en: 'DOC & DOCX Viewer',
      ja: 'DOC・DOCX ビューア',
    },
    summary: {
      ko: '워드 없이 DOC·DOCX 내용을 확인합니다.',
      en: 'Read DOC and DOCX documents without Microsoft Word.',
      ja: 'WordなしでDOC・DOCXの内容を確認します。',
    },
    description: {
      ko: 'Word DOCX 문서를 브라우저에서 열어 본문·표·이미지를 확인합니다. 구형 .doc은 텍스트·표 중심으로 변환해 보여 주며, 텍스트 복사·저장·인쇄를 지원하고 파일은 서버로 전송되지 않습니다.',
      en: 'Open Word DOCX files in your browser to read text, tables, and images. Legacy .doc files are previewed as text and tables. Copy, save as text, or print; nothing is uploaded.',
      ja: 'WordのDOCXをブラウザで開き、本文・表・画像を確認。旧形式の.docはテキスト・表中心に変換して表示し、テキストのコピー・保存・印刷に対応します。',
    },
    keywords: [
      'DOC 뷰어',
      'DOCX 뷰어',
      '워드 없이 열기',
      'docx 미리보기',
      '워드 문서 보기',
      'doc 텍스트 추출',
    ],
    updated: '2026-11-10',
    faq: [
      {
        q: '구형 .doc 파일도 열리나요?',
        a: '네. .doc 파일은 브라우저에서 텍스트·표 중심의 미리보기로 변환해 보여 줍니다. 서식·이미지·정확한 레이아웃은 일부 빠질 수 있으며, 원본과 똑같이 보려면 Word에서 .docx로 저장하세요.',
      },
      {
        q: '서식이 원본과 똑같이 보이나요?',
        a: '제목·본문·목록·표·이미지는 대부분 재현되지만, 머리글·바닥글·각주·다단·텍스트 상자는 단순화되거나 빠질 수 있습니다. 인쇄 결과가 원본과 완전히 같지는 않습니다.',
      },
      {
        q: '매크로나 스크립트가 실행되나요?',
        a: '아니요. 매크로(.docm)는 지원하지 않고, 변환된 HTML은 DOMPurify로 정리해 스크립트·iframe·폼을 제거한 뒤 표시합니다.',
      },
      {
        q: '텍스트만 따로 저장할 수 있나요?',
        a: '네. “텍스트 저장”을 누르면 본문 텍스트를 TXT로 내려받습니다. 서식과 이미지는 포함되지 않습니다.',
      },
    ],
    sources: [
      { label: 'mammoth.js (GitHub)', href: 'https://github.com/mwilliamson/mammoth.js' },
      {
        label: '@mdgate/doc — legacy DOC → Markdown',
        href: 'https://github.com/mdgate/converters',
      },
      { label: 'DOMPurify (GitHub)', href: 'https://github.com/cure53/DOMPurify' },
    ],
    related: ['sheet-viewer', 'pdf-to-jpg', 'image-ocr'],
  },
  {
    slug: 'pptx-viewer',
    category: 'document',
    icon: '📽️',
    title: {
      ko: 'PPT·PPTX 뷰어',
      en: 'PPT & PPTX Viewer',
      ja: 'PPT・PPTXビューア',
    },
    summary: {
      ko: '파워포인트 발표 자료를 설치 없이 슬라이드로 봅니다.',
      en: 'View PowerPoint presentations slide by slide in your browser.',
      ja: 'PowerPointプレゼンをインストールなしでスライド表示します。',
    },
    description: {
      ko: 'PPT·PPTX 파일을 브라우저에서 열어 슬라이드·텍스트·이미지·표·차트를 미리 봅니다. 설치 없이 확대·이동할 수 있고 파일은 서버로 전송되지 않습니다. 일부 애니메이션·3D·글꼴은 원본과 다를 수 있습니다.',
      en: 'Open PPT and PPTX files in your browser to preview slides, text, images, tables, and charts. Zoom and navigate without installing anything; files are never uploaded. Some animations, 3D, and fonts may differ.',
      ja: 'PPT・PPTXファイルをブラウザで開き、スライド・テキスト・画像・表・グラフをプレビューします。インストール不要で拡大・移動でき、ファイルは送信されません。',
    },
    keywords: [
      'PPT 뷰어',
      'PPTX 뷰어',
      '파워포인트 뷰어',
      'PPT 열기',
      'pptx 미리보기',
      '발표자료 보기',
    ],
    updated: '2026-11-12',
    faq: [
      {
        q: '파워포인트 없이 열 수 있나요?',
        a: '네. PPTX 파일을 브라우저에서 직접 읽어 슬라이드로 그립니다. PowerPoint나 Office 설치가 필요 없고 파일은 서버로 전송되지 않습니다.',
      },
      {
        q: '원본과 레이아웃이 조금 달라 보여요.',
        a: '브라우저에 없는 글꼴은 시스템 글꼴로 대체되고, 3D·복잡한 SmartArt·일부 차트는 단순화됩니다. 애니메이션과 전환 효과는 재생하지 않습니다. 내용 확인용 미리보기로 사용하세요.',
      },
      {
        q: '발표 자료를 수정할 수 있나요?',
        a: '아니요. 이 도구는 보기 전용입니다. 슬라이드 수정·저장은 PowerPoint나 다른 편집기에서 하세요.',
      },
      {
        q: '큰 파일이나 구형 .ppt도 되나요?',
        a: '50MB 이하 파일을 권장합니다. 구형 .ppt(97-2003)는 브라우저에서 화면용 이미지로 변환해 표시합니다. 암호가 걸린 파일은 열 수 없으므로 먼저 암호를 해제해야 합니다.',
      },
    ],
    sources: [
      {
        label: '@aiden0z/pptx-renderer (GitHub)',
        href: 'https://github.com/aiden0z/pptx-renderer',
      },
      {
        label: 'ECMA-376 — Office Open XML',
        href: 'https://ecma-international.org/publications-and-standards/standards/ecma-376/',
      },
    ],
    related: ['docx-viewer', 'pdf-viewer', 'sheet-viewer'],
  },
  {
    slug: 'hwpx-viewer',
    category: 'document',
    icon: '📝',
    title: {
      ko: 'HWP·HWPX 뷰어',
      en: 'HWP & HWPX Viewer',
      ja: 'HWP・HWPXビューア',
    },
    summary: {
      ko: '한글 문서(HWP·HWPX)를 설치 없이 A4 페이지로 확인합니다.',
      en: 'Read HWP and HWPX documents as A4 pages without installing Hangul.',
      ja: 'HWP・HWPX文書をインストールなしでA4ページとして表示します。',
    },
    description: {
      ko: '한글 문서(HWP·HWPX)를 브라우저에서 A4 페이지로 미리 봅니다. HWP는 HWPX로 자동 변환해 모든 페이지를 표시하고, 한 쪽/두 쪽 보기와 페이지 이동, HWPX 저장을 지원합니다. 파일은 서버로 전송되지 않습니다.',
      en: 'Preview HWP and HWPX documents as A4 pages in your browser. HWP files are converted to HWPX automatically; view all pages, switch between one- and two-page layouts, and save HWPX. Nothing is uploaded.',
      ja: 'HWP・HWPX文書をブラウザでA4ページとしてプレビューします。HWPはHWPXに自動変換して全ページを表示し、1ページ/見開き表示・ページ移動・HWPX保存に対応します。',
    },
    keywords: ['HWP 뷰어', 'HWPX 뷰어', '한글 문서 열기', 'hwpx 미리보기', '한글 파일 보기', 'HWP'],
    updated: '2026-11-12',
    faq: [
      {
        q: '구형 .hwp 파일도 열 수 있나요?',
        a: '네. .hwp 파일을 넣으면 브라우저에서 HWPX로 자동 변환해 표시합니다. 변환은 파일을 서버로 보내지 않고 이 브라우저 안에서만 이루어집니다. 오래된 HWP3 문서나 암호가 걸린 파일은 변환되지 않을 수 있습니다.',
      },
      {
        q: '원본과 똑같이 보이나요?',
        a: '한글 문서를 A4 페이지로 그려 원본과 매우 가깝게 보여 줍니다. 다만 설치되지 않은 글꼴은 대체되고, 3D·일부 특수 개체는 단순화될 수 있습니다. 인쇄용 최종 확인은 한글에서 하는 것이 좋습니다.',
      },
      {
        q: '표와 이미지도 보이나요?',
        a: '네. 표의 행·열·병합된 셀과 셀 안의 문단을 표시하고, 문서에 포함된 PNG·JPG 이미지를 보여 줍니다. 도형 안의 글상자는 일부만 표시될 수 있습니다.',
      },
      {
        q: '문서를 수정할 수 있나요?',
        a: '아니요. 보기 전용입니다. 수정·저장은 한글에서 하세요. 원본 파일은 변경되지 않으며 미리보기 사본도 저장하지 않습니다.',
      },
    ],
    sources: [
      { label: '한컴 — 한글 문서 형식', href: 'https://www.hancom.com/' },
      { label: 'rhwp — HWP/HWPX 오픈소스 (MIT)', href: 'https://github.com/rhwp/rhwp' },
    ],
    related: ['docx-viewer', 'pdf-viewer', 'sheet-viewer', 'hwpx-to-pdf'],
  },
  {
    slug: 'hwpx-to-pdf',
    category: 'document',
    icon: '📄',
    title: {
      ko: 'HWP·HWPX → PDF',
      en: 'HWP & HWPX to PDF',
      ja: 'HWP・HWPX → PDF',
    },
    summary: {
      ko: '한글 문서를 원본과 가까운 A4 PDF로 저장합니다.',
      en: 'Save HWP and HWPX documents as A4 PDFs.',
      ja: 'HWP・HWPX文書をA4 PDFとして保存します。',
    },
    description: {
      ko: '한글(HWP·HWPX) 문서를 브라우저에서 A4 PDF로 변환합니다. 모든 페이지를 원본과 가깝게 그리고, 파일은 서버로 전송하지 않습니다. 결과 PDF는 이미지로 만들어져 글자 선택·검색은 되지 않습니다.',
      en: 'Convert HWP and HWPX documents to A4 PDF in your browser. Every page is rendered close to the original and nothing is uploaded. The resulting PDF is image-based, so text is not selectable.',
      ja: 'HWP・HWPX文書をブラウザでA4 PDFに変換します。全ページを原本に近い形で描画し、ファイルは送信されません。結果は画像ベースのPDFのため文字選択はできません。',
    },
    keywords: [
      'HWP PDF 변환',
      'HWPX PDF',
      '한글 PDF 저장',
      'hwp pdf로',
      '한글 문서 pdf',
      'hwpx pdf 변환',
    ],
    updated: '2026-11-12',
    faq: [
      {
        q: '글자를 선택하거나 검색할 수 있나요?',
        a: '아니요. 원본 화면을 고해상도 이미지로 그려 PDF에 넣기 때문에 글자 선택·검색은 되지 않습니다. 인쇄·제출·보관용으로 사용하세요.',
      },
      {
        q: '원본과 똑같이 나오나요?',
        a: 'A4 페이지를 원본과 가깝게 그립니다. 다만 설치되지 않은 글꼴은 대체되고 3D·일부 특수 개체는 단순화될 수 있습니다. 최종 인쇄는 한글에서 확인하는 것이 가장 정확합니다.',
      },
      {
        q: '구형 .hwp도 변환되나요?',
        a: '네. .hwp는 브라우저에서 HWPX로 변환한 뒤 PDF로 그립니다. 오래된 HWP3 문서나 암호가 걸린 문서는 변환되지 않을 수 있습니다.',
      },
      {
        q: '페이지가 많으면 어떻게 되나요?',
        a: '모든 페이지를 차례로 그리므로 페이지가 많을수록 시간과 메모리가 더 필요합니다. 50MB 이하 파일을 권장하며, 아주 큰 문서는 나눠서 변환하세요.',
      },
    ],
    sources: [
      { label: 'rhwp — HWP/HWPX 오픈소스 (MIT)', href: 'https://github.com/rhwp/rhwp' },
      { label: 'pdf-lib (GitHub)', href: 'https://github.com/Hopding/pdf-lib' },
    ],
    related: ['hwpx-viewer', 'docx-to-pdf', 'pptx-to-pdf', 'csv-pdf'],
  },
  {
    slug: 'docx-to-pdf',
    category: 'document',
    icon: '📄',
    title: {
      ko: 'DOC·DOCX → PDF',
      en: 'DOC & DOCX to PDF',
      ja: 'DOC・DOCX → PDF',
    },
    summary: {
      ko: '워드 문서를 A4 PDF로 저장합니다.',
      en: 'Save Word documents as A4 PDFs.',
      ja: 'Word文書をA4 PDFとして保存します。',
    },
    description: {
      ko: 'Word(DOC·DOCX) 문서를 브라우저에서 A4 PDF로 변환합니다. 본문·표·이미지를 페이지로 나누고, 파일은 서버로 전송하지 않습니다. 결과 PDF는 이미지로 만들어져 글자 선택·검색은 되지 않습니다.',
      en: 'Convert Word DOC and DOCX files to A4 PDF in your browser. Text, tables, and images are paginated without uploading anything. The resulting PDF is image-based, so text is not selectable.',
      ja: 'Word（DOC・DOCX）文書をブラウザでA4 PDFに変換します。本文・表・画像をページ分割し、ファイルは送信されません。結果は画像ベースのPDFのため文字選択はできません。',
    },
    keywords: [
      'DOC PDF 변환',
      'DOCX PDF',
      '워드 PDF 저장',
      'docx pdf로',
      '워드 문서 pdf',
      'doc pdf 변환',
    ],
    updated: '2026-11-12',
    faq: [
      {
        q: '서식이 원본과 똑같이 나오나요?',
        a: '제목·본문·목록·표·이미지는 대부분 재현되지만 머리글·바닥글·각주·다단·텍스트 상자는 단순화되거나 빠질 수 있습니다. 최종 인쇄는 Word에서 확인하는 것이 가장 정확합니다.',
      },
      {
        q: '글자를 선택할 수 있나요?',
        a: '아니요. 페이지를 이미지로 그려 PDF에 넣기 때문에 글자 선택·검색은 되지 않습니다. 내용 확인·인쇄·제출용으로 사용하세요.',
      },
      {
        q: '구형 .doc도 변환되나요?',
        a: '네. .doc은 텍스트·표 중심으로 변환한 뒤 PDF로 만듭니다. 서식·이미지가 일부 빠질 수 있으므로 원본과 가까운 결과가 필요하면 Word에서 .docx로 저장하세요.',
      },
      {
        q: '암호가 걸린 문서도 되나요?',
        a: '아니요. 암호로 보호된 DOC·DOCX는 열 수 없습니다. 먼저 암호를 해제한 뒤 사용하세요.',
      },
    ],
    sources: [
      { label: 'mammoth.js (GitHub)', href: 'https://github.com/mwilliamson/mammoth.js' },
      {
        label: '@mdgate/doc — legacy DOC → Markdown',
        href: 'https://github.com/mdgate/converters',
      },
      { label: 'pdf-lib (GitHub)', href: 'https://github.com/Hopding/pdf-lib' },
    ],
    related: ['docx-viewer', 'hwpx-to-pdf', 'pptx-to-pdf', 'csv-pdf'],
  },
  {
    slug: 'pptx-to-pdf',
    category: 'document',
    icon: '📽️',
    title: {
      ko: 'PPT·PPTX → PDF',
      en: 'PPT & PPTX to PDF',
      ja: 'PPT・PPTX → PDF',
    },
    summary: {
      ko: '발표 자료를 슬라이드 그대로 PDF로 저장합니다.',
      en: 'Save PowerPoint presentations as PDFs.',
      ja: 'PowerPointプレゼンをスライドのままPDFに保存します。',
    },
    description: {
      ko: 'PowerPoint(PPT·PPTX) 슬라이드를 브라우저에서 PDF로 변환합니다. 텍스트·이미지·표·차트를 슬라이드 비율 그대로 담고, 파일은 서버로 전송하지 않습니다. 결과 PDF는 이미지로 만들어져 글자 선택·검색은 되지 않습니다.',
      en: 'Convert PowerPoint PPT and PPTX slides to PDF in your browser. Text, images, tables, and charts keep the slide aspect ratio, and nothing is uploaded. The resulting PDF is image-based, so text is not selectable.',
      ja: 'PowerPoint（PPT・PPTX）のスライドをブラウザでPDFに変換します。テキスト・画像・表・グラフをスライド比率のまま保存し、ファイルは送信されません。結果は画像ベースのPDFのため文字選択はできません。',
    },
    keywords: [
      'PPT PDF 변환',
      'PPTX PDF',
      '파워포인트 PDF 저장',
      'pptx pdf로',
      '발표자료 pdf',
      'ppt pdf 변환',
    ],
    updated: '2026-11-12',
    faq: [
      {
        q: '슬라이드가 원본과 똑같이 나오나요?',
        a: '텍스트·이미지·표·차트는 슬라이드 비율 그대로 그립니다. 다만 브라우저에 없는 글꼴은 대체되고, 3D·복잡한 SmartArt·일부 애니메이션은 단순화되거나 빠질 수 있습니다.',
      },
      {
        q: '글자를 선택할 수 있나요?',
        a: '아니요. 슬라이드를 이미지로 그려 PDF에 넣기 때문에 글자 선택·검색은 되지 않습니다. 발표 자료 배포·인쇄용으로 사용하세요.',
      },
      {
        q: '구형 .ppt도 변환되나요?',
        a: '네. PPT 97-2003(.ppt)은 브라우저에서 화면용 이미지로 변환한 뒤 PDF로 만듭니다. 일부 도형·글꼴은 원본과 다를 수 있습니다.',
      },
      {
        q: '발표자 노트도 들어가나요?',
        a: '아니요. 슬라이드 화면만 PDF로 만듭니다. 발표자 노트는 포함되지 않습니다.',
      },
    ],
    sources: [
      {
        label: '@aiden0z/pptx-renderer (GitHub)',
        href: 'https://github.com/aiden0z/pptx-renderer',
      },
      { label: '@web-ppt/core (GitHub)', href: 'https://github.com/web-ppt/core' },
      { label: 'pdf-lib (GitHub)', href: 'https://github.com/Hopding/pdf-lib' },
    ],
    related: ['pptx-viewer', 'docx-to-pdf', 'hwpx-to-pdf', 'csv-pdf'],
  },
  {
    slug: 'pdf-ocr',
    category: 'document',
    icon: '🔎',
    title: {
      ko: 'PDF OCR',
      en: 'PDF OCR',
      ja: 'PDF OCR',
    },
    summary: {
      ko: '글자를 고를 수 없는 스캔 PDF를 쪽마다 읽어 텍스트로 바꿉니다.',
      en: 'Extract text from scanned PDF pages.',
      ja: 'スキャンPDFからページごとのテキストを抽出します。',
    },
    description: {
      ko: '스캔한 PDF의 페이지를 이미지로 바꾼 뒤 글자를 인식해 텍스트로 추출합니다. 페이지 범위·해상도·언어를 선택하고 하나의 TXT로 저장하세요. 파일은 서버로 전송되지 않습니다.',
      en: 'Render scanned PDF pages and OCR them into a single text file. Choose range, DPI, and language. Nothing is uploaded.',
      ja: 'スキャンPDFをページ画像にしてOCRし、1つのテキストにまとめます。範囲・解像度・言語を選択でき、ファイルは送信されません。',
    },
    keywords: ['PDF OCR', '스캔 PDF 텍스트', 'PDF 글자 추출', '이미지 PDF OCR', 'PDF 텍스트 변환'],
    updated: '2026-11-10',
    faq: [
      {
        q: '몇 페이지까지 한 번에 처리할 수 있나요?',
        a: '한 번에 최대 20쪽까지 처리합니다. 페이지당 5~20초가 걸리므로, 많은 문서는 범위를 나눠 실행하는 편이 안전합니다.',
      },
      {
        q: '텍스트가 이미 있는 PDF도 OCR하나요?',
        a: '가능하지만 권장하지 않습니다. 파일을 열면 글자 정보 감지 안내가 표시됩니다. 텍스트가 있는 PDF는 복사하는 편이 더 정확하고 빠릅니다.',
      },
      {
        q: '첫 실행이 왜 느린가요?',
        a: 'PDF를 이미지로 바꾸는 기능과 OCR 엔진·언어 데이터를 내려받기 때문입니다. OCR 데이터는 약 7~12MB이며, 한 번 받으면 브라우저에 캐시됩니다.',
      },
      {
        q: '표나 도장이 많은 문서도 인식되나요?',
        a: '표는 줄 순서가 섞일 수 있고, 도장·서명은 텍스트로 인식되지 않습니다. 금액·날짜 같은 핵심 값은 결과를 반드시 검토하세요.',
      },
    ],
    sources: [
      { label: 'tesseract.js (GitHub)', href: 'https://github.com/naptha/tesseract.js' },
      { label: 'pdf.js (GitHub)', href: 'https://github.com/mozilla/pdf.js' },
    ],
    related: ['image-ocr', 'pdf-to-jpg', 'docx-viewer'],
  },
  {
    slug: 'csv-json',
    category: 'document',
    icon: '🔄',
    title: {
      ko: 'CSV ↔ JSON 변환',
      en: 'CSV ↔ JSON Converter',
      ja: 'CSV ↔ JSON 変換',
    },
    summary: {
      ko: '표 데이터를 JSON으로, JSON을 CSV로 바꿉니다.',
      en: 'Convert tabular data between CSV and JSON.',
      ja: '表データをJSONに、JSONをCSVに変換します。',
    },
    description: {
      ko: 'CSV를 JSON 배열로, JSON 객체 배열을 CSV로 변환합니다. 헤더·구분자·인코딩·중첩 객체 평탄화를 지원하며 파일은 서버로 전송되지 않습니다.',
      en: 'Convert CSV to JSON arrays and JSON object arrays to CSV. Header, delimiter, encoding, and nested-object flattening supported. Nothing is uploaded.',
      ja: 'CSVをJSON配列に、JSONオブジェクト配列をCSVに変換。ヘッダー・区切り文字・文字コード・ネスト平坦化に対応し、ファイルは送信されません。',
    },
    keywords: ['CSV JSON 변환', 'CSV to JSON', 'JSON to CSV', 'CSV 변환기', 'JSON 배열 변환'],
    updated: '2026-11-10',
    faq: [
      {
        q: '숫자가 문자열로 나옵니다.',
        a: '기본값은 원본 CSV 값을 그대로 문자열로 유지합니다. “숫자·불리언 자동 변환”을 켜면 1200000 → 1200000, true → true로 바뀝니다. 00123 같은 코드는 문자열로 유지합니다.',
      },
      {
        q: '중첩된 JSON도 CSV로 만들 수 있나요?',
        a: '네. “중첩 객체 평탄화”를 켜면 { user: { name } }이 user.name 열로 바뀝니다. 배열은 JSON 문자열로 저장됩니다.',
      },
      {
        q: '헤더가 중복되면 어떻게 되나요?',
        a: '이름_2, 이름_3처럼 자동으로 번호를 붙입니다. 빈 헤더는 열1, 열2로 채웁니다.',
      },
      {
        q: 'CSV 한글이 깨집니다.',
        a: 'CSV 인코딩을 EUC-KR로 바꿔 파일을 다시 열어 보세요. 자동 모드는 UTF-8을 먼저 시도하고 실패하면 EUC-KR로 읽습니다.',
      },
    ],
    sources: [
      { label: 'SheetJS 문서', href: 'https://docs.sheetjs.com/' },
      {
        label: 'MDN — JSON.parse',
        href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse',
      },
    ],
    related: ['sheet-viewer', 'text-counter', 'docx-viewer'],
  },
  {
    slug: 'csv-clean',
    category: 'document',
    icon: '🧹',
    title: {
      ko: 'CSV 정리',
      en: 'CSV Cleanup',
      ja: 'CSV整理',
    },
    summary: {
      ko: 'CSV의 중복·빈 행·공백을 정리하고 정렬·필터합니다.',
      en: 'Remove duplicates, empty rows, and extra spaces; sort and filter CSV data.',
      ja: 'CSVの重複・空行・空白を整理し、並べ替え・フィルターを行います。',
    },
    description: {
      ko: 'CSV·XLSX 표의 앞뒤 공백·빈 행·중복 행을 정리하고 특정 열로 정렬하거나 조건에 맞는 행만 남깁니다. 결과를 CSV 또는 XLSX로 내려받을 수 있습니다.',
      en: 'Clean CSV or XLSX tables by trimming cells, removing empty and duplicate rows, sorting by a column, and filtering rows. Export back to CSV or XLSX.',
      ja: 'CSV・XLSXの空白・空行・重複行を整理し、列で並べ替え・フィルターしてCSV/XLSXで保存します。',
    },
    keywords: ['CSV 정리', 'CSV 중복 제거', 'CSV 정렬', 'CSV 필터', '엑셀 빈 행 제거'],
    updated: '2026-11-10',
    faq: [
      {
        q: '엑셀 파일도 정리할 수 있나요?',
        a: '네. XLSX·XLS·ODS 파일을 읽어 첫 번째 시트를 정리하고 CSV 또는 XLSX로 저장할 수 있습니다.',
      },
      {
        q: '중복 기준은 무엇인가요?',
        a: '모든 셀 값이 같은 행을 중복으로 봅니다. 특정 열만 기준으로 중복을 찾는 기능은 아직 없습니다.',
      },
      {
        q: '금액 열을 숫자로 정렬했는데 순서가 이상해요.',
        a: '“숫자로 정렬”이 켜져 있는지 확인하세요. 쉼표·원·%를 제거한 뒤 숫자로 비교하며, 숫자가 아닌 값은 뒤로 보냅니다.',
      },
      {
        q: '수식이 유지되나요?',
        a: '아니요. 엑셀이 계산한 표시값을 읽으므로 결과에는 수식이 아닌 값이 저장됩니다.',
      },
    ],
    sources: [
      { label: 'SheetJS (GitHub)', href: 'https://github.com/SheetJS/sheetjs' },
      { label: 'RFC 4180 — CSV format', href: 'https://www.rfc-editor.org/rfc/rfc4180' },
    ],
    related: ['csv-json', 'sheet-viewer', 'csv-clean'],
  },
  {
    slug: 'csv-table',
    category: 'document',
    icon: '🌐',
    title: {
      ko: 'CSV → HTML·Markdown',
      en: 'CSV to HTML & Markdown',
      ja: 'CSV → HTML・Markdown',
    },
    summary: {
      ko: 'CSV·엑셀 표를 HTML·Markdown 코드로 바꿉니다.',
      en: 'Convert CSV or Excel tables into HTML and Markdown code.',
      ja: 'CSV・Excelの表をHTML・Markdownコードに変換します。',
    },
    description: {
      ko: 'CSV·TSV·XLSX 표를 HTML table 또는 Markdown 표 코드로 변환합니다. 정렬·헤더 옵션과 미리보기를 제공하며 값은 자동으로 이스케이프됩니다.',
      en: 'Turn CSV, TSV, or XLSX tables into HTML table or Markdown table code with alignment, header options, and live preview.',
      ja: 'CSV・TSV・XLSXの表をHTML・Markdown表コードに変換します。',
    },
    keywords: [
      'CSV HTML 변환',
      'CSV 마크다운',
      '엑셀 표 HTML',
      'Markdown 표 만들기',
      'CSV 표 변환',
    ],
    updated: '2026-11-10',
    faq: [
      {
        q: '여러 시트를 한 번에 변환할 수 있나요?',
        a: '첫 번째 시트만 변환합니다. 다른 시트는 해당 시트를 첫 번째로 옮긴 뒤 사용하세요.',
      },
      {
        q: 'HTML이 그대로 실행되나요?',
        a: '아니요. 셀 값의 HTML 특수문자는 이스케이프되어 글자로 표시됩니다.',
      },
      {
        q: 'Markdown 표에 줄바꿈이 있으면?',
        a: '셀 안의 줄바꿈은 <br>로 바꿉니다. 파이프 문자는 |로 이스케이프합니다.',
      },
      {
        q: 'Notion·GitHub에서 바로 되나요?',
        a: '네. Markdown 코드를 README·위키·Notion에 붙여넣으면 표로 표시됩니다. HTML은 웹 페이지 템플릿에 사용하세요.',
      },
    ],
    sources: [
      { label: 'SheetJS (GitHub)', href: 'https://github.com/SheetJS/sheetjs' },
      {
        label: 'GitHub Flavored Markdown — Tables',
        href: 'https://github.github.com/gfm/#tables-extension-',
      },
    ],
    related: ['csv-clean', 'csv-json', 'sheet-viewer'],
  },
  {
    slug: 'csv-sql',
    category: 'document',
    icon: '🗄️',
    title: {
      ko: 'CSV → SQL',
      en: 'CSV to SQL',
      ja: 'CSV → SQL',
    },
    summary: {
      ko: 'CSV·엑셀 표를 CREATE TABLE·INSERT SQL로 바꿉니다.',
      en: 'Turn CSV or Excel tables into CREATE TABLE and INSERT SQL.',
      ja: 'CSV・Excelの表をCREATE TABLE・INSERT SQLに変換します。',
    },
    description: {
      ko: 'CSV·XLSX 표를 PostgreSQL·MySQL·SQLite용 SQL로 변환합니다. 값으로 타입을 추정하고 빈 값 NULL 처리, INSERT 묶음 크기를 조절할 수 있습니다.',
      en: 'Convert CSV or XLSX tables into PostgreSQL, MySQL, or SQLite SQL with inferred column types, NULL handling, and INSERT batching.',
      ja: 'CSV・XLSXの表をPostgreSQL・MySQL・SQLite用SQLに変換します。',
    },
    keywords: [
      'CSV SQL 변환',
      '엑셀 INSERT 문',
      'CREATE TABLE 생성',
      'CSV 데이터베이스',
      'SQL 덤프',
    ],
    updated: '2026-11-10',
    faq: [
      {
        q: '타입은 어떻게 정하나요?',
        a: '각 열의 값 샘플을 보고 INTEGER·REAL·DATE·BOOLEAN·TEXT를 추정합니다. 실제 스키마에 맞게 수정해 사용하세요.',
      },
      {
        q: '빈 값은 어떻게 들어가나요?',
        a: '기본은 NULL입니다. 체크를 끄면 빈 문자열로 들어갑니다.',
      },
      {
        q: '쉼표가 있는 숫자는?',
        a: '1,200처럼 쉼표가 있으면 문자로 처리됩니다. 먼저 CSV 정리 도구로 쉼표를 제거하거나 숫자 형식으로 바꾸세요.',
      },
      {
        q: '여러 시트도 되나요?',
        a: '첫 번째 시트만 변환합니다. 다른 시트는 해당 시트를 첫 번째로 옮긴 뒤 사용하세요.',
      },
    ],
    sources: [
      { label: 'SheetJS (GitHub)', href: 'https://github.com/SheetJS/sheetjs' },
      {
        label: 'PostgreSQL — SQL syntax',
        href: 'https://www.postgresql.org/docs/current/sql-syntax.html',
      },
    ],
    related: ['csv-table', 'csv-clean', 'csv-json'],
  },
  {
    slug: 'csv-pdf',
    category: 'document',
    icon: '🖨️',
    title: {
      ko: 'CSV·XLS·XLSX → PDF',
      en: 'CSV & Excel to PDF',
      ja: 'CSV・Excel → PDF',
    },
    summary: {
      ko: 'CSV·엑셀 표를 인쇄용 PDF로 저장합니다.',
      en: 'Save CSV or Excel tables as printable PDFs.',
      ja: 'CSV・Excelの表を印刷用PDFとして保存します。',
    },
    description: {
      ko: 'CSV·XLS·XLSX 표를 A4·Letter PDF로 만듭니다. 긴 표는 페이지를 자동으로 나누고 헤더 행을 반복하며 제목·글자 크기·방향을 조절할 수 있습니다.',
      en: 'Create printable A4 or Letter PDF tables from CSV or Excel. Long tables split across pages with repeated headers and adjustable title, font size, and orientation.',
      ja: 'CSV・XLSXの表をA4・LetterのPDF表に変換します。長い表は自動でページ分割します。',
    },
    keywords: ['CSV PDF 변환', '엑셀 PDF 변환', 'XLSX PDF', 'XLS PDF', '표 PDF 만들기', 'CSV 인쇄'],
    updated: '2026-11-10',
    faq: [
      {
        q: '글자를 복사할 수 있나요?',
        a: '아니요. 표를 이미지로 그려 PDF에 넣기 때문에 글자 선택·검색은 되지 않습니다. 인쇄·첨부용으로 사용하세요.',
      },
      {
        q: '긴 표도 되나요?',
        a: '네. 페이지 높이에 맞춰 자동으로 나누고 각 페이지에 헤더 행을 반복합니다.',
      },
      {
        q: '셀 내용이 잘려요.',
        a: '열 너비에 맞춰 줄임표로 표시됩니다. 글자 크기를 줄이거나, 긴 열을 줄여 CSV를 정리한 뒤 다시 시도하세요.',
      },
      {
        q: '한글도 인쇄되나요?',
        a: '네. 브라우저의 한글 글꼴로 그려 PDF에 넣습니다.',
      },
    ],
    sources: [
      { label: 'pdf-lib (GitHub)', href: 'https://github.com/Hopding/pdf-lib' },
      {
        label: 'MDN — Canvas text',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_text',
      },
    ],
    related: ['csv-sql', 'csv-table', 'sheet-viewer', 'docx-to-pdf', 'hwpx-to-pdf', 'pptx-to-pdf'],
  },
  {
    slug: 'csv-pivot',
    category: 'document',
    icon: '📊',
    title: {
      ko: 'CSV 피벗 테이블',
      en: 'CSV Pivot Table',
      ja: 'CSVピボットテーブル',
    },
    summary: {
      ko: '행·열 기준으로 표를 교차 집계합니다.',
      en: 'Build cross-tab summaries by row and column.',
      ja: '行・列の基準でクロス集計します。',
    },
    description: {
      ko: 'CSV·XLSX 표를 행·열 기준으로 교차 집계합니다. 합계·개수·평균·최소·최대와 합계 행·열을 지원하며 결과를 CSV·XLSX로 저장합니다.',
      en: 'Create pivot tables from CSV or XLSX with sum, count, average, min, max, and optional totals. Export to CSV or XLSX.',
      ja: 'CSV・XLSXから行・列のクロス集計を作成し、CSV・XLSXで保存します。',
    },
    keywords: ['CSV 피벗', '피벗테이블 만들기', '엑셀 교차표', 'CSV 집계', '데이터 피벗'],
    updated: '2026-11-10',
    faq: [
      {
        q: '엑셀 피벗 테이블과 똑같나요?',
        a: '기본적인 행·열 교차 집계와 합계는 지원합니다. 계산 필드·슬라이서·다중 값 필드는 지원하지 않습니다.',
      },
      {
        q: '값이 숫자가 아니면 어떻게 되나요?',
        a: '합계·평균·최소·최대에서는 숫자로 읽을 수 있는 값만 사용합니다. 개수 집계는 행 수를 셉니다.',
      },
      {
        q: '빈 값은 어디로 가나요?',
        a: '행·열 기준이 빈 행은 집계에서 제외합니다. 값이 빈 경우 합계에는 0으로 기여하지 않습니다.',
      },
      {
        q: '결과를 다시 표로 쓸 수 있나요?',
        a: '네. CSV 또는 XLSX로 내려받아 엑셀·구글 시트에서 이어서 편집할 수 있습니다.',
      },
    ],
    sources: [
      { label: 'SheetJS (GitHub)', href: 'https://github.com/SheetJS/sheetjs' },
      {
        label: 'MDN — Map',
        href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map',
      },
    ],
    related: ['csv-join', 'csv-clean', 'sheet-viewer'],
  },
  {
    slug: 'csv-join',
    category: 'document',
    icon: '🔗',
    title: {
      ko: 'CSV 조인',
      en: 'Join CSV Tables',
      ja: 'CSV結合',
    },
    summary: {
      ko: '공통 키로 두 CSV 표를 하나로 합칩니다.',
      en: 'Join two CSV tables by a common key.',
      ja: '共通キーで2つのCSV表を結合します。',
    },
    description: {
      ko: '두 CSV·XLSX 표를 공통 열 기준으로 결합합니다. inner·left·full 조인과 중복 열 이름 처리, CSV·XLSX 저장을 지원합니다.',
      en: 'Join two CSV or XLSX tables by a shared key with inner, left, and full joins. Export the merged table to CSV or XLSX.',
      ja: '2つのCSV・XLSX表を共通キーでinner・left・full結合し、CSV・XLSXで保存します。',
    },
    keywords: ['CSV 조인', 'CSV 합치기', 'VLOOKUP 대체', '엑셀 표 결합', '데이터 매칭'],
    updated: '2026-11-10',
    faq: [
      {
        q: 'VLOOKUP과 무엇이 다른가요?',
        a: 'VLOOKUP은 한쪽 값만 가져오지만, 이 도구는 두 표의 모든 열을 합치고 일치하지 않는 행도 선택에 따라 유지합니다.',
      },
      {
        q: '키가 여러 개 일치하면?',
        a: '가능한 조합을 모두 만들어 행이 늘어납니다. 중복 키가 있다면 먼저 CSV 정리로 확인하세요.',
      },
      {
        q: '열 이름이 같으면?',
        a: '오른쪽 표의 같은 이름 열은 뒤에 _2를 붙여 구분합니다.',
      },
      {
        q: '시트가 여러 개면?',
        a: '각 파일의 첫 번째 시트만 사용합니다.',
      },
    ],
    sources: [
      { label: 'SheetJS (GitHub)', href: 'https://github.com/SheetJS/sheetjs' },
      {
        label: 'MDN — Map',
        href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map',
      },
    ],
    related: ['csv-pivot', 'csv-clean', 'sheet-viewer'],
  },
  {
    slug: 'csv-xlsx',
    category: 'document',
    icon: '📊',
    title: {
      ko: 'CSV ↔ XLSX 변환',
      en: 'CSV ↔ XLSX Converter',
      ja: 'CSV ↔ XLSX 変換',
    },
    summary: {
      ko: 'CSV를 엑셀로, 엑셀 시트를 CSV로 바꿉니다.',
      en: 'Convert CSV files to Excel and Excel sheets to CSV.',
      ja: 'CSVをExcelに、ExcelシートをCSVに変換します。',
    },
    description: {
      ko: 'CSV·TSV를 XLSX로, XLSX·XLS·ODS 시트를 CSV로 변환합니다. 인코딩·시트·구분자·BOM을 고를 수 있고 표를 미리 확인한 뒤 내려받으며 파일은 서버로 전송되지 않습니다.',
      en: 'Convert CSV or TSV to XLSX, and XLSX, XLS, or ODS sheets to CSV. Choose encoding, sheet, delimiter, and BOM, preview the table, and download. Nothing is uploaded.',
      ja: 'CSV・TSVをXLSXに、XLSX・XLS・ODSのシートをCSVに変換します。文字コード・シート・区切り・BOMを選び、表を確認して保存できます。',
    },
    keywords: ['CSV XLSX 변환', '엑셀 CSV 변환', 'CSV 엑셀로', '엑셀 CSV로', 'TSV XLSX'],
    updated: '2026-11-12',
    faq: [
      {
        q: '한글 엑셀에서 CSV가 깨져 보여요.',
        a: 'CSV를 엑셀에서 열 때 인코딩이 맞지 않으면 글자가 깨집니다. 엑셀을 CSV로 저장할 때는 “한글 엑셀 호환(UTF-8 BOM)”을 켜고, CSV를 엑셀로 바꿀 때는 인코딩을 EUC-KR로 선택해 다시 읽어 보세요.',
      },
      {
        q: '여러 시트를 한 번에 CSV로 바꿀 수 있나요?',
        a: '한 번에 한 시트씩 변환합니다. 시트 선택을 바꿔 반복하면 됩니다. 시트마다 파일명 뒤에 시트 이름이 붙어 구분됩니다.',
      },
      {
        q: '수식과 서식이 유지되나요?',
        a: '아니요. 엑셀 수식은 계산된 표시값으로 저장되고, 셀 색·병합·이미지·차트는 CSV에 담기지 않습니다. 표 데이터만 옮기는 도구입니다.',
      },
      {
        q: 'CSV의 첫 행은 어떻게 처리되나요?',
        a: '첫 행을 머리글로 보고 그대로 첫 시트에 넣습니다. 별도로 머리글을 해석하거나 이름을 바꾸지 않습니다.',
      },
    ],
    sources: [
      { label: 'SheetJS (GitHub)', href: 'https://github.com/SheetJS/sheetjs' },
      { label: 'RFC 4180 — CSV format', href: 'https://www.rfc-editor.org/rfc/rfc4180' },
      {
        label: 'Microsoft — Excel 시트 이름 규칙',
        href: 'https://support.microsoft.com/en-us/office/rename-a-worksheet-3f1f7148-ee83-404d-8ef0-9ff99fbad1f9',
      },
    ],
    related: ['csv-clean', 'sheet-viewer', 'csv-json'],
  },
  {
    slug: 'csv-chart',
    category: 'document',
    icon: '📈',
    title: {
      ko: 'CSV 차트 만들기',
      en: 'CSV Chart Maker',
      ja: 'CSVグラフ作成',
    },
    summary: {
      ko: '표를 막대·선·파이 차트로 바꿉니다.',
      en: 'Turn table data into bar, line, or pie charts.',
      ja: '表データを棒・折れ線・円グラフに変換します。',
    },
    description: {
      ko: 'CSV·엑셀 표에서 범주와 숫자 열을 골라 막대·가로막대·선·파이 차트를 만듭니다. 제목·색상·범례를 바꾸고 PNG로 저장하며 파일은 서버로 전송되지 않습니다.',
      en: 'Create bar, horizontal bar, line, or pie charts from CSV or Excel tables. Choose columns, title, colors, and legend, then download a PNG. Nothing is uploaded.',
      ja: 'CSV・Excelの表から項目と数値の列を選び、棒・横棒・折れ線・円グラフを作成。タイトル・色・凡例を変えてPNGで保存できます。',
    },
    keywords: ['CSV 차트', '엑셀 차트 만들기', '표 그래프', 'CSV 막대 그래프', 'CSV 파이 차트'],
    updated: '2026-11-12',
    faq: [
      {
        q: '엑셀 파일도 차트로 만들 수 있나요?',
        a: '네. XLSX·XLS·ODS 파일의 첫 번째 시트를 읽습니다. 여러 시트가 있으면 차트로 만들 시트를 첫 번째로 옮기거나 CSV로 변환한 뒤 사용하세요.',
      },
      {
        q: '차트의 숫자가 이상하게 보여요.',
        a: '값 열이 숫자로 읽히는지 확인하세요. 쉼표·통화 기호·퍼센트는 자동으로 처리하지만, “확인 필요”처럼 문자가 섞인 셀은 그 행을 제외합니다. 제외된 행 수는 차트 아래에 표시됩니다.',
      },
      {
        q: '항목이 너무 많아 글자가 겹쳐요.',
        a: '막대는 60개, 선은 500개, 파이는 상위 7개와 기타로 줄여 그립니다. 범주를 미리 요약하거나 “같은 이름 합치기”를 켜면 더 읽기 쉬워집니다.',
      },
      {
        q: '이미지가 흐릿해요.',
        a: '화면 배율에 맞춰 2배 해상도로 그린 뒤 PNG로 저장합니다. 더 큰 이미지가 필요하면 브라우저 확대(⌘/Ctrl +) 후 다시 내려받으세요.',
      },
    ],
    sources: [
      {
        label: 'MDN — Canvas API',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API',
      },
      {
        label: 'Data-to-Viz — chart selection guide',
        href: 'https://www.data-to-viz.com/',
      },
    ],
    related: ['csv-pivot', 'csv-xlsx', 'sheet-viewer'],
  },
  {
    slug: 'image-convert',
    category: 'image',
    icon: '🔀',
    title: {
      ko: '이미지 형식 변환',
      en: 'Image Format Converter',
      ja: '画像形式変換',
    },
    summary: {
      ko: 'JPG·PNG·WebP로 여러 장을 한 번에 바꿉니다.',
      en: 'Convert images between JPG, PNG, and WebP in batch.',
      ja: 'JPG・PNG・WebPへ複数枚まとめて変換します。',
    },
    description: {
      ko: 'JPG·PNG·WebP·GIF·BMP·SVG 이미지를 원하는 형식으로 변환합니다. 화질·배경색을 조절하고 여러 장은 ZIP으로 받으세요. 파일은 서버로 전송되지 않습니다.',
      en: 'Convert JPG, PNG, WebP, GIF, BMP, and SVG images. Adjust quality and background, then download a ZIP for batches. Nothing is uploaded.',
      ja: 'JPG・PNG・WebP・GIF・BMP・SVGを変換。画質・背景色を調整し、複数枚はZIPで保存できます。',
    },
    keywords: [
      '이미지 형식 변환',
      'JPG PNG 변환',
      'WebP 변환',
      '사진 형식 바꾸기',
      '이미지 일괄 변환',
    ],
    updated: '2026-11-14',
    faq: [
      {
        q: '여러 장을 한 번에 바꿀 수 있나요?',
        a: '최대 20장, 전체 50MB까지 한 번에 변환합니다. 결과가 여러 개면 ZIP으로 묶여 내려받습니다.',
      },
      {
        q: '투명 배경이 사라졌어요.',
        a: 'JPG 형식에는 투명 칸이 없어서 그 자리를 지정한 배경색으로 칠합니다. 투명 배경을 유지하려면 PNG나 WebP를 선택하세요.',
      },
      {
        q: 'GIF 애니메이션도 변환되나요?',
        a: '첫 프레임만 변환합니다. 움직이는 GIF를 그대로 유지하려면 원본을 사용하세요.',
      },
      {
        q: 'SVG는 어떻게 변환되나요?',
        a: '브라우저가 SVG를 이미지로 그린 뒤 선택한 형식으로 저장합니다. 원본에 지정된 크기를 기준으로 하며, 글꼴·필터·외부 이미지는 환경에 따라 다르게 보일 수 있습니다.',
      },
    ],
    sources: [
      {
        label: 'jSquash — MozJPEG·OxiPNG·libwebp (GitHub)',
        href: 'https://github.com/jamsinclair/jSquash',
      },
      {
        label: 'MDN — HTMLCanvasElement.toBlob',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toBlob',
      },
      {
        label: 'MDN — 이미지 파일 형식',
        href: 'https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types',
      },
    ],
    related: ['image-compress', 'image-crop', 'heic-to-jpg'],
  },
  {
    slug: 'pdf-compress',
    category: 'document',
    icon: '🗜️',
    title: {
      ko: 'PDF 압축',
      en: 'Compress PDF',
      ja: 'PDF 圧縮',
    },
    summary: {
      ko: '글자는 그대로 두고 PDF 속 사진만 다시 압축해 용량을 줄입니다.',
      en: 'Shrink PDFs by recompressing images while keeping text searchable.',
      ja: '文字はそのまま、PDF内の画像だけを再圧縮して容量を減らします。',
    },
    description: {
      ko: 'PDF 안의 사진을 지정한 해상도·화질로 다시 압축하고 불필요한 데이터를 정리해 용량을 줄입니다. 글자 검색·복사·링크는 그대로 남고, 스캔본은 페이지를 이미지로 다시 만드는 방식도 고를 수 있습니다. 파일은 서버로 전송되지 않습니다.',
      en: 'Recompress the images inside a PDF at a chosen DPI and quality and clean up unused data. Text stays searchable; a page-to-image mode is available for scans. Nothing is uploaded.',
      ja: 'PDF内の画像を指定の解像度・画質で再圧縮し、不要なデータを整理して容量を減らします。文字検索・コピーはそのまま残り、スキャン向けのページ画像化モードも選べます。ファイルは送信されません。',
    },
    keywords: [
      'PDF 압축',
      'PDF 용량 줄이기',
      '스캔 PDF 압축',
      'PDF 파일 크기',
      'PDF 최적화',
      '텍스트 PDF 압축',
    ],
    updated: '2026-11-14',
    faq: [
      {
        q: '텍스트 PDF도 압축되나요?',
        a: '네. 기본 방식인 글자 유지는 사진만 다시 압축하고 글자는 그대로 두므로 검색·복사·링크가 남습니다. 다만 사진이 거의 없는 PDF는 줄어드는 폭이 작습니다.',
      },
      {
        q: '어떤 강도를 골라야 하나요?',
        a: '일반 제출은 균형(150 DPI, 75%), 인쇄·보관은 고화질(200 DPI, 85%), 메일 첨부는 용량 우선(120 DPI, 60%)을 권장합니다. 흑백 문서는 흑백 변환을 함께 켜면 더 줄어듭니다.',
      },
      {
        q: '압축 후 글자가 흐려집니다.',
        a: '페이지를 이미지로 방식에서 해상도를 낮추면 작은 글씨가 뭉개집니다. 글자 유지 방식을 쓰거나, 고화질(200 DPI 이상)로 다시 시도하세요.',
      },
      {
        q: '원본보다 용량이 커졌습니다.',
        a: '이미 최적화된 PDF이거나 사진이 거의 없는 문서일 수 있습니다. 결과 화면에 원본과 압축 후 용량이 함께 표시되니, 더 작은 쪽을 사용하세요.',
      },
    ],
    sources: [
      { label: 'MuPDF.js (GitHub)', href: 'https://github.com/ArtifexSoftware/mupdf.js' },
      { label: 'pdf-lib 공식 문서', href: 'https://pdf-lib.js.org/' },
      { label: 'pdf.js (GitHub)', href: 'https://github.com/mozilla/pdf.js' },
    ],
    related: ['pdf-merge', 'pdf-split', 'pdf-to-jpg'],
  },
  {
    slug: 'pdf-organize',
    category: 'document',
    icon: '🗂️',
    title: {
      ko: 'PDF 페이지 정리',
      en: 'Organize PDF Pages',
      ja: 'PDF ページ整理',
    },
    summary: {
      ko: '페이지 순서를 바꾸고 회전·삭제합니다.',
      en: 'Reorder, rotate, and delete PDF pages.',
      ja: 'PDFページの順番変更・回転・削除を行います。',
    },
    description: {
      ko: 'PDF 페이지를 드래그로 재배열하고 90° 회전하거나 삭제합니다. 원본의 글자·그림 품질을 유지한 채 새 PDF로 저장하며 파일은 서버로 전송되지 않습니다.',
      en: 'Reorder pages by drag, rotate 90 degrees, or delete them. Exports a new PDF while preserving text and vector quality. Nothing is uploaded.',
      ja: 'ページをドラッグで並べ替え、90度回転・削除します。テキストとベクター品質を保ったまま保存し、ファイルは送信されません。',
    },
    keywords: ['PDF 페이지 순서', 'PDF 회전', 'PDF 페이지 삭제', 'PDF 재배열', 'PDF 정리'],
    updated: '2026-11-10',
    faq: [
      {
        q: '텍스트와 링크가 유지되나요?',
        a: '네. 페이지를 복사해 새 PDF로 만드는 방식이라 원본의 글자·그림·링크가 유지됩니다. 이미지로 다시 그리는 PDF 압축과는 다릅니다.',
      },
      {
        q: '회전한 페이지가 일부 뷰어에서 안 돌아가 보입니다.',
        a: '회전은 PDF의 회전 정보로 저장됩니다. 회전을 무시하는 일부 뷰어에서는 원본 방향으로 보일 수 있으나, 대부분의 PDF 프로그램·인쇄에서는 적용됩니다.',
      },
      {
        q: '페이지를 삭제하면 원본에서도 사라지나요?',
        a: '아니요. 원본 파일은 그대로이고, 정리한 새 PDF만 내려받습니다.',
      },
      {
        q: '몇 페이지까지 편집할 수 있나요?',
        a: '한 번에 최대 100쪽까지 지원합니다. 그 이상은 나눠서 작업하세요.',
      },
    ],
    sources: [
      { label: 'pdf-lib 공식 문서', href: 'https://pdf-lib.js.org/' },
      { label: 'pdf.js (GitHub)', href: 'https://github.com/mozilla/pdf.js' },
    ],
    related: ['pdf-merge', 'pdf-split', 'pdf-compress'],
  },
  {
    slug: 'pdf-page-insert',
    category: 'document',
    icon: '➕',
    title: {
      ko: 'PDF 페이지 삽입·교체',
      en: 'Insert or Replace PDF Pages',
      ja: 'PDFページ挿入・置換',
    },
    summary: {
      ko: '다른 PDF의 쪽을 원하는 위치에 넣거나 바꿉니다.',
      en: 'Insert pages from another PDF or replace existing pages.',
      ja: '別のPDFのページを好きな位置に挿入・置換します。',
    },
    description: {
      ko: '원본 PDF의 지정한 위치에 다른 PDF의 페이지를 삽입하거나, 연속된 페이지를 교체합니다. 결과 쪽 순서를 미리 확인하고 텍스트·링크 품질을 유지한 새 PDF로 저장하며 파일은 서버로 전송되지 않습니다.',
      en: 'Insert pages from another PDF at a chosen position or replace a range of pages. Preview the resulting page order and export a new PDF while keeping text and links. Nothing is uploaded.',
      ja: '元のPDFの指定位置に別のPDFのページを挿入、または連続したページを置換します。結果のページ順を確認し、テキスト・リンクを保った新しいPDFで保存します。',
    },
    keywords: [
      'PDF 페이지 삽입',
      'PDF 페이지 교체',
      'PDF 합치기',
      'PDF 쪽 넣기',
      'PDF 페이지 바꾸기',
    ],
    updated: '2026-11-12',
    faq: [
      {
        q: '삽입과 교체는 어떻게 다른가요?',
        a: '삽입은 원본 쪽을 그대로 두고 지정한 위치에 다른 PDF의 쪽을 끼워 넣습니다. 교체는 원본의 연속된 쪽을 다른 PDF의 쪽으로 바꿉니다. 결과 쪽 수가 원본과 달라도 됩니다.',
      },
      {
        q: '텍스트와 링크가 유지되나요?',
        a: '네. 페이지를 복사해 새 PDF로 만드는 방식이라 원본의 글자·그림·링크가 유지됩니다. 이미지로 다시 그리는 압축과는 다릅니다. 다만 입력 폼·주석·북마크는 일부 빠질 수 있습니다.',
      },
      {
        q: '몇 쪽까지 넣을 수 있나요?',
        a: 'PDF 한 개당 100쪽, 결과도 100쪽까지 지원합니다. 그 이상은 문서를 나눠 작업하세요.',
      },
      {
        q: '암호가 걸린 PDF도 되나요?',
        a: '열 수 없습니다. 먼저 PDF 암호 풀기로 암호를 해제한 뒤 사용하세요. 원본 파일은 수정되지 않습니다.',
      },
    ],
    sources: [
      { label: 'pdf-lib 공식 문서', href: 'https://pdf-lib.js.org/' },
      {
        label: 'Adobe — PDF Reference',
        href: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/pdfreference1.7old.pdf',
      },
    ],
    related: ['pdf-organize', 'pdf-merge', 'pdf-split'],
  },
  {
    slug: 'pdf-watermark',
    category: 'document',
    icon: '💧',
    title: {
      ko: 'PDF 워터마크',
      en: 'PDF Watermark',
      ja: 'PDFウォーターマーク',
    },
    summary: {
      ko: '대외비·초안 문구를 PDF 전체에 넣습니다.',
      en: 'Add confidential or draft watermarks across PDF pages.',
      ja: '「社外秘」「下書き」などをPDF全体に入れます。',
    },
    description: {
      ko: 'PDF에 대외비·초안 같은 문구를 워터마크로 넣습니다. 원본 텍스트·링크·폼을 유지한 채 투명 레이어만 추가하고, 페이지 범위·배치·크기·투명도·색상·각도를 조절할 수 있습니다.',
      en: 'Stamp confidential or draft text over PDF pages while keeping the original text, links, and forms. Control page range, layout, size, opacity, color, and angle.',
      ja: 'PDFに「社外秘」「下書き」などのウォーターマークを追加。元のテキスト・リンク・フォームを保ち、範囲・配置・サイズ・透明度・色・角度を調整できます。',
    },
    keywords: ['PDF 워터마크', 'PDF 대외비', 'PDF 초안 표시', 'PDF 문구 넣기', 'PDF 도장'],
    updated: '2026-11-10',
    faq: [
      {
        q: '원본 PDF의 글자가 이미지로 바뀌나요?',
        a: '아니요. 원본 페이지는 그대로 두고 투명한 워터마크 이미지 레이어만 위에 얹습니다. 그래서 텍스트 선택·검색·링크·입력 폼이 유지됩니다.',
      },
      {
        q: '워터마크를 넣은 PDF를 원래대로 되돌릴 수 있나요?',
        a: '이 도구는 제거 기능을 제공하지 않습니다. 워터마크가 들어간 파일은 원본과 별도로 보관하고, 수정이 필요하면 워터마크를 넣기 전 원본을 사용하세요.',
      },
      {
        q: '특정 페이지만 넣을 수 있나요?',
        a: '네. 페이지 범위에 1-3,5처럼 입력하면 해당 페이지만 바꾸고 나머지는 원본 그대로 저장합니다. 비우면 전체 페이지에 적용합니다.',
      },
      {
        q: '암호가 걸린 PDF도 되나요?',
        a: '암호가 걸린 PDF는 열 수 없습니다. 브라우저나 PDF 프로그램에서 암호를 먼저 해제한 뒤 사용하세요. 스캔 PDF에는 넣을 수 있습니다.',
      },
    ],
    sources: [
      { label: 'pdf-lib (GitHub)', href: 'https://github.com/Hopding/pdf-lib' },
      {
        label: 'MDN — CanvasRenderingContext2D.fillText',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText',
      },
      {
        label: 'PDF 1.7 — Page rotation',
        href: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf',
      },
    ],
    related: ['image-watermark', 'pdf-compress', 'pdf-organize'],
  },
  {
    slug: 'pdf-page-number',
    category: 'document',
    icon: '🔢',
    title: {
      ko: 'PDF 페이지 번호',
      en: 'PDF Page Numbers',
      ja: 'PDFページ番号',
    },
    summary: {
      ko: 'PDF 모든 페이지에 번호를 자동으로 넣습니다.',
      en: 'Add page numbers to every page of a PDF.',
      ja: 'PDFの全ページにページ番号を追加します。',
    },
    description: {
      ko: 'PDF에 페이지 번호를 텍스트로 넣습니다. 확대해도 깨지지 않습니다. 위치·형식·크기·여백·시작 번호·범위를 지정할 수 있고 원본 텍스트와 링크는 그대로 유지됩니다.',
      en: 'Stamp page numbers as vector text with position, format, size, margin, start number, and page range controls. Original text and links stay intact.',
      ja: '位置・形式・サイズ・余白・開始番号・範囲を指定して、PDFにページ番号をテキストで追加します。元のテキストは保持されます。',
    },
    keywords: [
      'PDF 페이지 번호',
      'PDF 쪽번호',
      'PDF 번호 넣기',
      'PDF 페이지 넘버',
      'PDF 번호 매기기',
    ],
    updated: '2026-11-10',
    faq: [
      {
        q: '번호가 이미 있는 PDF에 넣으면 어떻게 되나요?',
        a: '기존 번호 위에 새 번호가 겹쳐 보일 수 있습니다. 원본에 번호가 있다면 페이지 범위를 지정하거나 기존 번호를 먼저 지운 뒤 사용하세요.',
      },
      {
        q: '한글 문구도 넣을 수 있나요?',
        a: '페이지 번호는 숫자와 영문만 지원합니다. “대외비”처럼 한글 문구를 넣으려면 PDF 워터마크 도구를 사용하세요.',
      },
      {
        q: '표지에는 번호를 빼고 싶어요.',
        a: '페이지 범위에 2-처럼 입력하면 2쪽부터 끝까지 번호를 넣습니다. 시작 번호를 1로 두면 표지 다음 페이지가 1번이 됩니다.',
      },
      {
        q: '회전된 페이지도 괜찮나요?',
        a: '네. 페이지 회전 값을 읽어 번호가 바로 서도록 각도와 위치를 자동으로 보정합니다.',
      },
    ],
    sources: [
      { label: 'pdf-lib (GitHub)', href: 'https://github.com/Hopding/pdf-lib' },
      {
        label: 'PDF 1.7 — Page rotation',
        href: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf',
      },
    ],
    related: ['pdf-watermark', 'pdf-organize', 'pdf-merge'],
  },
  {
    slug: 'pdf-metadata',
    category: 'document',
    icon: '🏷️',
    title: {
      ko: 'PDF 메타데이터',
      en: 'PDF Metadata Editor',
      ja: 'PDFメタデータ編集',
    },
    summary: {
      ko: 'PDF의 제목·작성자·키워드를 확인하고 지웁니다.',
      en: 'View and edit PDF title, author, subject, and keywords.',
      ja: 'PDFのタイトル・作成者・キーワードを確認・編集します。',
    },
    description: {
      ko: 'PDF에 저장된 제목·작성자·주제·키워드를 확인하고 수정하거나 비웁니다. 외부 배포 전 작성자 이름·회사명 같은 개인정보를 정리할 수 있습니다.',
      en: 'Inspect and edit PDF title, author, subject, and keywords, or clear them before sharing. Remove author names and company details without touching the content.',
      ja: 'PDFのタイトル・作成者・件名・キーワードを確認・編集・削除します。共有前の個人情報整理に便利です。',
    },
    keywords: ['PDF 메타데이터', 'PDF 작성자 삭제', 'PDF 제목 변경', 'PDF 속성', 'PDF 정보 편집'],
    updated: '2026-11-10',
    faq: [
      {
        q: '작성자 이름을 완전히 지울 수 있나요?',
        a: '네. “모두 비우기”를 누르고 저장하면 제목·작성자·주제·키워드를 빈 값으로 저장합니다. 다만 PDF를 만든 프로그램 정보는 원본 제작 정보라 이 도구에서 바꾸지 않습니다.',
      },
      {
        q: '문서 내용도 바뀌나요?',
        a: '아니요. 메타데이터만 수정하며 본문·페이지·서명·첨부 파일은 건드리지 않습니다. 그래도 중요한 문서는 원본을 보관하고 결과를 다시 확인하세요.',
      },
      {
        q: '수정한 날짜가 왜 바뀌나요?',
        a: '저장할 때 수정한 날짜를 현재 시각으로 갱신합니다. 만든 날짜는 원본 값을 유지합니다.',
      },
      {
        q: '암호가 걸린 PDF도 되나요?',
        a: '암호가 걸린 PDF는 열거나 저장할 수 없습니다. 암호를 먼저 해제한 뒤 사용하세요.',
      },
    ],
    sources: [
      { label: 'pdf-lib (GitHub)', href: 'https://github.com/Hopding/pdf-lib' },
      {
        label: 'Adobe — PDF metadata',
        href: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf',
      },
    ],
    related: ['pdf-watermark', 'pdf-page-number', 'docx-viewer'],
  },
  {
    slug: 'pdf-nup',
    category: 'document',
    icon: '🗂️',
    title: {
      ko: 'PDF 모아찍기',
      en: 'PDF N-up',
      ja: 'PDFまとめ印刷',
    },
    summary: {
      ko: '한 장에 2·4·6·9쪽을 모아 인쇄용 PDF로 만듭니다.',
      en: 'Place 2, 4, 6, or 9 PDF pages on one sheet for printing.',
      ja: '1枚に2・4・6・9ページをまとめて印刷用PDFを作ります。',
    },
    description: {
      ko: 'PDF 여러 쪽을 한 장에 2·4·6·9쪽씩 모아 새 PDF로 만듭니다. 원본을 이미지로 바꾸지 않아 글자·표 품질이 유지되고, 용지·방향·여백·간격을 조절할 수 있습니다.',
      en: 'Combine 2, 4, 6, or 9 PDF pages per sheet without rasterizing them. Choose paper size, orientation, margins, and gaps, then download a print-ready PDF.',
      ja: 'PDFの複数ページを1枚に2・4・6・9ページずつ配置します。画像化しないため文字や表の品質が保たれます。',
    },
    keywords: [
      'PDF 모아찍기',
      'PDF N-up',
      '한 장에 여러 페이지',
      'PDF 2쪽 인쇄',
      'PDF 4쪽 모아찍기',
    ],
    updated: '2026-11-10',
    faq: [
      {
        q: '글자가 흐려지나요?',
        a: '아니요. 페이지를 이미지로 변환하지 않고 PDF 페이지 객체로 배치하므로 원본 글자·표·이미지 품질이 유지됩니다.',
      },
      {
        q: '마지막 장이 덜 차면 어떻게 되나요?',
        a: '남는 칸은 빈 상태로 둡니다. 빈 페이지를 억지로 추가하지 않아 종이가 낭비되지 않습니다.',
      },
      {
        q: '양면 인쇄에도 쓸 수 있나요?',
        a: '네. 2쪽 모아찍기는 위·아래 배치라 양면 인쇄와 잘 맞습니다. 다만 인쇄할 때 “한 장에 여러 페이지” 기능은 끄세요.',
      },
      {
        q: '링크와 입력 폼도 유지되나요?',
        a: '페이지 내용은 유지되지만 링크·주석·입력 폼은 새 PDF로 복사되지 않습니다. 인쇄·열람용으로 사용하세요.',
      },
    ],
    sources: [
      { label: 'pdf-lib (GitHub)', href: 'https://github.com/Hopding/pdf-lib' },
      {
        label: 'Adobe — PDF page objects',
        href: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf',
      },
    ],
    related: ['pdf-resize', 'pdf-organize', 'pdf-compress'],
  },
  {
    slug: 'pdf-resize',
    category: 'document',
    icon: '📐',
    title: {
      ko: 'PDF 페이지 크기',
      en: 'PDF Page Size',
      ja: 'PDFページサイズ',
    },
    summary: {
      ko: 'PDF를 A4·A3·Letter 용지 크기로 맞춥니다.',
      en: 'Fit PDF pages to A4, A3, Letter, or Legal.',
      ja: 'PDFをA4・A3・Letterなどの用紙サイズに合わせます。',
    },
    description: {
      ko: 'PDF 페이지를 A4·A3·A5·Letter·Legal 크기로 바꿉니다. 원본 비율을 유지해 새 용지에 배치하고, 방향·여백을 조절하며 글자와 이미지 품질은 그대로 유지됩니다.',
      en: 'Resize PDF pages to A4, A3, A5, Letter, or Legal while keeping the original aspect ratio. Adjust orientation and margins without losing text quality.',
      ja: 'PDFページをA4・A3・A5・Letter・Legalに変換します。元の比率を保ち、文字や画像の品質も維持します。',
    },
    keywords: [
      'PDF 크기 변경',
      'PDF A4 변환',
      'PDF 용지 크기',
      'PDF Letter A4',
      'PDF 페이지 사이즈',
    ],
    updated: '2026-11-10',
    faq: [
      {
        q: '원본이 잘리지 않나요?',
        a: '원본 비율을 유지해 새 용지 안에 맞추므로 잘리지 않습니다. 대신 용지 비율이 다르면 위·아래 또는 좌·우에 흰 여백이 생깁니다.',
      },
      {
        q: '글자가 이미지로 바뀌나요?',
        a: '아니요. 원본 페이지를 PDF 객체로 새 용지에 배치하므로 텍스트·표·이미지가 그대로 유지됩니다.',
      },
      {
        q: '여백을 0으로 하면 꽉 차나요?',
        a: 'PDF 용지에는 꽉 차지만, 프린터마다 인쇄할 수 없는 가장자리 영역이 있습니다. 실제 출력 시 5mm 이상 여백을 두는 편이 안전합니다.',
      },
      {
        q: '링크도 유지되나요?',
        a: '링크·주석·입력 폼은 새 페이지에 복사되지 않습니다. 내용 열람·인쇄용으로 사용하세요.',
      },
    ],
    sources: [
      { label: 'pdf-lib (GitHub)', href: 'https://github.com/Hopding/pdf-lib' },
      { label: 'ISO 216 — A4 paper size', href: 'https://www.iso.org/standard/36631.html' },
    ],
    related: ['pdf-nup', 'pdf-page-number', 'pdf-to-jpg'],
  },
  {
    slug: 'pdf-crop',
    category: 'document',
    icon: '✂️',
    title: {
      ko: 'PDF 여백 자르기',
      en: 'Crop PDF Margins',
      ja: 'PDF余白トリミング',
    },
    summary: {
      ko: 'PDF의 흰 여백과 스캔 테두리를 잘라냅니다.',
      en: 'Crop white margins and scan borders from PDF pages.',
      ja: 'PDFの白い余白やスキャンの枠を切り取ります。',
    },
    description: {
      ko: 'PDF 페이지의 위·아래·왼쪽·오른쪽 여백을 밀리미터 단위로 잘라냅니다. 내용은 다시 그리지 않아 품질이 유지되고, 회전된 페이지도 화면 기준으로 적용됩니다.',
      en: 'Crop PDF margins in millimeters without re-rendering the page. Rotation-aware and fully local in your browser.',
      ja: 'PDFページの上下左右の余白をmm単位で切り取ります。再描画しないため画質が保たれます。',
    },
    keywords: ['PDF 여백 자르기', 'PDF 크롭', 'PDF 흰 여백', '스캔 여백 제거', 'PDF 테두리 자르기'],
    updated: '2026-11-10',
    faq: [
      {
        q: '내용이 잘려도 되나요?',
        a: '미리보기에서 어두운 영역이 잘려 나갑니다. 내용이 여백 안에 걸쳐 있으면 일부가 잘릴 수 있으니 적용 전에 확인하세요.',
      },
      {
        q: '잘라낸 부분이 완전히 삭제되나요?',
        a: '화면에 보이는 영역만 줄이는 방식이라 파일 내부 데이터가 완전히 삭제되지는 않습니다. 민감정보 제거는 이미지 모자이크·가리기 도구를 사용하세요.',
      },
      {
        q: '페이지마다 여백이 다른데 한 번에 되나요?',
        a: '모든 페이지에 같은 여백 값을 적용합니다. 페이지마다 다르면 나눠서 처리하세요.',
      },
      {
        q: '회전된 페이지도 괜찮나요?',
        a: '네. 화면 기준으로 위·아래·왼쪽·오른쪽을 계산해 회전된 페이지에도 동일하게 적용합니다.',
      },
    ],
    sources: [
      { label: 'pdf-lib (GitHub)', href: 'https://github.com/Hopding/pdf-lib' },
      {
        label: 'Adobe — CropBox',
        href: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf',
      },
    ],
    related: ['pdf-nup', 'pdf-resize', 'image-mosaic'],
  },
  {
    slug: 'pdf-text',
    category: 'document',
    icon: '📄',
    title: {
      ko: 'PDF 텍스트 추출',
      en: 'Extract PDF Text',
      ja: 'PDFテキスト抽出',
    },
    summary: {
      ko: 'PDF의 글자를 페이지별로 뽑아 TXT로 저장합니다.',
      en: 'Extract text from PDF pages and save it as TXT.',
      ja: 'PDFの文字をページごとに抽出し、TXTで保存します。',
    },
    description: {
      ko: 'PDF 안의 글자를 읽어 페이지 순서대로 추출합니다. 범위를 지정하고 페이지 구분선을 넣어 복사하거나 TXT로 저장할 수 있으며 파일은 서버로 전송되지 않습니다.',
      en: 'Read the PDF text layer and extract it page by page. Choose a range, keep page markers, copy, or download as TXT.',
      ja: 'PDFのテキストレイヤーをページ順に抽出します。範囲指定・区切り線・TXT保存に対応します。',
    },
    keywords: ['PDF 텍스트 추출', 'PDF 글자 추출', 'PDF 복사', 'PDF TXT 변환', 'PDF 내용 추출'],
    updated: '2026-11-10',
    faq: [
      {
        q: '스캔한 PDF에서도 추출되나요?',
        a: '스캔 PDF는 글자가 이미지라 글자 정보가 없습니다. PDF OCR 도구로 먼저 문자를 인식한 뒤 사용하세요.',
      },
      {
        q: '표나 다단 문서도 순서가 맞나요?',
        a: 'PDF 내부의 텍스트 배치 순서를 따르므로 표·다단 편집은 읽기 순서가 원본과 다를 수 있습니다.',
      },
      {
        q: '이미지 속 글자도 나오나요?',
        a: '아니요. PDF 안의 글자만 추출하며 사진·도장·서명 안의 글자는 포함되지 않습니다.',
      },
      {
        q: '페이지 구분선을 없앨 수 있나요?',
        a: '네. “페이지 구분선 넣기”를 끄면 페이지 내용만 이어 붙입니다.',
      },
    ],
    sources: [
      { label: 'pdf.js (GitHub)', href: 'https://github.com/mozilla/pdf.js' },
      {
        label: 'MDN — getTextContent',
        href: 'https://mozilla.github.io/pdf.js/api/draft/module-pdfjsLib.PDFPageProxy.html',
      },
    ],
    related: ['pdf-ocr', 'docx-viewer', 'text-cleanup'],
  },
  {
    slug: 'pdf-diff',
    category: 'document',
    icon: '🔎',
    title: {
      ko: 'PDF 텍스트 비교',
      en: 'Compare PDF Text',
      ja: 'PDFテキスト比較',
    },
    summary: {
      ko: '두 PDF의 바뀐 쪽과 줄을 찾아냅니다.',
      en: 'Find changed pages and lines between two PDFs.',
      ja: '2つのPDFの変更ページと行を見つけます。',
    },
    description: {
      ko: '두 PDF의 페이지 텍스트를 추출해 같은 쪽·추가·삭제·변경된 쪽을 맞추고, 바뀐 쪽은 줄 단위로 보여 줍니다. 스캔 PDF는 OCR 안내를 제공하며 파일은 서버로 전송되지 않습니다.',
      en: 'Extract page text from two PDFs, align added, removed, and changed pages, and show line-level differences. Scanned PDFs get an OCR notice, and nothing is uploaded.',
      ja: '2つのPDFからページテキストを抽出し、追加・削除・変更ページを対応付け、変更ページを行単位で表示します。スキャンPDFはOCR案内を表示し、ファイルは送信されません。',
    },
    keywords: ['PDF 비교', 'PDF 텍스트 비교', 'PDF 다른 점', 'PDF 수정 전후', 'PDF diff'],
    updated: '2026-11-12',
    faq: [
      {
        q: '스캔한 PDF도 비교할 수 있나요?',
        a: '글자 정보가 없으면 비교할 수 없습니다. PDF OCR 도구로 글자를 먼저 인식한 뒤 다시 시도하세요. 이미지로만 된 PDF는 글자 내용을 읽을 수 없습니다.',
      },
      {
        q: '이미지나 표 모양이 바뀐 것도 알 수 있나요?',
        a: '아니요. 글자 내용만 비교합니다. 로고·도표·레이아웃·글꼴·색상 변경은 결과에 나오지 않습니다.',
      },
      {
        q: '공백이 다른데도 같은 쪽으로 나와요.',
        a: 'PDF 프로그램마다 줄바꿈과 공백을 다르게 저장하기 때문에 공백 차이는 무시합니다. 글자가 추가·삭제·변경된 경우는 줄 단위로 표시합니다.',
      },
      {
        q: '쪽 순서를 바꾸면 어떻게 보이나요?',
        a: '같은 텍스트를 찾아 최대한 대응시키지만, 순서가 크게 바뀌면 삭제·추가로 표시될 수 있습니다. 결과 쪽 번호를 함께 확인하세요.',
      },
    ],
    sources: [
      { label: 'pdf.js (GitHub)', href: 'https://github.com/mozilla/pdf.js' },
      {
        label: 'An O(ND) Difference Algorithm and Its Variations — Myers (1986)',
        href: 'https://link.springer.com/article/10.1007/BF01840446',
      },
    ],
    related: ['pdf-text', 'text-diff', 'pdf-ocr'],
  },
  {
    slug: 'pdf-header-footer',
    category: 'document',
    icon: '📑',
    title: {
      ko: 'PDF 머리글·바닥글',
      en: 'PDF Header & Footer',
      ja: 'PDFヘッダー・フッター',
    },
    summary: {
      ko: '문서명·페이지 번호를 모든 페이지 위·아래에 넣습니다.',
      en: 'Add document titles and page numbers to every PDF page.',
      ja: '文書名やページ番号を全ページの上下に追加します。',
    },
    description: {
      ko: 'PDF 모든 페이지의 위·아래에 문서명·부서명·페이지 번호를 넣습니다. {page}·{total} 토큰과 한글 문구를 지원하며 원본 내용은 그대로 유지됩니다.',
      en: 'Add headers and footers with document titles, departments, and page numbers. Supports Korean text and {page}/{total} tokens while keeping the original content.',
      ja: '全ページの上下に文書名・部署名・ページ番号を追加します。韓国語と{page}/{total}トークンに対応します。',
    },
    keywords: ['PDF 머리글', 'PDF 바닥글', 'PDF 페이지 번호', 'PDF 문서명 넣기', 'PDF 꼬리말'],
    updated: '2026-11-10',
    faq: [
      {
        q: '페이지 번호를 넣을 수 있나요?',
        a: '네. 바닥글이나 머리글에 {page}를 넣으면 현재 페이지, {total}을 넣으면 전체 페이지 수로 바뀝니다. {page:2}처럼 두 자리로 채울 수도 있습니다.',
      },
      {
        q: '한글 문구도 되나요?',
        a: '네. 한글·영문·숫자 모두 사용할 수 있습니다. 머리글·바닥글은 투명 이미지 레이어로 추가됩니다.',
      },
      {
        q: '본문과 겹칩니다.',
        a: '여백을 늘리거나 글자 크기를 줄이세요. 원본 문서의 여백이 좁으면 본문 위에 겹쳐 보일 수 있습니다.',
      },
      {
        q: '텍스트로 검색되나요?',
        a: '아니요. 머리글·바닥글은 이미지 레이어라 PDF 텍스트 검색·추출에는 포함되지 않습니다.',
      },
    ],
    sources: [
      { label: 'pdf-lib (GitHub)', href: 'https://github.com/Hopding/pdf-lib' },
      {
        label: 'MDN — Canvas fillText',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/fillText',
      },
    ],
    related: ['pdf-page-number', 'pdf-watermark', 'pdf-nup'],
  },
  {
    slug: 'pdf-image-extract',
    category: 'document',
    icon: '🖼️',
    title: {
      ko: 'PDF 이미지 추출',
      en: 'Extract PDF Images',
      ja: 'PDF画像抽出',
    },
    summary: {
      ko: 'PDF 페이지 속 사진·그림을 PNG로 꺼냅니다.',
      en: 'Extract photos and graphics from PDF pages as PNG.',
      ja: 'PDFページ内の写真・図をPNGで抽出します。',
    },
    description: {
      ko: 'PDF 안의 사진·그림을 찾아 PNG로 저장합니다. 페이지 범위를 지정하고 개별 또는 ZIP으로 내려받을 수 있으며 도형·글자는 제외됩니다.',
      en: 'Find embedded images in PDF pages and save them as PNG. Choose a page range and download individually or as a ZIP; vector graphics and text are excluded.',
      ja: 'PDFに埋め込まれた画像をPNGで保存します。範囲指定・個別/ZIP保存に対応します。',
    },
    keywords: [
      'PDF 이미지 추출',
      'PDF 사진 추출',
      'PDF 그림 저장',
      'PDF 이미지 꺼내기',
      'PDF PNG 변환',
    ],
    updated: '2026-11-10',
    faq: [
      {
        q: '모든 이미지가 나오나요?',
        a: 'PDF에 사진·그림으로 삽입된 내용만 나옵니다. 도형·차트·글자는 이미지가 아니므로 추출되지 않습니다.',
      },
      {
        q: '스캔 PDF는 어떻게 되나요?',
        a: '페이지 전체를 한 장의 이미지로 저장한 스캔본은 페이지당 1개 이미지가 추출됩니다.',
      },
      {
        q: '투명 배경이 유지되나요?',
        a: '네. 추출 형식은 PNG라 투명 배경이 유지됩니다.',
      },
      {
        q: '이미지가 너무 많아요.',
        a: '한 번에 최대 100개까지 추출합니다. 페이지 범위를 나눠서 사용하세요.',
      },
    ],
    sources: [
      { label: 'pdf.js (GitHub)', href: 'https://github.com/mozilla/pdf.js' },
      {
        label: 'MDN — ImageData',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/ImageData',
      },
    ],
    related: ['pdf-to-jpg', 'pdf-ocr', 'image-convert'],
  },
  {
    slug: 'pdf-sign',
    category: 'document',
    icon: '✍️',
    title: {
      ko: 'PDF 서명·도장',
      en: 'Sign PDF',
      ja: 'PDF署名・印鑑',
    },
    summary: {
      ko: 'PDF에 직접 그린 서명이나 서명 이미지를 넣습니다.',
      en: 'Add a drawn or uploaded signature to PDF pages.',
      ja: '手書きや画像の署名をPDFに追加します。',
    },
    description: {
      ko: 'PDF에 자필 서명을 그리거나 서명 이미지를 올려 원하는 위치·크기·투명도로 넣습니다. 마지막 페이지·모든 페이지·지정 페이지에 적용할 수 있습니다.',
      en: 'Draw or upload a signature and place it on a PDF with adjustable size, opacity, and page target. Choose the last page, all pages, or a specific page.',
      ja: '手書き・画像の署名をPDFの好きな位置・サイズ・透明度で追加します。',
    },
    keywords: ['PDF 서명', 'PDF 도장', 'PDF 사인', '전자서명 이미지', '계약서 서명'],
    updated: '2026-11-10',
    faq: [
      {
        q: '전자서명으로 법적 효력이 있나요?',
        a: '이 도구는 이미지 서명을 넣는 기능이며, 법적 효력은 문서 종류·당사자 합의·관련 법령에 따라 다릅니다. 중요한 계약은 공인전자서명 등 별도 요건을 확인하세요.',
      },
      {
        q: '서명 이미지는 어떤 형식이 좋나요?',
        a: '투명 배경 PNG를 권장합니다. JPG는 흰 배경이 함께 들어가 문서 위에 사각형으로 보일 수 있습니다.',
      },
      {
        q: '모든 페이지에 넣을 수 있나요?',
        a: '네. “모든 페이지”를 선택하면 같은 위치에 반복해서 넣습니다. 보통은 마지막 페이지에 넣습니다.',
      },
      {
        q: '서명을 지울 수 있나요?',
        a: '이 도구는 서명을 추가한 새 PDF를 만듭니다. 원본을 보관하고, 잘못 넣었으면 원본에서 다시 작업하세요.',
      },
    ],
    sources: [
      { label: 'pdf-lib (GitHub)', href: 'https://github.com/Hopding/pdf-lib' },
      {
        label: 'MDN — Pointer events',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events',
      },
    ],
    related: ['pdf-form-fill', 'pdf-header-footer', 'pdf-text'],
  },
  {
    slug: 'pdf-form-fill',
    category: 'document',
    icon: '📝',
    title: {
      ko: 'PDF 양식 채우기',
      en: 'Fill PDF Forms',
      ja: 'PDFフォーム入力',
    },
    summary: {
      ko: 'PDF 입력 필드·체크박스·드롭다운을 채웁니다.',
      en: 'Fill PDF text fields, checkboxes, radios, and dropdowns.',
      ja: 'PDFの入力欄・チェックボックス・ドロップダウンを入力します。',
    },
    description: {
      ko: 'PDF 양식의 텍스트 필드·체크박스·라디오·드롭다운·목록을 자동 인식해 값을 채웁니다. 한글 입력과 양식 평탄화를 지원하며 파일은 서버로 전송되지 않습니다.',
      en: 'Detect and fill PDF form text fields, checkboxes, radios, dropdowns, and lists. Supports Korean input and optional flattening; nothing is uploaded.',
      ja: 'PDFの入力欄・チェックボックス・ラジオ・ドロップダウンを自動認識して入力します。韓国語と平坦化に対応します。',
    },
    keywords: ['PDF 양식 채우기', 'PDF 입력', 'PDF 체크박스', 'PDF 폼 작성', 'AcroForm'],
    updated: '2026-11-10',
    faq: [
      {
        q: '스캔한 PDF도 채울 수 있나요?',
        a: '아니요. 입력 가능한 필드가 있는 PDF만 지원합니다. 스캔 이미지는 PDF OCR로 텍스트를 추출한 뒤 별도 문서로 작성해야 합니다.',
      },
      {
        q: '한글 입력이 되나요?',
        a: '네. 내장된 나눔고딕 폰트로 한글 값을 표시합니다. 영문·숫자만 있으면 기본 폰트를 써서 파일이 가볍습니다.',
      },
      {
        q: '양식 평탄화는 무엇인가요?',
        a: '입력값을 페이지 내용으로 고정하고 입력 필드를 제거합니다. 제출용으로는 평탄화가 안전하지만, 이후에는 수정할 수 없습니다.',
      },
      {
        q: '모든 필드가 채워지지 않아요.',
        a: '서명·버튼·지원하지 않는 필드는 건너뜁니다. 일부 PDF는 필드 구조가 깨져 있을 수 있으니 원본 프로그램에서 확인하세요.',
      },
    ],
    sources: [
      {
        label: 'pdf-lib — form filling',
        href: 'https://pdf-lib.js.org/docs/api/classes/pdfdocument',
      },
      {
        label: 'NanumGothic (SIL OFL)',
        href: 'https://fonts.google.com/noto/specimen/Noto+Sans+KR',
      },
    ],
    related: ['pdf-sign', 'pdf-header-footer', 'pdf-text'],
  },
  {
    slug: 'pdf-redact',
    category: 'document',
    icon: '⬛',
    title: {
      ko: 'PDF 가리기',
      en: 'Redact PDF',
      ja: 'PDF黒塗り',
    },
    summary: {
      ko: '개인정보 영역을 검게 덮어 원본 내용을 삭제합니다.',
      en: 'Black out sensitive areas and remove the underlying content.',
      ja: '個人情報の領域を黒く塗り、元の内容を削除します。',
    },
    description: {
      ko: 'PDF에서 가릴 영역을 드래그해 지정하면 해당 페이지를 이미지로 다시 만들어 원본 텍스트를 제거합니다. 가리지 않은 페이지는 원래 글자와 그림을 유지합니다.',
      en: 'Drag over sensitive areas to permanently remove underlying content. Redacted pages become images; other pages keep their original text and graphics.',
      ja: '隠す範囲をドラッグすると、そのページを画像化して元のテキストを削除します。',
    },
    keywords: [
      'PDF 가리기',
      'PDF 개인정보 삭제',
      'PDF 검은색',
      'PDF 레닥션',
      'PDF 주민번호 가리기',
    ],
    updated: '2026-11-10',
    faq: [
      {
        q: '검은 사각형만 덮는 것과 무엇이 다른가요?',
        a: '가린 페이지를 이미지로 다시 만들어 원본 글자·그림을 결과에서 제거합니다. 단순히 검은 도형을 위에 얹는 방식처럼 텍스트 복사로 내용이 드러나지 않습니다.',
      },
      {
        q: '가린 페이지의 글자를 복사할 수 있나요?',
        a: '아니요. 가린 페이지는 이미지로 대체되어 텍스트 선택·검색·링크가 사라집니다. 대신 인쇄 품질은 원본 글자·그림보다 낮아질 수 있습니다.',
      },
      {
        q: '메타데이터도 지워지나요?',
        a: '네. 결과 파일에는 원본의 제목·작성자·주제·키워드를 옮기지 않습니다. 작성 프로그램 항목에만 옷깃이 기록됩니다.',
      },
      {
        q: '원본으로 되돌릴 수 있나요?',
        a: '결과 PDF에서는 되돌릴 수 없습니다. 원본 파일을 반드시 별도로 보관하세요.',
      },
    ],
    sources: [
      { label: 'pdf-lib (GitHub)', href: 'https://github.com/Hopding/pdf-lib' },
      {
        label: 'Adobe — Redaction',
        href: 'https://opensource.adobe.com/dc-acrobat-sdk-docs/pdfstandards/PDF32000_2008.pdf',
      },
    ],
    related: ['pdf-form-fill', 'pdf-metadata', 'image-mosaic'],
  },
  {
    slug: 'date-calc',
    category: 'utility',
    icon: '📅',
    title: {
      ko: '날짜·영업일 계산기',
      en: 'Date & Workday Calculator',
      ja: '日付・営業日計算',
    },
    summary: {
      ko: 'D-day와 공휴일 제외 영업일을 계산합니다.',
      en: 'Calculate D-day and business days excluding Korean holidays.',
      ja: 'D-dayと韓国の祝日を除いた営業日を計算します。',
    },
    description: {
      ko: '두 날짜 사이의 일수·영업일을 계산하고, 특정 날짜에서 일/영업일을 더하거나 뺍니다. 한국 법정공휴일과 대체공휴일을 반영하며 날짜는 서버로 전송되지 않습니다.',
      en: 'Calculate date differences and business days, or add/subtract days and workdays. Korean public holidays included; nothing is uploaded.',
      ja: '日付差・営業日を計算し、日・営業日の加減算も行えます。韓国の祝日を反映し、入力は送信されません。',
    },
    keywords: ['영업일 계산', 'D-day 계산', '날짜 차이', '공휴일 제외', '영업일 더하기'],
    updated: '2026-11-10',
    faq: [
      {
        q: '공휴일은 어떤 기준인가요?',
        a: '한국 법정공휴일과 대체공휴일을 반영합니다. 설날·추석 연휴처럼 여러 날인 공휴일도 포함합니다. 회사 창립일·임시공휴일은 “직접 추가”에 날짜를 넣어 제외하세요.',
      },
      {
        q: '영업일은 어떻게 세나요?',
        a: '월~금 중 공휴일이 아닌 날을 셉니다. 기본은 시작일을 제외하고 종료일을 포함하며, “시작일 포함”을 켜면 시작일도 셉니다.',
      },
      {
        q: '날짜 더하기에서 영업일을 고르면?',
        a: '주말과 공휴일을 건너뛰고 N영업일 뒤(또는 앞)의 날짜를 계산합니다. 예: 금요일에서 1영업일 뒤가 연휴라면 연휴 다음 평일이 됩니다.',
      },
      {
        q: '시간이나 시간대도 계산하나요?',
        a: '아니요. 날짜만 계산하며 시각·시간대는 고려하지 않습니다. 마감 시각이 있는 일정은 별도로 확인하세요.',
      },
    ],
    sources: [
      { label: 'korean-holidays (GitHub)', href: 'https://github.com/ibare/korean-holidays' },
      {
        label: 'korean-lunar-calendar (npm)',
        href: 'https://www.npmjs.com/package/korean-lunar-calendar',
      },
    ],
    related: ['text-counter', 'sheet-viewer', 'qr-generate'],
  },
  {
    slug: 'calculator',
    category: 'utility',
    icon: '🧮',
    title: {
      ko: '계산기',
      en: 'Calculator',
      ja: '電卓',
    },
    summary: {
      ko: '기본 계산기에서 공학 계산기로 바꿔 sin·log·제곱근까지 계산합니다.',
      en: 'A basic calculator that switches to scientific mode for sin, log, and roots.',
      ja: '基本電卓から関数電卓に切り替えて三角関数・対数・平方根まで計算します。',
    },
    description: {
      ko: '사칙연산·퍼센트 기본 계산기와 삼각함수·로그·거듭제곱·팩토리얼 공학 계산기를 한 화면에서 바꿔 씁니다. 키보드 입력과 최근 기록을 지원하고 식은 서버로 보내지 않습니다.',
      en: 'Switch between a basic calculator and a scientific one with trigonometry, logarithms, powers, and factorials. Keyboard input and recent history, all in your browser.',
      ja: '四則演算の基本電卓と、三角関数・対数・累乗・階乗の関数電卓を切り替えて使えます。',
    },
    keywords: ['계산기', '공학용 계산기', '공학 계산기', '온라인 계산기', '사인 코사인 계산'],
    updated: '2026-11-11',
    faq: [
      {
        q: '공학 계산기는 어떻게 켜나요?',
        a: '계산기 위의 "공학"을 누르면 삼각함수·로그·거듭제곱 키가 나타납니다. 마지막으로 고른 종류는 이 브라우저에 기억됩니다.',
      },
      {
        q: 'sin 30이 0.5가 아니라 이상한 값이 나와요.',
        a: '각도 단위가 라디안(Rad)으로 되어 있을 수 있습니다. 공학 키의 Deg/Rad 버튼으로 도(Deg)를 고르세요.',
      },
      {
        q: '1+2×3이 9가 아니라 7로 나와요.',
        a: '곱셈을 덧셈보다 먼저 계산하는 수학 규칙(연산자 우선순위)을 따르기 때문입니다. 누른 순서대로 계산하려면 (1+2)×3처럼 괄호를 쓰세요.',
      },
      {
        q: '계산 기록은 저장되나요?',
        a: '최근 10개가 이 탭에만 보이고, 페이지를 닫으면 사라집니다. 서버나 브라우저 저장소에 남기지 않습니다.',
      },
    ],
    sources: [
      {
        label: 'MDN — Math',
        href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math',
      },
      {
        label: 'MDN — Number.prototype.toPrecision',
        href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toPrecision',
      },
    ],
    related: ['percent-calc', 'unit-convert', 'date-calc'],
  },
  {
    slug: 'percent-calc',
    category: 'utility',
    icon: '％',
    title: {
      ko: '퍼센트·부가세 계산기',
      en: 'Percent & VAT Calculator',
      ja: 'パーセント・付加価値税計算',
    },
    summary: {
      ko: '비율·증감률과 부가세 포함·제외 금액을 계산합니다.',
      en: 'Calculate percentages, change rates, and VAT inclusive or exclusive amounts.',
      ja: '割合・増減率と付加価値税の内税・外税を計算します。',
    },
    description: {
      ko: 'X의 Y%, 비율, 증감률을 계산하고 공급가액에서 부가세를 더하거나 포함 금액에서 역산합니다. 견적·보고서의 숫자를 브라우저에서 바로 확인하세요.',
      en: 'Calculate percentages, ratios, and change rates, or add and reverse 10% VAT. Check quote and report numbers instantly in your browser.',
      ja: '割合・比率・増減率の計算と、付加価値税の加算・逆算に対応します。',
    },
    keywords: ['퍼센트 계산기', '부가세 계산기', '증감률 계산', 'VAT 계산', '비율 계산'],
    updated: '2026-11-10',
    faq: [
      {
        q: '부가세 10%는 어떻게 계산하나요?',
        a: '공급가액 기준이면 공급가액의 10%를 부가세로 더합니다. 부가세 포함 금액이면 금액을 1.1로 나눠 공급가액을 구하고 나머지를 부가세로 계산합니다.',
      },
      {
        q: '1원 차이가 나는 이유는?',
        a: '원 단위 반올림 때문입니다. 이 도구는 포함 금액 기준일 때 합계가 입력값과 정확히 일치하도록 공급가액을 반올림하고 부가세를 나머지로 잡습니다.',
      },
      {
        q: '면세나 간이과세도 계산되나요?',
        a: '세율 0%는 선택할 수 있지만, 면세·영세율·간이과세 판단은 사업 유형에 따라 다릅니다. 세금계산서 발행 전 세무 담당자에게 확인하세요.',
      },
      {
        q: '증감률이 계산되지 않아요.',
        a: '이전 값이 0이면 나눗셈이 불가능해 증감률을 계산할 수 없습니다. 이전 값에 0이 아닌 숫자를 입력하세요.',
      },
    ],
    sources: [
      {
        label: '국세청 — 부가가치세',
        href: 'https://www.nts.go.kr/nts/cm/cntnts/cntntsView.do?mi=2291&cntntsId=7697',
      },
      {
        label: 'MDN — Number.prototype.toFixed',
        href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed',
      },
    ],
    related: ['calculator', 'date-calc', 'unit-convert'],
  },
  {
    slug: 'unit-convert',
    category: 'utility',
    icon: '📐',
    title: {
      ko: '단위 변환기',
      en: 'Unit Converter',
      ja: '単位変換',
    },
    summary: {
      ko: '길이·무게·온도·넓이·부피·데이터·속도를 변환합니다.',
      en: 'Convert length, weight, temperature, area, volume, data, and speed.',
      ja: '長さ・重さ・温度・面積・体積・データ・速度を変換します。',
    },
    description: {
      ko: '길이·무게·온도·넓이·부피·데이터·속도를 서로 변환합니다. 평↔㎡, 인치↔cm, 화씨↔섭씨처럼 업무에서 자주 쓰는 단위를 한 화면에서 확인하세요.',
      en: 'Convert length, weight, temperature, area, volume, data size, and speed, including pyeong to m² and inches to centimeters.',
      ja: '長さ・重さ・温度・面積・体積・データ容量・速度を相互変換します。坪↔㎡など実務でよく使う単位に対応します。',
    },
    keywords: ['단위 변환', '평수 계산', '인치 센치 변환', '화씨 섭씨', '데이터 용량 변환'],
    updated: '2026-11-10',
    faq: [
      {
        q: '1평은 몇 제곱미터인가요?',
        a: '1평은 3.305785㎡입니다. 이 도구는 이 값을 기준으로 평↔㎡를 변환합니다.',
      },
      {
        q: '데이터 용량은 1000 기준인가요, 1024 기준인가요?',
        a: '1024 기준입니다. 1KB=1,024B, 1MB=1,024KB로 계산합니다. 저장장치 제조사의 1000 기준과는 차이가 있습니다.',
      },
      {
        q: '화씨 100도는 섭씨 몇 도인가요?',
        a: '약 37.78°C입니다. 변환 공식은 (화씨 − 32) ÷ 1.8입니다.',
      },
      {
        q: '평·갤런 같은 단위는 지역마다 다른가요?',
        a: '네. 이 도구는 한국 평(3.305785㎡)과 미국 갤런·cup을 사용합니다. 영국 갤런 등 다른 정의가 필요한 경우 별도 확인이 필요합니다.',
      },
    ],
    sources: [
      { label: 'NIST — SI units', href: 'https://www.nist.gov/pml/owm/metric-si/si-units' },
      {
        label: 'MDN — Intl.NumberFormat',
        href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat',
      },
    ],
    related: ['percent-calc', 'date-calc', 'text-counter'],
  },
  {
    slug: 'json-tools',
    category: 'text',
    icon: '{}',
    title: {
      ko: 'JSON 도구',
      en: 'JSON Tools',
      ja: 'JSONツール',
    },
    summary: {
      ko: 'JSON 포맷·압축·검증·비교를 한 화면에서 합니다.',
      en: 'Format, minify, validate, and compare JSON in one place.',
      ja: 'JSONの整形・圧縮・検証・比較を1画面で行います。',
    },
    description: {
      ko: 'JSON을 보기 좋게 포맷하고 압축하며 문법 오류의 행·열 위치를 확인합니다. 두 JSON의 추가·삭제·변경을 경로별로 비교할 수 있습니다.',
      en: 'Format and minify JSON, locate syntax errors by line and column, and compare two JSON documents path by path.',
      ja: 'JSONの整形・圧縮・構文エラー位置の確認・パス別比較に対応します。',
    },
    keywords: ['JSON 포맷터', 'JSON 검증', 'JSON 비교', 'JSON 압축', 'JSON 정렬'],
    updated: '2026-11-10',
    faq: [
      {
        q: '주석이 있는 JSON도 되나요?',
        a: '표준 JSON은 주석을 허용하지 않아 오류로 표시됩니다. JSON5·JSONC는 지원하지 않습니다.',
      },
      {
        q: '키 정렬은 중첩 객체에도 적용되나요?',
        a: '네. 모든 객체의 키를 알파벳순으로 정렬합니다. 배열 순서는 유지합니다.',
      },
      {
        q: '비교 결과는 어떻게 보나요?',
        a: '+는 추가, -는 삭제, ~는 변경이며 경로와 이전·이후 값을 보여줍니다. 최대 300개 차이까지 표시합니다.',
      },
      {
        q: '오류 위치가 정확한가요?',
        a: '브라우저 JSON 파서가 알려주는 위치를 기준으로 행·열을 계산합니다. 일부 오류는 위치가 다를 수 있습니다.',
      },
    ],
    sources: [
      {
        label: 'MDN — JSON.parse',
        href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse',
      },
      { label: 'RFC 8259 — JSON', href: 'https://www.rfc-editor.org/rfc/rfc8259' },
    ],
    related: ['csv-json', 'text-convert', 'text-cleanup'],
  },
  {
    slug: 'qr-reader',
    category: 'utility',
    icon: '🏷️',
    title: {
      ko: 'QR·바코드 읽기',
      en: 'QR & Barcode Reader',
      ja: 'QR・バーコード読み取り',
    },
    summary: {
      ko: '이미지나 카메라로 QR·바코드를 인식합니다.',
      en: 'Read QR codes and barcodes from images or a camera.',
      ja: '画像やカメラからQR・バーコードを読み取ります。',
    },
    description: {
      ko: '이미지 또는 카메라로 QR 코드와 바코드를 인식해 텍스트·링크를 추출합니다. 링크는 http·https만 열 수 있고, 카메라 영상은 서버로 전송되지 않습니다.',
      en: 'Read QR codes and barcodes from images or your camera. Only http(s) links can be opened; camera frames never leave your device.',
      ja: '画像やカメラからQR・バーコードを読み取り、テキストやリンクを抽出します。カメラ映像は送信されません。',
    },
    keywords: ['QR 코드 읽기', '바코드 스캔', 'QR 스캔', '이미지 QR 인식', '카메라 QR'],
    updated: '2026-11-14',
    faq: [
      {
        q: '카메라 권한이 필요하나요?',
        a: '카메라로 읽을 때만 브라우저 권한이 필요합니다. 영상은 기기 안에서만 처리되고 서버로 전송되지 않습니다. 권한을 거부하면 이미지 선택으로 사용하세요.',
      },
      {
        q: '바코드가 인식되지 않습니다.',
        a: 'Safari·Firefox를 포함한 주요 브라우저에서 EAN·UPC·Code 128 같은 바코드를 읽습니다. 그래도 안 되면 바코드가 화면을 가로로 가득 채우게 찍고, 빛 반사와 흔들림이 없는지 확인하세요.',
      },
      {
        q: '모르는 QR 링크를 열어도 안전한가요?',
        a: '인식된 링크는 http·https만 “링크 열기”로 열립니다. 열기 전에 주소를 확인하고, 개인정보 입력을 요구하는 페이지는 주의하세요.',
      },
      {
        q: 'WiFi·명함 QR도 만들 수 있나요?',
        a: '네. 종류에서 WiFi·명함(vCard)·이메일·전화·SMS를 고르면 필요한 항목만 입력해 QR을 만들 수 있습니다.',
      },
      {
        q: '인식 기록이 저장되나요?',
        a: '최근 인식 목록은 현재 페이지 메모리에만 남고, 새로고침하면 사라집니다. 브라우저 저장소에 기록하지 않습니다.',
      },
    ],
    sources: [
      { label: 'zxing-wasm (GitHub)', href: 'https://github.com/Sec-ant/zxing-wasm' },
      {
        label: 'MDN — BarcodeDetector',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector',
      },
    ],
    related: ['qr-generate', 'image-ocr', 'image-crop'],
  },
  {
    slug: 'image-compress',
    category: 'image',
    icon: '🖼️',
    title: {
      ko: '이미지 압축',
      en: 'Compress Image',
      ja: '画像圧縮',
    },
    summary: {
      ko: '여러 장의 사진·스캔본을 한 번에 압축합니다.',
      en: 'Compress multiple images at once with adjustable quality.',
      ja: '複数の写真・スキャンをまとめて圧縮します。',
    },
    description: {
      ko: 'JPG·PNG·WebP 이미지를 여러 장 한 번에 압축합니다. 화질·최대 크기·출력 형식을 지정하고, 파일별 절감률을 확인한 뒤 ZIP으로 받으세요. 파일은 서버로 전송되지 않습니다.',
      en: 'Compress multiple JPG, PNG, and WebP images at once. Set quality, max size, and format, compare per-file savings, and download a ZIP. No uploads.',
      ja: 'JPG・PNG・WebPを複数まとめて圧縮。画質・最大サイズ・形式を指定し、ファイルごとの削減率を確認してZIPで保存できます。',
    },
    keywords: ['이미지 압축', '사진 용량 줄이기', 'JPG 압축', 'PNG 압축', '웹용 이미지 최적화'],
    updated: '2026-11-14',
    faq: [
      {
        q: '원본 화질이 유지되나요?',
        a: '압축은 이미지를 다시 인코딩하는 방식이라 원본과 화질이 완전히 같지는 않습니다. 화질 80~90%면 문서·사진 모두 육안 차이가 작고 용량은 크게 줄어듭니다. 원본 파일은 덮어쓰지 않으니 안심하세요.',
      },
      {
        q: '투명한 PNG를 압축하면 배경이 검게 나옵니다.',
        a: 'JPEG는 투명도를 지원하지 않아 투명 영역이 검게 채워질 수 있습니다. 이 도구는 투명 영역을 흰색으로 채웁니다. 투명도를 유지하려면 출력 형식을 WebP나 PNG로 선택하세요.',
      },
      {
        q: '여러 장을 한 번에 압축할 수 있나요?',
        a: '네. 최대 20장, 전체 50MB까지 한 번에 압축합니다. 결과가 여러 개면 ZIP으로 묶여 내려받고, 파일별 원본·압축 후 용량과 절감률을 표시합니다.',
      },
      {
        q: '휴대폰 사진이 돌아가 보입니다.',
        a: 'EXIF 회전 정보를 읽어 바로 세워서 처리합니다. 그래도 일부 오래된 형식은 회전이 맞지 않을 수 있으니 결과 미리보기를 확인하세요.',
      },
    ],
    sources: [
      {
        label: 'jSquash — MozJPEG·OxiPNG·libwebp (GitHub)',
        href: 'https://github.com/jamsinclair/jSquash',
      },
      {
        label: 'MDN — Canvas API',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API',
      },
      {
        label: 'MDN — 이미지 파일 형식',
        href: 'https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types',
      },
    ],
    related: ['image-convert', 'image-crop', 'image-mosaic'],
  },
  {
    slug: 'text-counter',
    category: 'text',
    icon: '🔤',
    title: {
      ko: '글자수 세기',
      en: 'Character Counter',
      ja: '文字数カウント',
    },
    summary: {
      ko: '공백 포함·제외 글자수와 단어·바이트를 즉시 셉니다.',
      en: 'Count characters with and without spaces, words, and bytes.',
      ja: '空白あり・なしの文字数、単語数、バイト数を即時に数えます。',
    },
    description: {
      ko: '공백 포함·제외 글자수, 단어수, 문장수, UTF-8 바이트를 실시간으로 계산합니다. 보고서·자기소개서·SNS 글자수 제한 확인에 쓰세요. 입력한 텍스트는 서버로 전송되지 않습니다.',
      en: 'Count characters with and without spaces, words, sentences, and UTF-8 bytes in real time. Nothing is sent to a server.',
      ja: '空白あり・なしの文字数、単語数、文数、UTF-8バイト数をリアルタイムで計算します。入力内容はサーバーに送信されません。',
    },
    keywords: ['글자수 세기', '글자수 계산기', '단어수', '공백 제외 글자수', '바이트 계산'],
    updated: '2026-11-10',
    faq: [
      {
        q: '공백 제외 글자수는 어떻게 세나요?',
        a: '스페이스, 탭, 줄바꿈을 모두 제외하고 유니코드 문자 단위로 셉니다. 이모지는 플랫폼에 따라 1~2자로 계산될 수 있어, 제출 직전에는 그 사이트의 카운터로 한 번 더 확인하는 것이 안전합니다.',
      },
      {
        q: '바이트 수는 어떤 기준인가요?',
        a: 'UTF-8 인코딩 기준입니다. 한글은 글자당 3바이트, 영문·숫자는 1바이트, 이모지는 4바이트로 계산됩니다. 일부 시스템은 EUC-KR(한글 2바이트)을 쓰므로 지원하려는 곳의 기준을 확인하세요.',
      },
      {
        q: '줄바꿈도 글자수에 포함되나요?',
        a: '공백 포함 글자수에는 포함되고, 공백 제외 글자수에는 포함되지 않습니다. 줄 수는 별도로 표시합니다.',
      },
    ],
    sources: [
      {
        label: 'Unicode Standard',
        href: 'https://www.unicode.org/standard/standard.html',
      },
    ],
    related: ['image-convert', 'image-crop', 'image-mosaic'],
  },
  {
    slug: 'text-cleanup',
    category: 'text',
    icon: '🧹',
    title: {
      ko: '텍스트 정리',
      en: 'Text Cleanup',
      ja: 'テキスト整理',
    },
    summary: {
      ko: '줄 정렬·중복 제거·빈 줄·번호 매기기를 한 번에 합니다.',
      en: 'Sort lines, remove duplicates and blanks, and add numbering.',
      ja: '行の並べ替え・重複削除・空行整理・番号付けをまとめて行います。',
    },
    description: {
      ko: '줄 단위 텍스트의 앞뒤 공백·빈 줄·중복을 정리하고 가나다순·길이순으로 정렬하거나 번호·불릿을 붙입니다. 입력한 내용은 서버로 전송되지 않습니다.',
      en: 'Clean line-based text: trim spaces, remove blank and duplicate lines, sort alphabetically or by length, and add numbers or bullets. Nothing is uploaded.',
      ja: '行単位のテキストから空白・空行・重複を整理し、並べ替えや番号・箇条書きを追加します。入力は送信されません。',
    },
    keywords: ['텍스트 정리', '줄 정렬', '중복 줄 제거', '빈 줄 제거', '번호 매기기'],
    updated: '2026-11-10',
    faq: [
      {
        q: '중복 제거는 대소문자를 구분하나요?',
        a: '구분합니다. Apple과 apple은 다른 줄로 봅니다. 대소문자를 통일하려면 먼저 텍스트 변환 도구로 소문자로 바꾼 뒤 정리하세요.',
      },
      {
        q: '표 데이터도 정리할 수 있나요?',
        a: '줄 단위로만 처리하므로 CSV의 행 순서를 바꾸는 용도로는 쓸 수 있지만, 열 정렬·필터는 지원하지 않습니다. 표는 CSV 뷰어나 CSV 변환 도구를 사용하세요.',
      },
      {
        q: '정렬 순서가 이상해요.',
        a: '한국어 로캘 기준으로 정렬합니다. 숫자와 영문이 섞이면 사전순으로 처리되므로 2가 10보다 뒤에 올 수 있습니다.',
      },
      {
        q: '결과를 다시 되돌릴 수 있나요?',
        a: '원본은 자동 저장되지 않습니다. “결과를 원본으로”를 누르면 현재 결과가 입력으로 들어가므로, 필요하면 먼저 복사해 두세요.',
      },
    ],
    sources: [
      {
        label: 'MDN — Array.prototype.sort',
        href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort',
      },
      {
        label: 'MDN — Intl.Collator',
        href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator',
      },
    ],
    related: ['text-counter', 'text-convert', 'csv-json'],
  },
  {
    slug: 'text-diff',
    category: 'text',
    icon: '🔍',
    title: {
      ko: '텍스트 비교',
      en: 'Compare Text',
      ja: 'テキスト比較',
    },
    summary: {
      ko: '두 텍스트의 바뀐 줄을 색으로 표시합니다.',
      en: 'Highlight changed lines between two versions of text.',
      ja: '2つのテキストの変更行を色で表示します。',
    },
    description: {
      ko: '수정 전후 텍스트를 줄 단위로 비교해 추가·삭제·변경된 줄을 색으로 보여 줍니다. 공백·대소문자 무시 옵션과 TXT 저장을 지원하며 입력한 내용은 서버로 전송되지 않습니다.',
      en: 'Compare two versions of text line by line and highlight added, removed, and changed lines. Ignore whitespace or case, then copy or download the result. Nothing is uploaded.',
      ja: '修正前後のテキストを行単位で比較し、追加・削除・変更された行を色で表示します。空白・大文字小文字の無視やTXT保存に対応し、入力内容は送信されません。',
    },
    keywords: ['텍스트 비교', '문서 비교', '줄 비교', 'diff', '수정 전후 비교'],
    updated: '2026-11-12',
    faq: [
      {
        q: '워드나 한글 문서를 그대로 올릴 수 있나요?',
        a: '이 도구는 텍스트를 직접 붙여넣는 방식입니다. 워드·한글 문서는 텍스트를 복사해 붙여넣거나, PDF라면 PDF 텍스트 비교 도구를 사용하세요. 표·이미지·서식은 비교하지 않습니다.',
      },
      {
        q: '한 줄만 바꿨는데 그 줄 전체가 변경으로 보여요.',
        a: '줄 단위로 비교하기 때문입니다. 한 줄 안에서 단어 하나만 바뀌어도 그 줄 전체를 변경으로 표시합니다. 단어 단위 비교는 결과를 더 정밀하게 보여 줄 때 추가할 예정입니다.',
      },
      {
        q: '공백 무시는 정확히 무엇을 무시하나요?',
        a: '줄 앞뒤 공백과 줄 안의 연속 공백을 하나로 줄여 비교합니다. 탭도 공백으로 취급합니다. 줄바꿈은 줄을 나누는 기준이므로 무시하지 않습니다.',
      },
      {
        q: '큰 문서도 비교할 수 있나요?',
        a: '한 번에 20,000줄까지 입력할 수 있고, 5,000줄 정도의 일반 문서는 빠르게 처리합니다. 완전히 다른 큰 문서는 화면이 멈추지 않도록 전체 삭제·추가로 표시할 수 있습니다.',
      },
    ],
    sources: [
      {
        label: 'An O(ND) Difference Algorithm and Its Variations — Myers (1986)',
        href: 'https://link.springer.com/article/10.1007/BF01840446',
      },
      {
        label: 'Wikipedia — Diff algorithm',
        href: 'https://en.wikipedia.org/wiki/Diff_algorithm',
      },
    ],
    related: ['text-cleanup', 'text-convert', 'pdf-diff'],
  },
  {
    slug: 'text-convert',
    category: 'text',
    icon: '🔤',
    title: {
      ko: '텍스트 변환',
      en: 'Text Converter',
      ja: 'テキスト変換',
    },
    summary: {
      ko: '대소문자·camelCase·Base64·URL·HTML 엔티티를 변환합니다.',
      en: 'Convert case, Base64, URL encoding, and HTML entities.',
      ja: '大文字小文字・Base64・URL・HTMLエンティティを変換します。',
    },
    description: {
      ko: '텍스트를 대문자·소문자·camelCase·snake_case로 바꾸고 Base64·URL·HTML 엔티티를 인코딩·디코딩합니다. 한글과 이모지도 UTF-8 기준으로 안전하게 처리합니다.',
      en: 'Change text case to camelCase or snake_case, and encode or decode Base64, URL, and HTML entities. Korean and emoji are handled as UTF-8.',
      ja: '大文字小文字・camelCase・snake_caseの変換と、Base64・URL・HTMLエンティティのエンコード/デコードに対応します。',
    },
    keywords: ['텍스트 변환', '대소문자 변환', 'Base64 변환', 'URL 인코딩', 'HTML 엔티티'],
    updated: '2026-11-10',
    faq: [
      {
        q: '한글 Base64도 정상적으로 되나요?',
        a: '네. UTF-8 바이트 기준으로 인코딩·디코딩하므로 한글과 이모지도 원래 문자열로 되돌릴 수 있습니다.',
      },
      {
        q: 'Base64는 암호화인가요?',
        a: '아니요. 누구나 되돌릴 수 있는 인코딩입니다. 비밀번호·토큰을 숨기는 용도로 쓰지 마세요.',
      },
      {
        q: 'HTML 엔티티 변환은 모든 태그를 정리하나요?',
        a: '아니요. 특수문자와 숫자 엔티티만 변환합니다. 사용자 입력 HTML을 안전하게 정화하려면 별도의 검증 라이브러리가 필요합니다.',
      },
      {
        q: 'camelCase 변환에서 한글은 어떻게 되나요?',
        a: '공백과 특수문자를 기준으로 단어를 나눈 뒤 이어 붙입니다. 한글에는 대소문자가 없어 그대로 연결됩니다.',
      },
    ],
    sources: [
      {
        label: 'MDN — TextEncoder',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder',
      },
      {
        label: 'MDN — encodeURIComponent',
        href: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent',
      },
    ],
    related: ['text-cleanup', 'text-counter', 'qr-generate'],
  },
  {
    slug: 'qr-generate',
    category: 'utility',
    icon: '🔳',
    title: {
      ko: 'QR 코드 만들기',
      en: 'QR Code Generator',
      ja: 'QRコード作成',
    },
    summary: {
      ko: '링크·텍스트를 QR로 만들고 PNG로 저장합니다.',
      en: 'Turn a link or text into a QR code and save it as PNG.',
      ja: 'リンクやテキストをQRコードにしてPNGで保存します。',
    },
    description: {
      ko: 'URL이나 텍스트를 QR 코드로 만들고 PNG·SVG로 내려받으세요. 오류 정정 수준과 크기를 조절할 수 있고, 넣은 내용은 이 브라우저 밖으로 나가지 않습니다. 회의 자료·명함·안내문에 바로 붙여넣기 좋습니다.',
      en: 'Create a QR code from a URL or text and download it as PNG or SVG. Adjust size and error correction. Nothing is uploaded.',
      ja: 'URLやテキストからQRコードを作成し、PNG・SVGで保存できます。サイズと誤り訂正レベルを調整可能。入力は送信されません。',
    },
    keywords: ['QR 코드 만들기', 'QR 생성기', 'WiFi QR', '명함 QR', 'vCard QR', '이메일 QR'],
    updated: '2026-11-10',
    faq: [
      {
        q: '인쇄해도 깨지지 않나요?',
        a: 'PNG는 1024px로 저장되고, SVG는 확대해도 깨지지 않습니다. 인쇄물에는 SVG를 권장합니다.',
      },
      {
        q: '스캔이 잘 안 됩니다.',
        a: 'QR 주변에 충분한 여백을 두고, 인쇄물과 배경의 대비를 높이세요. 오류 정정 수준을 높이면 일부가 가려져도 인식됩니다.',
      },
      {
        q: '입력한 링크가 저장되나요?',
        a: '아니요. QR 생성은 브라우저에서만 이루어지며 서버에 기록을 남기지 않습니다. 다만 QR에 담긴 내용은 스캔하는 사람에게 그대로 보입니다.',
      },
    ],
    sources: [
      { label: 'DENSO WAVE — QR 코드 개요', href: 'https://www.qrcode.com/en/about/' },
      { label: 'qrcode npm 패키지', href: 'https://www.npmjs.com/package/qrcode' },
    ],
    related: ['text-counter', 'image-compress'],
  },
  {
    slug: 'pdf-protect',
    category: 'document',
    icon: '🔒',
    title: { ko: 'PDF 암호 걸기', en: 'Protect PDF' },
    summary: {
      ko: 'PDF에 열기 암호를 걸고 인쇄·복사·수정을 막습니다.',
      en: 'Add an open password to a PDF and restrict printing, copying, or editing.',
    },
    description: {
      ko: 'PDF에 열기 암호를 걸어 AES-256으로 암호화하고, 필요하면 인쇄·내용 복사·수정을 막습니다. 급여명세서·계약서를 보내기 전에 쓰세요. 파일은 서버로 보내지 않습니다.',
      en: 'Encrypt a PDF with AES-256 and an open password, optionally blocking printing, copying, and editing. Runs entirely in your browser.',
    },
    keywords: [
      'PDF 암호 걸기',
      'PDF 비밀번호 설정',
      'PDF 암호화',
      'PDF 잠금',
      'PDF 복사 방지',
      'protect pdf',
    ],
    updated: '2026-11-11',
    faq: [
      {
        q: '어떤 방식으로 암호화하나요?',
        a: 'AES-256으로 암호화합니다. Adobe Acrobat 9 이후의 PDF 뷰어, 크롬·엣지·사파리 같은 브라우저에서 암호를 넣으면 열 수 있습니다.',
      },
      {
        q: '암호를 잊어버리면 어떻게 하나요?',
        a: '옷깃은 암호를 저장하지 않아 되찾을 수 없습니다. 암호를 걸기 전 원본 PDF를 보관하고, 암호는 따로 적어 두세요.',
      },
      {
        q: '인쇄·복사 금지는 확실히 막히나요?',
        a: 'PDF 표준의 사용 권한 표시로, 대부분의 뷰어가 지킵니다. 다만 모든 프로그램이 따르지는 않으므로 중요한 문서는 열기 암호와 함께 쓰세요.',
      },
      {
        q: '이미 암호가 걸린 PDF에 다시 걸 수 있나요?',
        a: '먼저 PDF 암호 풀기로 암호를 푼 뒤 새 암호를 거세요. 두 겹으로 걸지는 않습니다.',
      },
    ],
    sources: [
      { label: 'ISO 32000-2 — PDF 2.0 (암호화)', href: 'https://www.iso.org/standard/75839.html' },
      { label: '@cantoo/pdf-lib', href: 'https://github.com/cantoo-scribe/pdf-lib' },
    ],
    related: ['pdf-unlock', 'pdf-metadata', 'pdf-redact'],
  },
  {
    slug: 'pdf-unlock',
    category: 'document',
    icon: '🔓',
    title: { ko: 'PDF 암호 풀기', en: 'Unlock PDF' },
    summary: {
      ko: '알고 있는 암호로 PDF를 열어 암호 없는 PDF로 저장합니다.',
      en: 'Open a PDF with its password and save a copy without the password.',
    },
    description: {
      ko: '열 때마다 암호를 묻는 PDF를 알고 있는 암호로 열어 암호 없는 PDF로 저장합니다. 인쇄·복사 제한만 걸린 PDF는 바로 풉니다. 화질 손실 없이 브라우저에서 처리합니다.',
      en: 'Remove the password from a PDF you can open, or lift print/copy restrictions, without quality loss. Runs entirely in your browser.',
    },
    keywords: [
      'PDF 암호 풀기',
      'PDF 비밀번호 해제',
      'PDF 암호 제거',
      'PDF 잠금 해제',
      'PDF 인쇄 제한 해제',
      'unlock pdf',
    ],
    updated: '2026-11-11',
    faq: [
      {
        q: '암호를 몰라도 풀 수 있나요?',
        a: '아니요. 열기 암호가 걸린 PDF는 그 암호를 알아야 풉니다. 암호를 추측하거나 깨뜨리는 기능은 없습니다.',
      },
      {
        q: '인쇄만 막힌 PDF도 되나요?',
        a: '열기 암호 없이 인쇄·복사 같은 사용 제한만 걸린 PDF는 암호를 묻지 않고 바로 제한을 풉니다.',
      },
      {
        q: '화질이나 글자가 바뀌나요?',
        a: '쪽을 다시 그리지 않고 그대로 옮기므로 화질이 같고, 글자 검색·복사도 원본처럼 됩니다. 책갈피와 양식 입력칸은 빠질 수 있습니다.',
      },
    ],
    sources: [
      { label: 'ISO 32000-2 — PDF 2.0 (암호화)', href: 'https://www.iso.org/standard/75839.html' },
      { label: '@cantoo/pdf-lib', href: 'https://github.com/cantoo-scribe/pdf-lib' },
    ],
    related: ['pdf-protect', 'pdf-merge', 'pdf-compress'],
  },
  {
    slug: 'id-photo',
    category: 'image',
    icon: '🪪',
    title: { ko: '증명사진 만들기', en: 'ID Photo Maker' },
    summary: {
      ko: '사진을 반명함·여권 규격에 맞춰 자르고 4×6 인화지에 배치합니다.',
      en: 'Fit a photo to passport or ID sizes and lay it out on a 4×6 print.',
    },
    description: {
      ko: '사진을 반명함 3×4cm, 여권 3.5×4.5cm 같은 증명사진 규격에 맞춰 자르고 300dpi JPG로 저장합니다. 4×6 인화지에 여러 장 배치해 출력할 수도 있으며, 사진은 서버로 보내지 않습니다.',
      en: 'Crop a photo to standard ID sizes (3×4cm, 3.5×4.5cm, 2×2in) at 300dpi, or tile it on a 4×6 print. Runs in your browser.',
    },
    keywords: [
      '증명사진 만들기',
      '반명함 사진',
      '여권사진 규격',
      '증명사진 크기',
      '증명사진 인화',
      'id photo',
    ],
    updated: '2026-11-11',
    faq: [
      {
        q: '배경을 지워 주나요?',
        a: '원래 배경을 지우지는 않습니다. 사진을 작게 줄여 틀에 빈 곳이 생기면 그 부분만 고른 배경색으로 채웁니다. 밝은 단색 벽 앞에서 찍은 사진을 쓰세요.',
      },
      {
        q: '인쇄하면 실제 크기로 나오나요?',
        a: '300dpi 정보를 넣어 저장하므로 인쇄 설정에서 "실제 크기(100%)"를 고르면 규격 크기 그대로 나옵니다.',
      },
      {
        q: '4×6 인화지에는 몇 장 들어가나요?',
        a: '반명함 3×4cm는 9장, 여권 3.5×4.5cm는 6장, 명함판 5×7cm는 2장이 들어갑니다.',
      },
      {
        q: '여권 사진 규정에 맞는지 확인해 주나요?',
        a: '크기와 비율만 맞춥니다. 얼굴 크기, 배경색, 안경 반사 같은 세부 규정은 제출 기관의 최신 안내를 확인하세요.',
      },
    ],
    sources: [
      {
        label: '외교부 여권안내 — 여권 사진 규정',
        href: 'https://www.passport.go.kr/home/kor/contents.do?menuPos=50',
      },
      {
        label: 'U.S. Department of State — Photo Requirements',
        href: 'https://travel.state.gov/content/travel/en/passports/how-apply/photos.html',
      },
    ],
    related: ['image-crop', 'image-resize', 'image-dpi'],
  },
  {
    slug: 'doc-scanner',
    category: 'document',
    icon: '📄',
    title: { ko: '문서 스캐너', en: 'Document Scanner' },
    summary: {
      ko: '찍은 문서 사진의 모서리를 맞추면 반듯하게 펴서 PDF로 만듭니다.',
      en: 'Line up the corners of a document photo to flatten it into a clean PDF.',
    },
    description: {
      ko: '휴대폰이나 PC로 찍은 문서 사진에서 네 모서리를 손가락·마우스로 맞추면 비스듬한 사진을 반듯하게 펴고 그림자를 지워 PDF로 만듭니다. 설치·로그인 없이 쓰고, 사진은 서버로 보내지 않습니다.',
      en: 'Drag four corners on a document photo to straighten it, clean the background, and save a PDF. No app, no sign-in, no upload.',
    },
    keywords: [
      '문서 스캐너',
      '휴대폰 스캔 PDF',
      '사진 PDF 변환',
      '스캔 앱 대체',
      '오피스 렌즈 대체',
      'document scanner',
    ],
    updated: '2026-11-11',
    faq: [
      {
        q: '앱을 설치해야 하나요?',
        a: '설치나 로그인 없이 브라우저에서 바로 씁니다. 휴대폰에서 "카메라로 찍기"를 누르면 기본 카메라가 열립니다.',
      },
      {
        q: '모서리를 자동으로 찾아 주나요?',
        a: '지금은 손가락이나 마우스로 네 점을 맞춥니다. 끄는 동안 돋보기가 떠서 정확히 맞출 수 있습니다.',
      },
      {
        q: '여러 장을 한 PDF로 만들 수 있나요?',
        a: '쪽 추가로 최대 40쪽까지 넣고 순서를 바꾼 뒤 한 PDF로 저장합니다. JPG로 받으면 여러 장은 ZIP으로 묶습니다.',
      },
      {
        q: 'PDF에서 글자를 검색할 수 있나요?',
        a: '스캔 결과는 사진으로 된 PDF입니다. 글자 검색이 필요하면 만든 PDF를 PDF 글자 인식 도구에 넣으세요.',
      },
    ],
    sources: [
      {
        label: 'Hartley & Zisserman — Multiple View Geometry (사영 변환)',
        href: 'https://www.robots.ox.ac.uk/~vgg/hzbook/',
      },
      {
        label: 'MDN — HTML capture 속성',
        href: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/capture',
      },
    ],
    related: ['jpg-to-pdf', 'pdf-ocr', 'pdf-compress'],
  },
  {
    slug: 'gif-maker',
    category: 'image',
    icon: '🎞️',
    title: { ko: 'GIF 만들기', en: 'GIF Maker' },
    summary: {
      ko: '사진 여러 장이나 짧은 MP4 영상을 움직이는 GIF로 만듭니다.',
      en: 'Turn several photos or a short MP4 clip into an animated GIF.',
    },
    description: {
      ko: '사진 여러 장을 순서대로 이어 붙이거나 MP4·WebM 영상의 원하는 구간을 골라 움직이는 GIF로 만듭니다. 크기·속도·반복을 정할 수 있고, 파일은 서버로 보내지 않습니다.',
      en: 'Make an animated GIF from multiple images or a section of an MP4/WebM video. Choose size, speed, and looping. Runs in your browser.',
    },
    keywords: ['GIF 만들기', '움짤 만들기', 'MP4 GIF 변환', '동영상 GIF', '사진 GIF', 'gif maker'],
    updated: '2026-11-11',
    faq: [
      {
        q: '영상은 얼마나 길게 바꿀 수 있나요?',
        a: '한 번에 최대 15초 구간, 150프레임까지 만듭니다. GIF는 용량이 금방 커져서 메신저·게시판에 올리기 좋은 짧은 구간을 권합니다.',
      },
      {
        q: '소리도 들어가나요?',
        a: 'GIF 형식에는 소리가 들어가지 않습니다. 소리가 필요하면 영상 그대로 올리세요.',
      },
      {
        q: 'GIF 용량이 너무 커요.',
        a: '가로 크기를 320px로 줄이고, 영상은 초당 장면 수를 5로 낮추거나 구간을 짧게 고르세요. 가로 크기가 용량에 가장 크게 영향을 줍니다.',
      },
      {
        q: '아이폰 영상(MOV)도 되나요?',
        a: '사파리에서는 대부분 열리지만 다른 브라우저에서는 열리지 않을 수 있습니다. 그럴 땐 MP4로 저장한 뒤 넣어 주세요.',
      },
    ],
    sources: [
      { label: 'gifenc (MIT)', href: 'https://github.com/mattdesl/gifenc' },
      {
        label: 'W3C — GIF89a Specification',
        href: 'https://www.w3.org/Graphics/GIF/spec-gif89a.txt',
      },
    ],
    related: ['image-collage', 'image-resize', 'image-compress'],
  },
  {
    slug: 'pdf-grayscale',
    category: 'document',
    icon: '🖨️',
    title: { ko: 'PDF 흑백 변환', en: 'Grayscale PDF' },
    summary: {
      ko: '컬러 PDF를 회색조나 흑백 두 색 PDF로 바꿉니다.',
      en: 'Convert a color PDF to grayscale or pure black and white.',
    },
    description: {
      ko: '컬러 PDF를 회색조 또는 흑백 두 색 PDF로 바꿉니다. 흑백 인쇄 전 미리 보기, 흑백 제출 요구, 컬러 스캔본 정리에 쓰세요. 쪽 크기는 그대로이고 파일은 서버로 보내지 않습니다.',
      en: 'Turn a color PDF into grayscale or two-tone black and white while keeping page sizes. Runs entirely in your browser.',
    },
    keywords: [
      'PDF 흑백 변환',
      'PDF 흑백',
      'PDF 회색조',
      '컬러 PDF 흑백으로',
      'PDF 흑백 인쇄',
      'grayscale pdf',
    ],
    updated: '2026-11-11',
    faq: [
      {
        q: '글자 검색이 되나요?',
        a: '쪽을 그림으로 그린 뒤 바꾸므로 결과에서는 글자 선택·검색이 되지 않습니다. 필요하면 결과 PDF를 PDF OCR에 넣어 글자층을 다시 만드세요.',
      },
      {
        q: '회색조와 흑백 두 색은 뭐가 다른가요?',
        a: '회색조는 명암을 살려 사진·도표에 알맞고, 흑백 두 색은 흰색과 검은색만 남겨 글자 위주 스캔본을 또렷하고 가볍게 만듭니다.',
      },
      {
        q: '용량이 오히려 커졌어요.',
        a: '글자만 있는 PDF는 원래 아주 가벼워서 그림으로 바꾸면 커질 수 있습니다. 화질을 "작게"로 고르거나 흑백 두 색을 쓰세요.',
      },
    ],
    sources: [
      { label: 'PDF.js', href: 'https://mozilla.github.io/pdf.js/' },
      { label: 'ITU-R BT.601 — 밝기 계산 계수', href: 'https://www.itu.int/rec/R-REC-BT.601' },
    ],
    related: ['pdf-compress', 'pdf-ocr', 'pdf-to-jpg'],
  },
  {
    slug: 'image-compare',
    category: 'image',
    icon: '🔍',
    title: { ko: '이미지 비교', en: 'Compare Images' },
    summary: {
      ko: '두 이미지를 겹쳐 밀어 보거나 달라진 곳을 빨갛게 표시합니다.',
      en: 'Compare two images with a slider or highlight the pixels that differ.',
    },
    description: {
      ko: '두 이미지를 겹쳐 슬라이더로 전후를 비교하거나, 달라진 픽셀을 빨갛게 표시해 다른 곳을 찾습니다. 디자인 수정본·보정 전후·압축 화질 확인에 쓰고, 이미지는 서버로 보내지 않습니다.',
      en: 'Compare two images side by side, with a before/after slider, or by highlighting changed pixels. Runs entirely in your browser.',
    },
    keywords: [
      '이미지 비교',
      '사진 비교',
      '다른 그림 찾기',
      '이미지 차이',
      '전후 비교',
      'image diff',
    ],
    updated: '2026-11-11',
    faq: [
      {
        q: '크기가 다른 이미지도 비교되나요?',
        a: '두 번째 이미지를 첫 번째 이미지 크기에 맞춰 늘리거나 줄여서 비교합니다. 비율이 다르면 모양이 달라질 수 있어 안내를 보여 줍니다.',
      },
      {
        q: '화면 전체가 빨갛게 나와요.',
        a: 'JPG로 다시 저장한 이미지는 눈에 안 보이는 작은 색 차이가 곳곳에 생깁니다. 민감도를 낮추면 의미 있는 차이만 남습니다.',
      },
      {
        q: '비교 결과를 저장할 수 있나요?',
        a: '"지금 화면 PNG로 저장"을 누르면 슬라이더·차이 강조·나란히 중 지금 보고 있는 화면을 PNG로 내려받습니다.',
      },
    ],
    sources: [
      {
        label: 'MDN — ImageData',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/ImageData',
      },
    ],
    related: ['image-compress', 'image-filter', 'image-info'],
  },
  {
    slug: 'image-colors',
    category: 'image',
    icon: '🎨',
    title: { ko: '이미지 색 추출', en: 'Image Color Picker' },
    summary: {
      ko: '사진·로고의 대표 색을 뽑아 HEX·RGB 코드로 알려 줍니다.',
      en: 'Extract a color palette from an image and copy HEX, RGB, or HSL codes.',
    },
    description: {
      ko: '사진·로고·스크린샷에서 많이 쓰인 대표 색을 뽑아 HEX·RGB·HSL 코드로 보여 줍니다. 이미지를 눌러 한 점의 색을 집을 수도 있고, 누르면 바로 복사됩니다. 서버로 보내지 않습니다.',
      en: 'Pull the main colors from a photo, logo, or screenshot, or pick any pixel, and copy HEX/RGB/HSL codes. Runs in your browser.',
    },
    keywords: [
      '이미지 색 추출',
      '색상 코드 찾기',
      '사진 색 추출',
      '로고 색상 코드',
      '컬러 팔레트 추출',
      'color picker',
    ],
    updated: '2026-11-11',
    faq: [
      {
        q: '로고 색이 조금 다르게 나와요.',
        a: '대표 색은 비슷한 색을 묶어 평균을 낸 값입니다. 정확한 한 점의 색이 필요하면 이미지를 직접 눌러 그 픽셀의 색을 집으세요.',
      },
      {
        q: 'PPT나 엑셀에서 쓰려면 어떤 코드를 쓰나요?',
        a: '파워포인트는 HEX(#1E7F8C)를, 엑셀·워드의 사용자 지정 색은 RGB 숫자 세 개를 넣으면 됩니다.',
      },
      {
        q: '투명한 배경은 어떻게 되나요?',
        a: 'PNG의 투명한 부분은 대표 색을 셀 때 빼므로 배경 때문에 흰색·검은색이 끼어들지 않습니다.',
      },
    ],
    sources: [
      {
        label: 'Heckbert (1982) — Color Image Quantization (Median Cut)',
        href: 'https://dl.acm.org/doi/10.1145/965145.801294',
      },
      { label: 'W3C — CSS Color Module Level 4', href: 'https://www.w3.org/TR/css-color-4/' },
    ],
    related: ['image-filter', 'image-compare', 'image-info'],
  },
  {
    slug: 'file-rename',
    category: 'utility',
    icon: '🏷️',
    title: { ko: '파일 이름 일괄 변경', en: 'Batch Rename Files' },
    summary: {
      ko: '여러 파일 이름에 순번·날짜를 붙이고 글자를 한 번에 바꿉니다.',
      en: 'Rename many files at once with numbering, dates, and find-and-replace.',
    },
    description: {
      ko: '여러 파일의 이름을 순번·날짜·찾아 바꾸기 규칙으로 한 번에 바꾸고 새 이름의 ZIP으로 내려받습니다. 바뀔 이름을 미리 보고 확인할 수 있으며, 파일은 서버로 보내지 않습니다.',
      en: 'Batch rename files with numbering, dates, and find/replace rules, preview the result, and download a ZIP. Runs in your browser.',
    },
    keywords: [
      '파일 이름 일괄 변경',
      '파일명 일괄 변경',
      '파일 이름 한번에 바꾸기',
      '사진 이름 순번',
      '파일명 변경',
      'batch rename',
    ],
    updated: '2026-11-11',
    faq: [
      {
        q: '내 컴퓨터의 파일 이름이 바로 바뀌나요?',
        a: '브라우저는 보안 때문에 내 PC 파일 이름을 직접 바꿀 수 없습니다. 새 이름을 붙인 사본을 ZIP으로 드리니 압축을 풀어 쓰세요.',
      },
      {
        q: '확장자도 바꿀 수 있나요?',
        a: '확장자는 바꾸지 않습니다. 확장자가 바뀌면 파일이 열리지 않기 때문입니다. 형식을 바꾸려면 이미지 형식 변환 같은 변환 도구를 쓰세요.',
      },
      {
        q: '파일 내용이 바뀌지는 않나요?',
        a: 'ZIP에 압축 없이 담기만 하므로 내용은 한 바이트도 바뀌지 않습니다. 사진 화질도 그대로입니다.',
      },
      {
        q: '순번을 촬영 순서대로 매길 수 있나요?',
        a: '"순번 매길 순서"에서 수정한 날짜순을 고르세요. 사진은 대부분 찍은 시각이 수정한 날짜로 남아 있습니다.',
      },
    ],
    sources: [
      {
        label: 'Microsoft — 파일 이름에 쓸 수 없는 문자',
        href: 'https://learn.microsoft.com/ko-kr/windows/win32/fileio/naming-a-file',
      },
      { label: 'JSZip', href: 'https://stuk.github.io/jszip/' },
    ],
    related: ['image-convert', 'image-resize', 'pdf-merge'],
  },
  {
    slug: 'image-dpi',
    category: 'image',
    icon: '🖨️',
    title: { ko: '이미지 DPI 변경', en: 'Change Image DPI' },
    summary: {
      ko: '화질과 픽셀은 그대로 두고 JPG·PNG의 DPI만 300·72 등으로 바꿉니다.',
      en: 'Change the DPI of JPG/PNG files without touching pixels or quality.',
    },
    description: {
      ko: 'JPG·PNG 이미지의 DPI(인쇄 해상도)를 300dpi, 72dpi처럼 원하는 값으로 바꿉니다. 픽셀을 다시 그리지 않아 화질·용량이 그대로이고, 인쇄 크기를 미리 계산해 보여 줍니다.',
      en: 'Set the DPI of JPG and PNG images (e.g. 300 or 72) without re-encoding, and see the resulting print size. Runs in your browser.',
    },
    keywords: [
      '이미지 DPI 변경',
      '300dpi 변환',
      'DPI 바꾸기',
      '사진 해상도 300dpi',
      '인쇄 해상도',
      'change dpi',
    ],
    updated: '2026-11-11',
    faq: [
      {
        q: 'DPI를 올리면 사진이 선명해지나요?',
        a: '아니요. DPI는 인쇄할 때 크기를 정하는 정보일 뿐이라 픽셀 수와 화질은 그대로입니다. 같은 사진이 300dpi에서는 72dpi보다 작게 인쇄됩니다.',
      },
      {
        q: '300dpi 파일을 내라는데 이걸로 되나요?',
        a: '파일의 DPI 값은 300으로 바뀝니다. 다만 원하는 인쇄 크기에 비해 픽셀이 부족하면 흐릿할 수 있으니 표의 "바꾼 뒤" 인쇄 크기를 확인하세요.',
      },
      {
        q: '어떤 형식을 지원하나요?',
        a: 'JPG와 PNG를 지원합니다. JPG는 JFIF와 EXIF의 해상도 값을, PNG는 pHYs 정보를 함께 고칩니다.',
      },
    ],
    sources: [
      { label: 'JFIF 1.02 Specification', href: 'https://www.w3.org/Graphics/JPEG/jfif3.pdf' },
      { label: 'W3C — PNG Specification (pHYs)', href: 'https://www.w3.org/TR/png-3/#11pHYs' },
    ],
    related: ['image-resize', 'id-photo', 'jpg-to-pdf'],
  },
  {
    slug: 'image-base64',
    category: 'image',
    icon: '🧬',
    title: { ko: '이미지 Base64 변환', en: 'Image to Base64' },
    summary: {
      ko: '이미지를 Base64 data URI·HTML·CSS 코드로, Base64를 이미지로 바꿉니다.',
      en: 'Convert images to Base64 data URIs and HTML/CSS snippets, and back.',
    },
    description: {
      ko: '이미지를 Base64 data URI로 바꾸고 HTML img·CSS background·마크다운 코드로 바로 복사합니다. 반대로 붙여 넣은 Base64 글자를 이미지 파일로 되돌릴 수도 있습니다. 서버로 보내지 않습니다.',
      en: 'Encode an image as a Base64 data URI with ready-to-copy HTML, CSS, and Markdown, or decode Base64 back to an image. Runs in your browser.',
    },
    keywords: [
      '이미지 Base64 변환',
      'Base64 이미지',
      'data URI 변환',
      'Base64 디코딩 이미지',
      '이미지 인코딩',
      'image to base64',
    ],
    updated: '2026-11-11',
    faq: [
      {
        q: '용량이 왜 커지나요?',
        a: 'Base64는 3바이트를 글자 4개로 바꾸므로 원본보다 약 33% 커집니다. 작은 아이콘·로고에만 쓰고 큰 사진은 파일로 두세요.',
      },
      {
        q: 'data:image/png;base64, 부분이 없어도 되나요?',
        a: '네. 앞부분이 없는 Base64 글자만 붙여 넣어도 PNG·JPG·GIF·WebP·SVG는 내용을 보고 형식을 알아냅니다.',
      },
      {
        q: '글자를 Base64로 바꾼 것도 풀 수 있나요?',
        a: '이 도구는 이미지 전용입니다. 글자를 Base64로 바꾸거나 풀려면 텍스트 변환 도구를 쓰세요.',
      },
    ],
    sources: [
      { label: 'RFC 4648 — Base64', href: 'https://www.rfc-editor.org/rfc/rfc4648' },
      { label: 'RFC 2397 — data URL', href: 'https://www.rfc-editor.org/rfc/rfc2397' },
    ],
    related: ['text-convert', 'image-convert', 'image-compress'],
  },
  {
    slug: 'vcf-ics-viewer',
    category: 'utility',
    icon: '📇',
    title: {
      ko: 'VCF·ICS 뷰어',
      en: 'VCF & ICS Viewer',
      ja: 'VCF・ICSビューア',
    },
    summary: {
      ko: '연락처(.vcf)와 일정(.ics) 파일을 설치 없이 확인합니다.',
      en: 'Open VCF contacts and ICS calendars without installing an app.',
      ja: 'VCF連絡先・ICSカレンダーをインストールなしで確認します。',
    },
    description: {
      ko: '아이폰·안드로이드·아웃룩에서 내보낸 VCF 연락처와 ICS 일정을 브라우저에서 읽습니다. 이름·전화·이메일·회사와 일정·날짜·장소를 표로 확인하고 CSV로 내려받으세요. 파일은 서버로 전송되지 않습니다.',
      en: 'Read VCF contacts and ICS calendars exported from iPhone, Android, or Outlook in your browser. View names, phones, emails, companies, events, dates, and locations, then export to CSV. Nothing is uploaded.',
      ja: 'iPhone・Android・Outlookから書き出したVCF連絡先とICS予定をブラウザで表示します。名前・電話・メール・会社、予定・日時・場所を確認し、CSVで保存できます。',
    },
    keywords: [
      'VCF 뷰어',
      'ICS 뷰어',
      'vcf 파일 열기',
      'ics 파일 열기',
      '연락처 파일 보기',
      '캘린더 파일 보기',
      'vcard ics',
    ],
    updated: '2026-11-12',
    faq: [
      {
        q: '어떤 파일을 열 수 있나요?',
        a: 'VCF(vCard 2.1·3.0·4.0)와 ICS(iCalendar 일정)를 지원합니다. 아이폰·안드로이드·아웃룩·구글 캘린더에서 내보낸 파일을 사용할 수 있습니다.',
      },
      {
        q: '반복 일정도 펼쳐서 보여 주나요?',
        a: '아니요. 1차 버전은 반복 규칙만 표시하고, 실제 발생 일정을 모두 펼치지는 않습니다. 반복 일정은 캘린더 앱에서 확인하세요.',
      },
      {
        q: '한글이 깨지지 않나요?',
        a: 'UTF-8을 우선 읽고, 실패하면 EUC-KR로 다시 읽습니다. 오래된 vCard의 한글 인코딩도 지원합니다. 일부 앱이 독자 인코딩을 쓰면 이름이 깨질 수 있습니다.',
      },
      {
        q: '연락처·일정을 CSV로 저장할 수 있나요?',
        a: '네. 연락처는 이름·전화·이메일·회사·직함·주소·메모를, 일정은 제목·시작·종료·장소·설명·반복·상태를 CSV로 내려받습니다. 엑셀에서 바로 열 수 있도록 BOM을 붙입니다.',
      },
      {
        q: '파일이 서버로 전송되나요?',
        a: '아니요. VCF·ICS 읽기와 CSV 생성이 모두 브라우저 안에서 실행되며 파일은 서버에 저장되지 않습니다.',
      },
    ],
    sources: [
      { label: 'RFC 6350 — vCard 4.0', href: 'https://www.rfc-editor.org/rfc/rfc6350' },
      { label: 'RFC 5545 — iCalendar', href: 'https://www.rfc-editor.org/rfc/rfc5545' },
    ],
    related: ['sheet-viewer', 'csv-xlsx', 'pdf-viewer'],
  },
  {
    slug: 'quote-generator',
    category: 'utility',
    icon: '🧾',
    title: {
      ko: '견적서·거래명세서',
      en: 'Quote & Statement Generator',
      ja: '見積書・取引明細書',
    },
    summary: {
      ko: '회사 정보와 품목을 입력해 견적서·거래명세서 PDF를 만듭니다.',
      en: 'Create quote and transaction statement PDFs from your company details and line items.',
      ja: '会社情報と品目を入力して見積書・取引明細書のPDFを作成します。',
    },
    description: {
      ko: '공급자·공급받는자·품목·부가세를 입력해 A4 견적서와 거래명세서 PDF를 만듭니다. 회사 정보는 이 브라우저에만 저장할 수 있고 파일은 서버로 전송되지 않습니다. 세무 신고용 서식이 아닌 참고용입니다.',
      en: 'Create A4 quote and transaction statement PDFs with supplier, buyer, line items, and VAT. Company details can stay in this browser, and nothing is uploaded. For reference only, not a tax filing document.',
      ja: '取引先・品目・消費税を入力してA4の見積書・取引明細書PDFを作成します。会社情報はこのブラウザにのみ保存でき、ファイルは送信されません。税務申告用の書式ではありません。',
    },
    keywords: [
      '견적서 양식',
      '견적서 만들기',
      '견적서 PDF',
      '거래명세서 양식',
      '거래명세서 PDF',
      '무료 견적서',
    ],
    updated: '2026-11-13',
    faq: [
      {
        q: '견적서와 거래명세서의 차이는 무엇인가요?',
        a: '견적서는 거래 전에 제안하는 금액과 조건을 적는 문서이고, 거래명세서는 거래한 품목과 금액을 확인하는 문서입니다. 이 도구는 같은 입력값으로 제목과 문서 번호만 바꿔 두 종류를 만들 수 있습니다.',
      },
      {
        q: '부가세는 어떻게 계산되나요?',
        a: '부가세 별도는 품목 합계에 10%를 더하고, 부가세 포함은 입력한 금액을 기준으로 공급가액과 부가세를 역산합니다. 부가세 없음은 합계만 표시합니다. 반올림은 원 단위입니다.',
      },
      {
        q: '회사 정보가 저장되나요?',
        a: '“회사 정보를 이 브라우저에 저장”을 체크한 경우에만 이 브라우저(localStorage)에 저장됩니다. 서버로 전송하지 않으며, 같은 브라우저에서 다음에 다시 불러올 수 있습니다.',
      },
      {
        q: '세금계산서도 발행할 수 있나요?',
        a: '아니요. 이 도구는 견적서·거래명세서를 만드는 참고용 도구입니다. 세금계산서 발행은 국세청 홈택스나 회계 프로그램을 이용하세요.',
      },
      {
        q: 'PDF 글자를 선택할 수 있나요?',
        a: '네. 문서를 이미지가 아니라 텍스트로 그려 PDF 글자를 선택·검색·복사할 수 있습니다. 다만 사용하는 글꼴에 따라 모양이 조금 다를 수 있습니다.',
      },
    ],
    sources: [
      {
        label: '국세청 홈택스 — 전자세금계산서 안내',
        href: 'https://www.hometax.go.kr/',
      },
    ],
    related: ['percent-calc', 'pdf-sign', 'pdf-protect'],
  },
  {
    slug: 'seal-maker',
    category: 'utility',
    icon: '🔏',
    title: {
      ko: '도장·서명 만들기',
      en: 'Seal & Signature Maker',
      ja: '印鑑・署名作成',
    },
    summary: {
      ko: '글자 도장과 손글씨 서명을 만들어 투명 PNG로 저장합니다.',
      en: 'Create text seals and handwritten signatures as transparent PNGs.',
      ja: '文字印鑑と手書き署名を作り、透過PNGで保存します。',
    },
    description: {
      ko: '회사명·이름·직함을 넣은 글자 도장과 손글씨 서명을 배경이 투명한 PNG로 만듭니다. PDF 서명 도구와 함께 계약서·견적서에 바로 넣을 수 있습니다. 모든 작업은 브라우저에서 실행되며 파일은 서버로 전송되지 않습니다. 참고용 이미지이며 공식 인감의 법적 효력을 대신하지 않습니다.',
      en: 'Create text seals and handwritten signatures as transparent PNGs. Use them in contracts and quotes with the PDF sign tool. Everything runs in your browser, and nothing is uploaded. For personal reference only; not a substitute for an official registered seal.',
      ja: '会社名・名前・役職を入れた文字印鑑や手書き署名を、背景が透明なPNGで作成します。PDF署名ツールと組み合わせて契約書・見積書に使えます。処理はすべてブラウザ内で行われ、ファイルは送信されません。参考用であり、公式な実印の法的効力を代替するものではありません。',
    },
    keywords: [
      '도장 만들기',
      '법인 도장',
      '개인 도장',
      '서명 만들기',
      '투명 PNG 도장',
      '전자 서명 이미지',
    ],
    updated: '2026-11-13',
    faq: [
      {
        q: '어떤 도장을 만들 수 있나요?',
        a: '글자를 넣은 원형·사각 도장과 마우스·손가락으로 그리는 손글씨 서명을 만들 수 있습니다. 결과는 배경이 투명한 PNG입니다.',
      },
      {
        q: '공식 인감으로 쓸 수 있나요?',
        a: '아니요. 개인용·참고용 이미지입니다. 법인 인감·공식 도장은 관할 기관의 등록 절차를 따라야 하며, 이 도구는 그 효력을 대신하지 않습니다.',
      },
      {
        q: 'PDF에 바로 넣을 수 있나요?',
        a: 'PNG로 저장한 뒤 PDF 서명·도장 도구에서 PDF 위에 올리면 됩니다. 서명 이미지는 배경이 투명해서 문서 위에 자연스럽게 들어갑니다.',
      },
      {
        q: '글꼴은 무엇인가요?',
        a: '나눔고딕으로 그립니다. 글꼴을 불러오지 못하면 브라우저 기본 글꼴로 표시됩니다.',
      },
      {
        q: '입력한 내용이 서버로 전송되나요?',
        a: '아니요. 도장·서명 그리기와 PNG 저장이 모두 브라우저 안에서 실행되며 입력값은 저장되지 않습니다.',
      },
    ],
    sources: [],
    related: ['pdf-sign', 'quote-generator', 'image-frame'],
  },
  {
    slug: 'password-generator',
    category: 'utility',
    icon: '🔑',
    title: {
      ko: '비밀번호 생성기',
      en: 'Password Generator',
      ja: 'パスワード生成',
    },
    summary: {
      ko: '길이·문자 종류를 골라 안전한 비밀번호나 패스프레이즈를 만듭니다.',
      en: 'Generate secure passwords or passphrases with the length and characters you choose.',
      ja: '長さ・文字の種類を選んで、安全なパスワードやパスフレーズを作ります。',
    },
    description: {
      ko: '브라우저의 암호학적 난수로 비밀번호와 패스프레이즈를 만듭니다. 길이·대문자·숫자·기호·비슷한 글자 제외를 고르고 강도를 확인한 뒤 복사하세요. 결과를 저장하거나 서버로 전송하지 않습니다.',
      en: 'Generate passwords and passphrases with your browser’s cryptographic random values. Choose length, character sets, and ambiguous-character exclusion, check the strength, then copy. Nothing is stored or uploaded.',
      ja: 'ブラウザの暗号学的乱数でパスワードやパスフレーズを作ります。長さ・文字種・紛らわしい文字の除外を選び、強度を確認してコピーできます。結果は保存されず、送信もされません。',
    },
    keywords: [
      '비밀번호 생성기',
      '패스워드 생성',
      '랜덤 비밀번호',
      '패스프레이즈',
      '안전한 비밀번호',
      '비밀번호 만들기',
    ],
    updated: '2026-11-13',
    faq: [
      {
        q: '비밀번호는 어떻게 만드나요?',
        a: '브라우저의 crypto.getRandomValues로 무작위 값을 만들고, 선택한 문자 종류를 최소 하나씩 넣은 뒤 섞습니다. Math.random은 쓰지 않습니다.',
      },
      {
        q: '만든 비밀번호가 저장되나요?',
        a: '아니요. 화면에만 표시되고 브라우저 저장소나 서버에 저장하지 않습니다. 새로고침하면 사라집니다.',
      },
      {
        q: '강도 표시는 정확한가요?',
        a: '선택한 길이와 문자 종류로 계산한 대략적인 엔트로피입니다. 실제 안전성은 사이트마다 다른 비밀번호를 쓰는지, 2단계 인증을 쓰는지에 더 크게 좌우됩니다.',
      },
      {
        q: '패스프레이즈는 무엇인가요?',
        a: '여러 단어를 구분자로 이어 만든 비밀번호입니다. 단어 수를 늘리면 길이를 늘리는 것과 비슷하게 안전해지고, 외우기는 조금 더 쉽습니다.',
      },
      {
        q: '중요한 계정에 써도 되나요?',
        a: '네. 다만 사이트마다 다른 비밀번호를 쓰고, 비밀번호 관리자와 2단계 인증을 함께 쓰는 것을 권장합니다.',
      },
    ],
    sources: [
      {
        label: 'NIST SP 800-63B — Digital Identity Guidelines',
        href: 'https://pages.nist.gov/800-63-3/sp800-63b.html',
      },
      {
        label: 'MDN — Crypto.getRandomValues()',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues',
      },
    ],
    related: ['file-hash', 'pdf-protect', 'qr-generate'],
  },
  {
    slug: 'file-hash',
    category: 'utility',
    icon: '#️⃣',
    title: {
      ko: '파일 해시',
      en: 'File Hash',
      ja: 'ファイルハッシュ',
    },
    summary: {
      ko: '파일의 SHA-256 해시를 계산해 배포 값과 비교합니다.',
      en: 'Calculate a file’s SHA-256 hash and compare it with a published value.',
      ja: 'ファイルのSHA-256ハッシュを計算し、配布値と比較します。',
    },
    description: {
      ko: '파일을 브라우저에서 읽어 SHA-256·SHA-512·SHA-384·SHA-1 해시를 계산합니다. 배포 페이지의 값과 비교해 변조·전송 오류를 확인하세요. 파일은 서버로 전송되지 않으며 한 번에 최대 100MB까지 처리합니다.',
      en: 'Read a file in your browser and calculate SHA-256, SHA-512, SHA-384, or SHA-1 hashes. Compare with a published value to check integrity. Nothing is uploaded, and files up to 100 MB are supported.',
      ja: 'ファイルをブラウザ内で読み、SHA-256・SHA-512・SHA-384・SHA-1ハッシュを計算します。配布ページの値と比較して改ざんや転送エラーを確認できます。ファイルは送信されず、最大100MBまで対応します。',
    },
    keywords: ['파일 해시', 'SHA-256', '체크섬 확인', '파일 무결성', '해시 비교', '파일 변조 확인'],
    updated: '2026-11-13',
    faq: [
      {
        q: '해시가 무엇인가요?',
        a: '파일 내용을 고정된 길이의 문자열로 바꾼 값입니다. 내용이 조금이라도 달라지면 완전히 다른 값이 나오므로, 파일이 바뀌지 않았는지 확인할 때 씁니다.',
      },
      {
        q: '어떤 알고리즘을 고르면 되나요?',
        a: '대부분 SHA-256을 쓰면 됩니다. 더 긴 지문이 필요하면 SHA-512·SHA-384를, 오래된 배포 파일과 맞출 때만 SHA-1을 사용하세요.',
      },
      {
        q: 'MD5는 없나요?',
        a: '제공하지 않습니다. MD5는 충돌 위험이 커서 무결성 확인용으로 권장하기 어렵습니다.',
      },
      {
        q: '큰 파일도 계산할 수 있나요?',
        a: '한 번에 최대 100MB까지 계산합니다. 더 큰 파일은 용량을 나누거나 명령줄 도구를 사용하세요.',
      },
      {
        q: '파일이 서버로 전송되나요?',
        a: '아니요. 파일 읽기와 해시 계산이 모두 브라우저 메모리에서 실행되며 서버에 저장되지 않습니다.',
      },
    ],
    sources: [
      {
        label: 'NIST FIPS 180-4 — Secure Hash Standard',
        href: 'https://csrc.nist.gov/pubs/fips/180-4/upd1/final',
      },
      {
        label: 'MDN — SubtleCrypto.digest()',
        href: 'https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest',
      },
    ],
    related: ['password-generator', 'image-info', 'pdf-protect'],
  },
  {
    slug: 'label-print',
    category: 'utility',
    icon: '🏷️',
    title: {
      ko: '라벨·봉투 인쇄',
      en: 'Label & Envelope Printing',
      ja: 'ラベル・封筒印刷',
    },
    summary: {
      ko: 'CSV 주소를 A4 라벨지와 DL 봉투 PDF로 인쇄합니다.',
      en: 'Turn a CSV address list into printable A4 label sheets or DL envelopes.',
      ja: 'CSVの住所リストをA4ラベルシートやDL封筒のPDFにします。',
    },
    description: {
      ko: 'CSV·XLSX 주소 목록을 A4 3×8·2×6 라벨지나 DL 봉투에 맞춰 PDF로 만듭니다. 이름·우편번호·주소·연락처를 자동으로 맞추고, 시작 위치와 여백을 조절할 수 있습니다. 파일은 서버로 전송되지 않습니다.',
      en: 'Create printable A4 label sheets or DL envelopes from a CSV or XLSX address list. Map names, postal codes, addresses, and phone numbers automatically, then adjust the start position and margins. Nothing is uploaded.',
      ja: 'CSV・XLSXの住所リストから、A4ラベルシートやDL封筒用のPDFを作成します。名前・郵便番号・住所・電話番号を自動で対応付け、開始位置や余白も調整できます。ファイルは送信されません。',
    },
    keywords: ['라벨 인쇄', '주소 라벨', '라벨지 양식', '봉투 인쇄', 'CSV 라벨', '주소록 라벨'],
    updated: '2026-11-13',
    faq: [
      {
        q: 'CSV는 어떻게 준비하나요?',
        a: '첫 행에 이름·우편번호·주소·연락처 중 하나 이상을 넣으면 열 이름을 보고 자동으로 맞춥니다. 머리글이 없으면 첫 열을 이름, 둘째 열을 주소, 셋째 열을 연락처로 읽습니다.',
      },
      {
        q: '라벨지 규격이 맞지 않아요.',
        a: '라벨지마다 행·열·여백이 조금씩 다릅니다. 사용자 지정에서 열·행·여백·간격을 맞춘 뒤 한 장만 테스트 인쇄하세요. 프린터는 반드시 실제 크기(100%)로 설정해야 합니다.',
      },
      {
        q: '봉투에도 인쇄할 수 있나요?',
        a: 'DL 봉투(220×110mm) 규격을 지원합니다. 프린터의 봉투 급지 방향과 용지 설정을 확인한 뒤 인쇄하세요.',
      },
      {
        q: 'QR 코드나 로고도 넣을 수 있나요?',
        a: '1차 버전에서는 이름·주소·연락처 텍스트만 지원합니다. QR 코드·바코드·로고는 다음 단계에서 검토합니다.',
      },
      {
        q: '주소가 서버로 전송되나요?',
        a: '아니요. CSV 읽기와 PDF 생성이 모두 브라우저 안에서 실행되며 주소록은 서버에 저장되지 않습니다.',
      },
    ],
    sources: [],
    related: ['quote-generator', 'pdf-sign', 'vcard-maker'],
  },
  {
    slug: 'vcard-maker',
    category: 'utility',
    icon: '📇',
    title: {
      ko: 'vCard 만들기',
      en: 'vCard Maker',
      ja: 'vCard作成',
    },
    summary: {
      ko: '연락처를 아이폰·안드로이드·아웃룩용 .vcf 파일로 만듭니다.',
      en: 'Create .vcf contact files for iPhone, Android, and Outlook.',
      ja: '連絡先をiPhone・Android・Outlook用の.vcfファイルにします。',
    },
    description: {
      ko: '이름·회사·전화·이메일·주소를 입력해 vCard 3.0(.vcf) 파일로 만듭니다. 여러 연락처를 목록에 추가해 하나의 파일로 내려받을 수 있고, 아이폰·안드로이드·아웃룩·구글 주소록에서 바로 가져올 수 있습니다. 입력값은 서버로 전송되지 않습니다.',
      en: 'Create vCard 3.0 (.vcf) files with names, companies, phones, emails, and addresses. Add multiple contacts and download them as one file for iPhone, Android, Outlook, or Google Contacts. Nothing is uploaded.',
      ja: '名前・会社・電話・メール・住所を入力してvCard 3.0（.vcf）ファイルを作成します。複数の連絡先をまとめて1つのファイルにでき、iPhone・Android・Outlook・Google連絡先で読み込めます。',
    },
    keywords: [
      'vCard 만들기',
      'VCF 만들기',
      '연락처 파일',
      'vcf 파일',
      '아이폰 연락처',
      '주소록 파일',
    ],
    updated: '2026-11-13',
    faq: [
      {
        q: 'vCard가 무엇인가요?',
        a: '이름·전화·이메일·회사·주소 같은 연락처 정보를 담는 표준 파일 형식입니다. 확장자는 .vcf이고, 아이폰·안드로이드·아웃룩·구글 주소록에서 바로 가져올 수 있습니다.',
      },
      {
        q: '여러 명을 한 번에 만들 수 있나요?',
        a: '네. 한 사람을 입력한 뒤 목록에 추가하고 다음 사람을 입력하세요. 목록과 현재 입력 중인 연락처를 합쳐 하나의 .vcf 파일로 저장합니다.',
      },
      {
        q: '사진이나 SNS도 넣을 수 있나요?',
        a: '1차 버전은 이름·회사·직함·전화·이메일·주소·메모만 지원합니다. 사진과 사용자 정의 필드는 지원하지 않습니다.',
      },
      {
        q: '어떤 앱에서 열리나요?',
        a: '아이폰·안드로이드 기본 연락처, 아웃룩, 구글 주소록에서 가져올 수 있습니다. 앱마다 주소·전화 표시 방식은 조금 다를 수 있습니다.',
      },
      {
        q: '연락처가 서버로 전송되나요?',
        a: '아니요. 입력과 .vcf 생성이 모두 브라우저 안에서 실행되며 서버에 저장되지 않습니다.',
      },
    ],
    sources: [{ label: 'RFC 2426 — vCard 3.0', href: 'https://www.rfc-editor.org/rfc/rfc2426' }],
    related: ['vcf-ics-viewer', 'ics-maker', 'qr-generate'],
  },
  {
    slug: 'ics-maker',
    category: 'utility',
    icon: '🗓️',
    title: {
      ko: 'ICS 만들기',
      en: 'ICS Maker',
      ja: 'ICS作成',
    },
    summary: {
      ko: '일정을 구글·아웃룩·애플 캘린더용 .ics 파일로 만듭니다.',
      en: 'Create .ics calendar files for Google Calendar, Outlook, and Apple Calendar.',
      ja: '予定をGoogle・Outlook・Appleカレンダー用の.icsファイルにします。',
    },
    description: {
      ko: '일정 제목·날짜·시간·장소·설명·알림을 입력해 iCalendar(.ics) 파일로 만듭니다. 구글 캘린더·아웃룩·애플 캘린더에서 바로 열 수 있고, 종일 일정과 시간 일정을 모두 지원합니다. 입력값은 서버로 전송되지 않습니다.',
      en: 'Create iCalendar (.ics) files with a title, date, time, location, description, and reminder. Open them in Google Calendar, Outlook, or Apple Calendar. Supports all-day and timed events; nothing is uploaded.',
      ja: '予定のタイトル・日付・時刻・場所・説明・通知を入力してiCalendar（.ics）ファイルを作成します。Googleカレンダー・Outlook・Appleカレンダーで開け、終日予定と時間指定予定の両方に対応します。',
    },
    keywords: [
      'ICS 만들기',
      '일정 파일',
      'ics 파일',
      '캘린더 파일',
      '구글 캘린더 일정',
      '아웃룩 일정',
    ],
    updated: '2026-11-13',
    faq: [
      {
        q: 'ICS 파일은 어디에서 열리나요?',
        a: '구글 캘린더, 아웃룩, 애플 캘린더, 삼성 캘린더 등 iCalendar를 지원하는 앱에서 열 수 있습니다. 파일을 열면 일정으로 가져오거나 추가할 수 있습니다.',
      },
      {
        q: '종일 일정의 종료일은 어떻게 되나요?',
        a: 'iCalendar 규칙상 종일 일정의 종료일은 다음 날로 기록됩니다. 11월 13일 하루 일정은 내부적으로 11월 14일에 끝나는 것으로 저장됩니다.',
      },
      {
        q: '시간대는 어떻게 저장되나요?',
        a: '기기의 현지 시간을 기준으로 저장합니다. 다른 시간대에서 열면 표시 시간이 달라질 수 있습니다.',
      },
      {
        q: '반복 일정도 만들 수 있나요?',
        a: '1차 버전은 한 번의 일정만 지원합니다. 반복 일정·참석자 초대·첨부 파일은 지원하지 않습니다.',
      },
      {
        q: '일정 내용이 서버로 전송되나요?',
        a: '아니요. 입력과 .ics 생성이 모두 브라우저 안에서 실행되며 서버로 전송되지 않습니다.',
      },
    ],
    sources: [{ label: 'RFC 5545 — iCalendar', href: 'https://www.rfc-editor.org/rfc/rfc5545' }],
    related: ['vcf-ics-viewer', 'vcard-maker', 'date-calc'],
  },
  {
    slug: 'zip',
    category: 'utility',
    icon: '🗜️',
    title: {
      ko: 'ZIP 열기·만들기',
      en: 'ZIP Opener & Creator',
      ja: 'ZIP 開く・作る',
    },
    summary: {
      ko: 'ZIP을 열어 파일을 확인·추출하고, 여러 파일을 ZIP으로 묶습니다.',
      en: 'Open ZIP files to inspect and extract contents, or create a ZIP from files.',
      ja: 'ZIPを開いて中身を確認・抽出し、複数ファイルをZIPにまとめます。',
    },
    description: {
      ko: 'ZIP 파일을 브라우저에서 열어 파일 목록·용량을 확인하고 텍스트·이미지를 미리 본 뒤 필요한 파일만 새 ZIP으로 내려받습니다. 여러 파일이나 폴더를 골라 ZIP으로 만들 수도 있습니다. 파일은 서버로 전송되지 않습니다.',
      en: 'Open ZIP files in your browser, inspect file sizes, preview text and images, and download only the files you need as a new ZIP. You can also create a ZIP from multiple files or a folder. Nothing is uploaded.',
      ja: 'ZIPをブラウザで開いてファイル一覧・容量を確認し、テキスト・画像をプレビューして必要なファイルだけを新しいZIPで保存できます。複数ファイルやフォルダをZIPにまとめることもできます。',
    },
    keywords: [
      'ZIP 열기',
      'ZIP 압축 풀기',
      'ZIP 만들기',
      '파일 압축',
      '압축 파일 미리보기',
      'ZIP 추출',
    ],
    updated: '2026-11-13',
    faq: [
      {
        q: 'ZIP을 서버에 올리지 않고 열 수 있나요?',
        a: '네. ZIP 읽기·미리보기·추출·생성이 모두 브라우저 메모리에서 실행되며 파일은 서버로 전송되지 않습니다.',
      },
      {
        q: '암호가 걸린 ZIP도 열리나요?',
        a: '아니요. 암호가 걸린 ZIP은 지원하지 않습니다. 압축 프로그램에서 암호를 푼 뒤 사용하세요.',
      },
      {
        q: '얼마나 큰 ZIP까지 열 수 있나요?',
        a: 'ZIP 파일 100MB, 압축 해제 합계 500MB, 2,000개 항목까지 지원합니다. 브라우저 메모리 한계가 있으므로 큰 파일은 나눠서 여세요.',
      },
      {
        q: '폴더 구조가 유지되나요?',
        a: '네. ZIP을 열 때와 만들 때 모두 폴더 경로를 유지합니다. 위험한 상위 경로(..)와 제어 문자는 안전하게 정리합니다.',
      },
      {
        q: 'ZIP을 만들 때 압축 방식은 어떻게 고르나요?',
        a: '저장만은 가장 빠르고, 표준 압축은 일반적인 문서에 적합합니다. 최대 압축은 시간이 더 걸리지만 크기를 조금 더 줄입니다.',
      },
    ],
    sources: [],
    related: ['file-rename', 'pdf-split', 'image-compress'],
  },
  {
    slug: 'qr-batch',
    category: 'utility',
    icon: '🔳',
    title: {
      ko: 'QR 코드 대량 생성',
      en: 'Bulk QR Code Generator',
      ja: 'QRコード一括生成',
    },
    summary: {
      ko: 'CSV·목록의 링크를 QR 코드 여러 개로 만들어 ZIP으로 받습니다.',
      en: 'Turn a CSV or list of links into many QR code PNGs in a ZIP.',
      ja: 'CSV・リストのリンクから複数のQRコードPNGを作り、ZIPで保存します。',
    },
    description: {
      ko: 'CSV·XLSX의 링크나 텍스트를 QR 코드 여러 개로 만들어 PNG ZIP으로 내려받습니다. 크기·여백·오류 정정·색을 조절하고, 파일 이름을 직접 지정할 수 있습니다. 한 번에 최대 200개까지 생성하며 내용은 서버로 전송되지 않습니다.',
      en: 'Create many QR code PNGs from links or text in a CSV/XLSX file. Adjust size, margin, error correction, and colors, and set file names. Generate up to 200 codes at once; nothing is uploaded.',
      ja: 'CSV・XLSXのリンクやテキストから複数のQRコードPNGを作り、ZIPで保存します。サイズ・余白・誤り訂正・色を調整し、ファイル名も指定できます。最大200個まで生成でき、内容は送信されません。',
    },
    keywords: [
      'QR 코드 대량 생성',
      'QR 코드 여러 개',
      'QR 일괄 생성',
      'CSV QR',
      '링크 QR',
      'QR ZIP',
    ],
    updated: '2026-11-13',
    faq: [
      {
        q: 'CSV는 어떻게 준비하나요?',
        a: '첫 열에 QR에 담을 URL·텍스트, 둘째 열에 원하는 파일 이름을 넣으세요. 첫 행에 내용·URL·파일명 같은 머리글이 있으면 자동으로 건너뜁니다.',
      },
      {
        q: '몇 개까지 만들 수 있나요?',
        a: '한 번에 최대 200개까지 만들 수 있습니다. 내용이 너무 길면 QR로 만들지 못할 수 있으니 오류 정정을 낮추거나 내용을 줄이세요.',
      },
      {
        q: '파일 이름을 지정할 수 있나요?',
        a: 'CSV 둘째 열이나 각 항목의 파일 이름 칸에 입력하세요. 비우면 qr-001.png처럼 번호가 붙고, 중복 이름에는 번호가 추가됩니다.',
      },
      {
        q: '인쇄용 QR 시트도 만들 수 있나요?',
        a: '1차 버전은 PNG ZIP만 지원합니다. PNG를 라벨 프로그램이나 문서에 배치해 인쇄하세요.',
      },
      {
        q: 'QR 내용이 서버로 전송되나요?',
        a: '아니요. QR 생성과 ZIP 만들기가 모두 브라우저 안에서 실행되며 내용은 서버에 저장되지 않습니다.',
      },
    ],
    sources: [{ label: 'node-qrcode (GitHub)', href: 'https://github.com/soldair/node-qrcode' }],
    related: ['qr-generate', 'qr-reader', 'label-print'],
  },
  {
    slug: 'csv-stats',
    category: 'document',
    icon: '📊',
    title: {
      ko: 'CSV 통계 분석',
      en: 'CSV Statistics',
      ja: 'CSV統計分析',
    },
    summary: {
      ko: 'CSV·엑셀 표의 평균·중앙값·빈도·상관관계를 계산합니다.',
      en: 'Calculate averages, medians, frequencies, and correlations from CSV or Excel tables.',
      ja: 'CSV・Excel表の平均・中央値・頻度・相関を計算します。',
    },
    description: {
      ko: 'CSV·XLSX 표를 읽어 숫자 열의 최소·최대·평균·중앙값·표준편차·사분위와 문자 열의 상위 빈도를 계산합니다. 숫자 열끼리의 상관관계와 요약 CSV 저장도 지원합니다. 파일은 서버로 전송되지 않습니다.',
      en: 'Read CSV or XLSX tables and calculate numeric summaries (min, max, mean, median, standard deviation, quartiles) and top frequencies for text columns. Also shows correlations between numeric columns and exports a summary CSV. Nothing is uploaded.',
      ja: 'CSV・XLSX表を読み、数値列の最小・最大・平均・中央値・標準偏差・四分位と、文字列列の上位頻度を計算します。数値列同士の相関と概要CSVの保存にも対応します。',
    },
    keywords: [
      'CSV 통계',
      '엑셀 통계',
      'CSV 평균',
      '중앙값 계산',
      '표준편차 계산',
      '상관관계 분석',
    ],
    updated: '2026-11-13',
    faq: [
      {
        q: '어떤 통계를 계산하나요?',
        a: '숫자 열은 값 수·결측·고유값·최소·최대·합계·평균·중앙값·표본 표준편차·Q1·Q3를, 문자 열은 값 수·결측·고유값과 상위 빈도 5개를 보여 줍니다.',
      },
      {
        q: '어떤 열을 숫자로 보나요?',
        a: '비어 있지 않은 값의 80% 이상이 숫자로 읽히면 숫자 열로 봅니다. 쉼표·통화 기호·퍼센트를 허용하며, 전화번호·우편번호처럼 계산 의미가 없는 열은 문자로 처리될 수 있습니다.',
      },
      {
        q: '상관관계는 어떻게 계산하나요?',
        a: '두 숫자 열 모두 값이 있는 행만 사용해 피어슨 상관계수를 계산합니다. 숫자 열이 많으면 앞 8개 열까지만 표시합니다. 상관관계는 인과관계를 뜻하지 않습니다.',
      },
      {
        q: '큰 파일도 분석할 수 있나요?',
        a: '한 번에 최대 10만 행, 파일 50MB까지 지원합니다. 그보다 크면 파일을 나누거나 필요한 열만 추출해 주세요.',
      },
      {
        q: '파일이 서버로 전송되나요?',
        a: '아니요. 표 읽기와 통계 계산이 모두 브라우저 안에서 실행되며 파일은 서버에 저장되지 않습니다.',
      },
    ],
    sources: [],
    related: ['csv-clean', 'csv-pivot', 'csv-chart'],
  },
  {
    slug: 'merge-tables',
    category: 'document',
    icon: '🧩',
    title: {
      ko: '여러 표 합치기',
      en: 'Merge Tables',
      ja: '複数表の結合',
    },
    summary: {
      ko: '여러 CSV·엑셀 파일을 열 이름 기준으로 한 표로 합칩니다.',
      en: 'Combine multiple CSV or Excel files into one table by column name.',
      ja: '複数のCSV・Excelファイルを列名基準で1つの表にまとめます。',
    },
    description: {
      ko: '여러 CSV·XLSX 파일을 열 이름 기준으로 이어 붙입니다. 열 순서가 달라도 이름으로 맞추고, 한 파일에만 있는 열은 빈 칸으로 채웁니다. 시트 선택·중복 행 제거·CSV/XLSX 저장을 지원하며 파일은 서버로 전송되지 않습니다.',
      en: 'Append multiple CSV or XLSX files by matching column names. Columns are aligned by name even when order differs, and missing columns are left blank. Choose sheets, remove duplicate rows, and export to CSV or XLSX. Nothing is uploaded.',
      ja: '複数のCSV・XLSXファイルを列名で対応させて縦に連結します。列の順番が違っても名前で揃え、ない列は空欄にします。シート選択・重複行の削除・CSV/XLSX保存に対応します。',
    },
    keywords: [
      '엑셀 파일 합치기',
      'CSV 합치기',
      '여러 표 합치기',
      '엑셀 시트 합치기',
      'CSV 세로 합치기',
      '표 병합',
    ],
    updated: '2026-11-13',
    faq: [
      {
        q: '열 순서가 달라도 합칠 수 있나요?',
        a: '네. 첫 행의 열 이름을 기준으로 맞춥니다. A 파일에 이름·부서, B 파일에 이름·지역이 있으면 결과는 이름·부서·지역이 되고, 없는 값은 빈 칸으로 채워집니다.',
      },
      {
        q: '엑셀 시트를 골라서 합칠 수 있나요?',
        a: '네. 시트가 여러 개인 파일은 목록에서 사용할 시트를 고를 수 있습니다. CSV·TSV는 시트가 하나라 자동으로 선택됩니다.',
      },
      {
        q: '중복 행도 정리할 수 있나요?',
        a: '중복 행 제거를 켜면 합친 결과에서 모든 값이 같은 행을 하나만 남깁니다. 비교는 공백을 정리한 문자열 기준입니다.',
      },
      {
        q: '수식은 어떻게 처리되나요?',
        a: '엑셀 수식은 계산된 표시값으로 읽습니다. 수식 자체를 보존하지는 않습니다.',
      },
      {
        q: '파일이 서버로 전송되나요?',
        a: '아니요. 파일 읽기와 표 합치기가 모두 브라우저 안에서 실행되며 파일은 서버에 저장되지 않습니다.',
      },
    ],
    sources: [],
    related: ['csv-join', 'csv-clean', 'csv-stats'],
  },
  {
    slug: 'barcode-generator',
    category: 'utility',
    icon: '🏷️',
    title: {
      ko: '바코드 만들기',
      en: 'Barcode Generator',
      ja: 'バーコード作成',
    },
    summary: {
      ko: 'Code 128·GS1-128·EAN·UPC 바코드를 PNG·SVG·라벨 PDF로 만듭니다.',
      en: 'Create Code 128, GS1-128, EAN, and UPC barcodes as PNG, SVG, or label PDFs.',
      ja: 'Code 128・GS1-128・EAN・UPCバーコードをPNG・SVG・ラベルPDFで作成します。',
    },
    description: {
      ko: 'Code 128·GS1-128·EAN·UPC·Code 39·ITF-14 바코드를 PNG·SVG로 만듭니다. EAN·UPC 체크 디지트 자동 계산, ITF-14 Bearer bar, CSV 라벨 PDF·PNG ZIP을 지원합니다.',
      en: 'Create Code 128, GS1-128, EAN-13, UPC-A, EAN-8, Code 39, and ITF-14 barcodes and save them as PNG or SVG. Check digits are calculated and validated automatically, ITF-14 can include bearer bars, and a CSV product list can become an A4 label PDF or PNG ZIP.',
      ja: 'Code 128・EAN-13・UPC-A・EAN-8・Code 39・ITF-14バーコードを作成し、PNG・SVGで保存します。EAN・UPCのチェックディジットは自動計算・検証し、CSVの商品リストからA4ラベルPDFやPNG ZIPも作成できます。',
    },
    keywords: [
      '바코드 만들기',
      '바코드 생성기',
      'Code 128',
      'EAN-13 생성',
      'UPC 바코드',
      'GS1-128',
      'ITF-14',
      '바코드 라벨',
    ],
    updated: '2026-11-13',
    faq: [
      {
        q: '어떤 바코드를 만들 수 있나요?',
        a: 'Code 128, EAN-13, UPC-A, EAN-8, Code 39, ITF-14를 지원합니다. 내부 관리 번호는 Code 128, 상품은 EAN-13·UPC-A를 주로 사용합니다.',
      },
      {
        q: 'EAN-13 체크 디지트도 계산하나요?',
        a: '네. 12자리를 입력하면 체크 디지트를 자동으로 붙이고, 13자리를 입력하면 마지막 자리가 맞는지 검증합니다. UPC-A·EAN-8·ITF-14도 같은 방식입니다.',
      },
      {
        q: 'EAN-13을 아무 숫자로 만들어도 되나요?',
        a: '상품에 사용할 EAN-13·UPC-A는 GS1에서 부여받은 접두어가 필요합니다. 이 도구는 코드 생성·검증만 하며 GS1 등록을 대신하지 않습니다. 내부용은 Code 128을 권장합니다.',
      },
      {
        q: 'GS1-128은 어떻게 입력하나요?',
        a: '예: (01)12345678901231|(10)LOT-001. |는 FNC1 필드 구분자로 바뀝니다. AI 01·02·00은 13·17자리 숫자를 넣으면 체크 디지트를 자동으로 붙이고, 14·18자리는 검증합니다.',
      },
      {
        q: 'ITF-14 Bearer bar가 무엇인가요?',
        a: 'ITF-14 물류 바코드의 위·아래에 굵은 가로선을 추가하는 인쇄 옵션입니다. 스캔 안정성을 높이는 데 도움이 되며, 미리보기와 PNG·라벨 PDF에 반영됩니다.',
      },
      {
        q: '라벨 PDF는 어떻게 인쇄하나요?',
        a: 'A4 3×8(24칸)·2×6(12칸) 라벨 PDF로 만들 수 있습니다. 프린터에서 실제 크기(100%)로 인쇄하고, 라벨지 규격과 여백을 먼저 확인하세요.',
      },
      {
        q: '입력한 상품 정보가 서버로 전송되나요?',
        a: '아니요. 바코드 생성과 라벨 PDF 만들기가 모두 브라우저 안에서 실행되며 파일은 서버에 저장되지 않습니다.',
      },
    ],
    sources: [{ label: 'JsBarcode (GitHub)', href: 'https://github.com/lindell/JsBarcode' }],
    related: ['qr-reader', 'qr-generate', 'label-print'],
  },
];

export function getTool(slug: string): Tool | undefined {
  return tools.find((tool) => tool.slug === slug);
}

export function tx(text: LocalizedText, locale: Locale = 'ko'): string {
  return text[locale] ?? text.ko;
}
