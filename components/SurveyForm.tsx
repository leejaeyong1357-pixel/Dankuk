"use client";

import { useRef, useState } from "react";
import { NextButton } from "@/components/ExamChrome";
import {
  PRESET_ANSWERS,
  SURVEY_SECTIONS,
  type SurveyAnswers,
  type SurveyCategory,
} from "@/lib/exam/survey";

/**
 * Background Survey — 실제 시험 화면과 같은 구성.
 *
 * 실제 OPIc 은 설문을 네 개의 Part 로 나누어 한 번에 한 묶음만 보여 주고,
 * 항목은 카드가 아니라 라디오·체크박스 목록으로 제시한다. 여기서 익힌 화면이
 * 시험장에서 그대로 나와야 응시자가 설문에서 시간을 낭비하지 않는다.
 */
const PARTS: { title: string; categories: SurveyCategory[] }[] = [
  { title: "직업 · 학업", categories: ["WORK", "STUDENT", "COURSE"] },
  { title: "거주", categories: ["HOUSING"] },
  { title: "여가 · 취미 · 운동", categories: ["LEISURE", "HOBBY", "SPORTS"] },
  { title: "여행", categories: ["TRAVEL"] },
];

const partOf = (category: SurveyCategory) =>
  PARTS.findIndex((p) => p.categories.includes(category));

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function SurveyForm({
  answers,
  onChange,
  onExit,
  onDone,
}: {
  answers: SurveyAnswers;
  onChange: (next: SurveyAnswers) => void;
  /** Part 1 에서 이전을 누른 경우 */
  onExit: () => void;
  /** 네 Part 를 모두 마친 경우 */
  onDone: () => void;
}) {
  const [part, setPart] = useState(0);
  const [autoFilling, setAutoFilling] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  // 자동 선택 중에는 최신 답안을 state 로 못 읽는다 (setState 는 비동기)
  const draft = useRef(answers);
  draft.current = answers;

  const sections = SURVEY_SECTIONS.filter((s) => PARTS[part].categories.includes(s.category));
  const firstNo = SURVEY_SECTIONS.findIndex((s) => s.category === sections[0].category) + 1;
  const ready = sections.every((s) => (answers[s.category] ?? []).length >= s.min);

  function toggle(category: SurveyCategory, label: string, multiple: boolean) {
    const cur = draft.current[category] ?? [];
    const next = multiple
      ? cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label]
      : [label];
    const merged = { ...draft.current, [category]: next };
    draft.current = merged;
    onChange(merged);
  }

  /**
   * "국롤 조합 적용" — 많이 쓰이는 조합을 순서대로 눌러 준다.
   *
   * 한 번에 값만 바꿔 넣으면 무엇이 왜 선택됐는지 보이지 않는다.
   * 실제로 누르는 것처럼 Part 를 넘기고 스크롤하며 하나씩 고른다.
   * 마지막 "설문 완료"는 누르지 않는다 — 확인하고 본인이 누른다.
   */
  async function autoFill() {
    if (autoFilling) return;
    setAutoFilling(true);
    // 처음부터 다시 채운다
    const cleared = Object.fromEntries(
      SURVEY_SECTIONS.map((s) => [s.category, [] as string[]]),
    ) as SurveyAnswers;
    draft.current = cleared;
    onChange(cleared);
    setPart(0);
    await sleep(400);

    for (const section of SURVEY_SECTIONS) {
      const target = partOf(section.category);
      if (target !== part) {
        setPart(target);
        await sleep(500);
      }
      document
        .getElementById(`survey-${section.category}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      await sleep(450);

      for (const label of PRESET_ANSWERS[section.category]) {
        setCursor(`${section.category}:${label}`);
        await sleep(230);
        toggle(section.category, label, section.multiple);
        await sleep(120);
      }
    }
    setCursor(null);
    setAutoFilling(false);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-300 bg-slate-100 px-5 py-3">
        <h2 className="text-sm font-extrabold text-slate-800">
          Background Survey
          <span className="ml-2 font-semibold text-slate-500">{PARTS[part].title}</span>
        </h2>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => void autoFill()}
            disabled={autoFilling}
            className="rounded-full bg-gradient-to-r from-dku-700 to-dku-500 px-4 py-1.5 text-xs font-extrabold text-white shadow-sm transition hover:brightness-110 disabled:opacity-60"
          >
            {autoFilling ? "선택하는 중…" : "⚡ 국롤 조합 적용!"}
          </button>
          <span className="shrink-0 text-xs font-bold text-slate-600">
            Part {part + 1} of {PARTS.length}
          </span>
        </div>
      </div>

      {autoFilling && (
        <p className="border-b border-dku-100 bg-dku-50 px-5 py-2 text-xs font-semibold text-dku-700">
          많이 쓰이는 조합으로 채우는 중입니다. 다 채운 뒤 확인하고 직접 완료를 눌러 주세요.
        </p>
      )}

      <div className="divide-y divide-slate-200">
        {sections.map((section, si) => {
          const chosen = answers[section.category] ?? [];
          const no = firstNo + si;
          const short = chosen.length < section.min;
          return (
            <div
              key={section.category}
              id={`survey-${section.category}`}
              role="group"
              className="scroll-mt-24 px-5 py-6 sm:px-7"
            >
              <p className="text-sm leading-relaxed text-slate-900">
                <span className="mr-1.5 font-extrabold">{no}.</span>
                {section.prompt}
              </p>

              <div
                className={`mt-4 gap-x-6 gap-y-2.5 ${
                  section.wide ? "grid sm:grid-cols-2" : "space-y-2.5"
                }`}
              >
                {section.items.map((item) => {
                  const on = chosen.includes(item.label);
                  const pointed = cursor === `${section.category}:${item.label}`;
                  return (
                    <label
                      key={item.label}
                      className={`flex cursor-pointer items-start gap-2.5 rounded-md px-1.5 py-1 text-sm text-slate-700 transition-colors ${
                        pointed ? "bg-dku-100 ring-2 ring-dku-400" : ""
                      }`}
                    >
                      <input
                        type={section.multiple ? "checkbox" : "radio"}
                        name={section.category}
                        checked={on}
                        onChange={() => toggle(section.category, item.label, section.multiple)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-dku-700"
                      />
                      <span className={on ? "font-semibold text-slate-900" : undefined}>
                        {item.label}
                      </span>
                    </label>
                  );
                })}
              </div>

              {short && chosen.length > 0 && (
                <p className="mt-3 text-xs font-semibold text-amber-600">
                  {section.min}개 이상 선택해 주세요 (현재 {chosen.length}개)
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between border-t border-slate-300 bg-slate-50 px-5 py-4">
        <button
          type="button"
          onClick={() => (part === 0 ? onExit() : setPart(part - 1))}
          className="rounded-md border border-slate-300 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-100"
        >
          ← 이전
        </button>
        <span className="px-3 text-xs font-semibold text-slate-400">
          {ready ? "" : "모든 문항에 답해 주세요"}
        </span>
        <NextButton
          disabled={!ready || autoFilling}
          onClick={() => (part === PARTS.length - 1 ? onDone() : setPart(part + 1))}
        >
          {part === PARTS.length - 1 ? "설문 완료" : "Next"}
        </NextButton>
      </div>
    </div>
  );
}
