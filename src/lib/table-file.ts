export interface TableData {
  rows: string[][];
  sheetName: string;
}

export interface SheetData {
  name: string;
  rows: string[][];
}

export function isDelimitedFile(name: string): boolean {
  return /\.(csv|tsv)$/i.test(name);
}

export type TextEncoding = 'auto' | 'utf-8' | 'euc-kr';

/** UTF-8을 우선 시도하고, 실패하면 EUC-KR로 읽는다. encoding 을 주면 그 방식으로 읽는다. */
export function decodeDelimited(bytes: Uint8Array, encoding: TextEncoding = 'auto'): string {
  if (encoding === 'utf-8') return new TextDecoder('utf-8').decode(bytes);
  if (encoding === 'euc-kr') {
    try {
      return new TextDecoder('euc-kr').decode(bytes);
    } catch {
      return new TextDecoder('utf-8').decode(bytes);
    }
  }
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    try {
      return new TextDecoder('euc-kr').decode(bytes);
    } catch {
      return new TextDecoder('utf-8').decode(bytes);
    }
  }
}

/** CSV·TSV·XLSX·XLS·ODS 파일의 모든 시트를 문자열 표로 읽는다. */
export async function readWorkbookSheets(file: File): Promise<SheetData[]> {
  const XLSX = await import('xlsx');
  let workbook: ReturnType<typeof XLSX.read>;
  if (isDelimitedFile(file.name)) {
    const text = decodeDelimited(new Uint8Array(await file.arrayBuffer()));
    workbook = XLSX.read(text, { type: 'string' });
  } else {
    workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  }

  const sheets: SheetData[] = [];
  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    sheets.push({
      name,
      rows: XLSX.utils.sheet_to_json<string[]>(sheet, {
        header: 1,
        raw: false,
        defval: '',
      }),
    });
  }
  if (sheets.length === 0) throw new Error('시트가 없습니다.');
  return sheets;
}

/** CSV·TSV·XLSX·XLS·ODS 파일을 첫 시트의 문자열 표로 읽는다. */
export async function readTableFile(file: File): Promise<TableData> {
  const sheets = await readWorkbookSheets(file);
  const first = sheets[0];
  if (!first) throw new Error('시트를 읽지 못했습니다.');
  return { rows: first.rows, sheetName: first.name };
}
