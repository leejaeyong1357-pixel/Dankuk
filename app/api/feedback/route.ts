import { NextResponse } from "next/server";
import { getSttProvider } from "@/lib/stt";
import { computeMetrics, gapsFromMetrics } from "@/lib/metrics";
import { getFeedbackProvider } from "@/lib/llm";
import { QUESTION_BY_ID } from "@/lib/exam/repository";
import { dbEnabled } from "@/lib/db/client";
import { logPractice } from "@/lib/db/repository";
import { MAX_AUDIO_BYTES, rateLimited, requireUser, withinRate } from "@/lib/auth/guard";
import type { AnswerFeedback, TargetGrade } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * 답변 채점 파이프라인 (SPEC §4.3).
 *   오디오 -> STT -> 결정적 지표 계산 -> LLM 피드백
 * 지표는 LLM 을 거치지 않으므로 항상 재현된다.
 */
export async function POST(req: Request) {
  const auth = await requireUser();
  if ("response" in auth) return auth.response;
  const user = auth.user;
  // STT + LLM 이 함께 붙는 가장 비싼 경로다
  if (!withinRate(`feedback:${user?.id ?? "local"}`, 30, 10 * 60_000)) return rateLimited();

  try {
    const form = await req.formData();
    const audio = form.get("audio");
    const questionId = String(form.get("questionId") ?? "");
    const targetGrade = String(form.get("targetGrade") ?? "IM2") as TargetGrade;


    const question = QUESTION_BY_ID.get(questionId);
    if (!question) {
      return NextResponse.json({ error: "문항을 찾을 수 없습니다." }, { status: 404 });
    }
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "오디오가 없습니다." }, { status: 400 });
    }
    if (audio.size > MAX_AUDIO_BYTES) {
      return NextResponse.json({ error: "오디오가 너무 큽니다." }, { status: 413 });
    }

    const buffer = Buffer.from(await audio.arrayBuffer());
    const stt = getSttProvider();
    const transcript = await stt.transcribe(buffer, audio.type || "audio/webm");

    const metrics = computeMetrics(transcript);

    const llm = await getFeedbackProvider().generate({
      question,
      transcript: transcript.text,
      metrics,
      targetGrade,
    });

    // 지표에서 기계적으로 도출되는 미달 항목을 앞에 붙인다.
    // LLM 이 놓치더라도 객관 수치 기반 지적은 항상 남는다.
    const metricGaps = gapsFromMetrics(metrics, targetGrade);
    const payload: AnswerFeedback = {
      metrics,
      llm: { ...llm, gapToTarget: [...metricGaps, ...llm.gapToTarget] },
    };

    // 연습 기록을 남긴다. DB 가 없는 로컬 모드면 건너뛴다.
    if (dbEnabled && user) {
      await logPractice({
        userId: user.id,
        questionId,
        transcript: transcript.text,
        metrics,
        feedback: payload.llm,
      }).catch(() => undefined);
    }

    return NextResponse.json({
      ...payload,
      transcript: transcript.text,
      providers: { stt: stt.name, llm: getFeedbackProvider().name },
    });
  } catch (err) {
    console.error("[feedback]", err);
    return NextResponse.json({ error: "피드백 생성에 실패했습니다." }, { status: 500 });
  }
}
