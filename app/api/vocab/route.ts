import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db/client";
import { currentUser } from "@/lib/auth/session";
import { deleteVocab, listVocab, saveVocab } from "@/lib/db/repository";

export const runtime = "nodejs";

export async function GET() {
  if (!dbEnabled) return NextResponse.json({ dbEnabled: false });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const rows = await listVocab(user.id);
  return NextResponse.json({
    dbEnabled: true, items: rows.map((r) => ({ en: r.en, ko: r.ko })),
  });
}

export async function POST(req: Request) {
  if (!dbEnabled) return NextResponse.json({ dbEnabled: false });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const body = (await req.json()) as { en: string; ko: string; sourceQuestionId?: string };
  await saveVocab(user.id, body.en, body.ko, body.sourceQuestionId);
  return NextResponse.json({ dbEnabled: true, saved: true });
}

export async function DELETE(req: Request) {
  if (!dbEnabled) return NextResponse.json({ dbEnabled: false });
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const en = new URL(req.url).searchParams.get("en");
  if (!en) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  await deleteVocab(user.id, en);
  return NextResponse.json({ dbEnabled: true, deleted: true });
}
