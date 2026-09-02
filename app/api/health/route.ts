import { NextResponse } from "next/server";
import { dbEnabled, prisma } from "@/lib/db/client";
import { TESTLETS, ALL_QUESTIONS } from "@/lib/exam/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** 배포 후 구성 점검용. 무엇이 켜져 있고 무엇이 폴백인지 한눈에 보여준다. */
export async function GET() {
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
  if (!process.env.SMTP_HOST) blockers.push("SMTP 미설정 — 인증 코드가 메일로 발송되지 않습니다");
  if (checks.stt === "mock") blockers.push("STT 미설정 — 답변이 실제로 인식되지 않습니다");
  if (!process.env.ANTHROPIC_API_KEY) blockers.push("ANTHROPIC_API_KEY 미설정 — 폴백 채점만 동작합니다");
  if (withAudio < ALL_QUESTIONS.length) {
    blockers.push(`문항 음성 ${ALL_QUESTIONS.length - withAudio}개 미생성 — 브라우저 음성으로 대체됩니다`);
  }

  return NextResponse.json({ ok: blockers.length === 0, checks, blockers });
}
