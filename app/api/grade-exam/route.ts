import { NextResponse } from "next/server";
import { getExamGrader } from "@/lib/grade-exam";
import { rateLimited, requireUser, withinRate } from "@/lib/auth/guard";
import type { DifficultyLevel, DifficultySelection } from "@/lib/exam/question-types";
import type { ExamAnswer, TargetGrade } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

/** 시험 종료 후 전체 답변을 한 번에 채점한다 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  // Sonnet 호출이 붙어 있다. 한 시험에 한 번이면 충분하다.
  if (!withinRate(`grade:${auth.user?.id ?? "local"}`, 5, 10 * 60_000)) return rateLimited();

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
    // 지표는 클라이언트가 실어 보낸다. 형태가 어긋난 답변이 섞이면
    // 채점기가 도중에 터지므로 들어오는 자리에서 막는다.
    const malformed = body.answers.some(
      (a) =>
        !a || typeof a !== "object" ||
        !a.metrics || typeof a.metrics !== "object" ||
        typeof a.metrics.wordCount !== "number" ||
        !Array.isArray(a.metrics.distinctConnectors),
    );
    if (malformed) {
      return NextResponse.json({ error: "답변 형식이 올바르지 않습니다." }, { status: 400 });
    }
    const grader = getExamGrader();
    const grade = await grader.grade(body);
    return NextResponse.json({ grade, provider: grader.name });
  } catch (err) {
    console.error("[grade-exam]", err);
    return NextResponse.json({ error: "채점에 실패했습니다." }, { status: 500 });
  }
}
