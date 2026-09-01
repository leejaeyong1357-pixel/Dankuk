"use client";

import type { GlossaryEntry } from "@/lib/types";

export function DictionaryPanel({
  word,
  meaning,
  glossary,
  onSave,
  saved,
}: {
  word: string | null;
  meaning: string | null;
  glossary: GlossaryEntry[];
  onSave: (entry: GlossaryEntry) => void;
  saved: string[];
}) {
  return (
    <aside className="sticky top-24 w-full rounded-2xl border-2 border-dku-500 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold text-dku-700">📖 사전</p>

      {word ? (
        <>
          <p className="mt-3 text-2xl font-extrabold text-dku-700">{word}</p>
          <p className="mt-1 text-base text-slate-800">
            {meaning ?? <span className="text-slate-400">사전에 없는 단어입니다</span>}
          </p>
          {meaning && (
            <button
              type="button"
              onClick={() => onSave({ en: word, ko: meaning })}
              disabled={saved.includes(word)}
              className="mt-3 rounded-lg border border-dku-200 px-3 py-1.5 text-xs font-bold text-dku-700 transition hover:bg-dku-50 disabled:border-slate-200 disabled:text-slate-400"
            >
              {saved.includes(word) ? "단어장에 있음" : "＋ 단어장에 저장"}
            </button>
          )}
        </>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          문제의 단어 위에 마우스를 올려보세요
        </p>
      )}

      <hr className="my-4 border-slate-200" />
      <p className="text-xs font-bold text-slate-500">이 문항의 주요 단어</p>
      <ul className="mt-2 space-y-1.5">
        {glossary.map((g) => (
          <li key={g.en} className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-semibold text-slate-800">{g.en}</span>
            <span className="text-right text-xs text-slate-500">{g.ko}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
