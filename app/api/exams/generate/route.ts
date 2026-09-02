import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db/client";
import { currentUser } from "@/lib/auth/session";
import { createExam, examHistory, saveSurvey } from "@/lib/db/repository";
import { allSlots, generateFirstSession, generateSecondSession } from "@/lib/exam/generator";
import type { ExamPlan } from "@/lib/exam/generator";
import type { DifficultyLevel, DifficultySelection } from "@/lib/exam/question-types";
import type { SurveyAnswers } from "@/lib/exam/survey";

export const runtime = "nodejs";

/**
 * 출제는 서버에서만 한다.
 *
 * 문항 뱅크(7MB)를 클라이언트 번들에 넣으면 학생이 접속할 때마다 내려받게 되고,
 * 브라우저에서 전체 문제지를 들여다볼 수 있게 된다. 시험 문항은 서버에 둔다.
 */
export async function POST(req: Request) {
  const user = dbEnabled ? await currentUser() : null;
  if (dbEnabled && !user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body = (await req.json()) as
      | {
          phase: "first";
          survey: SurveyAnswers;
          topics: string[];
          initialDifficulty: DifficultyLevel;
          startedAt: string;
        }
      | { phase: "second"; plan: ExamPlan; selection: DifficultySelection; topics: string[] };

    if (body.phase === "first") {
      const history = user ? await examHistory(user.id) : [];
      const plan = generateFirstSession({
        selectedSurveyTopics: body.topics,
        initialDifficulty: body.initialDifficulty,
        history,
      });

      if (user) {
        const survey = await saveSurvey(user.id, body.survey, body.topics);
        await createExam({
          examId: plan.examId,
          userId: user.id,
          surveyResponseId: survey.id,
          initialDifficulty: body.initialDifficulty,
          totalQuestions: plan.totalQuestions,
          startedAt: body.startedAt,
        });
      }
      return NextResponse.json({ plan, slots: allSlots(plan) });
    }

    const full = generateSecondSession({
      plan: body.plan,
      selection: body.selection,
      selectedSurveyTopics: body.topics,
      history: user ? await examHistory(user.id) : [],
    });
    return NextResponse.json({ plan: full, slots: allSlots(full) });
  } catch (err) {
    console.error("[exams/generate]", err);
    return NextResponse.json({ error: "출제에 실패했습니다." }, { status: 500 });
  }
}
