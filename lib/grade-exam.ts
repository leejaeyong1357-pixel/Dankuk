import { NATIVE_STYLE_DAILY } from "./native-style";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getQuestionById } from "./exam/repository";
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

export const ExamGradeSchema = z.object({
  grade: z.enum(["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"]),
  scores: z.object({
    function: z.number(), content: z.number(), accuracy: z.number(), textType: z.number(),
  }),
  summaryKo: z.string().describe("총평 2~3문장 한국어"),

  /* 리포트 맨 위 한 줄 — 이번 시험을 한마디로 */
  headline: z
    .string()
    .describe('이번 시험을 한 줄로. 예: "답변의 소재는 있습니다. 이제 문장을 연결하고 비교 기준을 분명히 해보세요."'),
  headlineFocus: z
    .string()
    .describe("headline 안에서 색을 입힐 구절. headline 에 그대로 들어 있는 문자열이어야 함"),

  strengths: z
    .array(z.object({
      no: z.number().describe("근거가 된 문항 번호"),
      title: z.string().describe("무엇을 잘했는지 한 마디"),
      why: z.string().describe("그 발화가 왜 강점인지, 실제 발화를 근거로 한두 문장"),
    }))
    .describe("잘한 점 2~3개. 근거 문항 없이 쓰지 말 것"),

  weaknesses: z
    .array(z.object({
      no: z.number(),
      title: z.string().describe("무엇이 부족했는지 한 마디"),
      why: z.string().describe("질문이 요구한 것과 실제 답변의 차이를 한두 문장으로"),
    }))
    .describe("부족한 점 2~3개"),

  perQuestion: z
    .array(z.object({
      no: z.number(),
      asked: z.string().describe("이 문항이 요구한 것, 한국어 한 줄"),
      said: z.string().describe("실제로 말한 것, 한국어 한 줄. 무응답이면 '무응답'"),
      fix: z.string().describe("무엇을 더하고 빼고 다시 묶을지, 행동 단위로 한 줄"),
      check: z.string().describe("다시 말한 뒤 스스로 확인할 기준 한 줄, 물음표로 끝낼 것"),
    }))
    .describe("출제된 문항 전부를 번호 순서대로. 자료가 없으면 said 에 그대로 적고 판정하지 말 것"),

  typePatterns: z
    .array(z.object({
      title: z.string().describe("반복되는 강점 또는 약점 한 마디"),
      detail: z.string().describe("어떻게 반복되는지 한두 문장"),
      evidence: z.string().describe('근거 문항 번호. 예: "Q2, Q5"'),
    }))
    .describe("여러 문항에서 되풀이된 것만. 한 문항에서만 보인 것은 넣지 말 것"),

  targetShifts: z
    .array(z.object({
      title: z.string().describe('무엇이 달라져야 하는지. 예: "문장 연결"'),
      shift: z.string().describe('지금 → 목표. 예: "개별 문장 → 연결된 설명과 이야기"'),
      detail: z.string().describe("쉬운 말로 한두 문장"),
    }))
    .describe("목표 등급에 닿기 위해 달라져야 할 말하기 3가지"),

  rewrite: z
    .object({
      no: z.number().describe("어느 문항을 다시 말하는지"),
      pattern: z.string().describe('말하는 순서. 예: "두 대상 → 비교 기준 → 차이와 이유"'),
      example: z.string().describe("학습자의 사실관계를 지킨 영어 예시 한두 문장"),
      note: z.string().describe("이 예시가 무엇을 어떻게 바꾼 것인지 한국어 한 줄"),
      added: z
        .string()
        .describe("예시를 만들며 학습자가 말하지 않은 것을 넣었다면 그 부분. 없으면 빈 문자열"),
    })
    .describe("가장 크게 달라질 문항 하나를 골라 바꿔 말하는 본보기"),

  drills: z
    .array(z.object({
      label: z.string().describe('어느 문항·유형인지. 예: "Q5 비교"'),
      task: z.string().describe("오늘 할 짧은 연습 한 줄"),
    }))
    .describe("우선순위 순서대로 3개"),

  recheck: z.string().describe("다시 답한 뒤 무엇을 확인하면 되는지 한 줄"),
});

export const EXAM_GRADE_SYSTEM = `당신은 ACTFL 기준으로 OPIc 형식 말하기 시험을 채점하고,
그 결과를 학습자에게 설명하는 코치입니다. 응시자는 한국인이며 모든 설명은 한국어로 씁니다.

이 리포트는 점수표가 아니라 **코칭 보고서**입니다. 학습자가 읽고 바로 무엇을 할지
알 수 있어야 합니다.

rewrite·drills·fix 처럼 영어 예시를 줄 때는 다음 원칙을 따릅니다.

${NATIVE_STYLE_DAILY}

## 지켜야 할 것 — 어기면 리포트가 쓸모없어집니다

1. **"더 자연스럽게 말하세요" 같은 추상적인 말로 끝내지 마십시오.**
   무엇을 더하고, 무엇을 빼고, 어떤 순서로 다시 묶을지 행동 단위로 적습니다.
   "연결어를 쓰세요"가 아니라 "두 번째 문장 앞에 because 를 넣어 앞 문장과 이유로 묶으세요"입니다.
2. **모든 판단은 실제 답변에 근거합니다.** 학습자가 하지 않은 말을 했다고 쓰지 마십시오.
   근거가 될 발화가 없으면 그 항목은 비워 두십시오.
3. **없는 발화를 만들지 마십시오.** 인용은 주어진 전사 그대로만 씁니다.
4. **수정 예시는 학습자의 사실관계를 지킵니다.** 학습자가 말한 사람·장소·사건을 그대로 쓰고,
   설명을 위해 없는 설정을 넣었다면 rewrite.added 에 그 부분을 적어 예시임을 드러냅니다.
5. **출제되지 않은 유형과 자료가 부족한 항목은 평가하지 마십시오.**
   무응답 문항은 "무응답"이라고만 적고 강점·약점을 지어내지 않습니다.
   한 문항에서만 보인 것을 typePatterns(반복되는 경향)에 넣지 마십시오.

## 등급 판정

ACTFL 4대 준거로 총체적으로 봅니다.
Global Tasks/Functions · Context/Content · Accuracy·Comprehensibility · Text Type

- 개별 문항의 최고점이 아니라 시험 전체에서 "지속적으로" 유지된 수준으로 판정합니다.
  한두 문항만 잘하고 나머지가 무너지면 그 등급을 줄 수 없습니다.
- LEVEL_CHECK 문항은 현재 난이도를 감당하는지, PROBE 문항은 한 단계 위 기능을
  수행할 수 있는지를 봅니다. PROBE 수행 여부가 상위 등급의 근거입니다.
- 발화량·연결어·시제·한국어 이탈 같은 지표는 이미 계산되어 주어집니다.
  그 수치와 모순되는 판정을 하지 마십시오.
- SELF_INTRODUCTION 은 워밍업이므로 등급 계산에서 제외하고 코멘트만 남깁니다.
- 롤플레이에서 요구된 기능(질문하기 / 대안 제시 / 유사 경험)을 수행하지 못했다면 크게 감점합니다.

## 각 칸을 채우는 법

- headline: 이번 시험을 한 줄로. 꾸짖지 말고, 지금 있는 것과 다음에 할 것을 함께 말합니다.
  headlineFocus 에는 그 문장 안에서 가장 중요한 구절을 headline 에 있는 그대로 복사합니다.
- strengths / weaknesses: 반드시 근거 문항 번호(no)를 답니다.
  weaknesses 의 why 는 "질문은 무엇을 요구했는데 실제로는 무엇을 말했다" 꼴로 씁니다.
- perQuestion: 출제된 문항을 번호 순서대로 모두 넣습니다. 빠뜨리지 마십시오.
  asked(요구) → said(실제) → fix(행동) → check(확인 질문) 순으로 읽히게 씁니다.
  check 는 물음표로 끝내 학습자가 스스로 점검할 수 있게 합니다.
- typePatterns: 두 문항 이상에서 되풀이된 것만. 근거 문항 번호를 evidence 에 답니다.
- targetShifts: 목표 등급과 지금 수행의 차이를 쉬운 말로. 등급 이름을 설명하지 말고
  "무엇을 더 할 수 있어야 하는지"로 씁니다.
- rewrite: 가장 크게 달라질 문항 하나를 골라 실제로 바꿔 말해 봅니다.
  pattern 에 말하는 순서를 적고, example 에 영어 예시를 적습니다.
- drills: 오늘 당장 할 수 있는 짧은 연습 3개를 급한 순서대로.
- recheck: 다시 답한 뒤 무엇을 확인하면 되는지 한 줄.`;

export function buildExamGradePrompt(input: GradeExamInput): string {
  const { answers, targetGrade, initialDifficulty, secondDifficulty, difficultySelection } = input;
  const p = TARGET_PROFILE[targetGrade];
  const choiceKo = { EASIER: "더 쉬운 질문", SIMILAR: "비슷한 질문", HARDER: "더 어려운 질문" }[difficultySelection];

  const blocks = answers.map((a) => {
    const q = getQuestionById(a.questionId);
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
      system: [{ type: "text", text: EXAM_GRADE_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: buildExamGradePrompt(input) }],
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
        `AI 언어 평가가 적용되지 않은 폴백 결과입니다. ` +
        `문항당 평균 ${Math.round(avgWords)}단어, 연결어 ${avgConn.toFixed(1)}종이 계산되었습니다.`,
      headline: "AI 채점이 꺼져 있어 발화량만 계산했습니다.",
      headlineFocus: "발화량만 계산",
      // 근거가 될 발화를 읽지 않았으므로 강점·약점을 지어내지 않는다
      strengths: [],
      weaknesses: [],
      perQuestion: scored.map((a) => ({
        no: a.no,
        asked: "AI 채점이 켜져 있을 때 판정합니다.",
        said: a.transcript.trim() ? `${a.metrics.wordCount}단어 발화` : "무응답",
        fix: "AI 채점이 켜져 있을 때 제공됩니다.",
        check: "목표 발화량을 채웠는가?",
      })),
      typePatterns: weakTypes.map((w) => ({
        title: `${w.label} 발화량 부족`,
        detail: w.reason,
        evidence: "지표 기준",
      })),
      targetShifts: [],
      rewrite: { no: 0, pattern: "", example: "", note: "", added: "" },
      drills: weakTypes.slice(0, 3).map((w) => ({
        label: w.label,
        task: "이 유형에서 발화량을 목표치까지 채우는 연습",
      })),
      recheck: "문항당 발화 시간과 단어 수가 목표치에 닿았는가?",
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
