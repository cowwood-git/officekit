/** XML 텍스트·속성 이스케이프. */
export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 줄바꿈은 HWPX에서 CR로 읽는다. */
export function textRuns(value: string): string {
  return escapeXml(value).replace(/\r?\n/g, '\r');
}
