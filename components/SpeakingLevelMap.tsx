"use client";

import { GRADE_ORDER } from "@/lib/grades";
import type { Grade } from "@/lib/types";

/**
 * 말하기 수준 지도.
 *
 * 답변 하나로 등급을 확정하지는 않되, 이번 답변에서 확인된 범위는 표시한다.
 * "목표에 못 미칩니다"라고만 하고 지금 어디인지 알려 주지 않으면
 * 무엇을 해야 할지 알 수 없다. 한 칸이 아니라 범위로 표시해
 * 확정된 등급이 아니라는 것을 형태로도 드러낸다.
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
  from,
  to,
}: {
  target: Grade;
  /** 이번 답변에서 확인된 범위 */
  from?: Grade | null;
  to?: Grade | null;
}) {
  const lo = from ? GRADE_ORDER.indexOf(from) : -1;
  const hi = to ? GRADE_ORDER.indexOf(to) : -1;
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
          // 확인된 범위 전체를 표시한다. 한 칸만 찍으면 확정처럼 보인다
          const inRange = lo >= 0 && hi >= 0 && i >= lo && i <= hi;
          return (
            <div key={g} className="flex items-center justify-center gap-2">
              <div
                style={{ width: `${width}%` }}
                className={`flex items-center justify-center rounded py-1.5 text-sm font-extrabold ${TONE[i]} ${
                  inRange ? "ring-2 ring-red-500 ring-offset-1" : ""
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

      <p className="mt-3 text-center text-xs">
        {lo >= 0 && hi >= 0 ? (
          <span className="font-bold text-red-600">
            이번 답변에서 확인된 범위 {from}
            {from !== to && ` ~ ${to}`}
          </span>
        ) : (
          <span className="text-slate-400">현재 등급은 추가 답변 후 표시</span>
        )}
      </p>
      <p className="mt-1 text-center text-[11px] text-slate-400">
        답변 하나로 등급을 확정하지 않습니다
      </p>
    </div>
  );
}
