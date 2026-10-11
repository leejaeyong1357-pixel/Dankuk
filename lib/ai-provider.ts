"use client";

/**
 * 어느 AI 엔진으로 채점할지 정한다.
 *
 * 채점·피드백은 OpenAI 로 한다. 등급 판정, 질문과 답변이 맞는지, 문장별 교정,
 * 결과지 서술까지 전부 한 엔진에서 나온다.
 *
 *   NEXT_PUBLIC_OPENAI_API_KEY     — OpenAI 로 채점 (기본)
 *   NEXT_PUBLIC_OPENAI_MODEL       — 쓸 모델 (없으면 gpt-4o)
 *   NEXT_PUBLIC_ANTHROPIC_API_KEY  — Claude 로 채점 (대체 경로)
 *   NEXT_PUBLIC_ANTHROPIC_MODEL    — 쓸 모델 (없으면 claude-sonnet-5)
 *   NEXT_PUBLIC_AI_PROVIDER        — "openai" | "claude". 두 키가 다 있을 때 고른다
 *
 * 두 키가 다 들어 있으면 OpenAI 를 쓴다. Claude 로 돌리려면
 * NEXT_PUBLIC_AI_PROVIDER=claude 를 명시해야 한다.
 * 아무 키도 없으면 지표 기반 채점으로 동작한다 (비용 0, 첨삭·모범답안 없음).
 *
 * 정적 배포라 이 값들은 빌드 결과에 그대로 박혀 브라우저로 나간다.
 * 한도를 걸어 둔 임시 키를 쓰고 시연이 끝나면 폐기해야 한다.
 */
export type AiProvider = "openai" | "claude" | "metrics";

/**
 * 채점·피드백 기본 모델.
 *
 * 이 채점에서 어려운 판단은 문법 교정이 아니라 "묻는 것에 답했는가"와
 * "이 발화가 어느 등급인가"다. 작은 모델은 이 판단을 자주 놓치므로
 * 기본값을 낮추지 않는다. NEXT_PUBLIC_OPENAI_MODEL 로 바꿀 수 있다.
 */
export const DEFAULT_OPENAI_MODEL = "gpt-4o";

/** Claude 로 돌릴 때의 기본 모델 */
export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5";

function clean(v: string | undefined): string | null {
  return v && v.trim() ? v.trim() : null;
}

export function openAiKey(): string | null {
  return clean(process.env.NEXT_PUBLIC_OPENAI_API_KEY);
}

export function openAiModel(): string {
  return clean(process.env.NEXT_PUBLIC_OPENAI_MODEL) ?? DEFAULT_OPENAI_MODEL;
}

export function anthropicKey(): string | null {
  return clean(process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY);
}

export function anthropicModel(): string {
  return clean(process.env.NEXT_PUBLIC_ANTHROPIC_MODEL) ?? DEFAULT_ANTHROPIC_MODEL;
}

/** 지금 실제로 쓰이는 모델 이름 — 관리 화면 표시용 */
export function activeModel(): string | null {
  const p = activeProvider();
  return p === "claude" ? anthropicModel() : p === "openai" ? openAiModel() : null;
}

export function activeProvider(): AiProvider {
  const forced = clean(process.env.NEXT_PUBLIC_AI_PROVIDER)?.toLowerCase();
  if (forced === "openai" && openAiKey()) return "openai";
  if (forced === "claude" && anthropicKey()) return "claude";

  // 지정이 없으면 OpenAI 가 먼저다
  if (openAiKey()) return "openai";
  if (anthropicKey()) return "claude";
  return "metrics";
}
