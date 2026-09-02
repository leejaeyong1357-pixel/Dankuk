import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db/client";
import { currentUser } from "@/lib/auth/session";
import { examCount, examHistory, latestExamResult } from "@/lib/db/repository";

export const runtime = "nodejs";

/**
 * 출제 중복 회피용 이력 + 최근 결과.
 * 사용자는 세션으로만 식별한다. 쿼리스트링의 email 을 신뢰하지 않는다.
 */
export async function GET() {
  if (!dbEnabled) return NextResponse.json({ dbEnabled: false });
  const user = await currentUser();
  if (!user) return NextResponse.json({ dbEnabled: true, unauthenticated: true }, { status: 401 });

  const [history, count, latest] = await Promise.all([
    examHistory(user.id),
    examCount(user.id),
    latestExamResult(user.id),
  ]);
  return NextResponse.json({ dbEnabled: true, history, count, latest });
}
