"use client";

/**
 * 서버 저장소와의 연결.
 *
 * 이 서비스는 오랫동안 브라우저 저장소만 썼다. 그래서 회사 PC 에서 가입한
 * 계정이 집 PC 에는 아예 없었고, 관리 화면도 "그 기기에 쌓인 것"밖에
 * 보여 주지 못했다. Cloudflare Pages Functions + D1 을 붙여 그 정본을
 * 서버로 옮긴다.
 *
 * 화면 코드는 거의 그대로 둔다. 저장소에 먼저 쓰고(그래야 화면이 멈추지 않는다)
 * 곧바로 서버로 올리는 방식이라, 각 저장 함수에 mirror() 한 줄만 붙으면 된다.
 * 읽기는 로그인할 때와 화면이 열릴 때 서버 값으로 저장소를 통째로 맞춘다.
 *
 * D1 이 안 붙은 배포에서는 /api/health 가 db:false 를 돌려주고, 아래 함수들이
 * 전부 조용히 아무것도 하지 않는다 — 예전처럼 이 기기 안에서만 돈다.
 */

// ── 저장소 키 ↔ 서버 이름 ───────────────────────────────────
/** 통째로 올리는 덩어리 */
const STATE_KEYS: Record<string, string> = {
  "dku-opic:profile": "profile",
  "dku-opic:progress": "progress",
  "dku-opic:question-history": "questionHistory",
  "dku-opic:vocab": "vocab",
  "sl-global:pref": "globalPref",
  "sl-global:saved": "globalSaved",
};

/** 줄 단위로 쌓아 관리 화면이 세어야 하는 것 */
export const RESULTS_KEY = "dku-opic:exam-results";
export const GLOBAL_SESSIONS_KEY = "sl-global:sessions";
export const USAGE_KEY = "opic.ai.usage.v1";

// ── 서버가 있는지 ──────────────────────────────────────────
let probe: Promise<boolean> | null = null;

/**
 * 서버에 D1 이 붙어 있는가. 한 번만 물어보고 답을 들고 있는다.
 *
 * 정적 배포라 /api 자체가 없을 수도 있다(404). 그때도 "없음"이다.
 */
export function serverOn(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (!probe) {
    probe = fetch("/api/health", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { db?: boolean } | null) => Boolean(j?.db))
      .catch(() => false);
  }
  return probe;
}

async function call<T>(path: string, init?: RequestInit): Promise<T | null> {
  if (!(await serverOn())) return null;
  try {
    const res = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    });
    // 401 은 "로그인 안 됨" 이라는 뜻이고 본문에 그렇게 적혀 온다
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export function apiGet<T>(path: string): Promise<T | null> {
  return call<T>(path);
}

export function apiPost<T>(path: string, body: unknown): Promise<T | null> {
  return call<T>(path, { method: "POST", body: JSON.stringify(body) });
}

// ── 올리기 ─────────────────────────────────────────────────
interface Payload {
  state?: { ns: string; data: unknown }[];
  results?: unknown[];
  globalSessions?: unknown[];
  usage?: unknown[];
  account?: { name?: string; targetGrade?: string; examDate?: string };
}

/** 모아 두었다가 한 번에 보낸다 — 한 화면에서 연달아 저장해도 요청은 하나다 */
let pending: Payload = {};
let timer: ReturnType<typeof setTimeout> | null = null;

function readKey(key: string): unknown {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function flush() {
  timer = null;
  const body = pending;
  pending = {};
  if (!Object.keys(body).length) return;
  await apiPost("/api/sync", body);
}

function schedule() {
  if (timer) return;
  timer = setTimeout(() => void flush(), 400);
}

/**
 * 저장소의 이 칸을 서버에도 올린다.
 *
 * 저장 함수에서 window.localStorage.setItem 바로 뒤에 부르면 된다.
 * 서버가 없으면 아무 일도 일어나지 않는다.
 */
export function mirror(key: string) {
  if (typeof window === "undefined") return;
  const value = readKey(key);
  if (value === null) return;

  if (key === RESULTS_KEY) pending.results = Array.isArray(value) ? value.slice(0, 20) : [];
  else if (key === GLOBAL_SESSIONS_KEY)
    pending.globalSessions = Array.isArray(value) ? value.slice(-40) : [];
  else if (key === USAGE_KEY) pending.usage = Array.isArray(value) ? value.slice(-40) : [];
  else {
    const ns = STATE_KEYS[key];
    if (!ns) return;
    const rest = (pending.state ?? []).filter((s) => s.ns !== ns);
    pending.state = [...rest, { ns, data: value }];
  }
  schedule();
}

/** 이름·목표 등급처럼 계정 자체에 붙는 값 */
export function mirrorAccount(patch: { name?: string; targetGrade?: string; examDate?: string }) {
  if (typeof window === "undefined") return;
  pending.account = { ...(pending.account ?? {}), ...patch };
  schedule();
}

/**
 * 모아 둔 것을 지금 보낸다.
 *
 * 보통은 400ms 뒤에 저절로 나가지만, 로그인 직후처럼 바로 다음 화면이
 * 서버 값을 다시 읽는 자리에서는 기다릴 수가 없다. 먼저 올리지 않으면
 * 방금 정한 값이 서버의 빈 값으로 덮인다.
 */
export async function flushNow(): Promise<void> {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  await flush();
}

/** 탭을 닫기 전에 남은 것을 보낸다 */
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => {
    if (timer) {
      clearTimeout(timer);
      void flush();
    }
  });
}

// ── 내려받기 ───────────────────────────────────────────────
export interface RemoteAccount {
  email: string;
  name: string;
  role: string;
  targetGrade?: string;
  examDate?: string;
  createdAt: string;
  lastActiveAt?: string;
}

export interface Bundle {
  account: RemoteAccount;
  state: Record<string, unknown>;
  results: unknown[];
  globalSessions: unknown[];
  usage: unknown[];
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장소가 가득 차도 이번 화면은 받아 온 값으로 돈다 */
  }
}

/**
 * 서버에서 받은 기록으로 이 브라우저를 맞춘다.
 *
 * 서버가 정본이므로 덮어쓴다. 모든 쓰기가 곧바로 서버로 올라가기 때문에
 * 여기서 잃을 것은 없다 — 올리지 못한 채 창을 닫은 마지막 몇 초뿐이다.
 */
export function hydrate(b: Bundle) {
  if (typeof window === "undefined") return;

  for (const [key, ns] of Object.entries(STATE_KEYS)) {
    if (ns in b.state && b.state[ns] !== null) write(key, b.state[ns]);
  }
  if (Array.isArray(b.results)) write(RESULTS_KEY, b.results);
  if (Array.isArray(b.globalSessions)) write(GLOBAL_SESSIONS_KEY, b.globalSessions);
  if (Array.isArray(b.usage)) write(USAGE_KEY, b.usage);
}

/** 서버가 기억하는 "지금 로그인한 사람". 쿠키가 없거나 만료면 null */
export async function fetchMe(): Promise<Bundle | null> {
  const r = await apiGet<{ ok?: boolean; signedIn?: boolean } & Bundle>("/api/me");
  return r?.ok && r.signedIn ? r : null;
}
