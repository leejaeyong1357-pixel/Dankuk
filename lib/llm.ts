import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { DeterministicMetrics, FocusArea, LlmFeedback, TargetGrade } from "./types";
import { FOCUS_AREA_KO } from "./types";
import type { Question } from "./exam/repository";
import { TARGET_PROFILE } from "./metrics";
import { COACH_SYSTEM, CoachSchema, JUDGE_SYSTEM, JudgeSchema, mergeFeedback } from "./feedback-engine";

/**
 * 채점 LLM 어댑터 (SPEC §4.4).
 *
 * 구현체를 갈아끼울 수 있도록 인터페이스 뒤에 둔다.
 * 학생 음성·전사의 외부 반출이 대학 정책상 막히면
 * 여기만 gpt-oss-120b / GLM-5.2 자체 호스팅 클라이언트로 교체하면 된다.
 */
export interface FeedbackProvider {
  name: string;
  generate(input: FeedbackInput): Promise<LlmFeedback>;
}

/** 프롬프트에 실제로 들어가는 문항 필드만 요구한다 (연습 화면은 축약형을 쓴다) */
export type FeedbackQuestion = Pick<
  Question,
  "questionType" | "topic" | "probeType" | "promptText" | "promptTextKo" | "missionKo"
>;

export interface FeedbackInput {
  question: FeedbackQuestion;
  transcript: string;
  metrics: DeterministicMetrics;
  targetGrade: TargetGrade;
  /** 학습자가 고른 집중 교정 영역. 비어 있으면 네 영역을 고루 본다 */
  focusAreas?: FocusArea[];
}


// 지시문과 스키마는 lib/feedback-engine.ts 에 있다 (판정·코칭 두 갈래).

export function buildFeedbackPrompt(input: FeedbackInput): string {
  const { question, transcript, metrics, targetGrade, focusAreas } = input;
  const p = TARGET_PROFILE[targetGrade];
  return `## 문항
유형: ${question.questionType} / 주제: ${question.topic} / Probe: ${question.probeType}
영어 원문: ${question.promptText}
한글 번역: ${question.promptTextKo}
이 문항의 미션: ${question.missionKo}

## 학습자 목표 등급
${targetGrade} (권장 발화 ${p.minSec}초 이상, ${p.minWords}단어 이상, 연결어 ${p.minConnectors}종 이상)

## 집중 교정 영역
${focusAreas?.length
  ? focusAreas.map((a) => `- ${a}: ${FOCUS_AREA_KO[a]}`).join("\n")
  : "- 지정 없음 (네 영역을 고루 봅니다)"}

## 계산된 객관 지표
- 발화 시간: ${metrics.durationSec}초
- 단어 수: ${metrics.wordCount} (분당 ${metrics.wpm}단어)
- 필러: ${metrics.fillerCount}회 (비율 ${(metrics.fillerRate * 100).toFixed(1)}%)
- 연결어: ${metrics.distinctConnectors.length}종 [${metrics.distinctConnectors.join(", ")}]
- 어휘 다양성(TTR): ${metrics.typeTokenRatio}
- 2초 이상 침묵: ${metrics.pauseOverTwoSec}회 (최장 ${metrics.longestPauseSec}초)
- 과거시제 동사: ${metrics.pastTenseVerbCount}개
- 한국어 발화: ${metrics.koreanSpillover ? `${metrics.koreanSpilloverSec}초 감지됨` : "없음"}

## 학습자 답변 (STT 전사)
${transcript || "(발화 없음)"}

위 자료로 평가와 피드백을 작성하십시오.`;
}

/**
 * 서버(Node) 구현체 — 정적 배포에서는 쓰지 않는다 (lib/llm-browser.ts 가 같은 일을 한다).
 * 판정과 코칭을 나눠 동시에 부르는 방식은 lib/feedback-engine.ts 를 함께 쓴다.
 */
export class ClaudeFeedbackProvider implements FeedbackProvider {
  name = "claude";
  private client: Anthropic;

  constructor(client = new Anthropic()) {
    this.client = client;
  }

  private async ask<S extends z.ZodTypeAny>(system: string, schema: S, prompt: string): Promise<z.infer<S>> {
    const res = await this.client.messages.parse({
      model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
      max_tokens: 8000,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: prompt }],
      output_config: { effort: "low", format: zodOutputFormat(schema) },
    });
    if (!res.parsed_output) throw new Error("채점 결과를 파싱하지 못했습니다.");
    return res.parsed_output as z.infer<S>;
  }

  async generate(input: FeedbackInput): Promise<LlmFeedback> {
    const prompt = buildFeedbackPrompt(input);
    const [judge, coach] = await Promise.allSettled([
      this.ask(JUDGE_SYSTEM, JudgeSchema, prompt),
      this.ask(COACH_SYSTEM, CoachSchema, prompt),
    ]);
    if (judge.status === "rejected") throw judge.reason;
    return mergeFeedback(
      judge.value,
      coach.status === "fulfilled" ? coach.value : null,
      coach.status === "fulfilled" ? "ok" : "failed",
    );
  }
}

/**
 * API 키 없이도 화면을 개발할 수 있도록 하는 목업.
 * 실제 채점이 아니며, 키가 설정되면 자동으로 Claude 구현체가 선택된다.
 */
export class MockFeedbackProvider implements FeedbackProvider {
  name = "mock";
  async generate(input: FeedbackInput): Promise<LlmFeedback> {
    const { metrics, targetGrade } = input;
    const p = TARGET_PROFILE[targetGrade];
    const enough = metrics.wordCount >= p.minWords;
    return {
      estimatedGrade: enough ? "IM2" : "IL",
      gapToTarget: ["(목업 응답) ANTHROPIC_API_KEY 를 설정하면 실제 채점이 동작합니다."],
      corrected: input.transcript || "(발화 없음)",
      modelAnswer: [
        { label: "안내", text: "(목업 응답입니다. ANTHROPIC_API_KEY 를 설정하면 실제 모범답안이 생성됩니다.)" },
      ],
      keyExpressions: [
        { en: "to be honest", ko: "솔직히 말하면", why: "답변 서두를 자연스럽게 여는 표현" },
        { en: "what I like most is", ko: "내가 가장 좋아하는 것은", why: "묘사 문항에서 초점을 잡는 표현" },
      ],
      tipKo: "목업 응답입니다. 실제 팁은 AI 채점이 켜져 있을 때 나옵니다.",
      relevance: { askedFor: "-", actuallySaid: "-", match: "partial" as const, verdict: "목업 응답입니다." },
      observed: { from: "IL" as const, to: "IM2" as const, label: "목업", note: "실제 진단은 AI 채점이 켜져 있을 때 나옵니다.", gapNote: "-" },
      oneFix: { title: "목업", quote: "", advice: "실제 진단은 AI 채점이 켜져 있을 때 나옵니다." },
      coaching: [],
      nativeTouch: [],
      nextFrames: [],
      summaryKo: `목업 채점입니다. 발화 ${metrics.durationSec}초 / ${metrics.wordCount}단어가 계산되었습니다.`,
    };
  }
}

let cached: FeedbackProvider | null = null;

export function getFeedbackProvider(): FeedbackProvider {
  if (cached) return cached;
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  cached = hasKey ? new ClaudeFeedbackProvider() : new MockFeedbackProvider();
  return cached;
}
