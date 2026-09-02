import { NextResponse } from "next/server";
import { getExamGrader } from "@/lib/grade-exam";
import type { DifficultyLevel, DifficultySelection } from "@/lib/exam/question-types";
import type { ExamAnswer, TargetGrade } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

/** 시험 종료 후 전체 답변을 한 번에 채점한다 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      answers: ExamAnswer[];
      targetGrade: TargetGrade;
      initialDifficulty: DifficultyLevel;
      secondDifficulty: DifficultyLevel;
      difficultySelection: DifficultySelection;
    };
    if (!Array.isArray(body.answers) || body.answers.length === 0) {
      return NextResponse.json({ error: "채점할 답변이 없습니다." }, { status: 400 });
    }
    const grader = getExamGrader();
    const grade = await grader.grade(body);
    return NextResponse.json({ grade, provider: grader.name });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "알 수 없는 오류" },
      { status: 500 },
    );
  }
}
