/**
 * 학습 기록 올리기.
 *
 * 브라우저는 화면을 멈추지 않으려고 저장소에 먼저 쓰고, 그 직후 이리로 보낸다.
 * 같은 id 로 다시 오면 덮어쓴다 — 연습 도중 여러 번 올라와도 한 줄만 남는다.
 *
 * 남의 기록을 건드릴 수 없다. 어떤 줄이든 email 은 쿠키가 가리키는 사람으로
 * 고정되며, 본문에 적힌 email 은 쳐다보지 않는다.
 */
import {
  clean,
  ensureSchema,
  json,
  noDb,
  readJson,
  touch,
  whoAmI,
  type Ctx,
  type D1PreparedStatement,
} from "./_lib";

interface Body {
  /** 화면마다 모양이 다른 덩어리 — profile, progress, globalPref 처럼 이름을 붙여 담는다 */
  state?: { ns?: string; data?: unknown }[];
  results?: Record<string, unknown>[];
  globalSessions?: Record<string, unknown>[];
  usage?: Record<string, unknown>[];
  account?: { name?: string; targetGrade?: string; examDate?: string };
}

const MAX_ROWS = 60;

/** 어떤 값이 와도 DB 에 넣을 수 있는 문자열로 만든다 */
function str(v: unknown, max = 80): string | null {
  return typeof v === "string" && v ? v.slice(0, max) : null;
}
function num(v: unknown): number {
  return typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.round(v)) : 0;
}

export async function onRequestPost(ctx: Ctx) {
  const db = ctx.env.DB;
  if (!db) return noDb();
  await ensureSchema(db);

  const who = await whoAmI(ctx);
  if (!who) return json({ ok: false, signedIn: false }, 401);

  const body = await readJson<Body>(ctx.request);
  if (!body) return json({ ok: false, error: "요청을 읽지 못했습니다." }, 400);

  const email = who.email;
  const now = new Date().toISOString();
  const stmts: D1PreparedStatement[] = [];

  for (const s of (body.state ?? []).slice(0, MAX_ROWS)) {
    const ns = clean(s.ns, 40);
    if (!ns || s.data === undefined) continue;
    stmts.push(
      db
        .prepare(
          `INSERT INTO user_state (email, ns, json, updated_at) VALUES (?1, ?2, ?3, ?4)
             ON CONFLICT(email, ns) DO UPDATE SET json = ?3, updated_at = ?4`,
        )
        .bind(email, ns, JSON.stringify(s.data), now),
    );
  }

  for (const r of (body.results ?? []).slice(0, MAX_ROWS)) {
    const id = str(r.examId, 80);
    if (!id) continue;
    const grade = (r.grade ?? {}) as Record<string, unknown>;
    stmts.push(
      db
        .prepare(
          `INSERT INTO exam_results (id, email, created_at, grade, target_grade, json)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)
             ON CONFLICT(id) DO UPDATE SET grade = ?4, target_grade = ?5, json = ?6`,
        )
        .bind(id, email, str(r.takenAt, 40) ?? now, str(grade.level, 10), str(r.targetGrade, 10), JSON.stringify(r)),
    );
  }

  for (const g of (body.globalSessions ?? []).slice(0, MAX_ROWS)) {
    const id = str(g.id, 80);
    if (!id) continue;
    stmts.push(
      db
        .prepare(
          `INSERT INTO global_sessions (id, email, scenario_id, country, kind, lang, started_at, done_at, json)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
             ON CONFLICT(id) DO UPDATE SET done_at = ?8, json = ?9`,
        )
        .bind(
          id,
          email,
          str(g.scenarioId, 40) ?? "",
          str(g.country, 8),
          str(g.kind, 16),
          str(g.lang, 8),
          str(g.startedAt, 40) ?? now,
          str(g.doneAt, 40),
          JSON.stringify(g),
        ),
    );
  }

  for (const u of (body.usage ?? []).slice(0, MAX_ROWS)) {
    const at = str(u.at, 40);
    if (!at) continue;
    // 같은 호출이 두 번 올라와도 한 줄만 남도록 시각과 종류로 id 를 만든다
    const id = `${email}|${at}|${str(u.kind, 20) ?? ""}`;
    stmts.push(
      db
        .prepare(
          `INSERT INTO ai_usage (id, email, at, kind, provider, model, input_tokens, output_tokens, reasoning_tokens)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
             ON CONFLICT(id) DO NOTHING`,
        )
        .bind(
          id,
          email,
          at,
          str(u.kind, 20),
          str(u.provider, 20),
          str(u.model, 60),
          num(u.inputTokens),
          num(u.outputTokens),
          num(u.reasoningTokens),
        ),
    );
  }

  const a = body.account;
  if (a && (a.name || a.targetGrade || a.examDate)) {
    stmts.push(
      db
        .prepare(
          `UPDATE accounts
              SET name = COALESCE(?2, name),
                  target_grade = COALESCE(?3, target_grade),
                  exam_date = COALESCE(?4, exam_date)
            WHERE email = ?1`,
        )
        .bind(email, str(a.name, 60), str(a.targetGrade, 10), str(a.examDate, 20)),
    );
  }

  if (stmts.length) await db.batch(stmts);
  await touch(db, email);
  return json({ ok: true, saved: stmts.length });
}
