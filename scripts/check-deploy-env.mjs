/**
 * 운영 배포 전 점검: 광고 게시자 ID 가 빠진 채 배포되는 것을 막는다.
 *
 * 왜: 배포는 로컬에서 빌드해 직접 올린다. .env(gitignore)가 없는 맥·새 클론에서 배포하면
 * 광고 스크립트·ads.txt·방침 문구가 «조용히» 빠진 사이트가 올라가 수익이 끊긴다.
 * 게시자 ID 는 공개값이라 docs/deploy.md 에 적어 두었다 — 거기서 복구한다.
 * 광고 없이 일부러 올릴 때만 ALLOW_NO_ADS=1.
 */
import { existsSync } from 'node:fs';

if (existsSync('.env')) process.loadEnvFile('.env');
const client = process.env.PUBLIC_ADSENSE_CLIENT ?? '';

if (/^ca-pub-\d{10,}$/.test(client)) {
  console.log(`배포 점검 통과 — 광고 게시자 ${client}`);
} else if (process.env.ALLOW_NO_ADS === '1') {
  console.warn('⚠️  광고 없이 배포한다(ALLOW_NO_ADS=1).');
} else {
  console.error(
    '✗ PUBLIC_ADSENSE_CLIENT 가 없다 — 이대로 배포하면 광고가 빠진다.\n' +
      '  .env 에 게시자 ID 를 넣는다(값은 docs/deploy.md §4). 일부러 광고 없이 올리려면 ALLOW_NO_ADS=1.',
  );
  process.exit(1);
}
