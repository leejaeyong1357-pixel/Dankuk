import testletData from "@/data/testlets.json";
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

export const TESTLETS = testletData as unknown as Testlet[];
export const TESTLET_BY_ID = new Map(TESTLETS.map((t) => [t.id, t]));
export const ALL_QUESTIONS: Question[] = TESTLETS.flatMap((t) => t.questions);
export const QUESTION_BY_ID = new Map(ALL_QUESTIONS.map((q) => [q.id, q]));

export const INTRO_TESTLET = TESTLETS.find((t) => t.kind === "INTRO")!;

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
}

/** 조건에 맞는 testlet 후보를 뽑는다. 난이도는 min~max 범위로 판정한다. */
export function findTestlets(q: TestletQuery): Testlet[] {
  return TESTLETS.filter((t) => {
    if (t.kind !== q.kind) return false;
    if (q.level < t.minDifficulty || q.level > t.maxDifficulty) return false;
    if (q.unexpectedOnly && !t.isUnexpected) return false;
    if (q.topicsIn && !q.topicsIn.includes(t.topic)) return false;
    if (q.excludeTopics?.includes(t.topic)) return false;
    if (q.excludeTestlets?.includes(t.id)) return false;
    if (q.restrictTypes && !t.questions.every((x) => q.restrictTypes!.includes(x.questionType)))
      return false;
    return true;
  });
}

/** 문제별 AI 연습 모드용 — 주제와 난이도로 문항을 모아 준다 */
export function questionsForPractice(topic: string, level: DifficultyLevel): Question[] {
  const order: TestletKind[] = ["COMBO", "ROLEPLAY", "CLOSING"];
  return TESTLETS
    .filter((t) => t.topic === topic && level >= t.minDifficulty && level <= t.maxDifficulty)
    .sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind) || a.id.localeCompare(b.id))
    .flatMap((t) => t.questions);
}

export function practiceTopics(level: DifficultyLevel) {
  const map = new Map<string, { topic: string; topicKo: string; category: string; count: number }>();
  for (const t of TESTLETS) {
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
