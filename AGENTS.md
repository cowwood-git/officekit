# OfficeKit 개발 기준

이 저장소에서 앱·도구를 추가하거나 고칠 때 지키는 기준이다.  
특히 **도구 사이를 이동할 때 파일이 끊기지 않게 하는 것**을 기본 요구사항으로 둔다.

## 1. 도구 간 파일 연속성 (필수)

OfficeKit의 도구는 서로 독립된 페이지지만, 사용자의 작업은 한 흐름으로 이어진다.  
**파일을 불러온 상태에서 다른 도구를 추천하면, 그 파일도 함께 넘어가야 한다.**

### 반드시 지킬 것

1. **문맥 링크에는 파일 전달을 붙인다.**
   - 현재 도구에 파일이 있고 대상 도구가 같은 형식을 받으면 `data-flow-handoff="대상-slug"`를 붙인다.
   - 예: PDF 텍스트 추출 → PDF OCR, PDF 뷰어 → PDF 텍스트 추출.
   - 파일이 없으면 일반 링크처럼 이동해야 한다. 파일 선택을 강요하지 않는다.

2. **오류가 “다른 도구를 써야 하는 상황”을 알려 주면, 안내 카드와 이동 버튼을 함께 둔다.**
   - 예: “스캔 PDF입니다” → PDF OCR로 이동.
   - 단순 문자열 안내만 두고 끝내지 않는다.
   - 이동 버튼은 `handoff-callout` 패턴을 쓰고, 파일이 있으면 같이 넘긴다.

3. **결과 파일의 “이어서 하기”를 연결한다.**
   - 확장자 기반은 `src/lib/file-flow.ts`의 `NEXT_BY_EXT`.
   - 도구별 예외는 `NEXT_BY_SLUG`로 둔다. 예: 문서 스캔 결과 → PDF OCR, PDF → JPG 결과 → 이미지 OCR.
   - 결과 칩은 최대 3개. OCR·텍스트 추출이 실제로 유용한 결과에만 노출한다.

4. **파일을 input에서 비워도 마지막 파일을 기억한다.**
   - `src/scripts/file-flow.ts`의 `flowFile`이 선택·드롭 파일을 기억한다.
   - 도구 스크립트에서 `input.value = ''`를 해도 handoff가 동작해야 한다.
   - 별도 IndexedDB 구현을 새로 만들지 말고 공통 `handOff()`를 쓴다.

5. **두 파일 이상을 쓰는 도구는 “어느 파일을 넘길지”를 사용자가 고르게 한다.**
   - 예: PDF 비교의 원본/수정본.
   - 마지막에 선택한 파일을 몰래 넘기지 않는다.
   - 파일별 “이 파일로 이동” 버튼을 둔다.

6. **형식이 다른 링크는 억지로 넘기지 않는다.**
   - 이미지 → 텍스트 변환, CSV → QR 리더처럼 대상이 다른 형식을 받으면 일반 링크로 둔다.
   - 대신 결과 파일 기반 handoff로 연결할 수 있는지 검토한다.

## 2. 구현 위치

| 역할 | 파일 |
|---|---|
| 공통 파일 기억·IndexedDB handoff | `src/scripts/file-flow.ts` |
| 다음 도구·형식 매핑 | `src/lib/file-flow.ts` |
| 공통 안내 카드 스타일 | `src/styles/global.css`의 `.handoff-callout` |
| 참고 흐름 | PDF OCR ↔ PDF 텍스트 추출, PDF 양식 채우기 → OCR, PDF 뷰어 → 텍스트/양식 |
| 상세 기준 | `docs/tool-handoff.md` |

### 링크에 붙이는 방법

```astro
<a href="/tools/pdf-ocr/" data-flow-handoff="pdf-ocr">PDF OCR로 이동 →</a>
```

### 오류 안내 카드

```astro
<div class="handoff-callout" hidden>
  <div class="handoff-copy">
    <strong>스캔 PDF인가요?</strong>
    <p>PDF OCR로 먼저 글자를 인식하세요.</p>
  </div>
  <a class="btn" href="/tools/pdf-ocr/" data-flow-handoff="pdf-ocr">PDF OCR로 이동 →</a>
</div>
```

## 3. 완료 기준

새 도구·새 링크·새 오류 안내를 추가하면 다음을 확인한다.

- [ ] 파일이 있는 상태에서 링크를 누르면 대상 도구에 같은 파일이 열린다.
- [ ] 파일이 없으면 일반 링크로 정상 이동한다.
- [ ] `input.value = ''` 이후에도 handoff가 동작한다.
- [ ] 대상 도구가 해당 형식을 실제로 받는다.
- [ ] 오류 안내만 있고 이동 수단이 없는 “막다른 길”이 없다.
- [ ] 두 파일 도구는 파일별 선택을 제공한다.
- [ ] 파일은 서버로 가지 않고, IndexedDB에서 읽은 뒤 삭제된다.
- [ ] E2E로 “출발 파일 → 링크 클릭 → 도착 도구 파일 로드”를 검증한다.
- [ ] `npm run verify`와 관련 E2E가 통과한다.

## 4. 금지

- 파일이 열려 있는데 다른 도구로 **일반 링크만** 두는 것
- “PDF OCR을 쓰세요”라고 **문자만** 안내하고 버튼을 두지 않는 것
- 도구마다 IndexedDB handoff를 **따로 구현**하는 것
- 파일을 서버·외부 서비스로 보내는 handoff
- 두 파일 중 하나를 사용자 동의 없이 임의로 넘기는 것
- 결과 파일과 무관한 OCR·변환 칩을 모든 도구에 붙이는 것

## 5. 배경

2026-11-18 전수 감사에서 PDF OCR → 텍스트 추출, PDF 텍스트 추출 → OCR, PDF 양식 채우기 → OCR, PDF 뷰어 → 텍스트/양식, 이미지 도구 간 이동에서 **파일이 끊기는 문제**를 확인하고 공통 handoff로 정리했다.  
감사 결과: `docs/research/tool-handoff-audit-2026-11-18/REPORT.md`
