"use client";

/**
 * OpenAI 로 시험을 채점한다 (정적 배포 전용).
 *
 * 시험 한 번에 한 번만 부르는 호출이다. 15문항 전체를 보고 등급 하나를
 * 정하는 판단이라, 여기서 아끼면 결과지 전체가 틀어진다.
 * 무한정 기다리지는 않는다. 넘기면 지표 기반 채점으로 넘어간다.
 */
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { EXAM_GRADE_SYSTEM, ExamGradeSchema, buildExamGradePrompt } from "./grade-exam";
import { openAiEffort, openAiModel, supportsReasoning } from "./ai-provider";
import type { DifficultyLevel, DifficultySelection } from "./exam/question-types";
import type { ExamAnswer, ExamGrade, TargetGrade } from "./types";

export async function gradeWithOpenAiInBrowser(
  input: {
    answers: ExamAnswer[];
    targetGrade: TargetGrade;
    initialDifficulty: DifficultyLevel;
    secondDifficulty: DifficultyLevel;
    difficultySelection: DifficultySelection;
  },
  apiKey: string,
): Promise<ExamGrade> {
  const client = new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
    timeout: 240_000,
    maxRetries: 0,
  });

  const model = openAiModel();
  const res = await client.responses.parse({
    model,
    max_output_tokens: 48000,
    // 비추론 모델에 보내면 400 이 난다
    ...(supportsReasoning(model) ? { reasoning: { effort: openAiEffort("high") } } : {}),
    instructions: EXAM_GRADE_SYSTEM,
    input: buildExamGradePrompt(input),
    text: { format: zodTextFormat(ExamGradeSchema, "exam_grade") },
  });

  const parsed = res.output_parsed;
  if (!parsed) {
    if (res.status === "incomplete")
      throw new Error(
        `응답이 완성되지 않았습니다 (${res.incomplete_details?.reason ?? "원인 미상"}). ` +
          "출력 상한을 늘리거나 NEXT_PUBLIC_OPENAI_EFFORT 를 낮춰 주세요.",
      );
    throw new Error("채점 결과를 파싱하지 못했습니다.");
  }
  return parsed as ExamGrade;
}
