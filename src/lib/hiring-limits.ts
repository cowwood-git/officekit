/**
 * 채용 단계에서 묻거나 평가에 쓰면 안 되는 정보. 면접 질문지·평가표·평판조회 시트의 경고에 쓴다.
 * 경고는 PDF 생성을 막지 않는다(직무상 꼭 필요한 예외가 있을 수 있다).
 *
 * - 채용절차법 제4조의3: 구직자 본인의 용모·키·체중, 출신 지역·혼인 여부·재산,
 *   직계 존비속·형제자매의 학력·직업·재산을 요구할 수 없다(위반 시 과태료 최대 500만 원).
 * - 남녀고용평등법 제7조: 모집·채용에서 성별, 직무와 무관한 용모·키·체중·미혼 조건을 둘 수 없다.
 * - 고령자고용법 제4조의4: 모집·채용에서 합리적 이유 없이 연령으로 차별할 수 없다.
 */

interface HiringTopic {
  topic: string;
  basis: string;
  re: RegExp;
}

const BODY_KEY = /(^|[^가-힣A-Za-z])키(가|는|를|와|\s|[?·,.)]|$)/;

export const HIRING_TOPICS: readonly HiringTopic[] = [
  {
    topic: '용모·키·체중',
    basis: '채용절차법 제4조의3',
    re: /신장|체중|몸무게|외모|용모/,
  },
  { topic: '출신 지역', basis: '채용절차법 제4조의3', re: /출신\s?지|출신\s?지역|고향|본적/ },
  {
    topic: '혼인·연애',
    basis: '채용절차법 제4조의3',
    re: /결혼|혼인|미혼|기혼|배우자|애인|연애|남자\s?친구|여자\s?친구/,
  },
  {
    topic: '재산',
    basis: '채용절차법 제4조의3',
    re: /재산|자가\s?(소유|여부|인지)|전세|월세|집이\s?있|부동산/,
  },
  {
    topic: '가족의 학력·직업·재산',
    basis: '채용절차법 제4조의3',
    re: /부모|아버지|어머니|아빠|엄마|형제|자매|가족\s?(직업|학력|관계|사항)|가정\s?환경/,
  },
  {
    topic: '임신·출산 계획',
    basis: '남녀고용평등법 제7조',
    re: /임신|출산\s?계획|자녀\s?계획|아이\s?계획|육아\s?계획/,
  },
  { topic: '나이', basis: '고령자고용법 제4조의4', re: /나이|몇\s?살|연령|나잇대/ },
  {
    topic: '종교·정치 성향',
    basis: '국가인권위원회법 차별 금지',
    re: /종교|교회|성당|정당\s?(가입|활동)|정치\s?성향|지지\s?(정당|후보)/,
  },
];

/** 글에서 걸리는 주제를 찾아 중복 없이 돌려준다. */
export function hiringTopicsIn(texts: readonly string[]): HiringTopic[] {
  const found: HiringTopic[] = [];
  for (const topic of HIRING_TOPICS) {
    const re = topic.topic === '용모·키·체중' ? [topic.re, BODY_KEY] : [topic.re];
    if (texts.some((text) => re.some((pattern) => pattern.test(text)))) found.push(topic);
  }
  return found;
}

/** 양식 경고 문구. 걸린 것이 없으면 빈 배열. */
export function hiringTopicWarnings(texts: readonly string[], what: string): string[] {
  return hiringTopicsIn(texts).map(
    (topic) =>
      `${what}에 ${topic.topic} 관련 내용이 있습니다. 직무와 무관하면 묻거나 평가에 쓰지 마세요(${topic.basis}).`,
  );
}
