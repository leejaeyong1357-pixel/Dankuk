"use client";

/**
 * OpenAI 로 시험을 채점한다 (정적 배포 전용).
 *
 * 시험 종료 후 한 번만 부르는 호출이라 연습 피드백보다 여유를 주되,
 * 무한정 기다리지는 않는다. 넘기면 지표 기반 채점으로 넘어간다.
 */
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { EXAM_GRADE_SYSTEM, ExamGradeSchema, buildExamGradePrompt } from "./grade-exam";
import { openAiModel } from "./ai-provider";
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
    timeout: 45_000,
    maxRetries: 0,
  });

  const res = await client.responses.parse({
    model: openAiModel(),
    max_output_tokens: 4000,
    instructions: EXAM_GRADE_SYSTEM,
    input: buildExamGradePrompt(input),
    text: { format: zodTextFormat(ExamGradeSchema, "exam_grade") },
  });

  const parsed = res.output_parsed;
  if (!parsed) throw new Error("채점 결과를 파싱하지 못했습니다.");
  return parsed as ExamGrade;
}
