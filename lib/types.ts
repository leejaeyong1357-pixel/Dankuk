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
export type TargetGrade = Extract<Grade, "IL" | "IM2" | "IM3" | "IH" | "AL">;

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
export interface LlmFeedback {
  scores: { function: number; content: number; accuracy: number; textType: number };
  estimatedGrade: Grade;
  gapToTarget: string[];
  corrected: string;
  modelAnswer: string;
  keyExpressions: { en: string; ko: string; why: string }[];
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
