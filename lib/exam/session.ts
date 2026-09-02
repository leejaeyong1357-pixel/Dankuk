"use client";

import type { ExamPlan } from "./generator";
import type { DifficultyLevel } from "./question-types";
import type { SurveyAnswers } from "./survey";
import type { ExamAnswer, ExamResult } from "../types";

/**
 * 진행 중인 시험 상태. 새로고침해도 이어지도록 sessionStorage 에 둔다.
 * (결과는 다시 보기 위해 localStorage)
 */
const SESSION_KEY = "dku-opic:exam-session";
const RESULT_KEY = "dku-opic:exam-results";

export interface ExamSessionState {
  plan: ExamPlan;
  survey: SurveyAnswers;
  surveyTopics: string[];
  initialDifficulty: DifficultyLevel;
  startedAt: string;
  /** 지금까지 응답한 문항 */
  answers: ExamAnswer[];
  index: number;
}

export function loadSession(): ExamSessionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as ExamSessionState) : null;
  } catch {
    return null;
  }
}

export function saveSession(s: ExamSessionState) {
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
}

export function clearSession() {
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function saveResult(r: ExamResult) {
  const all = [r, ...loadResults()].slice(0, 20);
  window.localStorage.setItem(RESULT_KEY, JSON.stringify(all));
}

export function loadResults(): ExamResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RESULT_KEY);
    return raw ? (JSON.parse(raw) as ExamResult[]) : [];
  } catch {
    return [];
  }
}

export function latestResult(): ExamResult | null {
  return loadResults()[0] ?? null;
}
