import { NextResponse } from "next/server";
import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { exposesCode, getMailer } from "@/lib/auth/mailer";
import { pruneExpired } from "@/lib/auth/session";

export const runtime = "nodejs";

const CODE_TTL_MIN = 10;
/** 같은 주소로 1분 안에 여러 번 요청하지 못하게 한다 */
const RESEND_COOLDOWN_MS = 60_000;

export async function POST(req: Request) {
  try {
    const { email } = (await req.json()) as { email?: string };
    const normalized = (email ?? "").trim().toLowerCase();

    if (!/^[^@\s]+@dankook\.ac\.kr$/.test(normalized)) {
      return NextResponse.json(
        { error: "@dankook.ac.kr 주소만 사용할 수 있습니다." }, { status: 400 },
      );
    }

    await pruneExpired();

    const recent = await prisma.verificationCode.findFirst({
      where: { email: normalized, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });
    if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
      const wait = Math.ceil(
        (RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000,
      );
      return NextResponse.json(
        { error: `${wait}초 후에 다시 요청해 주세요.` }, { status: 429 },
      );
    }

    // 이전 코드는 무효화한다
    await prisma.verificationCode.updateMany({
      where: { email: normalized, consumedAt: null },
      data: { consumedAt: new Date() },
    });

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    await prisma.verificationCode.create({
      data: {
        email: normalized,
        codeHash: createHash("sha256").update(code).digest("hex"),
        expiresAt: new Date(Date.now() + CODE_TTL_MIN * 60_000),
      },
    });

    await getMailer().sendCode(normalized, code);

    return NextResponse.json({
      sent: true,
      expiresInMinutes: CODE_TTL_MIN,
      // SMTP 미설정 개발 환경에서만 코드를 내려준다
      devCode: exposesCode() ? code : undefined,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "요청 실패" }, { status: 500 },
    );
  }
}
