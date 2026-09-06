import type { DifficultyLevel, ProbeType, QuestionType } from "./question-types";
import type { SurveyCategory } from "./survey";

/** 문항 스키마 (docs/SPEC 의 Question Schema) */
export interface Question {
  id: string;
  topic: string;
  subTopic: string;
  subTopicKo: string;
  surveyCategory: SurveyCategory | "UNEXPECTED";
  promptText: string;
  promptTextKo: string;
  missionKo: string;
  promptAudio: string | null;
  questionType: QuestionType;
  minDifficulty: number;
  maxDifficulty: number;
  targetLevel: string;
  testletId: string;
  testletOrder: number;
  probeType: ProbeType;
  isRoleplay: boolean;
  roleplayGroupId: string | null;
  isUnexpected: boolean;
  sourceType: string;
  frequencyWeight: number;
}

export type TestletKind = "INTRO" | "COMBO" | "ROLEPLAY" | "CLOSING";

/** 출제의 기본 단위. 같은 주제로 묶인 2~3문항이 흩어지지 않고 연속 출제된다. */
export interface Testlet {
  id: string;
  kind: TestletKind;
  topic: string;
  topicKo: string;
  surveyCategory: SurveyCategory | "UNEXPECTED";
  isUnexpected: boolean;
  isRoleplay: boolean;
  roleplayGroupId: string | null;
  level: number;
  minDifficulty: number;
  maxDifficulty: number;
  createdAt: string;
  questions: Question[];
}

/**
 * 문항 뱅크는 주입한다.
 *
 * 서버·스크립트는 data/testlets.json 을 그대로 import 하고(bank-node.ts),
 * 브라우저는 정적 파일로 내려받아 넣는다(bank-browser.ts).
 * 6MB 를 클라이언트 번들에 넣으면 접속할 때마다 파싱 비용을 물기 때문이다.
 */
let BANK: Testlet[] | null = null;

export function setBank(testlets: Testlet[]): void {
  BANK = testlets;
  index = null;
}

export function bankLoaded(): boolean {
  return BANK !== null;
}

function bank(): Testlet[] {
  if (!BANK) {
    throw new Error(
      "문항 뱅크가 로드되지 않았습니다. setBank() 를 먼저 호출하세요 " +
        "(서버: lib/exam/bank-node, 브라우저: lib/exam/bank-browser).",
    );
  }
  return BANK;
}

/** 자주 쓰는 파생 자료. 뱅크가 바뀌면 다시 만든다. */
let index: {
  byTestletId: Map<string, Testlet>;
  allQuestions: Question[];
  byQuestionId: Map<string, Question>;
  intro: Testlet;
} | null = null;

function idx() {
  if (!index) {
    const t = bank();
    const allQuestions = t.flatMap((x) => x.questions);
    index = {
      byTestletId: new Map(t.map((x) => [x.id, x])),
      allQuestions,
      byQuestionId: new Map(allQuestions.map((q) => [q.id, q])),
      intro: t.find((x) => x.kind === "INTRO")!,
    };
  }
  return index;
}

export const getTestlets = (): Testlet[] => bank();
export const getAllQuestions = (): Question[] => idx().allQuestions;
export const getQuestionById = (id: string): Question | undefined => idx().byQuestionId.get(id);
export const getIntroTestlet = (): Testlet => idx().intro;

export interface TestletQuery {
  kind: TestletKind;
  level: DifficultyLevel;
  /** 이 주제들만 (설문 연동 출제) */
  topicsIn?: string[];
  /** 돌발 주제만 */
  unexpectedOnly?: boolean;
  /** 제외할 주제 (한 시험 안 중복 방지) */
  excludeTopics?: string[];
  /** 제외할 testlet id */
  excludeTestlets?: string[];
  /**
   * 이 기능 목록에 없는 문항이 하나라도 들어 있으면 후보에서 뺀다.
   * 난이도 범위(min~max)만으로는 난이도 6 시험에 ROUTINE 문항이 섞이는 것을 막지 못한다.
   */
  restrictTypes?: QuestionType[];
  /**
   * 해당 난이도로 직접 만들어진 testlet 만 고른다.
   * min~max 범위만 보면 인접 난이도 세트가 섞여 Probe 문항이 사라진다.
   * 문제 세트는 선택한 난이도가 결정해야 한다.
   */
  exactLevel?: boolean;
}

/** 조건에 맞는 testlet 후보를 뽑는다. 난이도는 min~max 범위로 판정한다. */
export function findTestlets(q: TestletQuery): Testlet[] {
  return bank().filter((t) => {
    if (t.kind !== q.kind) return false;
    if (q.level < t.minDifficulty || q.level > t.maxDifficulty) return false;
    if (q.unexpectedOnly && !t.isUnexpected) return false;
    if (q.topicsIn && !q.topicsIn.includes(t.topic)) return false;
    if (q.excludeTopics?.includes(t.topic)) return false;
    if (q.excludeTestlets?.includes(t.id)) return false;
    if (q.exactLevel && t.level !== q.level) return false;
    if (q.restrictTypes && !t.questions.every((x) => q.restrictTypes!.includes(x.questionType)))
      return false;
    return true;
  });
}

/**
 * 문제별 AI 연습 모드용 — 주제와 난이도로 문항을 모아 준다.
 * 선택한 난이도로 직접 만들어진 testlet 을 앞에 둔다.
 * (난이도 범위가 겹쳐 인접 난이도 세트가 먼저 나오면 난이도를 바꾼 효과가 보이지 않는다)
 */
export function questionsForPractice(topic: string, level: DifficultyLevel): Question[] {
  const order: TestletKind[] = ["COMBO", "ROLEPLAY", "CLOSING"];
  return bank()
    .filter((t) => t.topic === topic && level >= t.minDifficulty && level <= t.maxDifficulty)
    .sort((a, b) =>
      Math.abs(a.level - level) - Math.abs(b.level - level) ||
      order.indexOf(a.kind) - order.indexOf(b.kind) ||
      a.id.localeCompare(b.id))
    .flatMap((t) => t.questions);
}

export function practiceTopics(level: DifficultyLevel) {
  const map = new Map<string, { topic: string; topicKo: string; category: string; count: number }>();
  for (const t of bank()) {
    if (t.kind === "INTRO") continue;
    if (level < t.minDifficulty || level > t.maxDifficulty) continue;
    const cur = map.get(t.topic) ?? {
      topic: t.topic, topicKo: t.topicKo, category: t.surveyCategory, count: 0,
    };
    cur.count += t.questions.length;
    map.set(t.topic, cur);
  }
  return [...map.values()].sort((a, b) => a.topicKo.localeCompare(b.topicKo, "ko"));
}
