/**
 * 도구 화면 아래 «함께 쓰면 좋은 도구» 목록.
 *
 * 왜: 손으로 고른 related 는 도구마다 3개 남짓이라 내부 링크가 적었다. 검색엔진은 내부 링크로
 * 페이지를 찾고 중요도를 나누며, 방문자는 다음 도구로 넘어가며 더 많은 페이지(=광고 노출)를 본다.
 * 손으로 고른 것을 맨 앞에 두고, 아래 순서로 LIMIT 개까지 채운다.
 *   1. 손으로 고른 related
 *   2. 이 도구를 related 로 고른 도구(역방향 — 서로 잇는다)
 *   3. 같은 작업 흐름에 함께 나오는 도구
 *   4. 같은 홈 묶음에서 목록상 바로 뒤의 도구들(돌아가며) — 앞쪽 도구에만 링크가 몰리지 않게
 */
import { groupFor } from '../data/app-groups';
import { TOOL_HUBS, type ToolHub } from '../data/tool-hubs';
import { getTool, type Tool, tools } from '../data/tools';
import { WORKFLOWS, type Workflow } from '../data/workflows';

export const RELATED_LIMIT = 8;

export function relatedToolsFor(slug: string, limit = RELATED_LIMIT): Tool[] {
  const self = getTool(slug);
  if (!self) return [];
  const picked: string[] = [];
  const add = (candidate: string) => {
    if (picked.length >= limit || candidate === slug || picked.includes(candidate)) return;
    if (getTool(candidate)) picked.push(candidate);
  };

  for (const candidate of self.related) add(candidate);
  for (const tool of tools) if (tool.related.includes(slug)) add(tool.slug);
  for (const workflow of workflowsFor(slug)) {
    for (const step of workflow.steps) add(step.tool);
  }
  const group = groupFor(slug);
  if (group) {
    const items = group.items;
    const at = items.findIndex((tool) => tool.slug === slug);
    for (let offset = 1; offset < items.length; offset += 1) {
      add((items[(at + offset) % items.length] as Tool).slug);
    }
  }
  return picked.map((candidate) => getTool(candidate) as Tool);
}

/** 이 도구가 단계로 나오는 작업 흐름. */
export function workflowsFor(slug: string): Workflow[] {
  return WORKFLOWS.filter((workflow) => workflow.steps.some((step) => step.tool === slug));
}

/** 이 도구가 속한 형식 허브(/pdf/ 등). */
export function hubForTool(slug: string): ToolHub | undefined {
  const group = groupFor(slug);
  return group ? TOOL_HUBS.find((hub) => hub.group === group.id) : undefined;
}

/** 구조화 데이터 빵부스러기에 넣을 허브 항목(화면의 홈 › 허브 › 도구와 같게). */
export function hubCrumb(slug: string): Array<{ name: string; path: string }> {
  const hub = hubForTool(slug);
  return hub ? [{ name: hub.label, path: `/${hub.slug}/` }] : [];
}
