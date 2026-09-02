import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db/client";
import { currentUser } from "@/lib/auth/session";

export const runtime = "nodejs";

/** 현재 로그인 사용자. 인증이 필요한 모든 화면이 이걸로 판단한다. */
export async function GET() {
  if (!dbEnabled) return NextResponse.json({ dbEnabled: false, user: null });
  const user = await currentUser();
  if (!user) return NextResponse.json({ dbEnabled: true, user: null });
  return NextResponse.json({
    dbEnabled: true,
    user: {
      email: user.email, name: user.name,
      targetGrade: user.targetGrade, examDate: user.examDate,
    },
  });
}
