"use client";

/**
 * OpenAI 로 연습 피드백을 받는다 (정적 배포 전용).
 *
 * dangerouslyAllowBrowser 를 켜야 하고, 그러면 키가 페이지에 실려 나간다.
 * 키가 설정되었을 때만 동적 import 되므로, 키가 없으면 로드되지 않는다.
 *
 * 이 호출이 결과지의 거의 전부를 만든다 — 등급 판정, 질문과 답변이 맞는지,
 * 문장 하나하나의 교정, 함께 익혀 둘 표현까지.
 *
 * 추론 모델에서는 생각한 토큰도 max_output_tokens 에서 깎인다.
 * 상한을 빠듯하게 잡으면 생각하다가 한도를 다 쓰고 본문이 비어서 돌아온다.
 * 그래서 넉넉히 준다 — 안 쓰면 요금도 안 나간다.
 */
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { FEEDBACK_SYSTEM, FeedbackSchema, buildFeedbackPrompt, type FeedbackInput } from "./llm";
import { openAiEffort, openAiModel, supportsReasoning } from "./ai-provider";
import type { LlmFeedback } from "./types";

/** 이 시간을 넘기면 기다리지 않는다 */
export const OPENAI_FEEDBACK_TIMEOUT_MS = 90_000;

export async function feedbackWithOpenAiInBrowser(
  input: FeedbackInput,
  apiKey: string,
): Promise<LlmFeedback> {
  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
    timeout: OPENAI_FEEDBACK_TIMEOUT_MS,
    // 늦어질 때 재시도까지 하면 대기가 배로 늘어난다
    maxRetries: 0,
  });

  const model = openAiModel();
  const res = await client.responses.parse({
    model,
    max_output_tokens: 24000,
    // 비추론 모델에 보내면 400 이 난다
    ...(supportsReasoning(model) ? { reasoning: { effort: openAiEffort("medium") } } : {}),
    instructions: FEEDBACK_SYSTEM,
    input: buildFeedbackPrompt(input),
    text: { format: zodTextFormat(FeedbackSchema, "feedback") },
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
  return parsed as LlmFeedback;
}
