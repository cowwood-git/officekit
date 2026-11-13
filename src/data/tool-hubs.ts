/**
 * 형식별 허브 페이지 콘텐츠.
 * 카테고리(형식)는 유지하고, 허브에서 용도별 묶음과 전체 목록을 보여 준다.
 * 새 형식 카테고리를 만들면 여기에도 한 항목을 추가한다.
 */
import type { FormatId } from '@/data/tool-capabilities';

export interface ToolHub {
  slug: string;
  group: FormatId;
  label: string;
  title: string;
  description: string;
  lead: string;
  paragraphs: string[];
  useCases: string[];
  related: string[];
}

export const TOOL_HUBS: ToolHub[] = [
  {
    slug: 'pdf',
    group: 'document',
    label: 'PDF',
    title: 'PDF 도구 — 합치기·나누기·변환·보호·서명',
    description:
      'PDF 합치기, 나누기, 압축, JPG 변환, OCR, 서명, 암호 설정까지. 설치 없이 브라우저에서 처리하고 파일은 서버로 전송하지 않습니다.',
    lead: 'PDF를 합치고 나누고, 다른 형식으로 바꾸고, 안전하게 보호하는 도구를 한곳에 모았습니다.',
    paragraphs: [
      'PDF는 수정이 어렵고 프로그램마다 동작이 달라서, 필요한 작업만 골라 쓰는 것이 빠릅니다. 합치기·나누기·페이지 정리로 구성을 바꾸고, 압축·흑백·모아찍기로 인쇄와 전송에 맞게 다듬으세요.',
      '스캔 PDF는 OCR로 글자를 뽑고, 민감한 내용은 가리기·암호·서명으로 보호할 수 있습니다. 모든 처리는 브라우저 메모리에서 이루어지며 원본 파일은 서버로 올라가지 않습니다.',
    ],
    useCases: [
      '여러 PDF를 순서대로 하나로 합치기',
      '큰 PDF를 압축해 메일로 보내기',
      'PDF를 JPG로 바꿔 미리보기 만들기',
      '스캔 PDF에서 글자 추출하기',
      '제출용 PDF에 페이지 번호·서명 넣기',
    ],
    related: ['office', 'image', 'sheet'],
  },
  {
    slug: 'office',
    group: 'office',
    label: 'OFFICE',
    title: '오피스 문서 도구 — HWP·DOC·PPT·엑셀 열기와 PDF 변환',
    description:
      '한글(HWP·HWPX), 워드(DOC·DOCX), 파워포인트(PPT·PPTX), 엑셀(XLS·XLSX)을 설치 없이 열고 PDF로 저장합니다. 파일은 서버로 전송되지 않습니다.',
    lead: '한글·워드·파워포인트·엑셀 문서를 프로그램 없이 열고, PDF로 저장하는 도구입니다.',
    paragraphs: [
      '회사에서 받은 HWP 파일이나 워드·파워포인트 문서를 열기 위해 프로그램을 설치할 필요가 없습니다. 문서를 A4 페이지나 슬라이드로 그려 내용을 확인하고, 필요하면 PDF로 저장하세요.',
      '구형 .doc·.ppt 파일도 지원하지만 서식·이미지가 일부 단순화될 수 있습니다. 원본과 가까운 결과가 필요하면 최신 형식으로 저장한 뒤 사용하는 것이 좋습니다.',
    ],
    useCases: [
      '한글(HWP) 문서를 설치 없이 열기',
      '워드(DOCX) 문서를 PDF로 제출하기',
      '파워포인트(PPTX) 발표 자료를 PDF로 배포하기',
      '엑셀(XLSX) 표를 인쇄용 PDF로 만들기',
      '회사 문서의 내용을 빠르게 확인하기',
    ],
    related: ['pdf', 'image', 'text'],
  },
  {
    slug: 'image',
    group: 'image',
    label: 'IMAGE',
    title: '이미지 도구 — 압축·변환·자르기·OCR',
    description:
      '사진·스캔 이미지를 압축하고 JPG·PNG·WebP로 변환하고, 자르기·리사이즈·모자이크·OCR까지 브라우저에서 처리합니다.',
    lead: '사진과 스캔 이미지를 줄이고, 바꾸고, 다듬고, 글자를 뽑는 도구입니다.',
    paragraphs: [
      '제출용 사진은 용량·해상도·형식 조건이 까다롭습니다. 압축·리사이즈·형식 변환으로 조건을 맞추고, 증명사진·콜라주·테두리 같은 결과물도 만들 수 있습니다.',
      'HEIC처럼 브라우저가 바로 열지 못하는 형식도 JPG로 바꿀 수 있고, 스캔 이미지는 OCR로 텍스트를 추출합니다. 이미지 처리는 모두 이 브라우저 안에서 끝납니다.',
    ],
    useCases: [
      '아이폰 HEIC 사진을 JPG로 바꾸기',
      '제출용 사진 용량 줄이기',
      '증명사진 규격으로 자르기',
      '스캔 이미지에서 글자 추출하기',
      '여러 사진을 하나로 합치기',
    ],
    related: ['pdf', 'office', 'sheet'],
  },
  {
    slug: 'sheet',
    group: 'sheet',
    label: 'CSV',
    title: 'CSV·표 도구 — 보기·분석·합치기',
    description:
      'CSV·XLS·XLSX 표를 브라우저에서 열고, 정리·피벗·조인·통계·여러 표 합치기·SQL·차트로 바꿉니다. 엑셀 없이도 표 데이터를 다룰 수 있습니다.',
    lead: 'CSV·엑셀 표를 열고, 정리하고, 분석하고, 다른 형식으로 바꾸는 도구입니다.',
    paragraphs: [
      'CSV와 XLSX는 업무 데이터의 기본 형식이지만, 큰 표를 열거나 간단히 확인하려고 엑셀을 켜는 일은 번거롭습니다. 표 뷰어로 바로 확인하고, 필요한 경우 정리·피벗·조인으로 모양을 바꾸세요.',
      '같은 데이터를 JSON·HTML·SQL·XLSX·차트로 내보낼 수 있습니다. 표 파싱과 변환이 브라우저에서 실행되므로 거래처·매출 데이터도 서버에 올리지 않습니다.',
    ],
    useCases: [
      'CSV 파일을 엑셀 없이 표로 보기',
      '두 CSV를 키 기준으로 합치기',
      'CSV를 JSON·SQL로 변환하기',
      '표를 피벗으로 요약하기',
      'CSV 통계로 평균·빈도 보기',
      '여러 CSV·엑셀 파일을 한 표로 합치기',
    ],
    related: ['pdf', 'office', 'text'],
  },
  {
    slug: 'text',
    group: 'text',
    label: 'TEXT',
    title: '텍스트 도구 — 글자수·정리·비교·변환',
    description:
      '글자수 세기, 공백·줄바꿈 정리, 텍스트 비교, 대소문자·형식 변환, JSON 도구를 브라우저에서 사용합니다.',
    lead: '글자 수를 세고, 문장을 정리하고, 두 텍스트를 비교하고, 형식을 바꾸는 도구입니다.',
    paragraphs: [
      '보고서·자기소개서·번역문처럼 글자 수와 형식이 중요한 문서를 빠르게 점검할 수 있습니다. 공백·줄바꿈·중복 줄을 정리하고, 두 버전의 차이를 확인하세요.',
      '텍스트와 JSON은 서버로 전송되지 않고 브라우저에서만 처리됩니다. 민감한 문장도 안전하게 다듬을 수 있습니다.',
    ],
    useCases: [
      '자기소개서 글자수 확인하기',
      '복사한 문장의 공백·줄바꿈 정리하기',
      '두 문서 버전의 차이 비교하기',
      'JSON을 예쁘게 포맷하고 검증하기',
    ],
    related: ['sheet', 'utility', 'pdf'],
  },
  {
    slug: 'utility',
    group: 'utility',
    label: 'UTIL',
    title: '유틸 도구 — 계산·QR·도장·라벨·연락처',
    description:
      '날짜·영업일 계산, 퍼센트·부가세, 단위 변환, QR, 바코드, ZIP, 도장·서명, 주소 라벨·봉투, 비밀번호·파일 해시, vCard·ICS, 견적서까지 설치 없이 사용합니다.',
    lead: '날짜·계산·QR·도장·보안·파일 정리처럼 자주 쓰는 작은 도구입니다.',
    paragraphs: [
      '업무 중 자주 쓰는 계산과 생성 작업을 한곳에 모았습니다. 날짜 더하기·영업일 계산, 퍼센트·부가세, 단위 변환처럼 계산기 앱을 찾을 시간을 줄여 줍니다.',
      'QR 코드는 이미지·SVG로 내려받아 인쇄물에 바로 넣을 수 있고, 도장·서명은 투명 PNG로 만들어 PDF에 올릴 수 있습니다. 비밀번호 생성과 파일 해시 확인은 입력값을 서버로 보내지 않고 브라우저에서 끝냅니다.',
    ],
    useCases: [
      '회의 날짜와 영업일 계산하기',
      '부가세 포함·별도 금액 계산하기',
      'cm·inch·평 단위 바꾸기',
      'VCF 연락처·ICS 일정 파일 열기',
      '견적서·거래명세서 PDF 만들기',
      '도장·서명 이미지 만들기',
      '연락처를 VCF 파일로 만들기',
      '일정을 ICS 파일로 만들기',
      '여러 링크를 QR 코드로 한 번에 만들기',
      'ZIP을 열어 필요한 파일만 받기',
      '상품 바코드·라벨 PDF 만들기',
      '주소 라벨·DL 봉투 인쇄하기',
      '안전한 비밀번호 생성하기',
      '파일 해시로 무결성 확인하기',
      '연락처·링크 QR 코드 만들기',
      '사진 파일 이름을 규칙에 맞게 바꾸기',
    ],
    related: ['text', 'image', 'sheet'],
  },
];

export function hubFor(slug: string): ToolHub | undefined {
  return TOOL_HUBS.find((hub) => hub.slug === slug);
}
