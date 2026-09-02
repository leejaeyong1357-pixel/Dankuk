"use client";

import type { ExamHistoryEntry } from "./history-types";

export type { ExamHistoryEntry };
export { lastSeenIndex, recentTestletIds } from "./history-types";

/**
 * 브라우저에 남기는 출제 이력.
 *
 * 정본은 서버(Exam 테이블)다. DB 가 없는 환경에서만 이 값이 쓰인다.
 */
const KEY = "dku-opic:question-history";

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
