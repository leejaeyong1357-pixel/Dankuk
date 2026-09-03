import { timingSafeEqual } from "node:crypto";

/**
 * 상수 시간 문자열 비교 — 인증 코드·토큰 검증에 쓴다.
 *
 * 세션 모듈과 따로 두는 이유는 그쪽이 next/headers(쿠키)를 끌고 오기 때문이다.
 * 비교 자체는 요청 맥락이 필요 없으므로 어디서든 부를 수 있어야 한다.
 */
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
