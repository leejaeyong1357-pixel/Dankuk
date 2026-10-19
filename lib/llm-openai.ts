"use client";

/**
 * OpenAI 로 연습 피드백을 받는다 (정적 배포 전용, 대체 경로).
 *
 * dangerouslyAllowBrowser 를 켜야 하고, 그러면 키가 페이지에 실려 나간다.
 * 키가 설정되었을 때만 동적 import 되므로, 키가 없으면 로드되지 않는다.
 *
 * Claude 경로(lib/llm-browser.ts)와 같이 판정과 코칭을 나눠 동시에 부른다.
 * 지시문과 스키마는 lib/feedback-engine.ts 하나를 함께 쓴다.
 *
 * 추론 모델에서는 생각한 토큰도 max_output_tokens 에서 깎인다.
 * 상한을 빠듯하게 잡으면 생각하다가 한도를 다 쓰고 본문이 비어서 돌아온다.
 */
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { z } from "zod";
import { buildFeedbackPrompt, type FeedbackInput } from "./llm";
import { openAiEffort, openAiModel, supportsReasoning } from "./ai-provider";
import { recordUsage } from "./usage";
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
export const OPENAI_FEEDBACK_TIMEOUT_MS = 60_000;

async function ask<S extends z.ZodTypeAny>(
  apiKey: string,
  system: string,
  schema: S,
  name: string,
  prompt: string,
): Promise<z.infer<S>> {
  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
    timeout: OPENAI_FEEDBACK_TIMEOUT_MS,
    maxRetries: 0,
  });
  const model = openAiModel();
  const res = await client.responses.parse({
    model,
    max_output_tokens: 16000,
    // 비추론 모델에 보내면 400 이 난다
    ...(supportsReasoning(model) ? { reasoning: { effort: openAiEffort("low") } } : {}),
    instructions: system,
    input: prompt,
    text: { format: zodTextFormat(schema, name) },
  });

  if (res.usage)
    recordUsage({
      kind: "feedback",
      provider: "openai",
      model,
      inputTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
      reasoningTokens: res.usage.output_tokens_details?.reasoning_tokens ?? 0,
    });

  const parsed = res.output_parsed;
  if (!parsed) {
    if (res.status === "incomplete")
      throw new Error(
        `응답이 완성되지 않았습니다 (${res.incomplete_details?.reason ?? "원인 미상"}). ` +
          "출력 상한을 늘리거나 NEXT_PUBLIC_OPENAI_EFFORT 를 낮춰 주세요.",
      );
    throw new Error("피드백을 파싱하지 못했습니다.");
  }
  return parsed as z.infer<S>;
}

/** 판정과 코칭을 동시에 출발시킨다 */
export function feedbackPartsWithOpenAi(
  input: FeedbackInput,
  apiKey: string,
): { judge: Promise<Judge>; coach: Promise<Coach> } {
  const prompt = buildFeedbackPrompt(input);
  return {
    judge: ask(apiKey, JUDGE_SYSTEM, JudgeSchema, "judge", prompt),
    coach: ask(apiKey, COACH_SYSTEM, CoachSchema, "coach", prompt),
  };
}

export async function feedbackWithOpenAiInBrowser(input: FeedbackInput, apiKey: string): Promise<LlmFeedback> {
  const { judge, coach } = feedbackPartsWithOpenAi(input, apiKey);
  const [j, c] = await Promise.allSettled([judge, coach]);
  if (j.status === "rejected") throw j.reason;
  return mergeFeedback(j.value, c.status === "fulfilled" ? c.value : null, c.status === "fulfilled" ? "ok" : "failed");
}
