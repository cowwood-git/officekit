/**
 * 도구별 작업 진행 체크리스트 (src/lib/do-work.ts).
 * 단계 이름은 그 도구가 실제로 하는 일만 적는다. units 가 클수록 최소 표시 시간이 길다(workDuration).
 *
 * 넣지 않는 도구:
 * - 계산기·텍스트처럼 입력 즉시 결과가 나오는 도구
 * - 파일을 여는 것이 곧 목적인 뷰어(DOCX·표 뷰어)
 * - 자체 진행률이 있는 오래 걸리는 도구(PDF·이미지 OCR, PDF 압축) — 진행률이 두 개가 된다
 * - PDF 나누기 — 쪽수에 맞춘 전용 단계를 직접 쓴다(src/scripts/pdf-split.ts)
 */
export interface WorkSpec {
  title: string;
  steps: string[];
  units: number;
}

const LIGHT = 6;
const NORMAL = 12;
const HEAVY = 20;

export const WORK_STEPS: Record<string, WorkSpec> = {
  // PDF
  'pdf-merge': {
    title: 'PDF를 합치는 중',
    steps: ['PDF 구조 확인', '페이지 순서 맞추기', '페이지 옮겨 담기', '새 PDF 저장'],
    units: HEAVY,
  },
  'jpg-to-pdf': {
    title: 'PDF를 만드는 중',
    steps: ['이미지 읽기', '페이지 크기 맞추기', '이미지를 페이지에 배치', 'PDF 저장'],
    units: HEAVY,
  },
  'pdf-to-jpg': {
    title: '이미지로 바꾸는 중',
    steps: ['PDF 페이지 읽기', '페이지 그리기', '이미지로 저장', '파일 묶기'],
    units: HEAVY,
  },
  'pdf-organize': {
    title: '페이지를 정리하는 중',
    steps: ['PDF 구조 확인', '순서·회전 적용', '삭제할 페이지 제외', '새 PDF 저장'],
    units: NORMAL,
  },
  'pdf-page-insert': {
    title: '페이지를 넣는 중',
    steps: ['두 PDF 구조 확인', '삽입·교체 순서 계산', '페이지 복사', '새 PDF 저장'],
    units: NORMAL,
  },
  'pdf-watermark': {
    title: '워터마크를 넣는 중',
    steps: ['PDF 구조 확인', '워터마크 배치 계산', '페이지마다 그리기', 'PDF 저장'],
    units: NORMAL,
  },
  'pdf-page-number': {
    title: '페이지 번호를 넣는 중',
    steps: ['PDF 구조 확인', '번호 위치 계산', '페이지마다 번호 쓰기', 'PDF 저장'],
    units: NORMAL,
  },
  'pdf-metadata': {
    title: '문서 정보를 바꾸는 중',
    steps: ['PDF 구조 확인', '문서 정보 기록', 'PDF 저장'],
    units: LIGHT,
  },
  'pdf-nup': {
    title: '모아찍기 PDF를 만드는 중',
    steps: ['PDF 구조 확인', '한 장 배치 계산', '페이지 축소·배치', 'PDF 저장'],
    units: HEAVY,
  },
  'pdf-resize': {
    title: '용지 크기를 바꾸는 중',
    steps: ['PDF 구조 확인', '새 용지 크기 계산', '페이지 맞춤 배치', 'PDF 저장'],
    units: NORMAL,
  },
  'pdf-crop': {
    title: '여백을 자르는 중',
    steps: ['PDF 구조 확인', '자를 영역 계산', '페이지마다 적용', 'PDF 저장'],
    units: NORMAL,
  },
  'pdf-text': {
    title: '텍스트를 추출하는 중',
    steps: ['PDF 페이지 읽기', '글자 위치 분석', '줄·문단 정리'],
    units: NORMAL,
  },
  'pdf-diff': {
    title: '두 PDF를 비교하는 중',
    steps: ['두 PDF 페이지 읽기', '텍스트 추출', '페이지 대응 찾기', '바뀐 줄 비교'],
    units: HEAVY,
  },
  'pdf-header-footer': {
    title: '머리글·바닥글을 넣는 중',
    steps: ['PDF 구조 확인', '문구 위치 계산', '페이지마다 쓰기', 'PDF 저장'],
    units: NORMAL,
  },
  'pdf-image-extract': {
    title: '이미지를 추출하는 중',
    steps: ['PDF 페이지 읽기', '이미지 찾기', '이미지 저장', '파일 묶기'],
    units: HEAVY,
  },
  'pdf-sign': {
    title: '서명을 넣는 중',
    steps: ['PDF 구조 확인', '서명 이미지 준비', '서명 배치', 'PDF 저장'],
    units: NORMAL,
  },
  'pdf-form-fill': {
    title: '양식을 채우는 중',
    steps: ['PDF 양식 확인', '입력값 기록', '글꼴 적용', 'PDF 저장'],
    units: NORMAL,
  },
  'pdf-redact': {
    title: '가리는 중',
    steps: ['PDF 페이지 읽기', '가릴 영역 덮기', '가린 페이지를 이미지로 바꾸기', 'PDF 저장'],
    units: HEAVY,
  },
  // 이미지
  'heic-to-jpg': {
    title: 'JPG로 바꾸는 중',
    steps: ['HEIC 사진 읽기', '색상·방향 맞추기', 'JPG로 저장', '파일 묶기'],
    units: HEAVY,
  },
  'image-compress': {
    title: '이미지를 압축하는 중',
    steps: ['이미지 읽기', '크기 조정', '화질 맞춰 압축', '파일 묶기'],
    units: NORMAL,
  },
  'image-convert': {
    title: '형식을 바꾸는 중',
    steps: ['이미지 읽기', '새 형식으로 인코딩', '파일 묶기'],
    units: NORMAL,
  },
  'image-crop': {
    title: '이미지를 자르는 중',
    steps: ['이미지 읽기', '자를 영역 적용', '파일 저장'],
    units: LIGHT,
  },
  'image-mosaic': {
    title: '모자이크 처리 중',
    steps: ['이미지 읽기', '선택 영역 픽셀화', '파일 저장'],
    units: NORMAL,
  },
  'image-watermark': {
    title: '워터마크를 넣는 중',
    steps: ['이미지 읽기', '워터마크 배치', '파일 저장'],
    units: LIGHT,
  },
  'image-merge': {
    title: '이미지를 이어 붙이는 중',
    steps: ['이미지 읽기', '배치 계산', '한 장으로 합치기', '파일 저장'],
    units: NORMAL,
  },
  'image-split': {
    title: '이미지를 나누는 중',
    steps: ['이미지 읽기', '자를 칸 계산', '조각 저장', '파일 묶기'],
    units: NORMAL,
  },
  'image-info': {
    title: '메타데이터를 지우는 중',
    steps: ['이미지 읽기', 'EXIF·위치 정보 제거', '파일 저장'],
    units: LIGHT,
  },
  'image-filter': {
    title: '보정 적용 중',
    steps: ['이미지 읽기', '밝기·색 보정', '파일 저장'],
    units: LIGHT,
  },
  'image-frame': {
    title: '여백·테두리를 넣는 중',
    steps: ['이미지 읽기', '여백·테두리 그리기', '파일 저장'],
    units: LIGHT,
  },
  'image-collage': {
    title: '콜라주를 만드는 중',
    steps: ['이미지 읽기', '칸 배치 계산', '한 장으로 합치기', '파일 저장'],
    units: NORMAL,
  },
  'pdf-protect': {
    title: '암호를 거는 중',
    steps: ['PDF 구조 확인', '암호 키 만들기', 'AES-256으로 암호화', 'PDF 저장'],
    units: NORMAL,
  },
  'pdf-unlock': {
    title: '암호를 푸는 중',
    steps: ['암호 확인', '내용 복호화', '새 PDF로 옮기기', 'PDF 저장'],
    units: NORMAL,
  },
  'id-photo': {
    title: '증명사진을 만드는 중',
    steps: ['규격 크기 계산', '사진 배치', '300dpi로 저장'],
    units: LIGHT,
  },
  'remove-background': {
    title: '배경을 지우는 중',
    steps: ['사진 읽기', 'AI로 사람·물건 찾기', '가장자리 다듬기', '배경 지우고 저장'],
    units: HEAVY,
  },
  'doc-scanner': {
    title: '스캔 파일을 만드는 중',
    steps: ['원본 사진 읽기', '모서리 따라 펴기', '바탕 보정', '파일로 저장'],
    units: NORMAL,
  },
  'gif-maker': {
    title: 'GIF를 만드는 중',
    steps: ['장면 모으기', '색 줄이기(256색)', '프레임 압축', 'GIF 저장'],
    units: HEAVY,
  },
  'file-rename': {
    title: '이름을 바꾸는 중',
    steps: ['새 이름 정리', '겹치는 이름 확인', 'ZIP에 담기'],
    units: LIGHT,
  },
  'image-dpi': {
    title: 'DPI를 바꾸는 중',
    steps: ['해상도 정보 찾기', 'DPI 값 고치기', '파일 묶기'],
    units: LIGHT,
  },
  'image-resize': {
    title: '크기를 바꾸는 중',
    steps: ['이미지 읽기', '새 크기 계산', '고화질로 다시 그리기', '파일 묶기'],
    units: NORMAL,
  },
  'image-rotate': {
    title: '회전·반전하는 중',
    steps: ['이미지 읽기', '회전·반전 적용', '파일 저장'],
    units: LIGHT,
  },
  // 표·CSV
  'csv-clean': {
    title: '표를 정리하는 중',
    steps: ['표 읽기', '공백·빈 행·중복 정리', '필터·정렬 적용', '결과 파일 만들기'],
    units: LIGHT,
  },
  'csv-join': {
    title: '두 표를 합치는 중',
    steps: ['두 표 읽기', '기준 열 맞추기', '행 합치기', '결과 파일 만들기'],
    units: LIGHT,
  },
  'csv-json': {
    title: '변환하는 중',
    steps: ['데이터 읽기', '열·값 형식 판별', '변환 결과 만들기'],
    units: LIGHT,
  },
  'csv-xlsx': {
    title: '표를 변환하는 중',
    steps: ['파일 읽기', '시트·인코딩 확인', 'XLSX·CSV 만들기'],
    units: LIGHT,
  },
  'csv-pivot': {
    title: '피벗 표를 만드는 중',
    steps: ['표 읽기', '행·열 기준 묶기', '값 집계', '결과 파일 만들기'],
    units: LIGHT,
  },
  'csv-sql': {
    title: 'SQL을 만드는 중',
    steps: ['표 읽기', '열 형식 판별', 'CREATE·INSERT 문 만들기'],
    units: LIGHT,
  },
  'csv-table': {
    title: '표 코드를 만드는 중',
    steps: ['표 읽기', '특수문자 처리', '표 코드 만들기'],
    units: LIGHT,
  },
  'csv-pdf': {
    title: 'PDF를 만드는 중',
    steps: ['표 읽기', '열 너비·쪽 나눔 계산', '표 그리기', 'PDF 저장'],
    units: NORMAL,
  },
};
