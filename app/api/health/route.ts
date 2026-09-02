import { NextResponse } from "next/server";
import { dbEnabled, prisma } from "@/lib/db/client";
import { currentUser, safeEqual } from "@/lib/auth/session";
import { TESTLETS, ALL_QUESTIONS } from "@/lib/exam/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * 배포 후 구성 점검용.
 *
 * 상세 내역은 어떤 폴백이 켜져 있는지 — 즉 어디가 약한지를 그대로 알려주므로
 * 로그인했거나 HEALTH_TOKEN 을 아는 쪽에만 준다.
 * 컨테이너 헬스체크는 상태 코드만 보므로 익명 응답으로 충분하다.
 */
async function maySeeDetail(req: Request): Promise<boolean> {
  const token = process.env.HEALTH_TOKEN;
  const given = req.headers.get("x-health-token");
  if (token && given && safeEqual(token, given)) return true;
  if (process.env.NODE_ENV !== "production") return true;
  return dbEnabled ? (await currentUser()) !== null : false;
}

export async function GET(req: Request) {
  const withAudio = ALL_QUESTIONS.filter((q) => q.promptAudio).length;

  let db: "ok" | "error" | "disabled" = "disabled";
  if (dbEnabled) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      db = "ok";
    } catch {
      db = "error";
    }
  }

  const checks = {
    db,
    grader: process.env.ANTHROPIC_API_KEY ? "claude-sonnet-5" : "fallback(지표 기반)",
    stt: process.env.STT_PROVIDER
      ?? (process.env.STT_URL ? "faster-whisper" : process.env.MUSE_API_KEY ? "muse" : "mock"),
    mailer: process.env.SMTP_HOST ? "smtp" : "console(개발용)",
    testlets: TESTLETS.length,
    questions: ALL_QUESTIONS.length,
    questionAudio: `${withAudio}/${ALL_QUESTIONS.length}`,
  };

  // 운영에 올리기 전 반드시 해결해야 하는 항목
  const blockers: string[] = [];
  if (db !== "ok") blockers.push("DATABASE_URL 미설정 또는 연결 실패");
  if (!process.env.SMTP_HOST) {
    blockers.push(
      process.env.NODE_ENV === "production"
        ? "SMTP 미설정 — 인증 코드를 보낼 수 없어 로그인이 막혀 있습니다"
        : "SMTP 미설정 — 개발 모드라 인증 코드가 화면에 노출됩니다",
    );
  }
  if (checks.stt === "mock") blockers.push("STT 미설정 — 답변이 실제로 인식되지 않습니다");
  if (!process.env.ANTHROPIC_API_KEY) blockers.push("ANTHROPIC_API_KEY 미설정 — 폴백 채점만 동작합니다");
  if (withAudio < ALL_QUESTIONS.length) {
    blockers.push(`문항 음성 ${ALL_QUESTIONS.length - withAudio}개 미생성 — 브라우저 음성으로 대체됩니다`);
  }

  if (!(await maySeeDetail(req))) {
    return NextResponse.json({ status: "up", db, ok: blockers.length === 0 });
  }
  return NextResponse.json({ ok: blockers.length === 0, checks, blockers });
}
