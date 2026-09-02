/**
 * 시험 구성 상수. 문항 수·세션 경계 같은 숫자를 코드 곳곳에 흩어놓지 않는다.
 */
export const EXAM_CONFIG = {
  /** 난이도 1~2 선택 시 총 문항 수 */
  low: 12,
  /** 난이도 3~6 선택 시 총 문항 수 */
  standard: 15,
  /** 1st Session 목표 문항 수 — 이 문항을 마치면 난이도 재조정 화면이 뜬다 */
  firstSessionTarget: 7,
  /** 본시험 제한 시간 (분). 문항별 개별 제한은 두지 않는다. */
  totalMinutes: 40,
  /** 문항 음성 최대 재생 횟수 (최초 Listen + Replay 1회) */
  maxPlays: 2,
  /** 중복 회피에 참고할 최근 시험 횟수 */
  historyLookback: 3,
} as const;

export type ExamConfig = typeof EXAM_CONFIG;

export function totalQuestions(initialDifficulty: number): number {
  return initialDifficulty <= 2 ? EXAM_CONFIG.low : EXAM_CONFIG.standard;
}
