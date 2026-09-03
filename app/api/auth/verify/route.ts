import { NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/db/client";
import { createSession, safeEqual } from "@/lib/auth/session";
import { demoCodeMatches, isDemoAccount } from "@/lib/auth/demo";
import { rateLimited, withinRate } from "@/lib/auth/guard";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string; code?: string;
      name?: string; targetGrade?: string; examDate?: string;
    };
    const email = (body.email ?? "").trim().toLowerCase();
    const code = (body.code ?? "").trim();

    // 시연 계정은 발급 기록이 없다. 고정 코드와 맞춰 보고 통과시킨다.
    // 코드가 바뀌지 않으므로 추측 공격을 막기 위해 시도 횟수를 따로 센다.
    const demo = isDemoAccount(email);
    if (demo) {
      if (!withinRate(`demo:${email}`, 10, 10 * 60_000)) return rateLimited();
      if (!demoCodeMatches(email, code)) {
        return NextResponse.json({ error: "코드가 올바르지 않습니다." }, { status: 400 });
      }
    }

    const record = demo
      ? null
      : await prisma.verificationCode.findFirst({
          where: { email, consumedAt: null },
          orderBy: { createdAt: "desc" },
        });
    if (!demo && !record) {
      return NextResponse.json({ error: "인증 코드를 먼저 요청해 주세요." }, { status: 400 });
    }
    if (record && record.expiresAt < new Date()) {
      return NextResponse.json({ error: "코드가 만료되었습니다. 다시 요청해 주세요." }, { status: 400 });
    }
    if (record && record.attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: "시도 횟수를 초과했습니다. 코드를 다시 요청해 주세요." }, { status: 429 },
      );
    }

    if (record) {
      const ok = safeEqual(createHash("sha256").update(code).digest("hex"), record.codeHash);
      if (!ok) {
        await prisma.verificationCode.update({
          where: { id: record.id }, data: { attempts: { increment: 1 } },
        });
        return NextResponse.json(
          { error: `코드가 올바르지 않습니다. (${MAX_ATTEMPTS - record.attempts - 1}회 남음)` },
          { status: 400 },
        );
      }

      await prisma.verificationCode.update({
        where: { id: record.id }, data: { consumedAt: new Date() },
      });
    }

    // 최초 로그인이면 온보딩 정보로 계정을 만든다
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      if (!body.name || !body.targetGrade || !body.examDate) {
        return NextResponse.json({ verified: true, needsProfile: true });
      }
    }
    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: body.name!,
        targetGrade: body.targetGrade!,
        examDate: body.examDate!,
      },
      update: body.name
        ? { name: body.name, targetGrade: body.targetGrade!, examDate: body.examDate! }
        : {},
    });

    await createSession(user.id, req.headers.get("user-agent") ?? undefined);

    return NextResponse.json({
      verified: true,
      profile: {
        email: user.email, name: user.name,
        targetGrade: user.targetGrade, examDate: user.examDate,
        createdAt: user.createdAt.toISOString(),
      },
    });
  } catch (err) {
    console.error("[auth/verify]", err);
    return NextResponse.json({ error: "인증에 실패했습니다." }, { status: 500 });
  }
}
