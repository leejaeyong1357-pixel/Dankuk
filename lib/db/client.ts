import { PrismaClient } from "@prisma/client";

/**
 * Prisma 클라이언트 싱글턴.
 * 개발 중 HMR 로 커넥션이 계속 늘어나지 않도록 전역에 캐시한다.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"] });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

/** DATABASE_URL 이 없으면 DB 없이 동작한다 (localStorage 폴백) */
export const dbEnabled = Boolean(process.env.DATABASE_URL);
