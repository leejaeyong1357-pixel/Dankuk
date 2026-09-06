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
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const res = await client.messages.parse({
    model: "claude-sonnet-5",
    max_tokens: 16000,
    thinking: { type: "adaptive" },
    system: EXAM_GRADE_SYSTEM,
    messages: [{ role: "user", content: buildExamGradePrompt(input) }],
    output_config: { format: zodOutputFormat(ExamGradeSchema) },
  });

  if (!res.parsed_output) throw new Error("채점 결과를 파싱하지 못했습니다.");
  return res.parsed_output as ExamGrade;
}
