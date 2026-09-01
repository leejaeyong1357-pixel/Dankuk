"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import type { GlossaryEntry } from "@/lib/types";

const VOCAB_KEY = "dku-opic:vocab";

export default function Vocab() {
  const [list, setList] = useState<GlossaryEntry[]>([]);

  useEffect(() => {
    const raw = window.localStorage.getItem(VOCAB_KEY);
    setList(raw ? (JSON.parse(raw) as GlossaryEntry[]) : []);
  }, []);

  function remove(en: string) {
    const next = list.filter((x) => x.en !== en);
    setList(next);
    window.localStorage.setItem(VOCAB_KEY, JSON.stringify(next));
  }

  return (
    <AppShell>
      {() => (
        <>
          <h1 className="text-3xl font-extrabold tracking-tight">단어장</h1>
          <p className="mt-1.5 text-sm text-slate-500">
            학습 화면의 사전 패널에서 저장한 단어입니다.
          </p>

          {list.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <p className="text-sm text-slate-400">
                아직 저장한 단어가 없습니다.
                <br />
                학습 화면에서 단어에 마우스를 올린 뒤 &ldquo;＋ 단어장에 저장&rdquo;을 눌러보세요.
              </p>
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              {list.map((w) => (
                <li key={w.en} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div>
                    <p className="text-base font-extrabold text-slate-900">{w.en}</p>
                    <p className="text-sm text-slate-500">{w.ko}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(w.en)}
                    className="rounded-lg px-3 py-1.5 text-xs font-bold text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                  >
                    삭제
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </AppShell>
  );
}
