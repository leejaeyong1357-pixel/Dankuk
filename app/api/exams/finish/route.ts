import { NextResponse } from "next/server";
import { prisma, dbEnabled } from "@/lib/db/client";
import { currentUser } from "@/lib/auth/session";
import { finishExam } from "@/lib/db/repository";
import type { DifficultyLevel, DifficultySelection } from "@/lib/exam/question-types";
import type { ExamAnswer, ExamGrade } from "@/lib/types";

export const runtime = "nodejs";

/** 시험 종료 — 답변과 채점 결과를 저장한다 */
export async function POST(req: Request) {
  if (!dbEnabled) return NextResponse.json({ dbEnabled: false });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

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

    // 남의 시험을 덮어쓰지 못하게 소유자를 확인한다
    const exam = await prisma.exam.findUnique({
      where: { id: body.examId }, select: { userId: true },
    });
    if (!exam) return NextResponse.json({ error: "시험을 찾을 수 없습니다." }, { status: 404 });
    if (exam.userId !== user.id) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }

    await finishExam(body);
    return NextResponse.json({ dbEnabled: true, saved: true });
  } catch (err) {
    console.error("[exams/finish]", err);
    return NextResponse.json({ error: "저장에 실패했습니다." }, { status: 500 });
  }
}
