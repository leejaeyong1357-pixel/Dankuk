"use client";

/**
 * 계정 — 등록 / 로그인 / 로그인 유지.
 *
 * 서버가 없는 정적 배포이므로 계정은 이 브라우저 안에만 존재한다.
 * 비밀번호는 원문을 저장하지 않고 SHA-256 해시만 남긴다.
 * 값이 이 기기 밖으로 나가는 일은 없다.
 *
 * 한 기기에 여러 사람이 등록할 수 있다 (학교 실습실 같은 환경).
 * 로그인한 사람이 누구인지는 세션 키가 가리킨다.
 */
import type { TargetGrade, UserProfile } from "./types";

const ACCOUNTS_KEY = "dku-opic:accounts";
const SESSION_KEY = "dku-opic:session";

export interface Account {
  /** 로그인 아이디 (이메일) */
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  /** 초기 설정을 마쳤는가 (목표 등급·시험 일정) */
  targetGrade?: TargetGrade;
  examDate?: string;
  /** 마지막 학습일 — 관리 화면에서 쓴다 */
  lastActiveAt?: string;
}

// ── 저장소 ─────────────────────────────────────────────────
function readAll(): Account[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as Account[]) : [];
  } catch {
    return [];
  }
}

function writeAll(list: Account[]) {
  window.localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

export function allAccounts(): Account[] {
  return readAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ── 비밀번호 ───────────────────────────────────────────────
/**
 * SHA-256 해시. 원문은 어디에도 남기지 않는다.
 *
 * 서버 인증이 아니므로 salt·stretching 까지 가지 않는다. 이 값이 하는 일은
 * 같은 기기를 쓰는 다른 사람이 남의 기록을 열지 못하게 막는 것뿐이다.
 */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── 등록 / 로그인 ──────────────────────────────────────────
export async function register(p: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: true; account: Account } | { ok: false; error: string }> {
  const email = p.email.trim().toLowerCase();
  const name = p.name.trim();

  if (!name) return { ok: false, error: "이름을 입력해 주세요." };
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, error: "이메일 형식이 올바르지 않습니다." };
  }
  if (p.password.length < 6) {
    return { ok: false, error: "비밀번호는 6자 이상이어야 합니다." };
  }

  const list = readAll();
  if (list.some((a) => a.email === email)) {
    return { ok: false, error: "이미 등록된 이메일입니다. 로그인해 주세요." };
  }

  const account: Account = {
    email,
    name,
    passwordHash: await hashPassword(p.password),
    createdAt: new Date().toISOString(),
  };
  writeAll([...list, account]);
  setSession(email);
  return { ok: true, account };
}

export async function login(
  email: string,
  password: string,
): Promise<{ ok: true; account: Account } | { ok: false; error: string }> {
  const id = email.trim().toLowerCase();
  const account = readAll().find((a) => a.email === id);
  // 등록 여부를 알려 주지 않는다
  const wrong = { ok: false as const, error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  if (!account) return wrong;
  if (account.passwordHash !== (await hashPassword(password))) return wrong;
  setSession(id);
  return { ok: true, account };
}

// ── 로그인 유지 ────────────────────────────────────────────
function setSession(email: string) {
  window.localStorage.setItem(SESSION_KEY, email);
}

export function logout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

/** 지금 로그인한 계정. 브라우저를 닫았다 열어도 유지된다. */
export function currentAccount(): Account | null {
  if (typeof window === "undefined") return null;
  const email = window.localStorage.getItem(SESSION_KEY);
  if (!email) return null;
  return readAll().find((a) => a.email === email) ?? null;
}

export function updateAccount(email: string, patch: Partial<Account>) {
  const list = readAll();
  const i = list.findIndex((a) => a.email === email);
  if (i < 0) return;
  list[i] = { ...list[i], ...patch };
  writeAll(list);
}

/** 화면에서 쓰는 프로필 형태로 바꾼다 */
export function toProfile(a: Account): UserProfile | null {
  if (!a.targetGrade || !a.examDate) return null;
  return {
    name: a.name,
    email: a.email,
    targetGrade: a.targetGrade,
    examDate: a.examDate,
    createdAt: a.createdAt,
  };
}

/** 학습할 때마다 마지막 활동 시각을 남긴다 (관리 화면용) */
export function touchActivity() {
  const a = currentAccount();
  if (a) updateAccount(a.email, { lastActiveAt: new Date().toISOString() });
}

/** 관리 화면에서 이 기기의 등록을 지운다 */
export function removeAccount(email: string) {
  writeAll(readAll().filter((a) => a.email !== email));
  if (typeof window !== "undefined" && window.localStorage.getItem(SESSION_KEY) === email) {
    logout();
  }
}
