/**
 * 도구 첫 화면의 "예시로 체험하기" 데이터.
 *
 * 파일을 준비하지 않은 사용자가 도구의 입력과 결과를 먼저 경험할 수 있도록,
 * 각 도구가 실제로 읽는 형식(CSV)의 작은 예시를 둔다.
 * input 값은 해당 도구 화면의 input[id]와 같아야 한다.
 */
export interface ToolSampleFile {
  /** 예시 파일을 넣을 input id. */
  input: string;
  name: string;
  type: string;
  content: string;
}

export interface ToolSampleText {
  /** 파일 대신 붙여넣을 입력란 id. */
  target: string;
  content: string;
}

export interface ToolSample {
  /** 버튼 아래에 보이는 한 줄 설명. */
  summary: string;
  /** 이 도구에 필요한 파일 조건. */
  requirements: readonly string[];
  files?: readonly ToolSampleFile[];
  /** 파일 입력 없이 텍스트로 시작하는 도구(CSV ↔ JSON). */
  text?: ToolSampleText;
  /** 파일을 읽으면 나타나는 영역. 이 영역이 보일 때까지 기다린다. */
  ready?: string;
  /** 준비된 뒤 자동으로 누를 실행 버튼 id. */
  run?: string;
}

export const TOOL_SAMPLES: Record<string, ToolSample> = {
  'csv-json': {
    summary: '작은 표를 JSON으로 바꿔 봅니다.',
    requirements: ['CSV는 첫 행이 열 이름', 'JSON은 객체 배열([{...}]) 형식'],
    text: {
      target: 'cj-source',
      content: 'name,dept,amount\n김옷깃,개발,1200000\n이데이터,영업,950000\n',
    },
    run: 'cj-convert',
  },
  'csv-clean': {
    summary: '공백·중복·빈 행이 있는 표를 정리합니다.',
    requirements: ['CSV 또는 XLSX · 첫 행이 열 이름', '정리할 열을 고르거나 전체를 정리'],
    files: [
      {
        input: 'cc-input',
        name: '정리전.csv',
        type: 'text/csv',
        content:
          '이름,부서,금액\n 김옷깃 ,영업, 120000\n이데이터,개발,950000\n이데이터,개발,950000\n\n박표,기획,870000\n',
      },
    ],
    ready: 'cc-panel',
    run: 'cc-run',
  },
  'csv-table': {
    summary: '표를 HTML·Markdown 코드로 바꿉니다.',
    requirements: ['CSV 또는 XLSX · 첫 행이 열 이름', '결과를 블로그·README에 붙여넣기'],
    files: [
      {
        input: 'ct-input',
        name: '품목표.csv',
        type: 'text/csv',
        content: '품목,수량,단가\nA4 복사용지,10,28000\n토너,2,82000\n',
      },
    ],
    ready: 'ct-panel',
    run: 'ct-run',
  },
  'csv-sql': {
    summary: '주문 표로 CREATE TABLE·INSERT 문을 만듭니다.',
    requirements: ['CSV 또는 XLSX · 첫 행이 열 이름', '표 이름은 파일 이름에서 자동으로 채웁니다'],
    files: [
      {
        input: 'cs-input',
        name: '주문.csv',
        type: 'text/csv',
        content:
          '주문번호,고객,금액,주문일\n1001,김옷깃,330000,2026-11-01\n1002,이데이터,120000,2026-11-03\n1003,박표,0,2026-11-05\n',
      },
    ],
    ready: 'cs-panel',
    run: 'cs-run',
  },
  'csv-pivot': {
    summary: '지점·월별 매출 표로 합계표를 만듭니다.',
    requirements: ['CSV 또는 XLSX · 첫 행이 열 이름', '행 기준·열 기준·숫자 열이 각각 1개 이상'],
    files: [
      {
        input: 'cpv-input',
        name: '지점별매출.csv',
        type: 'text/csv',
        content:
          '지점,월,매출,건수\n강남,1월,1200000,12\n강남,2월,1500000,15\n홍대,1월,900000,9\n홍대,2월,1100000,11\n판교,1월,1300000,13\n판교,2월,1250000,12\n',
      },
    ],
    ready: 'cpv-panel',
    run: 'cpv-run',
  },
  'csv-join': {
    summary: '직원명단과 연락처를 사번으로 합쳐 봅니다.',
    requirements: ['CSV 또는 XLSX · 첫 행이 열 이름', '두 표에 같은 값이 있는 열 1개 (예: 사번)'],
    files: [
      {
        input: 'cj-left-input',
        name: '직원명단.csv',
        type: 'text/csv',
        content:
          '사번,이름,부서\n1001,김옷깃,경영지원\n1002,이데이터,영업\n1003,박표,개발\n1004,최문서,기획\n',
      },
      {
        input: 'cj-right-input',
        name: '연락처.csv',
        type: 'text/csv',
        content:
          '사번,이메일,연락처\n1001,kim@example.com,010-1111-2222\n1002,lee@example.com,010-2222-3333\n1003,park@example.com,010-3333-4444\n',
      },
    ],
    ready: 'cj-panel',
    run: 'cj-run',
  },
  'csv-xlsx': {
    summary: 'CSV 표를 엑셀(XLSX)로 바꿉니다.',
    requirements: ['CSV 또는 XLSX · 첫 행이 열 이름', '시트 이름과 변환 방향을 고를 수 있습니다'],
    files: [
      {
        input: 'cx-input',
        name: '품목표.csv',
        type: 'text/csv',
        content: '품목,수량,단가\nA4 복사용지,10,28000\n토너,2,82000\n',
      },
    ],
    ready: 'cx-panel',
    run: 'cx-run',
  },
  'csv-chart': {
    summary: '지점별 매출을 막대 차트로 그립니다.',
    requirements: ['CSV 또는 XLSX · 첫 행이 열 이름', '범주 열 1개 + 숫자 열 1개'],
    files: [
      {
        input: 'cc-input',
        name: '지점매출.csv',
        type: 'text/csv',
        content: '지점,매출\n강남,2700000\n홍대,2000000\n판교,2550000\n',
      },
    ],
    ready: 'cc-panel',
  },
  'csv-stats': {
    summary: '매출·건수의 평균과 분포를 확인합니다.',
    requirements: ['CSV 또는 XLSX · 첫 행이 열 이름', '통계를 낼 숫자 열 1개 이상'],
    files: [
      {
        input: 'cs-input',
        name: '지점실적.csv',
        type: 'text/csv',
        content: '지점,매출,건수\n강남,2700000,27\n홍대,2000000,20\n판교,2550000,25\n',
      },
    ],
    ready: 'cs-panel',
    run: 'cs-run',
  },
  'merge-tables': {
    summary: '1월·2월 표를 같은 열 기준으로 세로로 합칩니다.',
    requirements: ['CSV 또는 XLSX 파일 2개 이상', '모든 파일의 열 이름이 같아야 합니다'],
    files: [
      {
        input: 'mt-input',
        name: '1월.csv',
        type: 'text/csv',
        content:
          '날짜,품목,수량,금액\n2026-01-05,A4 복사용지,10,280000\n2026-01-12,토너,2,164000\n',
      },
      {
        input: 'mt-input',
        name: '2월.csv',
        type: 'text/csv',
        content: '날짜,품목,수량,금액\n2026-02-03,A4 복사용지,8,224000\n2026-02-20,볼펜,5,30000\n',
      },
    ],
    ready: 'mt-panel',
    run: 'mt-run',
  },
};
