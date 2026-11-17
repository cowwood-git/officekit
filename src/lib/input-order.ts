import type { FormField, RepeatGroup } from './doc/types';

export type InputEntry =
  | { kind: 'fields'; name: string; fields: FormField[] }
  | { kind: 'rows'; group: RepeatGroup };

/**
 * 입력 화면의 구역 순서를 만든다.
 *
 * 필드 그룹은 필드 배열에 처음 나온 순서를 따르고, 반복 표는 `group`에 적힌
 * 구역 바로 뒤에 끼워 넣는다. 반복 표끼리도 이어 붙일 수 있어(지급 내역 → 공제 내역)
 * 문서 순서를 그대로 재현할 수 있다.
 */
export function orderInputs(
  fields: readonly FormField[],
  groups: readonly RepeatGroup[] = [],
): InputEntry[] {
  const fieldGroups: Array<{ name: string; fields: FormField[] }> = [];
  for (const field of fields) {
    const group = fieldGroups.find((item) => item.name === field.group);
    if (group) group.fields.push(field);
    else fieldGroups.push({ name: field.group, fields: [field] });
  }

  const anchored = new Map<string, RepeatGroup[]>();
  for (const group of groups) {
    if (!group.group) continue;
    const list = anchored.get(group.group);
    if (list) list.push(group);
    else anchored.set(group.group, [group]);
  }

  const entries: InputEntry[] = [];
  const used = new Set<string>();
  const emitRows = (anchor: string) => {
    for (const group of anchored.get(anchor) ?? []) {
      if (used.has(group.id)) continue;
      used.add(group.id);
      entries.push({ kind: 'rows', group });
      // 반복 표를 기준으로 또 다른 반복 표를 붙일 수 있다.
      emitRows(group.label);
    }
  };

  for (const group of fieldGroups) {
    entries.push({ kind: 'fields', name: group.name, fields: group.fields });
    emitRows(group.name);
  }

  // group이 없거나 잘못된 반복 표는 마지막에 둔다.
  for (const group of groups) {
    if (used.has(group.id)) continue;
    entries.push({ kind: 'rows', group });
  }

  return entries;
}
