import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ALL_QUESTIONS } from "./exam-engine";
import { TARGET_PROFILE } from "./metrics";
import type { ExamAnswer, ExamGrade, SecondChoice, SelfAssessment, TargetGrade } from "./types";

/**
 * 모의고사 일괄 채점 (SPEC §3).
 *
 * 시험 중에는 LLM 을 부르지 않는다. 종료 후 전체 트랜스크립트를 한 번에 넘겨
 * Sonnet 5 를 1회만 호출한다. 문항별로 부르는 것보다 훨씬 싸고,
 * 답변 전체를 보고 판정하므로 총체적(holistic) 평가라는 ACTFL 원칙에도 맞다.
 */
export interface GradeExamInput {
  answers: ExamAnswer[];
  targetGrade: TargetGrade;
  selfAssessment: SelfAssessment;
  secondChoice: SecondChoice;
}

const ExamGradeSchema = z.object({
  grade: z.enum(["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"]),
  scores: z.object({
    function: z.number(),
    content: z.number(),
    accuracy: z.number(),
    textType: z.number(),
  }),
  summaryKo: z.string().describe("성적표 상단 총평, 3~4문장 한국어"),
  strengths: z.array(z.string()).describe("잘한 점, 한국어"),
  weaknesses: z.array(z.string()).describe("부족한 점, 한국어"),
  weakTypes: z.array(
    z.object({
      fn: z.string().describe("문항 기능값: describe/habit/experience/compare/issue/rp_ask/rp_solve/rp_relate"),
      label: z.string().describe("한국어 유형명"),
      reason: z.string().describe("왜 취약한지"),
    }),
  ).describe("취약 유형 상위 3개까지"),
  perQuestion: z.array(
    z.object({ no: z.number(), comment: z.string().describe("한 문장 한국어 코멘트") }),
  ),
  nextSteps: z.array(z.string()).describe("다음에 무엇을 연습할지, 한국어 실행 항목"),
});

const SYSTEM = `당신은 ACTFL 공인 기준으로 OPIc 시험 전체를 채점하는 채점자입니다.
응시자는 한국 대학생이며, 모든 설명은 한국어로 작성합니다.

평가는 ACTFL 4대 준거로 총체적(holistic)으로 합니다.
- Global Tasks/Functions / Context/Content / Accuracy·Comprehensibility / Text Type

등급 판정 원칙:
- 개별 문항의 최고점이 아니라 시험 전체에서 "지속적으로" 유지된 수준으로 판정합니다.
  한두 문항만 잘하고 나머지가 무너지면 그 등급을 줄 수 없습니다.
- 각 문항의 객관 지표(발화량·연결어·시제·한국어 이탈)가 함께 제공됩니다.
  그 수치와 모순되는 판정을 하지 마십시오.
- 1번 자기소개는 채점에 반영하지 않습니다. 코멘트만 남기십시오.
- 롤플레이(질문하기·대안 제시)를 건너뛰었거나 기능을 수행하지 못했다면 크게 감점합니다.

취약 유형은 응시자가 다음에 무엇을 연습해야 하는지 정하는 데 쓰입니다.
막연한 조언 대신, 어떤 기능 유형에서 무엇이 무너졌는지 구체적으로 지목하십시오.`;

function buildPrompt(input: GradeExamInput): string {
  const { answers, targetGrade, selfAssessment, secondChoice } = input;
  const p = TARGET_PROFILE[targetGrade];
  const choiceKo = { easier: "더 쉬운 질문", similar: "비슷한 질문", harder: "더 어려운 질문" }[secondChoice];

  const blocks = answers.map((a) => {
    const q = ALL_QUESTIONS.find((x) => x.id === a.questionId);
    const m = a.metrics;
    return `### ${a.no}번 ${q ? `[${q.fn} / ${q.topicId}]` : ""}
문항: ${q?.textEn ?? "(알 수 없음)"}
지표: ${m.durationSec}초 · ${m.wordCount}단어 · ${m.wpm}wpm · 연결어 ${m.distinctConnectors.length}종 · 과거시제 ${m.pastTenseVerbCount}개 · 2초+침묵 ${m.pauseOverTwoSec}회${m.koreanSpillover ? ` · 한국어 ${m.koreanSpilloverSec}초` : ""}
답변: ${a.transcript || "(무응답)"}`;
  });

  return `## 응시 정보
자가평가 ${selfAssessment}단계, 2차 난이도 선택: ${choiceKo}
응시자 목표 등급: ${targetGrade} (권장 문항당 ${p.minSec}초 / ${p.minWords}단어 / 연결어 ${p.minConnectors}종)
총 ${answers.length}문항

## 문항별 답변
${blocks.join("\n\n")}

위 자료로 시험 전체를 채점하고 성적표를 작성하십시오.`;
}

export interface ExamGrader {
  name: string;
  grade(input: GradeExamInput): Promise<ExamGrade>;
}

export class ClaudeExamGrader implements ExamGrader {
  name = "claude-sonnet-5";
  constructor(private client = new Anthropic()) {}

  async grade(input: GradeExamInput): Promise<ExamGrade> {
    const res = await this.client.messages.parse({
      model: "claude-sonnet-5",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildPrompt(input) }],
      output_config: { format: zodOutputFormat(ExamGradeSchema) },
    });
    if (!res.parsed_output) throw new Error("채점 결과를 파싱하지 못했습니다.");
    return res.parsed_output as ExamGrade;
  }
}

/** 키가 없을 때의 폴백 — 지표만으로 대략적인 등급을 추정한다 */
export class MetricExamGrader implements ExamGrader {
  name = "mock";
  async grade(input: GradeExamInput): Promise<ExamGrade> {
    const scored = input.answers.filter((a) => a.no > 1);
    const avgWords = scored.length
      ? scored.reduce((s, a) => s + a.metrics.wordCount, 0) / scored.length
      : 0;
    const avgConn = scored.length
      ? scored.reduce((s, a) => s + a.metrics.distinctConnectors.length, 0) / scored.length
      : 0;

    const grade =
      avgWords >= 190 && avgConn >= 9 ? "AL"
      : avgWords >= 150 && avgConn >= 7 ? "IH"
      : avgWords >= 110 ? "IM3"
      : avgWords >= 80 ? "IM2"
      : avgWords >= 45 ? "IL"
      : "NH";

    const band = Math.min(5, Math.max(1, Math.round(avgWords / 40)));
    return {
      grade,
      scores: { function: band, content: band, accuracy: 3, textType: band },
      summaryKo:
        `목업 채점입니다. 문항당 평균 ${Math.round(avgWords)}단어, 연결어 ${avgConn.toFixed(1)}종이 계산되었습니다. ` +
        `실제 등급 판정을 보려면 ANTHROPIC_API_KEY 를 설정하세요.`,
      strengths: [],
      weaknesses: ["(목업) ANTHROPIC_API_KEY 설정 시 Claude Sonnet 5 가 상세 분석을 제공합니다."],
      weakTypes: [],
      perQuestion: scored.map((a) => ({
        no: a.no,
        comment: `${a.metrics.durationSec}초 / ${a.metrics.wordCount}단어`,
      })),
      nextSteps: [],
    };
  }
}

let cached: ExamGrader | null = null;
export function getExamGrader(): ExamGrader {
  if (cached) return cached;
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
  cached = hasKey ? new ClaudeExamGrader() : new MetricExamGrader();
  return cached;
}
