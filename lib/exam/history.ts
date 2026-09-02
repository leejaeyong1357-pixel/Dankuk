"use client";

import { EXAM_CONFIG } from "./config";

/**
 * 학생이 이미 본 문항·testlet 기록.
 * 같은 15문제가 반복되지 않게 출제 가중치에 반영한다.
 * (인증·DB 확정 전까지 localStorage. 접근을 여기로 모아 둔다.)
 */
const KEY = "dku-opic:question-history";

export interface ExamHistoryEntry {
  examId: string;
  takenAt: string;
  testletIds: string[];
  questionIds: string[];
}

export function loadHistory(): ExamHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ExamHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function appendHistory(entry: ExamHistoryEntry) {
  const all = [entry, ...loadHistory()].slice(0, 30);
  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function clearHistory() {
  window.localStorage.removeItem(KEY);
}

/** 최근 N회 시험에서 쓰인 testlet — 우선적으로 제외 대상 */
export function recentTestletIds(history: ExamHistoryEntry[]): string[] {
  return history.slice(0, EXAM_CONFIG.historyLookback).flatMap((h) => h.testletIds);
}

/** testlet id -> 마지막으로 등장한 시험이 몇 회 전인지. 없으면 null */
export function lastSeenIndex(history: ExamHistoryEntry[], testletId: string): number | null {
  for (let i = 0; i < history.length; i++) {
    if (history[i].testletIds.includes(testletId)) return i;
  }
  return null;
}
