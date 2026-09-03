import { NextResponse } from "next/server";
import { createHash, randomInt } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { exposesCode, getMailer, mailerUnavailable } from "@/lib/auth/mailer";
import { pruneExpired } from "@/lib/auth/session";
import { isDemoAccount } from "@/lib/auth/demo";

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

    // 시연 계정은 코드가 고정이라 발급도 발송도 하지 않는다.
    // 코드는 운영자가 직접 알려 주므로 응답에 싣지 않는다.
    if (isDemoAccount(normalized)) {
      return NextResponse.json({ sent: true, demo: true });
    }

    // 발송 수단이 없으면 코드를 만들지 않는다.
    // 만들어 봐야 학생에게 닿지 않고, 서버 로그에만 남은 코드는 위험만 남긴다.
    if (mailerUnavailable()) {
      console.error("[auth] SMTP_HOST 가 설정되지 않아 인증 코드를 보낼 수 없습니다.");
      return NextResponse.json(
        { error: "메일 발송이 구성되지 않았습니다. 관리자에게 문의해 주세요." },
        { status: 503 },
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
    console.error("[auth/request]", err);
    return NextResponse.json({ error: "요청에 실패했습니다." }, { status: 500 });
  }
}
