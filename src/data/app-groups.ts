import { capabilityFor, type FormatId } from './tool-capabilities';
import { type Tool, tools } from './tools';

export interface AppGroup {
  id: string;
  label: string;
  note: string;
  items: Tool[];
}

// 홈 묶음은 tool-capabilities 의 format 하나로만 정한다(도구 화면 상단 표시·허브·검색이 모두 이걸 따른다).
const byFormat = (format: FormatId) =>
  tools.filter((tool) => capabilityFor(tool.slug).format === format);

// 홈 카드 이름은 짧은 영문 대문자(카드 오른쪽 아래 워터마크로 보인다).
export const APP_GROUPS: AppGroup[] = [
  {
    id: 'document',
    label: 'PDF',
    note: 'PDF를 합치고 나누고, 압축·변환·보호하는 문서 작업',
    items: byFormat('document'),
  },
  {
    id: 'office',
    label: 'OFFICE',
    note: '워드·엑셀·한글·파워포인트 문서를 열고 PDF로 저장하는 도구',
    items: byFormat('office'),
  },
  {
    id: 'image',
    label: 'IMAGE',
    note: '사진·스캔본의 용량을 줄이고 형식을 바꾸는 작업',
    items: byFormat('image'),
  },
  {
    id: 'sheet',
    label: 'CSV',
    note: 'CSV 표를 정리하고 다른 형식으로 바꾸는 작업',
    items: byFormat('sheet'),
  },
  {
    id: 'text',
    label: 'TEXT',
    note: '글자 수·문장 정리·변환과 JSON 같은 글 다루는 도구',
    items: byFormat('text'),
  },
  {
    id: 'utility',
    label: 'UTIL',
    note: '계산·날짜·단위·QR·연락처·일정 파일·견적서·도장·라벨처럼 자주 쓰는 작은 도구',
    items: byFormat('utility'),
  },
];

const GROUP_OF = new Map(
  APP_GROUPS.flatMap((group) => group.items.map((tool) => [tool.slug, group] as const)),
);

/** 도구가 속한 홈 묶음(도구 화면 상단 표시·목록에서 같은 이름을 쓴다). */
export function groupFor(slug: string): AppGroup | undefined {
  return GROUP_OF.get(slug);
}
