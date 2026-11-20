import { describe, expect, it } from 'vitest';
import { FORMS } from '../src/data/forms';
import { hiringTopicsIn, hiringTopicWarnings } from '../src/lib/hiring-limits';

const topics = (text: string) => hiringTopicsIn([text]).map((topic) => topic.topic);
const form = (slug: string) => {
  const found = FORMS.find((item) => item.slug === slug);
  if (!found) throw new Error(slug);
  return found;
};

describe('채용 금지 질문 찾기', () => {
  it('채용절차법 제4조의3 항목을 찾는다', () => {
    expect(topics('키가 몇이에요?')).toEqual(['용모·키·체중']);
    expect(topics('고향이 어디세요?')).toEqual(['출신 지역']);
    expect(topics('결혼 계획 있으세요?')).toEqual(['혼인·연애']);
    expect(topics('전세 사세요?')).toEqual(['재산']);
    expect(topics('아버지는 무슨 일 하세요?')).toEqual(['가족의 학력·직업·재산']);
  });

  it('성별·나이·종교 차별 소지도 찾는다', () => {
    expect(topics('임신 계획이 있나요?')).toEqual(['임신·출산 계획']);
    expect(topics('나이가 어떻게 되세요?')).toEqual(['나이']);
    expect(topics('종교가 있나요?')).toEqual(['종교·정치 성향']);
  });

  it('업무 질문은 잘못 잡지 않는다', () => {
    for (const text of [
      '키보드 단축키를 어떻게 쓰나요?',
      '핵심 키워드를 정리해 보세요',
      '정당한 이유 없이 일정을 미룬 적이 있나요?',
      '자가 진단 도구를 만든 경험은?',
      '출시 일정을 지킨 사례는?',
      '첫인상이 좋았다',
    ]) {
      expect(topics(text), text).toEqual([]);
    }
  });

  it('경고 문구에 근거 법령을 붙인다', () => {
    expect(hiringTopicWarnings(['결혼하셨어요?'], '면접 질문')[0]).toContain(
      '면접 질문에 혼인·연애 관련 내용이 있습니다',
    );
    expect(hiringTopicWarnings(['결혼하셨어요?'], '면접 질문')[0]).toContain('채용절차법 제4조의3');
  });
});

describe('채용 양식 경고', () => {
  it('면접 질문지·평가표·평판조회 예시는 경고가 없다', () => {
    for (const slug of ['interview-questions', 'interview-evaluation', 'reference-check']) {
      const item = form(slug);
      expect(item.warn?.(item.sample, item.sampleRows ?? {}), slug).toEqual([]);
    }
  });

  it('면접 질문에 금지 질문을 넣으면 알린다', () => {
    const item = form('interview-questions');
    const rows = {
      questions: [
        { competency: '기타', question: '부모님은 무슨 일 하세요?', criteria: '', check: '' },
      ],
    };
    expect(item.warn?.(item.sample, rows).join()).toContain('가족의 학력·직업·재산');
  });

  it('평가 의견과 평판조회 내용도 확인한다', () => {
    const evaluation = form('interview-evaluation');
    expect(
      evaluation
        .warn?.(
          { ...evaluation.sample, overall: '미혼이라 야근이 가능해 보임' },
          evaluation.sampleRows ?? {},
        )
        .join(),
    ).toContain('혼인');
    const reference = form('reference-check');
    const rows = {
      items: [{ item: '기타', question: '결혼 계획을 들은 적 있나요?', score: '보통', note: '' }],
    };
    expect(reference.warn?.(reference.sample, rows).join()).toContain('혼인');
  });

  it('입사지원서 PDF에 개인정보 동의의 필수 고지 사항이 들어간다', () => {
    const application = form('job-application');
    const label =
      application.compute?.(application.sample, application.sampleRows ?? {})?.privacyLabel ?? '';
    for (const part of ['항목:', '목적:', '보유:', '동의하지 않을 수 있으나']) {
      expect(label).toContain(part);
    }
  });
});
