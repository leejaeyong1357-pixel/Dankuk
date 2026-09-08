"use client";

/**
 * 브라우저에서 직접 Claude 로 연습 피드백을 받는다 (정적 배포 전용).
 *
 * dangerouslyAllowBrowser 를 켜야 하고, 그러면 키가 페이지에 실려 나간다.
 * 키가 설정되었을 때만 동적 import 되므로, 키가 없으면 로드되지 않는다.
 *
 * 속도가 곧 기능이다. 학생이 말을 마치고 결과를 기다리는 시간이 길면
 * 연습을 한 번 더 하지 않는다. 그래서 이 호출은 다음을 지킨다.
 *   - 확장 사고를 끄고 effort 를 낮춘다. 채점 기준이 프롬프트에 이미 다 있어
 *     모델이 따로 궁리할 것이 없다
 *   - max_tokens 를 실제로 필요한 만큼만 준다 (16000 -> 2400)
 *   - 응답이 늦으면 기다리지 않고 끊는다. 지표 기반 피드백으로 넘어가는 편이
 *     빈 화면을 오래 보는 것보다 낫다
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { FEEDBACK_SYSTEM, FeedbackSchema, buildFeedbackPrompt, type FeedbackInput } from "./llm";
import type { LlmFeedback } from "./types";

/** 이 시간을 넘기면 기다리지 않는다 */
export const FEEDBACK_TIMEOUT_MS = 20_000;

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
    model: "claude-sonnet-5",
    max_tokens: 2400,
    // 채점 기준·목표 등급·지표가 프롬프트에 모두 주어져 있다.
    // 모델이 따로 궁리할 것이 없으므로 사고를 켜지 않는다.
    thinking: { type: "disabled" },
    output_config: { effort: "low", format: zodOutputFormat(FeedbackSchema) },
    system: [{ type: "text", text: FEEDBACK_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildFeedbackPrompt(input) }],
  });

  if (!res.parsed_output) throw new Error("피드백을 파싱하지 못했습니다.");
  return res.parsed_output as LlmFeedback;
}
