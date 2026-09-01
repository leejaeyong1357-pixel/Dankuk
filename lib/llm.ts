import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type {
  DeterministicMetrics, LlmFeedback, Question, TargetGrade,
} from "./types";
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

export interface FeedbackInput {
  question: Question;
  transcript: string;
  metrics: DeterministicMetrics;
  targetGrade: TargetGrade;
}

const FeedbackSchema = z.object({
  scores: z.object({
    function: z.number().describe("ACTFL Global Tasks/Functions, 0-5"),
    content: z.number().describe("Context/Content, 0-5"),
    accuracy: z.number().describe("Accuracy/Comprehensibility, 0-5"),
    textType: z.number().describe("Text Type, 0-5"),
  }),
  estimatedGrade: z.enum(["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"]),
  gapToTarget: z.array(z.string()).describe("목표 등급에 도달하기 위해 부족한 점, 한국어"),
  corrected: z.string().describe("학생 문장을 최소한으로 고친 영어 버전"),
  modelAnswer: z.string().describe("목표 등급 수준에 맞춘 영어 모범답안"),
  keyExpressions: z.array(
    z.object({ en: z.string(), ko: z.string(), why: z.string() }),
  ),
  summaryKo: z.string().describe("두세 문장 한국어 총평"),
});

const SYSTEM = `당신은 ACTFL 공인 기준으로 OPIc 답변을 평가하는 채점자이자 영어 튜터입니다.
학습자는 한국 대학생이며, 설명은 반드시 한국어로 합니다.

평가는 ACTFL 4대 준거로 총체적으로 합니다.
- Global Tasks/Functions: 문항이 요구한 기능(묘사/습관/경험 서술/질문하기/대안 제시/비교/이슈)을 실제로 수행했는가
- Context/Content: 다룬 화제의 범위와 구체성
- Accuracy/Comprehensibility: 문법·어휘·발음이 이해도에 미치는 영향
- Text Type: 산출량과 조직 (문장 나열인가, 문단인가, 다문단인가)

등급 판정 원칙:
- 모든 준거를 해당 레벨에서 "지속적으로" 수행해야 그 등급을 줍니다. 하나라도 미달이면 아래 등급입니다.
- 발화량·연결어·시제 통제 같은 객관 지표는 이미 계산되어 주어집니다. 그 수치와 모순되는 판정을 하지 마십시오.

모범답안 작성 원칙 (중요):
- 목표 등급 수준에 "맞춰" 씁니다. IL 목표 학습자에게 AL 수준 답안을 주면 따라 할 수 없어 무용지물입니다.
- 학습자가 실제로 말한 소재를 살려서 확장하십시오. 완전히 새로운 이야기를 지어내지 마십시오.
- 화면에서 바로 소리 내어 읽을 수 있는, 자연스러운 구어체 영어로 씁니다.

corrected 는 학생의 원래 문장 구조를 유지한 채 최소한만 고칩니다. 다시 쓰지 마십시오.`;

function buildPrompt(input: FeedbackInput): string {
  const { question, transcript, metrics, targetGrade } = input;
  const p = TARGET_PROFILE[targetGrade];
  return `## 문항
유형: ${question.fn} / 주제: ${question.topicId} / 난이도밴드: ${question.band}
영어 원문: ${question.textEn}
한글 번역: ${question.textKo}
이 문항의 미션: ${question.missionKo}

## 학습자 목표 등급
${targetGrade} (권장 발화 ${p.minSec}초 이상, ${p.minWords}단어 이상, 연결어 ${p.minConnectors}종 이상)

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
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildPrompt(input) }],
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
