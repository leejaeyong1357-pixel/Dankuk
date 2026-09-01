/** OPIc 등급 (ACTFL 기준 9등급) */
export type Grade =
  | "NL" | "NM" | "NH"
  | "IL" | "IM1" | "IM2" | "IM3" | "IH"
  | "AL";

/** 사용자가 고를 수 있는 목표 등급 */
export type TargetGrade = Extract<Grade, "IL" | "IM2" | "IM3" | "IH" | "AL">;

/** 자가평가 난이도 (1~6) */
export type SelfAssessment = 1 | 2 | 3 | 4 | 5 | 6;

/** 난이도 밴드 — 문항 뱅크 조회 키 */
export type DifficultyBand = "1-2" | "3-4" | "5-6";

/** 문항이 요구하는 기능 (ACTFL global task) */
export type QuestionFunction =
  | "describe"    // 묘사 (현재)
  | "habit"       // 습관·루틴·절차 (현재)
  | "experience"  // 경험 서술 (과거)
  | "compare"     // 비교·대조 (어드밴스)
  | "issue"       // 이슈·해결책 (어드밴스)
  | "rp_ask"      // 롤플레이 ① 질문하기
  | "rp_solve"    // 롤플레이 ② 문제 상황 대안 제시
  | "rp_relate"   // 롤플레이 ③ 유사 경험
  | "intro";      // 자기소개

/** 문항 출처 구분 */
export type QuestionKind = "intro" | "survey" | "adhoc" | "roleplay" | "advanced";

export interface GlossaryEntry {
  en: string;
  ko: string;
}

export interface Question {
  id: string;
  kind: QuestionKind;
  topicId: string;
  fn: QuestionFunction;
  band: DifficultyBand;
  /** Ava 가 읽는 영어 원문 */
  textEn: string;
  /** 한글 번역 */
  textKo: string;
  /** 학습 화면 상단 미션 박스 */
  missionKo: string;
  /** 사전 패널용 주요 단어 */
  glossary: GlossaryEntry[];
  /** 사전 생성된 TTS 파일 경로 (없으면 미생성) */
  audioUrl?: string;
}

/** Background Survey 응답 */
export interface SurveyAnswer {
  occupation: string;
  isStudent: "yes" | "no";
  recentCourse: string;
  residence: string;
  leisure: string[];
  hobbies: string[];
  sports: string[];
  travel: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  targetGrade: TargetGrade;
  /** ISO date, 예: "2026-09-12" */
  examDate: string;
  selfAssessment: SelfAssessment;
  survey: SurveyAnswer;
  createdAt: string;
}

/** STT 결과 — faster-whisper 응답을 정규화한 형태 */
export interface Transcript {
  text: string;
  durationSec: number;
  words: { word: string; start: number; end: number }[];
  /** Whisper 가 감지한 언어 코드. "ko" 구간이 있으면 한국어 이탈 */
  segments: { text: string; start: number; end: number; language?: string }[];
}

/** LLM 없이 계산되는 결정적 지표 (SPEC §4.3) */
export interface DeterministicMetrics {
  durationSec: number;
  wordCount: number;
  wpm: number;
  fillerCount: number;
  fillerRate: number;
  connectorCount: number;
  distinctConnectors: string[];
  typeTokenRatio: number;
  longestPauseSec: number;
  pauseOverTwoSec: number;
  pastTenseVerbCount: number;
  koreanSpilloverSec: number;
  koreanSpillover: boolean;
}

/** LLM 이 채우는 부분 */
export interface LlmFeedback {
  scores: {
    function: number;
    content: number;
    accuracy: number;
    textType: number;
  };
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

/** 모의고사 한 문항의 응답 */
export interface ExamAnswer {
  questionId: string;
  no: number;
  transcript: string;
  metrics: DeterministicMetrics;
}

/** 2차 난이도 선택 (7번 문항 후) */
export type SecondChoice = "easier" | "similar" | "harder";

/** 성적표 */
export interface ExamGrade {
  grade: Grade;
  scores: {
    function: number;
    content: number;
    accuracy: number;
    textType: number;
  };
  summaryKo: string;
  strengths: string[];
  weaknesses: string[];
  /** 취약 유형 상위 항목 — fn 값과 사유 */
  weakTypes: { fn: string; label: string; reason: string }[];
  perQuestion: { no: number; comment: string }[];
  nextSteps: string[];
}

export interface ExamResult {
  takenAt: string;
  selfAssessment: SelfAssessment;
  secondChoice: SecondChoice;
  targetGrade: TargetGrade;
  answers: ExamAnswer[];
  grade: ExamGrade;
  provider: string;
}
