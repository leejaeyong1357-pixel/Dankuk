"use client";

/**
 * 브라우저에서 직접 Claude 로 연습 피드백을 받는다 (정적 배포 전용).
 *
 * dangerouslyAllowBrowser 를 켜야 하고, 그러면 키가 페이지에 실려 나간다.
 * 키가 설정되었을 때만 동적 import 되므로, 키가 없으면 로드되지 않는다.
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { FEEDBACK_SYSTEM, FeedbackSchema, buildFeedbackPrompt, type FeedbackInput } from "./llm";
import type { LlmFeedback } from "./types";

export async function feedbackWithClaudeInBrowser(
  input: FeedbackInput,
  apiKey: string,
): Promise<LlmFeedback> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const res = await client.messages.parse({
    model: "claude-sonnet-5",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: FEEDBACK_SYSTEM,
    messages: [{ role: "user", content: buildFeedbackPrompt(input) }],
    output_config: { format: zodOutputFormat(FeedbackSchema) },
  });
  if (!res.parsed_output) throw new Error("피드백을 파싱하지 못했습니다.");
  return res.parsed_output as LlmFeedback;
}
