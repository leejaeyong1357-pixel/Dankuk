"use client";

import { FOCUS_AREAS, FOCUS_AREA_KO, type FocusArea } from "@/lib/types";

/**
 * 집중 교정 영역.
 *
 * 네 가지를 한꺼번에 지적하면 무엇부터 고쳐야 할지 알 수 없다.
 * 오늘 볼 것을 골라 두면 AI 가 그 영역을 먼저 짚는다. (여러 개 선택 가능)
 */
export function FocusPicker({
  value,
  onChange,
}: {
  value: FocusArea[];
  onChange: (next: FocusArea[]) => void;
}) {
  function toggle(a: FocusArea) {
    onChange(value.includes(a) ? value.filter((x) => x !== a) : [...value, a]);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-extrabold text-slate-900">집중 교정 영역</p>
      <p className="mt-0.5 text-xs text-slate-400">
        여러 개 고를 수 있습니다. 고르지 않으면 네 영역을 고루 봅니다.
      </p>
      <div className="mt-3 grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {FOCUS_AREAS.map((a) => {
          const on = value.includes(a);
          return (
            <label key={a} className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(a)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-dku-700"
              />
              <span className="min-w-0">
                <span className={`block text-sm ${on ? "font-bold text-slate-900" : "text-slate-700"}`}>
                  {a}
                </span>
                <span className="block text-[11px] leading-snug text-slate-400">
                  {FOCUS_AREA_KO[a]}
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
