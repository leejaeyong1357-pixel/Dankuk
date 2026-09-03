import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "../db/client";

export { safeEqual } from "./compare";

/**
 * 세션 기반 인증.
 *
 * 이전에는 쿼리스트링의 email 을 그대로 신뢰해 남의 기록을 조회할 수 있었다.
 * 이제 모든 사용자 데이터 접근은 httpOnly 쿠키의 세션 토큰으로만 식별한다.
 */
export const SESSION_COOKIE = "dku_opic_session";
const SESSION_DAYS = 30;

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: string, userAgent?: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);
  await prisma.session.create({
    data: { userId, tokenHash: hashToken(token), userAgent, expiresAt },
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
  return token;
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  targetGrade: string;
  examDate: string;
}

/** 현재 세션의 사용자. 없거나 만료면 null */
export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    targetGrade: session.user.targetGrade,
    examDate: session.user.examDate,
  };
}

export async function revokeSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session
      .updateMany({ where: { tokenHash: hashToken(token) }, data: { revokedAt: new Date() } })
      .catch(() => undefined);
  }
  jar.delete(SESSION_COOKIE);
}

/** 만료·폐기된 세션과 인증 코드를 치운다 */
export async function pruneExpired() {
  const now = new Date();
  await Promise.all([
    prisma.session.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.verificationCode.deleteMany({ where: { expiresAt: { lt: now } } }),
  ]).catch(() => undefined);
}
