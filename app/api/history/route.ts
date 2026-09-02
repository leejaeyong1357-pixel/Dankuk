import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db/client";
import { examCount, examHistory, findUser, latestExamResult } from "@/lib/db/repository";

export const runtime = "nodejs";

/**
 * 출제 중복 회피용 이력 + 최근 결과.
 * 이력이 서버에 있어야 브라우저 데이터를 지워도 같은 문제가 다시 나오지 않는다.
 */
export async function GET(req: Request) {
  if (!dbEnabled) return NextResponse.json({ dbEnabled: false });
  const email = new URL(req.url).searchParams.get("email");
  if (!email) return NextResponse.json({ error: "email 이 필요합니다." }, { status: 400 });

  const user = await findUser(email);
  if (!user) return NextResponse.json({ dbEnabled: true, history: [], count: 0, latest: null });

  const [history, count, latest] = await Promise.all([
    examHistory(user.id),
    examCount(user.id),
    latestExamResult(user.id),
  ]);
  return NextResponse.json({ dbEnabled: true, history, count, latest });
}
