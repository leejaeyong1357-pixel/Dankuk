import { NextResponse } from "next/server";
import { getSttProvider } from "@/lib/stt";
import { computeMetrics, gapsFromMetrics } from "@/lib/metrics";
import { getFeedbackProvider } from "@/lib/llm";
import { QUESTION_BY_ID } from "@/lib/exam/repository";
import { dbEnabled } from "@/lib/db/client";
import { logPractice } from "@/lib/db/repository";
import { currentUser } from "@/lib/auth/session";
import type { AnswerFeedback, TargetGrade } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * 답변 채점 파이프라인 (SPEC §4.3).
 *   오디오 -> STT -> 결정적 지표 계산 -> LLM 피드백
 * 지표는 LLM 을 거치지 않으므로 항상 재현된다.
 */
export async function POST(req: Request) {
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

    // 연습 기록을 남긴다. 로그인하지 않았거나 DB 가 없으면 건너뛴다.
    if (dbEnabled) {
      const user = await currentUser();
      if (user) {
        await logPractice({
          userId: user.id,
          questionId,
          transcript: transcript.text,
          metrics,
          feedback: payload.llm,
        }).catch(() => undefined);
      }
    }

    return NextResponse.json({
      ...payload,
      transcript: transcript.text,
      providers: { stt: stt.name, llm: getFeedbackProvider().name },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "알 수 없는 오류";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
