import { NextResponse } from "next/server";
import { getSttProvider } from "@/lib/stt";
import { computeMetrics } from "@/lib/metrics";
import { MAX_AUDIO_BYTES, rateLimited, requireUser, withinRate } from "@/lib/auth/guard";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * 모의고사 전용 — 전사와 지표 계산만 한다. LLM 은 부르지 않는다.
 * 시험 중에는 채점을 하지 않고, 종료 후 /api/grade-exam 에서 한 번에 처리한다.
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  // 한 시험이 15문항이므로 시험 한 회분을 넉넉히 담는 상한이다
  if (!withinRate(`transcribe:${auth.user?.id ?? "local"}`, 40, 10 * 60_000)) {
    return rateLimited();
  }

  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "오디오가 없습니다." }, { status: 400 });
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "오디오가 너무 큽니다." }, { status: 413 });
    }
    const buffer = Buffer.from(await audio.arrayBuffer());
    const transcript = await getSttProvider().transcribe(buffer, audio.type || "audio/webm");
    return NextResponse.json({
      transcript: transcript.text,
      metrics: computeMetrics(transcript),
    });
  } catch (err) {
    // 실패 원인은 서버 로그에만 남긴다. STT 업스트림 응답이 그대로 나가면
    // 내부 주소나 키 관련 메시지가 노출될 수 있다.
    console.error("[transcribe]", err);
    return NextResponse.json({ error: "전사에 실패했습니다." }, { status: 500 });
  }
}
