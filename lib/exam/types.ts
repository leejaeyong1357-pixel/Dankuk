import type { DifficultyLevel, DifficultySelection, ProbeType, QuestionType } from "./question-types";
import type { SurveyCategory } from "./survey";

/**
 * 클라이언트가 다루는 시험 자료형.
 *
 * 문항 뱅크(data/testlets.json)는 서버에만 두고, 화면에는 출제된 문항만 내려간다.
 * 그래서 브라우저 코드는 repository 를 import 하지 않고 이 타입만 참조한다.
 */
export interface ExamQuestion {
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
  probeType: ProbeType;
  isRoleplay: boolean;
  roleplayGroupId: string | null;
  isUnexpected: boolean;
}

export interface ExamSlot {
  no: number;
  session: 1 | 2;
  testletId: string;
  testletKind: "INTRO" | "COMBO" | "ROLEPLAY" | "CLOSING";
  topicKo: string;
  question: ExamQuestion;
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
