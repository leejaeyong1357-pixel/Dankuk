import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { QUESTION_BY_ID } from "./exam/repository";
import { QUESTION_TYPE_KO, comboLabel } from "./exam/question-types";
import type { DifficultyLevel, DifficultySelection } from "./exam/question-types";
import { TARGET_PROFILE } from "./metrics";
import type { ExamAnswer, ExamGrade, TargetGrade } from "./types";

/**
 * 시험 종료 후 일괄 채점.
 *
 * 시험 중에는 LLM 을 부르지 않는다 (실전 모드에서 첨삭·정답 노출 금지).
 * 종료 후 전체 트랜스크립트를 한 번에 넘겨 Sonnet 5 를 1회만 호출한다.
 * 문항별로 부르는 것보다 싸고, 전체를 보고 판정하므로
 * "모든 준거를 지속적으로 수행" 이라는 ACTFL 원칙에도 맞다.
 */
export interface GradeExamInput {
  answers: ExamAnswer[];
  targetGrade: TargetGrade;
  initialDifficulty: DifficultyLevel;
  secondDifficulty: DifficultyLevel;
  difficultySelection: DifficultySelection;
}

const ExamGradeSchema = z.object({
  grade: z.enum(["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"]),
  scores: z.object({
    function: z.number(), content: z.number(), accuracy: z.number(), textType: z.number(),
  }),
  summaryKo: z.string().describe("리포트 상단 총평, 3~4문장 한국어"),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  weakTypes: z.array(z.object({
    questionType: z.string().describe("Question Type ENUM 값"),
    label: z.string().describe("한국어 유형명"),
    reason: z.string(),
  })).describe("취약 유형 상위 3개까지"),
  perQuestion: z.array(z.object({ no: z.number(), comment: z.string() })),
  nextSteps: z.array(z.string()),
});

const SYSTEM = `당신은 ACTFL 기준으로 OPIc 형식 말하기 시험을 채점하는 채점자입니다.
응시자는 한국 대학생이며, 모든 설명은 한국어로 작성합니다.

평가는 ACTFL 4대 준거로 총체적(holistic)으로 합니다.
Global Tasks/Functions · Context/Content · Accuracy·Comprehensibility · Text Type

등급 판정 원칙:
- 개별 문항의 최고점이 아니라, 시험 전체에서 "지속적으로" 유지된 수준으로 판정합니다.
  한두 문항만 잘하고 나머지가 무너지면 그 등급을 줄 수 없습니다.
- 각 문항에는 Question Type 과 Probe Type 이 붙어 있습니다.
  LEVEL_CHECK 문항은 현재 난이도를 감당하는지, PROBE 문항은 한 단계 위 기능을 수행할 수 있는지를 봅니다.
  PROBE 를 수행했는지가 상위 등급 부여의 근거가 됩니다.
- 발화량·연결어·시제·한국어 이탈 같은 객관 지표는 이미 계산되어 주어집니다.
  그 수치와 모순되는 판정을 하지 마십시오.
- SELF_INTRODUCTION 문항은 워밍업이므로 등급 계산에서 제외하고 코멘트만 남깁니다.
- 롤플레이 문항에서 요구된 기능(질문하기 / 대안 제시 / 유사 경험)을 수행하지 못했다면 크게 감점합니다.

취약 유형은 응시자가 다음에 무엇을 연습할지 정하는 데 쓰입니다.
막연한 조언 대신 어떤 Question Type 에서 무엇이 무너졌는지 지목하십시오.
questionType 필드에는 주어진 ENUM 값을 그대로 넣으십시오.`;

function buildPrompt(input: GradeExamInput): string {
  const { answers, targetGrade, initialDifficulty, secondDifficulty, difficultySelection } = input;
  const p = TARGET_PROFILE[targetGrade];
  const choiceKo = { EASIER: "더 쉬운 질문", SIMILAR: "비슷한 질문", HARDER: "더 어려운 질문" }[difficultySelection];

  const blocks = answers.map((a) => {
    const q = QUESTION_BY_ID.get(a.questionId);
    const m = a.metrics;
    return `### Q${a.no} [${a.questionType}${q ? ` / ${q.probeType} / ${q.topic}` : ""}]${a.isWarmup ? " (워밍업 · 등급 제외)" : ""}
문항: ${q?.promptText ?? "(알 수 없음)"}
지표: ${m.durationSec}초 · ${m.wordCount}단어 · ${m.wpm}wpm · 연결어 ${m.distinctConnectors.length}종 · 과거시제 ${m.pastTenseVerbCount}개 · 2초+침묵 ${m.pauseOverTwoSec}회${m.koreanSpillover ? ` · 한국어 ${m.koreanSpilloverSec}초` : ""}
답변: ${a.transcript || "(무응답)"}`;
  });

  return `## 응시 정보
난이도 ${comboLabel(initialDifficulty, secondDifficulty)} — 초기 ${initialDifficulty}단계, 7번 문항 후 "${choiceKo}" 선택
응시자 목표 등급: ${targetGrade} (권장 문항당 ${p.minSec}초 / ${p.minWords}단어 / 연결어 ${p.minConnectors}종)
총 ${answers.length}문항

## 문항별 답변
${blocks.join("\n\n")}

위 자료로 시험 전체를 채점하고 리포트를 작성하십시오.`;
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

/** 키가 없을 때의 폴백 — 객관 지표만으로 대략적인 등급을 추정한다 */
export class MetricExamGrader implements ExamGrader {
  name = "mock";
  async grade(input: GradeExamInput): Promise<ExamGrade> {
    const scored = input.answers.filter((a) => !a.isWarmup);
    const avg = (f: (a: ExamAnswer) => number) =>
      scored.length ? scored.reduce((s, a) => s + f(a), 0) / scored.length : 0;
    const avgWords = avg((a) => a.metrics.wordCount);
    const avgConn = avg((a) => a.metrics.distinctConnectors.length);

    const grade =
      avgWords >= 190 && avgConn >= 9 ? "AL"
      : avgWords >= 150 && avgConn >= 7 ? "IH"
      : avgWords >= 110 ? "IM3"
      : avgWords >= 80 ? "IM2"
      : avgWords >= 45 ? "IL"
      : "NH";
    const band = Math.min(5, Math.max(1, Math.round(avgWords / 40)));

    // 지표가 가장 나쁜 문항 유형을 취약 유형으로 올린다
    const byType = new Map<string, { total: number; n: number }>();
    for (const a of scored) {
      const cur = byType.get(a.questionType) ?? { total: 0, n: 0 };
      cur.total += a.metrics.wordCount;
      cur.n += 1;
      byType.set(a.questionType, cur);
    }
    const weakTypes = [...byType.entries()]
      .map(([t, v]) => ({ t, avg: v.total / v.n }))
      .sort((a, b) => a.avg - b.avg)
      .slice(0, 3)
      .map(({ t, avg: a }) => ({
        questionType: t,
        label: QUESTION_TYPE_KO[t as keyof typeof QUESTION_TYPE_KO] ?? t,
        reason: `이 유형에서 문항당 평균 ${Math.round(a)}단어로 발화량이 가장 적었습니다.`,
      }));

    return {
      grade,
      scores: { function: band, content: band, accuracy: 3, textType: band },
      summaryKo:
        `AI 예상 등급 산출에 실제 언어 평가가 적용되지 않은 폴백 결과입니다. ` +
        `문항당 평균 ${Math.round(avgWords)}단어, 연결어 ${avgConn.toFixed(1)}종이 계산되었습니다. ` +
        `ANTHROPIC_API_KEY 를 설정하면 Claude Sonnet 5 의 상세 평가가 적용됩니다.`,
      strengths: [],
      weaknesses: ["(폴백) 언어 평가가 적용되지 않았습니다."],
      weakTypes,
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
