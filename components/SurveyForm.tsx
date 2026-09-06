"use client";

import { useState } from "react";
import { NextButton } from "@/components/ExamChrome";
import { SURVEY_SECTIONS, type SurveyAnswers, type SurveyCategory } from "@/lib/exam/survey";

/**
 * Background Survey — 실제 시험 화면과 같은 구성.
 *
 * 실제 OPIc 은 설문을 네 개의 Part 로 나누어 한 번에 한 묶음만 보여 주고,
 * 항목은 카드가 아니라 라디오·체크박스 목록으로 제시한다. 여기서 익힌 화면이
 * 시험장에서 그대로 나와야 응시자가 설문에서 시간을 낭비하지 않는다.
 */
const PARTS: { title: string; categories: SurveyCategory[] }[] = [
  { title: "직업 · 학업", categories: ["WORK", "SCHOOL"] },
  { title: "거주", categories: ["HOUSING"] },
  { title: "여가 · 취미 · 운동", categories: ["LEISURE", "HOBBY", "SPORTS"] },
  { title: "여행", categories: ["TRAVEL"] },
];

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
  const sections = SURVEY_SECTIONS.filter((s) => PARTS[part].categories.includes(s.category));
  // 문항 번호는 Part 가 바뀌어도 이어진다 (실제 시험과 동일)
  const firstNo = SURVEY_SECTIONS.findIndex((s) => s.category === sections[0].category) + 1;
  const ready = sections.every((s) => (answers[s.category] ?? []).length >= s.min);

  function toggle(category: SurveyCategory, label: string, multiple: boolean) {
    const cur = answers[category] ?? [];
    const next = multiple
      ? cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label]
      : [label];
    onChange({ ...answers, [category]: next });
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white">
      <div className="flex items-center justify-between border-b border-slate-300 bg-slate-100 px-5 py-3">
        <h2 className="text-sm font-extrabold text-slate-800">
          Background Survey
          <span className="ml-2 font-semibold text-slate-500">{PARTS[part].title}</span>
        </h2>
        <span className="shrink-0 text-xs font-bold text-slate-600">
          Part {part + 1} of {PARTS.length}
        </span>
      </div>

      <div className="divide-y divide-slate-200">
        {sections.map((section, si) => {
          const chosen = answers[section.category] ?? [];
          const no = firstNo + si;
          const short = chosen.length < section.min;
          return (
            <div key={section.category} role="group" className="px-5 py-6 sm:px-7">
              <p className="text-sm leading-relaxed text-slate-900">
                <span className="mr-1.5 font-extrabold">{no}.</span>
                {section.prompt}
              </p>

              <div className="mt-4 space-y-2.5">
                {section.items.map((item) => {
                  const on = chosen.includes(item.label);
                  return (
                    <label
                      key={item.label}
                      className="flex cursor-pointer items-start gap-2.5 text-sm text-slate-700"
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
          disabled={!ready}
          onClick={() => (part === PARTS.length - 1 ? onDone() : setPart(part + 1))}
        >
          Next
        </NextButton>
      </div>
    </div>
  );
}
