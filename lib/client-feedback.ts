"use client";

/**
 * 연습 모드 피드백 — 브라우저에서 처리한다.
 *
 * 지표는 항상 계산된다 (LLM 없이, 비용 0). 키가 있으면 Claude 첨삭까지 붙고,
 * 없으면 지표에서 도출한 지적만 보여 준다.
 */
import { computeMetrics, gapsFromMetrics } from "./metrics";
import { browserApiKey } from "./client-engine";
import type { PracticeQuestion } from "./sync";
import type { AnswerFeedback, LlmFeedback, TargetGrade, Transcript } from "./types";

export async function feedbackForAnswer(input: {
  question: PracticeQuestion;
  transcript: Transcript;
  targetGrade: TargetGrade;
}): Promise<AnswerFeedback & { providers: { stt: string; llm: string } }> {
  const metrics = computeMetrics(input.transcript);
  const metricGaps = gapsFromMetrics(metrics, input.targetGrade);

  const key = browserApiKey();
  if (key) {
    try {
      const { feedbackWithClaudeInBrowser } = await import("./llm-browser");
      const llm = await feedbackWithClaudeInBrowser(
        { question: input.question, transcript: input.transcript.text, metrics, targetGrade: input.targetGrade },
        key,
      );
      return {
        metrics,
        llm: { ...llm, gapToTarget: [...metricGaps, ...llm.gapToTarget] },
        providers: { stt: "browser", llm: "claude" },
      };
    } catch (err) {
      console.error("[feedback] Claude 피드백 실패, 지표 피드백으로 대체합니다:", err);
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
function metricOnlyFeedback(transcript: string, gaps: string[]): LlmFeedback {
  return {
    scores: { function: 0, content: 0, accuracy: 0, textType: 0 },
    estimatedGrade: "IM2",
    gapToTarget: gaps.length ? gaps : ["목표 등급 기준을 모두 충족했습니다."],
    corrected: transcript || "(발화 없음)",
    modelAnswer:
      "첨삭과 모범답안은 AI 채점이 켜져 있을 때 제공됩니다. " +
      "위의 발화량·연결어·시제 지적은 AI 없이 계산된 값이라 그대로 참고하셔도 됩니다.",
    keyExpressions: [],
    summaryKo:
      "객관 지표만으로 분석했습니다. 발화 시간·단어 수·연결어·과거시제는 정확한 수치이며, " +
      "문장 첨삭과 모범답안은 AI 채점이 켜져 있을 때 나옵니다.",
  };
}
