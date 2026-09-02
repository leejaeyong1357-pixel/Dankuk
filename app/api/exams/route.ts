import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db/client";
import { currentUser } from "@/lib/auth/session";
import { createExam, saveSurvey } from "@/lib/db/repository";
import type { DifficultyLevel } from "@/lib/exam/question-types";
import type { SurveyAnswers } from "@/lib/exam/survey";

export const runtime = "nodejs";

/** 시험 시작 — 설문 응답을 남기고 시험 레코드를 연다 */
export async function POST(req: Request) {
  if (!dbEnabled) return NextResponse.json({ dbEnabled: false });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  try {
    const body = (await req.json()) as {
      examId: string;
      survey: SurveyAnswers;
      topics: string[];
      initialDifficulty: DifficultyLevel;
      totalQuestions: number;
      startedAt: string;
    };
    const survey = await saveSurvey(user.id, body.survey, body.topics);
    await createExam({
      examId: body.examId,
      userId: user.id,
      surveyResponseId: survey.id,
      initialDifficulty: body.initialDifficulty,
      totalQuestions: body.totalQuestions,
      startedAt: body.startedAt,
    });
    return NextResponse.json({ dbEnabled: true, examId: body.examId });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "시험 생성 실패" }, { status: 500 },
    );
  }
}
