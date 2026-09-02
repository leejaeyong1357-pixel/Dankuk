"use client";

import { LADDER, LEVEL_PROFILE, ladderKeyOf } from "@/lib/actfl";
import type { Grade } from "@/lib/types";

/**
 * 첨부4 — Proficiency Report 등급 사다리.
 * 연습 모드에서 이번 답변의 AI 예상 등급을 사다리 위에 표시한다.
 */
export function ProficiencyLadder({
  grade,
  target,
  compact = false,
}: {
  grade: Grade;
  target?: Grade;
  compact?: boolean;
}) {
  const p = LEVEL_PROFILE[grade];
  const activeKey = ladderKeyOf(grade);
  const targetKey = target ? ladderKeyOf(target) : null;

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-300 bg-white">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <div>
          <h3 className="text-base font-extrabold tracking-tight text-slate-900">
            PROFICIENCY REPORT
          </h3>
          <p className="text-[11px] text-slate-400">AI 예상 등급 · 공식 OPIc 성적이 아닙니다</p>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6 sm:grid-cols-[132px_1fr]">
        {/* 사다리 */}
        <div>
          <div className="grid grid-cols-[34px_1fr] gap-x-2">
            {LADDER.map((row, i) => {
              const active = row.key === activeKey;
              const isTarget = row.key === targetKey && !active;
              const prev = LADDER[i - 1];
              const showScope = !prev || prev.scope !== row.scope;
              return (
                <div key={row.key} className="contents">
                  <div className="flex items-center justify-end pr-1">
                    {showScope && (
                      <span className="text-[10px] font-extrabold text-slate-400">{row.scope}</span>
                    )}
                  </div>
                  <div
                    className={`mb-1 rounded px-3 py-1.5 text-center text-xs font-extrabold transition ${
                      active
                        ? "bg-dku-700 text-white"
                        : isTarget
                          ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                          : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {row.label}
                    {isTarget && <span className="ml-1 text-[9px]">목표</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 설명 */}
        <div>
          <div className="flex items-baseline gap-3">
            <span className="rounded-lg bg-dku-700 px-3 py-1.5 text-xl font-extrabold text-white">
              {grade}
            </span>
            <span className="text-sm font-extrabold uppercase tracking-wide text-slate-700">
              {p.name} Proficiency
            </span>
          </div>
          <p className="mt-3 text-sm font-bold text-slate-800">{p.headlineKo}</p>

          {!compact && (
            <ul className="mt-3 space-y-2">
              {p.highlightsKo.map((h, i) => (
                <li key={i} className="text-sm leading-relaxed text-slate-600">
                  <span className="mr-1.5 text-slate-400">·</span>
                  {h}
                </li>
              ))}
            </ul>
          )}

          {target && targetKey !== activeKey && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-800">
              목표 <strong>{target}</strong> 까지 남은 것:{" "}
              {LEVEL_PROFILE[target].tipsKo[0]}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
