"use client";

import type { ExamHistoryEntry } from "./exam/history";
import { loadHistory as loadLocalHistory } from "./exam/history";
import { latestResult as localLatestResult } from "./exam/session";
import type { DifficultyLevel, DifficultySelection } from "./exam/question-types";
import type { SurveyAnswers } from "./exam/survey";
import type { ExamAnswer, ExamGrade, ExamResult, TargetGrade, UserProfile } from "./types";

/**
 * 서버 저장소 동기화.
 *
 * DATABASE_URL 이 설정되어 있으면 서버(PostgreSQL)를 정본으로 쓰고,
 * 없으면 localStorage 만으로 동작한다. 화면 코드가 두 경우를 신경 쓰지 않도록
 * 여기서 폴백을 흡수한다.
 */

async function post<T>(url: string, body: unknown): Promise<T | null> {
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
  return post<{ sent?: boolean; devCode?: string; error?: string; expiresInMinutes?: number }>(
    "/api/auth/request", { email },
  );
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
  try {
    await fetch(`/api/vocab?en=${encodeURIComponent(en)}`, { method: "DELETE" });
  } catch {
    // DB 가 없으면 로컬 삭제만으로 충분하다
  }
}

// ── 출제 (서버에서만 수행) ─────────────────────────────────
export async function generateFirstSessionRemote(p: {
  survey: SurveyAnswers; topics: string[];
  initialDifficulty: DifficultyLevel; startedAt: string;
}) {
  return post<{ plan: unknown; slots: unknown[]; error?: string }>(
    "/api/exams/generate", { phase: "first", ...p },
  );
}

export async function generateSecondSessionRemote(p: {
  plan: unknown; selection: DifficultySelection; topics: string[];
}) {
  return post<{ plan: unknown; slots: unknown[]; error?: string }>(
    "/api/exams/generate", { phase: "second", ...p },
  );
}

// ── 연습 모드 문항 조회 ────────────────────────────────────
export async function fetchPracticeTopics(level: number) {
  return get<{
    level: number;
    topics: { topic: string; topicKo: string; category: string; count: number }[];
    roleplayTopics: string[];
  }>(`/api/practice?level=${level}`);
}

export async function fetchPracticeQuestions(topic: string, level: number) {
  return get<{ level: number; questions: PracticeQuestion[] }>(
    `/api/practice?topic=${encodeURIComponent(topic)}&level=${level}`,
  );
}

/** 연습 화면이 실제로 쓰는 문항 필드만 추린 형태 */
export interface PracticeQuestion {
  id: string;
  topic: string;
  questionType: string;
  probeType: string;
  promptText: string;
  promptTextKo: string;
  missionKo: string;
  promptAudio: string | null;
}
