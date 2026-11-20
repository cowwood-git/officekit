# 옷깃 (OfficeKit)

> 한글 이름은 오킷에서 옷깃으로 바뀌었습니다. 영문 이름 OfficeKit과 저장소·도메인·패키지 이름은 그대로 유지합니다.

직장인이 매일 쓰는 업무 도구 — PDF 합치기·나누기·JPG→PDF, 이미지 압축, 글자수 세기, QR 생성, 업무 양식.
**모든 파일 처리는 브라우저에서만** 이루어지고 서버로 전송되지 않는다.

- 운영: https://officekit.kr
- 스택: Astro 7 (static) · TypeScript strict · Vitest · Biome · Cloudflare Pages
- UI 프레임워크 없음. 도구는 바닐라 TS + Canvas/File API로 동작한다.

## 현재 도구

도구 89개(문서 44 · 이미지 22 · 유틸리티 18 · 텍스트 5)와 업무 양식 137종, 학습 공책 12종.
목록의 기준은 코드다 — 도구는 `src/data/tools.ts`, 양식은 `src/data/forms/`. 이 표는 자주 바뀌지 않는 **방식**만 적는다.

| 분야                  | 방식                                                                              |
| --------------------- | --------------------------------------------------------------------------------- |
| PDF 편집·변환         | pdf-lib (합치기·나누기·페이지·워터마크·번호·크기 등)                              |
| PDF 보기·텍스트·압축  | pdf.js, mupdf(WASM)                                                               |
| PDF 암호 걸기·풀기    | @cantoo/pdf-lib (AES-256)                                                         |
| PDF 양식 채우기       | pdf-lib AcroForm + 나눔고딕                                                       |
| OCR(이미지·PDF)       | tesseract.js (자체 호스팅 언어 데이터)                                            |
| HEIC → JPG            | Safari 내장 디코더, 그 밖에는 libheif-js(WASM) 워커                               |
| 배경 지우기·증명사진  | @imgly/background-removal + onnxruntime-web (자체 호스팅)                         |
| QR·바코드 읽기        | BarcodeDetector, 없으면 zxing-wasm                                                |
| QR·바코드 만들기      | qrcode, JsBarcode                                                                 |
| 표(CSV·XLS·XLSX)      | SheetJS + 순수 JS (정리·피벗·조인·통계·차트)                                      |
| DOC·DOCX·PPT·PPTX     | mammoth, @mdgate/doc, @web-ppt/core, @aiden0z/pptx-renderer                       |
| HWP·HWPX 보기·PDF     | @rhwp/core (WASM)                                                                 |
| 업무 양식·견적서·라벨 | 공통 문서 엔진(`src/lib/doc/`) + pdf-lib, 나눔고딕을 HarfBuzz(hb-subset)로 서브셋 |
| 양식 한글·엑셀 저장   | HWPX 직접 생성(`src/lib/hwpx*`), XLSX(`src/lib/form-xlsx.ts`)                     |
| 텍스트·계산·변환      | 순수 JS                                                                           |
| 비밀번호·해시         | Web Crypto                                                                        |

## 사이트 기능

- **검색**: 홈 검색창에서 바로 앱 카드 필터링, 헤더에서 ⌘K(또는 `/`)로 도구 검색
- **카탈로그**: `/tools/`에서 형식(PDF·OFFICE·…)과 용도(보기·변환·정리·편집·보호·추출·만들기)로 필터
- **형식 허브**: `/pdf/`, `/office/`, `/image/`, `/sheet/`, `/text/`, `/utility/`
- **작업 흐름**: `/workflows/` — 제출용 PDF, 회사 문서 열기, 제출용 사진, 표 정리 등
- **좋아요**: 도구 페이지에서 로그인 없이 좋아요, Cloudflare D1에 익명 집계 (카탈로그 좋아요순, 홈 상위 섹션, 함께 좋아한 도구)
- **PWA**: 설치 가능, 오프라인에서 방문한 도구 사용
- **품질 게이트**: 빌드 후 본문·H1·JSON-LD·canonical 검사

## 원칙

1. **도구가 먼저.** 검색 유입용 페이지를 만들지 않는다. 동작하는 도구에만 페이지를 준다.
2. **서버 전송 없음.** 파일 도구는 브라우저 메모리에서 처리한다. 외부 CDN 런타임 로딩 금지.
3. **동작하는 도구만.** 도구 페이지는 본문 700자 이상, FAQ·한계·출처를 포함한다.
4. **광고가 도구를 가리지 않는다.** 앵커·전면 광고 금지, 페이지당 최대 2개.
5. **번역은 준비된 것만.** 번역 없는 `/en/`, `/ja/` 페이지를 기계적으로 만들지 않는다.

자세한 규칙: `docs/content-standards.md`, `docs/ad-policy.md`
다음에 만들 도구: `docs/roadmap.md` · 기능 백로그: `docs/backlog.md` · 디자인 기획: `docs/design.md` · 문구 스타일: `docs/content-style.md` · 도구 생명주기: `docs/tool-lifecycle.md` · 출시 전 점검: `docs/launch-checklist.md`

## 시작하기

```bash
npm install
npm run dev        # http://localhost:4321
npm run verify     # 타입 + 린트 + 단위 + 빌드 + 콘텐츠 + 성능 예산
npm run test:e2e   # Playwright 핵심 플로우 + axe 접근성 + CLS/LCP
npm run test:e2e:pwa   # 오프라인/PWA
npm run test:e2e:slow  # OCR (느림)
npm run test:e2e:visual  # 시각 회귀 (플랫폼별 베이스라인)
npm run test:e2e:visual:update  # 베이스라인 갱신
npm run og         # OG 이미지 재생성 (public/og.svg → png)
```

## 폴더 구조

```
src/
  components/     Header, Footer, Seo, AppTile, AppHover, AppIcon, PdfDemo, ToolLayout, Faq, AdSlot, Breadcrumbs
  data/tools.ts   도구 레지스트리 — 홈·사이트맵·관련 도구의 단일 출처
  i18n/           UI 문구(ko/en/ja)와 경로 유틸
  layouts/        BaseLayout (head·광고·분석·스킵링크)
  lib/            순수 로직 (files, text-stats, schema, format) — 테스트 대상
  pages/          라우트
  scripts/        브라우저에서 도는 도구 초기화 코드
  styles/         디자인 토큰 + 전역 CSS
tests/            Vitest 단위 테스트
scripts/          빌드 후 품질 게이트
docs/             운영 규칙 (비공개 — 이 저장소에는 없다)
```

## 도구 추가하기

1. `src/lib/`에 순수 로직을 만들고 `tests/`에 표를 채우듯 테스트를 추가한다.
2. `src/scripts/`에 DOM 초기화 코드를 만든다 (동적 import로 무거운 라이브러리 지연 로딩). Object URL·ImageBitmap·PDF task·워커·WASM 정리는 `docs/tool-lifecycle.md`를 따른다.
3. `src/data/tools.ts`에 메타데이터·FAQ·출처·관련 도구를 등록한다. 사용자 문구는 `docs/content-style.md`를 따른다.
4. `src/pages/tools/<slug>.astro`를 만들고 `ToolLayout` 안에 UI와 설명을 넣는다.
5. `npm run verify` — 품질 게이트(본문 700자, H1 1개, JSON-LD, canonical, 메모리 정리 검사)를 통과해야 배포된다.

## 환경변수

`.env.example` 참고. 모두 선택 사항이며, 없으면 해당 기능이 렌더링되지 않는다.

| 변수                         | 용도                                                   |
| ---------------------------- | ------------------------------------------------------ |
| `SITE_URL`                   | 빌드 시 canonical 도메인 (기본 `https://officekit.kr`) |
| `PUBLIC_ADSENSE_CLIENT`      | AdSense `ca-pub-...` (없으면 광고 없음)                |
| `PUBLIC_ADSENSE_SLOT_TOOL`   | 도구 제목 아래 배너 슬롯 ID                            |
| `PUBLIC_ADSENSE_SLOT_RESULT` | 도구 결과 하단 광고 슬롯 ID                            |
| `PUBLIC_ADSENSE_SLOT_RAIL`   | 오른쪽 세로 광고 슬롯 ID (1480px 이상 화면)            |
| `PUBLIC_ADSENSE_SLOT_HOME`   | 홈 콘텐츠 하단 광고 슬롯 ID                            |
| `PUBLIC_CF_ANALYTICS_TOKEN`  | Cloudflare Web Analytics 토큰 (쿠키 없음)              |

## 배포 (Cloudflare Pages)

- Build command: `npm run build`
- Output directory: `dist`
- Node: 22+
- `public/_headers`에 보안 헤더·CSP·캐시 정책이 들어 있다.
- 광고를 켜기 전에 `docs/ad-policy.md`의 체크리스트와 CSP 주석을 확인한다.

### 빠른 배포

```bash
npx wrangler login                 # 최초 1회
npx wrangler pages project create officekit --production-branch main
npm run deploy                     # verify + Pages 배포
```

- 메인 주소: **https://officekit.kr** (2026-11-13 등록, 네임서버 Cloudflare)
- 예전 주소 officekit.quickdk.co.kr 은 2026-11-13 삭제(공개 몇 시간 만이라 리다이렉트 없이 정리)
- Pages 기본 주소: https://officekit-c4y.pages.dev (canonical 은 officekit.kr)
- 도메인·문의 메일은 `src/site.mjs` 한 곳에서 관리한다. 기본값이 메인 주소라 `npm run deploy`만 실행하면 된다.
- 상세 절차·환경변수·도메인 연결·롤백은 `docs/deploy.md`를 따른다.

### 좋아요(D1)

좋아요는 `functions/api/likes/*` Pages Function과 D1(`officekit-likes`)으로 동작한다.

```bash
npx wrangler d1 migrations apply officekit-likes --remote   # 최초 1회
npx wrangler pages secret put LIKES_SECRET --project-name officekit
```

- 바인딩은 `wrangler.toml`의 `LIKES_DB`에 있다.
- 로컬 확인: `npm run build && npx wrangler pages dev dist`
- `npm run dev`(Vite)에는 Functions가 없으므로 좋아요 버튼을 숨긴다.
- `npm install` 때 커밋 검사 훅(`.githooks/`)이 등록된다. 비밀 파일·토큰·개인 메일·내부망 IP가 든 커밋과 커밋 메시지를 막는다(`scripts/check-commit.mjs`). 저장소별 추가 차단어는 커밋하지 않는 `.git/commit-blocklist.txt`에 정규식으로 적는다.

## 라이선스

[GNU AGPL-3.0](LICENSE). 이 코드로 서비스를 운영하면 이용자에게 수정한 소스 코드를 같은 라이선스로 공개해야 한다.
운영 문서(`docs/`)는 비공개 저장소에서 따로 관리한다.
