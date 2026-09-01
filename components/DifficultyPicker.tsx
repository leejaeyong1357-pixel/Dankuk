"use client";

import { DIFFICULTY_OPTIONS, difficultyLabel, type Difficulty } from "@/lib/difficulty";

/**
 * 난이도 선택기.
 *
 * OPIc 난이도는 하나의 숫자가 아니라 "자가평가 - 2차 선택" 조합이다.
 * 3-3, 4-4, 5-5, 5-6 처럼 표기하므로 학습 화면에서도 같은 표기로 고르게 한다.
 */
export function DifficultyPicker({
  value,
  onChange,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
}) {
  const current = difficultyLabel(value);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold text-slate-500">난이도</span>
      <div className="flex flex-wrap gap-1">
        {DIFFICULTY_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            title={o.hint}
            onClick={() => onChange(o.d)}
            className={`rounded-md px-2.5 py-1 text-xs font-extrabold transition ${
              o.value === current
                ? "bg-dku-700 text-white"
                : "bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-dku-300"
            }`}
          >
            {o.value}
          </button>
        ))}
      </div>
    </div>
  );
}
