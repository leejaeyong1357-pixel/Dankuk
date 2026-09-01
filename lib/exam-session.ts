"use client";

import type { ExamResult } from "./types";

/** 진행 중인 시험 상태 — 새로고침해도 이어지도록 sessionStorage 에 둔다 */
const SESSION_KEY = "dku-opic:exam-session";
const RESULT_KEY = "dku-opic:exam-result";

export interface ExamSessionState {
  seed: number;
  startedAt: string;
  index: number;
  secondChoice: "easier" | "similar" | "harder" | null;
  answers: Record<string, { transcript: string; metrics: unknown; no: number }>;
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
  window.localStorage.setItem(RESULT_KEY, JSON.stringify(r));
}

export function loadResult(): ExamResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(RESULT_KEY);
    return raw ? (JSON.parse(raw) as ExamResult) : null;
  } catch {
    return null;
  }
}
