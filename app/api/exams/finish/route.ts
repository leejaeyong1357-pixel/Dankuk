import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db/client";
import { finishExam } from "@/lib/db/repository";
import type { DifficultyLevel, DifficultySelection } from "@/lib/exam/question-types";
import type { ExamAnswer, ExamGrade } from "@/lib/types";

export const runtime = "nodejs";

/** 시험 종료 — 답변과 채점 결과를 저장한다 */
export async function POST(req: Request) {
  if (!dbEnabled) return NextResponse.json({ dbEnabled: false });
  try {
    const body = (await req.json()) as {
      examId: string;
      secondDifficulty: DifficultyLevel;
      difficultySelection: DifficultySelection;
      finishedAt: string;
      elapsedSec: number;
      grade: ExamGrade;
      gradeProvider: string;
      testletIds: string[];
      questionIds: string[];
      answers: ExamAnswer[];
    };
    await finishExam(body);
    return NextResponse.json({ dbEnabled: true, saved: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "저장 실패" }, { status: 500 },
    );
  }
}
