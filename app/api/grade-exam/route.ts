import { NextResponse } from "next/server";
import { getExamGrader } from "@/lib/grade-exam";
import type { ExamAnswer, SecondChoice, SelfAssessment, TargetGrade } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

/** 시험 종료 후 전체 답변을 한 번에 채점한다 (Sonnet 5 를 1회만 호출) */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      answers: ExamAnswer[];
      targetGrade: TargetGrade;
      selfAssessment: SelfAssessment;
      secondChoice: SecondChoice;
    };
    if (!Array.isArray(body.answers) || body.answers.length === 0) {
      return NextResponse.json({ error: "채점할 답변이 없습니다." }, { status: 400 });
    }
    const grader = getExamGrader();
    const grade = await grader.grade({
      answers: body.answers,
      targetGrade: body.targetGrade,
      selfAssessment: body.selfAssessment,
      secondChoice: body.secondChoice,
    });
    return NextResponse.json({ grade, provider: grader.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
