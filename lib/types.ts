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
