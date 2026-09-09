import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { DeterministicMetrics, FocusArea, LlmFeedback, TargetGrade } from "./types";
import { FOCUS_AREA_KO } from "./types";
import type { Question } from "./exam/repository";
import { TARGET_PROFILE } from "./metrics";

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

const GRADES = ["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"] as const;

export const FeedbackSchema = z.object({
  scores: z.object({
    function: z.number().describe("ACTFL Global Tasks/Functions, 0-5"),
    content: z.number().describe("Context/Content, 0-5"),
    accuracy: z.number().describe("Accuracy/Comprehensibility, 0-5"),
    textType: z.number().describe("Text Type, 0-5"),
  }),
  estimatedGrade: z.enum(["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"]),
  gapToTarget: z.array(z.string()).describe("목표 등급에 도달하기 위해 부족한 점 2~3가지, 한국어 한 줄씩"),
  corrected: z.string().describe("학생 문장을 최소한으로 고친 영어 버전"),
  modelAnswer: z.string().describe("목표 등급 수준에 맞춘 영어 모범답안"),
  keyExpressions: z
    .array(z.object({ en: z.string(), ko: z.string(), why: z.string() }))
    .describe("바로 써먹을 표현 2~3개"),
  improvements: z
    .array(
      z.object({
        area: z.enum(["Fluency", "Vocabulary", "Grammar", "Pronunciation"]),
        original: z.string().describe("학습자가 실제로 말한 문장 그대로"),
        improved: z.string().describe("표현을 바꾼 문장 전체"),
        changed: z.string().describe("improved 안에서 달라진 부분만 그대로 잘라낸 문자열"),
        commentKo: z.string().describe("왜 이렇게 바꿨는지 한국어로"),
      }),
    )
    .describe("표현을 통째로 바꿔 주는 제안 2~3개"),
  tipKo: z.string().describe("이번 답변에 맞춘 한 줄 학습 팁, 한국어"),
  summaryKo: z.string().describe("두 문장 이내 한국어 총평"),

  // ── 채점 결과 화면 ────────────────────────────────────────
  relevance: z
    .object({
      askedFor: z.string().describe("이 문항이 요구한 것을 한국어 한 줄로"),
      actuallySaid: z.string().describe("학습자가 실제로 말한 내용을 한국어 한 줄로"),
      match: z.enum(["on", "partial", "off"]).describe("on=질문에 답함, partial=일부만, off=다른 주제"),
      verdict: z.string().describe("한 줄 판정, 한국어"),
    })
    .describe("질문과 답변이 맞는지 — 가장 먼저 판단할 것"),
  observed: z
    .object({
      from: z.enum(GRADES).describe("이번 답변에서 확인된 범위의 아래쪽 등급"),
      to: z.enum(GRADES).describe("이번 답변에서 확인된 범위의 위쪽 등급"),
      label: z.string().describe('한 마디. 예: "단어 나열", "문장 수준의 발화", "문단 수준의 발화"'),
      note: z.string().describe("그렇게 본 이유 한두 문장, 한국어"),
      gapNote: z.string().describe("목표 등급까지 무엇이 모자란지 한 문장, 한국어"),
    })
    .describe("이번 답변에서 확인된 수준 범위"),
  criteria: z
    .array(
      z.object({
        key: z.enum(["F", "C", "A", "T"]),
        verdict: z.string().describe('짧은 라벨. 예: "질문 미수행", "내용 부족", "오류 있음", "문장 수준"'),
        reason: z.string().describe("그렇게 본 근거 한 줄, 한국어"),
        evidence: z
          .array(
            z.object({
              quote: z.string().describe("학습자가 말한 문장 그대로"),
              issue: z.string().describe("이 문장의 무엇이 문제인지 한국어로"),
              fix: z.string().describe("고친 문장. 주제가 어긋나 고칠 수 없으면 빈 문자열"),
            }),
          )
          .describe("근거가 된 실제 문장 0~2개. 지적할 것이 없으면 빈 배열"),
      }),
    )
    .describe("F, C, A, T 네 준거를 이 순서로 하나씩"),
  oneFix: z
    .object({
      title: z.string().describe("이번에 고칠 한 가지"),
      quote: z.string().describe("학습자가 실제로 말한 문장 그대로 인용"),
      advice: z.string().describe("어떻게 바꿀지 한두 문장, 한국어"),
      unclearQuote: z
        .string()
        .describe("뜻을 확정할 수 없어 손대지 않은 문장. 없으면 빈 문자열"),
    })
    .describe("가장 먼저 고칠 한 가지만"),
  nextFrames: z
    .array(
      z.object({
        label: z.string().describe('예: "특징", "위치", "이유"'),
        frame: z.string().describe('빈칸이 있는 영어 문장 틀. 예: "My room is ___ and ___."'),
      }),
    )
    .describe("다음 답변에 그대로 채워 말할 문장 틀 3개"),
});

export const FEEDBACK_SYSTEM = `당신은 ACTFL 공인 기준으로 OPIc 답변을 평가하는 채점자이자 영어 튜터입니다.
학습자는 한국 대학생이며, 설명은 반드시 한국어로 합니다.

## 0. 무엇보다 먼저 — 질문에 답했는가

채점의 첫 단계는 문법이 아니라 "묻는 것에 답했는가"입니다. 이것을 건너뛰면 채점 전체가 무의미합니다.

문항이 요구한 것과 학습자가 실제로 말한 것을 대조하십시오.
- 방을 묘사하라는 문항에 자기소개와 회사 이야기를 했다면 match 는 "off" 입니다.
- 일부만 답했다면 "partial", 요구한 것을 실제로 했다면 "on" 입니다.

**match 가 "off" 또는 "partial" 이면 다음을 반드시 지키십시오.**
- verdict 에 무엇을 묻고 무엇을 답했는지 정면으로 적습니다.
  예: "방의 모습을 묻는 문항인데 이름과 직장을 소개했습니다. 질문의 주제를 다루지 않았습니다."
- 과업 수행(F) 은 무조건 미수행입니다. 영어가 아무리 유창해도 마찬가지입니다.
- oneFix 는 반드시 "질문에 맞는 주제로 답하기" 여야 합니다.
  문법·어휘를 고치라는 조언을 여기에 쓰지 마십시오.
- **주제가 어긋난 문장을 매끄럽게 다듬어 주지 마십시오.** corrected 는 원문의 문법만 최소한으로
  고치되, evidence 의 fix 는 비워 두고 issue 에 "질문과 다른 주제"라고 적습니다.
  틀린 방향의 문장을 다듬어 주면 학습자는 틀린 방향으로 더 잘 말하게 됩니다.
- modelAnswer 는 학습자가 말한 내용을 확장하지 말고, **문항이 요구한 주제로 새로 씁니다.**

## 1. 수준 판정

observed.from ~ observed.to 로 이번 답변에서 확인된 범위를 말합니다. 한 문항이므로 폭이 있어도 됩니다.
- 단어와 구만 나열 → NL~NM
- 한두 문장을 만들지만 이어지지 않음 → NH~IL
- 문장을 여러 개 이어 말함 → IL~IM2
- 문단을 이루고 근거·비교가 있음 → IM3~IH
- 여러 문단, 추상적 주제, 가정 상황까지 → IH~AL

목표에 못 미친다는 말만 하지 말고 **지금 어디인지** 반드시 말하십시오.
gapNote 에는 목표까지 무엇이 모자란지 한 문장으로 적습니다.

## 2. 네 가지 기준

- F 과업 수행: 문항이 요구한 기능(묘사/습관/경험 서술/질문하기/대안 제시/비교/이슈)을 실제로 했는가
- C 내용·맥락: 다룬 화제의 범위와 구체성
- A 전달력: 문법·어휘·발음이 이해에 미치는 영향
- T 발화 구조: 산출량과 조직 (단어 나열 / 문장 / 문단)

reason 은 학습자의 답변에서 실제로 확인한 것만 씁니다. 일반론을 쓰지 마십시오.

**evidence 가 핵심입니다.** "여러 문법적 오류가 발견되었습니다" 같은 말만 쓰면 학습자는 어디를
고쳐야 할지 모릅니다. 지적한 것이 있으면 그 근거가 된 문장을 quote 에 그대로 옮기고,
issue 에 무엇이 문제인지, fix 에 고친 문장을 적으십시오. 기준마다 최대 2개까지만 넣습니다.
지적할 것이 없으면 빈 배열로 둡니다.

## 3. 등급 판정 원칙

- 모든 준거를 해당 레벨에서 "지속적으로" 수행해야 그 등급을 줍니다. 하나라도 미달이면 아래 등급입니다.
- 발화량·연결어·시제 통제 같은 객관 지표는 이미 계산되어 주어집니다. 그 수치와 모순되는 판정을 하지 마십시오.
- 네 기준을 단순 합산해 등급을 만들지 마십시오.

## 4. 모범답안

- 목표 등급 수준에 "맞춰" 씁니다. IL 목표 학습자에게 AL 수준 답안을 주면 따라 할 수 없어 무용지물입니다.
- match 가 "on" 이면 학습자가 말한 소재를 살려 확장합니다.
- match 가 "off" 이면 학습자의 소재를 버리고 문항이 요구한 주제로 새로 씁니다.
- 화면에서 바로 소리 내어 읽을 수 있는, 자연스러운 구어체 영어로 씁니다.

## 5. 첨삭과 표현 제안

corrected 는 학생의 원래 문장 구조를 유지한 채 최소한만 고칩니다. 다시 쓰지 마십시오.

improvements 는 corrected 와 다릅니다.
- corrected 가 "틀린 것을 고치는 것"이라면, improvements 는 "말은 통하지만 밋밋한 표현을 바꾸는 것"입니다.
- changed 에는 improved 안에서 실제로 달라진 부분만 잘라 넣습니다. improved 안에 그 문자열이 그대로 있어야 합니다.
- 학습자가 고른 집중 교정 영역이 주어지면 그 영역의 제안을 먼저 넣습니다.
- 목표 등급을 넘어서는 표현은 넣지 않습니다.
- match 가 "off" 이면 improvements 를 빈 배열로 두십시오. 주제가 어긋난 문장을 다듬을 이유가 없습니다.

## 6. 알아들을 수 없는 부분

음성 인식이 뭉갠 것으로 보여 뜻을 확정할 수 없는 문장은 **마음대로 고치지 마십시오.**
oneFix.unclearQuote 에 그대로 옮기고, corrected 에서도 손대지 않습니다.
없으면 빈 문자열입니다.

## 7. 분량 (지킬 것)

학습자는 결과를 기다리고 있습니다. 짧게 쓰되 빠뜨리지 마십시오.
- modelAnswer 는 IL~IM 은 5~7문장, IH~AL 은 8~12문장.
- gapToTarget·keyExpressions·improvements·evidence 는 위에 적힌 개수를 넘기지 마십시오.
- 각 문장 설명은 두 문장을 넘기지 마십시오.
- 서론이나 인사말을 쓰지 마십시오.`;


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

/** Claude Sonnet 5 구현체 */
export class ClaudeFeedbackProvider implements FeedbackProvider {
  name = "claude-sonnet-5";
  private client: Anthropic;

  constructor(client = new Anthropic()) {
    this.client = client;
  }

  async generate(input: FeedbackInput): Promise<LlmFeedback> {
    const response = await this.client.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: FEEDBACK_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildFeedbackPrompt(input) }],
      output_config: { format: zodOutputFormat(FeedbackSchema) },
    });
    if (!response.parsed_output) {
      throw new Error("채점 결과를 파싱하지 못했습니다.");
    }
    return response.parsed_output as LlmFeedback;
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
      scores: {
        function: enough ? 3 : 2,
        content: enough ? 3 : 2,
        accuracy: 3,
        textType: metrics.distinctConnectors.length >= p.minConnectors ? 3 : 2,
      },
      estimatedGrade: enough ? "IM2" : "IL",
      gapToTarget: ["(목업 응답) ANTHROPIC_API_KEY 를 설정하면 실제 채점이 동작합니다."],
      corrected: input.transcript || "(발화 없음)",
      modelAnswer:
        "(목업 응답입니다. 환경변수 ANTHROPIC_API_KEY 를 설정하면 Claude Sonnet 5 가 목표 등급에 맞춘 모범답안을 생성합니다.)",
      keyExpressions: [
        { en: "to be honest", ko: "솔직히 말하면", why: "답변 서두를 자연스럽게 여는 표현" },
        { en: "what I like most is", ko: "내가 가장 좋아하는 것은", why: "묘사 문항에서 초점을 잡는 표현" },
      ],
      improvements: [],
      tipKo: "목업 응답입니다. 실제 팁은 AI 채점이 켜져 있을 때 나옵니다.",
      relevance: { askedFor: "-", actuallySaid: "-", match: "partial" as const, verdict: "목업 응답입니다." },
      observed: { from: "IL" as const, to: "IM2" as const, label: "목업", note: "실제 진단은 AI 채점이 켜져 있을 때 나옵니다.", gapNote: "-" },
      criteria: [
        { key: "F" as const, verdict: "판정 안 함", reason: "목업 응답입니다.", evidence: [] },
        { key: "C" as const, verdict: "판정 안 함", reason: "목업 응답입니다.", evidence: [] },
        { key: "A" as const, verdict: "판정 안 함", reason: "목업 응답입니다.", evidence: [] },
        { key: "T" as const, verdict: "판정 안 함", reason: "목업 응답입니다.", evidence: [] },
      ],
      oneFix: { title: "목업", quote: "", advice: "실제 진단은 AI 채점이 켜져 있을 때 나옵니다." },
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
