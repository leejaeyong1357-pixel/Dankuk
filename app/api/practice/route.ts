import { NextResponse } from "next/server";
import { practiceTopics, questionsForPractice, TESTLETS } from "@/lib/exam/repository";
import { requireUser } from "@/lib/auth/guard";
import type { DifficultyLevel } from "@/lib/exam/question-types";

export const runtime = "nodejs";

/**
 * 연습 모드용 목록·문항 조회.
 * 문항 뱅크는 서버에만 두고 필요한 만큼만 내려보낸다.
 */
export async function GET(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;

  const url = new URL(req.url);
  const raw = Number(url.searchParams.get("level"));
  const level = (Number.isInteger(raw) && raw >= 1 && raw <= 6 ? raw : 3) as DifficultyLevel;
  const topic = url.searchParams.get("topic");

  if (topic) {
    return NextResponse.json({ level, questions: questionsForPractice(topic, level) });
  }

  const roleplayTopics = [
    ...new Set(
      TESTLETS.filter((t) => t.isRoleplay && level >= t.minDifficulty && level <= t.maxDifficulty)
        .map((t) => t.topic),
    ),
  ];
  return NextResponse.json({ level, topics: practiceTopics(level), roleplayTopics });
}
