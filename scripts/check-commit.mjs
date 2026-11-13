#!/usr/bin/env node
// 커밋 직전 검사 — 공개 저장소에 비밀값·개인정보가 섞여 들어가는 것을 막는다.
//
//   node scripts/check-commit.mjs staged        # pre-commit: 스테이징된 변경(추가된 줄)과 파일 이름
//   node scripts/check-commit.mjs msg <파일>    # commit-msg: 커밋 메시지
//   node scripts/check-commit.mjs install       # .githooks 를 이 저장소의 훅 경로로 등록
//
// 공통 규칙은 이 파일에 있다. 저장소마다 따로 막고 싶은 단어(내부 이름 등)는
// 공개되면 안 되므로 커밋하지 않는 로컬 목록(LOCAL_LISTS)에 한 줄에 하나씩 정규식으로 적는다.
// 정말 필요한 줄이면 그 줄에 `check-commit:allow` 를 적으면 건너뛴다.
// 급할 때 훅 전체를 건너뛰려면 `git commit --no-verify`.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const LOCAL_LISTS = ['docs/commit-blocklist.txt', '.git/commit-blocklist.txt'];
const ALLOW_MARK = 'check-commit:allow';

/** 커밋하면 안 되는 파일 이름 */
export const BLOCKED_FILES = [
  { re: /\.(pem|key|p12|pfx|bak|db|sqlite3?)$/i, why: '키·인증서·DB·백업 파일' },
  { re: /(^|\/)\.env(\.(?!example$)[^/]*)?$/, why: '.env 파일' },
  { re: /(^|\/)\.dev\.vars$/, why: '로컬 비밀 변수 파일' },
  { re: /(^|\/)id_(rsa|ed25519|ecdsa)(\.pub)?$/, why: 'SSH 키' },
];

/** 추가된 줄에 들어 있으면 안 되는 내용 */
export const BLOCKED_CONTENT = [
  { re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/, why: '개인키' },
  { re: /\bgh[pousr]_[A-Za-z0-9]{30,}\b|\bgithub_pat_[A-Za-z0-9_]{20,}/, why: 'GitHub 토큰' },
  { re: /\bAKIA[0-9A-Z]{16}\b/, why: 'AWS 액세스 키' },
  { re: /\bAIza[0-9A-Za-z_-]{35}\b/, why: 'Google API 키' },
  { re: /\bxox[abprs]-[A-Za-z0-9-]{10,}/, why: 'Slack 토큰' },
  { re: /\b(sk|rk)_live_[A-Za-z0-9]{16,}/, why: '결제 비밀 키' },
  {
    re: /\b(api[_-]?key|secret|token|password|passwd)\b["']?\s*[:=]\s*["'][^"'\s]{20,}["']/i,
    why: '비밀값 직접 입력',
  },
  {
    re: /[\w.+-]+@(gmail|googlemail|naver|hanmail|daum|kakao|nate|outlook|hotmail|live|icloud|me|yahoo)\.(com|net)\b/i,
    why: '개인 메일 주소',
  },
  {
    re: /\b(10\.\d{1,3}|192\.168|172\.(1[6-9]|2\d|3[01])|100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7]))\.\d{1,3}\.\d{1,3}\b/,
    why: '내부망 IP 주소',
  },
];

/** 로컬 목록 파일 내용 → 규칙. 빈 줄·# 주석은 무시, 잘못된 정규식은 글자 그대로 찾는다. */
export function parseLocalList(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((src) => {
      let re;
      try {
        re = new RegExp(src, 'i');
      } catch {
        re = new RegExp(src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      }
      return { re, why: '로컬 차단 목록' };
    });
}

/** 줄 목록을 검사해 걸린 것을 돌려준다. lines: [{ file, line, text }] */
export function scanLines(lines, rules) {
  const hits = [];
  for (const item of lines) {
    if (item.text.includes(ALLOW_MARK)) continue;
    for (const rule of rules) {
      if (rule.re.test(item.text)) hits.push({ ...item, why: rule.why });
    }
  }
  return hits;
}

/** 파일 이름 목록을 검사한다 */
export function scanFiles(files) {
  const hits = [];
  for (const file of files) {
    const rule = BLOCKED_FILES.find((r) => r.re.test(file));
    if (rule) hits.push({ file, why: rule.why });
  }
  return hits;
}

/** `git diff -U0` 출력에서 추가된 줄만 뽑는다 */
export function addedLines(diff) {
  const out = [];
  let file = '';
  let line = 0;
  for (const raw of diff.split('\n')) {
    if (raw.startsWith('+++ ')) {
      file = raw.slice(4).replace(/^b\//, '');
    } else if (raw.startsWith('@@')) {
      const m = raw.match(/\+(\d+)/);
      line = m ? Number(m[1]) : 0;
    } else if (raw.startsWith('+')) {
      out.push({ file, line, text: raw.slice(1) });
      line += 1;
    }
  }
  return out;
}

/** 커밋 메시지에서 git 주석(#)을 뺀 줄 */
export function messageLines(text) {
  const body = text.split(/^# -+ >8 -+$/m)[0];
  return body
    .split('\n')
    .map((t, i) => ({ file: '커밋 메시지', line: i + 1, text: t }))
    .filter((l) => !l.text.startsWith('#'));
}

function loadRules() {
  const rules = [...BLOCKED_CONTENT];
  for (const path of LOCAL_LISTS) {
    if (existsSync(path)) rules.push(...parseLocalList(readFileSync(path, 'utf8')));
  }
  return rules;
}

function git(...args) {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
}

function report(hits) {
  if (hits.length === 0) return 0;
  console.error('\n커밋을 멈췄어요 — 공개 저장소에 올라가면 안 되는 내용이 보여요.\n');
  for (const h of hits.slice(0, 30)) {
    const where = h.line ? `${h.file}:${h.line}` : h.file;
    // 걸린 값 자체는 출력하지 않는다(터미널 기록·로그에 남지 않게).
    console.error(`  - ${where}  (${h.why})`);
  }
  if (hits.length > 30) console.error(`  … 외 ${hits.length - 30}건`);
  console.error(
    `\n괜찮은 내용이면 그 줄에 ${ALLOW_MARK} 를 적거나, git commit --no-verify 로 건너뛰세요.\n`,
  );
  return 1;
}

function main(argv) {
  const [mode, arg] = argv;
  if (mode === 'install') {
    try {
      git('rev-parse', '--git-dir');
      git('config', 'core.hooksPath', '.githooks');
    } catch {
      // git 저장소가 아닌 곳(배포 빌드 등)에서는 조용히 넘어간다.
    }
    return 0;
  }
  if (mode === 'staged') {
    const files = git('diff', '--cached', '--name-only', '--diff-filter=ACMR')
      .split('\n')
      .filter(Boolean);
    const diff = git(
      'diff',
      '--cached',
      '-U0',
      '--no-color',
      '--no-ext-diff',
      '--diff-filter=ACMR',
    );
    return report([...scanFiles(files), ...scanLines(addedLines(diff), loadRules())]);
  }
  if (mode === 'msg' && arg) {
    return report(scanLines(messageLines(readFileSync(arg, 'utf8')), loadRules()));
  }
  console.error('사용법: check-commit.mjs staged | msg <파일> | install');
  return 2;
}

const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) process.exit(main(process.argv.slice(2)));
