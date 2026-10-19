"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Flag } from "@/components/global/Flag";
import { COUNTRIES } from "@/lib/global/content";
import { allTemplates, removeTemplate, saveTemplate, startScriptPractice, type ScriptTemplate } from "@/lib/global/templates";

/**
 * 템플릿 — 저장해 둔 회의 스크립트.
 *
 * 같은 회의를 매주 하는 사람이 많다. 한 번 만든 스크립트를 불러와
 * 날짜·수량만 고쳐 다시 쓰거나, 바로 연습한다.
 */
export default function TemplatesPage() {
  return <AppShell>{() => <TemplatesBody />}</AppShell>;
}

function TemplatesBody() {
  const router = useRouter();
  const [list, setList] = useState<ScriptTemplate[] | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; name: string } | null>(null);

  const refresh = () => setList(allTemplates());
  useEffect(refresh, []);

  if (!list) return <p className="py-20 text-center text-sm text-slate-400">불러오는 중…</p>;

  function practice(t: ScriptTemplate) {
    const s = startScriptPractice(t.input, t.script, t.id);
    router.push(`/global/practice/?s=${s.id}`);
  }

  function rename() {
    if (!renaming) return;
    const t = list!.find((x) => x.id === renaming.id);
    if (t) saveTemplate({ id: t.id, name: renaming.name, input: t.input, script: t.script });
    setRenaming(null);
    refresh();
  }

  function drop(t: ScriptTemplate) {
    if (!confirm(`"${t.name}" 템플릿을 지울까요? 되돌릴 수 없습니다.`)) return;
    removeTemplate(t.id);
    refresh();
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-bold tracking-[0.16em] text-dku-500">TEMPLATES</p>
          <h1 className="hero-headline mt-1.5 text-[28px] text-slate-900">템플릿</h1>
          <p className="mt-1 text-[15px] text-slate-500">
            저장해 둔 회의 스크립트입니다. 불러와 고쳐 쓰거나 바로 연습하세요.
          </p>
        </div>
        <Link
          href="/global/script/"
          className="shrink-0 rounded-xl bg-dku-600 px-5 py-3 text-[14px] font-bold text-white transition hover:bg-dku-700"
        >
          ＋ 새 스크립트 만들기
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <p className="text-[17px] font-bold text-slate-800">아직 저장한 템플릿이 없습니다</p>
          <p className="mt-2 text-[14px] text-slate-500">
            스크립트를 만든 뒤 &lsquo;템플릿으로 저장&rsquo;을 누르면 여기에 모입니다.
          </p>
          <Link href="/global/script/" className="mt-5 inline-block text-[14px] font-bold text-dku-600">
            스크립트 만들러 가기 →
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {list.map((t) => {
            const c = COUNTRIES.find((x) => x.code === t.input.counterpart);
            const lines = t.script.opening.length + t.script.body.length + t.script.closing.length;
            return (
              <li key={t.id} className="flex flex-col rounded-2xl border border-slate-200 bg-white px-6 py-5">
                {renaming?.id === t.id ? (
                  <div className="flex gap-2">
                    <input
                      autoFocus
                      value={renaming.name}
                      onChange={(e) => setRenaming({ id: t.id, name: e.target.value })}
                      onKeyDown={(e) => e.key === "Enter" && rename()}
                      aria-label="템플릿 이름"
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[15px] outline-none focus:border-dku-500"
                    />
                    <button type="button" onClick={rename} className="rounded-lg bg-dku-600 px-3 py-2 text-[13px] font-bold text-white">
                      저장
                    </button>
                    <button type="button" onClick={() => setRenaming(null)} className="px-2 text-[13px] text-slate-500">
                      취소
                    </button>
                  </div>
                ) : (
                  <p className="text-[19px] font-bold text-slate-900">{t.name}</p>
                )}

                <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-slate-500">
                  {c && (
                    <span className="flex items-center gap-1.5">
                      <Flag code={c.code} className="h-[11px] w-[16px]" />
                      {c.ko}
                    </span>
                  )}
                  <span>·</span>
                  <span>{[t.input.name, t.input.title, t.input.team].filter(Boolean).join(" ")}</span>
                  <span>·</span>
                  <span>문장 {lines}개 · 질문 {t.script.qa.length}개</span>
                </p>

                {t.script.opening[0] && (
                  <p className="mt-3 line-clamp-2 rounded-lg bg-slate-50 px-3.5 py-2.5 text-[14px] text-slate-700">
                    {t.script.opening[0].en}
                  </p>
                )}

                <p className="mt-3 text-[12px] text-slate-400">마지막 수정 {fmt(t.updatedAt)}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => practice(t)}
                    className="rounded-lg bg-dku-600 px-4 py-2 text-[13px] font-bold text-white transition hover:bg-dku-700"
                  >
                    바로 연습하기
                  </button>
                  <Link
                    href={`/global/script/?t=${t.id}`}
                    className="rounded-lg border border-dku-200 bg-dku-50 px-4 py-2 text-[13px] font-bold text-dku-700 transition hover:bg-dku-100"
                  >
                    열어서 수정
                  </Link>
                  <button
                    type="button"
                    onClick={() => setRenaming({ id: t.id, name: t.name })}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    이름 바꾸기
                  </button>
                  <button
                    type="button"
                    onClick={() => drop(t)}
                    className="ml-auto rounded-lg border border-slate-200 px-3 py-2 text-[13px] font-bold text-red-600 transition hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function fmt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
