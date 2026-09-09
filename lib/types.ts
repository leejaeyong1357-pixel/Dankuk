import type { DeterministicMetrics } from "./metrics-types";
import type { DifficultyLevel, DifficultySelection } from "./exam/question-types";
import type { SurveyAnswers } from "./exam/survey";

export type { DeterministicMetrics };

/** OPIc 등급 (ACTFL 기준 9등급) */
export type Grade =
  | "NL" | "NM" | "NH"
  | "IL" | "IM1" | "IM2" | "IM3" | "IH"
  | "AL";

/** 사용자가 고를 수 있는 목표 등급 */
export type TargetGrade = Extract<Grade, "IL" | "IM1" | "IM2" | "IM3" | "IH" | "AL">;

export interface GlossaryEntry {
  en: string;
  ko: string;
}

/** 온보딩에서 1회 설정하는 학습자 프로필 */
export interface UserProfile {
  name: string;
  email: string;
  targetGrade: TargetGrade;
  /** ISO date, 예: "2026-09-12" */
  examDate: string;
  /** 마지막으로 응시한 시험의 설문·난이도 — 연습 모드 기본값으로 재사용 */
  lastSurvey?: SurveyAnswers;
  lastDifficulty?: DifficultyLevel;
  createdAt: string;
}

/** STT 결과 — faster-whisper 응답을 정규화한 형태 */
export interface Transcript {
  text: string;
  durationSec: number;
  words: { word: string; start: number; end: number }[];
  segments: { text: string; start: number; end: number; language?: string }[];
}

/** LLM 이 채우는 부분 (연습 모드 문항별 피드백) */
/** 집중 교정 영역 — 학습자가 골라서 피드백의 초점을 바꾼다 */
export const FOCUS_AREAS = ["Fluency", "Vocabulary", "Grammar", "Pronunciation"] as const;
export type FocusArea = (typeof FOCUS_AREAS)[number];

export const FOCUS_AREA_KO: Record<FocusArea, string> = {
  Fluency: "유창성 — 끊김 없이 이어 말하기",
  Vocabulary: "어휘 — 표현을 더 정확하고 풍부하게",
  Grammar: "문법 — 시제·어순·관사",
  Pronunciation: "발음 — 알아듣기 쉬운 소리",
};

/**
 * 표현 자체를 바꿔 주는 제안.
 *
 * 틀린 단어를 고치는 데서 그치지 않는다. 말은 통했지만 밋밋한 문장을
 * 원어민이 실제로 쓰는 표현으로 갈아 끼우고, 왜 그렇게 바꿨는지 함께 준다.
 */
export interface Improvement {
  area: FocusArea;
  /** 학습자가 실제로 말한 문장 */
  original: string;
  /** 표현을 바꾼 문장 */
  improved: string;
  /** improved 안에서 달라진 부분 (화면에서 색을 입힌다) */
  changed: string;
  /** 왜 이렇게 바꿨는가 */
  commentKo: string;
}

/**
 * 질문과 답변이 맞는지부터 본다.
 *
 * 채점에서 가장 먼저 확인할 것은 문법이 아니라 "묻는 것에 답했는가"다.
 * 방을 묘사하라는 문항에 회사 이야기를 했다면, 그 문장을 아무리 매끄럽게
 * 다듬어도 시험에서는 점수가 나오지 않는다. 그런데도 문법만 고쳐 주면
 * 학습자는 틀린 방향으로 더 잘 말하게 된다.
 */
export interface Relevance {
  /** 문항이 요구한 것 — "내 방의 외형과 특징 묘사" */
  askedFor: string;
  /** 학습자가 실제로 말한 것 — "이름과 직장 소개" */
  actuallySaid: string;
  /** on: 질문에 답함 / partial: 일부만 / off: 다른 주제 */
  match: "on" | "partial" | "off";
  /** 한 줄 판정 — "질문과 다른 주제로 답했습니다" */
  verdict: string;
}

/**
 * 이번 답변에서 확인된 수준.
 *
 * 답변 하나로 등급을 확정하지는 않되, "어느 언저리인지"는 말해 준다.
 * 목표에 못 미친다는 말만 하고 지금 어디인지 안 알려 주면 무엇을 해야 할지 모른다.
 */
export interface ObservedLevel {
  /** 확인된 범위의 아래쪽 등급 */
  from: Grade;
  /** 확인된 범위의 위쪽 등급 */
  to: Grade;
  /** 한 마디 — "문장 수준의 발화" */
  label: string;
  /** 그렇게 본 이유 */
  note: string;
  /** 목표까지 무엇이 모자란가 */
  gapNote: string;
}

/** 근거가 되는 실제 문장과 그 자리의 교정 */
export interface Evidence {
  /** 학습자가 말한 그대로 */
  quote: string;
  /** 무엇이 문제인가 */
  issue: string;
  /** 어떻게 고치는가. 고칠 수 없으면 비운다 */
  fix: string;
}

/** 채점 기준 한 줄 진단 */
export interface CriterionVerdict {
  /** F=과업 수행, C=내용·맥락, A=전달력, T=발화 구조 */
  key: "F" | "C" | "A" | "T";
  /** 이번 답변 진단 — "보완 필요" 같은 짧은 라벨 */
  verdict: string;
  /** 그렇게 본 근거 한 줄 */
  reason: string;
  /** 근거가 된 실제 문장들 (없으면 빈 배열) */
  evidence: Evidence[];
}

/**
 * 이번에 고칠 한 가지.
 *
 * 지적을 여러 개 늘어놓으면 무엇부터 손대야 할지 알 수 없다.
 * 학습자가 실제로 말한 문장을 인용해 한 가지만 짚는다.
 */
export interface OneFix {
  /** 무엇을 고칠 것인가 */
  title: string;
  /** 학습자가 실제로 말한 문장 그대로 */
  quote: string;
  /** 어떻게 바꿀 것인가 */
  advice: string;
  /** 뜻을 확정할 수 없어 손대지 않은 문장. 없으면 비운다 */
  unclearQuote?: string;
}

/** 다음 답변에 그대로 채워 말할 수 있는 문장 틀 */
export interface SentenceFrame {
  /** 특징 / 위치 / 이유 */
  label: string;
  /** "My room is ___ and ___." */
  frame: string;
}

export interface LlmFeedback {
  scores: { function: number; content: number; accuracy: number; textType: number };
  estimatedGrade: Grade;
  gapToTarget: string[];
  corrected: string;
  modelAnswer: string;
  keyExpressions: { en: string; ko: string; why: string }[];
  /** 표현을 통째로 바꿔 주는 제안 */
  improvements: Improvement[];
  /** 이번 답변에 맞는 한 줄 팁 */
  tipKo: string;
  summaryKo: string;

  // ── 채점 결과 화면 ──────────────────────────────────────
  /** 질문과 답변이 맞는가 — 가장 먼저 본다 */
  relevance: Relevance;
  /** 이번 답변에서 확인된 수준 범위 */
  observed: ObservedLevel;
  /** 4대 준거 진단 */
  criteria: CriterionVerdict[];
  /** 이번에 고칠 한 가지 */
  oneFix: OneFix;
  /** 다음 답변에 쓸 문장 틀 3개 */
  nextFrames: SentenceFrame[];
}

export interface AnswerFeedback {
  metrics: DeterministicMetrics;
  llm: LlmFeedback;
}

/**
 * 모의고사 한 문항의 응답.
 *
 * 결과 화면이 문항 뱅크를 참조하지 않도록 문항 정보를 함께 담는다.
 * (뱅크는 7MB 라 클라이언트 번들에 들어가면 안 된다)
 */
export interface ExamAnswer {
  no: number;
  questionId: string;
  questionType: string;
  session: 1 | 2;
  isWarmup: boolean;
  transcript: string;
  metrics: DeterministicMetrics;
  /** 리포트 표시용 — 문항 원문과 Probe 구분 */
  promptText?: string;
  probeType?: string;
  topicKo?: string;
}

/** 시험 종료 후 산출되는 리포트 */
export interface ExamGrade {
  grade: Grade;
  scores: { function: number; content: number; accuracy: number; textType: number };
  summaryKo: string;
  strengths: string[];
  weaknesses: string[];
  weakTypes: { questionType: string; label: string; reason: string }[];
  perQuestion: { no: number; comment: string }[];
  nextSteps: string[];
}

export interface ExamResult {
  examId: string;
  takenAt: string;
  finishedAt: string;
  initialDifficulty: DifficultyLevel;
  secondDifficulty: DifficultyLevel;
  difficultySelection: DifficultySelection;
  targetGrade: TargetGrade;
  elapsedSec: number;
  answers: ExamAnswer[];
  grade: ExamGrade;
  provider: string;
}
