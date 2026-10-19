/**
 * 관리자 화면이 쓰는 자리.
 *
 * 누가 가입했는지, 어디까지 했는지, 결과가 어땠는지를 전 직원 기준으로 본다.
 * 브라우저 저장소만 쓰던 때에는 "그 기기에 쌓인 것"밖에 볼 수 없었다.
 *
 * 비밀번호는 여기서도 원문을 돌려주지 않는다. 관리자도 볼 수 없고, 새로
 * 걸어 주는 것만 할 수 있다. 쓸 수 있는 것은 role 이 admin 인 세션뿐이다.
 */
import {
  clean,
  ensureSchema,
  hashPassword,
  json,
  noDb,
  readJson,
  whoAmI,
  type Ctx,
  type D1Database,
} from "./_lib";

interface Row {
  email: string;
  name: string;
  role: string;
  target_grade: string | null;
  exam_date: string | null;
  created_at: string;
  last_active_at: string | null;
  exams: number;
  last_grade: string | null;
  last_exam_at: string | null;
  globals: number;
  globals_done: number;
  logins: number;
  last_login_at: string | null;
  visit_days: number;
  study_days: number;
  last_seen_at: string | null;
}

export async function onRequestGet(ctx: Ctx) {
  const db = ctx.env.DB;
  if (!db) return noDb();
  await ensureSchema(db);

  const who = await whoAmI(ctx);
  if (!who) return json({ ok: false, signedIn: false }, 401);
  if (who.role !== "admin") return json({ ok: false, error: "관리자만 볼 수 있습니다." }, 403);

  const [people, progress, usage] = await Promise.all([
    db
      .prepare(
        `SELECT a.email, a.name, a.role, a.target_grade, a.exam_date, a.created_at, a.last_active_at,
                (SELECT COUNT(*) FROM exam_results r WHERE r.email = a.email) AS exams,
                (SELECT r.grade FROM exam_results r WHERE r.email = a.email
                   ORDER BY r.created_at DESC LIMIT 1) AS last_grade,
                (SELECT r.created_at FROM exam_results r WHERE r.email = a.email
                   ORDER BY r.created_at DESC LIMIT 1) AS last_exam_at,
                (SELECT COUNT(*) FROM global_sessions g WHERE g.email = a.email) AS globals,
                (SELECT COUNT(*) FROM global_sessions g WHERE g.email = a.email
                   AND g.done_at IS NOT NULL) AS globals_done,
                (SELECT COUNT(*) FROM login_events l WHERE l.email = a.email) AS logins,
                (SELECT MAX(l.at) FROM login_events l WHERE l.email = a.email) AS last_login_at,
                (SELECT COUNT(*) FROM activity v WHERE v.email = a.email) AS visit_days,
                (SELECT COUNT(*) FROM activity v WHERE v.email = a.email AND v.writes > 0) AS study_days,
                (SELECT MAX(v.last_at) FROM activity v WHERE v.email = a.email) AS last_seen_at
           FROM accounts a
          ORDER BY a.created_at DESC`,
      )
      .all<Row>(),
    db
      .prepare(`SELECT email, json FROM user_state WHERE ns = 'progress'`)
      .all<{ email: string; json: string }>(),
    db
      .prepare(
        `SELECT email, COUNT(*) AS calls,
                SUM(input_tokens) AS input_tokens,
                SUM(output_tokens) AS output_tokens,
                SUM(reasoning_tokens) AS reasoning_tokens
           FROM ai_usage GROUP BY email`,
      )
      .all<Record<string, unknown>>(),
  ]);

  /** 학습한 문항 수 — progress 덩어리 안의 done 길이다 */
  const studied = new Map<string, number>();
  for (const p of progress.results) {
    try {
      const v = JSON.parse(p.json) as { done?: unknown[] };
      studied.set(p.email, Array.isArray(v.done) ? v.done.length : 0);
    } catch {
      /* 한 사람이 깨져도 나머지는 보여 준다 */
    }
  }

  const byEmail = new Map(usage.results.map((u) => [String(u.email), u]));

  return json({
    ok: true,
    people: people.results.map((r) => {
      const u = byEmail.get(r.email);
      return {
        email: r.email,
        name: r.name,
        role: r.role,
        targetGrade: r.target_grade ?? undefined,
        examDate: r.exam_date ?? undefined,
        createdAt: r.created_at,
        lastActiveAt: r.last_active_at ?? undefined,
        exams: Number(r.exams ?? 0),
        lastGrade: r.last_grade ?? undefined,
        lastExamAt: r.last_exam_at ?? undefined,
        globals: Number(r.globals ?? 0),
        globalsDone: Number(r.globals_done ?? 0),
        studied: studied.get(r.email) ?? 0,
        logins: Number(r.logins ?? 0),
        lastLoginAt: r.last_login_at ?? undefined,
        visitDays: Number(r.visit_days ?? 0),
        studyDays: Number(r.study_days ?? 0),
        lastSeenAt: r.last_seen_at ?? undefined,
        ai: u
          ? {
              calls: Number(u.calls ?? 0),
              inputTokens: Number(u.input_tokens ?? 0),
              outputTokens: Number(u.output_tokens ?? 0),
              reasoningTokens: Number(u.reasoning_tokens ?? 0),
            }
          : { calls: 0, inputTokens: 0, outputTokens: 0, reasoningTokens: 0 },
      };
    }),
  });
}

interface Body {
  action?: string;
  email?: string;
  name?: string;
  password?: string;
}

export async function onRequestPost(ctx: Ctx) {
  const db = ctx.env.DB;
  if (!db) return noDb();
  await ensureSchema(db);

  const who = await whoAmI(ctx);
  if (!who) return json({ ok: false, signedIn: false }, 401);
  if (who.role !== "admin") return json({ ok: false, error: "관리자만 할 수 있습니다." }, 403);

  const body = await readJson<Body>(ctx.request);
  if (!body) return json({ ok: false, error: "요청을 읽지 못했습니다." }, 400);

  const email = clean(body.email, 160).toLowerCase();
  if (!email) return json({ ok: false, error: "아이디를 입력해 주세요." }, 400);

  if (body.action === "delete") return remove(db, who.email, email);

  const password = typeof body.password === "string" ? body.password : "";
  if (password.length < 6) return json({ ok: false, error: "비밀번호는 6자 이상이어야 합니다." }, 400);

  if (body.action === "password") {
    const found = await db.prepare(`SELECT email FROM accounts WHERE email = ?1`).bind(email).first();
    if (!found) return json({ ok: false, error: "없는 아이디입니다." }, 404);
    await db
      .prepare(`UPDATE accounts SET pw = ?2 WHERE email = ?1`)
      .bind(email, await hashPassword(password))
      .run();
    // 비밀번호를 바꾸면 쓰던 로그인은 모두 끊는다
    await db.prepare(`DELETE FROM sessions WHERE email = ?1`).bind(email).run();
    return json({ ok: true });
  }

  // 만들기
  const name = clean(body.name, 60);
  if (!name) return json({ ok: false, error: "이름을 입력해 주세요." }, 400);
  const exists = await db.prepare(`SELECT email FROM accounts WHERE email = ?1`).bind(email).first();
  if (exists) return json({ ok: false, error: "이미 있는 아이디입니다." }, 409);
  await db
    .prepare(`INSERT INTO accounts (email, name, pw, role, created_at) VALUES (?1, ?2, ?3, 'learner', ?4)`)
    .bind(email, name, await hashPassword(password), new Date().toISOString())
    .run();
  return json({ ok: true });
}

async function remove(db: D1Database, me: string, email: string) {
  if (email === me) return json({ ok: false, error: "지금 쓰고 있는 계정은 지울 수 없습니다." }, 400);
  await db.batch([
    db.prepare(`DELETE FROM sessions WHERE email = ?1`).bind(email),
    db.prepare(`DELETE FROM user_state WHERE email = ?1`).bind(email),
    db.prepare(`DELETE FROM exam_results WHERE email = ?1`).bind(email),
    db.prepare(`DELETE FROM global_sessions WHERE email = ?1`).bind(email),
    db.prepare(`DELETE FROM ai_usage WHERE email = ?1`).bind(email),
    db.prepare(`DELETE FROM login_events WHERE email = ?1`).bind(email),
    db.prepare(`DELETE FROM activity WHERE email = ?1`).bind(email),
    db.prepare(`DELETE FROM accounts WHERE email = ?1`).bind(email),
  ]);
  return json({ ok: true });
}
