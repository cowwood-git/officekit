// 배포물에 들어가는 오픈소스의 저작권·라이선스 고지를 한 파일로 모은다(public/third-party-licenses.txt).
// MIT·BSD·Apache 등은 배포할 때 원문 고지를 함께 줘야 하는데, 번들 압축 과정에서 주석이 빠지므로 따로 낸다.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const OUT = join(ROOT, 'public', 'third-party-licenses.txt');
const LICENSE_FILE = /^(licen[cs]e|copying|notice)(\.|-|$)/i;

/** package-lock 의 운영 의존성(개발 전용 제외) 경로 목록 */
export function productionPackages(lock) {
  return Object.entries(lock.packages ?? {})
    .filter(([path, info]) => path.startsWith('node_modules/') && !info.dev && !info.devOptional)
    .map(([path]) => path);
}

/** 패키지 폴더에서 이름·버전·라이선스·원문을 읽는다. 설치되지 않은 선택 패키지는 null. */
export function readPackage(dir) {
  const manifest = join(dir, 'package.json');
  if (!existsSync(manifest)) return null;
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'));
  const files = readdirSync(dir)
    .filter((name) => LICENSE_FILE.test(name))
    .sort();
  const texts = files.map((name) => readFileSync(join(dir, name), 'utf8').trim());
  const license =
    typeof pkg.license === 'string'
      ? pkg.license
      : (pkg.license?.type ?? pkg.licenses?.map((item) => item.type).join(' OR ') ?? 'UNKNOWN');
  return { name: pkg.name, version: pkg.version, license, homepage: pkg.homepage ?? '', texts };
}

export function render(packages) {
  const header = [
    '옷깃(officekit.kr)이 사용하는 오픈소스 — 저작권·라이선스 고지',
    'Third-party open source notices for officekit.kr',
    '',
    '옷깃 자체 코드는 GNU AGPL-3.0 으로 공개합니다: https://github.com/cowwood-git/officekit',
    '나눔고딕 글꼴(SIL Open Font License 1.1): /fonts/NanumGothic-OFL.txt',
    '',
    `패키지 ${packages.length}개`,
    '',
  ];
  const body = packages.map((pkg) =>
    [
      '='.repeat(72),
      `${pkg.name}@${pkg.version} — ${pkg.license}`,
      pkg.homepage ? pkg.homepage : null,
      '',
      pkg.texts.length > 0 ? pkg.texts.join('\n\n') : `(라이선스 원문 파일 없음 — ${pkg.license})`,
      '',
    ]
      .filter((line) => line !== null)
      .join('\n'),
  );
  // 맨 앞 BOM: 응답 헤더의 charset 을 놓친 브라우저도 UTF-8로 읽게 한다(한국어 환경은 EUC-KR로 추측해 깨진다).
  return `\uFEFF${[...header, ...body].join('\n')}\n`;
}

export function build() {
  const lock = JSON.parse(readFileSync(join(ROOT, 'package-lock.json'), 'utf8'));
  const seen = new Set();
  const packages = [];
  for (const path of productionPackages(lock)) {
    const pkg = readPackage(join(ROOT, path));
    if (!pkg) continue;
    const key = `${pkg.name}@${pkg.version}`;
    if (seen.has(key)) continue;
    seen.add(key);
    packages.push(pkg);
  }
  packages.sort((a, b) => a.name.localeCompare(b.name));
  writeFileSync(OUT, render(packages));
  return packages.length;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) console.log(`third-party-licenses.txt: 패키지 ${build()}개`);
