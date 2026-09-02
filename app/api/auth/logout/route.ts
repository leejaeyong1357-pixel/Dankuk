import { NextResponse } from "next/server";
import { revokeSession } from "@/lib/auth/session";

export const runtime = "nodejs";

export async function POST() {
  await revokeSession();
  return NextResponse.json({ ok: true });
}
