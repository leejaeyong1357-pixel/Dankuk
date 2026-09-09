"use client";

/**
 * 연습 모드 피드백 — 브라우저에서 처리한다.
 *
 * 지표는 항상 계산된다 (LLM 없이, 비용 0). 키가 있으면 Claude 첨삭까지 붙고,
 * 없으면 지표에서 도출한 지적만 보여 준다.
 */
import { computeMetrics, gapsFromMetrics } from "./metrics";
import { activeProvider, anthropicKey, openAiKey } from "./ai-provider";
import type { PracticeQuestion } from "./sync";
import type { AnswerFeedback, FocusArea, LlmFeedback, TargetGrade, Transcript } from "./types";

export async function feedbackForAnswer(input: {
  question: PracticeQuestion;
  transcript: Transcript;
  targetGrade: TargetGrade;
  /** 학습자가 고른 집중 교정 영역 */
  focusAreas?: FocusArea[];
}): Promise<AnswerFeedback & { providers: { stt: string; llm: string } }> {
  const metrics = computeMetrics(input.transcript);
  const metricGaps = gapsFromMetrics(metrics, input.targetGrade);

  const provider = activeProvider();
  if (provider !== "metrics") {
    try {
      const args = {
        question: input.question,
        transcript: input.transcript.text,
        metrics,
        targetGrade: input.targetGrade,
        focusAreas: input.focusAreas,
      };
      // SDK 타임아웃이 걸리지 않는 경우(응답이 오다 멈추는 등)까지 막는다.
      // 학습자를 "채점 중"에 무한정 붙잡아 두지 않는 것이 우선이다.
      const llm = await withDeadline(
        22_000,
        provider === "openai"
          ? import("./llm-openai").then((m) =>
              m.feedbackWithOpenAiInBrowser(args, openAiKey()!),
            )
          : import("./llm-browser").then((m) =>
              m.feedbackWithClaudeInBrowser(args, anthropicKey()!),
            ),
      );
      return {
        metrics,
        llm: { ...llm, gapToTarget: [...metricGaps, ...llm.gapToTarget] },
        providers: { stt: "browser", llm: provider },
      };
    } catch (err) {
      console.error("[feedback] AI 피드백 실패, 지표 피드백으로 대체합니다:", err);
      return {
        metrics,
        llm: metricOnlyFeedback(input.transcript.text, metricGaps, true),
        providers: { stt: "browser", llm: "metrics" },
      };
    }
  }

  return {
    metrics,
    llm: metricOnlyFeedback(input.transcript.text, metricGaps),
    providers: { stt: "browser", llm: "metrics" },
  };
}

/**
 * 키 없이 보여 주는 피드백.
 *
 * 첨삭과 모범답안은 LLM 없이 만들 수 없으므로, 지어내지 않고
 * 무엇이 없는지 그대로 말한다. 객관 지표 기반 지적은 그대로 유효하다.
 */
/** 정해진 시간 안에 끝나지 않으면 포기한다 */
function withDeadline<T>(ms: number, work: Promise<T>): Promise<T> {
  return Promise.race([
    work,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`피드백이 ${Math.round(ms / 1000)}초 안에 오지 않았습니다.`)), ms),
    ),
  ]);
}

function metricOnlyFeedback(transcript: string, gaps: string[], failed = false): LlmFeedback {
  return {
    scores: { function: 0, content: 0, accuracy: 0, textType: 0 },
    estimatedGrade: "IM2",
    gapToTarget: gaps.length ? gaps : ["목표 등급 기준을 모두 충족했습니다."],
    corrected: transcript || "(발화 없음)",
    modelAnswer: failed
      ? "AI 채점 서버가 제때 응답하지 않아 지표 기반 결과만 표시합니다. 잠시 후 다시 시도해 주세요. " +
        "아래 발화량·연결어·시제 지적은 AI 없이 계산된 값이라 그대로 참고하셔도 됩니다."
      : "첨삭과 모범답안은 AI 채점이 켜져 있을 때 제공됩니다. " +
        "위의 발화량·연결어·시제 지적은 AI 없이 계산된 값이라 그대로 참고하셔도 됩니다.",
    keyExpressions: [],
    // 표현 교체 제안은 지어낼 수 없다. 없으면 없다고 둔다.
    improvements: [],
    levelLabel: "확인 전",
    levelNote: "AI 채점이 꺼져 있어 발화 수준은 판정하지 않았습니다. 아래 지표는 실제로 계산한 값입니다.",
    taskStatus: "AI 진단 없음",
    taskDone: false,
    criteria: [
      { key: "F" as const, verdict: "판정 안 함", reason: "AI 채점이 켜져 있을 때 진단합니다." },
      { key: "C" as const, verdict: "판정 안 함", reason: "AI 채점이 켜져 있을 때 진단합니다." },
      { key: "A" as const, verdict: "판정 안 함", reason: "AI 채점이 켜져 있을 때 진단합니다." },
      { key: "T" as const, verdict: "판정 안 함", reason: "AI 채점이 켜져 있을 때 진단합니다." },
    ],
    oneFix: {
      title: "발화량부터 채우기",
      quote: transcript.split(/(?<=\.)\s/)[0] ?? transcript,
      advice: "목표 등급 권장 발화 시간과 단어 수를 먼저 채운 뒤 내용을 다듬으세요.",
    },
    nextFrames: [],

    tipKo: failed
      ? "AI 채점이 응답하지 않았습니다. 네트워크를 확인하고 다시 시도해 주세요."
      : "AI 채점이 꺼져 있어 표현 교체 제안은 나오지 않습니다. " +
        "우선 발화 시간과 단어 수를 목표치까지 채우는 연습부터 해 보세요.",
    summaryKo:
      "객관 지표만으로 분석했습니다. 발화 시간·단어 수·연결어·과거시제는 정확한 수치이며, " +
      "문장 첨삭과 모범답안은 AI 채점이 켜져 있을 때 나옵니다.",
  };
}
