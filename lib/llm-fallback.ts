"use client";

/**
 * 구조화 출력이 거부될 때의 대비책.
 *
 * 구조화 출력은 스키마를 문법으로 컴파일해서 쓰는데, 그 문법에 크기 한도가 있다.
 * 넘기면 400 "The compiled grammar is too large" 가 돌아오고 채점이 통째로 실패한다.
 * 스키마를 줄여 두었지만 한도가 얼마인지는 공개되어 있지 않고, 앞으로 스키마가
 * 다시 늘어날 수도 있다. 그때 학습자 화면이 빈손이 되는 것이 가장 나쁘다.
 *
 * 그래서 이 경우에만 형식 강제를 포기하고, 스키마를 프롬프트에 적어 JSON 으로
 * 받아 직접 검증한다. 형식 강제가 없으니 틀릴 수 있지만, 틀리면 zod 가 잡아내고
 * 지표 기반 결과로 내려간다 — 아무것도 못 주는 것보다 낫다.
 */
import type Anthropic from "@anthropic-ai/sdk";
import type { z } from "zod";

/** 이 오류일 때만 대비책으로 넘어간다. 다른 400 은 그대로 터뜨린다 */
export function isGrammarTooLarge(err: unknown): boolean {
  const status = (err as { status?: number } | null)?.status;
  const msg = err instanceof Error ? err.message : String(err ?? "");
  return status === 400 && /compiled grammar|grammar is too large/i.test(msg);
}

/** ```json 울타리나 앞뒤 군더더기가 섞여 와도 JSON 본문만 꺼낸다 */
function extractJson(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = (fenced ? fenced[1] : text).trim();
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("응답에서 JSON 을 찾지 못했습니다.");
  return body.slice(start, end + 1);
}

export async function parseViaPromptedJson<T>(opts: {
  client: Anthropic;
  model: string;
  maxTokens: number;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  /** zodOutputFormat(...).schema — 모델에게 보여 줄 스키마 */
  jsonSchema: unknown;
}): Promise<T> {
  const res = await opts.client.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens,
    // 생각을 끄는 설정({type:"disabled"})은 Opus·Sonnet 5.5 에서 400 이 난다.
    // 끄지 않고 강도를 낮춰 짧게 끝내게 한다 (Haiku 5.5 도 같은 방식으로 동작)
    output_config: { effort: "low" },
    system: opts.system,
    messages: [
      {
        role: "user",
        content:
          `${opts.prompt}\n\n` +
          "---\n" +
          "아래 JSON 스키마에 정확히 맞는 **JSON 하나만** 출력하십시오.\n" +
          "설명, 머리말, 코드블록 울타리를 붙이지 마십시오. 모든 키를 빠짐없이 채우십시오.\n\n" +
          JSON.stringify(opts.jsonSchema),
      },
    ],
  });

  const text = res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");

  return opts.schema.parse(JSON.parse(extractJson(text)));
}
