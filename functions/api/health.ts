/**
 * 서버가 살아 있는지, D1 이 붙어 있는지.
 *
 * 화면은 처음 한 번 이것을 물어보고 "서버 있음 / 없음" 을 정한다.
 * 없으면 예전처럼 브라우저 저장소만으로 돈다.
 */
import { ensureSchema, json, type Ctx } from "./_lib";

export async function onRequestGet(ctx: Ctx) {
  const db = ctx.env.DB;
  if (!db) return json({ ok: true, db: false });
  try {
    await ensureSchema(db);
    return json({ ok: true, db: true });
  } catch (e) {
    return json({ ok: false, db: false, error: String(e).slice(0, 200) }, 500);
  }
}
