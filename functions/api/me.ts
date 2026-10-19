/**
 * 지금 로그인한 사람과 그 사람의 기록 전부.
 *
 * 화면이 열릴 때 한 번 불러 브라우저 저장소를 서버 값으로 맞춘다.
 * 쓰기는 그때그때 서버로 올라가므로 정본은 언제나 서버다.
 */
import { ensureSchema, json, loadBundle, noDb, visit, whoAmI, type Ctx } from "./_lib";

export async function onRequestGet(ctx: Ctx) {
  const db = ctx.env.DB;
  if (!db) return noDb();
  await ensureSchema(db);

  const who = await whoAmI(ctx);
  if (!who) return json({ ok: false, signedIn: false }, 401);

  const bundle = await loadBundle(db, who.email);
  if (!bundle) return json({ ok: false, signedIn: false }, 401);
  // 관리 화면의 접속 기록 — 실패해도 화면은 열려야 한다
  await visit(db, who.email).catch(() => {});
  return json({ ok: true, signedIn: true, ...bundle });
}
