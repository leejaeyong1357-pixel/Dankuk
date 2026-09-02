import { EXAM_CONFIG } from "./config";

/**
 * 출제 이력 자료형과 순수 함수.
 *
 * 출제는 서버에서 하고 이력 조회는 클라이언트에서도 쓰이므로,
 * "use client" 가 붙지 않는 이 파일에 공용 로직을 둔다.
 */
export interface ExamHistoryEntry {
  examId: string;
  takenAt: string;
  testletIds: string[];
  questionIds: string[];
}

/** 최근 N회 시험에서 쓰인 testlet — 우선적으로 제외 대상 */
export function recentTestletIds(history: ExamHistoryEntry[]): string[] {
  return history.slice(0, EXAM_CONFIG.historyLookback).flatMap((h) => h.testletIds);
}

/** testlet id 가 몇 회 전 시험에 나왔는지. 없으면 null */
export function lastSeenIndex(history: ExamHistoryEntry[], testletId: string): number | null {
  for (let i = 0; i < history.length; i++) {
    if (history[i].testletIds.includes(testletId)) return i;
  }
  return null;
}
