"use client";

import { GRADE_ORDER } from "@/lib/grades";
import type { Grade } from "@/lib/types";

/**
 * 말하기 수준 지도.
 *
 * 답변 하나로 등급을 확정하지 않는다. 목표가 사다리의 어디쯤인지만 보여 주고,
 * 현재 등급은 답변이 쌓인 뒤에 표시한다. 한 문항으로 등급을 찍어 주면
 * 그 숫자를 믿고 연습을 멈추게 된다.
 */
const TONE = [
  "bg-slate-100 text-slate-500",   // NL
  "bg-slate-200 text-slate-600",   // NM
  "bg-emerald-50 text-emerald-700",// NH
  "bg-emerald-100 text-emerald-800",// IL
  "bg-teal-200 text-teal-900",     // IM1
  "bg-sky-300 text-sky-950",       // IM2
  "bg-sky-500 text-white",         // IM3
  "bg-dku-600 text-white",         // IH
  "bg-dku-800 text-white",         // AL
];

export function SpeakingLevelMap({
  target,
  current,
}: {
  target: Grade;
  /** 답변이 쌓여 판정이 된 경우에만 준다 */
  current?: Grade | null;
}) {
  // 위가 높은 등급이 되도록 뒤집는다
  const rows = [...GRADE_ORDER].reverse();

  return (
    <div>
      <p className="text-base font-extrabold text-slate-900">말하기 수준 지도</p>

      <div className="mt-4 space-y-1">
        {rows.map((g) => {
          const i = GRADE_ORDER.indexOf(g);
          // 아래로 갈수록 좁아지는 깔때기
          const width = 100 - (rows.indexOf(g) * 100) / (rows.length + 3);
          const isTarget = g === target;
          const isCurrent = current === g;
          return (
            <div key={g} className="flex items-center justify-center gap-2">
              <div
                style={{ width: `${width}%` }}
                className={`flex items-center justify-center rounded py-1.5 text-sm font-extrabold ${TONE[i]} ${
                  isCurrent ? "ring-2 ring-red-500" : ""
                }`}
              >
                {g}
              </div>
              {isTarget && (
                <span className="shrink-0 rounded-md border border-dku-200 bg-white px-2 py-1 text-[11px] font-bold text-dku-700">
                  목표 {g}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-center text-xs text-slate-400">
        {current ? `현재 예상 등급 ${current}` : "현재 등급은 추가 답변 후 표시"}
      </p>
    </div>
  );
}
