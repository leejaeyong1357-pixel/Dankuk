import { NextResponse } from "next/server";
import { dbEnabled } from "../db/client";
import { currentUser, type SessionUser } from "./session";

/**
 * 비용이 드는 라우트(STT · LLM)와 문항 뱅크 조회의 접근 통제.
 *
 * 전사와 채점은 외부 유료 서비스를 호출하고, 연습 문항 조회는 뱅크 전체를
 * 열람할 수 있게 한다. 로그인 없이 열어 두면 누구나 요금을 태우고
 * 문제지를 긁어갈 수 있으므로 세션을 요구한다.
 *
 * DATABASE_URL 이 없는 로컬 개발 모드에는 세션 자체가 없다.
 * 이때만 통과시키고, 운영(= DB 연결됨)에서는 예외 없이 막는다.
 */
export async function requireUser(): Promise<
  { user: SessionUser | null } | { response: NextResponse }
> {
  if (!dbEnabled) return { user: null };
  const user = await currentUser();
  if (!user) {
    return {
      response: NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 }),
    };
  }
  return { user };
}

/**
 * 사용자별 호출 빈도 제한.
 *
 * 프로세스 메모리에만 두므로 인스턴스를 여러 개 띄우면 인스턴스마다 따로 센다.
 * 정확한 쿼터가 아니라 폭주를 막는 방어선이다.
 */
const buckets = new Map<string, number[]>();

export function withinRate(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  hits.push(now);
  buckets.set(key, hits);

  // 오래된 키를 흘려보낸다 (요청이 뜸한 사용자까지 메모리에 남지 않게)
  if (buckets.size > 5_000) {
    for (const [k, v] of buckets) {
      if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
    }
  }
  return hits.length <= limit;
}

export const rateLimited = () =>
  NextResponse.json(
    { error: "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 },
  );

/** 답변 오디오 상한. 한 문항 답변은 길어야 몇 분이다. */
export const MAX_AUDIO_BYTES = 20 * 1024 * 1024;
