"use client";

import { SURVEY_SECTIONS, type SurveyAnswers } from "@/lib/exam/survey";

/** Background Survey — 카드/체크박스 방식 */
export function SurveyForm({
  answers,
  onChange,
}: {
  answers: SurveyAnswers;
  onChange: (next: SurveyAnswers) => void;
}) {
  function toggle(category: keyof SurveyAnswers, label: string, multiple: boolean) {
    const cur = answers[category] ?? [];
    const next = multiple
      ? cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label]
      : [label];
    onChange({ ...answers, [category]: next });
  }

  return (
    <div className="space-y-7">
      {SURVEY_SECTIONS.map((section) => {
        const chosen = answers[section.category] ?? [];
        const short = chosen.length < section.min;
        return (
          <section key={section.category}>
            <div className="flex items-baseline gap-2">
              <h3 className="text-base font-extrabold text-slate-900">{section.title}</h3>
              <span className="text-[11px] font-bold text-slate-400">{section.category}</span>
            </div>
            <p className="mt-1 text-sm text-slate-600">{section.prompt}</p>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {section.items.map((item) => {
                const on = chosen.includes(item.label);
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => toggle(section.category, item.label, section.multiple)}
                    className={`flex items-start gap-2.5 rounded-xl border-2 px-3.5 py-3 text-left transition ${
                      on ? "border-dku-600 bg-dku-50" : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-[10px] font-black text-white ${
                        section.multiple ? "rounded" : "rounded-full"
                      } ${on ? "bg-dku-600" : "bg-slate-200"}`}
                    >
                      {on ? "✓" : ""}
                    </span>
                    <span className="text-sm text-slate-700">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {short && (
              <p className="mt-2 text-xs font-semibold text-amber-600">
                {section.min}개 이상 선택해 주세요 (현재 {chosen.length}개)
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
