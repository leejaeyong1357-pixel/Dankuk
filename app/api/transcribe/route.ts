import { NextResponse } from "next/server";
import { getSttProvider } from "@/lib/stt";
import { computeMetrics } from "@/lib/metrics";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * 모의고사 전용 — 전사와 지표 계산만 한다. LLM 은 부르지 않는다.
 * 시험 중에는 채점을 하지 않고, 종료 후 /api/grade-exam 에서 한 번에 처리한다.
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "오디오가 없습니다." }, { status: 400 });
    }
    const buffer = Buffer.from(await audio.arrayBuffer());
    const transcript = await getSttProvider().transcribe(buffer, audio.type || "audio/webm");
    return NextResponse.json({
      transcript: transcript.text,
      metrics: computeMetrics(transcript),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
