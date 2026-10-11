"use client";

/**
 * 브라우저에서 직접 Claude 로 채점한다 (정적 배포 전용).
 *
 * 브라우저에서 API 를 부르려면 SDK 의 dangerouslyAllowBrowser 를 켜야 한다.
 * 이름 그대로 위험한 설정이다 — 키가 페이지에 실려 나가므로 누구나 가져다 쓸 수 있다.
 * 서버를 둘 수 있으면 서버에서 부르는 쪽(lib/grade-exam.ts)을 쓴다.
 *
 * 이 파일은 키가 실제로 설정되었을 때만 동적 import 된다.
 * 키가 없으면 번들에 들어가지도, 로드되지도 않는다.
 */
import Anthropic from "@anthropic-ai/sdk";
import { anthropicEffort, anthropicModel } from "./ai-provider";
import { isGrammarTooLarge, parseViaPromptedJson } from "./llm-fallback";
import { recordUsage } from "./usage";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { EXAM_GRADE_SYSTEM, ExamGradeSchema, buildExamGradePrompt } from "./grade-exam";
import type { DifficultyLevel, DifficultySelection } from "./exam/question-types";
import type { ExamAnswer, ExamGrade, TargetGrade } from "./types";

export async function gradeWithClaudeInBrowser(
  input: {
    answers: ExamAnswer[];
    targetGrade: TargetGrade;
    initialDifficulty: DifficultyLevel;
    secondDifficulty: DifficultyLevel;
    difficultySelection: DifficultySelection;
  },
  apiKey: string,
): Promise<ExamGrade> {
  // 시험 한 번에 한 번만 부르는 호출이다. 15문항 전체를 보고 등급 하나를
  // 정하는 판단이라, 여기서 아끼면 결과지 전체가 틀어진다. 넉넉히 준다.
  // 그래도 무한정 기다리지는 않는다. 넘기면 지표 기반 채점으로 넘어간다.
  const client = new Anthropic({
    apiKey,
    dangerouslyAllowBrowser: true,
    timeout: 150_000,
    maxRetries: 1,
  });

  const format = zodOutputFormat(ExamGradeSchema);
  const model = anthropicModel();
  const prompt = buildExamGradePrompt(input);

  let res;
  try {
    res = await client.messages.parse({
      model,
      max_tokens: 32000,
      // 사고 토큰도 여기서 깎인다
      thinking: { type: "adaptive" },
      system: EXAM_GRADE_SYSTEM,
      messages: [{ role: "user", content: prompt }],
      output_config: { effort: anthropicEffort("high"), format },
    });
  } catch (err) {
    if (!isGrammarTooLarge(err)) throw err;
    console.warn("[grade] 구조화 출력이 거부되어 JSON 방식으로 다시 받습니다:", err);
    return parseViaPromptedJson({
      client, model, maxTokens: 32000,
      system: EXAM_GRADE_SYSTEM, prompt,
      schema: ExamGradeSchema, jsonSchema: format.schema,
    }) as Promise<ExamGrade>;
  }

  if (res.usage)
    recordUsage({
      kind: "exam",
      provider: "claude",
      model: anthropicModel(),
      inputTokens: res.usage.input_tokens,
      outputTokens: res.usage.output_tokens,
      reasoningTokens: 0,
    });

  if (!res.parsed_output) throw new Error("채점 결과를 파싱하지 못했습니다.");
  return res.parsed_output as ExamGrade;
}
