import { EXAM_CONFIG, totalQuestions } from "./config";
import type { DifficultyLevel, DifficultySelection } from "./question-types";
import { allowedTypes, applySelection } from "./question-types";
import {
  findTestlets, INTRO_TESTLET, type Question, type Testlet, type TestletKind,
} from "./repository";
import { lastSeenIndex, type ExamHistoryEntry } from "./history";

/**
 * Exam Generation Engine.
 *
 * UI 컴포넌트 안에서 Math.random() 으로 문제를 고르지 않는다.
 * 출제는 반드시 이 순서를 거친다.
 *
 *   Background Survey
 *     -> Eligible Topic Pool
 *     -> Initial Difficulty
 *     -> Testlet Selection (Level Check + Probe)
 *     -> 1st Session
 *     -> Difficulty Re-adjustment
 *     -> Second Difficulty
 *     -> 2nd Session Testlet Selection (Role Play / 상위 Function)
 *     -> Complete Exam
 */

export interface ExamSlot {
  no: number;
  session: 1 | 2;
  testletId: string;
  testletKind: TestletKind;
  topicKo: string;
  question: Question;
  isWarmup: boolean;
}

export interface ExamPlan {
  examId: string;
  initialDifficulty: DifficultyLevel;
  secondDifficulty: DifficultyLevel | null;
  difficultySelection: DifficultySelection | null;
  totalQuestions: number;
  firstSession: ExamSlot[];
  secondSession: ExamSlot[];
  usedTestletIds: string[];
  usedTopics: string[];
}

export interface GenerateExamInput {
  selectedSurveyTopics: string[];
  initialDifficulty: DifficultyLevel;
  history?: ExamHistoryEntry[];
  /** 결정적 재현이 필요할 때 (테스트) */
  seed?: number;
}

// ── 시드 난수 ──────────────────────────────────────────────
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── 가중치 계산 (§18) ──────────────────────────────────────
interface ScoreContext {
  level: DifficultyLevel;
  surveyTopics: string[];
  history: ExamHistoryEntry[];
}

function scoreTestlet(t: Testlet, ctx: ScoreContext): number {
  let score = 1;

  // surveyMatch — 학생이 고른 주제면 크게 가산
  if (ctx.surveyTopics.includes(t.topic)) score += 2.0;

  // difficultyMatch — 목표 난이도에 정확히 맞을수록 높게
  score += 1.5 - Math.abs(t.level - ctx.level) * 0.75;

  // questionFreshness / userHistoryPenalty
  const seen = lastSeenIndex(ctx.history, t.id);
  if (seen === null) {
    score += 1.2; // 아직 안 풀어본 문제가 1순위
  } else if (seen < EXAM_CONFIG.historyLookback) {
    score -= 3.0; // 최근 시험에 나온 testlet 은 강하게 회피
  } else {
    score += 0.4; // 오래전에 풀었던 문제는 2순위
  }

  // sourceReliability / recentFrequencyWeight
  const avgWeight =
    t.questions.reduce((s, q) => s + (q.frequencyWeight ?? 1), 0) / t.questions.length;
  score += (avgWeight - 1) * 0.5;

  return Math.max(0.05, score);
}

/** 점수를 가중치로 삼는 확률 추출. 완전 랜덤도, 항상 같은 것도 아니다. */
function weightedPick(cands: Testlet[], ctx: ScoreContext, rnd: () => number): Testlet | null {
  if (cands.length === 0) return null;
  const scored = cands.map((t) => ({ t, w: scoreTestlet(t, ctx) }));
  const total = scored.reduce((s, x) => s + x.w, 0);
  let r = rnd() * total;
  for (const { t, w } of scored) {
    r -= w;
    if (r <= 0) return t;
  }
  return scored[scored.length - 1].t;
}

// ── testlet 선택 ───────────────────────────────────────────
interface PickArgs {
  kind: TestletKind;
  level: DifficultyLevel;
  topicsIn?: string[];
  unexpectedOnly?: boolean;
  excludeTopics: string[];
  excludeTestlets: string[];
  ctx: ScoreContext;
  rnd: () => number;
}

/**
 * 후보가 없으면 제약을 단계적으로 푼다.
 * 중복 회피를 너무 엄격하게 걸어 출제가 실패하는 일이 없어야 한다.
 */
function pickTestlet(a: PickArgs): Testlet | null {
  // 난이도에서 허용된 기능만 쓰는 testlet 을 우선한다.
  const types = allowedTypes(a.level);
  const attempts: Parameters<typeof findTestlets>[0][] = [
    // 0) 선택한 난이도로 직접 만들어진 세트를 먼저 쓴다
    { kind: a.kind, level: a.level, exactLevel: true, restrictTypes: types,
      topicsIn: a.topicsIn, unexpectedOnly: a.unexpectedOnly,
      excludeTopics: a.excludeTopics, excludeTestlets: a.excludeTestlets },
    { kind: a.kind, level: a.level, exactLevel: true, restrictTypes: types,
      topicsIn: a.topicsIn, unexpectedOnly: a.unexpectedOnly, excludeTopics: a.excludeTopics },
    { kind: a.kind, level: a.level, restrictTypes: types, topicsIn: a.topicsIn,
      unexpectedOnly: a.unexpectedOnly,
      excludeTopics: a.excludeTopics, excludeTestlets: a.excludeTestlets },
    // 1) 최근 이력 제외를 푼다
    { kind: a.kind, level: a.level, restrictTypes: types, topicsIn: a.topicsIn,
      unexpectedOnly: a.unexpectedOnly, excludeTopics: a.excludeTopics },
    // 2) 설문 주제 한정을 푼다 (돌발 제약은 유지)
    { kind: a.kind, level: a.level, restrictTypes: types,
      unexpectedOnly: a.unexpectedOnly, excludeTopics: a.excludeTopics },
    // 3) 주제 중복 제약까지 푼다
    { kind: a.kind, level: a.level, restrictTypes: types, unexpectedOnly: a.unexpectedOnly },
    // 4) 기능 제한을 푼다 — 여기서부터는 출제 실패를 막는 것이 우선이다
    { kind: a.kind, level: a.level, unexpectedOnly: a.unexpectedOnly },
    // 5) 마지막으로 난이도만 맞춘다
    { kind: a.kind, level: a.level },
  ];

  for (const query of attempts) {
    const picked = weightedPick(findTestlets(query), a.ctx, a.rnd);
    if (picked) return picked;
  }
  return null;
}

function toSlots(t: Testlet, startNo: number, session: 1 | 2): ExamSlot[] {
  return t.questions.map((q, i) => ({
    no: startNo + i,
    session,
    testletId: t.id,
    testletKind: t.kind,
    topicKo: t.topicKo,
    question: q,
    isWarmup: q.questionType === "SELF_INTRODUCTION",
  }));
}

// ── 1st Session ────────────────────────────────────────────
export function generateFirstSession(input: GenerateExamInput): ExamPlan {
  const rnd = mulberry32(input.seed ?? Date.now());
  const history = input.history ?? [];
  const level = input.initialDifficulty;
  const ctx: ScoreContext = { level, surveyTopics: input.selectedSurveyTopics, history };

  const slots: ExamSlot[] = [];
  const usedTestletIds: string[] = [];
  const usedTopics: string[] = [];

  // Q1 — 자기소개 (워밍업, 등급 계산에서 분리)
  slots.push(...toSlots(INTRO_TESTLET, 1, 1));
  usedTestletIds.push(INTRO_TESTLET.id);

  // Testlet A / B — 설문 주제 우선, 설문:돌발 비율 2:1 을 목표로 한다
  const wantsUnexpected = [false, false];
  if (rnd() < 0.5) wantsUnexpected[1] = true;

  let no = 2;
  for (let i = 0; i < 2 && no <= EXAM_CONFIG.firstSessionTarget; i++) {
    const t = pickTestlet({
      kind: "COMBO",
      level,
      topicsIn: wantsUnexpected[i] ? undefined : input.selectedSurveyTopics,
      unexpectedOnly: wantsUnexpected[i],
      excludeTopics: usedTopics,
      excludeTestlets: usedTestletIds,
      ctx, rnd,
    });
    if (!t) break;
    slots.push(...toSlots(t, no, 1));
    no += t.questions.length;
    usedTestletIds.push(t.id);
    usedTopics.push(t.topic);
  }

  return {
    examId: `exam-${Date.now().toString(36)}-${Math.floor(rnd() * 1e6).toString(36)}`,
    initialDifficulty: level,
    secondDifficulty: null,
    difficultySelection: null,
    totalQuestions: totalQuestions(level),
    firstSession: slots.slice(0, EXAM_CONFIG.firstSessionTarget),
    secondSession: [],
    usedTestletIds,
    usedTopics,
  };
}

// ── 2nd Session ────────────────────────────────────────────
export interface SecondSessionInput {
  plan: ExamPlan;
  selection: DifficultySelection;
  selectedSurveyTopics: string[];
  history?: ExamHistoryEntry[];
  seed?: number;
}

/**
 * 2nd Session 은 secondDifficulty 로 새로 생성한다.
 * 버튼만 바뀌고 문제 난이도가 그대로이면 안 된다.
 */
export function generateSecondSession(input: SecondSessionInput): ExamPlan {
  const { plan, selection } = input;
  const second = applySelection(plan.initialDifficulty, selection);
  const rnd = mulberry32((input.seed ?? Date.now()) ^ 0x9e3779b9);
  const history = input.history ?? [];
  const ctx: ScoreContext = { level: second, surveyTopics: input.selectedSurveyTopics, history };

  const usedTestletIds = [...plan.usedTestletIds];
  const usedTopics = [...plan.usedTopics];
  const slots: ExamSlot[] = [];
  let no = plan.firstSession.length + 1;
  const remaining = plan.totalQuestions - plan.firstSession.length;

  const take = (kind: TestletKind, opts: { unexpectedOnly?: boolean; surveyOnly?: boolean } = {}) => {
    if (no > plan.totalQuestions) return;
    const t = pickTestlet({
      kind,
      level: second,
      topicsIn: opts.surveyOnly ? input.selectedSurveyTopics : undefined,
      unexpectedOnly: opts.unexpectedOnly,
      excludeTopics: usedTopics,
      excludeTestlets: usedTestletIds,
      ctx, rnd,
    });
    if (!t) return;
    const room = plan.totalQuestions - no + 1;
    const qs = t.questions.slice(0, room);
    slots.push(...toSlots({ ...t, questions: qs }, no, 2));
    no += qs.length;
    usedTestletIds.push(t.id);
    usedTopics.push(t.topic);
  };

  // 15문항: 콤보 C(8~10) -> 롤플레이(11~13) -> 상위 기능 마무리(14~15)
  // 12문항: 롤플레이(8~10) -> 마무리(11~12)
  if (remaining >= 8) {
    // 앞 두 세트가 설문 위주였으면 여기서 돌발을 섞는다
    const surveyHeavy = plan.usedTopics.length >= 2;
    take("COMBO", surveyHeavy ? { unexpectedOnly: true } : {});
  }
  take("ROLEPLAY");
  take("CLOSING");

  // 남는 자리가 있으면 콤보로 채운다 (출제 실패 방지)
  let guard = 0;
  while (no <= plan.totalQuestions && guard++ < 5) {
    take("COMBO");
  }

  return {
    ...plan,
    secondDifficulty: second,
    difficultySelection: selection,
    secondSession: slots,
    usedTestletIds,
    usedTopics,
  };
}

/** 전체 문제지 */
export function allSlots(plan: ExamPlan): ExamSlot[] {
  return [...plan.firstSession, ...plan.secondSession];
}
