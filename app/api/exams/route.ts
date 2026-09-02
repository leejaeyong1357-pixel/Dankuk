import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db/client";
import { createExam, findUser, saveSurvey } from "@/lib/db/repository";
import type { DifficultyLevel } from "@/lib/exam/question-types";
import type { SurveyAnswers } from "@/lib/exam/survey";

export const runtime = "nodejs";

/** 시험 시작 — 설문 응답을 남기고 시험 레코드를 연다 */
export async function POST(req: Request) {
  if (!dbEnabled) return NextResponse.json({ dbEnabled: false });
  try {
    const body = (await req.json()) as {
      email: string;
      examId: string;
      survey: SurveyAnswers;
      topics: string[];
      initialDifficulty: DifficultyLevel;
      totalQuestions: number;
      startedAt: string;
    };
    const user = await findUser(body.email);
    if (!user) return NextResponse.json({ error: "사용자를 찾을 수 없습니다." }, { status: 404 });

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
