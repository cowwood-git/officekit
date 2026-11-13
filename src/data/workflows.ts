/**
 * 작업 흐름(Job) — 여러 도구를 결과 중심으로 묶은 큐레이션.
 * 도구 목록과 달리 "무엇을 끝내고 싶은지"로 안내한다.
 */
export interface WorkflowStep {
  tool: string;
  title: string;
  body: string;
  optional?: boolean;
}

export interface Workflow {
  slug: string;
  title: string;
  description: string;
  lead: string;
  audience: string;
  steps: WorkflowStep[];
  tips: string[];
  related: string[];
}

export const WORKFLOWS: Workflow[] = [
  {
    slug: 'submit-pdf',
    title: '제출용 PDF 만들기',
    description:
      '워드·한글·파워포인트 문서를 PDF로 바꾸고, 합치고, 압축하고, 필요하면 암호를 걸어 제출용 파일로 만듭니다.',
    lead: '문서를 PDF로 바꾸고 한 파일로 합쳐 제출합니다.',
    audience: '입사지원·관공서·거래처 제출처럼 형식과 용량 조건이 있는 문서',
    steps: [
      {
        tool: 'docx-to-pdf',
        title: '문서를 PDF로 바꾸기',
        body: '워드(DOC·DOCX) 문서를 A4 PDF로 저장합니다. 한글은 HWP·HWPX → PDF, 발표 자료는 PPT·PPTX → PDF를 쓰세요.',
      },
      {
        tool: 'pdf-merge',
        title: 'PDF를 순서대로 합치기',
        body: '표지·본문·증빙을 원하는 순서로 하나의 PDF로 묶습니다. 합치기 전에 페이지 수와 순서를 확인하세요.',
      },
      {
        tool: 'pdf-compress',
        title: '용량 줄이기',
        body: '제출처의 용량 제한에 맞게 압축합니다. 화질이 중요하면 압축 수준을 낮춰 한 번만 적용하세요.',
      },
      {
        tool: 'pdf-protect',
        title: '필요하면 암호 걸기',
        body: '개인정보가 포함된 문서라면 암호를 설정합니다. 제출처와 암호를 전달하는 방법을 미리 정하세요.',
        optional: true,
      },
    ],
    tips: [
      '제출 전 PDF 뷰어로 첫 페이지와 마지막 페이지를 꼭 확인하세요.',
      '스캔본을 합칠 때는 페이지 방향이 섞이지 않았는지 확인하세요.',
      '암호를 걸었다면 제출처가 열 수 있는 형식인지 확인하세요.',
    ],
    related: ['open-office', 'sign-pdf'],
  },
  {
    slug: 'open-office',
    title: '회사 문서 열어보기',
    description:
      '한글(HWP·HWPX), 워드(DOC·DOCX), 파워포인트(PPT·PPTX), 엑셀(CSV·XLSX) 문서를 설치 없이 열어 내용을 확인합니다.',
    lead: 'HWP·워드·파워포인트·엑셀 문서를 설치 없이 확인합니다.',
    audience: '회사에서 받은 문서를 급하게 확인해야 할 때',
    steps: [
      {
        tool: 'hwpx-viewer',
        title: '한글 문서 열기',
        body: 'HWP는 자동으로 HWPX로 변환해 모든 페이지를 보여 줍니다. 한 쪽/두 쪽 보기로 넘겨 보세요.',
      },
      {
        tool: 'docx-viewer',
        title: '워드 문서 열기',
        body: 'DOCX의 본문·표·이미지를 확인합니다. 구형 .doc은 텍스트·표 중심으로 표시됩니다.',
      },
      {
        tool: 'pptx-viewer',
        title: '발표 자료 열기',
        body: 'PPTX 슬라이드를 넘기며 텍스트·이미지·표·차트를 확인합니다. 구형 .ppt도 지원합니다.',
      },
      {
        tool: 'sheet-viewer',
        title: '표 데이터 열기',
        body: 'CSV·XLS·XLSX 표를 페이지로 나눠 확인합니다. 수식은 계산된 표시값으로 읽습니다.',
      },
    ],
    tips: [
      '원본과 100% 같은 레이아웃이 필요하면 해당 프로그램에서 확인하세요.',
      '문서를 수정해야 한다면 원본 프로그램에서 편집한 뒤 다시 열어 보세요.',
      '민감한 문서는 탭을 닫으면 미리보기 데이터도 사라집니다.',
    ],
    related: ['submit-pdf', 'clean-sheet'],
  },
  {
    slug: 'shrink-photo',
    title: '제출용 사진 만들기',
    description:
      '아이폰 HEIC 사진을 JPG로 바꾸고, 자르기·리사이즈·압축으로 제출 규격과 용량에 맞춥니다.',
    lead: '사진 형식·크기·용량을 제출 조건에 맞춥니다.',
    audience: '지원서·관공서·학교 제출용 사진',
    steps: [
      {
        tool: 'heic-to-jpg',
        title: 'HEIC를 JPG로',
        body: '아이폰 사진이 열리지 않으면 먼저 JPG로 변환합니다.',
        optional: true,
      },
      {
        tool: 'image-crop',
        title: '규격에 맞게 자르기',
        body: '얼굴 위치와 여백을 확인하며 필요한 비율로 자릅니다.',
      },
      {
        tool: 'image-resize',
        title: '픽셀 크기 맞추기',
        body: '제출처가 요구하는 가로·세로 픽셀로 조정합니다. 비율 유지 옵션을 확인하세요.',
      },
      {
        tool: 'image-compress',
        title: '용량 줄이기',
        body: '화질을 확인하며 100KB·500KB 같은 제한에 맞춥니다.',
      },
    ],
    tips: [
      '자르기 전에 원본을 백업하세요.',
      '압축을 반복하면 화질이 떨어지므로 마지막에 한 번만 적용하세요.',
      '증명사진 규격은 나라·기관마다 다르니 공고문을 확인하세요.',
    ],
    related: ['submit-pdf', 'open-office'],
  },
  {
    slug: 'clean-sheet',
    title: '표 데이터 정리하기',
    description:
      'CSV·XLSX 표를 정리하고, 피벗으로 요약하고, 차트와 PDF로 보고서를 만듭니다. 엑셀 없이 브라우저에서 처리합니다.',
    lead: '표를 정리하고 요약해 보고서 형태로 만듭니다.',
    audience: '매출·재고·설문 데이터를 빠르게 정리할 때',
    steps: [
      {
        tool: 'csv-clean',
        title: '빈 행·중복 정리',
        body: '공백·중복·잘못된 구분자를 정리해 분석하기 좋은 표로 만듭니다.',
      },
      {
        tool: 'csv-pivot',
        title: '피벗으로 요약',
        body: '행·열·값을 골라 합계·평균 같은 요약 표를 만듭니다.',
      },
      {
        tool: 'csv-chart',
        title: '차트로 보여 주기',
        body: '막대·선·파이 차트로 바꿔 보고서에 넣습니다.',
      },
      {
        tool: 'csv-pdf',
        title: 'PDF 표로 저장',
        body: '긴 표는 페이지를 나누고 헤더를 반복해 인쇄용 PDF로 만듭니다.',
        optional: true,
      },
    ],
    tips: [
      '원본 CSV는 그대로 두고 정리된 사본을 내려받으세요.',
      '숫자에 쉼표가 있으면 문자로 처리될 수 있으니 먼저 정리하세요.',
      '피벗 전에 헤더 행이 한 줄인지 확인하세요.',
    ],
    related: ['open-office', 'submit-pdf'],
  },
  {
    slug: 'sign-pdf',
    title: 'PDF 서명·보호하기',
    description:
      'PDF에 서명·도장을 넣고, 민감한 내용을 가리거나 암호를 걸어 안전하게 전달하는 순서입니다.',
    lead: 'PDF에 서명하고, 가리고, 잠가서 전달합니다.',
    audience: '계약서·동의서·증빙을 PDF로 주고받을 때',
    steps: [
      {
        tool: 'pdf-sign',
        title: '서명·도장 넣기',
        body: '손으로 그리거나 이미지로 만든 서명을 원하는 위치에 배치합니다.',
      },
      {
        tool: 'pdf-redact',
        title: '민감한 내용 가리기',
        body: '주민번호·계좌번호처럼 남으면 안 되는 내용을 검게 가립니다.',
        optional: true,
      },
      {
        tool: 'pdf-protect',
        title: '암호 걸기',
        body: '열람 암호를 설정해 받는 사람만 열 수 있게 합니다.',
        optional: true,
      },
      {
        tool: 'pdf-merge',
        title: '첨부와 합치기',
        body: '계약서·별첨·증빙을 하나의 PDF로 묶어 전달합니다.',
        optional: true,
      },
    ],
    tips: [
      '서명 이미지는 투명 배경 PNG를 쓰면 자연스럽습니다.',
      '가리기는 원본 내용을 제거하는 방식인지 미리 확인하세요.',
      '암호는 받는 사람과 안전한 방법으로 따로 전달하세요.',
    ],
    related: ['submit-pdf', 'open-office'],
  },
  {
    slug: 'qr-card',
    title: 'QR·라벨 만들기',
    description:
      '연락처·링크·안내 문구를 QR 코드로 만들고, 인쇄 가능한 이미지로 내려받습니다. 만든 QR은 바로 확인할 수 있습니다.',
    lead: '링크와 안내 문구를 QR 코드로 만들어 붙입니다.',
    audience: '명함·포스터·안내문·라벨에 QR을 넣을 때',
    steps: [
      {
        tool: 'qr-generate',
        title: 'QR 코드 만들기',
        body: '링크·연락처·텍스트를 입력하고 크기와 여백을 조정합니다.',
      },
      {
        tool: 'image-compress',
        title: '인쇄용으로 다듬기',
        body: '내려받은 PNG의 용량과 크기를 인쇄물에 맞게 조정합니다.',
        optional: true,
      },
      {
        tool: 'qr-reader',
        title: '만든 QR 확인하기',
        body: '휴대폰으로 찍기 전에 QR 읽기로 내용이 맞는지 확인합니다.',
        optional: true,
      },
    ],
    tips: [
      'QR 주변에 충분한 여백을 두고, 너무 작게 인쇄하지 마세요.',
      '링크는 만료되지 않는 주소를 사용하세요.',
      '인쇄 후 실제 휴대폰으로 한 번 더 확인하세요.',
    ],
    related: ['shrink-photo', 'open-office'],
  },
];

export function workflowFor(slug: string): Workflow | undefined {
  return WORKFLOWS.find((workflow) => workflow.slug === slug);
}
