"use client";

/**
 * OpenAI 로 연습 피드백을 받는다 (정적 배포 전용).
 *
 * dangerouslyAllowBrowser 를 켜야 하고, 그러면 키가 페이지에 실려 나간다.
 * 키가 설정되었을 때만 동적 import 되므로, 키가 없으면 로드되지 않는다.
 *
 * 속도가 곧 기능이다. 학생이 말을 마치고 결과를 기다리는 시간이 길면
 * 연습을 한 번 더 하지 않는다. 출력 상한과 타임아웃을 짧게 잡는다.
 */
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { FEEDBACK_SYSTEM, FeedbackSchema, buildFeedbackPrompt, type FeedbackInput } from "./llm";
import { openAiModel } from "./ai-provider";
import type { LlmFeedback } from "./types";

/** 이 시간을 넘기면 기다리지 않는다 */
export const OPENAI_FEEDBACK_TIMEOUT_MS = 20_000;

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

  const res = await client.responses.parse({
    model: openAiModel(),
    max_output_tokens: 2400,
    instructions: FEEDBACK_SYSTEM,
    input: buildFeedbackPrompt(input),
    text: { format: zodTextFormat(FeedbackSchema, "feedback") },
  });

  const parsed = res.output_parsed;
  if (!parsed) throw new Error("피드백을 파싱하지 못했습니다.");
  return parsed as LlmFeedback;
}
