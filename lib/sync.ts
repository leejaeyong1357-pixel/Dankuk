"use client";

import type { ExamHistoryEntry } from "./exam/history";
import { loadHistory as loadLocalHistory } from "./exam/history";
import { latestResult as localLatestResult } from "./exam/session";
import type {
  DifficultyLevel, DifficultySelection, ProbeType, QuestionType,
} from "./exam/question-types";
import type { SurveyAnswers } from "./exam/survey";
import type { ExamAnswer, ExamGrade, ExamResult, TargetGrade, UserProfile } from "./types";

/**
 * 서버 저장소 동기화.
 *
 * DATABASE_URL 이 설정되어 있으면 서버(PostgreSQL)를 정본으로 쓰고,
 * 없으면 localStorage 만으로 동작한다. 화면 코드가 두 경우를 신경 쓰지 않도록
 * 여기서 폴백을 흡수한다.
 */

/**
 * 정적 배포에는 API 라우트가 없다. 불러 봐야 404 만 나므로 아예 건너뛴다.
 * 호출부는 이미 null 을 "서버 없음"으로 다루고 localStorage 로 폴백한다.
 */
const SERVERLESS = process.env.NEXT_PUBLIC_STATIC_MODE === "1";

async function post<T>(url: string, body: unknown): Promise<T | null> {
  if (SERVERLESS) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function get<T>(url: string): Promise<T | null> {
  if (SERVERLESS) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

// ── 인증 ───────────────────────────────────────────────────
export async function requestCode(email: string) {
  return post<{
    sent?: boolean; devCode?: string; demo?: boolean; dbEnabled?: boolean;
    error?: string; expiresInMinutes?: number;
  }>("/api/auth/request", { email });
}

export async function verifyCode(p: {
  email: string; code: string;
  name?: string; targetGrade?: TargetGrade; examDate?: string;
}) {
  return post<{
    verified?: boolean; needsProfile?: boolean; profile?: UserProfile; error?: string;
  }>("/api/auth/verify", p);
}

export async function fetchMe() {
  return get<{ dbEnabled: boolean; user: UserProfile | null }>("/api/auth/me");
}

export async function logout() {
  await post("/api/auth/logout", {});
}

export async function openExam(p: {
  examId: string; survey: SurveyAnswers; topics: string[];
  initialDifficulty: DifficultyLevel; totalQuestions: number; startedAt: string;
}) {
  return post("/api/exams", p);
}

export async function closeExam(p: {
  examId: string; secondDifficulty: DifficultyLevel; difficultySelection: DifficultySelection;
  finishedAt: string; elapsedSec: number; grade: ExamGrade; gradeProvider: string;
  testletIds: string[]; questionIds: string[]; answers: ExamAnswer[];
}) {
  return post("/api/exams/finish", p);
}

/**
 * 출제 중복 회피용 이력.
 * 서버 이력을 우선 쓰고, DB 가 없거나 응답이 없으면 로컬 이력으로 폴백한다.
 */
export async function fetchHistory(): Promise<{
  history: ExamHistoryEntry[];
  count: number;
  latest: ExamResult | null;
  fromServer: boolean;
}> {
  const res = await get<{
    dbEnabled: boolean;
    history?: ExamHistoryEntry[];
    count?: number;
    latest?: ExamResult | null;
  }>("/api/history");

  if (res?.dbEnabled && res.history) {
    return {
      history: res.history,
      count: res.count ?? res.history.length,
      latest: res.latest ?? null,
      fromServer: true,
    };
  }
  const local = loadLocalHistory();
  return { history: local, count: local.length, latest: localLatestResult(), fromServer: false };
}

export async function saveVocabEntry(p: {
  en: string; ko: string; sourceQuestionId?: string;
}) {
  return post("/api/vocab", p);
}

export async function fetchVocab() {
  return get<{ dbEnabled: boolean; items?: { en: string; ko: string }[] }>("/api/vocab");
}

export async function removeVocabEntry(en: string) {
  if (SERVERLESS) return;
  try {
    await fetch(`/api/vocab?en=${encodeURIComponent(en)}`, { method: "DELETE" });
  } catch {
    // DB 가 없으면 로컬 삭제만으로 충분하다
  }
}

/**
 * 출제와 문항 조회는 브라우저에서 직접 수행한다.
 *
 * 서버 없이 정적 호스팅에 올려도 그대로 동작해야 하기 때문이다.
 * 문항 뱅크는 번들에 넣지 않고 정적 파일로 한 번만 내려받는다
 * (lib/exam/bank-browser.ts).
 */
export async function generateFirstSessionRemote(p: {
  survey: SurveyAnswers; topics: string[];
  initialDifficulty: DifficultyLevel; startedAt: string;
}) {
  try {
    const { generateFirstSessionLocal } = await import("./client-engine");
    const res = await generateFirstSessionLocal({
      selectedSurveyTopics: p.topics,
      initialDifficulty: p.initialDifficulty,
    });
    // DB 가 있으면 시험 레코드도 남긴다. 없으면 조용히 지나간다.
    void post("/api/exams", {
      examId: (res.plan as { examId: string }).examId,
      survey: p.survey, topics: p.topics,
      initialDifficulty: p.initialDifficulty,
      totalQuestions: (res.plan as { totalQuestions: number }).totalQuestions,
      startedAt: p.startedAt,
    });
    return res as { plan: unknown; slots: unknown[]; error?: string };
  } catch (err) {
    return { plan: null, slots: [], error: err instanceof Error ? err.message : "출제 실패" };
  }
}

export async function generateSecondSessionRemote(p: {
  plan: unknown; selection: DifficultySelection; topics: string[];
}) {
  try {
    const { generateSecondSessionLocal } = await import("./client-engine");
    const res = await generateSecondSessionLocal({
      plan: p.plan as never, selection: p.selection, selectedSurveyTopics: p.topics,
    });
    return res as { plan: unknown; slots: unknown[]; error?: string };
  } catch (err) {
    return { plan: null, slots: [], error: err instanceof Error ? err.message : "출제 실패" };
  }
}

// ── 연습 모드 문항 조회 ────────────────────────────────────
export async function fetchPracticeTopics(level: number) {
  try {
    const { practiceTopicsLocal } = await import("./client-engine");
    return await practiceTopicsLocal(level as never);
  } catch {
    return null;
  }
}

export async function fetchPracticeQuestions(topic: string, level: number) {
  try {
    const { practiceQuestionsLocal } = await import("./client-engine");
    const res = await practiceQuestionsLocal(topic, level as never);
    return res as { level: number; questions: PracticeQuestion[] };
  } catch {
    return null;
  }
}

/** 연습 화면이 실제로 쓰는 문항 필드만 추린 형태 */
export interface PracticeQuestion {
  id: string;
  topic: string;
  questionType: QuestionType;
  probeType: ProbeType;
  promptText: string;
  promptTextKo: string;
  missionKo: string;
  promptAudio: string | null;
}
