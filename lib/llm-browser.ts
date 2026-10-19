"use client";

/**
 * 브라우저에서 직접 Claude 로 연습 피드백을 받는다 (정적 배포 전용).
 *
 * dangerouslyAllowBrowser 를 켜야 하고, 그러면 키가 페이지에 실려 나간다.
 * 키가 설정되었을 때만 동적 import 되므로, 키가 없으면 로드되지 않는다.
 *
 * 판정과 코칭을 두 번 나눠 **동시에** 부른다 (lib/feedback-engine.ts).
 *   - 한 번에 모두 받으면 30초 가까이 걸렸다. 나누면 둘 중 긴 쪽만큼만 기다리고,
 *     판정이 먼저 오면 화면 윗부분을 바로 보여 줄 수 있다
 *   - effort 는 low. 둘 다 출력이 작아졌고, 판정 기준은 지시문에 다 적혀 있다.
 *     더 따져 보게 하려면 NEXT_PUBLIC_ANTHROPIC_EFFORT 로 올린다
 *   - 무한정 기다리지는 않는다. 넘기면 지표 기반 피드백으로 내려간다
 */
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { anthropicEffort, anthropicModel } from "./ai-provider";
import { isGrammarTooLarge, parseViaPromptedJson } from "./llm-fallback";
import { recordUsage } from "./usage";
import { buildFeedbackPrompt, type FeedbackInput } from "./llm";
import {
  COACH_SYSTEM,
  CoachSchema,
  JUDGE_SYSTEM,
  JudgeSchema,
  mergeFeedback,
  type Coach,
  type Judge,
} from "./feedback-engine";
import type { LlmFeedback } from "./types";

/** 이 시간을 넘기면 기다리지 않는다 */
export const FEEDBACK_TIMEOUT_MS = 45_000;

function client(apiKey: string) {
  return new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
    timeout: FEEDBACK_TIMEOUT_MS,
    // 늦어질 때 재시도까지 하면 대기가 배로 늘어난다
    maxRetries: 0,
  });
}

async function ask<S extends z.ZodTypeAny>(
  apiKey: string,
  system: string,
  schema: S,
  prompt: string,
  maxTokens: number,
): Promise<z.infer<S>> {
  const c = client(apiKey);
  const model = anthropicModel();
  const format = zodOutputFormat(schema);
  let res;
  try {
    res = await c.messages.parse({
      model,
      max_tokens: maxTokens,
      thinking: { type: "adaptive" },
      output_config: { effort: anthropicEffort("low"), format },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: prompt }],
    });
  } catch (err) {
    if (!isGrammarTooLarge(err)) throw err;
    // 형식 강제를 포기하고 JSON 으로 받는다 (lib/llm-fallback.ts 참고)
    console.warn("[feedback] 구조화 출력이 거부되어 JSON 방식으로 다시 받습니다:", err);
    return parseViaPromptedJson({
      client: c, model, maxTokens,
      system, prompt,
      schema, jsonSchema: format.schema,
    }) as Promise<z.infer<S>>;
  }

  if (res.usage)
    recordUsage({
      kind: "feedback",
      provider: "claude",
      model,
      inputTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
      reasoningTokens: 0,
    });

  if (!res.parsed_output) throw new Error("피드백을 파싱하지 못했습니다.");
  return res.parsed_output as z.infer<S>;
}

/** 판정과 코칭을 동시에 출발시킨다 — 먼저 오는 쪽부터 쓸 수 있게 따로 돌려준다 */
export function feedbackPartsWithClaude(
  input: FeedbackInput,
  apiKey: string,
): { judge: Promise<Judge>; coach: Promise<Coach> } {
  const prompt = buildFeedbackPrompt(input);
  return {
    judge: ask(apiKey, JUDGE_SYSTEM, JudgeSchema, prompt, 6000),
    coach: ask(apiKey, COACH_SYSTEM, CoachSchema, prompt, 8000),
  };
}

/** 둘 다 기다려 한 번에 받는다 */
export async function feedbackWithClaudeInBrowser(input: FeedbackInput, apiKey: string): Promise<LlmFeedback> {
  const { judge, coach } = feedbackPartsWithClaude(input, apiKey);
  const [j, c] = await Promise.allSettled([judge, coach]);
  if (j.status === "rejected") throw j.reason;
  return mergeFeedback(j.value, c.status === "fulfilled" ? c.value : null, c.status === "fulfilled" ? "ok" : "failed");
}
