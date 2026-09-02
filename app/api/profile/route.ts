import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db/client";
import { findUser, toProfile, upsertUser, latestSurvey } from "@/lib/db/repository";
import type { TargetGrade } from "@/lib/types";

export const runtime = "nodejs";

/** 프로필 조회. DB 가 없으면 클라이언트가 localStorage 폴백을 쓴다. */
export async function GET(req: Request) {
  if (!dbEnabled) return NextResponse.json({ dbEnabled: false });
  const email = new URL(req.url).searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email 이 필요합니다." }, { status: 400 });

  const user = await findUser(email);
  if (!user) return NextResponse.json({ dbEnabled: true, profile: null });

  const survey = await latestSurvey(user.id);
  return NextResponse.json({
    dbEnabled: true,
    userId: user.id,
    profile: toProfile(user),
    lastSurvey: survey?.answers ?? null,
    lastSurveyTopics: survey?.topics ?? null,
  });
}

/** 온보딩 저장 (upsert) */
export async function POST(req: Request) {
  if (!dbEnabled) return NextResponse.json({ dbEnabled: false });
  try {
    const body = (await req.json()) as {
      email: string; name: string; targetGrade: TargetGrade; examDate: string;
    };
    if (!/@dankook\.ac\.kr$/i.test(body.email)) {
      return NextResponse.json({ error: "단국대 이메일만 사용할 수 있습니다." }, { status: 400 });
    }
    const user = await upsertUser(body);
    return NextResponse.json({ dbEnabled: true, userId: user.id, profile: toProfile(user) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "저장 실패" }, { status: 500 },
    );
  }
}
