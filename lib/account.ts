"use client";

/**
 * 계정 — 등록 / 로그인 / 로그인 유지.
 *
 * 서버(D1)가 붙어 있으면 그쪽이 정본이다. 로그인하면 그 사람의 기록을 통째로
 * 받아 이 브라우저를 맞추므로, 회사 PC 에서 하던 것이 집 PC 에서도 이어진다.
 *
 * 서버가 없는 배포에서는 예전처럼 이 브라우저 안에서만 돈다. 두 경우를 화면이
 * 구분하지 않도록 아래 함수들이 차이를 흡수한다 — 서버가 답하지 않으면
 * 곧바로 이 기기의 저장소로 내려간다.
 *
 * 비밀번호는 어느 쪽에서도 원문을 두지 않는다. 이 기기에는 SHA-256 해시,
 * 서버에는 PBKDF2 해시만 남는다.
 */
import { BRAND } from "./brand";
import {
  apiPost,
  fetchMe,
  flushNow,
  hydrate,
  mirrorAccount,
  serverOn,
  type Bundle,
  type RemoteAccount,
} from "./remote";
import type { TargetGrade, UserProfile } from "./types";

const ACCOUNTS_KEY = "dku-opic:accounts";
const SESSION_KEY = "dku-opic:session";

/**
 * 언제나 들어갈 수 있는 관리자 계정.
 *
 * 시연 도중 브라우저 저장소가 비어도(다른 기기, 시크릿 창, 새 배포 주소)
 * 이 계정으로는 항상 로그인된다. 계정 목록에 없으면 로그인할 때 만들어 준다.
 *
 * 정적 사이트라 이 아이디와 비밀번호는 코드에 그대로 들어 있고 누구나 읽을 수
 * 있다. 시연용 통로일 뿐이므로 개인 정보를 이 계정에 넣지 말 것.
 */
export const ADMIN_ID = BRAND.adminId;
export const ADMIN_PASSWORD = BRAND.adminId;

/**
 * 쓰던 아이디가 갑자기 막히지 않도록 예전 아이디도 계속 받는다.
 * 비밀번호는 login() 에서 아이디와 같은 값으로 본다 — dankook / dankook 으로 들어간다.
 */
const ADMIN_ALIASES = new Set([BRAND.adminId, "hanwha", "dku", "dankook"]);

/**
 * 목표 등급과 시험 일정을 아직 안 정한 사람에게 넣어 주는 기본값.
 *
 * 로그인하면 설정 화면을 거치지 않고 바로 학습 화면으로 들어간다.
 * 값은 마이페이지에서 언제든 바꿀 수 있다.
 */
const DEFAULT_TARGET: TargetGrade = "AL";
const DEFAULT_EXAM_IN_DAYS = 30;

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
  /** 서버가 알려 준 역할. 서버가 없으면 비어 있다 */
  role?: string;
}

// ── 서버 ───────────────────────────────────────────────────
/**
 * 서버가 내려 준 계정을 이 기기 목록에도 넣어 둔다 — 화면은 이쪽을 읽는다.
 *
 * 서버에 아직 없는 칸은 이 기기 값을 지우지 않고 그대로 둔다. 방금 정한 목표
 * 등급이 아직 올라가지 못한 순간에 서버의 빈 값이 덮어쓰는 일을 막는다.
 */
function cacheAccount(r: RemoteAccount): Account {
  const prev = readAll().find((a) => a.email === r.email);
  const account: Account = {
    email: r.email,
    name: r.name,
    passwordHash: "",
    createdAt: r.createdAt,
    targetGrade: (r.targetGrade as TargetGrade | undefined) ?? prev?.targetGrade,
    examDate: r.examDate ?? prev?.examDate,
    lastActiveAt: r.lastActiveAt ?? prev?.lastActiveAt,
    role: r.role,
  };
  const list = readAll().filter((a) => a.email !== account.email);
  writeAll([...list, account]);
  return account;
}

/** 서버 응답을 받아 이 기기를 통째로 맞춘다 */
function applyBundle(b: Bundle, remember: boolean): Account {
  hydrate(b);
  const account = cacheAccount(b.account);
  setSession(account.email, remember);
  return account;
}

interface AuthReply {
  ok?: boolean;
  error?: string;
  account?: RemoteAccount;
  state?: Record<string, unknown>;
  results?: unknown[];
  globalSessions?: unknown[];
  usage?: unknown[];
}

/**
 * 쿠키가 남아 있으면 서버에서 다시 받아 온다.
 *
 * 화면이 열릴 때 한 번 부른다. 다른 기기에서 공부한 것이 여기에도 보이게 하는
 * 자리이며, 서버가 없으면 아무 일도 하지 않는다.
 */
export async function bootstrap(): Promise<Account | null> {
  if (!(await serverOn())) return null;
  const me = await fetchMe();
  if (!me) return null;
  // 쿠키로 들어온 것이므로 "로그인 유지"는 이미 켜져 있던 셈이다
  return applyBundle(me, true);
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

  if (await serverOn()) {
    const r = await apiPost<AuthReply>("/api/auth", {
      action: "register",
      email,
      name,
      password: p.password,
    });
    if (r?.ok && r.account) return { ok: true, account: applyBundle(r as Bundle, true) };
    if (r?.error) return { ok: false, error: r.error };
    // 서버가 답하지 않으면 이 기기에라도 만들어 준다
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
  setSession(email, true);
  return { ok: true, account };
}

export async function login(
  email: string,
  password: string,
  /** "로그인 상태 유지" — 끄면 탭을 닫을 때 로그인이 풀린다 */
  remember = true,
): Promise<{ ok: true; account: Account } | { ok: false; error: string }> {
  const id = email.trim().toLowerCase();
  // 등록 여부를 알려 주지 않는다
  const wrong = { ok: false as const, error: "아이디 또는 비밀번호가 올바르지 않습니다." };

  if (await serverOn()) {
    const r = await apiPost<AuthReply>("/api/auth", { action: "login", email: id, password });
    // 목표 등급을 아직 안 정한 사람(관리자 포함)에게 기본값을 넣어 준다.
    // 그러지 않으면 로그인할 때마다 설정 화면으로 되돌아간다
    if (r?.ok && r.account) {
      const account = ensureStarted(applyBundle(r as Bundle, remember));
      // 기본값으로 채운 목표 등급을 먼저 올린다 — 다음 화면이 서버를 다시 읽는다
      await flushNow();
      return { ok: true, account };
    }
    // 서버가 "틀렸다" 고 한 것과 서버에 닿지 못한 것은 다르다.
    // 닿지 못했을 때만 이 기기의 계정으로 내려간다
    if (r) return wrong;
  }

  if (ADMIN_ALIASES.has(id)) {
    // 어느 아이디로 들어오든 비밀번호는 그 아이디와 같은 값이다
    if (password !== id) return wrong;
    setSession(ADMIN_ID, remember);
    return { ok: true, account: ensureAdmin() };
  }

  const account = readAll().find((a) => a.email === id);
  if (!account) return wrong;
  if (account.passwordHash !== (await hashPassword(password))) return wrong;
  setSession(id, remember);
  return { ok: true, account: ensureStarted(account) };
}

/**
 * 목표 등급·시험 일정이 비어 있으면 기본값을 넣어 준다.
 *
 * 로그인한 사람을 설정 화면에 다시 세우지 않기 위해서다.
 * 이미 정해 둔 값이 있으면 건드리지 않는다.
 */
export function ensureStarted(a: Account): Account {
  if (a.targetGrade && a.examDate) return a;
  const patch = {
    targetGrade: a.targetGrade ?? DEFAULT_TARGET,
    examDate: a.examDate ?? plusDays(DEFAULT_EXAM_IN_DAYS),
  };
  updateAccount(a.email, patch);
  return { ...a, ...patch };
}

/** 지금 로그인한 사람이 관리자인가 */
export function isAdmin(a: Account | null = currentAccount()): boolean {
  return Boolean(a && (a.role === "admin" || ADMIN_ALIASES.has(a.email)));
}

/** 관리자 계정을 이 기기에 만들어 둔다 (이미 있으면 그대로 쓴다) */
export function ensureAdmin(): Account {
  const list = readAll();
  const found = list.find((a) => a.email === ADMIN_ID);
  if (found) return found;
  const account: Account = {
    email: ADMIN_ID,
    // 화면에 "한화엔진님" 으로 보인다
    name: BRAND.orgShort,
    // 비밀번호는 위 상수로 따로 확인하므로 해시를 쓰지 않는다
    passwordHash: "",
    createdAt: new Date().toISOString(),
    targetGrade: DEFAULT_TARGET,
    examDate: plusDays(DEFAULT_EXAM_IN_DAYS),
  };
  writeAll([...list, account]);
  return account;
}

function plusDays(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// ── 로그인 유지 ────────────────────────────────────────────
/**
 * 로그인 표시를 어디에 남길지 고른다.
 *
 * "로그인 상태 유지"를 켜면 localStorage 에 남아 브라우저를 닫았다 열어도
 * 로그인된 채다. 끄면 sessionStorage 에만 남아 탭을 닫으면 풀린다.
 * 실습실처럼 여러 사람이 쓰는 기기를 위해 끌 수 있어야 한다.
 */
function setSession(email: string, remember: boolean) {
  const keep = remember ? window.localStorage : window.sessionStorage;
  const drop = remember ? window.sessionStorage : window.localStorage;
  drop.removeItem(SESSION_KEY);
  keep.setItem(SESSION_KEY, email);
}

function sessionEmail(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(SESSION_KEY) ?? window.localStorage.getItem(SESSION_KEY);
}

export function logout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
  // 서버 쪽 세션도 끊는다. 답을 기다릴 필요는 없다
  void apiPost("/api/auth", { action: "logout" });
}

/** 지금 로그인한 계정 */
export function currentAccount(): Account | null {
  const email = sessionEmail();
  if (!email) return null;
  return readAll().find((a) => a.email === email) ?? null;
}

export function updateAccount(email: string, patch: Partial<Account>) {
  const list = readAll();
  const i = list.findIndex((a) => a.email === email);
  if (i < 0) return;
  list[i] = { ...list[i], ...patch };
  writeAll(list);

  // 이름·목표 등급·시험일은 계정 자체에 붙는 값이라 서버에도 올린다
  if (patch.name || patch.targetGrade || patch.examDate) {
    mirrorAccount({
      name: patch.name,
      targetGrade: patch.targetGrade,
      examDate: patch.examDate,
    });
  }
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

/**
 * 관리 화면에서 등록을 지운다.
 *
 * 서버가 있으면 그 사람의 학습 기록까지 함께 지워진다 — 되돌릴 수 없다.
 */
export async function removeAccount(email: string): Promise<string | null> {
  if (await serverOn()) {
    const r = await apiPost<{ ok?: boolean; error?: string }>("/api/admin", {
      action: "delete",
      email,
    });
    if (r && !r.ok) return r.error ?? "지우지 못했습니다.";
  }
  writeAll(readAll().filter((a) => a.email !== email));
  if (sessionEmail() === email) logout();
  return null;
}

/**
 * 관리자가 학습자 계정을 만든다.
 *
 * 사내에서 쓰는 서비스라 직접 가입하지 않는 사람이 많다.
 * 비밀번호는 여기서도 해시만 저장한다 — 관리자도 원문을 볼 수 없다.
 */
export async function adminCreateAccount(input: {
  email: string;
  name: string;
  password: string;
}): Promise<{ ok: true; account: Account } | { ok: false; error: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email) return { ok: false, error: "아이디를 입력해 주세요." };
  if (!input.name.trim()) return { ok: false, error: "이름을 입력해 주세요." };
  if (input.password.length < 6) return { ok: false, error: "비밀번호는 6자 이상이어야 합니다." };
  if (await serverOn()) {
    const r = await apiPost<{ ok?: boolean; error?: string }>("/api/admin", {
      action: "create",
      email,
      name: input.name.trim(),
      password: input.password,
    });
    if (r?.ok) {
      return {
        ok: true,
        account: {
          email,
          name: input.name.trim(),
          passwordHash: "",
          createdAt: new Date().toISOString(),
        },
      };
    }
    if (r?.error) return { ok: false, error: r.error };
  }

  if (readAll().some((a) => a.email === email)) {
    return { ok: false, error: "이미 있는 아이디입니다." };
  }
  const account: Account = {
    email,
    name: input.name.trim(),
    passwordHash: await hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };
  writeAll([...readAll(), account]);
  return { ok: true, account };
}

/** 관리자가 비밀번호를 바꾼다 */
export async function adminSetPassword(email: string, password: string): Promise<string | null> {
  if (password.length < 6) return "비밀번호는 6자 이상이어야 합니다.";
  if (await serverOn()) {
    const r = await apiPost<{ ok?: boolean; error?: string }>("/api/admin", {
      action: "password",
      email,
      password,
    });
    if (r?.ok) return null;
    if (r?.error) return r.error;
  }
  updateAccount(email, { passwordHash: await hashPassword(password) });
  return null;
}
