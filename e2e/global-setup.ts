import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import JSZip from 'jszip';
import { degrees, PDFDocument, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';
import sharp from 'sharp';
import * as XLSX from 'xlsx';

const OUT = join(process.cwd(), 'e2e', '.fixtures');

async function makePdf(name: string, labels: string[]): Promise<void> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const label of labels) {
    const page = doc.addPage([595, 842]);
    page.drawText(label, { x: 60, y: 700, size: 48, font });
  }
  await writeFile(join(OUT, name), await doc.save());
}

async function makeRotatedPdf(): Promise<void> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  page.drawText('ROTATED PAGE', { x: 60, y: 700, size: 40, font });
  page.setRotation(degrees(90));
  await writeFile(join(OUT, 'rotated.pdf'), await doc.save());
}

async function makeFormPdf(): Promise<void> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const label = (text: string, y: number) => page.drawText(text, { x: 50, y, size: 12, font });
  page.drawText('APPLICATION FORM', { x: 50, y: 790, size: 20, font });
  label('Name', 728);
  label('Department', 688);
  label('Gender', 640);
  label('Agree', 590);
  label('Team', 540);
  label('Interests', 490);
  label('Memo', 430);

  const form = doc.getForm();
  const name = form.createTextField('name');
  name.addToPage(page, { x: 160, y: 720, width: 300, height: 24 });
  const department = form.createTextField('department');
  department.addToPage(page, { x: 160, y: 680, width: 300, height: 24 });
  const agree = form.createCheckBox('agree');
  agree.addToPage(page, { x: 160, y: 582, width: 18, height: 18 });
  const gender = form.createRadioGroup('gender');
  gender.addOptionToPage('male', page, { x: 160, y: 632, width: 18, height: 18 });
  gender.addOptionToPage('female', page, { x: 220, y: 632, width: 18, height: 18 });
  const team = form.createDropdown('team');
  team.addOptions(['dev', 'sales']);
  team.addToPage(page, { x: 160, y: 532, width: 200, height: 24 });
  const interests = form.createOptionList('interests');
  interests.addOptions(['design', 'data', 'writing']);
  interests.addToPage(page, { x: 160, y: 450, width: 200, height: 70 });
  const memo = form.createTextField('memo');
  memo.enableMultiline();
  memo.addToPage(page, { x: 160, y: 370, width: 300, height: 60 });

  await writeFile(join(OUT, 'form.pdf'), await doc.save());
}

async function makeImages(): Promise<void> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800">
    <rect width="1200" height="800" fill="#0b6b5b"/>
    <rect x="80" y="120" width="1040" height="560" fill="#e6f2ef"/>
    <text x="140" y="300" font-family="Helvetica, sans-serif" font-size="72" fill="#14181f">OFFICEKIT TEST IMAGE</text>
    <text x="140" y="420" font-family="Helvetica, sans-serif" font-size="40" fill="#5b6472">compress / crop / convert</text>
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 92 }).toFile(join(OUT, 'big.jpg'));

  const transparent = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200">
    <rect x="100" y="50" width="200" height="100" fill="#0b6b5b"/>
  </svg>`;
  await sharp(Buffer.from(transparent)).png().toFile(join(OUT, 'wide.png'));

  const vector = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100">
    <rect width="100" height="100" fill="#0000ff"/>
    <circle cx="150" cy="50" r="40" fill="#ff0000"/>
  </svg>`;
  await writeFile(join(OUT, 'vector.svg'), vector);

  const ocr = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="300">
    <rect width="900" height="300" fill="#ffffff"/>
    <text x="50" y="130" font-family="Helvetica, sans-serif" font-size="56" fill="#111111">OFFICEKIT OCR 2026</text>
    <text x="50" y="220" font-family="Helvetica, sans-serif" font-size="40" fill="#333333">INVOICE 1250000</text>
  </svg>`;
  await sharp(Buffer.from(ocr)).png().toFile(join(OUT, 'ocr-en.png'));

  const pages = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="500">
    <rect width="900" height="500" fill="#ffffff"/>
    <text x="50" y="140" font-family="Helvetica, sans-serif" font-size="56" fill="#111111">SCANNED PAGE</text>
    <text x="50" y="250" font-family="Helvetica, sans-serif" font-size="40" fill="#333333">OFFICEKIT OCR TEST</text>
  </svg>`;
  await sharp(Buffer.from(pages)).png().toFile(join(OUT, 'scan.png'));

  await sharp(join(OUT, 'big.jpg'))
    .jpeg({ quality: 90 })
    .withMetadata({
      exif: {
        IFD0: { Make: 'OfficeKit', Model: 'TestCam', Software: 'OfficeKit Fixture' },
        IFD3: { DateTimeOriginal: '2026:11:10 12:00:00' },
      },
    })
    .toFile(join(OUT, 'exif.jpg'));

  await QRCode.toFile(join(OUT, 'qr-sample.png'), 'https://officekit.kr', {
    width: 480,
    margin: 4,
  });
  await QRCode.toFile(join(OUT, 'qr-text.png'), 'OFFICEKIT-2026', {
    width: 480,
    margin: 4,
  });
}

async function makeScannedPdf(): Promise<void> {
  const doc = await PDFDocument.create();
  const image = await doc.embedPng(await sharp(join(OUT, 'scan.png')).png().toBuffer());
  for (let index = 0; index < 2; index += 1) {
    const page = doc.addPage([595, 842]);
    const scale = 520 / image.width;
    page.drawImage(image, {
      x: 37,
      y: 520,
      width: image.width * scale,
      height: image.height * scale,
    });
  }
  await writeFile(join(OUT, 'scanned.pdf'), await doc.save());
}

/** 글자 + 큰 사진 PDF — 글자 유지 압축 확인용 */
async function makePhotoTextPdf(): Promise<void> {
  const width = 2400;
  const height = 1600;
  const raw = Buffer.alloc(width * height * 3);
  for (let i = 0; i < raw.length; i += 1) raw[i] = (i * 7 + ((i * 2654435761) >>> 24)) & 255;
  const jpg = await sharp(raw, { raw: { width, height, channels: 3 } })
    .jpeg({ quality: 95 })
    .toBuffer();
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.addPage([595, 842]);
  page.drawText('KEEP THIS TEXT', { x: 50, y: 790, size: 20, font });
  page.drawImage(await doc.embedJpg(jpg), { x: 50, y: 300, width: 495, height: 330 });
  await writeFile(join(OUT, 'photo-text.pdf'), await doc.save());
}

async function makeXlsx(): Promise<void> {
  const rows: unknown[][] = [['번호', '거래일', '거래처', '수량', '단가', '금액']];
  for (let index = 1; index <= 120; index += 1) {
    rows.push([
      index,
      `2026-11-${String((index % 28) + 1).padStart(2, '0')}`,
      `거래처 ${index % 10}`,
      (index % 5) + 1,
      1000,
      0,
    ]);
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(rows), '매출');
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ['구분', '값'],
      ['총건수', 120],
      ['담당', '김오피스'],
    ]),
    '요약',
  );
  await writeFile(
    join(OUT, 'sample.xlsx'),
    XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }),
  );
}

async function makeDocx(): Promise<void> {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`,
  );
  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  zip
    .folder('word')
    ?.folder('_rels')
    ?.file(
      'document.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`,
    );
  zip.folder('word')?.file(
    'styles.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="36"/></w:rPr></w:style>
</w:styles>`,
  );
  zip.folder('word')?.file(
    'document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>
<w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>계약서 개요</w:t></w:r></w:p>
<w:p><w:r><w:t>본 계약은 </w:t></w:r><w:r><w:rPr><w:b/></w:rPr><w:t>오피스킷</w:t></w:r><w:r><w:t> 테스트 문서입니다.</w:t></w:r></w:p>
<w:tbl>
<w:tr><w:tc><w:p><w:r><w:t>항목</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>값</w:t></w:r></w:p></w:tc></w:tr>
<w:tr><w:tc><w:p><w:r><w:t>금액</w:t></w:r></w:p></w:tc><w:tc><w:p><w:r><w:t>1,250,000원</w:t></w:r></w:p></w:tc></w:tr>
</w:tbl>
</w:body></w:document>`,
  );
  await writeFile(join(OUT, 'sample.docx'), await zip.generateAsync({ type: 'nodebuffer' }));
}

export default async function globalSetup(): Promise<void> {
  await mkdir(OUT, { recursive: true });

  await makePdf('merge-a.pdf', ['A1', 'A2', 'A3']);
  await makePdf('merge-b.pdf', ['B1', 'B2']);
  await makePdf(
    'ten.pdf',
    Array.from({ length: 10 }, (_, index) => `P${index + 1}`),
  );
  await makePdf('pages.pdf', ['PAGE A', 'PAGE B', 'PAGE C', 'PAGE D', 'PAGE E']);
  await makeRotatedPdf();
  await makeFormPdf();

  await makeImages();
  await makeScannedPdf();
  await makePhotoTextPdf();
  await makeXlsx();
  await makeDocx();

  await writeFile(
    join(OUT, 'sample.csv'),
    '\uFEFF이름,부서,금액\n김오피스,개발,1200000\n이데이터,영업,950000',
  );
  await writeFile(
    join(OUT, 'pivot.csv'),
    '지역,제품,금액\n서울,A,100\n서울,B,200\n부산,A,300\n부산,A,150\n',
  );
  await writeFile(
    join(OUT, 'join-left.csv'),
    '사번,이름,부서\n1,김오피스,개발\n2,이데이터,영업\n3,박없음,영업\n',
  );
  await writeFile(
    join(OUT, 'join-right.csv'),
    '사번,이메일,연락처\n1,a@officekit.kr,010-1111-1111\n2,b@officekit.kr,010-2222-2222\n4,d@officekit.kr,010-4444-4444\n',
  );
  const signature = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160">
    <path d="M40 110 C80 30 120 30 150 100 S220 150 260 70" fill="none" stroke="#111827" stroke-width="6" stroke-linecap="round"/>
    <text x="250" y="130" font-family="Helvetica, sans-serif" font-size="34" fill="#111827">OfficeKit</text>
  </svg>`;
  await sharp(Buffer.from(signature)).png().toFile(join(OUT, 'signature.png'));

  await writeFile(
    join(OUT, 'messy.csv'),
    '\uFEFF이름,부서,금액\n 김오피스 ,개발,1200000\n이데이터,영업,950000\n김오피스,개발,1200000\n\n박영업,영업,800000\n',
  );
  await writeFile(
    join(OUT, 'sample.json'),
    JSON.stringify([
      { name: '김오피스', dept: '개발', amount: 1200000 },
      { name: '이데이터', dept: '영업', amount: 950000 },
    ]),
  );

  if (process.platform === 'darwin') {
    try {
      execFileSync(
        'sips',
        ['-s', 'format', 'heic', join(OUT, 'big.jpg'), '--out', join(OUT, 'sample.heic')],
        {
          stdio: 'ignore',
        },
      );
    } catch {
      // HEIC 변환이 불가능한 환경에서는 HEIC 테스트를 건너뛴다.
    }
  }
}
