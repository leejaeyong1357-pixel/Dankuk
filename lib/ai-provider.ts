"use client";

/**
 * 어느 AI 엔진으로 채점할지 정한다.
 *
 * 채점·피드백은 Claude Haiku 로 한다. 등급 판정, 질문과 답변이 맞는지,
 * 문장별 교정, 결과지 서술까지 전부 한 엔진에서 나온다.
 *
 *   NEXT_PUBLIC_ANTHROPIC_API_KEY  — Claude 로 채점 (기본)
 *   NEXT_PUBLIC_ANTHROPIC_MODEL    — 쓸 모델 (없으면 claude-haiku-5-5)
 *   NEXT_PUBLIC_ANTHROPIC_EFFORT   — 추론 강도 (low|medium|high|xhigh|max)
 *   NEXT_PUBLIC_OPENAI_API_KEY     — OpenAI 로 채점 (대체 경로)
 *   NEXT_PUBLIC_OPENAI_MODEL       — 쓸 모델 (없으면 gpt-6-astra)
 *   NEXT_PUBLIC_OPENAI_EFFORT      — 추론 강도
 *   NEXT_PUBLIC_AI_PROVIDER        — "claude" | "openai". 두 키가 다 있을 때 고른다
 *
 * 두 키가 다 들어 있으면 Claude 를 쓴다. OpenAI 로 돌리려면
 * NEXT_PUBLIC_AI_PROVIDER=openai 를 명시해야 한다.
 * 아무 키도 없으면 지표 기반 채점으로 동작한다 (비용 0, 첨삭·모범답안 없음).
 *
 * 정적 배포라 이 값들은 빌드 결과에 그대로 박혀 브라우저로 나간다.
 * 한도를 걸어 둔 임시 키를 쓰고 시연이 끝나면 폐기해야 한다.
 */
export type AiProvider = "openai" | "claude" | "metrics";

/**
 * 채점·피드백 기본 모델.
 *
 * Haiku 는 작고 빠르고 싸다 (입력 $0.10 / 출력 $0.50 per 1M).
 * 작은 모델이 놓치기 쉬운 것은 "묻는 것에 답했는가" 같은 판단이므로,
 * 모델을 낮춘 대신 추론 강도(effort)로 메운다 — 아래 ANTHROPIC_EFFORT 참고.
 * 채점이 허술하면 NEXT_PUBLIC_ANTHROPIC_MODEL 로 올리면 된다.
 */
export const DEFAULT_ANTHROPIC_MODEL = "claude-haiku-5-5";

/** OpenAI 로 돌릴 때의 기본 모델 */
export const DEFAULT_OPENAI_MODEL = "gpt-6-astra";

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

/**
 * 이 모델이 추론 강도(reasoning.effort)를 받는가.
 *
 * gpt-4o 같은 비추론 모델에 reasoning 을 같이 보내면 400 이 돌아온다.
 * 모델을 바꿔 끼울 수 있게 해 둔 이상, 보내도 되는 때를 여기서 가린다.
 */
export function supportsReasoning(model = openAiModel()): boolean {
  return /^(o\d|gpt-(?:[5-9]|\d{2,}))/.test(model);
}

/**
 * 추론 강도.
 *
 * gpt-6-astra 는 추론 모델이라 강도를 올리면 그만큼 느려지고 출력 토큰 요금도
 * 함께 오른다 (생각한 토큰이 출력으로 청구된다). 기다리는 시간이 길면 연습을
 * 한 번 더 하지 않으므로 기본을 low 로 둔다.
 * 더 꼼꼼히 보게 하려면 NEXT_PUBLIC_OPENAI_EFFORT=medium 이상으로 올린다.
 * none/minimal 은 이 모델이 거부하므로 low 가 바닥이다.
 */
export type Effort = "low" | "medium" | "high" | "xhigh" | "max";
const EFFORTS: Effort[] = ["low", "medium", "high", "xhigh", "max"];

export function openAiEffort(fallback: Effort): Effort {
  const v = clean(process.env.NEXT_PUBLIC_OPENAI_EFFORT)?.toLowerCase() as Effort | undefined;
  return v && EFFORTS.includes(v) ? v : fallback;
}

export function anthropicEffort(fallback: Effort): Effort {
  const v = clean(process.env.NEXT_PUBLIC_ANTHROPIC_EFFORT)?.toLowerCase() as Effort | undefined;
  return v && EFFORTS.includes(v) ? v : fallback;
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

  // 지정이 없으면 Claude 가 먼저다
  if (anthropicKey()) return "claude";
  if (openAiKey()) return "openai";
  return "metrics";
}

/**
 * AI 호출이 실패한 이유를 화면에 보일 한 줄로 줄인다.
 *
 * 그냥 "응답을 받지 못했습니다" 로만 두면, 모델 이름을 잘못 적은 것과
 * 한도를 넘긴 것과 키가 만료된 것이 전부 같은 문장으로 보인다.
 * 셋은 고치는 방법이 완전히 다르다.
 */
export function describeAiError(err: unknown): string {
  const status = (err as { status?: number } | null)?.status;
  const raw = err instanceof Error ? err.message : String(err ?? "");

  /*
    사내망에서 막히는 경우가 가장 흔하다.
    이때 브라우저는 상태 코드 없이 "Connection error" 만 던지므로,
    키가 틀린 것과 구분해 주지 않으면 엉뚱한 곳을 고치게 된다.
  */
  if (
    status === undefined &&
    /connection error|network|failed to fetch|fetch failed|load failed|ERR_/i.test(raw)
  )
    return (
      "AI 서버에 닿지 못했습니다. 회사 네트워크나 보안 프로그램이 막고 있을 수 있습니다 — " +
      "api.anthropic.com (OpenAI 를 쓰면 api.openai.com) 접속 허용을 요청해 보세요. " +
      "휴대폰 테더링이나 사외망에서 되면 네트워크 문제가 맞습니다."
    );
  if (status === 401 || /api key|unauthorized/i.test(raw))
    return "API 키가 거부되었습니다. 키가 만료되었거나 잘못 입력되었습니다.";
  if (status === 404 || /model.*(not found|does not exist)|unknown model/i.test(raw))
    return "그런 이름의 모델이 없습니다. 환경변수에 적은 모델 이름을 확인해 주세요.";
  if (status === 429 || /rate limit|quota|insufficient_quota/i.test(raw))
    return "사용 한도를 넘겼습니다. 결제 한도나 분당 요청 수를 확인해 주세요.";
  if (status === 400 && /max_output_tokens|max_tokens/i.test(raw))
    return "이 모델이 요청한 출력 길이를 받아 주지 않습니다.";
  if (/완성되지 않았습니다|incomplete/i.test(raw)) return raw;
  if (/안에 오지 않았습니다|timeout|timed out|aborted/i.test(raw))
    return "제한 시간 안에 응답이 오지 않았습니다.";
  if (status === 403) return "이 키로는 해당 모델을 쓸 수 없습니다.";
  if (status && status >= 500) return "AI 서버 쪽 오류입니다. 잠시 후 다시 시도해 주세요.";
  return raw ? `AI 호출이 실패했습니다 — ${raw.slice(0, 120)}` : "AI 호출이 실패했습니다.";
}
