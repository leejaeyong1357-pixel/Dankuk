import { NextResponse } from "next/server";
import { dbEnabled } from "@/lib/db/client";
import { deleteVocab, findUser, listVocab, saveVocab } from "@/lib/db/repository";

export const runtime = "nodejs";

async function userIdOf(email: string | null) {
  if (!email) return null;
  const u = await findUser(email);
  return u?.id ?? null;
}

export async function GET(req: Request) {
  if (!dbEnabled) return NextResponse.json({ dbEnabled: false });
  const userId = await userIdOf(new URL(req.url).searchParams.get("email"));
  if (!userId) return NextResponse.json({ dbEnabled: true, items: [] });
  const rows = await listVocab(userId);
  return NextResponse.json({
    dbEnabled: true,
    items: rows.map((r) => ({ en: r.en, ko: r.ko })),
  });
}

export async function POST(req: Request) {
  if (!dbEnabled) return NextResponse.json({ dbEnabled: false });
  const body = (await req.json()) as {
    email: string; en: string; ko: string; sourceQuestionId?: string;
  };
  const userId = await userIdOf(body.email);
  if (!userId) return NextResponse.json({ error: "사용자 없음" }, { status: 404 });
  await saveVocab(userId, body.en, body.ko, body.sourceQuestionId);
  return NextResponse.json({ dbEnabled: true, saved: true });
}

export async function DELETE(req: Request) {
  if (!dbEnabled) return NextResponse.json({ dbEnabled: false });
  const url = new URL(req.url);
  const userId = await userIdOf(url.searchParams.get("email"));
  const en = url.searchParams.get("en");
  if (!userId || !en) return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  await deleteVocab(userId, en);
  return NextResponse.json({ dbEnabled: true, deleted: true });
}
