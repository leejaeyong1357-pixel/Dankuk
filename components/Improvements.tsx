"use client";

import type { Improvement } from "@/lib/types";

/**
 * 표현을 통째로 바꿔 주는 제안.
 *
 * 틀린 것을 고치는 첨삭과는 다른 자리다. 말은 통했지만 밋밋한 문장을
 * 실제로 쓰이는 표현으로 바꿔 보여 주고, 왜 그렇게 바꿨는지 붙인다.
 * 바뀐 부분에만 색이 들어가므로 어디가 달라졌는지 바로 보인다.
 */
export function Improvements({ items }: { items: Improvement[] }) {
  if (!items.length) return null;

  return (
    <section className="mt-6">
      <h3 className="text-base font-extrabold text-slate-900">더 나은 표현으로</h3>
      <p className="mt-0.5 text-xs text-slate-400">
        틀린 곳을 고친 것이 아니라, 같은 뜻을 더 자연스럽게 말하는 방법입니다.
      </p>

      <div className="mt-3 space-y-3">
        {items.map((it, i) => (
          <article key={i} className="rounded-xl border border-slate-200 bg-white p-5">
            <span className="rounded-md bg-dku-50 px-2 py-1 text-[11px] font-bold text-dku-700">
              {it.area}
            </span>

            <p className="mt-3 text-[15px] leading-relaxed text-slate-400">{it.original}</p>

            <p className="mt-2 flex gap-2 text-[15px] leading-relaxed text-slate-900">
              <span aria-hidden className="text-dku-600">↳</span>
              <span>{highlight(it.improved, it.changed)}</span>
            </p>

            <div className="mt-3 rounded-lg border-l-4 border-slate-300 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold text-slate-500">왜 이렇게 바꿨나요</p>
              <p className="mt-1 text-sm leading-relaxed text-slate-700">{it.commentKo}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/**
 * 바뀐 부분에만 색을 입힌다.
 *
 * changed 가 improved 안에 그대로 없으면 (모델이 다르게 적어 보낸 경우)
 * 색을 입히지 않고 문장을 그대로 보여 준다. 엉뚱한 곳에 색이 들어가는 것보다 낫다.
 */
function highlight(improved: string, changed: string) {
  const at = changed ? improved.indexOf(changed) : -1;
  if (at < 0) return improved;
  return (
    <>
      {improved.slice(0, at)}
      <mark className="rounded bg-dku-100 px-0.5 font-bold text-dku-800">{changed}</mark>
      {improved.slice(at + changed.length)}
    </>
  );
}
