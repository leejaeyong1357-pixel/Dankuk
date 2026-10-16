/**
 * 가입 · 로그인 · 로그아웃.
 *
 * 로그인에 성공하면 그 사람의 기록을 통째로 함께 내려 준다. 기기를 바꿔
 * 처음 들어와도 로그인 한 번으로 학습 이력이 그대로 따라오게 하려는 것이다.
 */
import {
  adminIds,
  clean,
  cookieHeader,
  endSession,
  ensureSchema,
  hashPassword,
  json,
  loadBundle,
  noDb,
  readJson,
  startSession,
  verifyPassword,
  type AccountRow,
  type Ctx,
  type D1Database,
} from "./_lib";

interface Body {
  action?: string;
  email?: string;
  name?: string;
  password?: string;
}

/** 등록 여부까지 알려 주지 않는다 */
const WRONG = { ok: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." };

export async function onRequestPost(ctx: Ctx) {
  const db = ctx.env.DB;
  if (!db) return noDb();
  await ensureSchema(db);

  const body = await readJson<Body>(ctx.request);
  if (!body) return json({ ok: false, error: "요청을 읽지 못했습니다." }, 400);

  if (body.action === "logout") {
    await endSession(ctx);
    return json({ ok: true }, 200, cookieHeader(null));
  }

  const email = clean(body.email, 160).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";
  if (!email || !password) return json(WRONG, 401);

  if (body.action === "register") return register(db, email, clean(body.name, 60), password);
  return login(ctx, db, email, password);
}

async function register(db: D1Database, email: string, name: string, password: string) {
  if (!name) return json({ ok: false, error: "이름을 입력해 주세요." }, 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ ok: false, error: "이메일 형식이 올바르지 않습니다." }, 400);
  }
  if (password.length < 6) {
    return json({ ok: false, error: "비밀번호는 6자 이상이어야 합니다." }, 400);
  }
  const exists = await db.prepare(`SELECT email FROM accounts WHERE email = ?1`).bind(email).first();
  if (exists) return json({ ok: false, error: "이미 등록된 이메일입니다. 로그인해 주세요." }, 409);

  await db
    .prepare(
      `INSERT INTO accounts (email, name, pw, role, created_at) VALUES (?1, ?2, ?3, 'learner', ?4)`,
    )
    .bind(email, name, await hashPassword(password), new Date().toISOString())
    .run();

  const token = await startSession(db, email);
  const bundle = await loadBundle(db, email);
  return json({ ok: true, ...bundle }, 200, cookieHeader(token));
}

async function login(ctx: Ctx, db: D1Database, email: string, password: string) {
  // 관리자 통로 — 아이디와 같은 비밀번호로 들어온다
  if (adminIds(ctx.env).includes(email)) {
    if (password !== email) return json(WRONG, 401);
    await db
      .prepare(
        `INSERT INTO accounts (email, name, pw, role, created_at) VALUES (?1, ?1, '', 'admin', ?2)
           ON CONFLICT(email) DO UPDATE SET role = 'admin'`,
      )
      .bind(email, new Date().toISOString())
      .run();
  } else {
    const row = await db
      .prepare(`SELECT pw FROM accounts WHERE email = ?1`)
      .bind(email)
      .first<Pick<AccountRow, "email"> & { pw: string }>();
    if (!row) return json(WRONG, 401);
    if (!(await verifyPassword(password, row.pw))) return json(WRONG, 401);
  }

  const token = await startSession(db, email);
  const bundle = await loadBundle(db, email);
  if (!bundle) return json(WRONG, 401);
  return json({ ok: true, ...bundle }, 200, cookieHeader(token));
}
