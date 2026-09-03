/**
 * 시연용 고정 계정.
 *
 * 학교 메일 릴레이가 열리기 전에도 시연과 파일럿을 돌릴 수 있게,
 * 지정한 주소 몇 개만 메일 발송 없이 고정 코드로 로그인시킨다.
 *
 *   DEMO_ACCOUNTS="dankuk1@dankook.ac.kr:481902,dankuk2@dankook.ac.kr:735164"
 *
 * 이 목록에 있는 주소만 예외다. 나머지는 평소대로 메일 인증을 거친다.
 * 고정 코드는 바뀌지 않으므로 흘러 나가면 그대로 로그인 통로가 된다.
 * SMTP 가 열리면 이 변수를 지우는 것이 정상 상태이며,
 * /api/health 가 켜져 있는 동안 계속 알려 준다.
 */
import { safeEqual } from "./compare";

export interface DemoAccount {
  email: string;
  code: string;
}

/** 시연 계정으로 쓰기에 너무 뻔한 코드는 받지 않는다 */
const WEAK = new Set([
  "000000", "111111", "123456", "654321", "121212", "999999", "012345",
]);

let cache: DemoAccount[] | null = null;

export function demoAccounts(): DemoAccount[] {
  if (cache) return cache;

  const raw = process.env.DEMO_ACCOUNTS?.trim();
  if (!raw) return (cache = []);

  const out: DemoAccount[] = [];
  for (const entry of raw.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;

    const at = trimmed.lastIndexOf(":");
    const email = at < 0 ? "" : trimmed.slice(0, at).trim().toLowerCase();
    const code = at < 0 ? "" : trimmed.slice(at + 1).trim();

    if (!email || !code) {
      console.error(`[demo] 형식이 틀렸습니다 (이메일:코드): ${trimmed}`);
      continue;
    }
    if (!/^[^@\s]+@dankook\.ac\.kr$/.test(email)) {
      console.error(`[demo] @dankook.ac.kr 주소가 아닙니다: ${email}`);
      continue;
    }
    if (code.length < 6 || WEAK.has(code)) {
      console.error(`[demo] 코드가 너무 약합니다 (6자 이상, 뻔한 숫자 금지): ${email}`);
      continue;
    }
    out.push({ email, code });
  }

  if (out.length) {
    console.warn(
      `[demo] 시연 계정 ${out.length}개가 열려 있습니다 (${out.map((a) => a.email).join(", ")}). ` +
        "SMTP 를 붙인 뒤에는 DEMO_ACCOUNTS 를 지우세요.",
    );
  }
  return (cache = out);
}

export function isDemoAccount(email: string): boolean {
  return demoAccounts().some((a) => a.email === email);
}

/** 고정 코드 검증. 길이가 달라도 상수 시간 비교를 유지한다. */
export function demoCodeMatches(email: string, code: string): boolean {
  const account = demoAccounts().find((a) => a.email === email);
  if (!account) return false;
  return safeEqual(account.code, code);
}
