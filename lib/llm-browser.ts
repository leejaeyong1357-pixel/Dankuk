"use client";

/**
 * 브라우저에서 직접 Claude 로 연습 피드백을 받는다 (정적 배포 전용).
 *
 * dangerouslyAllowBrowser 를 켜야 하고, 그러면 키가 페이지에 실려 나간다.
 * 키가 설정되었을 때만 동적 import 되므로, 키가 없으면 로드되지 않는다.
 *
 * 이 호출이 결과지의 거의 전부를 만든다 — 등급 판정, 질문과 답변이 맞는지,
 * 문장 하나하나의 교정, 함께 익혀 둘 표현까지. 그래서 속도보다 판단을 앞에 둔다.
 *   - 사고를 adaptive 로 두어 모델이 필요한 만큼 따져 보게 한다.
 *     "묻는 것에 답했는가"와 등급 판정은 기준을 읽는 것만으로 되지 않는다
 *   - effort 는 medium. low 로 두면 교정이 "좋아요" 수준에서 멈춘다
 *   - max_tokens 는 문장 수만큼 교정이 나오는 것을 전제로 잡는다.
 *     2400 으로는 답변이 조금만 길어도 중간에서 잘렸다
 *   - 그래도 무한정 기다리지는 않는다. 넘기면 지표 기반 피드백으로 내려간다
 */
import Anthropic from "@anthropic-ai/sdk";
import { anthropicEffort, anthropicModel } from "./ai-provider";
import { recordUsage } from "./usage";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { FEEDBACK_SYSTEM, FeedbackSchema, buildFeedbackPrompt, type FeedbackInput } from "./llm";
import type { LlmFeedback } from "./types";

/** 이 시간을 넘기면 기다리지 않는다 */
export const FEEDBACK_TIMEOUT_MS = 50_000;

export async function feedbackWithClaudeInBrowser(
  input: FeedbackInput,
  apiKey: string,
): Promise<LlmFeedback> {
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
    timeout: FEEDBACK_TIMEOUT_MS,
    // 늦어질 때 재시도까지 하면 대기가 배로 늘어난다
    maxRetries: 0,
  });

  const res = await client.messages.parse({
    model: anthropicModel(),
    // 사고 토큰도 max_tokens 에서 깎인다. 빠듯하게 잡으면 생각만 하다
    // 한도를 다 쓰고 본문이 비어서 돌아온다. Haiku 상한은 128K 라 여유가 있다.
    max_tokens: 16000,
    // 등급 판정과 문장별 교정은 기준을 읽는 것만으로 되지 않는다.
    // 모델이 필요한 만큼 따져 보게 두고, 쉬운 답변에서는 알아서 짧게 끝난다.
    thinking: { type: "adaptive" },
    output_config: { effort: anthropicEffort("medium"), format: zodOutputFormat(FeedbackSchema) },
    system: [{ type: "text", text: FEEDBACK_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildFeedbackPrompt(input) }],
  });

  if (res.usage)
    recordUsage({
      kind: "feedback",
      provider: "claude",
      model: anthropicModel(),
      inputTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
      reasoningTokens: 0,
    });

  if (!res.parsed_output) throw new Error("피드백을 파싱하지 못했습니다.");
  return res.parsed_output as LlmFeedback;
}
