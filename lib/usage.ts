"use client";

/**
 * AI 호출 기록.
 *
 * "키를 넣었는데 쓰이고 있는 건가, 돈은 나가고 있는 건가" 는 화면이 답해 줘야 한다.
 * 지금까지는 알 길이 없었다 — 채점이 조용히 지표 기반으로 내려가도 결과지는
 * 똑같이 나왔기 때문이다.
 *
 * 그래서 호출이 성공할 때마다 실제로 쓴 토큰을 적어 둔다. 적히는 것이 없으면
 * API 는 한 번도 불리지 않은 것이고, 따라서 요금도 나가지 않은 것이다.
 *
 * 이 기록은 이 브라우저에만 남는다. 어디로도 보내지 않는다.
 * 요금의 근거는 어디까지나 제공사 대시보드이고, 이것은 참고용 사본이다.
 */

const KEY = "opic.ai.usage.v1";
/** 무한정 쌓지 않는다. 저장소를 다 쓰면 다른 기능이 먼저 깨진다 */
const MAX = 300;

export type UsageKind = "feedback" | "exam";

export interface UsageEntry {
  at: string;
  kind: UsageKind;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  /** 추론 모델이 "생각하는 데" 쓴 토큰. 출력 토큰 요금으로 함께 청구된다 */
  reasoningTokens: number;
}

export interface UsageSummary {
  calls: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  firstAt: string | null;
  lastAt: string | null;
  models: string[];
}

function read(): UsageEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as UsageEntry[]) : [];
  } catch {
    // 저장소를 못 읽는다고 채점을 멈출 이유는 없다
    return [];
  }
}

export function recordUsage(e: Omit<UsageEntry, "at">) {
  if (typeof window === "undefined") return;
  try {
    const next = [...read(), { ...e, at: new Date().toISOString() }].slice(-MAX);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* 저장에 실패해도 채점 결과는 이미 나왔다 */
  }
}

export function usageSummary(): UsageSummary {
  const all = read();
  return {
    calls: all.length,
    inputTokens: all.reduce((n, e) => n + e.inputTokens, 0),
    outputTokens: all.reduce((n, e) => n + e.outputTokens, 0),
    reasoningTokens: all.reduce((n, e) => n + e.reasoningTokens, 0),
    firstAt: all[0]?.at ?? null,
    lastAt: all[all.length - 1]?.at ?? null,
    models: [...new Set(all.map((e) => e.model))],
  };
}

export function clearUsage() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* 지우지 못해도 할 수 있는 것이 없다 */
  }
}
