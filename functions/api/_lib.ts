/**
 * 서버 쪽 공통 조각 — Cloudflare Pages Functions.
 *
 * 이 폴더는 Next.js 와 무관하다. Cloudflare Pages 가 저장소 뿌리의 functions/
 * 를 그대로 가져가 Worker 로 돌린다. 정적 파일(out/)과 같은 주소에서 함께
 * 서비스되므로 브라우저는 /api/... 로 부르기만 하면 된다.
 *
 * 저장소는 D1(SQLite). 바인딩 이름은 DB 다 — Pages 설정에서 붙인다.
 * 바인딩이 없으면 모든 API 가 "서버 없음"을 돌려주고, 화면은 예전처럼
 * 브라우저 저장소만으로 돈다. 그래서 D1 을 붙이기 전에 배포해도 깨지지 않는다.
 *
 * 밖에서 들어온 값은 전부 믿지 않는다. 비밀번호는 PBKDF2 로 늘려 해시만 남기고
 * 세션 토큰도 해시만 저장한다 — DB 를 통째로 들여다봐도 로그인할 수 없다.
 */

// ── D1 자료형 ───────────────────────────────────────────────
// @cloudflare/workers-types 를 받지 않고 쓰는 만큼만 직접 적는다.
export interface D1Result<T> {
  results: T[];
}
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  run(): Promise<unknown>;
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown>;
}

export interface Env {
  /** Pages 설정에서 붙이는 D1 바인딩. 없으면 서버 저장이 꺼진 것이다 */
  DB?: D1Database;
  /** 관리자로 들어올 수 있는 아이디. 쉼표로 나눈다 */
  ADMIN_IDS?: string;
}

export interface Ctx {
  request: Request;
  env: Env;
}

// ── 응답 ───────────────────────────────────────────────────
export function json(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // 사용자별 응답이므로 어디에도 캐시되면 안 된다
      "cache-control": "no-store",
      ...headers,
    },
  });
}

/** D1 이 안 붙은 배포 — 화면은 이 응답을 "서버 없음"으로 보고 혼자 돈다 */
export function noDb() {
  return json({ ok: false, db: false, error: "서버 저장소가 연결되지 않았습니다." }, 503);
}

// ── 스키마 ─────────────────────────────────────────────────
/**
 * 표를 만들어 둔다.
 *
 * 마이그레이션 도구를 따로 돌리게 하면 "DB 는 만들었는데 표가 없어서 안 된다"
 * 는 상태가 생긴다. 어차피 CREATE TABLE IF NOT EXISTS 는 몇 밀리초이므로
 * 첫 요청에서 한 번 돌리고 그 뒤로는 건너뛴다.
 */
let schemaReady = false;

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS accounts (
     email TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     pw TEXT NOT NULL,
     role TEXT NOT NULL DEFAULT 'learner',
     target_grade TEXT,
     exam_date TEXT,
     created_at TEXT NOT NULL,
     last_active_at TEXT
   )`,
  `CREATE TABLE IF NOT EXISTS sessions (
     token TEXT PRIMARY KEY,
     email TEXT NOT NULL,
     created_at TEXT NOT NULL,
     expires_at TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS sessions_email ON sessions (email)`,
  // 화면마다 모양이 다른 덩어리는 ns 로 나눠 통째로 담는다
  `CREATE TABLE IF NOT EXISTS user_state (
     email TEXT NOT NULL,
     ns TEXT NOT NULL,
     json TEXT NOT NULL,
     updated_at TEXT NOT NULL,
     PRIMARY KEY (email, ns)
   )`,
  // 관리 화면이 한 줄씩 세야 하므로 결과는 따로 둔다
  `CREATE TABLE IF NOT EXISTS exam_results (
     id TEXT PRIMARY KEY,
     email TEXT NOT NULL,
     created_at TEXT NOT NULL,
     grade TEXT,
     target_grade TEXT,
     json TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS exam_results_email ON exam_results (email, created_at)`,
  `CREATE TABLE IF NOT EXISTS global_sessions (
     id TEXT PRIMARY KEY,
     email TEXT NOT NULL,
     scenario_id TEXT NOT NULL,
     country TEXT,
     kind TEXT,
     lang TEXT,
     started_at TEXT NOT NULL,
     done_at TEXT,
     json TEXT NOT NULL
   )`,
  `CREATE INDEX IF NOT EXISTS global_sessions_email ON global_sessions (email, started_at)`,
  `CREATE TABLE IF NOT EXISTS ai_usage (
     id TEXT PRIMARY KEY,
     email TEXT NOT NULL,
     at TEXT NOT NULL,
     kind TEXT,
     provider TEXT,
     model TEXT,
     input_tokens INTEGER NOT NULL DEFAULT 0,
     output_tokens INTEGER NOT NULL DEFAULT 0,
     reasoning_tokens INTEGER NOT NULL DEFAULT 0
   )`,
  `CREATE INDEX IF NOT EXISTS ai_usage_email ON ai_usage (email, at)`,
];

export async function ensureSchema(db: D1Database) {
  if (schemaReady) return;
  await db.batch(SCHEMA.map((q) => db.prepare(q)));
  schemaReady = true;
}

// ── 해시 ───────────────────────────────────────────────────
function hex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256(s: string): Promise<string> {
  return hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

const PBKDF2_ROUNDS = 100_000;

/**
 * 비밀번호 해시.
 *
 * 브라우저에만 있던 시절에는 SHA-256 한 번이면 됐다. 이제는 값이 서버에
 * 쌓이므로 한 번 새어도 원문을 되찾기 어렵게 늘려 둔다.
 */
export async function hashPassword(password: string, saltHex?: string): Promise<string> {
  const salt = saltHex
    ? Uint8Array.from(saltHex.match(/../g)!.map((h) => parseInt(h, 16)))
    : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: PBKDF2_ROUNDS },
    key,
    256,
  );
  return `pbkdf2$${PBKDF2_ROUNDS}$${hex(salt.buffer as ArrayBuffer)}$${hex(bits)}`;
}

/** 길이가 같은 문자열을 끝까지 비교한다 — 어디서 틀렸는지 시간으로 새지 않게 */
function sameSecret(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const again = await hashPassword(password, parts[2]);
  return sameSecret(again, stored);
}

// ── 세션 ───────────────────────────────────────────────────
const COOKIE = "sl_session";
const DAYS = 60;

export function newToken(): string {
  return hex(crypto.getRandomValues(new Uint8Array(32)).buffer as ArrayBuffer);
}

export function cookieHeader(token: string | null): Record<string, string> {
  const base = `${COOKIE}=${token ?? ""}; Path=/; HttpOnly; Secure; SameSite=Lax`;
  return { "set-cookie": token ? `${base}; Max-Age=${DAYS * 86400}` : `${base}; Max-Age=0` };
}

function cookieValue(request: Request): string | null {
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === COOKIE) return v.join("=") || null;
  }
  return null;
}

export interface Who {
  email: string;
  role: string;
}

/** 쿠키가 가리키는 사람. 쿠키 값 자체는 DB 에 없고 해시만 있다 */
export async function whoAmI(ctx: Ctx): Promise<Who | null> {
  const db = ctx.env.DB;
  if (!db) return null;
  const token = cookieValue(ctx.request);
  if (!token) return null;
  const row = await db
    .prepare(
      `SELECT s.email AS email, a.role AS role FROM sessions s
         JOIN accounts a ON a.email = s.email
        WHERE s.token = ?1 AND s.expires_at > ?2`,
    )
    .bind(await sha256(token), new Date().toISOString())
    .first<{ email: string; role: string }>();
  return row ? { email: row.email, role: row.role } : null;
}

export async function startSession(db: D1Database, email: string): Promise<string> {
  const token = newToken();
  const now = new Date();
  const until = new Date(now.getTime() + DAYS * 86400_000);
  await db
    .prepare(`INSERT INTO sessions (token, email, created_at, expires_at) VALUES (?1, ?2, ?3, ?4)`)
    .bind(await sha256(token), email, now.toISOString(), until.toISOString())
    .run();
  return token;
}

export async function endSession(ctx: Ctx) {
  const db = ctx.env.DB;
  const token = cookieValue(ctx.request);
  if (!db || !token) return;
  await db.prepare(`DELETE FROM sessions WHERE token = ?1`).bind(await sha256(token)).run();
}

// ── 관리자 ─────────────────────────────────────────────────
/**
 * 관리자로 들어올 수 있는 아이디.
 *
 * 비밀번호는 아이디와 같은 값이다 — 시연용 통로이고, 이 사실은 README 에도
 * 적어 두었다. 운영으로 쓰려면 Pages 설정의 ADMIN_IDS 를 바꾸고
 * 관리 화면에서 비밀번호를 따로 걸어야 한다.
 */
export function adminIds(env: Env): string[] {
  // lib/brand.ts 의 adminId 와 lib/account.ts 의 ADMIN_ALIASES 를 합친 값이다.
  // 한쪽만 고치면 "브라우저에서는 관리자인데 서버에서는 아닌" 상태가 된다
  return (env.ADMIN_IDS ?? "admin123,dku,hanwha,dankook")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function clean(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

// ── 한 사람의 기록 전부 ─────────────────────────────────────
export interface AccountRow {
  email: string;
  name: string;
  role: string;
  target_grade: string | null;
  exam_date: string | null;
  created_at: string;
  last_active_at: string | null;
}

/** 화면이 쓰는 모양으로 바꾼다 — 비밀번호는 절대 싣지 않는다 */
export function toAccount(r: AccountRow) {
  return {
    email: r.email,
    name: r.name,
    role: r.role,
    targetGrade: r.target_grade ?? undefined,
    examDate: r.exam_date ?? undefined,
    createdAt: r.created_at,
    lastActiveAt: r.last_active_at ?? undefined,
  };
}

/**
 * 로그인한 사람의 기록을 한 번에 내려 준다.
 *
 * 화면을 옮길 때마다 따로 받아오면 기기를 바꿨을 때 어떤 것은 따라오고
 * 어떤 것은 안 따라오는 상태가 생긴다. 로그인 한 번에 전부 받아
 * 브라우저 저장소를 통째로 채우는 편이 설명하기도 쉽다.
 */
export async function loadBundle(db: D1Database, email: string) {
  const [acc, state, results, globals, usage] = await Promise.all([
    db.prepare(`SELECT * FROM accounts WHERE email = ?1`).bind(email).first<AccountRow>(),
    db.prepare(`SELECT ns, json FROM user_state WHERE email = ?1`).bind(email).all<{ ns: string; json: string }>(),
    db
      .prepare(`SELECT json FROM exam_results WHERE email = ?1 ORDER BY created_at DESC LIMIT 20`)
      .bind(email)
      .all<{ json: string }>(),
    db
      .prepare(`SELECT json FROM global_sessions WHERE email = ?1 ORDER BY started_at DESC LIMIT 40`)
      .bind(email)
      .all<{ json: string }>(),
    db
      .prepare(
        `SELECT at, kind, provider, model, input_tokens, output_tokens, reasoning_tokens
           FROM ai_usage WHERE email = ?1 ORDER BY at DESC LIMIT 300`,
      )
      .bind(email)
      .all<Record<string, unknown>>(),
  ]);
  if (!acc) return null;

  const parse = (rows: { json: string }[]) =>
    rows
      .map((r) => {
        try {
          return JSON.parse(r.json) as unknown;
        } catch {
          return null;
        }
      })
      .filter((v) => v !== null);

  const ns: Record<string, unknown> = {};
  for (const row of state.results) {
    try {
      ns[row.ns] = JSON.parse(row.json);
    } catch {
      /* 한 칸이 깨져도 나머지는 내려 준다 */
    }
  }

  return {
    account: toAccount(acc),
    state: ns,
    // 저장할 때 최신이 앞이었으므로 순서를 그대로 쓴다
    results: parse(results.results),
    globalSessions: parse(globals.results).reverse(),
    usage: usage.results.map((u) => ({
      at: u.at,
      kind: u.kind,
      provider: u.provider,
      model: u.model,
      inputTokens: Number(u.input_tokens ?? 0),
      outputTokens: Number(u.output_tokens ?? 0),
      reasoningTokens: Number(u.reasoning_tokens ?? 0),
    })).reverse(),
  };
}

export async function touch(db: D1Database, email: string) {
  await db
    .prepare(`UPDATE accounts SET last_active_at = ?2 WHERE email = ?1`)
    .bind(email, new Date().toISOString())
    .run();
}
