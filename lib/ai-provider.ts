"use client";

/**
 * 어느 AI 엔진으로 채점할지 정한다.
 *
 * 키를 넣은 쪽이 곧 선택이다. 둘 다 넣으면 OpenAI 를 쓴다.
 * 아무 키도 없으면 지표 기반 채점으로 동작한다 (비용 0, 첨삭·모범답안 없음).
 *
 *   NEXT_PUBLIC_OPENAI_API_KEY     — OpenAI 로 채점
 *   NEXT_PUBLIC_OPENAI_MODEL       — 쓸 모델 (없으면 아래 기본값)
 *   NEXT_PUBLIC_ANTHROPIC_API_KEY  — Claude 로 채점
 *
 * 정적 배포라 이 값들은 빌드 결과에 그대로 박혀 브라우저로 나간다.
 * 한도를 걸어 둔 임시 키를 쓰고 시연이 끝나면 폐기해야 한다.
 */
export type AiProvider = "openai" | "claude" | "metrics";

/**
 * 모델을 따로 지정하지 않았을 때 쓰는 값.
 *
 * 이 채점의 어려운 부분은 문법이 아니라 "묻는 것에 답했는가"를 알아채는 일이다.
 * 방을 묘사하라는 문항에 회사 이야기를 한 답변을 놓치면 채점 전체가 무의미해진다.
 * 작은 모델은 이 판단을 자주 놓치므로 기본값을 여기에 둔다.
 * 더 싸게 돌리려면 NEXT_PUBLIC_OPENAI_MODEL 로 낮추면 된다.
 */
export const DEFAULT_OPENAI_MODEL = "gpt-4o";

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

export function activeProvider(): AiProvider {
  if (openAiKey()) return "openai";
  if (anthropicKey()) return "claude";
  return "metrics";
}
