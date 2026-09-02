"use client";

import { DIFFICULTY_LEVELS, type DifficultyLevel } from "@/lib/exam/question-types";

export const LEVEL_DESCRIPTION: Record<DifficultyLevel, { title: string; desc: string }> = {
  1: { title: "1단계", desc: "단어와 짧은 문장으로 답합니다. 간단한 자기 정보와 사물·장소 묘사 위주." },
  2: { title: "2단계", desc: "문장 단위로 답합니다. 묘사·습관·선호와 간단한 과거 경험." },
  3: { title: "3단계", desc: "문단 수준으로 답합니다. 기억에 남는 경험과 기초 비교, 롤플레이 질문하기." },
  4: { title: "4단계", desc: "상세 묘사와 변화·비교, 롤플레이 문제 해결까지 다룹니다. IM3~IH 목표." },
  5: { title: "5단계", desc: "확장된 서술과 복합 롤플레이, 의견 제시까지 요구됩니다. IH~AL 목표." },
  6: { title: "6단계", desc: "사회적·추상적 주제, 원인과 결과, 장단점, 가정 상황까지 다룹니다. 최고 난이도." },
};

/**
 * 자가평가 난이도 선택.
 * Easy / Normal / Hard 가 아니라 실제 시험처럼 1~6 숫자를 고르게 한다.
 */
export function LevelPicker({
  value,
  onChange,
  recommended,
}: {
  value: DifficultyLevel | null;
  onChange: (v: DifficultyLevel) => void;
  recommended?: DifficultyLevel;
}) {
  return (
    <div className="space-y-2">
      {DIFFICULTY_LEVELS.map((lv) => {
        const d = LEVEL_DESCRIPTION[lv];
        const active = value === lv;
        return (
          <button
            key={lv}
            type="button"
            onClick={() => onChange(lv)}
            className={`flex w-full items-start gap-3.5 rounded-xl border-2 p-4 text-left transition ${
              active ? "border-dku-600 bg-dku-50" : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base font-extrabold ${
                active ? "bg-dku-700 text-white" : "bg-slate-100 text-slate-500"
              }`}
            >
              {lv}
            </span>
            <span className="min-w-0">
              <span className="flex items-center gap-2">
                <span className="text-sm font-extrabold text-slate-900">{d.title}</span>
                {recommended === lv && (
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-700">
                    목표 등급 권장
                  </span>
                )}
              </span>
              <span className="mt-0.5 block text-xs leading-relaxed text-slate-600">{d.desc}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** 학습 모드에서 쓰는 컴팩트한 1~6 선택기 */
export function LevelChips({
  value,
  onChange,
}: {
  value: DifficultyLevel;
  onChange: (v: DifficultyLevel) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-bold text-slate-500">난이도</span>
      <div className="flex gap-1">
        {DIFFICULTY_LEVELS.map((lv) => (
          <button
            key={lv}
            type="button"
            onClick={() => onChange(lv)}
            className={`h-7 w-7 rounded-md text-xs font-extrabold transition ${
              lv === value
                ? "bg-dku-700 text-white"
                : "bg-white text-slate-500 ring-1 ring-slate-200 hover:ring-dku-300"
            }`}
          >
            {lv}
          </button>
        ))}
      </div>
    </div>
  );
}
